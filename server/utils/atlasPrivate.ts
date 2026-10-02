/**
 * Private mode for the Valley Atlas: layers only EJ can load.
 *
 * Visiting /api/atlas/unlock?key=<ATLAS_PRIVATE_TOKEN> sets an httpOnly
 * cookie holding an HMAC of the token (never the token itself). Private
 * routes call requireAtlasPrivate(event), which answers 404 — not 401 — so
 * the routes don't advertise that they exist.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { serverEnv } from '~/server/utils/serverEnv'

export const ATLAS_COOKIE = 'atlas_private'

const token = () => serverEnv('ATLAS_PRIVATE_TOKEN')

/** The cookie value: an HMAC of the token, so a stolen cookie isn't the key */
export const cookieValue = () =>
  createHmac('sha256', token()).update('atlas-private-v1').digest('hex')

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export const keyMatches = (key: string) => !!token() && safeEqual(key, token())

export const isAtlasPrivate = (event: H3Event) => {
  if (!token()) return false
  const got = getCookie(event, ATLAS_COOKIE) || ''
  return safeEqual(got, cookieValue())
}

export function requireAtlasPrivate(event: H3Event) {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  if (!isAtlasPrivate(event)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
}
