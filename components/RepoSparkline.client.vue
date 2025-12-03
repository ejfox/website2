<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  width: {
    type: Number,
    default: 60,
  },
  height: {
    type: Number,
    default: 16,
  },
  color: {
    type: String,
    default: '#71717a',
  },
  showDot: {
    type: Boolean,
    default: false,
  },
})

// Generate SVG path from data
const path = computed(() => {
  if (!props.data || props.data.length === 0) return ''

  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1

  const points = props.data.map((value, i) => {
    const x = (i / (props.data.length - 1)) * props.width
    const y = props.height - ((value - min) / range) * props.height
    return `${x},${y}`
  })

  return `M${points.join(' L')}`
})

const lastPoint = computed(() => {
  if (!props.data || props.data.length === 0) return null
  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1
  const value = props.data[props.data.length - 1]
  return {
    x: props.width,
    y: props.height - ((value - min) / range) * props.height,
  }
})
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="sparkline"
  >
    <path :d="path" :stroke="color" fill="none" stroke-width="1" />
    <circle
      v-if="showDot && lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="1.5"
      :fill="color"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  @apply inline-block align-middle;
}
</style>
