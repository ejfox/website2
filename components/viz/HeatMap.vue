<template>
  <div ref="container" class="relative w-full h-full">
    <!-- Loading state -->
    <div v-if="!props.data?.values" class="absolute inset-0 flex items-center justify-center">
      <div class="text-zinc-400 dark:text-zinc-500 text-sm">Loading data...</div>
    </div>

    <!-- Tooltip -->
    <div v-show="hoveredCellData && !isOutside" class="absolute z-10 px-3 py-2 text-xs backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 
                rounded-lg shadow-lg border border-zinc-100/20 dark:border-zinc-800/20 transition-all duration-200 pointer-events-none" :style="{
                  left: `${tooltipX}px`,
                  top: `${tooltipY}px`,
                }">
      <div class="space-y-1">
        <div class="font-medium">{{ hoveredCellData?.date }}</div>
        <div class="text-blue-500 dark:text-blue-400">
          {{ hoveredCellData?.count }} {{ hoveredCellData?.count === 1 ? 'item' : 'items' }}
        </div>
        <div v-if="hoveredCellData?.details?.length" class="pt-1 space-y-1">
          <div v-for="detail in hoveredCellData.details" :key="detail.name"
            class="flex items-center justify-between gap-4">
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
import { useMouseInElement, useDark, useElementBounding } from '@vueuse/core'
import { format, differenceInDays, parseISO, getDay } from 'date-fns'
import { useTransition } from '~/composables/useTransition'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  startDate: {
    type: String,
    default: () => format(new Date(), 'yyyy-MM-dd')
  },
  endDate: {
    type: String,
    default: () => format(new Date(), 'yyyy-MM-dd')
  },
  showFullYear: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: false
  },
  legendLabels: {
    type: Object,
    default: () => ({
      start: 'Less Frequent',
      end: 'More Frequent'
    })
  }
})

const container = ref(null)
const svgContainer = ref(null)
const hoveredCellData = ref(null)

// Get mouse position and element bounds
const {
  elementX,
  elementY,
  isOutside,
} = useMouseInElement(container)
const bounds = useElementBounding(container)

// Compute tooltip position with better bounds checking and positioning
const tooltipX = computed(() => {
  if (!container.value || !hoveredCellData.value) return 0
  // Position tooltip to the right of cursor by default
  let x = elementX.value + 10

  // If tooltip would overflow right edge, show it to the left of cursor instead
  if (x + 200 > bounds.width.value) {
    x = elementX.value - 210
  }

  // Ensure tooltip stays within container bounds
  return Math.max(10, Math.min(x, bounds.width.value - 210))
})

const tooltipY = computed(() => {
  if (!container.value || !hoveredCellData.value) return 0
  // Position tooltip below cursor by default
  let y = elementY.value + 10

  // If tooltip would overflow bottom edge, show it above cursor instead
  if (y + 100 > bounds.height.value) {
    y = elementY.value - 110
  }

  // Ensure tooltip stays within container bounds
  return Math.max(10, Math.min(y, bounds.height.value - 110))
})

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
const CELL_PADDING = 2
const MARGIN = {
  top: 24,
  right: 24,
  bottom: 24,
  left: 24
}

const DAYS = ['Mon', 'Wed', 'Fri']

// Helper to check if a date is a weekend
const isWeekend = (date) => {
  const day = getDay(date)
  return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
}

// Create smooth transitions for our data
const transitionedValues = useTransition(computed(() => props.data.values))

const drawHeatmap = () => {
  if (!container.value || !props.data?.values || !svgContainer.value) return

  // Clear previous
  select(svgContainer.value).selectAll('svg').remove()

  const containerRect = container.value.getBoundingClientRect()
  const daysToShow = props.showFullYear
    ? DAYS_TO_SHOW
    : Math.min(
      differenceInDays(parseISO(props.endDate), parseISO(props.startDate)) + 1,
      DAYS_TO_SHOW
    )

  // Determine if we should use horizontal layout
  const useHorizontalLayout = daysToShow <= 15

  // Calculate optimal cell size based on container and layout
  const CELL_SIZE = Math.floor(
    useHorizontalLayout
      ? Math.min(
        (containerRect.width - MARGIN.left - MARGIN.right) / daysToShow,
        containerRect.height - MARGIN.top - MARGIN.bottom - 40
      )
      : Math.min(
        (containerRect.height - MARGIN.top - MARGIN.bottom) / DAYS_IN_WEEK,
        (containerRect.width - MARGIN.left - MARGIN.right) / Math.ceil(daysToShow / DAYS_IN_WEEK)
      )
  )

  const values = transitionedValues.value.slice(-daysToShow)
  const details = props.data.details || Array(daysToShow).fill([])

  // Calculate dimensions based on layout
  let width, height
  if (useHorizontalLayout) {
    width = (CELL_SIZE + CELL_PADDING) * daysToShow + MARGIN.left + MARGIN.right
    height = CELL_SIZE + MARGIN.top + MARGIN.bottom + 30
  } else {
    const weeks = Math.ceil(daysToShow / DAYS_IN_WEEK)
    width = (CELL_SIZE + CELL_PADDING) * weeks + MARGIN.left + MARGIN.right
    height = (CELL_SIZE + CELL_PADDING) * DAYS_IN_WEEK + MARGIN.top + MARGIN.bottom
  }

  const svgHeight = props.showLegend ? height + 32 : height

  // Create SVG
  const svg = select(svgContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // Create color scale based on visible data only
  const maxValue = max(values.slice(0, daysToShow)) || 0
  const isDark = useDark()

  // Check if we have any non-zero values
  const hasData = values.some(v => v > 0)

  // custom dark interpolator
  const darkInterpolator = (t) => {
    return isDark.value
      ? `rgb(${interpolateTurbo(t).match(/\d+/g).map(n => n * 0.9).join(', ')})`
      : interpolateTurbo(t)
  }

  const colorScale = scaleSequential()
    .domain([0, maxValue || 1]) // Prevent 0-0 domain
    .interpolator(isDark.value ? darkInterpolator : interpolateBlues)

  // Create month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const startDateObj = parseISO(props.startDate)
  const monthPositions = []

  // Calculate month positions based on the date range
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDateObj)
    date.setMonth(startDateObj.getMonth() + i)
    if (date > parseISO(props.endDate)) break
    const weekOffset = Math.floor(differenceInDays(date, startDateObj) / 7)
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
    .attr('x', d => d.x + MARGIN.left)
    .attr('y', MARGIN.top - 8)
    .attr('font-size', '9px')
    .attr('fill', isDark.value ? '#666' : '#555')
    .text(d => d.month)

  // Move day labels closer
  if (!useHorizontalLayout) {
    svg.selectAll('.day-label')
      .data(DAYS)
      .join('text')
      .attr('class', 'day-label')
      .attr('x', MARGIN.left - 8)
      .attr('y', (d, i) => (i * 2 + 1) * (CELL_SIZE + CELL_PADDING) + MARGIN.top)
      .attr('font-size', '9px')
      .attr('fill', isDark.value ? '#666' : '#555')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .text(d => d)
  }

  // Adjust cell positioning for horizontal layout
  const cellGroup = svg.append('g')
    .attr('transform', useHorizontalLayout
      ? `translate(${MARGIN.left}, ${MARGIN.top})`
      : `translate(${MARGIN.left}, ${MARGIN.top})`)

  const cells = cellGroup.selectAll('.contribution')
    .data(values)
    .join('rect')
    .attr('class', 'contribution')
    .attr('width', CELL_SIZE)
    .attr('height', CELL_SIZE)
    .attr('rx', 2)
    .attr('x', (d, i) => {
      if (useHorizontalLayout) {
        return i * (CELL_SIZE + CELL_PADDING)
      }
      return Math.floor((daysToShow - i - 1) / 7) * (CELL_SIZE + CELL_PADDING)
    })
    .attr('y', (d, i) => {
      if (useHorizontalLayout) {
        return 0
      }
      return (daysToShow - i - 1) % 7 * (CELL_SIZE + CELL_PADDING)
    })
    .attr('fill', d => {
      if (!hasData) return isDark.value ? '#1e293b' : '#f1f5f9' // slate-800 : slate-100
      const color = colorScale(d)
      return isWeekend(new Date(startDateObj.getTime() + ((daysToShow - values.indexOf(d) - 1) * 24 * 60 * 60 * 1000)))
        ? `${color.replace('rgb', 'rgba').replace(')', ', 0.85)')}` // Reduce saturation for weekends
        : color
    })
    .attr('opacity', (d, i) => {
      const dayOffset = daysToShow - i - 1
      const cellDate = new Date(startDateObj.getTime() + (dayOffset * 24 * 60 * 60 * 1000))
      // Reduce opacity more for empty data
      const baseOpacity = hasData ? 1 : 0.5
      return baseOpacity // Let the fill color handle the weekend distinction
    })
    .on('mouseenter', (event, d, i) => {
      // Calculate date for this cell
      const dayOffset = daysToShow - values.indexOf(d) - 1
      const timestamp = startDateObj.getTime() + (dayOffset * 24 * 60 * 60 * 1000)
      const cellDate = new Date(timestamp)

      // Update hovered cell data
      hoveredCellData.value = {
        date: formatDate(cellDate),
        count: d,
        details: details[i] || []
      }
    })
    .on('mouseleave', () => {
      hoveredCellData.value = null
    })

  // Add a subtle grid
  cellGroup.selectAll('.grid')
    .data(values)
    .join('rect')
    .attr('class', 'grid')
    .attr('width', CELL_SIZE)
    .attr('height', CELL_SIZE)
    .attr('rx', 2)
    .attr('x', (d, i) => Math.floor((daysToShow - i - 1) / 7) * (CELL_SIZE + CELL_PADDING))
    .attr('y', (d, i) => (daysToShow - i - 1) % 7 * (CELL_SIZE + CELL_PADDING))
    .attr('fill', 'none')
    .attr('stroke', isDark.value ? '#ffffff08' : '#00000008')

  // Add date labels for horizontal layout
  if (useHorizontalLayout) {
    cellGroup.selectAll('.date-label')
      .data(values)
      .join('text')
      .attr('class', 'date-label')
      .attr('x', (d, i) => i * (CELL_SIZE + CELL_PADDING) + (CELL_SIZE / 2))
      .attr('y', CELL_SIZE + 20)
      .attr('font-size', '9px')
      .attr('fill', isDark.value ? '#666' : '#555')
      .attr('text-anchor', 'middle')
      .text((d, i) => {
        const date = new Date(startDateObj.getTime() + ((daysToShow - i - 1) * 24 * 60 * 60 * 1000))
        return format(date, 'MMM d')
      })
  } else {
    // Original month and day labels code...
  }

  // Create legend if enabled
  if (props.showLegend) {
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${MARGIN.left}, ${height + 16})`)

    // Add legend text
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', 8)
      .attr('font-size', '9px')
      .attr('fill', isDark.value ? '#666' : '#555')
      .text(props.legendLabels.start)

    // Add color squares with better spacing
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
        .attr('fill', hasData ? colorScale(step * maxValue) : (isDark.value ? '#1e293b' : '#f1f5f9'))
    })

    // Add end label with better positioning
    legendGroup.append('text')
      .attr('x', width - 20)
      .attr('y', 8)
      .attr('font-size', '9px')
      .attr('fill', isDark.value ? '#666' : '#555')
      .attr('text-anchor', 'end')
      .text(props.legendLabels.end)
  }
}

// Watch for both data and date changes
watch([() => props.data, () => props.startDate, () => props.endDate], drawHeatmap, { deep: true })

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
  stroke: currentColor;
  stroke-width: 1.5px;
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

/* Ensure text is crisp */
text {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
</style>