import RSS from 'rss'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc, formatISO } from 'date-fns'

// RSS item type
interface RSSItemOptions {
  title: string
  description: string
  url: string
  guid: string
  categories?: string[]
  author?: string
  date?: Date | string
  custom_elements?: any[]
}

// Helper to create a short excerpt
function createExcerpt(html: string, length = 280): string {
  // Remove HTML tags and get plain text
  const text = sanitizeHtml(html, { allowedTags: [] })
  // Truncate to length and add ellipsis if needed
  return text.length > length ? `${text.slice(0, length)}...` : text
}

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || 'https://ejfox.com'

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
  const posts = await getPostsWithContent(50, 0, false, false)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = parseISO(a.metadata?.date || a.date || '')
    const dateB = parseISO(b.metadata?.date || b.date || '')

    // If either date is invalid, push it to the end
    if (!isValid(dateA)) return 1
    if (!isValid(dateB)) return -1

    return compareDesc(dateA, dateB)
  })

  // Add items to feed
  for (const post of sortedPosts) {
    const metadata = post.metadata || {}
    const parsedContent = post.html || ''
    const html = sanitizeHtml(parsedContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title'],
      },
    })

    // Title and slug can be at root level or in metadata
    const title = post.title || metadata.title || 'No title'
    const slug = post.slug || metadata.slug
    const date = post.date || metadata.date || ''
    const description = post.dek || metadata.dek || metadata.description || ''
    const tags = post.tags || metadata.tags || []

    // Skip posts without a valid slug
    if (!slug) continue

    // Skip drafts, hidden posts, and system files
    const isDraft = post.draft || metadata.draft
    const isHidden = post.hidden || metadata.hidden
    const isSystemFile =
      slug.startsWith('!') || slug.startsWith('_') || slug === 'index'
    const isSpecialSection =
      slug.includes('drafts/') ||
      slug.includes('robots/') ||
      slug.includes('prompts/')
    // Only include posts with paths (e.g., 2025/post-name)
    const hasPath = slug.includes('/')
    if (isDraft || isHidden || isSystemFile || isSpecialSection || !hasPath)
      continue

    const postDate = parseISO(date)
    const postUrl = `${siteUrl}/blog/${slug}`

    // Create feed item with enhanced metadata
    const feedItem: RSSItemOptions = {
      title,
      description: description || createExcerpt(html),
      url: postUrl,
      guid: postUrl,
      categories: tags,
      author: 'EJ Fox',
      date: isValid(postDate) ? postDate : new Date(),
      custom_elements: [
        { 'content:encoded': { _cdata: html } },
        {
          'atom:updated': formatISO(isValid(postDate) ? postDate : new Date()),
        },
      ],
    }

    feed.item(feedItem as any)
  }

  // Set response headers with longer cache for production
  const isProd = process.env.NODE_ENV === 'production'
  event.node.res.setHeader('content-type', 'application/xml')
  event.node.res.setHeader(
    'cache-control',
    isProd ? 'max-age=3600, s-maxage=7200' : 'max-age=0, s-maxage=0'
  )

  return feed.xml({ indent: true })
})
