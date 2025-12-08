<script setup>
import { computed } from 'vue'
import { scaleLinear } from 'd3-scale'
import { bin, max } from 'd3-array'

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
  buckets: {
    type: Number,
    default: 8,
  },
})

// Filter out zero-size files and extract sizes
const sizes = computed(() => {
  if (!props.files || props.files.length === 0) return []
  return props.files.map((f) => f.size).filter((s) => s > 0)
})

// Create logarithmic bins for file sizes
const histogram = computed(() => {
  if (sizes.value.length === 0) return []

  const minSize = Math.min(...sizes.value)
  const maxSize = Math.max(...sizes.value)

  const binner = bin().domain([minSize, maxSize]).thresholds(props.buckets)

  const bins = binner(sizes.value)

  return bins
})

// Scale for bar heights
const heightScale = computed(() => {
  const maxCount = max(histogram.value, (d) => d.length) || 1
  return scaleLinear().domain([0, maxCount]).range([0, 40])
})

// Format file sizes
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i)) + sizes[i]
}
</script>

<template>
  <div v-if="histogram.length > 0" class="space-y-1">
    <!-- Histogram bars - no backgrounds, just bars -->
    <div class="flex items-end gap-px h-10">
      <div
        v-for="(bucket, i) in histogram"
        :key="i"
        class="flex-1 bg-zinc-900 dark:bg-zinc-100"
        :style="{
          height: heightScale(bucket.length) + 'px',
        }"
        :title="`${bucket.length} files`"
      />
    </div>

    <!-- Direct labels - Tuftian style -->
    <div class="flex justify-between font-mono text-[10px] text-zinc-500">
      <span>{{ formatSize(Math.min(...sizes)) }}</span>
      <span class="text-right">{{ formatSize(Math.max(...sizes)) }}</span>
    </div>
  </div>
  <div v-else class="font-mono text-[9px] text-zinc-500 dark:text-zinc-500">
    No file data
  </div>
</template>
