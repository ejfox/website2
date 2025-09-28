import * as d3 from 'd3'
import { computed, ref } from 'vue'

/**
 * D3-powered typography system
 * Uses mathematical scales for consistent, responsive design
 */
export const useD3Typography = () => {
  const viewportWidth = ref(window.innerWidth)

  // Modular scale for font sizes (perfect fourth: 1.333)
  const modularScale = d3
    .scalePow()
    .exponent(1.333)
    .domain([0, 8])
    .range([12, 96])

  // Viewport-based responsive scale
  const responsiveScale = d3
    .scaleLinear()
    .domain([320, 768, 1920])
    .range([0.8, 1, 1.2])
    .clamp(true)

  // Get font size with responsive scaling
  const fontSize = (level: number) => {
    const base = modularScale(level)
    const multiplier = responsiveScale(viewportWidth.value)
    return Math.round(base * multiplier)
  }

  // Line height inversely proportional to font size
  const lineHeight = d3
    .scalePow()
    .exponent(-0.5)
    .domain([12, 96])
    .range([1.8, 1.1])

  // Letter spacing for optical correction
  const letterSpacing = d3
    .scaleLinear()
    .domain([12, 24, 48, 96])
    .range([0.03, 0, -0.02, -0.04])

  // Measure (line length) based on font size
  const measure = d3
    .scaleLinear()
    .domain([12, 16, 20, 24])
    .range([45, 65, 70, 75]) // ch units

  // Color scales for semantic text
  const textColor = d3
    .scaleOrdinal()
    .domain(['primary', 'secondary', 'muted', 'error', 'success'])
    .range(['#18181b', '#71717a', '#a1a1aa', '#ef4444', '#10b981'])

  // Opacity for hierarchy
  const textOpacity = d3
    .scaleLinear()
    .domain([0, 3]) // Hierarchy level
    .range([1, 0.5])

  // Spacing rhythm (8px baseline grid)
  const spacing = d3
    .scaleQuantize()
    .domain([0, 10])
    .range([0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96])

  // Reading time estimation
  const readingTime = d3
    .scaleLinear()
    .domain([0, 300]) // Words per minute
    .rangeRound([0, 1])

  // Generate complete typography config
  const generateTypography = (level: number = 3) => {
    const size = fontSize(level)
    return {
      fontSize: `${size}px`,
      lineHeight: lineHeight(size),
      letterSpacing: `${letterSpacing(size)}em`,
      maxWidth: `${measure(size)}ch`
    }
  }

  // Generate spacing classes
  const space = (n: number) => `${spacing(n)}px`

  // Word/character count scales
  const wordCountScale = d3
    .scaleThreshold()
    .domain([100, 500, 1000, 2500, 5000])
    .range(['micro', 'short', 'medium', 'long', 'epic', 'tome'])

  // Generate CSS variables from scales
  const cssVariables = computed(() => {
    const vars: Record<string, string> = {}

    // Font sizes
    for (let i = 0; i <= 8; i++) {
      vars[`--font-${i}`] = `${fontSize(i)}px`
    }

    // Spacing
    for (let i = 0; i <= 10; i++) {
      vars[`--space-${i}`] = space(i)
    }

    // Colors
    ;['primary', 'secondary', 'muted', 'error', 'success'].forEach((key) => {
      vars[`--text-${key}`] = textColor(key)
    })

    return vars
  })

  // Update viewport width on resize
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      viewportWidth.value = window.innerWidth
    })
  }

  return {
    fontSize,
    lineHeight,
    letterSpacing,
    measure,
    textColor,
    textOpacity,
    spacing,
    readingTime,
    generateTypography,
    space,
    wordCountScale,
    cssVariables,

    // Raw scales for custom use
    scales: {
      modularScale,
      responsiveScale
    }
  }
}
