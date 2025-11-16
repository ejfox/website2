<template>
  <svg :width="width" :height="height" class="sparkline-scaled">
    <g v-if="type === 'squares'">
      <rect
        v-for="(d, i) in data"
        :key="i"
        :x="xScale(i)"
        :y="yScale(Math.floor(i / columns))"
        :width="sizeScale(d)"
        :height="sizeScale(d)"
        :fill="colorScale(d)"
        :opacity="opacityScale(d)"
      />
    </g>

    <g v-else-if="type === 'line'">
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        :stroke-width="strokeScale(Math.max(...values))"
      />
    </g>

    <g v-else-if="type === 'bars'">
      <rect
        v-for="(d, i) in data"
        :key="i"
        :x="xScale(i)"
        :y="yScale(d)"
        :width="bandwidth"
        :height="height - yScale(d)"
        :fill="colorScale(d)"
      />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  values: Array,
  type: {
    type: String,
    default: 'squares' // squares | line | bars
  },
  width: {
    type: Number,
    default: 100
  },
  height: {
    type: Number,
    default: 20
  },
  columns: {
    type: Number,
    default: 10
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  metric: String // words | size | time | images
})

// Scale definitions based on metric type
const scales = computed(() => {
  const metricScales = {
    words: {
      domain: [0, 5000],
      colors: ['#dbeafe', '#3b82f6', '#1e40af'],
      size: [2, 4]
    },
    size: {
      domain: [0, 100000], // bytes
      colors: ['#fef3c7', '#f59e0b', '#d97706'],
      size: [1, 3]
    },
    time: {
      domain: [0, 60], // minutes
      colors: ['#ede9fe', '#8b5cf6', '#5b21b6'],
      size: [2, 3]
    },
    images: {
      domain: [0, 20],
      colors: ['#d1fae5', '#10b981', '#047857'],
      size: [3, 5]
    }
  }

  const config = metricScales[props.metric] || {
    domain: d3.extent(props.values),
    colors: [props.color],
    size: [2, 4]
  }

  return {
    x: d3
      .scaleLinear()
      .domain([
        0,
        props.type === 'line' ? props.values.length - 1 : props.columns - 1
      ])
      .range([0, props.width - 4]),

    y: d3
      .scaleLinear()
      .domain(
        props.type === 'line'
          ? d3.extent(props.values).reverse()
          : [0, Math.ceil(props.values.length / props.columns)]
      )
      .range([0, props.height]),

    size: d3
      .scaleSqrt() // Sqrt scale for area perception
      .domain(config.domain)
      .range(config.size)
      .clamp(true),

    color: d3.scaleQuantize().domain(config.domain).range(config.colors),

    opacity: d3.scaleLinear().domain(config.domain).range([0.3, 1]),

    stroke: d3.scaleLinear().domain(config.domain).range([0.5, 2])
  }
})

// Computed scales
const xScale = computed(() => scales.value.x)
const yScale = computed(() => scales.value.y)
const sizeScale = computed(() => scales.value.size)
const colorScale = computed(() => scales.value.color)
const opacityScale = computed(() => scales.value.opacity)
const strokeScale = computed(() => scales.value.stroke)

// For bar charts
const bandwidth = computed(() => {
  if (props.type !== 'bars') return 0
  return props.width / props.values.length - 1
})

// For line charts
const linePath = computed(() => {
  if (props.type !== 'line') return ''

  const line = d3
    .line()
    .x((d, i) => xScale.value(i))
    .y((d) => yScale.value(d))
    .curve(d3.curveMonotoneX) // Smooth interpolation

  return line(props.values)
})

// Process data based on type
const data = computed(() => {
  if (props.type === 'bars') {
    // Normalize for bar height
    const extent = d3.extent(props.values)
    const normalize = d3
      .scaleLinear()
      .domain(extent)
      .range([props.height * 0.1, props.height * 0.9])

    return props.values.map((v) => normalize(v))
  }

  return props.values
})
</script>

<style scoped>
.sparkline-scaled {
  display: inline-block;
  vertical-align: middle;
}

.sparkline-scaled rect,
.sparkline-scaled path {
  transition: all 0.2s ease;
}

.sparkline-scaled:hover rect,
.sparkline-scaled:hover path {
  opacity: 0.8;
}
</style>
