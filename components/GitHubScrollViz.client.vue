<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWindowScroll, useWindowSize } from '@vueuse/core'
import { useRafFn } from '@vueuse/core'
import anime from 'animejs'
import { scaleLinear, scaleTime, scaleLog } from 'd3-scale'
import { extent } from 'd3-array'

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
})

// Window tracking
const { y: scrollY } = useWindowScroll()
const { width: windowWidth, height: windowHeight } = useWindowSize()

// SVG dimensions with generous breathing room
const padding = computed(() => (windowWidth.value < 768 ? 60 : 120))
const width = computed(() => windowWidth.value)
const height = computed(() => windowHeight.value)

// Animation control
const timeline = ref(null)
const scrollDistance = 12000

// Scroll progress (0-1)
const scrollProgress = computed(() => {
  return Math.min(scrollY.value / scrollDistance, 1)
})

// Throttled timeline seeking via RAF
useRafFn(() => {
  if (timeline.value) {
    const progress = scrollProgress.value
    timeline.value.seek(progress * timeline.value.duration)
  }
})

// Force layout: temporal scatter
const forcePositions = computed(() => {
  const pad = padding.value
  const dates = props.repos.map((r) => new Date(r.createdAt).getTime())
  const xScale = scaleTime()
    .domain(extent(dates))
    .range([pad, width.value - pad])

  const pushDates = props.repos.map((r) =>
    new Date(r.pushedAt).getTime()
  )
  const yScale = scaleTime()
    .domain(extent(pushDates))
    .range([height.value - pad, pad])

  return props.repos.map((repo) => ({
    x: xScale(new Date(repo.createdAt)),
    y: yScale(new Date(repo.pushedAt)),
    r: Math.sqrt((repo.stats.stars + 1) * 12),
  }))
})

// Parallel coords: condensed view
const parallelPositions = computed(() => {
  const pad = padding.value
  const axes = [
    { getValue: (r) => r.diskUsage / 1024, scale: 'log' },
    { getValue: (r) => Math.max(r.stats.stars, 0.1), scale: 'log' },
    {
      getValue: (r) =>
        r.languages ? Object.keys(r.languages).length : 0,
      scale: 'linear',
    },
  ]

  const axisWidth = (width.value - pad * 2) / (axes.length - 1)

  return props.repos.map((repo) => {
    const points = axes.map((axis, i) => {
      const values = props.repos.map(axis.getValue)
      const [min, max] = extent(values)

      const yScale =
        axis.scale === 'log'
          ? scaleLog()
              .domain([Math.max(min, 0.1), max])
              .range([height.value - pad, pad])
          : scaleLinear()
              .domain([min, max])
              .range([height.value - pad, pad])

      return {
        x: pad + i * axisWidth,
        y: yScale(axis.getValue(repo)),
      }
    })

    const midIdx = Math.floor(points.length / 2)
    return { x: points[midIdx].x, y: points[midIdx].y, r: 4 }
  })
})

// Radial: spiral by language
const radialPositions = computed(() => {
  const centerX = width.value / 2
  const centerY = height.value / 2
  const maxRadius =
    Math.min(width.value, height.value) / 2 - padding.value

  const dates = props.repos.flatMap((r) => [
    new Date(r.createdAt),
    new Date(r.pushedAt),
  ])
  const radiusScale = scaleTime()
    .domain(extent(dates))
    .range([80, maxRadius])

  const langGroups = {}
  props.repos.forEach((repo) => {
    const lang = repo.language || 'Unknown'
    if (!langGroups[lang]) langGroups[lang] = []
    langGroups[lang].push(repo)
  })

  const results = []
  let currentAngle = 0
  const totalRepos = props.repos.length

  Object.values(langGroups).forEach((repos) => {
    const angleSpan = (repos.length / totalRepos) * 2 * Math.PI
    const anglePerRepo = angleSpan / repos.length

    repos.forEach((repo, i) => {
      const angle = currentAngle + i * anglePerRepo
      const radius = radiusScale(new Date(repo.pushedAt))

      results.push({
        x: centerX + Math.cos(angle - Math.PI / 2) * radius,
        y: centerY + Math.sin(angle - Math.PI / 2) * radius,
        r: 4,
      })
    })

    currentAngle += angleSpan
  })

  return results
})

// Timeline: horizontal chronological
const timelinePositions = computed(() => {
  const pad = padding.value
  const dates = props.repos.map((r) => new Date(r.createdAt).getTime())
  const xScale = scaleTime()
    .domain(extent(dates))
    .range([pad, width.value - pad])

  const rows = 10
  const ySpacing = (height.value - pad * 2) / rows

  return props.repos.map((repo, i) => ({
    x: xScale(new Date(repo.createdAt)),
    y: pad + (i % rows) * ySpacing,
    r: 4,
  }))
})

// Reactive nodes (animated by anime.js)
const nodes = ref(
  props.repos.map((repo) => ({
    repo,
    x: 0,
    y: 0,
    r: 4,
    color: repo.languageColor || '#666',
  }))
)

// Initialize timeline
onMounted(() => {
  const initial = forcePositions.value
  nodes.value.forEach((node, i) => {
    node.x = initial[i].x
    node.y = initial[i].y
    node.r = initial[i].r
  })

  timeline.value = anime.timeline({
    autoplay: false,
    easing: 'easeInOutCubic',
  })

  // Four smooth transitions
  const transitions = [
    { name: 'parallel', positions: parallelPositions },
    { name: 'radial', positions: radialPositions },
    { name: 'timeline', positions: timelinePositions },
    { name: 'force', positions: forcePositions },
  ]

  transitions.forEach(({ positions }) => {
    timeline.value.add({
      targets: nodes.value,
      x: positions.value.map((p) => p.x),
      y: positions.value.map((p) => p.y),
      r: positions.value.map((p) => p.r),
      duration: 300,
      easing: 'easeInOutQuart',
    })
  })
})

// Mode label
const vizMode = computed(() => {
  const p = scrollProgress.value
  if (p < 0.25) return 'Force'
  if (p < 0.5) return 'Parallel'
  if (p < 0.75) return 'Radial'
  return 'Timeline'
})

// Responsive visibility
const showViz = computed(() => windowWidth.value >= 768)
</script>

<template>
  <div v-if="showViz" class="scroll-viz-wrapper">
    <svg :width="width" :height="height" class="viz-canvas">
      <g class="nodes">
        <circle
          v-for="node in nodes"
          :key="node.repo.name"
          :cx="node.x"
          :cy="node.y"
          :r="node.r"
          :fill="node.color"
          class="repo-node"
        />
      </g>
    </svg>

    <div class="scroll-guide">
      <div class="guide-mode">{{ vizMode }}</div>
      <div class="guide-progress">
        <div class="progress-fill" :style="{ width: `${scrollProgress * 100}%` }" />
      </div>
      <div class="guide-hint">{{ Math.round(scrollProgress * 100) }}%</div>
    </div>
  </div>
</template>

<style scoped>
.scroll-viz-wrapper {
  @apply pointer-events-none;
}

.viz-canvas {
  @apply fixed top-0 left-0;
  @apply pointer-events-none;
  z-index: -1;
}

.repo-node {
  @apply fill-opacity-40 stroke-current stroke-0;
  @apply transition-opacity duration-300;
}

.scroll-guide {
  @apply fixed bottom-8 right-8;
  @apply bg-white/80 dark:bg-zinc-900/80;
  @apply border border-zinc-200 dark:border-zinc-800;
  @apply rounded backdrop-blur-sm;
  @apply px-4 py-3;
  @apply pointer-events-auto;
  @apply font-mono text-xs;
  z-index: 50;
}

.guide-mode {
  @apply text-zinc-900 dark:text-zinc-100;
  @apply font-medium mb-2;
  @apply text-[10px] uppercase tracking-wider;
}

.guide-progress {
  @apply w-32 h-1 mb-2;
  @apply bg-zinc-200 dark:bg-zinc-800;
  @apply rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full;
  @apply bg-zinc-900 dark:bg-zinc-100;
  @apply transition-all duration-200;
}

.guide-hint {
  @apply text-[9px] tabular-nums;
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
