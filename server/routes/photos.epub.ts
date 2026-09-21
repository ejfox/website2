/**
 * @file photos.epub.ts
 * @description The photo blog as an EPUB with images EMBEDDED, so it reads on
 *   a plane. Always current — built from the same Cloudinary data /photos uses.
 * @endpoint GET /photos.epub
 *
 * Unlike /archive.epub, which leaves images remote, this one downloads and
 * embeds every frame: in a photo book the images ARE the content, and a book
 * that renders as a column of broken-image icons offline is worthless.
 *
 * That makes size the governing constraint. Cloudinary does the work — each
 * photo is fetched already resized and re-encoded, so the server never holds a
 * full-resolution original and never needs an image library.
 */
import { defineEventHandler, setHeaders, getRequestURL, createError } from 'h3'
import NodeCache from 'node-cache'
import {
  buildEpub,
  type EpubChapter,
  type EpubImage,
} from '~/server/utils/epub'

// Longer than the blog's hour: the photo set changes rarely and each rebuild
// costs ~N image fetches.
const cache = new NodeCache({ stdTTL: 21600, maxKeys: 2 })
const CACHE_KEY = 'photos-epub'

/** Hard ceiling so one runaway response can't OOM a 1GB pm2 process. */
const MAX_PHOTOS = 300

/**
 * Cloudinary transform for e-ink:
 *   c_limit,w_1600  — cap the long edge; e-ink panels are ~1400px at best, and
 *                     the extra pixels are pure file size
 *   q_auto:good     — perceptual quality, roughly halves bytes vs q_100
 *   f_jpg           — NOT f_auto. f_auto negotiates WebP/AVIF from the
 *                     User-Agent, and EPUB readers that don't support them
 *                     fail silently with a blank frame rather than an error.
 */
const EINK_TRANSFORM = 'c_limit,w_1600,q_auto:good,f_jpg'

function transformed(url: string): string {
  const marker = '/image/upload/'
  const at = url.indexOf(marker)
  if (at === -1) return url
  const head = url.slice(0, at + marker.length)
  // Strip transforms already baked in, so ours isn't applied on top of a
  // smaller one (which would upscale a downscale — softer AND heavier).
  const segs = url.slice(at + marker.length).split('/')
  const isTransform = (s: string) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return `${head}${EINK_TRANSFORM}/${segs.slice(i).join('/')}`
}

interface Photo {
  secure_url?: string
  url?: string
  public_id?: string
  context?: { alt?: string; caption?: string }
  created_at?: string
  width?: number
  height?: number
}

export default defineEventHandler(async (event) => {
  const cached = cache.get<Buffer>(CACHE_KEY)
  if (cached) {
    setHeaders(event, {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': 'attachment; filename="ejfox-photos.epub"',
      'Cache-Control': 'public, max-age=21600',
      'X-Epub-Cache': 'hit',
    })
    return cached
  }

  const raw = await $fetch<Photo[] | { photos?: Photo[]; resources?: Photo[] }>(
    '/api/photos',
    { baseURL: getRequestURL(event).origin }
  ).catch(() => null)

  const photos: Photo[] = Array.isArray(raw)
    ? raw
    : raw?.photos || raw?.resources || []

  if (!photos.length) {
    throw createError({
      statusCode: 503,
      message: 'Photo source unavailable',
    })
  }

  const chapters: EpubChapter[] = []
  const images: EpubImage[] = []

  // Sequential, not Promise.all: 300 concurrent image fetches would hammer
  // Cloudinary and spike memory on a 1GB box. A slow cold build is fine —
  // it happens once per six hours.
  for (const [i, photo] of photos.slice(0, MAX_PHOTOS).entries()) {
    const src = photo.secure_url || photo.url
    if (!src) continue

    let data: ArrayBuffer
    try {
      data = await $fetch<ArrayBuffer>(transformed(src), {
        responseType: 'arrayBuffer',
      })
    } catch {
      // One unreachable image must not sink the whole book.
      continue
    }

    const path = `images/p${String(i).padStart(4, '0')}.jpg`
    images.push({ path, data, mediaType: 'image/jpeg' })

    const alt = photo.context?.alt || photo.context?.caption || ''
    const title =
      alt ||
      photo.public_id?.split('/').pop()?.replace(/[-_]/g, ' ') ||
      `Photo ${i + 1}`

    chapters.push({
      title,
      date: photo.created_at
        ? new Date(photo.created_at).toISOString().slice(0, 10)
        : undefined,
      html: `<figure><img src="${path}" alt="${alt.replace(/"/g, '&quot;')}"/>${
        alt ? `<figcaption>${alt.replace(/[<>&]/g, '')}</figcaption>` : ''
      }</figure>`,
    })
  }

  if (!chapters.length) {
    throw createError({
      statusCode: 503,
      message: 'No photos could be fetched',
    })
  }

  const epub = await buildEpub({
    title: 'EJ Fox — Photos',
    author: 'EJ Fox',
    identifier: `urn:ejfox:photos:${new Date().toISOString().slice(0, 10)}`,
    description: `${chapters.length} photographs from ejfox.com/photos`,
    chapters,
    images,
    coverPath: images[0]?.path,
  })

  cache.set(CACHE_KEY, epub)
  setHeaders(event, {
    'Content-Type': 'application/epub+zip',
    'Content-Disposition': 'attachment; filename="ejfox-photos.epub"',
    'Cache-Control': 'public, max-age=21600',
    'X-Epub-Cache': 'miss',
    'X-Epub-Photos': String(chapters.length),
  })
  return epub
})
