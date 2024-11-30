<template>
  <div ref="container" class="relative w-full h-full">
    <!-- Loading state -->
    <div v-if="!props.data?.values?.length" class="absolute inset-0 flex items-center justify-center">
      <div class="text-gray-400 text-sm">Loading data...</div>
    </div>

    <!-- SVG Container -->
    <div ref="svgContainer" class="w-full h-full">
      <!-- SVG will be injected here by D3 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { select } from 'd3-selection'
import { scaleLinear, scaleTime } from 'd3-scale'
import { extent, max } from 'd3-array'
import { line, curveMonotoneX } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { timeFormat } from 'd3-time-format'
import { useDark } from '@vueuse/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const container = ref(null)
const svgContainer = ref(null)

const drawChart = () => {
  if (!container.value || !props.data?.values?.length || !svgContainer.value) return

  // Clear previous
  select(svgContainer.value).selectAll('svg').remove()

  // Get container dimensions
  const containerRect = container.value.getBoundingClientRect()

  // Set margins
  const margin = { top: 10, right: 20, bottom: 20, left: 40 }
  const width = containerRect.width - margin.left - margin.right
  const height = containerRect.height - margin.top - margin.bottom

  // Create SVG
  const svg = select(svgContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Create scales
  const xScale = scaleTime()
    .domain(extent(props.data.values.map((d, i) => new Date(props.data.labels[i]))))
    .range([0, width])

  const yScale = scaleLinear()
    .domain([0, max(props.data.values) * 1.1]) // Add 10% padding
    .range([height, 0])

  // Create line generator
  const linePath = line()
    .x((d, i) => xScale(new Date(props.data.labels[i])))
    .y(d => yScale(d))
    .curve(curveMonotoneX)

  // Add axes
  const isDark = useDark()
  const axisColor = isDark.value ? '#666' : '#999'

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(xScale)
      .ticks(5)
      .tickFormat(timeFormat('%b %d')))
    .attr('color', axisColor)
    .attr('font-size', '10px')

  svg.append('g')
    .call(axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => d))
    .attr('color', axisColor)
    .attr('font-size', '10px')

  // Add the line path
  svg.append('path')
    .datum(props.data.values)
    .attr('fill', 'none')
    .attr('stroke', isDark.value ? '#3b82f6' : '#2563eb') // blue-500/600
    .attr('stroke-width', 1.5)
    .attr('d', linePath)

  // Add dots at data points
  svg.selectAll('.dot')
    .data(props.data.values)
    .join('circle')
    .attr('class', 'dot')
    .attr('cx', (d, i) => xScale(new Date(props.data.labels[i])))
    .attr('cy', d => yScale(d))
    .attr('r', 2)
    .attr('fill', isDark.value ? '#3b82f6' : '#2563eb')
}

// Setup watchers and lifecycle hooks
watch(() => props.data, drawChart, { deep: true })

onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    if (container.value && container.value.offsetWidth > 0 && container.value.offsetHeight > 0) {
      drawChart()
    }
  })

  if (container.value) {
    resizeObserver.observe(container.value)
  }

  drawChart()
})
</script>

<style scoped>
.dot {
  transition: r 0.2s ease;
}

.dot:hover {
  r: 4;
}
</style>