/**
 * @file legacy-redirect.ts
 * @description 301 old/mangled URLs to where the content lives now. Replaces
 *   blog-yearless-redirect (its /blog/<slug> → /blog/<year>/<slug> case is one
 *   of the rules). The logic and its safety rules live in
 *   server/utils/legacyRedirect.ts; this file only wires it to requests.
 *
 *   Runs before every /blog and /projects page render, so the manifest-derived
 *   index is rebuilt only when manifest-lite.json's mtime changes, not per hit.
 */
import { readFile, stat } from 'node:fs/promises'
import { getRequestURL, sendRedirect } from 'h3'
import {
  buildSlugIndex,
  cloudinaryFragmentTarget,
  legacySlugTarget,
  type SlugIndex,
} from '~/server/utils/legacyRedirect'
import { MANIFEST_PATH } from '~/server/utils/manifest'

// Read directly (not readManifest) to rebuild the index only when the file's
// mtime changes; the path itself is the shared one.
const MANIFEST = MANIFEST_PATH()
let cached: { mtime: number; builtAt: number; index: SlugIndex } | null = null

async function slugIndex(): Promise<SlugIndex | null> {
  try {
    const { mtimeMs } = await stat(MANIFEST)
    // Rebuild hourly too: scheduled posts go public without the file changing.
    if (
      !cached ||
      cached.mtime !== mtimeMs ||
      Date.now() - cached.builtAt > 3_600_000
    ) {
      const index = buildSlugIndex(JSON.parse(await readFile(MANIFEST, 'utf8')))
      cached = { mtime: mtimeMs, builtAt: Date.now(), index }
    }
    return cached.index
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const { pathname } = url
  if (!pathname.startsWith('/blog/') && !pathname.startsWith('/projects/'))
    return

  const image = cloudinaryFragmentTarget(pathname)
  if (image) return sendRedirect(event, image, 301)

  const index = await slugIndex()
  const target = index && legacySlugTarget(pathname, index)
  if (target) return sendRedirect(event, `${target}${url.search}`, 301)
})
