/**
 * @file epubImages.ts
 * @description Rewrites sanitised chapter HTML so every <img> is embedded in
 *   the EPUB as a 1-bit line halftone (see halftone.ts), wrapped in a uniform
 *   `<figure class="ht">` with a caption.
 *
 * Runs AFTER sanitize-html, on its normalised output (double-quoted, escaped
 * attributes; <figure>/<figcaption> carry no attributes), which is what makes
 * a string pass safe here. sanitize-html's transformTags is synchronous, and
 * fetching images is not — hence a post-pass rather than a transform.
 *
 * Image failures never fail the book: the image is dropped and its caption
 * (or alt text) stays behind as a small caption, so the reader still knows
 * something was there.
 *
 * Only importer: server/routes/archive.epub.ts (photos.epub builds its own
 * figures). Every http(s) <img> in the book is fetched server-side.
 */
import { halftoneImage, halftoneKey, mapLimit } from './halftone'
import type { EpubImage } from './epub'

/** Small, so ~200 Cloudinary fetches don't hammer the CDN or the 1 GB box. */
const CONCURRENCY = 4

const attr = (tag: string, name: string): string =>
  (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1] || ''

/** Undo sanitize-html's attribute escaping to get the URL to fetch. */
const unescapeAttr = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')

const IMG_RE = /<img\b[^>]*>/g

/** The URL to fetch for an img tag: protocol-relative and site-relative made absolute. */
function srcOf(tag: string): string {
  const src = unescapeAttr(attr(tag, 'src')).trim()
  if (src.startsWith('//')) return `https:${src}`
  if (src.startsWith('/')) return `https://ejfox.com${src}`
  return src
}

export interface EmbedResult {
  htmls: string[]
  images: EpubImage[]
  /** <img> tags seen, unique sources, and sources that failed. */
  stats: { imgTags: number; unique: number; failed: number }
}

/**
 * `<figure class="ht">` for an embedded image, a caption-only figure for a
 * failed one (or nothing, if there's no text to keep). `alt`/`captionHtml`
 * arrive already escaped by sanitize-html.
 */
function figure(path: string | null, alt: string, captionHtml: string): string {
  const cap = captionHtml.trim() || alt
  const figcaption = cap ? `<figcaption>${cap}</figcaption>` : ''
  if (!path)
    return cap ? `<figure class="ht ht-missing">${figcaption}</figure>` : ''
  return `<figure class="ht"><img src="${path}" alt="${alt}"/>${figcaption}</figure>`
}

export async function embedHalftones(htmls: string[]): Promise<EmbedResult> {
  // 1. Every unique source across the book, fetched + screened once.
  const srcs = new Set<string>()
  let imgTags = 0
  for (const html of htmls) {
    for (const m of html.matchAll(IMG_RE)) {
      imgTags++
      const src = srcOf(m[0])
      if (/^https?:\/\//.test(src)) srcs.add(src)
    }
  }
  const list = [...srcs]
  const pngs = await mapLimit(list, CONCURRENCY, (src) => halftoneImage(src))

  const pathFor = new Map<string, string | null>()
  const images: EpubImage[] = []
  const seen = new Set<string>()
  let failed = 0
  list.forEach((src, i) => {
    const data = pngs[i]
    if (!data) {
      failed++
      pathFor.set(src, null)
      return
    }
    const path = `images/${halftoneKey(src).slice(0, 16)}.png`
    pathFor.set(src, path)
    if (!seen.has(path)) {
      seen.add(path)
      images.push({ path, data, mediaType: 'image/png' })
    }
  })
  const resolve = (tag: string) => pathFor.get(srcOf(tag)) ?? null

  // 2. Rewrite each chapter.
  const out = htmls.map((html) => {
    // Finished figures are parked behind Private Use Area placeholders (U+E000)
    // so the later <p>/<img> passes can't rewrite them a second time.
    const held: string[] = []
    const hold = (s: string) => `\uE000${held.push(s) - 1}\uE000`

    // An image that links somewhere (usually its own full-size original) is
    // useless as a link offline, and a figure can't live inside an <a>.
    html = html.replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/g, '$1')

    // Existing figures: keep their caption, replace the envelope, so we never
    // nest a figure in a figure or print the caption twice.
    html = html.replace(
      /<figure>([\s\S]*?)<\/figure>/g,
      (whole, inner: string) => {
        const imgs = inner.match(IMG_RE)
        if (!imgs) return whole
        const caption =
          (inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || ''
        return hold(
          imgs
            .map((tag, i) =>
              figure(
                resolve(tag),
                attr(tag, 'alt'),
                i === imgs.length - 1 ? caption : ''
              )
            )
            .join('')
        )
      }
    )

    // A paragraph holding only images: unwrap it (a figure in a <p> is
    // invalid XHTML, and strict readers drop the whole paragraph).
    html = html.replace(/<p>\s*((?:<img\b[^>]*>\s*)+)<\/p>/g, '$1')

    html = html.replace(IMG_RE, (tag) =>
      figure(resolve(tag), attr(tag, 'alt'), '')
    )
    return html.replace(/\uE000(\d+)\uE000/g, (_, i) => held[Number(i)])
  })

  return { htmls: out, images, stats: { imgTags, unique: list.length, failed } }
}
