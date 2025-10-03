<template>
  <div class="sparkline-container" :title="tooltip">
    <svg
      :width="width"
      :height="height"
      class="sparkline fill-zinc-300 dark:fill-zinc-700"
    >
      <!-- Inline bars visualization (default for blog index) -->
      <g v-if="type === 'bars'">
        <rect
          v-for="(item, i) in inlineBarData"
          :key="`bar-${i}`"
          :x="item.x"
          :y="item.y"
          :width="item.width"
          :height="item.height"
          :fill="item.fill"
          :opacity="item.opacity"
          class="sparkline-bar"
        />
      </g>

      <!-- Single horizontal bar -->
      <g v-else-if="type === 'bar'">
        <rect
          v-for="(item, i) in barData"
          :key="`bar-${i}`"
          :x="item.x"
          :y="item.y"
          :width="item.width"
          :height="item.height"
          :fill="item.fill"
          class="sparkline-bar"
        />
      </g>

      <!-- Dots visualization -->
      <g v-else-if="type === 'dots'">
        <rect
          v-for="(item, i) in dotData"
          :key="`dot-${i}`"
          :x="item.x"
          :y="item.y"
          :width="1"
          :height="1"
          :fill="item.fill"
          :opacity="item.opacity"
          class="sparkline-dot"
        />
      </g>

      <!-- Grid visualization -->
      <g v-else-if="type === 'grid'">
        <rect
          v-for="(item, i) in gridData"
          :key="`grid-${i}`"
          :x="item.x"
          :y="item.y"
          :width="squareSize"
          :height="squareSize"
          :fill="item.fill"
          :opacity="item.opacity"
          class="sparkline-square"
        />
      </g>
    </svg>
    <span v-if="showLabel" class="sparkline-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Data props
  value: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    default: null
  },

  // Visualization type
  type: {
    type: String,
    default: 'bars', // bars | bar | dots | grid
    validator: (value) => ['bars', 'bar', 'dots', 'grid'].includes(value)
  },

  // Display props
  metric: {
    type: String,
    default: 'words', // words | images | links | size | time
    validator: (value) =>
      ['words', 'images', 'links', 'size', 'time'].includes(value)
  },

  // Size configuration - rhythm-based (always use whole pixels)
  squareSize: {
    type: Number,
    default: 1 // Always 1px for consistency
  },
  gap: {
    type: Number,
    default: 1 // Always 1px gap for consistency
  },
  columns: {
    type: Number,
    default: 4 // More compact for inline use
  },

  // Display options
  showLabel: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: null // Will use metric-based defaults
  }
})

// Compute dimensions
const totalSize = computed(() => props.squareSize + props.gap)

const gridCount = computed(() => {
  // Different scaling per metric
  switch (props.metric) {
    case 'words':
      return Math.min(Math.ceil(props.value / 250), 10) // 1 unit per 250 words, max 10
    case 'images':
      return Math.min(props.value, 8) // 1 unit per image, max 8
    case 'links':
      return Math.min(props.value, 8) // 1 unit per link, max 8
    case 'size':
      return Math.min(Math.ceil(props.value / 1024), 10) // 1 unit per KB, max 10
    case 'time':
      return Math.min(Math.ceil(props.value / 60), 6) // 1 unit per minute, max 6
    default:
      return Math.min(props.value, 10)
  }
})

const rows = computed(() => Math.ceil(gridCount.value / props.columns))

const width = computed(() => {
  if (props.type === 'bars') {
    // Compact inline bars: 1px bar + 1px gap
    return gridCount.value * 2 - 1
  }
  if (props.type === 'grid') {
    return props.columns * totalSize.value - props.gap
  }
  if (props.type === 'dots') {
    return gridCount.value * 3 - 2 // 1px dot + 2px space
  }
  return 40 // Fixed width for single bar
})

const height = computed(() => {
  if (props.type === 'grid') {
    return rows.value * totalSize.value - props.gap
  }
  if (props.type === 'bars') {
    return 4 // 4px height for compact inline bars
  }
  if (props.type === 'dots') {
    return 4 // 4px height for dots to match
  }
  return 8 // 8px height aligns with baseline grid
})

// Monochrome color scheme - subtle colors that match metadata
const fillColor = computed(() => {
  if (props.color) return props.color
  // Use currentColor to inherit from SVG class
  return 'currentColor'
})

// Generate grid data
const gridData = computed(() => {
  const data = []
  for (let i = 0; i < gridCount.value; i++) {
    const row = Math.floor(i / props.columns)
    const col = i % props.columns

    data.push({
      x: col * totalSize.value,
      y: row * totalSize.value,
      fill: fillColor.value,
      opacity: props.max ? props.value / props.max : 1
    })
  }
  return data
})

// Generate bar data (for size visualization)
const barData = computed(() => {
  if (props.type !== 'bar') return []

  const maxValue = props.max || props.value
  const barWidth = (props.value / maxValue) * width.value

  return [
    {
      x: 0,
      y: 0,
      width: barWidth,
      height: height.value,
      fill: fillColor.value
    }
  ]
})

// Generate dot data (for sparse data)
const dotData = computed(() => {
  if (props.type !== 'dots') return []

  const data = []
  const dotSpacing = 3 // 1px dot + 2px space

  for (let i = 0; i < gridCount.value; i++) {
    data.push({
      x: i * dotSpacing,
      y: 1.5, // Center in 4px height
      fill: fillColor.value,
      opacity: 0.8
    })
  }
  return data
})

// Generate inline bar data (compact vertical bars)
const inlineBarData = computed(() => {
  if (props.type !== 'bars') return []

  const data = []
  const barHeight = 4 // Compact height to match metadata line

  for (let i = 0; i < gridCount.value; i++) {
    data.push({
      x: i * 2, // 1px bar + 1px gap
      y: 0,
      width: 1, // Always 1px wide
      height: barHeight,
      fill: fillColor.value,
      opacity: 0.8 + i * 0.02 // Subtle gradient effect
    })
  }
  return data
})

// Label text
const label = computed(() => {
  switch (props.metric) {
    case 'words':
      return `${props.value} words`
    case 'images':
      return `${props.value} images`
    case 'links':
      return `${props.value} links`
    case 'size':
      return `${(props.value / 1024).toFixed(1)} KB`
    case 'time':
      return `${props.value} min`
    default:
      return props.value
  }
})

// Tooltip text
const tooltip = computed(() => {
  switch (props.metric) {
    case 'words':
      return `${props.value} words (~${Math.ceil(props.value / 250)} min read)`
    case 'images':
      return `${props.value} images in post`
    case 'links':
      return `${props.value} external links`
    case 'size':
      return `File size: ${(props.value / 1024).toFixed(1)} KB`
    case 'time':
      return `Reading time: ${props.value} minutes`
    default:
      return label.value
  }
})
</script>

<style scoped>
.sparkline-container {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  cursor: help;
}

.sparkline {
  display: block;
  vertical-align: middle;
}

.sparkline-square,
.sparkline-bar,
.sparkline-dot {
  transition: opacity 0.15s ease;
}

.sparkline-container:hover .sparkline-square,
.sparkline-container:hover .sparkline-bar,
.sparkline-container:hover .sparkline-dot {
  opacity: 0.6;
}

.sparkline-label {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400;
  font-variant-numeric: tabular-nums;
}
</style>
