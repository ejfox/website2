/**
 * Monochrome palette with optional single red accent.
 * The accent is used ONCE — on the most important element only.
 */

export const ZINC = {
  bg: [24, 24, 27],        // #18181b
  card: [39, 39, 42],      // #27272a
  cardBorder: [63, 63, 70], // #3f3f46
  text: [228, 228, 231],   // #e4e4e7
  dim: [82, 82, 91],       // #52525b
  faint: [39, 39, 42],     // #27272a
  accent: [239, 68, 68],   // #ef4444 — red, used sparingly
}

export function rgba(color, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export function rgb(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

/** Luminance of an [r,g,b] color (0-1) */
export function luminance([r, g, b]) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
