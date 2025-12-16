<!--
  @file CommitMatrix.client.vue
  @description Canvas-based commit visualization plotting commits by time (Y-axis) and day of week (X-axis)
  @props commits: Array - Array of commit objects with date, repo properties
  @props height: number - Canvas height in pixels
-->
<template>
  <div
    ref="containerRef"
    class="commit-matrix"
    :style="{ height: `${height}px` }"
  >
    <!-- Day labels (top) -->
    <div class="day-labels">
      <div
        v-for="(day, index) in [
          'Mon',
          'Tue',
          'Wed',
          'Thu',
          'Fri',
          'Sat',
          'Sun',
        ]"
        :key="day"
        class="day-label"
        :style="{ left: `${(index / 7) * 85 + 7.5}%` }"
      >
        {{ day }}
      </div>
    </div>

    <!-- Year labels (left) -->
    <div class="year-labels">
      <div
        v-for="yearLabel in yearLabels"
        :key="yearLabel.year"
        class="year-label"
        :style="{ top: `${yearLabel.position}px` }"
      >
        {{ yearLabel.year }}
      </div>
    </div>
    <canvas
      ref="canvasRef"
      class="commit-canvas"
      @mousemove="handleMouseMove"
      @mouseleave="hideTooltip"
    />

    <!-- Tooltip -->
    <div
      v-if="hoveredCommit"
      class="commit-tooltip"
      :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
    >
      <div class="tooltip-date">
        {{ formatDate(hoveredCommit.date) }}
      </div>
      <div class="tooltip-repo">{{ hoveredCommit.repo }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  commits: {
    type: Array,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
})

const containerRef = ref(null)
const canvasRef = ref(null)
const hoveredCommit = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
let commitPositions = []

// Calculate year labels
const yearLabels = computed(() => {
  if (!props.commits || props.commits.length === 0) return []

  const sorted = [...props.commits].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  const startDate = new Date(sorted[0].date)
  const endDate = new Date(sorted[sorted.length - 1].date)
  const timeRange = endDate - startDate

  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const labels = []

  for (let year = startYear; year <= endYear; year++) {
    const yearDate = new Date(year, 0, 1)
    const progress = (yearDate - startDate) / timeRange
    const position = (1 - progress) * props.height

    labels.push({ year, position })
  }

  return labels
})

// Draw dots
function drawCommits() {
  if (!canvasRef.value || !props.commits.length) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const width = canvas.offsetWidth
  const height = props.height

  // Set canvas resolution
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)

  // Clear
  ctx.clearRect(0, 0, width, height)

  // Sort commits
  const sorted = [...props.commits].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  const startDate = new Date(sorted[0].date)
  const endDate = new Date(sorted[sorted.length - 1].date)
  const timeRange = endDate - startDate

  // Draw dots and store positions
  ctx.fillStyle = '#ffffff' // White
  commitPositions = []

  sorted.forEach((commit) => {
    const date = new Date(commit.date)
    const timeProgress = (date - startDate) / timeRange

    // Y = 0 at top (newest), height at bottom (oldest)
    const y = (1 - timeProgress) * height

    // X = time within the week (Monday 00:00 = 0, Sunday 23:59 = 1)
    // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayOfWeek = date.getDay()
    // Convert to Monday=0, Sunday=6
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    // Total seconds into the week
    const secondsIntoWeek =
      mondayBasedDay * 86400 + hours * 3600 + minutes * 60 + seconds
    const totalSecondsInWeek = 7 * 86400
    const weekProgress = secondsIntoWeek / totalSecondsInWeek

    const x = weekProgress * width * 0.85 + width * 0.075

    // Store position for hover detection
    commitPositions.push({ x, y, commit })

    // Draw dot (1px radius for high DPI)
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, Math.PI * 2)
    ctx.fill()
  })
}

// Find nearest commit on hover
function handleMouseMove(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Find closest commit within 10px
  let closest = null
  let minDist = 10

  for (const pos of commitPositions) {
    const dist = Math.sqrt((pos.x - mouseX) ** 2 + (pos.y - mouseY) ** 2)
    if (dist < minDist) {
      minDist = dist
      closest = pos
    }
  }

  if (closest) {
    hoveredCommit.value = closest.commit
    tooltipX.value = mouseX + 15
    tooltipY.value = mouseY + 15
  } else {
    hoveredCommit.value = null
  }
}

function hideTooltip() {
  hoveredCommit.value = null
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  nextTick(() => {
    drawCommits()
  })
})

watch(() => props.commits, drawCommits)
</script>

<style scoped>
.commit-matrix {
  position: relative;
  width: 100%;
  margin: 4rem 0;
  overflow: hidden;
  padding-top: 1.5rem;
}

.day-labels {
  position: absolute;
  top: 0;
  left: 3rem;
  right: 0;
  height: 1.5rem;
  pointer-events: none;
  z-index: 10;
}

.day-label {
  position: absolute;
  font-family: monospace;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  white-space: nowrap;
}

.year-labels {
  position: absolute;
  left: 0.5rem;
  top: 1.5rem;
  bottom: 0;
  width: 3rem;
  pointer-events: none;
  z-index: 10;
}

.year-label {
  position: absolute;
  left: 0;
  font-family: monospace;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.3);
  transform: translateY(-50%);
  white-space: nowrap;
}

.commit-canvas {
  display: block;
  width: calc(100% - 3rem);
  margin-left: 3rem;
  image-rendering: crisp-edges;
  cursor: crosshair;
}

.commit-tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #18181b;
  padding: 6px 10px;
  border-radius: 2px;
  border: 1px solid #e4e4e7;
  font-family: monospace;
  font-size: 10px;
  pointer-events: none;
  z-index: 100;
  line-height: 1.4;
  white-space: nowrap;
}

.tooltip-date {
  color: #ff1493;
  margin-bottom: 2px;
}

.tooltip-repo {
  color: #71717a;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .day-label {
    color: rgba(255, 255, 255, 0.3);
  }

  .year-label {
    color: rgba(255, 255, 255, 0.3);
  }

  .commit-tooltip {
    background: rgba(9, 9, 11, 0.95);
    backdrop-filter: blur(8px);
    color: #fafafa;
    border-color: #27272a;
  }

  .tooltip-date {
    color: #ff1493;
  }

  .tooltip-repo {
    color: #a1a1aa;
  }
}
</style>
