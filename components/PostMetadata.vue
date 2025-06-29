<template>
  <div
    class="w-full text-zinc-600 dark:text-zinc-400 py-4 gap-1"
    :class="[compact ? 'text-xs' : 'text-sm gap-y-4 pl-2']"
    :style="colors && {
      '--post-color': isDark ? colors.dark.primary : colors.light.primary,
      '--post-color-rgb': isDark ? colors.dark.primaryRgb : colors.light.primaryRgb,
      '--post-color-subtle': isDark ? colors.dark.subtle : colors.light.subtle
    }"
  >
    <!-- Debug output -->
    <pre v-if="false" class="whitespace-pre-wrap text-xs">{{ metadata }}</pre>

    <!-- Folder name -->
    <span
      class="flex items-center metadata-item text-xs tracking-widest"
      :class="[compact ? 'pl-0' : 'pl-0']"
      :style="colors && { color: 'var(--post-color)' }"
      ref="folderRef"
      v-if="metadata.slug && !compact"
    >
      /{{ metadata.slug.split('/')[0] }}/
    </span>

    <!-- Draft status -->
    <span
      v-if="metadata.draft"
      class="flex items-center text-red-500 dark:text-red-400 sans-serif metadata-item"
      ref="draftRef"
    >
      <span v-if="!compact"
        >Draft, please do not publish, changes expected</span
      >
      <span v-else>Draft</span>
    </span>

    <!-- Date -->
    <span
      v-if="metadata.date"
      class="flex items-center metadata-item"
      :title="formatRelativeTime(metadata.date)"
      ref="dateRef"
    >
      <time>{{
        compact
          ? formatCompactDate(new Date(metadata.date))
          : formatBlogDate(new Date(metadata.date))
      }}</time>
    </span>

    <!-- Reading Time -->
    <span
      v-if="metadata.readingTime"
      class="flex items-center metadata-item"
      ref="readingTimeRef"
    >
      {{ metadata.readingTime }}
      {{ compact ? 'min read' : metadata.readingTime === 1 ? 'min' : 'mins' }}
    </span>

    <!-- Word Count -->
    <span
      v-if="metadata.wordCount"
      class="flex items-center metadata-item"
      ref="wordCountRef"
    >
      {{ formatCompactNumber(metadata.wordCount) }}
      {{ compact ? 'words' : 'words' }}
    </span>

    <!-- Image Count -->
    <span
      v-if="metadata.imageCount"
      class="flex items-center metadata-item"
      ref="imageCountRef"
    >
      {{ metadata.imageCount }}
      {{ compact ? 'images' : metadata.imageCount === 1 ? 'image' : 'images' }}
    </span>

    <!-- Link Count -->
    <span
      v-if="metadata.linkCount"
      class="flex items-center metadata-item"
      ref="linkCountRef"
    >
      {{ metadata.linkCount }}
      {{ compact ? 'links' : metadata.linkCount === 1 ? 'link' : 'links' }}
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
  compact?: boolean
  colors?: any
  isDark?: boolean
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
const formatCompactDate = timeFormat('%b %d')

// Add a more compact number formatter for the compact view
const formatCompactNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

// Computed properties to handle both old and new metadata formats
const metadata = computed(() => {
  const baseData = props.doc || {}
  const metaData = props.doc?.metadata || {}

  // Detailed debug logging
  // console.group('PostMetadata Debug')
  // console.log('Raw doc:', props.doc)
  // console.log('Base data:', baseData)
  // console.log('Metadata:', metaData)

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

  // console.log('Computed metadata:', {
  //   readingTime: computedMetadata.readingTime,
  //   wordCount: computedMetadata.wordCount,
  //   imageCount: computedMetadata.imageCount,
  //   linkCount: computedMetadata.linkCount,
  //   date: computedMetadata.date,
  //   draft: computedMetadata.draft,
  //   slug: computedMetadata.slug
  // })
  // console.groupEnd()

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
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Reordered array to match visual hierarchy and left-to-right reading order
  const items = [
    folderRef.value, // Folder first - it's the context
    draftRef.value, // Draft status - important warning
    dateRef.value, // Date - primary metadata
    readingTimeRef.value, // Reading time - secondary metadata
    wordCountRef.value, // Word count
    imageCountRef.value, // Image count
    linkCountRef.value // Link count
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
  opacity: 1;
  transform: none;
  @apply py-1;
}

/* View Transitions API support */
/* Removed view transition styles */

@media (prefers-reduced-motion: reduce) {
  .metadata-item {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
