/**
 * @file useLanguageColors.ts
 * @description Maps programming languages to consistent colors using d3 turbo scale
 * @returns { getColor, LANGUAGE_ORDER } - Color function and language ordering
 */
import { interpolateTurbo } from 'd3-scale-chromatic'

// Fixed order of languages for consistent colors across all charts
const LANGUAGE_ORDER = [
  'JavaScript',
  'TypeScript',
  'Vue',
  'Python',
  'Shell',
  'HTML',
  'CSS',
  'Rust',
  'Go',
  'Ruby',
  'Java',
  'C',
  'C++',
  'Swift',
  'Kotlin',
  'PHP',
  'Lua',
  'Unknown',
]

export function useLanguageColors() {
  const getColor = (language: string): string => {
    const lang = language || 'Unknown'
    const idx = LANGUAGE_ORDER.indexOf(lang)
    if (idx >= 0) {
      // Sample from middle-to-end of turbo (avoiding dark start)
      // 0.3-1.0 range = brighter, more saturated colors
      const t = 0.3 + (idx / (LANGUAGE_ORDER.length - 1)) * 0.7
      return interpolateTurbo(t)
    }
    // Hash unknown languages to bright part of turbo
    const hash = lang.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const t = 0.3 + (hash % 70) / 100 // 0.3-1.0 range
    return interpolateTurbo(t)
  }

  return { getColor, LANGUAGE_ORDER }
}
