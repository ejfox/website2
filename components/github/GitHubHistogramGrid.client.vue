<!--
  @file GitHubHistogramGrid.client.vue
  @description Grid of D3 histograms showing distribution of repository metrics (size, stars, forks, languages, age, recency)
  @props repos: Array - Array of repository objects with stats, languages, dates, diskUsage
-->
<script setup>
import { computed } from 'vue'
import { scaleLinear, scaleLog } from 'd3-scale'
import { bin, max, extent } from 'd3-array'

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
})

const cellWidth = 120
const cellHeight = 60

// Extract all metrics
const metrics = computed(() => {
  return {
    size: {
      label: 'Size',
      unit: 'MB',
      values: props.repos.map((r) => r.diskUsage / 1024).filter((v) => v),
      scale: 'log',
    },
    stars: {
      label: 'Stars',
      unit: '',
      values: props.repos.map((r) => r.stats.stars).filter((v) => v > 0),
      scale: 'log',
    },
    forks: {
      label: 'Forks',
      unit: '',
      values: props.repos.map((r) => r.stats.forks).filter((v) => v > 0),
      scale: 'linear',
    },
    languages: {
      label: 'Languages',
      unit: '',
      values: props.repos
        .map((r) => (r.languages ? Object.keys(r.languages).length : 0))
        .filter((v) => v > 0),
      scale: 'linear',
    },
    age: {
      label: 'Age',
      unit: 'days',
      values: props.repos
        .map((r) =>
          Math.floor(
            (Date.now() - new Date(r.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
        .filter((v) => v > 0),
      scale: 'linear',
    },
    activity: {
      label: 'Recency',
      unit: 'days',
      values: props.repos
        .map((r) =>
          Math.floor(
            (Date.now() - new Date(r.pushedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
        .filter((v) => v >= 0),
      scale: 'linear',
    },
  }
})

// Generate histogram for each metric
const histograms = computed(() => {
  const result = []

  Object.entries(metrics.value).forEach(([key, metric]) => {
    if (metric.values.length === 0) return

    const [min, maxVal] = extent(metric.values)

    // Create scale
    const xScale =
      metric.scale === 'log'
        ? scaleLog()
            .domain([Math.max(min, 0.1), maxVal])
            .range([0, cellWidth - 20])
            .nice()
        : scaleLinear()
            .domain([min, maxVal])
            .range([0, cellWidth - 20])
            .nice()

    // Create bins
    const histogram = bin().domain(xScale.domain()).thresholds(12)

    const bins = histogram(metric.values)
    const maxCount = max(bins, (d) => d.length)

    // Y scale
    const yScale = scaleLinear()
      .domain([0, maxCount])
      .range([cellHeight - 25, 5])

    // Generate bars
    const bars = bins.map((binData) => ({
      x: xScale((binData.x0 + binData.x1) / 2),
      y: yScale(binData.length),
      height: cellHeight - 25 - yScale(binData.length),
      count: binData.length,
    }))

    result.push({
      key,
      label: metric.label,
      unit: metric.unit,
      count: metric.values.length,
      bars,
      median: metric.values.sort((a, b) => a - b)[
        Math.floor(metric.values.length / 2)
      ],
      max: maxVal,
    })
  })

  return result
})

const formatValue = (val, unit) => {
  if (unit === 'MB') return `${val.toFixed(1)}${unit}`
  if (unit === 'days') return `${Math.round(val)}d`
  return Math.round(val)
}
</script>

<template>
  <div class="histogram-grid-container">
    <div class="histogram-grid">
      <div v-for="hist in histograms" :key="hist.key" class="histogram-cell">
        <!-- Mini histogram -->
        <svg :width="cellWidth" :height="cellHeight" class="histogram-svg">
          <!-- Bars -->
          <g>
            <rect
              v-for="(bar, i) in hist.bars"
              :key="i"
              :x="bar.x - 2"
              :y="bar.y"
              width="4"
              :height="bar.height"
              class="histogram-bar"
            />
          </g>

          <!-- Baseline -->
          <line
            :x1="0"
            :x2="cellWidth - 20"
            :y1="cellHeight - 25"
            :y2="cellHeight - 25"
            stroke="currentColor"
            stroke-opacity="0.2"
            stroke-width="1"
          />
        </svg>

        <!-- Label -->
        <div class="cell-label">{{ hist.label }}</div>

        <!-- Stats -->
        <div class="cell-stats">
          <span class="stat-item">n={{ hist.count }}</span>
          <span class="stat-sep">·</span>
          <span class="stat-item">
            {{ formatValue(hist.median, hist.unit) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.histogram-grid-container {
  @apply relative;
}

.histogram-grid {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4;
}

.histogram-cell {
  @apply flex flex-col;
}

.histogram-svg {
  @apply text-zinc-400 dark:text-zinc-600;
}

.histogram-bar {
  @apply fill-zinc-700 dark:fill-zinc-300;
  @apply transition-all duration-300;
}

.histogram-bar:hover {
  @apply fill-zinc-900 dark:fill-zinc-100;
}

.cell-label {
  @apply text-xs font-mono font-medium;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply mt-2;
}

.cell-stats {
  @apply text-[10px] font-mono tabular-nums;
  @apply text-zinc-500 dark:text-zinc-500;
  @apply flex items-center gap-0.5;
}

.stat-item {
  @apply inline-block;
}

.stat-sep {
  @apply opacity-50;
}
</style>
