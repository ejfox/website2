<!--
  @file PostMetadataBar.vue
  @description Reading stats metadata bar for blog posts
  @props date, stats - post date and reading statistics
-->
<template>
  <div class="px-4 md:px-8 xl:px-16 py-3 sm:py-2">
    <!-- Mobile: Stack date and main stats -->
    <div class="block sm:hidden space-y-1">
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {{ formattedDate }}
      </div>
      <div class="flex flex-wrap gap-3 font-mono text-xs text-zinc-400 dark:text-zinc-500">
        <span>{{ stats.readingTime }}min read</span>
        <span>{{ formatCompact(stats.words) }} words</span>
        <span v-if="stats.images > 0">{{ stats.images }} images</span>
      </div>
    </div>

    <!-- Desktop: Single line -->
    <div class="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-1 font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
      <span class="whitespace-nowrap">{{ formattedDate }}</span>
      <span class="text-zinc-300 dark:text-zinc-600">·</span>
      <span class="whitespace-nowrap">{{ stats.readingTime }}min</span>
      <span class="text-zinc-300 dark:text-zinc-600">·</span>
      <span class="whitespace-nowrap">{{ formatCompact(stats.words) }} words</span>
      <template v-if="stats.images > 0">
        <span class="text-zinc-300 dark:text-zinc-600">·</span>
        <span class="whitespace-nowrap">{{ stats.images }} images</span>
      </template>
      <template v-if="stats.links > 0">
        <span class="text-zinc-300 dark:text-zinc-600">·</span>
        <span class="whitespace-nowrap">{{ stats.links }} links</span>
      </template>
    </div>
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
