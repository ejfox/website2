/**
 * @file atlas/private/status.get.ts
 * @description GET /api/atlas/private/status. { private: boolean }: does this
 *   browser hold a valid private-mode cookie? pages/atlas.vue uses it to decide
 *   whether to request the private layers. Logic in server/utils/atlasPrivate.ts.
 */
import { isAtlasPrivate } from '~/server/utils/atlasPrivate'

export default defineEventHandler((event) => {
  // Per-browser answer: overrides the global /api/** public cache header so a
  // CDN never serves one visitor's "true" to another.
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { private: isAtlasPrivate(event) }
})
