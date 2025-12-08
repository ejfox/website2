<script setup>
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import { useLanguageColors } from '~/composables/useLanguageColors'

const props = defineProps({
  repos: { type: Array, required: true },
  height: { type: Number, default: 500 },
})

const container = ref(null)
const { width } = useElementSize(container)
const { getColor } = useLanguageColors()

// Group by language, sorted by count
const languages = computed(() => {
  const grouped = d3.rollup(
    props.repos,
    (v) => v.length,
    (d) => d.language || 'Unknown'
  )
  return Array.from(grouped, ([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const maxCount = computed(() => d3.max(languages.value, (d) => d.count) || 1)

const barHeight = computed(() =>
  Math.min(40, (props.height - 40) / languages.value.length)
)

const xScale = computed(() => {
  return d3
    .scaleLinear()
    .domain([0, maxCount.value])
    .range([0, Math.max(width.value - 140, 100)])
})
</script>

<template>
  <div ref="container" class="px-4">
    <svg :width="width" :height="languages.length * barHeight + 20">
      <g
        v-for="(d, i) in languages"
        :key="d.lang"
        :transform="`translate(0, ${i * barHeight})`"
      >
        <text
          x="0"
          :y="barHeight * 0.6"
          class="text-xs font-mono fill-zinc-600 dark:fill-zinc-400"
        >
          {{ d.lang }}
        </text>
        <rect
          x="100"
          :y="4"
          :width="xScale(d.count)"
          :height="barHeight - 8"
          :fill="getColor(d.lang)"
          fill-opacity="0.7"
          rx="2"
        />
        <text
          :x="105 + xScale(d.count)"
          :y="barHeight * 0.6"
          class="text-[10px] font-mono fill-zinc-500"
        >
          {{ d.count }}
        </text>
      </g>
    </svg>
  </div>
</template>
