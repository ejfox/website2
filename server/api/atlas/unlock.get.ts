/**
 * @file atlas/unlock.get.ts
 * @description GET /api/atlas/unlock?key=... Turns on the atlas's private layers
 *   for this browser, then 302s back to /atlas. A matching key (env
 *   ATLAS_PRIVATE_TOKEN, timing-safe compare) sets an httpOnly cookie holding an
 *   HMAC of the token, never the token itself. A wrong key just lands back on the
 *   map with nothing unlocked, so the route doesn't confirm a guess.
 *   Logic in server/utils/atlasPrivate.ts.
 */
import { sendRedirect } from 'h3'
import {
  ATLAS_COOKIE,
  cookieValue,
  keyMatches,
} from '~/server/utils/atlasPrivate'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const key = String(getQuery(event).key || '')
  if (keyMatches(key)) {
    setCookie(event, ATLAS_COOKIE, cookieValue(), {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'strict',
      path: '/',
      // 90 days. The cookie value is fixed per token, so rotating
      // ATLAS_PRIVATE_TOKEN is the only way to revoke it.
      maxAge: 60 * 60 * 24 * 90,
    })
  }
  return sendRedirect(event, '/atlas', 302)
})
