<script setup>
import { computed } from 'vue'
import { area, curveBasis } from 'd3-shape'
import { scaleLinear, scaleLog } from 'd3-scale'
import { bin, max, extent } from 'd3-array'

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

// Group repos by language and calculate size distributions
const languageData = computed(() => {
  const grouped = {}

  props.repos.forEach((repo) => {
    const lang = repo.language || 'Unknown'
    if (!grouped[lang]) {
      grouped[lang] = {
        language: lang,
        color: repo.languageColor || '#666',
        sizes: [],
      }
    }
    if (repo.diskUsage > 0) {
      grouped[lang].sizes.push(repo.diskUsage)
    }
  })

  // Sort by total size, descending (biggest at bottom)
  return Object.values(grouped)
    .filter((d) => d.sizes.length > 0)
    .sort((a, b) => {
      const sumA = a.sizes.reduce((s, v) => s + v, 0)
      const sumB = b.sizes.reduce((s, v) => s + v, 0)
      return sumB - sumA
    })
})

// X scale (log scale for repo sizes in KB)
const xScale = computed(() => {
  const allSizes = props.repos.map((r) => r.diskUsage).filter((s) => s > 0)
  const [min, max] = extent(allSizes)

  return scaleLog()
    .domain([Math.max(min, 100), max])
    .range([40, props.width - 40])
    .nice()
})

// Height per ridge
const ridgeHeight = computed(
  () => props.height / (languageData.value.length + 1)
)

// Generate density curves for each language
const ridges = computed(() => {
  return languageData.value.map((langData, i) => {
    // Create histogram bins
    const histogram = bin().domain(xScale.value.domain()).thresholds(20)

    const bins = histogram(langData.sizes)

    // Y scale for this ridge
    const yScale = scaleLinear()
      .domain([0, max(bins, (d) => d.length)])
      .range([ridgeHeight.value * 0.8, 0])

    // Generate area path
    const areaGenerator = area()
      .curve(curveBasis)
      .x((d) => xScale.value((d.x0 + d.x1) / 2))
      .y0(ridgeHeight.value * 0.8)
      .y1((d) => yScale(d.length))

    const pathData = areaGenerator(bins)
    const yPosition = i * ridgeHeight.value + 20

    return {
      language: langData.language,
      color: langData.color,
      path: pathData,
      y: yPosition,
      count: langData.sizes.length,
    }
  })
})

// X-axis ticks (powers of 10 for log scale)
const xTicks = computed(() => {
  const [min, max] = xScale.value.domain()
  const ticks = []
  let power = Math.floor(Math.log10(min))
  const maxPower = Math.ceil(Math.log10(max))

  while (power <= maxPower) {
    const value = Math.pow(10, power)
    if (value >= min && value <= max) {
      ticks.push({
        value,
        x: xScale.value(value),
        label:
          value >= 1024 * 1024
            ? `${(value / (1024 * 1024)).toFixed(0)}GB`
            : value >= 1024
              ? `${(value / 1024).toFixed(0)}MB`
              : `${value}KB`,
      })
    }
    power++
  }

  return ticks
})
</script>

<template>
  <div class="ridgeline-container">
    <svg
      :width="width"
      :height="height"
      class="ridgeline-svg"
      role="img"
      aria-label="Repository size distribution by language"
    >
      <!-- X-axis -->
      <g class="axis axis-x" :transform="`translate(0, ${height - 30})`">
        <line
          :x1="40"
          :x2="width - 40"
          y1="0"
          y2="0"
          stroke="currentColor"
          stroke-opacity="0.2"
        />
        <g v-for="tick in xTicks" :key="tick.value">
          <line
            :x1="tick.x"
            :x2="tick.x"
            y1="0"
            y2="4"
            stroke="currentColor"
            stroke-opacity="0.3"
          />
          <text :x="tick.x" y="16" text-anchor="middle" class="axis-label">
            {{ tick.label }}
          </text>
        </g>
      </g>

      <!-- Ridges -->
      <g v-for="ridge in ridges" :key="ridge.language">
        <!-- Area fill -->
        <path
          :d="ridge.path"
          :transform="`translate(0, ${ridge.y})`"
          :fill="ridge.color"
          fill-opacity="0.6"
          :stroke="ridge.color"
          stroke-width="1.5"
          class="ridge-path"
        />

        <!-- Label -->
        <text
          :x="20"
          :y="ridge.y + ridgeHeight * 0.4"
          class="ridge-label"
          text-anchor="end"
        >
          {{ ridge.language }}
        </text>

        <!-- Count -->
        <text
          :x="width - 20"
          :y="ridge.y + ridgeHeight * 0.4"
          class="ridge-count"
          text-anchor="end"
        >
          {{ ridge.count }}
        </text>
      </g>
    </svg>

    <!-- Title -->
    <div class="ridgeline-title">Repository Size Distribution by Language</div>
    <div class="ridgeline-subtitle">
      Ridgeline density plot showing size patterns across
      {{ languageData.length }} languages
    </div>
  </div>
</template>

<style scoped>
.ridgeline-container {
  @apply relative;
  @apply bg-white dark:bg-zinc-950;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply p-4;
}

.ridgeline-svg {
  @apply w-full;
  @apply text-zinc-400 dark:text-zinc-600;
}

.ridge-path {
  @apply transition-all duration-200;
}

.ridge-path:hover {
  fill-opacity: 0.75;
  stroke-width: 2;
}

.ridge-label {
  @apply text-xs font-mono;
  @apply fill-zinc-700 dark:fill-zinc-300;
}

.ridge-count {
  @apply text-[10px] font-mono tabular-nums;
  @apply fill-zinc-500 dark:fill-zinc-500;
}

.axis-label {
  @apply text-[10px] font-mono;
  @apply fill-zinc-500 dark:fill-zinc-500;
}

.ridgeline-title {
  @apply text-xs font-mono uppercase tracking-wider;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply mt-4 mb-1;
}

.ridgeline-subtitle {
  @apply text-[10px] font-mono;
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
