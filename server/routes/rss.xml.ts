import RSS from 'rss'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc, formatISO } from 'date-fns'

// Add type declaration for RSS module
declare module 'rss' {
  export interface ItemOptions {
    title: string
    description: string
    url: string
    guid: string
    categories?: string[]
    author?: string
    date?: Date
    custom_elements?: any[]
  }
}

// Helper to create a short excerpt
function createExcerpt(html: string, length = 280): string {
  // Remove HTML tags and get plain text
  const text = sanitizeHtml(html, { allowedTags: [] })
  // Truncate to length and add ellipsis if needed
  return text.length > length ? `${text.slice(0, length)}...` : text
}

export default defineEventHandler(async (event) => {
  const { getAllPosts } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://ejfox.com'

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
    ttl: 60
  })

  // Get all published posts and sort by date (newest first)
  const posts = await getAllPosts(false, false)
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
    const metadata = post.metadata || post
    const parsedContent = post.html || ''
    const html = sanitizeHtml(parsedContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title']
      }
    })

    const postDate = parseISO(metadata.date || '')
    const postUrl = `${siteUrl}/blog/${metadata.slug}`

    // Create feed item with enhanced metadata
    const feedItem: RSS.ItemOptions = {
      title: metadata.title || '',
      description: metadata.description || metadata.dek || createExcerpt(html),
      url: postUrl,
      guid: postUrl,
      categories: metadata.tags || [],
      author: 'EJ Fox',
      date: isValid(postDate) ? postDate : new Date(),
      custom_elements: [
        { 'content:encoded': { _cdata: html } },
        { 'atom:updated': formatISO(isValid(postDate) ? postDate : new Date()) }
      ]
    }

    feed.item(feedItem)
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
