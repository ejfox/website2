import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const targetUrl = query.url as string

  if (!targetUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL parameter is required'
    })
  }

  try {
    // Load moderation rules
    const moderationPath = resolve('data/webmention-moderation.json')
    const moderation = JSON.parse(readFileSync(moderationPath, 'utf-8'))

    // Fetch webmentions from webmention.io
    // You'll need to add your domain to the WEBMENTION_IO_TOKEN env variable
    const domain = process.env.WEBMENTION_IO_DOMAIN || 'ejfox.com'
    const token = process.env.WEBMENTION_IO_TOKEN

    let webmentionUrl = `https://webmention.io/api/mentions.json?target=${encodeURIComponent(targetUrl)}`

    if (token) {
      webmentionUrl += `&token=${token}`
    }

    const response = await fetch(webmentionUrl)

    if (!response.ok) {
      console.error('Failed to fetch webmentions:', response.statusText)
      return []
    }

    const data = await response.json()
    let webmentions = data.links || []

    // Apply moderation filters
    webmentions = webmentions.filter((mention) => {
      const url = mention.data?.url || mention.source
      const author = mention.data?.author
      const content = mention.data?.content

      if (!url) return false

      // Check blocked domains
      const domain = new URL(url).hostname
      if (moderation.blockedDomains.includes(domain)) {
        return false
      }

      // Check blocked URLs
      if (moderation.blockedUrls.includes(url)) {
        return false
      }

      // Check allowed domains (if specified, only allow these)
      if (moderation.allowedDomains.length > 0) {
        if (!moderation.allowedDomains.includes(domain)) {
          return false
        }
      }

      // Check spam keywords
      const textContent = content?.text || content?.html || ''
      const hasSpam = moderation.spamKeywords.some((keyword: string) =>
        textContent.toLowerCase().includes(keyword.toLowerCase())
      )
      if (hasSpam) {
        return false
      }

      // Apply moderation rules
      const rules = moderation.moderationRules

      if (rules.blockNoAvatar && !author?.photo) {
        return false
      }

      if (rules.blockNoContent && !content) {
        return false
      }

      if (
        rules.minimumContentLength > 0 &&
        textContent.length < rules.minimumContentLength
      ) {
        return false
      }

      return true
    })

    // Transform to consistent format
    const formattedWebmentions = webmentions.map((mention) => ({
      id: mention.data?.id || mention.id,
      url: mention.data?.url || mention.source,
      published: mention.data?.published || mention.verified_date,
      author: {
        name: mention.data?.author?.name,
        photo: mention.data?.author?.photo,
        url: mention.data?.author?.url
      },
      content: {
        text: mention.data?.content?.text,
        html: mention.data?.content?.html
      },
      'wm-property':
        mention.activity?.type || mention['wm-property'] || 'mention-of',
      title: mention.data?.name
    }))

    // Sort by date, newest first
    formattedWebmentions.sort((a, b) => {
      const dateA = new Date(a.published).getTime()
      const dateB = new Date(b.published).getTime()
      return dateB - dateA
    })

    // Cache for 5 minutes
    setHeader(event, 'Cache-Control', 'max-age=300, s-maxage=300')

    return formattedWebmentions
  } catch (error) {
    console.error('Error processing webmentions:', error)
    return []
  }
})
