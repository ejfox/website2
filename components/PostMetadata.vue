<template>
  <div class="w-full text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
    <span v-if="doc.date" class="flex items-center" :title="formatRelativeTime(doc.date)">
      <UIcon name="ant-design:calendar-outlined" class="mr-1 text-zinc-400 dark:text-zinc-600" />
      {{ formatBlogDate(new Date(doc.date)) }}
    </span>


    <span v-if="doc.readingTime > 1" class="flex items-center">
      <UIcon name="bi:clock-history" class="mr-1 text-zinc-400 dark:text-zinc-600" />
      {{ doc.readingTime }}m
    </span>

    <span v-if="doc.wordCount > 100" class="flex items-center">
      <UIcon name="bi:card-text" class="mr-1 text-zinc-400 dark:text-zinc-600" />
      {{ formatNumber(doc.wordCount) }} words
    </span>


    <span v-if="doc.imageCount > 0" class="flex items-center">
      <UIcon name="ant-design:camera-filled" class="mr-1 text-zinc-400 dark:text-zinc-600" />
      {{ doc.imageCount }}
    </span>

    <span v-if="doc.linkCount > 1" class="flex items-center">
      <UIcon name="bi:link" class="mr-1 text-zinc-400 dark:text-zinc-600" />
      {{ doc.linkCount }}
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