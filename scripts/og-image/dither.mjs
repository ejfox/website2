/**
 * Bayer 8x8 ordered dithering post-process.
 * Applies partially (blended) for texture without destroying readability.
 */

// Bayer 8x8 threshold matrix (normalized to 0-1 range)
const BAYER_8x8 = [
  [ 0/64,48/64,12/64,60/64, 3/64,51/64,15/64,63/64],
  [32/64,16/64,44/64,28/64,35/64,19/64,47/64,31/64],
  [ 8/64,56/64, 4/64,52/64,11/64,59/64, 7/64,55/64],
  [40/64,24/64,36/64,20/64,43/64,27/64,39/64,23/64],
  [ 2/64,50/64,14/64,62/64, 1/64,49/64,13/64,61/64],
  [34/64,18/64,46/64,30/64,33/64,17/64,45/64,29/64],
  [10/64,58/64, 6/64,54/64, 9/64,57/64, 5/64,53/64],
  [42/64,26/64,38/64,22/64,41/64,25/64,37/64,21/64],
]

/**
 * Apply Bayer dithering to an ImageData buffer.
 * Blends the dithered result with the original at the given strength.
 *
 * @param {ImageData} imageData - canvas imageData (RGBA)
 * @param {number} strength - 0 (no dither) to 1 (full dither). 0.35 is nice.
 * @param {[number,number,number]} darkColor - dark output color
 * @param {[number,number,number]} lightColor - light output color
 */
export function applyDither(imageData, strength = 0.35, darkColor = [24, 24, 27], lightColor = [228, 228, 231]) {
  const { data, width, height } = imageData

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255

      // Bayer threshold
      const threshold = BAYER_8x8[y % 8][x % 8]

      // Dithered value
      const dithered = lum > threshold ? 1 : 0
      const outColor = dithered ? lightColor : darkColor

      // Blend with original
      data[i] = Math.round(r * (1 - strength) + outColor[0] * strength)
      data[i + 1] = Math.round(g * (1 - strength) + outColor[1] * strength)
      data[i + 2] = Math.round(b * (1 - strength) + outColor[2] * strength)
      // Alpha stays unchanged
    }
  }
}
