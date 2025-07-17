import { type Ref } from 'vue'
import { select } from 'd3-selection'
import { format, differenceInDays } from 'date-fns'
import { formatTooltipDate } from '~/utils/dateFormatters'
import type { HeatmapLayoutResult } from './useHeatmapLayout'

export interface D3HeatmapOptions {
  svgContainer: Ref<HTMLElement | null>
  layout: HeatmapLayoutResult
  values: number[]
  details: any[]
  startDate: Date
  isDark: boolean
  showLegend: boolean
  legendLabels: { start: string; end: string }
  getCellColor: (value: number, index: number) => string
  getCellOpacity: (value: number, index: number) => number
  getLegendColor: (step: number) => string
  onCellHover: (data: any) => void
  onCellLeave: () => void
}

export function useD3Heatmap() {
  const DAYS = ['Mon', 'Wed', 'Fri']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Use shared date formatter

  const drawHeatmap = (options: D3HeatmapOptions) => {
    const {
      svgContainer,
      layout,
      values,
      details,
      startDate,
      isDark,
      showLegend,
      legendLabels,
      getCellColor,
      getCellOpacity,
      getLegendColor,
      onCellHover,
      onCellLeave
    } = options

    if (!svgContainer.value) return

    // Clear previous
    select(svgContainer.value).selectAll('svg').remove()

    const { cellSize, useHorizontalLayout, width, height, daysToShow } = layout
    const CELL_PADDING = 2
    const MARGIN = {
      top: 24,
      right: 24,
      bottom: 24,
      left: 24
    }

    const svgHeight = showLegend ? height + 32 : height

    // Create SVG
    const svg = select(svgContainer.value)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${svgHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // Create month labels
    const monthPositions = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setMonth(startDate.getMonth() + i)
      if (date > new Date()) break
      const weekOffset = Math.floor(differenceInDays(date, startDate) / 7)
      monthPositions.push({
        month: months[date.getMonth()],
        x: weekOffset * (cellSize + CELL_PADDING)
      })
    }

    // Add month labels
    svg.selectAll('.month-label')
      .data(monthPositions)
      .join('text')
      .attr('class', 'month-label')
      .attr('x', d => d.x + MARGIN.left)
      .attr('y', MARGIN.top - 8)
      .attr('font-size', '9px')
      .attr('fill', isDark ? '#666' : '#555')
      .text(d => d.month)

    // Add day labels for vertical layout
    if (!useHorizontalLayout) {
      svg.selectAll('.day-label')
        .data(DAYS)
        .join('text')
        .attr('class', 'day-label')
        .attr('x', MARGIN.left - 8)
        .attr('y', (d, i) => (i * 2 + 1) * (cellSize + CELL_PADDING) + MARGIN.top)
        .attr('font-size', '9px')
        .attr('fill', isDark ? '#666' : '#555')
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .text(d => d)
    }

    // Create cell group
    const cellGroup = svg.append('g')
      .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`)

    // Create cells
    const _cells = cellGroup.selectAll('.contribution')
      .data(values)
      .join('rect')
      .attr('class', 'contribution')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('x', (d, i) => {
        if (useHorizontalLayout) {
          return i * (cellSize + CELL_PADDING)
        }
        return Math.floor((daysToShow - i - 1) / 7) * (cellSize + CELL_PADDING)
      })
      .attr('y', (d, i) => {
        if (useHorizontalLayout) {
          return 0
        }
        return (daysToShow - i - 1) % 7 * (cellSize + CELL_PADDING)
      })
      .attr('fill', (d, i) => getCellColor(d, i))
      .attr('opacity', (d, i) => getCellOpacity(d, i))
      .on('mouseenter', (event: any, d: number) => {
        // Calculate date for this cell
        const dayOffset = daysToShow - values.indexOf(d) - 1
        const timestamp = startDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000)
        const cellDate = new Date(timestamp)

        // Call hover callback with the index from the values array
        const i = values.indexOf(d)
        onCellHover({
          date: formatTooltipDate(cellDate),
          count: d,
          details: details[i] || []
        })
      })
      .on('mouseleave', onCellLeave)

    // Add subtle grid
    cellGroup.selectAll('.grid')
      .data(values)
      .join('rect')
      .attr('class', 'grid')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('x', (d, i) => Math.floor((daysToShow - i - 1) / 7) * (cellSize + CELL_PADDING))
      .attr('y', (d, i) => (daysToShow - i - 1) % 7 * (cellSize + CELL_PADDING))
      .attr('fill', 'none')
      .attr('stroke', isDark ? '#ffffff08' : '#00000008')

    // Add date labels for horizontal layout
    if (useHorizontalLayout) {
      cellGroup.selectAll('.date-label')
        .data(values)
        .join('text')
        .attr('class', 'date-label')
        .attr('x', (d, i) => i * (cellSize + CELL_PADDING) + (cellSize / 2))
        .attr('y', cellSize + 20)
        .attr('font-size', '9px')
        .attr('fill', isDark ? '#666' : '#555')
        .attr('text-anchor', 'middle')
        .text((d, i) => {
          const date = new Date(startDate.getTime() + ((daysToShow - i - 1) * 24 * 60 * 60 * 1000))
          return format(date, 'MMM d')
        })
    }

    // Create legend if enabled
    if (showLegend) {
      const legendGroup = svg.append('g')
        .attr('transform', `translate(${MARGIN.left}, ${height + 16})`)

      // Add legend text
      legendGroup.append('text')
        .attr('x', 0)
        .attr('y', 8)
        .attr('font-size', '9px')
        .attr('fill', isDark ? '#666' : '#555')
        .text(legendLabels.start)

      // Add color squares
      const legendSteps = [0, 0.25, 0.5, 0.75, 1]
      const squareSize = 12
      const squareSpacing = 6
      const legendCenter = width / 2
      const totalWidth = (squareSize * legendSteps.length) + (squareSpacing * (legendSteps.length - 1))
      const startX = legendCenter - (totalWidth / 2)

      legendSteps.forEach((step, i) => {
        legendGroup.append('rect')
          .attr('x', startX + (i * (squareSize + squareSpacing)))
          .attr('y', 0)
          .attr('width', squareSize)
          .attr('height', squareSize)
          .attr('rx', 2)
          .attr('fill', getLegendColor(step))
      })

      // Add end label
      legendGroup.append('text')
        .attr('x', width - 20)
        .attr('y', 8)
        .attr('font-size', '9px')
        .attr('fill', isDark ? '#666' : '#555')
        .attr('text-anchor', 'end')
        .text(legendLabels.end)
    }
  }

  return {
    drawHeatmap
  }
}