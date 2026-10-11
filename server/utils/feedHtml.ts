/**
 * Post HTML → HTML that survives a feed reader.
 *
 * A reader renders an item's HTML with no page around it, so anything that
 * leans on the page breaks:
 *
 * - Root-relative links (`/tag/…`, `/blog/…`) and protocol-relative image
 *   sources (`//host/img.png`) resolve against the reader, not ejfox.com.
 * - Footnote refs are `#user-content-fn-1`, but sanitizing strips the `id`s
 *   they point at, so they go nowhere. They now point at the post itself.
 * - `<iframe>` embeds are dropped by the sanitizer and vanished without a
 *   trace; they become a plain link to what was embedded.
 * - `<video>` was stripped too. It's allowed now, with controls, because
 *   readers that can't play it fall back to the poster/link.
 *
 * Shared by rss.xml and feed.json so the two can't drift.
 */
import { createHash } from 'node:crypto'
import sanitizeHtml from 'sanitize-html'
import { decodeEntities } from './decodeEntities'
import {
  type H3Event,
  getRequestHeader,
  setHeader,
  setResponseStatus,
} from 'h3'

/**
 * Resolve `url` the way a browser on `pageUrl` would. Already-absolute URLs
 * (any scheme, including mailto: and data:) pass through untouched; anything
 * unparseable is returned as-is rather than throwing mid-feed.
 */
export function absoluteUrl(url: string | undefined, pageUrl: string): string {
  if (!url) return url ?? ''
  const trimmed = url.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  try {
    return new URL(trimmed, pageUrl).href
  } catch {
    return trimmed
  }
}

/** youtube.com/embed/ID → youtube.com/watch?v=ID, so the link opens a page. */
function embedToPageUrl(src: string): string {
  const yt = src.match(
    /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/
  )
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`
  const vimeo = src.match(/^https?:\/\/player\.vimeo\.com\/video\/(\d+)/)
  if (vimeo) return `https://vimeo.com/${vimeo[1]}`
  return src
}

// `rb` is in sanitize-html's defaults but isn't HTML5 (the W3C validator
// flags it); dropping the tag keeps its text.
const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags
  .filter((tag) => tag !== 'rb')
  .concat(['img', 'video', 'source'])

export function feedHtml(html: string, pageUrl: string): string {
  const abs = (url: string | undefined) => absoluteUrl(url, pageUrl)

  return sanitizeHtml(html || '', {
    allowedTags: ALLOWED_TAGS,
    // <source> is a void element; without this it gets a stray </source>.
    selfClosing: [...sanitizeHtml.defaults.selfClosing, 'source'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height'],
      video: ['src', 'poster', 'controls', 'width', 'height'],
      source: ['src', 'type'],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href
          ? { ...attribs, href: abs(attribs.href) }
          : attribs,
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: abs(attribs.src) },
      }),
      source: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: abs(attribs.src) },
      }),
      video: (tagName, attribs) => {
        // Screen recordings are often Cloudinary `.gif`s in a <video> tag; a
        // reader can't play a GIF as video, but shows it fine as an image.
        if (/\.gif(?:\?|$)/i.test(attribs.src || '')) {
          return { tagName: 'img', attribs: { src: abs(attribs.src) } }
        }
        const out: Record<string, string> = { ...attribs, controls: '' }
        if (attribs.src) out.src = abs(attribs.src)
        if (attribs.poster) out.poster = abs(attribs.poster)
        return { tagName, attribs: out }
      },
      iframe: (_tagName, attribs) => {
        const href = embedToPageUrl(abs(attribs.src))
        return { tagName: 'a', attribs: { href }, text: `Embedded: ${href}` }
      },
    },
  })
}

/**
 * Tag-free excerpt for an item's <description>. Still HTML-escaped (`&amp;`),
 * because RSS readers treat <description> as HTML; decode it before using it
 * as plain text (JSON Feed `summary`).
 */
export function feedExcerpt(html: string, length = 280): string {
  // Truncate the *decoded* text, then re-escape: slicing the escaped string
  // could cut an entity in half ("&am…"), which is invalid HTML.
  const text = decodeEntities(
    sanitizeHtml(html || '', { allowedTags: [], allowedAttributes: {} })
  )
    .replace(/\s+/g, ' ')
    .trim()
  const cut =
    text.length > length ? `${text.slice(0, length).trimEnd()}…` : text
  return cut.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Send a feed body with an ETag, answering a matching If-None-Match with 304.
 *
 * Readers poll hourly; the blog feed is ~400KB of full-text HTML, so without
 * this every poll re-downloads all of it. The ETag hashes the body *minus*
 * the generation timestamps (lastBuildDate / channel pubDate), which change on
 * every request and would otherwise make every ETag unique.
 */
export function sendFeed(
  event: H3Event,
  body: string,
  contentType: string,
  cacheControl: string
): string {
  const firstItem = body.indexOf('<item>')
  const head = firstItem === -1 ? body : body.slice(0, firstItem)
  const stable =
    head.replace(/<(lastBuildDate|pubDate)>[^<]*<\/\1>/g, '') +
    (firstItem === -1 ? '' : body.slice(firstItem))
  const etag = `W/"${createHash('sha1').update(stable).digest('base64url').slice(0, 27)}"`
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', cacheControl)
  setHeader(event, 'ETag', etag)
  const inm = getRequestHeader(event, 'if-none-match')
  if (inm && inm.split(',').some((t) => t.trim() === etag)) {
    setResponseStatus(event, 304)
    return ''
  }
  return body
}
