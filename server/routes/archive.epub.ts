/**
 * @file archive.epub.ts
 * @description The whole blog as a single EPUB 3, for offline reading on
 *   e-ink. Always current — built from the same data the site serves.
 * @endpoint GET /archive.epub
 *
 * ## Why a route and not a build script
 *
 * Generating this at build time would mean committing a multi-megabyte binary
 * and reimplementing the visibility rules in a .mjs script that can't import
 * the TypeScript ones. Both are bad: a stale artifact, and a FIFTH independent
 * copy of "which posts are public".
 *
 * That second point is the whole design. Every content leak this codebase has
 * had came from a new reader of manifest-lite that filtered slightly
 * differently from the others. So this route does not filter at all — it calls
 * `getPostsWithContent()`, which applies `isExcludedFromListings` (hidden,
 * unlisted, password-protected, scheduled) and drops drafts. Sealed posts never
 * reach it because they're omitted from manifest-lite at write time.
 *
 * If a new visibility flag is ever added, this file inherits it for free. That
 * is worth more than the request-time cost, which the cache absorbs anyway.
 */
import { defineEventHandler, setHeaders } from 'h3'
import NodeCache from 'node-cache'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { buildEpub, type EpubChapter } from '~/server/utils/epub'

// An hour matches /api/photo-posts and /api/suggest. The book is a snapshot of
// an archive that changes a few times a week; a stale hour is invisible, and
// rebuilding ~250 posts per request is not.
const cache = new NodeCache({ stdTTL: 3600, maxKeys: 4 })
const CACHE_KEY = 'archive-epub'

/**
 * Strip everything an e-reader can't render or shouldn't be asked to.
 *
 * The site's HTML carries Tailwind classes, lazy-loading attributes, inline
 * shiki colours and interactive components — all meaningless in an EPUB, and
 * some of it actively harmful (a `srcset` pointing at responsive variants a
 * reader will try to resolve offline). Allow-list, not deny-list: the next
 * component someone adds should be dropped by default, not shipped broken.
 */
function toEbookHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'em',
      'strong',
      'i',
      'b',
      'br',
      'hr',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'sup',
      'sub',
      'span',
      'div',
    ],
    allowedAttributes: {
      a: ['href'],
      img: ['src', 'alt'],
      // Footnote plumbing — the only classes worth keeping.
      span: ['id'],
      div: ['id'],
      li: ['id'],
    },
    // Absolute URLs only: a relative href is unresolvable on a plane.
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || ''
        return {
          tagName,
          attribs: href.startsWith('/')
            ? { href: `https://ejfox.com${href}` }
            : href
              ? { href }
              : {},
        }
      },
      // Remote images stay remote: embedding every image from 250 posts would
      // produce a file too large to sideload comfortably. The photo book
      // (/photos.epub) is the one that embeds, because there the images ARE
      // the content.
      img: (tagName, attribs) => ({
        tagName,
        attribs: { src: attribs.src || '', alt: attribs.alt || '' },
      }),
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  })
}

export default defineEventHandler(async (event) => {
  const cached = cache.get<Buffer>(CACHE_KEY)
  if (cached) {
    setHeaders(event, {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': 'attachment; filename="ejfox-archive.epub"',
      'Cache-Control': 'public, max-age=3600',
      'X-Epub-Cache': 'hit',
    })
    return cached
  }

  const { getPostsWithContent } = useProcessedMarkdown()
  // Signature is (limit, offset, includeDrafts, includeWeekNotes) — NOT a pair
  // of booleans. Passing booleans here silently slices to zero posts and ships
  // an empty book, which is exactly the kind of failure nobody notices until
  // someone downloads it.
  //
  // The large limit is "all of them": getAllPosts has already filtered, and
  // there is no paging concept in a book.
  const posts = await getPostsWithContent(100000, 0, false, false)

  const chapters: EpubChapter[] = posts
    .filter((p: Record<string, unknown>) => p?.html || p?.content)
    .map((p: Record<string, unknown>) => {
      const meta = (p.metadata || {}) as Record<string, unknown>
      const slug = String(p.slug || meta.slug || '')
      const raw = String(p.html || p.content || '')
      const date = String(meta.date || p.date || '')
      return {
        title: String(meta.title || p.title || slug || 'Untitled'),
        html: toEbookHtml(raw),
        date: date ? new Date(date).toISOString().slice(0, 10) : undefined,
        sourceUrl: slug ? `https://ejfox.com/blog/${slug}` : undefined,
      }
    })
    // Oldest first: a book reads forward through time, unlike a feed.
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const epub = await buildEpub({
    title: 'EJ Fox — Blog Archive',
    author: 'EJ Fox',
    // Date-stamped so a re-download is treated as a new edition rather than
    // silently merged with the copy already on the device.
    identifier: `urn:ejfox:archive:${new Date().toISOString().slice(0, 10)}`,
    description: `${chapters.length} posts from ejfox.com`,
    chapters,
  })

  cache.set(CACHE_KEY, epub)
  setHeaders(event, {
    'Content-Type': 'application/epub+zip',
    'Content-Disposition': 'attachment; filename="ejfox-archive.epub"',
    'Cache-Control': 'public, max-age=3600',
    'X-Epub-Cache': 'miss',
    'X-Epub-Chapters': String(chapters.length),
  })
  return epub
})
