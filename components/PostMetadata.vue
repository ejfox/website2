<template>
  <div class="page-metadata text-xs flex flex-wrap">
    <div class="text-gray-500 font-light text-sm flex-wrap items-center space-y-2">
      <!-- let the user know if the article is a draft -->
      <span v-if="doc.draft" class="inline-flex items-center mr-4 text-primary-200 dark:text-primary-700">
        <UIcon name="bi:exclamation-triangle" class="mr-1 text-sm pb-1" />
        <span>This post is a draft, and updates are expected</span>
      </span>

      <span class="mr-4 inline-flex items-center" v-if="doc.date" title="Date created">
        <UIcon name="ant-design:calendar-outlined" class="mr-1 text-sm pb-1" />
        <span class="hidden lg:inline-block mr-1 font-bold">Started</span>
        <ruby>{{ formatBlogDate(new Date(doc.date)) }}<rt>{{ formatRelativeTime(doc.date) }}</rt></ruby>
      </span>

      <!-- Remove the 'modified' section as it's not present in the sample data -->

      <div class="inline-flex items-center p-0 m-0">
        <span class="mr-4 whitespace-nowrap inline-flex items-center" v-if="doc.wordCount > 100">
          <UIcon name="bi:card-text" class="mr-1 text-sm pb-1" />
          {{ doc.wordCount }} words
        </span>

        <span class="mr-4 whitespace-nowrap inline-flex items-center" v-if="doc.readingTime > 1">
          <UIcon name="bi:clock-history" class="mr-1 text-sm pb-1" />
          {{ doc.readingTime }} min read
        </span>

        <span class="mr-4 whitespace-nowrap inline-flex items-center" v-if="doc.imageCount > 0">
          <UIcon name="ant-design:camera-filled" class="mr-1 text-sm pb-1" />
          {{ doc.imageCount }} photo<span v-if="doc.imageCount > 1">s</span>
        </span>

        <span class="mr-4 whitespace-nowrap inline-flex items-center" v-if="doc.linkCount > 1">
          <UIcon name="bi:link" class="mr-1 text-sm pb-1" />
          {{ doc.linkCount }} links
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { timeFormat } from 'd3-time-format'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
})

const formatBlogDate = timeFormat('%B %d, %Y')
const formatRelativeTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
    })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return ''
  }
}
</script>