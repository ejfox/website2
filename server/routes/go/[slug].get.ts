/**
 * @file go/[slug].get.ts
 * @description Sponsor / partner link redirector. Short, trustworthy URLs for
 *   video descriptions, pinned comments, on-screen QR codes and the newsletter,
 *   e.g. https://ejfox.com/go/tailscale-ep12-d
 * @endpoint GET /go/{slug}
 * @returns 302 to Umami's tracked link https://umami.tools.ejfox.com/q/{slug}
 *
 * The click itself is recorded by Umami's Links feature (country, device,
 * referrer, bot-filtered), which then 302s to the sponsor with their own UTMs.
 * Links are created and reported by chart-desk: `desk sponsor new|report`.
 *
 * The destination is a fixed host plus a slug restricted to [a-z0-9-], so this
 * can't be turned into an open redirect. Unknown slugs 404 at Umami, so we
 * don't need to know the link list here.
 */
import { createError, defineEventHandler, sendRedirect, setHeader } from 'h3'

const UMAMI_LINKS = 'https://umami.tools.ejfox.com/q/'
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug ?? '').toLowerCase()
  if (!SLUG.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  // Every click must reach Umami; a cached redirect would swallow it.
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  return sendRedirect(event, `${UMAMI_LINKS}${slug}`, 302)
})
