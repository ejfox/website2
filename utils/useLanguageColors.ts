/**
 * @file useLanguageColors.ts
 * @description Maps programming languages to consistent colors using d3 turbo scale
 * @returns { getColor, LANGUAGE_ORDER } - Color function and language ordering
 */
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

// Pre-baked turbo colors for the 18 known languages (avoids loading d3-scale-chromatic)
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#4690d6',
  TypeScript: '#4ba5ea',
  Vue: '#55baf4',
  Python: '#65cef5',
  Shell: '#7adff0',
  HTML: '#93ece3',
  CSS: '#b0f4d1',
  Rust: '#cef8b8',
  Go: '#e8f89e',
  Ruby: '#f8f07e',
  Java: '#f8db5e',
  C: '#f5be3e',
  'C++': '#f09e20',
  Swift: '#e87d0e',
  Kotlin: '#de5d0a',
  PHP: '#d03e0c',
  Lua: '#bf2312',
  Unknown: '#a11018',
}

export function useLanguageColors() {
  const getColor = (language: string): string => {
    const lang = language || 'Unknown'
    if (LANGUAGE_COLORS[lang]) return LANGUAGE_COLORS[lang]
    // Hash unknown languages to a hue
    const hash = lang.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const hue = (hash * 137) % 360
    return `hsl(${hue}, 60%, 55%)`
  }

  return { getColor, LANGUAGE_ORDER }
}
