/**
 * Radial god rays post-process.
 * Simulates volumetric light streaming through gaps between cards.
 * Works on raw pixel data — no GL needed.
 */

/**
 * Apply god rays to an ImageData buffer.
 * Casts radial samples toward a light source and accumulates brightness.
 *
 * @param {ImageData} imageData
 * @param {number} lightX - light source X (0-1, normalized)
 * @param {number} lightY - light source Y (0-1, normalized)
 * @param {number} intensity - ray brightness (0.08-0.2 is subtle)
 * @param {number} samples - number of radial samples (10-20)
 * @param {number} decay - falloff per sample (0.95-0.99)
 */
export function applyGodRays(imageData, lightX = 0.3, lightY = 0.2, intensity = 0.12, samples = 16, decay = 0.96) {
  const { data, width, height } = imageData
  const lx = lightX * width
  const ly = lightY * height

  // Work on a brightness-only copy for speed
  const brightness = new Float32Array(width * height)
  for (let i = 0; i < brightness.length; i++) {
    brightness[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255
  }

  // For each pixel, march toward the light and accumulate brightness
  const output = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let dx = (x - lx) / width
      let dy = (y - ly) / height
      // Normalize step
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 0.001) { output[y * width + x] = 0; continue }
      dx = (dx / len) * 0.01 // step size in normalized coords
      dy = (dy / len) * 0.01

      let accum = 0
      let weight = 1
      let sx = x / width
      let sy = y / height

      for (let s = 0; s < samples; s++) {
        sx -= dx
        sy -= dy
        const px = Math.floor(sx * width)
        const py = Math.floor(sy * height)
        if (px < 0 || px >= width || py < 0 || py >= height) break
        accum += brightness[py * width + px] * weight
        weight *= decay
      }

      output[y * width + x] = accum / samples
    }
  }

  // Composite rays additively
  for (let i = 0; i < output.length; i++) {
    const ray = output[i] * intensity * 255
    const j = i * 4
    data[j] = Math.min(255, data[j] + ray)
    data[j + 1] = Math.min(255, data[j + 1] + ray)
    data[j + 2] = Math.min(255, data[j + 2] + ray)
  }
}
