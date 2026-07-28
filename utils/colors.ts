// Color palettes + value/index → color helpers.
import { quantize, interpolateTurbo } from 'd3'

// Turbo colormap sampled to 256 steps (d3-scale-chromatic)
export const turboColors: string[] = quantize(interpolateTurbo, 256)

// Monochromatic zinc shades for consistent UI elements
export const zincShades = [
  'rgb(161, 161, 170)', // zinc-400
  'rgb(113, 113, 122)', // zinc-500
  'rgb(82, 82, 91)', // zinc-600
  'rgb(63, 63, 70)', // zinc-700
  'rgb(39, 39, 42)', // zinc-800
  'rgb(24, 24, 27)', // zinc-900
]

// Map a normalized value (0–1) onto a palette.
export const getColorForValue = (
  value: number,
  palette: string[] = turboColors
): string => {
  if (value <= 0) return palette[0]
  if (value >= 1) return palette[palette.length - 1]
  const index = Math.floor(value * (palette.length - 1))
  return palette[index]
}

// Cycle a palette by index.
export const getColorForIndex = (
  index: number,
  palette: string[] = zincShades
): string => {
  return palette[index % palette.length]
}
