/**
 * @file via/[source].get.ts
 * @description Generalised attribution redirector (the /from-youtube route,
 *   for every profile/bio link). Tags the visit with UTM params so Umami can
 *   attribute the arrival, then 302s on-site.
 * @endpoint GET /via/{source}?to=/some/path&m=medium&c=campaign
 * @returns 302 to `to` (default `/`) with utm_source / utm_medium
 *   (default "profile") / optional utm_campaign appended
 *
 * Unknown sources still redirect — tagged utm_source=other — so a typo in a
 * bio link never strands a visitor. Umami reads UTMs client-side; nothing is
 * recorded here.
 *
 * Open-redirect protection is the SAME two-step check as /from-youtube (see
 * CLAUDE.md): validate the `to` input, then re-validate the EMITTED Location,
 * because `new URL()` normalisation can turn `/..//evil.com` into `//evil.com`.
 */
import { defineEventHandler, getQuery, sendRedirect, setHeader } from 'h3'

const ORIGIN = 'https://ejfox.com'

const SOURCES = new Set([
  'bluesky',
  'mastodon',
  'x',
  'github',
  'youtube',
  'linkedin',
  'instagram',
  'newsletter',
  'discord',
  'threads',
  'hn',
])

// medium / campaign are free text from the link; keep them boring.
const TOKEN = /^[a-z0-9][a-z0-9_-]{0,47}$/

function token(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.toLowerCase()
  return TOKEN.test(v) ? v : null
}

/** Input check: a single-leading-slash, backslash-free path, else `/`. */
function safePath(to: unknown): string {
  if (typeof to !== 'string' || !to) return '/'
  if (!to.startsWith('/')) return '/'
  if (to.startsWith('//')) return '/'
  if (to.includes('\\')) return '/'
  return to
}

export default defineEventHandler(async (event) => {
  const raw = String(event.context.params?.source ?? '').toLowerCase()
  const source = SOURCES.has(raw) ? raw : 'other'

  const query = getQuery(event)
  const url = new URL(safePath(query.to), ORIGIN)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', token(query.m) ?? 'profile')
  const campaign = token(query.c)
  if (campaign) url.searchParams.set('utm_campaign', campaign)

  const location = `${url.pathname}${url.search}${url.hash}`

  // Output check — the one that actually matters. Must start with exactly one
  // slash and stay on our origin, whatever the normaliser did to the input.
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  if (url.origin !== ORIGIN || !/^\/(?!\/)/.test(location)) {
    // Still keep the attribution: the query string can't leave the origin.
    return sendRedirect(event, `/${url.search}`, 302)
  }
  // 302: destinations change; a cached 301 is near-impossible to walk back.
  return sendRedirect(event, location, 302)
})
