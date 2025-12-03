<script setup>
import { ref, computed } from 'vue'
import { scaleLinear, scaleLog } from 'd3-scale'
import { extent } from 'd3-array'
import { line, curveBasis } from 'd3-shape'

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 400,
  },
})

const hoveredRepo = ref(null)

// Define axes
const axes = [
  {
    key: 'size',
    label: 'Size',
    getValue: (r) => r.diskUsage / 1024,
    scale: 'log',
    format: (v) => `${v.toFixed(0)}MB`,
  },
  {
    key: 'stars',
    label: 'Stars',
    getValue: (r) => Math.max(r.stats.stars, 0.1),
    scale: 'log',
    format: (v) => (v < 1 ? '0' : v.toFixed(0)),
  },
  {
    key: 'langs',
    label: 'Langs',
    getValue: (r) => (r.languages ? Object.keys(r.languages).length : 0),
    scale: 'linear',
    format: (v) => v.toFixed(0),
  },
  {
    key: 'age',
    label: 'Age',
    getValue: (r) =>
      Math.floor(
        (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    scale: 'linear',
    format: (v) => `${(v / 365).toFixed(1)}y`,
  },
  {
    key: 'activity',
    label: 'Recent',
    getValue: (r) =>
      Math.floor(
        (Date.now() - new Date(r.pushedAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    scale: 'linear',
    format: (v) => `${v.toFixed(0)}d`,
    reverse: true, // Lower is better
  },
]

// Calculate scales for each axis
const axisScales = computed(() => {
  const padding = 60
  const axisWidth = (props.width - padding * 2) / (axes.length - 1)

  return axes.map((axis, i) => {
    const values = props.repos.map(axis.getValue)
    const [min, max] = extent(values)

    const yScale =
      axis.scale === 'log'
        ? scaleLog()
            .domain([Math.max(min, 0.1), max])
            .range(
              axis.reverse
                ? [padding, props.height - padding]
                : [props.height - padding, padding]
            )
        : scaleLinear()
            .domain([min, max])
            .range(
              axis.reverse
                ? [padding, props.height - padding]
                : [props.height - padding, padding]
            )

    return {
      ...axis,
      x: padding + i * axisWidth,
      yScale,
      ticks: yScale.ticks(5),
    }
  })
})

// Generate line paths for each repo
const repoLines = computed(() => {
  const lineGenerator = line()
    .curve(curveBasis)
    .x((d) => d.x)
    .y((d) => d.y)

  return props.repos.map((repo) => {
    const points = axisScales.value.map((axis) => ({
      x: axis.x,
      y: axis.yScale(axis.getValue(repo)),
    }))

    return {
      repo,
      path: lineGenerator(points),
      color: repo.languageColor || '#666',
    }
  })
})

const handleMouseEnter = (repoLine) => {
  hoveredRepo.value = repoLine.repo
}

const handleMouseLeave = () => {
  hoveredRepo.value = null
}
</script>

<template>
  <div class="parallel-coords-container">
    <svg
      :width="width"
      :height="height"
      class="parallel-coords-svg"
      role="img"
      aria-label="Parallel coordinates of repository metrics"
    >
      <!-- Background lines -->
      <g class="repo-lines" opacity="0.15">
        <path
          v-for="(bgLine, bgIdx) in repoLines"
          :key="`bg-${bgIdx}`"
          :d="bgLine.path"
          :stroke="bgLine.color"
          fill="none"
          stroke-width="1"
        />
      </g>

      <!-- Axes -->
      <g v-for="axis in axisScales" :key="axis.key" class="axis">
        <!-- Axis line -->
        <line
          :x1="axis.x"
          :x2="axis.x"
          :y1="60"
          :y2="height - 60"
          stroke="currentColor"
          stroke-width="2"
          stroke-opacity="0.3"
        />

        <!-- Ticks -->
        <g v-for="tick in axis.ticks" :key="tick">
          <line
            :x1="axis.x - 4"
            :x2="axis.x + 4"
            :y1="axis.yScale(tick)"
            :y2="axis.yScale(tick)"
            stroke="currentColor"
            stroke-opacity="0.3"
          />
          <text :x="axis.x + 8" :y="axis.yScale(tick) + 3" class="tick-label">
            {{ axis.format(tick) }}
          </text>
        </g>

        <!-- Label -->
        <text :x="axis.x" y="40" text-anchor="middle" class="axis-label">
          {{ axis.label }}
        </text>
      </g>

      <!-- Highlighted line (on hover) -->
      <g v-if="hoveredRepo">
        <path
          v-for="(highlightLine, hlIdx) in repoLines.filter(
            (l) => l.repo.name === hoveredRepo.name
          )"
          :key="`hl-${hlIdx}`"
          :d="highlightLine.path"
          :stroke="highlightLine.color"
          fill="none"
          stroke-width="3"
          opacity="1"
        />
      </g>

      <!-- Interactive overlay -->
      <g class="interactive-lines">
        <path
          v-for="(interactiveLine, intIdx) in repoLines"
          :key="`int-${intIdx}`"
          :d="interactiveLine.path"
          stroke="transparent"
          fill="none"
          stroke-width="10"
          class="cursor-pointer"
          @mouseenter="handleMouseEnter(interactiveLine)"
          @mouseleave="handleMouseLeave"
        />
      </g>
    </svg>

    <!-- Tooltip -->
    <div v-if="hoveredRepo" class="parallel-tooltip">
      <div class="tooltip-title">{{ hoveredRepo.name }}</div>
      <div class="tooltip-stats">
        <div v-for="axis in axisScales" :key="axis.key">
          <span class="stat-label">{{ axis.label }}:</span>
          <span class="stat-value">
            {{ axis.format(axis.getValue(hoveredRepo)) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="viz-title">Multi-Dimensional Repository Comparison</div>
    <div class="viz-subtitle">
      Parallel coordinates showing {{ repos.length }} repos across
      {{ axes.length }} dimensions
    </div>
  </div>
</template>

<style scoped>
.parallel-coords-container {
  @apply relative;
  @apply bg-white dark:bg-zinc-950;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply p-4;
}

.parallel-coords-svg {
  @apply w-full;
  @apply text-zinc-400 dark:text-zinc-600;
}

.axis-label {
  @apply text-xs font-mono font-medium;
  @apply fill-zinc-900 dark:fill-zinc-100;
}

.tick-label {
  @apply text-[10px] font-mono;
  @apply fill-zinc-500 dark:fill-zinc-500;
}

.parallel-tooltip {
  @apply absolute top-4 right-4;
  @apply bg-white dark:bg-zinc-900;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply p-3 shadow-lg;
  @apply max-w-xs;
}

.tooltip-title {
  @apply text-sm font-mono font-medium mb-2;
  @apply text-zinc-900 dark:text-zinc-100;
}

.tooltip-stats {
  @apply space-y-1 text-xs font-mono;
}

.stat-label {
  @apply text-zinc-500 dark:text-zinc-500;
  @apply mr-2;
}

.stat-value {
  @apply text-zinc-900 dark:text-zinc-100 tabular-nums;
}

.viz-title {
  @apply text-xs font-mono uppercase tracking-wider;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply mt-4 mb-1;
}

.viz-subtitle {
  @apply text-[10px] font-mono;
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
