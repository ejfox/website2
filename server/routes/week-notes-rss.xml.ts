import RSS from 'rss'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { parseISO, isValid, compareDesc, formatISO, parse } from 'date-fns'

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

/**
 * The date a week note covers, derived from its `YYYY-WW` slug.
 *
 * Seven of the 86 week notes carry no date in frontmatter, and the composable's
 * getValidDate() substitutes *now* for a missing one — so they sorted to the top
 * of the feed as if published today and were stamped with today's pubDate. For a
 * week note the slug is the authoritative chronology, so fall back to it.
 */
function weekNoteDate(slug: string | undefined): Date | null {
  const match = slug?.match(/(\d{4})-(\d{2})$/)
  if (!match) return null
  const parsed = parse(`${match[1]}-${match[2]}`, 'RRRR-II', new Date())
  return isValid(parsed) ? parsed : null
}

/**
 * The date to sort and stamp a week note with.
 *
 * Prefers the slug's week over the frontmatter date, because by the time a post
 * reaches here getValidDate() has already replaced any missing date with `now` —
 * indistinguishable from a real one. For dated notes the two agree anyway
 * (2026-03 carries 2026-01-12, which is exactly the Monday of ISO week 3).
 */
function resolveDate(post: {
  slug?: string
  date?: string
  metadata?: { date?: string }
}): Date | null {
  const fromSlug = weekNoteDate(post.slug)
  if (fromSlug) return fromSlug
  const raw = post.metadata?.date || post.date
  if (raw) {
    const parsed = parseISO(raw)
    if (isValid(parsed)) return parsed
  }
  return null
}

export default defineEventHandler(async (event) => {
  const { getWeekNotes, getPostBySlug } = useProcessedMarkdown()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.baseUrl as string) || 'https://ejfox.com'

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

  // getWeekNotes already narrows to week-notes and drops hidden/unlisted/
  // password-protected posts, so take the newest 50 of those and only then
  // pay for the full HTML. Filtering a mixed batch after the fact truncated
  // this feed to whatever week notes happened to fall in the window.
  // Sort explicitly on resolveDate rather than trusting the composable's order,
  // which puts undated notes first (see resolveDate). Ordering decides the
  // .slice(0, 50), so getting it wrong drops genuinely recent notes.
  const weekNotes = (await getWeekNotes())
    .sort((a, b) => {
      const dateA = resolveDate(a)
      const dateB = resolveDate(b)
      if (!dateA) return 1
      if (!dateB) return -1
      return compareDesc(dateA, dateB)
    })
    .slice(0, 50)
  const sortedPosts = await Promise.all(
    weekNotes.map(async (post) => {
      try {
        return { ...post, ...(await getPostBySlug(post.slug)) }
      } catch (error) {
        console.error(
          `Error fetching content for week note ${post.slug}:`,
          error
        )
        return post
      }
    })
  )

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
    const resolved = resolveDate(post)
    const description = post.dek || metadata.dek || metadata.description || ''
    const tags = post.tags || metadata.tags || []

    if (!slug) continue

    const postDate = resolved ?? new Date()
    const postUrl = `${siteUrl}/blog/${slug}`

    const feedItem: RSSItemOptions = {
      title,
      description: description || createExcerpt(html),
      url: postUrl,
      guid: postUrl,
      categories: tags,
      author: 'EJ Fox',
      date: postDate,
      custom_elements: [
        { 'content:encoded': { _cdata: html } },
        {
          'atom:updated': formatISO(postDate),
        },
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
