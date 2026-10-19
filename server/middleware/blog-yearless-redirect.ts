/**
 * @file blog-yearless-redirect.ts
 * @description 301 /blog/<slug> → /blog/<year>/<slug> when exactly one public
 *   dated post has that slug. Older links (and a few of EJ's own posts) use
 *   the year-less form, e.g. /blog/step-zero, which 404'd; the post lives at
 *   /blog/2019/step-zero. Only acts on a single-segment path that matches no
 *   other route, and never reveals a draft, hidden or scheduled post.
 */
import { sendRedirect, getRequestURL } from 'h3'
import { readManifest, isListable } from '~/server/utils/manifest'

// Real single-segment routes under /blog.
const RESERVED = new Set(['robots', 'tag', 'index', 'drafts'])

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const m = /^\/blog\/([^/.]+)\/?$/.exec(url.pathname)
  if (!m) return
  const seg = decodeURIComponent(m[1])
  if (RESERVED.has(seg) || /^\d+$/.test(seg)) return

  let manifest
  try {
    manifest = await readManifest()
  } catch {
    return
  }

  const matches = manifest.filter(
    (p) =>
      typeof p.slug === 'string' &&
      /^\d{4}\/[^/]+$/.test(p.slug) &&
      p.slug.endsWith(`/${seg}`) &&
      isListable(p)
  )
  if (matches.length !== 1) return
  return sendRedirect(event, `/blog/${matches[0].slug}${url.search}`, 301)
})
