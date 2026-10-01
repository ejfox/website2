/**
 * @endpoint GET /api/atlas/unlock?key=… — turn on the atlas's private layers
 * for this browser (an httpOnly cookie), then go back to the map. A wrong
 * key just lands back on the map with nothing unlocked.
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
      maxAge: 60 * 60 * 24 * 90,
    })
  }
  return sendRedirect(event, '/atlas', 302)
})
