import RSS from 'rss'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc } from 'date-fns'
import { feedExcerpt, feedHtml, sendFeed } from '~/server/utils/feedHtml'
import { isHiddenFromListings, isScheduled } from '~/utils/postFilters'

// RSS item type
interface RSSCustomElement {
  [key: string]: string | { _cdata: string }
}

interface RSSItemOptions {
  title: string
  description: string
  url: string
  guid: string
  categories?: string[]
  author?: string
  date?: Date | string
  custom_elements?: RSSCustomElement[]
}

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.baseUrl as string) || 'https://ejfox.com'

  // Initialize RSS feed with enhanced metadata
  const feed = new RSS({
    title: 'EJ Fox',
    description:
      'Hacker-journalist using code and art to uncover hidden patterns.',
    feed_url: `${siteUrl}/rss.xml`,
    site_url: siteUrl,
    image_url: `${siteUrl}/icon.png`,
    language: 'en',
    pubDate: new Date().toUTCString(),
    copyright: `${new Date().getFullYear()} EJ Fox`,
    managingEditor: 'ej@ejfox.com (EJ Fox)',
    webMaster: 'ej@ejfox.com (EJ Fox)',
    ttl: 60,
  })

  // Get all published posts WITH FULL CONTENT and sort by date (newest first)
  // Use getPostsWithContent to fetch full HTML for each post
  const posts = await getPostsWithContent(50, 0, false)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = parseISO(a.metadata?.date || a.date || '')
    const dateB = parseISO(b.metadata?.date || b.date || '')

    // If either date is invalid, push it to the end
    if (!isValid(dateA)) return 1
    if (!isValid(dateB)) return -1

    return compareDesc(dateA, dateB)
  })

  interface PostMetadata {
    title?: string
    slug?: string
    date?: string
    dek?: string
    description?: string
    tags?: string[]
    draft?: boolean
    hidden?: boolean
    unlisted?: boolean
    password?: string
    passwordHash?: string
    type?: string
  }

  // Add items to feed
  for (const post of sortedPosts) {
    const metadata = (post.metadata || {}) as PostMetadata

    // Title and slug can be at root level or in metadata
    const title = post.title || metadata.title || 'No title'
    const slug = post.slug || metadata.slug
    const date = post.date || metadata.date || ''
    const description = post.dek || metadata.dek || metadata.description || ''
    const tags = post.tags || metadata.tags || []

    // Skip posts without a valid slug
    if (!slug) continue

    // Visibility flags (draft/hidden/unlisted/password/sealed) and embargo
    // come from the one shared predicate, so this feed can't drift from the
    // others again. The rest are feed-shape rules.
    if (isHiddenFromListings(post) || isScheduled(post)) continue
    const isSystemFile =
      slug.startsWith('!') || slug.startsWith('_') || slug === 'index'
    const isSpecialSection =
      slug.includes('drafts/') ||
      slug.includes('robots/') ||
      slug.includes('prompts/')
    // Only include posts with paths (e.g., 2025/post-name)
    const hasPath = slug.includes('/')
    if (isSystemFile || isSpecialSection || !hasPath) continue

    const postDate = parseISO(date)
    // An undated item would otherwise be stamped "now" on every request and
    // resurface as new in readers each hour. getAllPosts() already backfills
    // missing dates, so this is a belt-and-braces skip, not a common path.
    if (!isValid(postDate)) continue

    const postUrl = `${siteUrl}/blog/${slug}`
    // Absolute links/images, working footnotes, embeds kept as links.
    const html = feedHtml(post.html || '', postUrl)

    const feedItem: RSSItemOptions = {
      title,
      description: description || feedExcerpt(html),
      url: postUrl,
      guid: postUrl,
      categories: tags,
      author: 'EJ Fox',
      date: postDate,
      custom_elements: [{ 'content:encoded': { _cdata: html } }],
    }

    feed.item(feedItem as Parameters<typeof feed.item>[0])
  }

  const isProd = process.env.NODE_ENV === 'production'
  return sendFeed(
    event,
    feed.xml({ indent: true }),
    'application/xml; charset=utf-8',
    isProd ? 'public, max-age=3600, s-maxage=7200' : 'max-age=0, s-maxage=0'
  )
})
