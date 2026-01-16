<!--
  @file CommitMatrix.client.vue
  @description Canvas-based unit chart visualization - renders 20K+ commits efficiently
  @props commits: Array - Array of commit objects with date, repo properties
-->
<template>
  <div ref="containerRef" class="commit-matrix">
    <!-- Legend -->
    <div class="matrix-legend">
      <span class="legend-dot legend-dot--recent"></span>
      <span class="legend-dot legend-dot--year"></span>
      <span class="legend-dot legend-dot--older"></span>
    </div>

    <!-- Canvas-based unit chart -->
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        @mousemove="handleMouseMove"
        @mouseleave="hideTooltip"
      ></canvas>
    </div>

    <!-- Tooltip -->
    <div
      v-if="hoveredCommit"
      class="commit-tooltip"
      :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
    >
      <div class="tooltip-date">{{ formatDate(hoveredCommit.date) }}</div>
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
})

const containerRef = ref(null)
const canvasRef = ref(null)
const hoveredCommit = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

// Grid settings
const CELL_SIZE = 4
const GAP = 1
const STEP = CELL_SIZE + GAP

// Store commit positions for hover detection
let commitGrid = []
let cols = 0

// Colors
const getColor = (daysDiff, isDark) => {
  if (daysDiff <= 30) return isDark ? '#fafafa' : '#3f3f46'
  if (daysDiff <= 365) return isDark ? '#a1a1aa' : '#71717a'
  return isDark ? '#52525b' : '#a1a1aa'
}

function draw() {
  if (!canvasRef.value || !props.commits?.length) return

  const canvas = canvasRef.value
  const container = containerRef.value
  const ctx = canvas.getContext('2d')
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // Calculate grid dimensions
  const containerWidth = container.offsetWidth - 16 // padding
  cols = Math.floor(containerWidth / STEP)
  const rows = Math.ceil(props.commits.length / cols)
  const height = Math.min(rows * STEP + 8, 300) // max 300px

  // Set canvas size
  const dpr = window.devicePixelRatio || 1
  canvas.width = containerWidth * dpr
  canvas.height = height * dpr
  canvas.style.width = `${containerWidth}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  // Clear
  ctx.clearRect(0, 0, containerWidth, height)

  // Sort commits newest first
  const sorted = [...props.commits].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  // Draw commits and build grid
  const now = new Date()
  commitGrid = []

  sorted.forEach((commit, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = col * STEP
    const y = row * STEP

    const date = new Date(commit.date)
    const daysDiff = (now - date) / (1000 * 60 * 60 * 24)

    ctx.fillStyle = getColor(daysDiff, isDark)
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

    // Store for hover
    commitGrid.push({ x, y, commit })
  })
}

function handleMouseMove(event) {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Find which cell we're hovering
  const col = Math.floor(mouseX / STEP)
  const row = Math.floor(mouseY / STEP)
  const index = row * cols + col

  if (index >= 0 && index < commitGrid.length) {
    const item = commitGrid[index]
    // Check if actually within cell bounds
    const cellX = col * STEP
    const cellY = row * STEP
    if (
      mouseX >= cellX &&
      mouseX < cellX + CELL_SIZE &&
      mouseY >= cellY &&
      mouseY < cellY + CELL_SIZE
    ) {
      hoveredCommit.value = item.commit
      tooltipX.value = event.clientX - containerRef.value.getBoundingClientRect().left + 10
      tooltipY.value = event.clientY - containerRef.value.getBoundingClientRect().top - 40
      return
    }
  }
  hoveredCommit.value = null
}

function hideTooltip() {
  hoveredCommit.value = null
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

onMounted(() => {
  nextTick(draw)
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
})

watch(() => props.commits, draw)
</script>

<style scoped>
.commit-matrix {
  position: relative;
  width: 100%;
  margin: 2rem 0;
}

.matrix-legend {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 1px;
}

.legend-dot--recent { background: #3f3f46; }
.legend-dot--year { background: #71717a; }
.legend-dot--older { background: #a1a1aa; }

.canvas-container {
  padding: 0.5rem;
  background: #fafafa;
  border-radius: 4px;
  max-height: 300px;
  overflow: hidden;
}

.canvas-container canvas {
  display: block;
  cursor: crosshair;
}

.commit-tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #18181b;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #e4e4e7;
  font-family: monospace;
  font-size: 10px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tooltip-date { font-weight: 500; margin-bottom: 2px; }
.tooltip-repo { color: #71717a; }

@media (prefers-color-scheme: dark) {
  .legend-dot--recent { background: #fafafa; }
  .legend-dot--year { background: #a1a1aa; }
  .legend-dot--older { background: #52525b; }

  .canvas-container { background: #18181b; }

  .commit-tooltip {
    background: rgba(24, 24, 27, 0.95);
    color: #fafafa;
    border-color: #3f3f46;
  }

  .tooltip-repo { color: #a1a1aa; }
}
</style>
