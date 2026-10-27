/**
 * @file atlas/lock.get.ts
 * @description GET /api/atlas/lock. Forget private mode in this browser: deletes
 *   the atlas cookie and 302s to /atlas. See server/utils/atlasPrivate.ts.
 */
import { deleteCookie, sendRedirect } from 'h3'
import { ATLAS_COOKIE } from '~/server/utils/atlasPrivate'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  deleteCookie(event, ATLAS_COOKIE, { path: '/' })
  return sendRedirect(event, '/atlas', 302)
})
