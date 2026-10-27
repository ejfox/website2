<!--
  @file CommitMatrix.client.vue
  @description Canvas unit chart: one 4px cell per commit, newest first, shaded
    by age (≤30 days, ≤1 year, older). Canvas, not SVG, because there are
    tens of thousands of cells. Used by pages/stats.vue ("Every commit I have
    ever made"). Gotcha: the canvas is capped at 300px tall, so on long
    histories the oldest commits fall below the fold and aren't drawn visibly.
  @props commits: Array - { date, repo }[]
-->
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

const CELL_SIZE = 4
const GAP = 1
const STEP = CELL_SIZE + GAP

// Store commit positions for hover detection. Plain (non-reactive) on
// purpose: a reactive array of 20K+ objects would be pure overhead.
let commitGrid = []
let cols = 0

// Three age bands; the legend dots in <style> mirror these hex values, so
// change both together.
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
  // Read at draw time: canvas pixels don't follow CSS, so a theme change only
  // shows up on the next redraw (resize or new commits).
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const containerWidth = container.offsetWidth - 16 // .canvas-container padding, 0.5rem × 2
  cols = Math.floor(containerWidth / STEP)
  const rows = Math.ceil(props.commits.length / cols)
  const height = Math.min(rows * STEP + 8, 300) // max 300px

  // Backing store at device pixels, CSS size at layout pixels, so cells stay
  // crisp on retina. Setting canvas.width resets the transform, so scale()
  // doesn't compound across redraws.
  const dpr = window.devicePixelRatio || 1
  canvas.width = containerWidth * dpr
  canvas.height = height * dpr
  canvas.style.width = `${containerWidth}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, containerWidth, height)

  const sorted = [...props.commits].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

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

    commitGrid.push({ x, y, commit })
  })
}

function handleMouseMove(event) {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // O(1) hit test: invert the grid layout instead of searching commitGrid.
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
      tooltipX.value =
        event.clientX - containerRef.value.getBoundingClientRect().left + 10
      tooltipY.value =
        event.clientY - containerRef.value.getBoundingClientRect().top - 40
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

// Client-only component (.client.vue), so window access here is safe.
onMounted(() => {
  nextTick(draw)
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
})

watch(() => props.commits, draw)
</script>

<template>
  <div ref="containerRef" class="commit-matrix">
    <div class="matrix-legend">
      <span class="legend-dot legend-dot--recent"></span>
      <span class="legend-dot legend-dot--year"></span>
      <span class="legend-dot legend-dot--older"></span>
    </div>

    <!-- Canvas-based unit chart -->
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        role="img"
        aria-label="Unit chart of every GitHub commit, one cell per commit"
        @mousemove="handleMouseMove"
        @mouseleave="hideTooltip"
      ></canvas>
    </div>

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

.legend-dot--recent {
  background: #3f3f46;
}
.legend-dot--year {
  background: #71717a;
}
.legend-dot--older {
  background: #a1a1aa;
}

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
  @apply font-mono;
  font-size: 10px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tooltip-date {
  font-weight: 500;
  margin-bottom: 2px;
}
.tooltip-repo {
  color: #71717a;
}

@media (prefers-color-scheme: dark) {
  .legend-dot--recent {
    background: #fafafa;
  }
  .legend-dot--year {
    background: #a1a1aa;
  }
  .legend-dot--older {
    background: #52525b;
  }

  .canvas-container {
    background: #000;
  }

  .commit-tooltip {
    background: rgba(24, 24, 27, 0.95);
    color: #fafafa;
    border-color: #3f3f46;
  }

  .tooltip-repo {
    color: #a1a1aa;
  }
}
</style>
