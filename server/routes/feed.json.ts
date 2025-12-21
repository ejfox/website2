import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc } from 'date-fns'
import { defineEventHandler, useRuntimeConfig } from '#imports'

// JSON Feed 1.1 spec: https://jsonfeed.org/version/1.1

function createExcerpt(html: string, length = 280): string {
  const text = sanitizeHtml(html, { allowedTags: [] })
  return text.length > length ? `${text.slice(0, length)}...` : text
}

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || 'https://ejfox.com'

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
    const html = sanitizeHtml(post.html || '', {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title'],
      },
    })

    const title = post.title || metadata.title || 'No title'
    const slug = post.slug || metadata.slug
    const date = post.date || metadata.date || ''
    const description = post.dek || metadata.dek || metadata.description || ''
    const tags = post.tags || metadata.tags || []

    if (!slug) continue

    const isDraft = post.draft || metadata.draft
    const isHidden = post.hidden || metadata.hidden
    const isSystemFile =
      slug.startsWith('!') || slug.startsWith('_') || slug === 'index'
    const isSpecialSection =
      slug.includes('drafts/') ||
      slug.includes('robots/') ||
      slug.includes('prompts/')
    const hasPath = slug.includes('/')

    if (isDraft || isHidden || isSystemFile || isSpecialSection || !hasPath)
      continue

    const postDate = parseISO(date)
    const postUrl = `${siteUrl}/blog/${slug}`

    items.push({
      id: postUrl,
      url: postUrl,
      title,
      content_html: html,
      summary: description || createExcerpt(html),
      date_published: isValid(postDate) ? postDate.toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'EJ Fox',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
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
  event.node.res.setHeader('content-type', 'application/feed+json')
  event.node.res.setHeader(
    'cache-control',
    isProd ? 'max-age=3600, s-maxage=7200' : 'max-age=0, s-maxage=0'
  )

  return feed
})
