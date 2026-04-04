/**
 * 3D → 2D perspective projection.
 * Pure math, no GL. The whole pseudo-3D engine.
 */

const FOV = 300 // tighter FOV = more dramatic perspective

/**
 * Project a 3D point to 2D screen coordinates.
 * Aggressive perspective — close things are BIG, far things are tiny.
 */
export function project3D(x, y, z, width, height) {
  const depth = Math.max(z, 0.1)
  const scale = FOV / (FOV + depth * 300) // stronger depth scaling
  return {
    screenX: x * scale + width / 2,
    screenY: y * scale + height / 2,
    scale,
  }
}

/**
 * Compute a perspective skew transform for a card.
 * Returns [topLeft, topRight, bottomLeft, bottomRight] corner offsets
 * to make the card look like it's angled in 3D.
 */
export function perspectiveSkew(card, proj) {
  const angle = (card.rotation || 0) * Math.PI / 180
  const tilt = card.z * 0.15 // deeper cards tilt more
  return {
    // Horizontal skew from rotation
    skewX: Math.sin(angle) * card.width * proj.scale * 0.3,
    // Vertical taper from depth (further side is narrower)
    taperTop: 1 - tilt * 0.12,
    taperBottom: 1 + tilt * 0.08,
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
