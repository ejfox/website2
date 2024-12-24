<template>
  <svg :width="width" :height="height">
    <path :d="line(data)" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import * as d3 from 'd3'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<SparklineProps>(), {
  width: 100,
  height: 30,
})

const xScale = computed(() =>
  d3.scaleLinear()
    .domain([0, props.data.length - 1])
    .range([0, props.width!])
)

const yScale = computed(() => {
  const max = d3.max(props.data) || 1
  return d3.scaleLinear()
    .domain([0, max])
    .range([props.height!, 0])
})

const line = computed(() =>
  d3.line<number>()
    .x((d, i) => xScale.value(i))
    .y(d => yScale.value(d))
)

</script>

<style scoped>
svg {
  display: block;
}
</style>