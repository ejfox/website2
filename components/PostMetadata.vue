<template>
  <div
    class="metadata-container"
    :style="colorVars"
  >
    <!-- Folder name -->
    <span
      v-if="metadata?.slug && !compact"
      ref="folderRef"
      class="metadata-item metadata-folder"
    >
      /{{ folderName }}/
    </span>

    <!-- Draft status -->
    <span
      v-if="metadata.draft"
      ref="draftRef"
      class="metadata-item metadata-draft"
    >
      {{ draftText }}
    </span>

    <!-- Date -->
    <span
      v-if="metadata.date"
      ref="dateRef"
      class="metadata-item"
      :title="relativeDate"
    >
      <time>{{ formattedDate }}</time>
    </span>

    <!-- Reading Time -->
    <span
      v-if="readingTime"
      ref="readingTimeRef"
      class="metadata-item"
    >
      {{ readingTime }}
      {{ readingTimeUnit }}
    </span>

    <!-- Word Count -->
    <span v-if="metadata.words" ref="wordCountRef" class="metadata-item">
      {{ formatCompactNumber(metadata.words) }}
      words
    </span>

    <!-- Image Count -->
    <span v-if="metadata.images" ref="imageCountRef" class="metadata-item">
      {{ metadata.images }}
      {{ pluralize('image', metadata.images) }}
    </span>

    <!-- Link Count -->
    <span v-if="metadata.links" ref="linkCountRef" class="metadata-item">
      {{ metadata.links }}
      {{ pluralize('link', metadata.links) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { timeFormat } from 'd3-time-format'
import { formatDistanceToNow } from 'date-fns'

interface PostMetadata {
  date?: string | Date
  draft?: boolean
  words?: number
  images?: number
  links?: number
  slug?: string
}

interface ColorScheme {
  light: {
    primary: string
    primaryRgb: string
    subtle: string
  }
  dark: {
    primary: string
    primaryRgb: string
    subtle: string
  }
}

interface Props {
  doc: {
    metadata?: PostMetadata
  }
  compact?: boolean
  colors?: ColorScheme
  isDark?: boolean
}

const props = defineProps<Props>()

// Refs for animation
const folderRef = ref<HTMLElement | null>(null)
const draftRef = ref<HTMLElement | null>(null)
const dateRef = ref<HTMLElement | null>(null)
const readingTimeRef = ref<HTMLElement | null>(null)
const wordCountRef = ref<HTMLElement | null>(null)
const imageCountRef = ref<HTMLElement | null>(null)
const linkCountRef = ref<HTMLElement | null>(null)

// Date formatters
const formatBlogDate = timeFormat('%b %d %Y')
const formatCompactDate = timeFormat('%b %d')

// Simplified metadata getter
const metadata = computed(() => props.doc?.metadata || {})

// Computed values
const folderName = computed(() => metadata.value.slug?.split('/')[0] || '')
const draftText = computed(() => props.compact ? 'Draft' : 'Draft, please do not publish, changes expected')
const readingTime = computed(() => metadata.value.words ? Math.ceil(metadata.value.words / 200) : 0)
const readingTimeUnit = computed(() => {
  if (props.compact) return 'min read'
  return readingTime.value === 1 ? 'min' : 'mins'
})

const formattedDate = computed(() => {
  if (!metadata.value.date) return ''
  const date = new Date(metadata.value.date)
  return props.compact ? formatCompactDate(date) : formatBlogDate(date)
})

const relativeDate = computed(() => {
  if (!metadata.value.date) return ''
  try {
    return formatDistanceToNow(new Date(metadata.value.date), { addSuffix: true })
  } catch {
    return ''
  }
})

const colorVars = computed(() => {
  if (!props.colors) return null
  const scheme = props.isDark ? props.colors.dark : props.colors.light
  return {
    '--post-color': scheme.primary,
    '--post-color-rgb': scheme.primaryRgb,
    '--post-color-subtle': scheme.subtle
  }
})

// Utilities
const formatCompactNumber = (num: number): string | number => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num
}

const pluralize = (word: string, count: number): string => {
  if (props.compact) return `${word}s`
  return count === 1 ? word : `${word}s`
}

// Epic metadata reveal with sophisticated staging
const animateItems = async () => {
  // No animations needed
  return
}

defineExpose({ animateItems })
</script>

<style scoped>
.metadata-container {
  @apply w-full flex items-center gap-3;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply uppercase font-mono text-xs;
}

.metadata-item {
  @apply py-1 flex-shrink-0 whitespace-nowrap;
  @apply text-zinc-600 dark:text-zinc-400;
  will-change: transform, opacity;
  backface-visibility: hidden;
  /* Ensure visible on SSR */
  opacity: 1;
  transform: translateY(0);
}

/* Only animate on client side */
@media (prefers-reduced-motion: no-preference) {
  .metadata-item {
    animation: fadeInUp 0.6s ease-out forwards;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metadata-folder {
  @apply text-xs pl-0;
  color: var(--post-color);
}

.metadata-draft {
  @apply text-red-500 dark:text-red-400 font-sans !important;
}

@media (prefers-reduced-motion: reduce) {
  .metadata-item {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>