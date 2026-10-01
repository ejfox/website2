/** @endpoint GET /api/atlas/private/status — is private mode on here? */
import { isAtlasPrivate } from '~/server/utils/atlasPrivate'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { private: isAtlasPrivate(event) }
})
