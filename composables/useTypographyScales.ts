import * as d3 from 'd3'

// Typography scales using D3 - mathematical precision for responsive design
export const useTypographyScales = () => {
  // Font size scale - modular scale with clamping
  const fontSize = d3
    .scaleLinear()
    .domain([0, 6]) // h6 to display
    .range([14, 72]) // px values
    .clamp(true)

  // Line height scale - inversely proportional to font size
  const lineHeight = d3
    .scalePow()
    .exponent(0.5) // Slight curve
    .domain([14, 72])
    .range([1.7, 1.1]) // Tighter leading for larger text

  // Letter spacing scale - optical adjustments
  const letterSpacing = d3
    .scaleLinear()
    .domain([14, 24, 48, 72])
    .range([0, -0.01, -0.02, -0.03]) // em values

  // Responsive width scale - for container sizing
  const containerWidth = d3
    .scaleLinear()
    .domain([320, 768, 1280, 1920]) // Breakpoints
    .range([20, 40, 65, 65]) // ch units
    .clamp(true)

  // Sidenote positioning scale
  const sidenotePosition = d3
    .scaleLinear()
    .domain([0, 100]) // Percentage down page
    .range([100, 2000]) // Absolute Y position

  // Word count to visual weight
  const wordScale = d3
    .scaleQuantize()
    .domain([0, 5000])
    .range(['xs', 'sm', 'md', 'lg', 'xl']) // Size classes

  // Color scales for semantic highlighting
  const emphasisColor = d3
    .scaleOrdinal()
    .domain(['primary', 'secondary', 'warning', 'muted'])
    .range(['#3b82f6', '#10b981', '#f59e0b', '#71717a'])

  // Opacity scale for depth
  const depthOpacity = d3
    .scaleLinear()
    .domain([0, 3]) // Nesting level
    .range([1, 0.4])

  // Time-based scales for reading metrics
  const readingTime = d3
    .scaleLinear()
    .domain([0, 5000]) // Word count
    .range([0, 20]) // Minutes

  // Grid snapping scale
  const gridSnap = d3
    .scaleQuantize()
    .domain([0, 1920])
    .range(d3.range(0, 1920, 8)) // Snap to 8px grid

  return {
    fontSize,
    lineHeight,
    letterSpacing,
    containerWidth,
    sidenotePosition,
    wordScale,
    emphasisColor,
    depthOpacity,
    readingTime,
    gridSnap,
  }
}
