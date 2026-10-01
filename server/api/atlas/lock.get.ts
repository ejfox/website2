/** @endpoint GET /api/atlas/lock — forget private mode in this browser */
import { deleteCookie, sendRedirect } from 'h3'
import { ATLAS_COOKIE } from '~/server/utils/atlasPrivate'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  deleteCookie(event, ATLAS_COOKIE, { path: '/' })
  return sendRedirect(event, '/atlas', 302)
})
