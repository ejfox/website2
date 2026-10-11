import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc } from 'date-fns'
import { feedExcerpt, feedHtml, sendFeed } from '~/server/utils/feedHtml'
import { decodeEntities } from '~/server/utils/decodeEntities'

// JSON Feed 1.1 spec: https://jsonfeed.org/version/1.1

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.baseUrl as string) || 'https://ejfox.com'

  const posts = await getPostsWithContent(50, 0, false, false)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = parseISO(a.metadata?.date || a.date || '')
    const dateB = parseISO(b.metadata?.date || b.date || '')
    if (!isValid(dateA)) return 1
    if (!isValid(dateB)) return -1
    return compareDesc(dateA, dateB)
  })

  const items = []

  for (const post of sortedPosts) {
    const metadata = (post.metadata || {}) as Record<string, any>

    const title = post.title || metadata.title || 'No title'
    const slug = post.slug || metadata.slug
    const date = post.date || metadata.date || ''
    const description = post.dek || metadata.dek || metadata.description || ''
    const tags = post.tags || metadata.tags || []

    if (!slug) continue

    const isDraft = post.draft || metadata.draft
    const isHidden = post.hidden || metadata.hidden
    const isUnlisted = post.unlisted || metadata.unlisted
    const hasPassword = !!(
      post.password ||
      post.passwordHash ||
      metadata.password ||
      metadata.passwordHash
    )
    const isSystemFile =
      slug.startsWith('!') || slug.startsWith('_') || slug === 'index'
    const isSpecialSection =
      slug.includes('drafts/') ||
      slug.includes('robots/') ||
      slug.includes('prompts/')
    const hasPath = slug.includes('/')

    if (
      isDraft ||
      isHidden ||
      isUnlisted ||
      hasPassword ||
      isSystemFile ||
      isSpecialSection ||
      !hasPath
    )
      continue

    const postDate = parseISO(date)
    const postUrl = `${siteUrl}/blog/${slug}`
    // Absolute links/images, working footnotes, embeds kept as links.
    const html = feedHtml(post.html || '', postUrl)

    items.push({
      id: postUrl,
      url: postUrl,
      title,
      content_html: html,
      // JSON Feed summary is plain text, so undo the HTML escaping.
      summary: description || decodeEntities(feedExcerpt(html)),
      date_published: isValid(postDate) ? postDate.toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'EJ Fox',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    icon: `${siteUrl}/icon.png`,
    description:
      'Hacker-journalist using code and art to uncover hidden patterns.',
    authors: [
      {
        name: 'EJ Fox',
        url: siteUrl,
      },
    ],
    language: 'en',
    items,
  }

  const isProd = process.env.NODE_ENV === 'production'
  return sendFeed(
    event,
    JSON.stringify(feed),
    'application/feed+json; charset=utf-8',
    isProd ? 'public, max-age=3600, s-maxage=7200' : 'max-age=0, s-maxage=0'
  )
})
