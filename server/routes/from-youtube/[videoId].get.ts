/**
 * @file from-youtube/[videoId].get.ts
 * @description Short redirector for YouTube cards/descriptions that tags the
 *   visit with UTM params so Umami can attribute traffic to a specific video.
 * @endpoint GET /from-youtube/{videoId}?to=/some/path
 * @returns 302 to the destination with utm_source/medium/campaign appended
 *
 * Why a redirector instead of pasting UTM links straight into YouTube: the link
 * stays short and readable on the card, the destination can be changed after the
 * video ships, and `utm_campaign` carries the video id so Umami breaks traffic
 * down per video rather than lumping it under one "youtube" source.
 *
 * Umami already captures UTM params from the query string client-side, so there
 * is no server-side event to send and no Umami credentials involved here.
 */
import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'

// Video ids are YouTube's own format: 11 chars of [A-Za-z0-9_-]. Keeping this
// strict stops the id being used to smuggle anything into the UTM values.
const VIDEO_ID = /^[\w-]{6,20}$/

/**
 * Resolve the `to` param to a safe same-origin path.
 *
 * Anything that could leave ejfox.com is rejected: absolute URLs, and
 * protocol-relative `//evil.com` (which a browser follows off-site even though
 * it looks like a path). Without this the route is an open redirect, which is
 * worth real money to phishers precisely because the link starts with a domain
 * people trust.
 */
function safePath(to: unknown): string {
  if (typeof to !== 'string' || !to) return '/'
  if (!to.startsWith('/')) return '/'
  if (to.startsWith('//')) return '/'
  if (to.includes('\\')) return '/'
  return to
}

export default defineEventHandler(async (event) => {
  const videoId = event.context.params?.videoId ?? ''

  if (!VIDEO_ID.test(videoId)) {
    throw createError({ statusCode: 400, message: 'Invalid video id' })
  }

  const query = getQuery(event)
  const destination = safePath(query.to)

  // Preserve any query the destination already carries.
  const url = new URL(destination, 'https://ejfox.com')
  url.searchParams.set('utm_source', 'youtube')
  url.searchParams.set('utm_medium', 'video')
  url.searchParams.set('utm_campaign', videoId)

  // 302, not 301: the destination for a given video may change, and a cached
  // permanent redirect would be near-impossible to walk back.
  return sendRedirect(event, `${url.pathname}${url.search}${url.hash}`, 302)
})
