<template>
  <div :class="containerClasses" :style="colorVars">
    <!-- Folder name -->
    <span
      v-if="metadata?.slug && !compact"
      ref="folderRef"
      class="metadata-item-base text-xs pl-0"
      style="color: var(--post-color)"
    >
      /{{ folderName }}/
    </span>

    <!-- Draft status -->
    <span v-if="metadata.draft" ref="draftRef" class="metadata-item-error">
      {{ draftText }}
    </span>

    <!-- Date -->
    <span
      v-if="metadata.date"
      ref="dateRef"
      class="metadata-item-base"
      :title="relativeDate"
    >
      <time>{{ formattedDate }}</time>
    </span>

    <!-- Reading Time -->
    <span v-if="readingTime" ref="readingTimeRef" class="metadata-item-base">
      {{ readingTime }}
      {{ readingTimeUnit }}
    </span>

    <!-- Word Count -->
    <span v-if="metadata.words" ref="wordCountRef" class="metadata-item-base">
      {{ formatCompactNumber(metadata.words) }}
      words
    </span>

    <!-- Image Count -->
    <span v-if="metadata.images" ref="imageCountRef" class="metadata-item-base">
      {{ metadata.images }}
      {{ pluralize('image', metadata.images) }}
    </span>

    <!-- Link Count -->
    <span v-if="metadata.links" ref="linkCountRef" class="metadata-item-base">
      {{ metadata.links }}
      {{ pluralize('link', metadata.links) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'

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

// Computed class strings
const containerClasses = computed(() => {
  const baseClasses =
    'w-full text-zinc-600 dark:text-zinc-400 uppercase font-mono text-xs'
  const compactBase = 'flex flex-col gap-0.5 items-start'
  const compactSm = 'sm:flex-row sm:items-center sm:gap-2 sm:flex-wrap'
  const compactLayout = [compactBase, compactSm].join(' ')
  const normalLayout = 'flex items-center gap-2 md:gap-4'
  const layoutClasses = props.compact ? compactLayout : normalLayout
  return [baseClasses, layoutClasses]
})

// Refs for animation
const folderRef = ref<HTMLElement | null>(null)
const draftRef = ref<HTMLElement | null>(null)
const dateRef = ref<HTMLElement | null>(null)
const readingTimeRef = ref<HTMLElement | null>(null)
const wordCountRef = ref<HTMLElement | null>(null)
const imageCountRef = ref<HTMLElement | null>(null)
const linkCountRef = ref<HTMLElement | null>(null)

// Date formatters
const formatBlogDate = (date: Date) => format(date, 'MMM dd yyyy')
const formatCompactDate = (date: Date) => format(date, 'MMM dd')

// Simplified metadata getter
const metadata = computed(() => props.doc?.metadata || {})

// Computed values
const folderName = computed(() => metadata.value.slug?.split('/')[0] || '')
const draftText = computed(() => {
  const fullText = 'Draft, please do not publish, changes expected'
  return props.compact ? 'Draft' : fullText
})
const readingTime = computed(() =>
  metadata.value.words ? Math.ceil(metadata.value.words / 200) : 0
)
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
    return formatDistanceToNow(new Date(metadata.value.date), {
      addSuffix: true,
    })
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
    '--post-color-subtle': scheme.subtle,
  }
})

// Utilities
const formatCompactNumber = (num: number): string | number => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num
}

const pluralize = (word: string, count: number): string => {
  return count === 1 ? word : `${word}s`
}

// Remove all animation functionality
// defineExpose({ animateItems }) // Not needed anymore
</script>

<style scoped>
.metadata-item {
  @apply font-mono;
  opacity: 1;
  transform: translateY(0);
}
</style>
