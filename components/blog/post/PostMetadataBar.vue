<!--
  @file PostMetadataBar.vue
  @description Top ticker bar with reading stats for blog posts
  @props date, stats - post date and reading statistics
-->
<template>
  <div
    class="flex items-center justify-center gap-2 sm:gap-3 px-4 py-2 font-mono text-3xs sm:text-2xs text-white uppercase tracking-wider"
  >
    <span class="whitespace-nowrap">{{ formattedDate }}</span>
    <span class="text-zinc-600">·</span>
    <span class="whitespace-nowrap">{{ stats.readingTime }}min read</span>
    <span class="text-zinc-600">·</span>
    <span class="whitespace-nowrap">
      {{ formatCompact(stats.words) }} words
    </span>
    <template v-if="stats.images > 0">
      <span class="text-zinc-600 hidden sm:inline">·</span>
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.images }} img
      </span>
    </template>
    <template v-if="stats.links > 0">
      <span class="text-zinc-600 hidden sm:inline">·</span>
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.links }} links
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
const { formatShortDate } = useDateFormat()

const props = defineProps<{
  date: string | null | undefined
  stats: {
    readingTime: number
    words: number
    images: number
    links: number
  }
}>()

const formattedDate = computed(() => {
  const d = formatShortDate(props.date)
  return d ? d.toUpperCase() : 'N/A'
})

function formatCompact(num: number): string {
  if (!num) return '0'
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'K'
  return Math.floor(num / 1000) + 'K'
}
</script>
