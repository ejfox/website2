<template>
  <div class="w-full text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-2 monospace">
    <!-- Date -->
    <span v-if="doc.date" class="flex items-center" :title="formatRelativeTime(doc.date)">
      <UIcon name="ant-design:calendar-outlined" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      <time>{{ formatBlogDate(new Date(doc.date)) }}</time>
    </span>

    <!-- Reading Time -->
    <span v-if="doc.readingTime > 1" class="flex items-center">
      <UIcon name="bi:clock-history" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.readingTime }} min read
    </span>

    <!-- Word Count -->
    <span v-if="doc.wordCount > 100" class="flex items-center">
      <UIcon name="bi:card-text" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ formatNumber(doc.wordCount) }} words
    </span>

    <!-- Image Count -->
    <span v-if="doc.imageCount > 0" class="flex items-center">
      <UIcon name="ant-design:camera-filled" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.imageCount }} images
    </span>

    <!-- Link Count -->
    <span v-if="doc.linkCount > 1" class="flex items-center">
      <UIcon name="bi:link" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.linkCount }} links
    </span>
  </div>
</template>

<script setup>
import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
})

const formatNumber = format(',d')
const formatBlogDate = timeFormat('%b %Y')

const formatRelativeTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return ''
  }
}
</script>
