/**
 * @file feed.json.ts
 * @description GET /feed.json — JSON Feed 1.1 twin of server/routes/rss.xml.ts
 *   (latest 50 posts, full HTML). Same visibility rule: isListed
 *   (utils/visibility.mjs), applied by getPostsWithContent() and again here. Listed in json-twin's RESERVED set.
 *
 * Divergence from rss.xml: an undated post is kept here (no date_published)
 *   where rss.xml skips it.
 */
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc } from 'date-fns'
import { feedExcerpt, feedHtml, sendFeed } from '~/server/utils/feedHtml'
import { isListed } from '~/utils/visibility.mjs'
import { decodeEntities } from '~/server/utils/decodeEntities'

// JSON Feed 1.1 spec: https://jsonfeed.org/version/1.1

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.baseUrl as string) || 'https://ejfox.com'

  const posts = await getPostsWithContent(50, 0, false)
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

    // Same shared predicate as rss.xml, so the two feeds can't drift.
    if (!isListed(post)) continue
    const isSystemFile =
      slug.startsWith('!') || slug.startsWith('_') || slug === 'index'
    const isSpecialSection =
      slug.includes('drafts/') ||
      slug.includes('robots/') ||
      slug.includes('prompts/')
    const hasPath = slug.includes('/')
    if (isSystemFile || isSpecialSection || !hasPath) continue

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
