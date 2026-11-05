/**
 * @file style-dither.mjs
 * @description House style 1, "Dither": the post's content as floating cards
 *   in a pseudo-3D room (layout.mjs → render.mjs), monochrome, god rays and
 *   a Bayer dither that pushes the whole frame toward 1-bit. The title is
 *   set in the bitmap font with a halo, never a box.
 */

import { layoutCards } from './layout.mjs'
import { renderScene } from './render.mjs'

export const name = 'dither'

export async function render(content, seed) {
  const scene = layoutCards(seed, content)
  return renderScene(content, scene, seed)
}
