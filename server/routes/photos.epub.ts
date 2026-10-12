/**
 * @file photos.epub.ts
 * @description The photo blog as an EPUB with images EMBEDDED, so it reads on
 *   a plane. Always current — built from the same Cloudinary data /photos uses.
 * @endpoint GET /photos.epub
 *
 * Every frame is embedded as a 1-bit line halftone (halftone.ts — EJ's
 * "halftone line 15deg p5"), not a JPEG: 50 full JPEGs made this book 13 MB,
 * and a 1-bit screen renders the same on every e-ink panel. Cloudinary still
 * does the resizing, so the server never holds a full-resolution original.
 */
import { defineEventHandler, getRequestURL, createError } from 'h3'
import {
  buildEpub,
  type EpubChapter,
  type EpubImage,
} from '~/server/utils/epub'
import { halftoneImage, mapLimit } from '~/server/utils/halftone'
import { serveBook } from '~/server/utils/epubCache'

// Longer than the blog's hour: the photo set changes rarely and each rebuild
// costs ~N image fetches (cheap after the first, thanks to the disk cache).
const TTL_SECONDS = 21600

/** Hard ceiling so one runaway response can't OOM a 1GB pm2 process. */
const MAX_PHOTOS = 300

/** Shape of /api/photos (server/api/photos.get.ts), plus the older raw-Cloudinary keys. */
interface Photo {
  url?: string
  secure_url?: string
  id?: string
  public_id?: string
  description?: string | null
  context?: { alt?: string; caption?: string }
  date?: string
  created_at?: string
}

const escText = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

async function buildPhotos(origin: string) {
  const raw = await $fetch<Photo[] | { photos?: Photo[]; resources?: Photo[] }>(
    '/api/photos',
    { baseURL: origin }
  ).catch(() => null)

  const photos: Photo[] = (
    Array.isArray(raw) ? raw : raw?.photos || raw?.resources || []
  ).slice(0, MAX_PHOTOS)

  if (!photos.length) {
    throw createError({ statusCode: 503, message: 'Photo source unavailable' })
  }

  // Small concurrency, not Promise.all: 300 concurrent fetches would hammer
  // Cloudinary and spike memory on a 1GB box.
  const pngs = await mapLimit(photos, 4, (p) => {
    const src = p.secure_url || p.url
    return src ? halftoneImage(src) : Promise.resolve(null)
  })

  const chapters: EpubChapter[] = []
  const images: EpubImage[] = []

  photos.forEach((photo, i) => {
    const data = pngs[i]
    // One unreachable image must not sink the whole book.
    if (!data) return
    const path = `images/p${String(i).padStart(4, '0')}.png`
    images.push({ path, data, mediaType: 'image/png' })

    // /api/photos exposes the caption as `description`; `context` is the raw
    // Cloudinary shape this route used to expect (and never received).
    const alt = (
      photo.description ||
      photo.context?.alt ||
      photo.context?.caption ||
      ''
    ).trim()
    const id = photo.id || photo.public_id
    // Title stays the short file-derived name: descriptions run to a paragraph,
    // which belongs in the caption, not an <h1>.
    const title =
      id?.split('/').pop()?.replace(/[-_]/g, ' ') || `Photo ${i + 1}`
    const created = photo.date || photo.created_at

    chapters.push({
      title,
      date: created ? new Date(created).toISOString().slice(0, 10) : undefined,
      html: `<figure class="ht"><img src="${path}" alt="${escText(alt)}"/>${
        alt ? `<figcaption>${escText(alt)}</figcaption>` : ''
      }</figure>`,
    })
  })

  if (!chapters.length) {
    throw createError({
      statusCode: 503,
      message: 'No photos could be fetched',
    })
  }

  const data = await buildEpub({
    title: 'EJ Fox — Photos',
    author: 'EJ Fox',
    identifier: `urn:ejfox:photos:${new Date().toISOString().slice(0, 10)}`,
    description: `${chapters.length} photographs from ejfox.com/photos`,
    chapters,
    images,
    coverPath: images[0]?.path,
  })

  return {
    data,
    meta: {
      'X-Epub-Photos': String(chapters.length),
      'X-Epub-Images': String(images.length),
      'X-Epub-Images-Failed': String(photos.length - images.length),
    },
  }
}

export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  return serveBook(event, {
    name: 'photos',
    ttlSeconds: TTL_SECONDS,
    filename: 'ejfox-photos.epub',
    build: () => buildPhotos(origin),
  })
})
