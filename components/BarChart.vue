<template>
  <div ref="chartRef" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import { useElementSize } from '@vueuse/core'

interface DataPoint {
  label: string
  value: number
}

interface ChartOptions {
  xAxis?: {
    label?: string
  }
  yAxis?: {
    label?: string
  }
}

const props = defineProps<{
  data: DataPoint[]
  options?: ChartOptions
}>()

const chartRef = ref<HTMLElement>()
const { width, height } = useElementSize(chartRef)

// Draw chart
const drawChart = () => {
  if (!chartRef.value || !width.value || !height.value) return

  // Clear previous content
  d3.select(chartRef.value).selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartWidth = width.value - margin.left - margin.right
  const chartHeight = height.value - margin.top - margin.bottom

  // Create scales
  const x = d3.scaleBand<string>()
    .domain(props.data.map(d => d.label))
    .range([0, chartWidth])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.value) || 0])
    .nice()
    .range([chartHeight, 0])

  // Create SVG
  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', width.value)
    .attr('height', height.value)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Draw bars
  svg.selectAll('rect')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('x', (d: DataPoint) => x(d.label) || 0)
    .attr('y', (d: DataPoint) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d: DataPoint) => chartHeight - y(d.value))
    .attr('fill', 'rgb(57, 211, 83)')
    .attr('rx', 2)

  // Add x-axis
  svg.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('class', 'text-xs text-gray-400')
    .style('text-anchor', 'middle')

  // Add y-axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text')
    .attr('class', 'text-xs text-gray-400')

  // Add axis labels if provided
  if (props.options?.xAxis?.label) {
    svg.append('text')
      .attr('class', 'text-xs text-gray-400')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + margin.bottom)
      .text(props.options.xAxis.label)
  }

  if (props.options?.yAxis?.label) {
    svg.append('text')
      .attr('class', 'text-xs text-gray-400')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left)
      .attr('x', -chartHeight / 2)
      .text(props.options.yAxis.label)
  }
}

// Redraw on size changes or data updates
watch([width, height, () => props.data], () => {
  drawChart()
}, { immediate: true })
</script>