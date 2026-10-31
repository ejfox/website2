/**
 * @file photo-posts.get.ts
 * @description GET /api/photo-posts. Listable photo-type posts with up to 3
 *   stack-preview image URLs each: { total, posts: [{ slug, title, dek, date, year,
 *   tags, images, imageCount }] }, newest year first. Body HTML is NOT included;
 *   consumers fetch it on demand from posts/[...slug].ts when a stack is expanded.
 *   Reads manifest-lite.json + each post's content/processed JSON.
 *   Cached 1h, so a scheduled photo post can appear up to an hour late.
 *   Throws 500 if the manifest can't be read.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createError } from 'h3'
import { readManifest, isListable } from '~/server/utils/manifest'

interface PhotoPost {
  slug: string
  title: string
  dek?: string
  date?: string
  year?: number
  tags?: string[]
  images: string[] // first N Cloudinary src URLs, for stack preview
  imageCount: number
}

const PROCESSED_DIR = path.join(process.cwd(), 'content/processed')
const PREVIEW_IMAGES = 3 // enough for the stack pile

function extractImageSrcs(
  html: string,
  limit: number
): { srcs: string[]; total: number } {
  if (!html) return { srcs: [], total: 0 }
  const seen = new Set<string>()
  const srcs: string[] = []
  const re = /<img\b[^>]*?\ssrc="([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    if (srcs.length < limit) srcs.push(url)
  }
  return { srcs, total: seen.size }
}

export default defineCachedEventHandler(
  async () => {
    try {
      const manifest = await readManifest()

      const photoPosts = manifest.filter(
        // Privacy filter: isListable keeps public posts only.
        (p) => (p.type === 'photos' || p.type === 'photo') && isListable(p)
      )

      const results: PhotoPost[] = []
      for (const entry of photoPosts) {
        const jsonPath = path.join(PROCESSED_DIR, `${entry.slug}.json`)
        let html = ''
        try {
          const post = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
          html = post.html || ''
        } catch {
          continue
        }
        const { srcs, total } = extractImageSrcs(html, PREVIEW_IMAGES)
        if (total === 0) continue

        const date = entry.date || entry.metadata?.date
        const year = date ? new Date(date).getFullYear() : undefined

        results.push({
          slug: entry.slug,
          title: entry.title || entry.metadata?.title || entry.slug,
          dek: entry.dek || entry.metadata?.dek,
          date,
          year,
          tags: entry.tags || entry.metadata?.tags,
          images: srcs,
          imageCount: total,
        })
      }

      results.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
      return { total: results.length, posts: results }
    } catch (err) {
      console.error('Failed to load photo posts:', err)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load photo posts',
      })
    }
  },
  {
    maxAge: 60 * 60, // 1 hour
    name: 'photo-posts',
  }
)
