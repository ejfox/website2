/**
 * @file legacyRedirect.ts
 * @description Pure resolvers behind server/middleware/legacy-redirect.ts.
 *   Both answer "where does this dead URL live now?" or null — never a guess.
 *
 *   1. cloudinaryFragmentTarget — srcset entries are Cloudinary URLs with commas
 *      in the transform (`c_scale,f_auto,q_auto:good,w_640/v123/x.png 640w`).
 *      Browsers parse that fine; naive crawlers split on the commas and request
 *      `w_640/v123/x.png` relative to the post. That was the single biggest
 *      source of 404s (~1.4k hits / 5 weeks, 2026-10). Send them to the image.
 *
 *   2. legacySlugTarget — wrong year, missing year, wrong folder
 *      (/blog/project-notes/connectology), case/space variants. Matches the
 *      final segment against PUBLIC posts only, and only when exactly one
 *      matches. A URL that is itself a real post of any visibility is left
 *      alone, so a non-public post stays a plain 404 rather than a 301 that
 *      confirms it exists. No fuzzy/prefix matching: a typo matcher at request
 *      time is how non-public posts leak.
 *
 *   Also imported by scripts/meta/check-urls.mjs (via jiti), so the URL check
 *   sees exactly the redirects prod does. Tests:
 *   server/utils/__tests__/legacyRedirect.test.ts.
 */
import { isListed } from '~/utils/visibility.mjs'

const CLOUDINARY_ORIGIN = 'https://res.cloudinary.com'
// Same transform chain the markdown pipeline writes into srcset, so the
// redirect lands on the derived asset Cloudinary has already cached.
const CLOUDINARY_TRANSFORM = 'c_scale,f_auto,q_auto:good'
const SEG = '[\\w.-]+'
const FRAGMENT = new RegExp(
  `^/(?:blog|projects)(?:/[^/]+)*?/w_(\\d{2,4})/v(\\d{6,12})/(${SEG}(?:/${SEG})*\\.(?:png|jpe?g|gif|webp|avif))$`,
  'i'
)

export function cloudinaryFragmentTarget(pathname: string): string | null {
  const m = FRAGMENT.exec(pathname)
  if (!m) return null
  const [, width, version, publicId] = m
  if (publicId.split('/').some((s) => s === '.' || s === '..')) return null
  const target = `${CLOUDINARY_ORIGIN}/ejf/image/upload/${CLOUDINARY_TRANSFORM},w_${width}/v${version}/${publicId}`
  // Re-check the emitted URL, not just the input (see /from-youtube, /via).
  try {
    const u = new URL(target)
    if (
      u.origin !== CLOUDINARY_ORIGIN ||
      !u.pathname.startsWith('/ejf/image/upload/')
    )
      return null
  } catch {
    return null
  }
  return target
}

/** Manifest slug → public route. Mirrors buildInternalHref in scripts/utils/internal-links.mjs. */
export function routeForSlug(slug: string): string {
  const enc = (s: string) => s.split('/').map(encodeURIComponent).join('/')
  if (slug.startsWith('reading/')) return `/reading/${enc(slug.slice(8))}`
  if (slug.startsWith('projects/')) return `/projects/${enc(slug.slice(9))}`
  return `/blog/${enc(slug)}`
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')

export interface SlugIndex {
  /** Every slug in the manifest, any visibility — "this URL is real, hands off". */
  all: Set<string>
  /** normalized final segment → public routes */
  byFinal: Map<string, string[]>
}

export function buildSlugIndex(
  manifest: Array<{ slug?: unknown; [key: string]: unknown }>,
  now = Date.now()
): SlugIndex {
  const all = new Set<string>()
  const byFinal = new Map<string, string[]>()
  for (const p of manifest) {
    if (typeof p?.slug !== 'string') continue
    all.add(p.slug)
    if (!isListed(p, now)) continue
    const key = norm(p.slug.split('/').pop()!)
    const routes = byFinal.get(key) ?? []
    routes.push(routeForSlug(p.slug))
    byFinal.set(key, routes)
  }
  return { all, byFinal }
}

// Single-segment /blog/<x> paths that are real pages, not posts.
const RESERVED = new Set(['robots', 'tag', 'index', 'drafts', 'week-notes'])

export function legacySlugTarget(
  pathname: string,
  index: SlugIndex
): string | null {
  let path: string
  try {
    path = decodeURIComponent(pathname).replace(/\/+$/, '')
  } catch {
    return null
  }
  const m = /^\/(blog|projects)\/(.+)$/.exec(path)
  if (!m) return null
  const [, section, rest] = m
  const segs = rest.split('/')
  const last = segs[segs.length - 1]

  // Twins (.md/.json) and asset-looking paths (.js, .png …) are not pages.
  if (!last || /\.[a-z0-9]{1,5}$/i.test(last)) return null
  if (/^\d+$/.test(last) || last === 'null' || last === 'undefined') return null
  if (
    section === 'blog' &&
    (RESERVED.has(segs[0]) || segs[0] === 'tag' || segs.includes('drafts'))
  )
    return null

  // The URL is itself a real post (of any visibility): leave it to the page.
  if (index.all.has(section === 'projects' ? `projects/${rest}` : rest))
    return null

  // Exactly one public match, or nothing: two posts sharing a final segment
  // is ambiguous, and guessing would be a fuzzy match by another name.
  const routes = index.byFinal.get(norm(last))
  if (!routes || routes.length !== 1) return null
  return decodeURIComponent(routes[0]) === path ? null : routes[0]
}
