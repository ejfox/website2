/**
 * @file keymap.get.ts
 * @description GET /api/keymap. EJ's ZSA Voyager keymap, live from Oryx (latest
 *   revision), normalized to display glyphs by server/utils/oryx.ts. Powers /keymap.
 *   Cached 1h with swr. Throws 502 if Oryx is unreachable.
 */
import { createError } from 'h3'
import { fetchOryxLayout } from '~/server/utils/oryx'

const LAYOUT = { hashId: 'QJ7wB', geometry: 'voyager' }

export default defineCachedEventHandler(
  async () => {
    try {
      return await fetchOryxLayout(LAYOUT.hashId, LAYOUT.geometry)
    } catch (err) {
      console.error('Oryx layout fetch failed:', err)
      throw createError({
        statusCode: 502,
        statusMessage: 'Oryx unavailable',
      })
    }
  },
  { maxAge: 3600, swr: true, name: 'keymap' }
)
