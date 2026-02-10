import RSS from 'rss'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc, formatISO } from 'date-fns'

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

function createExcerpt(html: string, length = 280): string {
  const text = sanitizeHtml(html, { allowedTags: [] })
  return text.length > length ? `${text.slice(0, length)}...` : text
}

export default defineEventHandler(async (event) => {
  const { getPostsWithContent } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || 'https://ejfox.com'

  const feed = new RSS({
    title: 'EJ Fox - Week Notes',
    description: 'Weekly notes and reflections from EJ Fox.',
    feed_url: `${siteUrl}/week-notes-rss.xml`,
    site_url: `${siteUrl}/week-notes`,
    image_url: `${siteUrl}/icon.png`,
    language: 'en',
    pubDate: new Date().toUTCString(),
    copyright: `${new Date().getFullYear()} EJ Fox`,
    managingEditor: 'ej@ejfox.com (EJ Fox)',
    webMaster: 'ej@ejfox.com (EJ Fox)',
    ttl: 60,
  })

  const posts = await getPostsWithContent(50, 0, false, false)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = parseISO(a.metadata?.date || a.date || '')
    const dateB = parseISO(b.metadata?.date || b.date || '')
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
    type?: string
  }

  for (const post of sortedPosts) {
    const metadata = (post.metadata || {}) as PostMetadata

    // ONLY include week-notes
    const isWeekNote = metadata.type === 'week-note' || post.slug?.includes('week-notes/')
    if (!isWeekNote) continue

    // Skip drafts
    if (post.draft || metadata.draft) continue

    const parsedContent = post.html || ''
    const html = sanitizeHtml(parsedContent, {
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

    const postDate = parseISO(date)
    const postUrl = `${siteUrl}/blog/${slug}`

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
        { 'atom:updated': formatISO(isValid(postDate) ? postDate : new Date()) },
      ],
    }

    feed.item(feedItem as Parameters<typeof feed.item>[0])
  }

  const isProd = process.env.NODE_ENV === 'production'
  event.node.res.setHeader('content-type', 'application/xml')
  event.node.res.setHeader(
    'cache-control',
    isProd ? 'max-age=3600, s-maxage=7200' : 'max-age=0, s-maxage=0'
  )

  return feed.xml({ indent: true })
})
