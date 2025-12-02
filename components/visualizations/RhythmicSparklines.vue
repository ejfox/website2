<template>
  <svg
    :class="variantClass"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Activity sparkline"
  >
    <!-- Baseline reference line (subtle) -->
    <line
      v-if="baseline !== null"
      :x1="0"
      :y1="scaleY(baseline)"
      :x2="width"
      :y2="scaleY(baseline)"
      :stroke="baselineColor"
      stroke-width="0.5"
      opacity="0.3"
    />

    <!-- Area fill under the line -->
    <path v-if="areaPath" :d="areaPath" :fill="areaFill" opacity="0.15" />

    <!-- Main sparkline path -->
    <polyline
      :points="points"
      :stroke="lineColor"
      :stroke-width="strokeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Peak indicator (highest point) -->
    <circle
      v-if="showPeak && peakPoint"
      :cx="peakPoint.x"
      :cy="peakPoint.y"
      :r="dotRadius"
      :fill="peakColor"
      opacity="0.8"
    />
  </svg>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (arr) =>
      arr.length > 0 && arr.every((n) => typeof n === 'number'),
  },
  variant: {
    type: String,
    default: 'inline',
    validator: (v) => ['inline', 'header', 'margin', 'paragraph'].includes(v),
  },
  baseline: {
    type: Number,
    default: null,
  },
  showPeak: {
    type: Boolean,
    default: true,
  },
})

// Variant-specific dimensions
const variantConfig = {
  inline: { width: 48, height: 12, strokeWidth: 1, dotRadius: 1.5 },
  header: { width: 120, height: 24, strokeWidth: 1.5, dotRadius: 2 },
  margin: { width: 80, height: 20, strokeWidth: 1.5, dotRadius: 2 },
  paragraph: { width: 60, height: 16, strokeWidth: 1, dotRadius: 1.5 },
}

const config = variantConfig[props.variant]
const width = config.width
const height = config.height
const strokeWidth = config.strokeWidth
const dotRadius = config.dotRadius

// Variant-specific classes
const variantClass = computed(() => {
  const classes = {
    inline: 'inline-block align-middle',
    header: 'inline-block',
    margin: 'block',
    paragraph: 'inline-block align-text-top',
  }
  return classes[props.variant]
})

// Colors - theme aware
const lineColor = 'currentColor'
const baselineColor = 'currentColor'
const areaFill = 'currentColor'
const peakColor = 'currentColor'

// Scale functions with padding
const padding = 2
const scaleX = (index) => {
  const step = (width - padding * 2) / (props.data.length - 1)
  return padding + index * step
}

const scaleY = (value) => {
  const min = Math.min(...props.data, props.baseline || 0)
  const max = Math.max(...props.data, props.baseline || 0)
  const range = max - min || 1 // Avoid division by zero
  return height - padding - ((value - min) / range) * (height - padding * 2)
}

// Generate polyline points
const points = computed(() => {
  return props.data
    .map((value, index) => `${scaleX(index)},${scaleY(value)}`)
    .join(' ')
})

// Generate area path (fill under the line)
const areaPath = computed(() => {
  if (props.data.length === 0) return null

  const baseline =
    props.baseline !== null ? scaleY(props.baseline) : height - padding
  const linePath = props.data
    .map((value, index) => `${scaleX(index)},${scaleY(value)}`)
    .join(' L ')

  return `M ${scaleX(0)},${baseline} L ${linePath} L ${scaleX(
    props.data.length - 1
  )},${baseline} Z`
})

// Find peak point
const peakPoint = computed(() => {
  if (!props.showPeak || props.data.length === 0) return null

  const maxValue = Math.max(...props.data)
  const maxIndex = props.data.indexOf(maxValue)

  return {
    x: scaleX(maxIndex),
    y: scaleY(maxValue),
  }
})
</script>

<style scoped>
/* Subtle opacity transitions on hover */
svg {
  transition: opacity 0.2s ease;
}

svg:hover {
  opacity: 0.8;
}
</style>
