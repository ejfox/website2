<template>
  <div class="w-full text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-2 monospace">
    <!-- we wanna include the folder name here -->
    <span class="flex items-center metadata-item text-xs tracking-widest" ref="folderRef" v-if="doc.slug">
      <!-- <UIcon name="bi:folder" class="mr-2 text-zinc-400 dark:text-zinc-600" /> -->

      /{{ doc.slug.split('/')[0] }}/
    </span>

    <!-- <pre>{{ doc }}</pre> -->

    <!-- Draft status -->
    <span v-if="doc.draft" class="flex items-center text-red-500 dark:text-red-400 font-sans metadata-item"
      ref="draftRef">
      <UIcon name="bi:file-earmark-text" class="mr-2 text-red-400 dark:text-red-600" />
      Draft, please do not publish, changes expected
    </span>

    <!-- Date -->
    <span v-if="doc.date" class="flex items-center metadata-item" :title="formatRelativeTime(doc.date)" ref="dateRef">
      <UIcon name="ant-design:calendar-outlined" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      <time>{{ formatBlogDate(new Date(doc.date)) }}</time>
    </span>




    <!-- Reading Time -->
    <span v-if="doc.readingTime > 1" class="flex items-center metadata-item" ref="readingTimeRef">
      <UIcon name="bi:clock-history" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.readingTime }} min read
    </span>

    <!-- Word Count -->
    <span v-if="doc.wordCount > 100" class="flex items-center metadata-item" ref="wordCountRef">
      <UIcon name="bi:card-text" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ formatNumber(doc.wordCount) }} words
    </span>

    <!-- Image Count -->
    <span v-if="doc.imageCount > 0" class="flex items-center metadata-item" ref="imageCountRef">
      <UIcon name="ant-design:camera-filled" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.imageCount }} images
    </span>

    <!-- Link Count -->
    <span v-if="doc.linkCount > 1" class="flex items-center metadata-item" ref="linkCountRef">
      <UIcon name="bi:link" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ doc.linkCount }} links
    </span>
  </div>
</template>

<script setup>
import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import { formatDistanceToNow } from 'date-fns'
import { useScrollAnimation } from '~/composables/useScrollAnimation'
import { nextTick, ref } from 'vue'

const { slideUp } = useScrollAnimation()

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
})

// Refs for animation targets
const draftRef = ref(null)
const dateRef = ref(null)
const readingTimeRef = ref(null)
const wordCountRef = ref(null)
const imageCountRef = ref(null)
const linkCountRef = ref(null)
const folderRef = ref(null)

const formatNumber = format(',d')
const formatBlogDate = timeFormat('%b %d %Y')

const formatRelativeTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return ''
  }
}

const animateItems = async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 200))

  const items = [
    draftRef.value,
    dateRef.value,
    readingTimeRef.value,
    wordCountRef.value,
    imageCountRef.value,
    linkCountRef.value,
    folderRef.value
  ].filter(Boolean)

  if (!items.length) return

  items.forEach((item, i) => {
    setTimeout(() => {
      slideUp(item)
    }, i * 150)
  })
}

defineExpose({ animateItems })
</script>

<style scoped>
.metadata-item {
  will-change: transform, opacity;
  backface-visibility: hidden;
  opacity: 0;
  transform: translateY(20px);
}

@media (prefers-reduced-motion: reduce) {
  .metadata-item {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
