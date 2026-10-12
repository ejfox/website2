/**
 * @file keymap.get.ts
 * @description EJ's ZSA Voyager keymap, live from Oryx (latest revision),
 * normalized to display glyphs. Powers /keymap.
 * @endpoint GET /api/keymap
 */
import { createError } from 'h3'
import { fetchOryxLayout } from '~/server/utils/oryx'

const LAYOUT = { hashId: 'xBzP0', geometry: 'voyager' }

export default defineCachedEventHandler(
  async () => {
    try {
      return await fetchOryxLayout(LAYOUT.hashId, LAYOUT.geometry)
    } catch (err) {
      throw createError({
        statusCode: 502,
        statusMessage: `Oryx unavailable: ${(err as Error).message}`,
      })
    }
  },
  { maxAge: 3600, swr: true, name: 'keymap' }
)
