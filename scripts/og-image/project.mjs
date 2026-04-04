/**
 * 3D → 2D perspective projection.
 * Pure math, no GL. The whole pseudo-3D engine.
 */

const FOV = 500

/**
 * Project a 3D point to 2D screen coordinates.
 * @param {number} x - 3D x position
 * @param {number} y - 3D y position
 * @param {number} z - 3D depth (0 = camera, higher = further)
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @returns {{ screenX, screenY, scale }}
 */
export function project3D(x, y, z, width, height) {
  const depth = Math.max(z, 0.1)
  const scale = FOV / (FOV + depth * 200)
  return {
    screenX: x * scale + width / 2,
    screenY: y * scale + height / 2,
    scale,
  }
}

/**
 * Sort cards back-to-front for painter's algorithm rendering.
 */
export function sortByDepth(cards) {
  return [...cards].sort((a, b) => b.z - a.z)
}

/**
 * Calculate blur radius based on depth (depth of field effect).
 * Cards at z ~1.0 are sharpest, further or nearer get blurred.
 */
export function depthBlur(z) {
  const focalPoint = 1.2
  const distance = Math.abs(z - focalPoint)
  return Math.min(distance * 2.5, 8)
}
