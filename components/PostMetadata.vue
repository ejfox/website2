<template>
  <div
    class="w-full text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-2 monospace p-2">
    <!-- Debug output -->
    <pre v-if="false" class="whitespace-pre-wrap text-xs">{{ metadata }}</pre>

    <!-- Folder name -->
    <span class="flex items-center metadata-item text-xs tracking-widest pl-2" ref="folderRef" v-if="metadata.slug">
      <!-- <UIcon name="bi:folder" class="mr-2 text-zinc-400 dark:text-zinc-600" /> -->

      /{{ metadata.slug.split('/')[0] }}/
    </span>

    <!-- <pre>{{ doc }}</pre> -->

    <!-- Draft status -->
    <span v-if="metadata.draft" class="flex items-center text-red-500 dark:text-red-400 sans-serif metadata-item"
      ref="draftRef">
      <UIcon name="bi:file-earmark-text" class="mr-2 text-red-400 dark:text-red-600" />
      Draft, please do not publish, changes expected
    </span>

    <!-- Date -->
    <span v-if="metadata.date" class="flex items-center metadata-item" :title="formatRelativeTime(metadata.date)"
      ref="dateRef">
      <UIcon name="ant-design:calendar-outlined" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      <time>{{ formatBlogDate(new Date(metadata.date)) }}</time>
    </span>

    <!-- Reading Time -->
    <span v-if="metadata.readingTime" class="flex items-center metadata-item" ref="readingTimeRef">
      <UIcon name="bi:clock-history" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ metadata.readingTime }} {{ metadata.readingTime === 1 ? 'min' : 'mins' }} read
    </span>

    <!-- Word Count -->
    <span v-if="metadata.wordCount" class="flex items-center metadata-item" ref="wordCountRef">
      <UIcon name="bi:card-text" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ formatNumber(metadata.wordCount) }} words
    </span>

    <!-- Image Count -->
    <span v-if="metadata.imageCount" class="flex items-center metadata-item" ref="imageCountRef">
      <UIcon name="ant-design:camera-filled" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ metadata.imageCount }} {{ metadata.imageCount === 1 ? 'image' : 'images' }}
    </span>

    <!-- Link Count -->
    <span v-if="metadata.linkCount" class="flex items-center metadata-item" ref="linkCountRef">
      <UIcon name="bi:link" class="mr-2 text-zinc-400 dark:text-zinc-600" />
      {{ metadata.linkCount }} {{ metadata.linkCount === 1 ? 'link' : 'links' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import { formatDistanceToNow } from 'date-fns'
import { useScrollAnimation } from '~/composables/useScrollAnimation'
import { nextTick, ref, computed } from 'vue'

interface PostMetadata {
  title?: string
  date?: string | Date
  draft?: boolean
  readingTime?: number
  wordCount?: number
  imageCount?: number
  linkCount?: number
  words?: number
  images?: number
  links?: number
  dek?: string
  slug?: string
}

interface Post {
  slug?: string
  title?: string
  date?: string | Date
  draft?: boolean
  readingTime?: number
  wordCount?: number
  imageCount?: number
  linkCount?: number
  dek?: string
  metadata?: PostMetadata
}

const { slideUp } = useScrollAnimation()

const props = defineProps<{
  doc: Post
}>()

// Refs for animation targets
const draftRef = ref<HTMLElement | null>(null)
const dateRef = ref<HTMLElement | null>(null)
const readingTimeRef = ref<HTMLElement | null>(null)
const wordCountRef = ref<HTMLElement | null>(null)
const imageCountRef = ref<HTMLElement | null>(null)
const linkCountRef = ref<HTMLElement | null>(null)
const folderRef = ref<HTMLElement | null>(null)

const formatNumber = format(',d')
const formatBlogDate = timeFormat('%b %d %Y')

// Computed properties to handle both old and new metadata formats
const metadata = computed(() => {
  const baseData = props.doc || {}
  const metaData = props.doc?.metadata || {}

  // Detailed debug logging
  console.group('PostMetadata Debug')
  console.log('Raw doc:', props.doc)
  console.log('Base data:', baseData)
  console.log('Metadata:', metaData)

  const computedMetadata = {
    ...baseData,
    ...metaData,
    // Handle both old and new property names
    readingTime: Math.ceil((metaData.words || baseData.wordCount || 0) / 200), // Estimate reading time from word count
    wordCount: metaData.words || baseData.wordCount || 0,
    imageCount: metaData.images || baseData.imageCount || 0,
    linkCount: metaData.links || baseData.linkCount || 0,
    date: metaData.date || baseData.date,
    draft: metaData.draft || baseData.draft || false,
    slug: metaData.slug || baseData.slug || '',
    dek: metaData.dek || baseData.dek || ''
  }

  console.log('Computed metadata:', {
    readingTime: computedMetadata.readingTime,
    wordCount: computedMetadata.wordCount,
    imageCount: computedMetadata.imageCount,
    linkCount: computedMetadata.linkCount,
    date: computedMetadata.date,
    draft: computedMetadata.draft,
    slug: computedMetadata.slug
  })
  console.groupEnd()

  return computedMetadata
})

const formatRelativeTime = (date: string | Date) => {
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

  // Reordered array to match visual hierarchy and left-to-right reading order
  const items = [
    folderRef.value,      // Folder first - it's the context
    draftRef.value,       // Draft status - important warning
    dateRef.value,        // Date - primary metadata
    readingTimeRef.value, // Reading time - secondary metadata
    wordCountRef.value,   // Word count
    imageCountRef.value,  // Image count
    linkCountRef.value    // Link count
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
