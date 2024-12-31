<script setup lang="ts">
import * as d3 from 'd3'
import { useElementSize } from '@vueuse/core'

interface Contribution {
  date: string
  count: number
}

interface Props {
  data: Contribution[]
  colorScheme?: string[]
  showFullYear?: boolean
  showLegend?: boolean
  legendLabels?: {
    start: string
    end: string
  }
  emptyColor?: string
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  colorScheme: () => ['rgb(22, 27, 34)', 'rgb(14, 68, 41)', 'rgb(0, 109, 50)', 'rgb(38, 166, 65)', 'rgb(57, 211, 83)'],
  showFullYear: false,
  showLegend: false,
  emptyColor: 'rgb(22, 27, 34)',
  legendLabels: () => ({ start: '0', end: 'Many' })
})

const heatmapRef = ref<HTMLElement>()
const { width } = useElementSize(heatmapRef)

// Process data into weeks
const processedData = computed(() => {
  const weeks: Contribution[][] = []
  let currentWeek: Contribution[] = []

  props.data.forEach((day) => {
    const date = new Date(day.date)
    if (currentWeek.length === 0 || new Date(currentWeek[0].date).getDay() > date.getDay()) {
      if (currentWeek.length) weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })
  if (currentWeek.length) weeks.push(currentWeek)

  return weeks
})

// Calculate color scale
const colorScale = computed(() => {
  const maxValue = d3.max(props.data, d => d.count) || 0
  return d3.scaleQuantize()
    .domain([0, maxValue])
    .range(props.colorScheme as string[])
})

// Draw heatmap
const drawHeatmap = () => {
  if (!heatmapRef.value) return

  const cellSize = Math.min(width.value / 53, 12) // 53 weeks max in a year
  const cellPadding = 1
  const totalHeight = 7 * (cellSize + cellPadding) // 7 days per week

  // Clear previous content
  d3.select(heatmapRef.value).selectAll('*').remove()

  const svg = d3.select(heatmapRef.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', totalHeight + (props.showLegend ? 30 : 0))

  // Draw day cells
  processedData.value.forEach((week, weekIndex) => {
    week.forEach((day) => {
      const date = new Date(day.date)
      svg.append('rect')
        .attr('x', weekIndex * (cellSize + cellPadding))
        .attr('y', date.getDay() * (cellSize + cellPadding))
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 2)
        .attr('fill', day.count > 0 ? colorScale.value(day.count) : props.emptyColor)
        .attr('data-date', day.date)
        .attr('data-count', day.count)
    })
  })

  // Draw legend if enabled
  if (props.showLegend) {
    const legendX = width.value - 200
    const legendY = totalHeight + 20
    const legendWidth = 180
    const legendItemWidth = legendWidth / props.colorScheme.length

    // Legend background
    svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`)
      .selectAll('rect')
      .data(props.colorScheme)
      .enter()
      .append('rect')
      .attr('x', (_, i) => i * legendItemWidth)
      .attr('width', legendItemWidth)
      .attr('height', 8)
      .attr('fill', d => d)
      .attr('rx', 1)

    // Legend labels
    svg.append('text')
      .attr('x', legendX)
      .attr('y', legendY - 5)
      .attr('class', 'text-xs text-gray-400')
      .text(props.legendLabels.start)

    svg.append('text')
      .attr('x', legendX + legendWidth)
      .attr('y', legendY - 5)
      .attr('class', 'text-xs text-gray-400 text-right')
      .attr('text-anchor', 'end')
      .text(props.legendLabels.end)
  }
}

// Redraw on width changes
watch([width, () => props.data], () => {
  drawHeatmap()
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <div v-if="title || subtitle" class="flex justify-between items-baseline">
      <h4 v-if="title" class="text-sm tracking-wider text-gray-500">{{ title }}</h4>
      <p v-if="subtitle" class="text-xs text-gray-400 tracking-wider">{{ subtitle }}</p>
    </div>
    <div ref="heatmapRef" class="w-full"></div>
  </div>
</template>