/**
 * @file blog-yearless-redirect.ts
 * @description 301 /blog/<slug> → /blog/<year>/<slug> when exactly one public
 *   dated post has that slug. Older links (and a few of EJ's own posts) use
 *   the year-less form, e.g. /blog/step-zero, which 404'd; the post lives at
 *   /blog/2019/step-zero. Only acts on a single-segment path that matches no
 *   other route, and never reveals a draft, hidden or scheduled post.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sendRedirect, getRequestURL } from 'h3'
import { isHiddenFromListings, isScheduled } from '~/utils/postFilters'

// Real single-segment routes under /blog.
const RESERVED = new Set(['robots', 'tag', 'index', 'drafts'])

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const m = /^\/blog\/([^/.]+)\/?$/.exec(url.pathname)
  if (!m) return
  const seg = decodeURIComponent(m[1])
  if (RESERVED.has(seg) || /^\d+$/.test(seg)) return

  let manifest: Array<Record<string, any>>
  try {
    manifest = JSON.parse(
      await readFile(
        resolve(process.cwd(), 'content/processed/manifest-lite.json'),
        'utf8'
      )
    )
  } catch {
    return
  }

  const matches = manifest.filter(
    (p) =>
      typeof p.slug === 'string' &&
      /^\d{4}\/[^/]+$/.test(p.slug) &&
      p.slug.endsWith(`/${seg}`) &&
      !isHiddenFromListings(p) &&
      !isScheduled(p)
  )
  if (matches.length !== 1) return
  return sendRedirect(event, `/blog/${matches[0].slug}${url.search}`, 301)
})
