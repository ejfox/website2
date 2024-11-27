<template>
  <div ref="container" class="relative w-full h-full">
    <!-- Loading state -->
    <div v-if="!props.data?.values" class="absolute inset-0 flex items-center justify-center">
      <div class="text-gray-400 text-sm">Loading data...</div>
    </div>

    <!-- Tooltip -->
    <div ref="tooltip"
      class="absolute hidden z-10 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-[250px]">
      <div class="font-mono"></div>
    </div>

    <!-- SVG Container -->
    <div class="w-full h-full" ref="svgContainer">
      <!-- SVG will be injected here by D3 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateBlues } from 'd3-scale-chromatic'
import { select } from 'd3-selection'
import { max } from 'd3-array'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const container = ref(null)
const svgContainer = ref(null)
const tooltip = ref(null)

const DAYS_TO_SHOW = 365 // Show full year
const DAYS_IN_WEEK = 7
const CELL_PADDING = 2

const drawHeatmap = () => {
  if (!container.value || !props.data?.values || !svgContainer.value) return

  // Clear previous
  select(svgContainer.value).selectAll('svg').remove()

  // Get container dimensions
  const containerRect = container.value.getBoundingClientRect()
  const CELL_SIZE = Math.floor(Math.min(
    containerRect.height / 9, // Increased from 8 to 9 for better spacing
    containerRect.width / 54 // Increased from 53 to 54 for better spacing
  ))

  const values = props.data.values.slice(-DAYS_TO_SHOW)
  const details = props.data.details || Array(DAYS_TO_SHOW).fill([])

  // Calculate dimensions
  const weeks = Math.ceil(DAYS_TO_SHOW / DAYS_IN_WEEK)
  const width = (CELL_SIZE + CELL_PADDING) * weeks + 50 // Extra space for labels
  const height = (CELL_SIZE + CELL_PADDING) * DAYS_IN_WEEK + 30 // Extra space for labels

  // Create SVG with responsive sizing
  const svg = select(svgContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // Create color scale
  const maxValue = max(values) || 0
  const colorScale = scaleSequential()
    .domain([0, maxValue])
    .interpolator(interpolateBlues)

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

  svg.selectAll('.month-label')
    .data(monthPositions)
    .join('text')
    .attr('class', 'month-label')
    .attr('x', d => d.x)
    .attr('y', 10)
    .attr('font-size', '9px')
    .attr('fill', '#666')
    .text(d => d.month)

  // Create day labels (Mon, Wed, Fri)
  const days = ['Mon', 'Wed', 'Fri']
  svg.selectAll('.day-label')
    .data(days)
    .join('text')
    .attr('class', 'day-label')
    .attr('x', 0)
    .attr('y', (d, i) => (i * 2 + 1) * (CELL_SIZE + CELL_PADDING) + 20)
    .attr('font-size', '9px')
    .attr('fill', '#666')
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .text(d => d)

  // Create contribution cells
  const cellGroup = svg.append('g')
    .attr('transform', `translate(35, 25)`) // Adjusted position

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
    .on('mouseover', (event, d, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (DAYS_TO_SHOW - i - 1))

      const repos = details[i] || []

      tooltip.value.innerHTML = `
        <div class="space-y-1">
          <div class="font-semibold">${date.toLocaleDateString()}</div>
          <div class="text-blue-200">${d} commits</div>
          ${repos.length ? `
            <div class="text-gray-300 mt-2 mb-1">Repositories:</div>
            <div class="max-h-32 overflow-y-auto">
              ${repos.map(repo => `
                <div class="flex justify-between gap-2 py-0.5">
                  <span class="text-gray-400">${repo.name}</span>
                  <span class="text-gray-500">${repo.count}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `

      const tooltipEl = tooltip.value
      const containerRect = container.value.getBoundingClientRect()
      const x = event.pageX - containerRect.left
      const y = event.pageY - containerRect.top

      tooltipEl.style.left = `${x + 10}px`
      tooltipEl.style.top = `${y + 10}px`
      tooltipEl.classList.remove('hidden')
    })
    .on('mouseout', () => {
      tooltip.value.classList.add('hidden')
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
</style>