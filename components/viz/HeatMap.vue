<template>
  <div ref="container" class="relative w-full h-full">
    <!-- Loading state -->
    <div v-if="!props.data?.values" class="absolute inset-0 flex items-center justify-center">
      <div class="text-gray-400 text-sm">Loading data...</div>
    </div>

    <!-- Tooltip -->
    <div v-show="hoveredCell" class="absolute z-10 px-3 py-2 text-xs backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 
             rounded-lg shadow-lg border border-gray-100/20 transition-opacity duration-200" :style="{
              left: `${tooltipX}px`,
              top: `${tooltipY}px`,
              pointerEvents: 'none',
            }">
      <div class="space-y-1">
        <div class="font-medium">{{ hoveredCell?.date }}</div>
        <div class="text-blue-500 dark:text-blue-400">
          {{ hoveredCell?.count }} {{ hoveredCell?.count === 1 ? 'item' : 'items' }}
        </div>
        <div v-if="hoveredCell?.details?.length" class="pt-1 space-y-1">
          <div v-for="detail in hoveredCell.details" :key="detail.name" class="flex items-center justify-between gap-4">
            <span class="text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{{ detail.name }}</span>
            <span class="text-gray-400 dark:text-gray-500 tabular-nums">{{ detail.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SVG Container -->
    <div ref="svgContainer" class="w-full h-full">
      <!-- SVG will be injected here by D3 -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { scaleSequential } from 'd3-scale'
import { interpolateBlues, interpolateTurbo } from 'd3-scale-chromatic'
import { select } from 'd3-selection'
import { max } from 'd3-array'
import { useMouseInElement, useDark } from '@vueuse/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const container = ref(null)
const svgContainer = ref(null)
const hoveredCell = ref(null)

// Use mouse for smooth tooltip positioning only
const { x, y } = useMouseInElement(container)

// Compute tooltip position
const tooltipX = computed(() => Math.min(x.value + 10, (container.value?.offsetWidth || 0) - 200))
const tooltipY = computed(() => Math.min(y.value + 10, (container.value?.offsetHeight || 0) - 100))

// Format date for tooltip
const formatDate = (date) => {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Constants
const DAYS_TO_SHOW = 365
const DAYS_IN_WEEK = 7
const CELL_PADDING = 1
const DAYS = ['Mon', 'Wed', 'Fri']

const drawHeatmap = () => {
  if (!container.value || !props.data?.values || !svgContainer.value) return

  // Clear previous
  select(svgContainer.value).selectAll('svg').remove()

  // Get container dimensions
  const containerRect = container.value.getBoundingClientRect()

  // Calculate optimal cell size based on container
  const CELL_SIZE = Math.floor(Math.min(
    (containerRect.height - 10) / 7, // Reduced padding from 15 to 10
    (containerRect.width - 25) / 53
  ))

  const values = props.data.values.slice(-DAYS_TO_SHOW)
  const details = props.data.details || Array(DAYS_TO_SHOW).fill([])

  // Tighter dimensions calculation
  const weeks = Math.ceil(DAYS_TO_SHOW / DAYS_IN_WEEK)
  const width = (CELL_SIZE + CELL_PADDING) * weeks + 25
  const height = (CELL_SIZE + CELL_PADDING) * DAYS_IN_WEEK + 12 // Reduced from 15 to 12

  // Create SVG with tighter viewBox
  const svg = select(svgContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // Create color scale
  const maxValue = max(values) || 0

  const isDark = useDark()

  // custom dark interpolator
  const darkInterpolator = (t) => {
    // return interpolateRdBu(1 - t)
    // Unhandled Promise Rejection: ReferenceError: Can't find variable: interpolateRdBu
    // need a real d3 interpolator
    // like turbo
    return interpolateTurbo(t)
  }

  const colorScale = scaleSequential()
    .domain([0, maxValue])
    .interpolator(isDark.value ? darkInterpolator : interpolateBlues)

  // Create month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const today = new Date()
  const monthPositions = []

  for (let i = 0; i < 12; i++) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)
    const weekOffset = Math.floor((DAYS_TO_SHOW - date.getDate()) / 7)
    monthPositions.push({
      month: months[date.getMonth()],
      x: weekOffset * (CELL_SIZE + CELL_PADDING)
    })
  }

  // Adjust month labels to sit closer to cells
  svg.selectAll('.month-label')
    .data(monthPositions)
    .join('text')
    .attr('class', 'month-label')
    .attr('x', d => d.x)
    .attr('y', 4) // Reduced from 6 to 4
    .attr('font-size', '8px') // Slightly smaller
    .attr('fill', '#666')
    .text(d => d.month)

  // Move day labels closer
  svg.selectAll('.day-label')
    .data(DAYS)
    .join('text')
    .attr('class', 'day-label')
    .attr('x', -2)
    .attr('y', (d, i) => (i * 2 + 1) * (CELL_SIZE + CELL_PADDING) + 12)
    .attr('font-size', '8px')
    .attr('fill', '#666')
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .text(d => d)

  // Move cell group even closer to top
  const cellGroup = svg.append('g')
    .attr('transform', `translate(20, 10)`) // Reduced y from 12 to 10

  const cells = cellGroup.selectAll('.contribution')
    .data(values)
    .join('rect')
    .attr('class', 'contribution')
    .attr('width', CELL_SIZE)
    .attr('height', CELL_SIZE)
    .attr('rx', 2)
    .attr('x', (d, i) => Math.floor((DAYS_TO_SHOW - i - 1) / 7) * (CELL_SIZE + CELL_PADDING))
    .attr('y', (d, i) => (DAYS_TO_SHOW - i - 1) % 7 * (CELL_SIZE + CELL_PADDING))
    .attr('fill', d => colorScale(d))
    .on('mouseenter', (event, d, i) => {
      // Calculate date for this cell
      const date = new Date()
      const dayOffset = DAYS_TO_SHOW - i - 1
      const timestamp = date.getTime() - (dayOffset * 24 * 60 * 60 * 1000)
      const cellDate = new Date(timestamp)

      // Update hovered cell data
      hoveredCell.value = {
        date: formatDate(cellDate),
        count: d,
        details: details[i] || []
      }
    })
    .on('mouseleave', () => {
      hoveredCell.value = null
    })
}

// Setup watchers and lifecycle hooks
watch(() => props.data, drawHeatmap, { deep: true })

onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    if (container.value && container.value.offsetWidth > 0 && container.value.offsetHeight > 0) {
      drawHeatmap()
    }
  })

  if (container.value) {
    resizeObserver.observe(container.value)
  }

  drawHeatmap()
})
</script>

<style scoped>
.contribution {
  transition: all 0.2s ease;
}

.contribution:hover {
  stroke: #666;
  stroke-width: 1px;
  filter: brightness(1.1);
}

/* Fade animation for tooltip */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>