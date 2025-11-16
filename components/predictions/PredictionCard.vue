<template>
  <article class="py-4">
    <!-- Make entire card tappable on mobile -->
    <NuxtLink
      :to="`/predictions/${prediction.slug || prediction.id}`"
      class="nav-item-hover"
    >
      <!-- Statement with confidence badge - PRIORITIZED -->
      <div class="mb-2">
        <div class="flex items-start gap-3 mb-1">
          <span
            class="font-mono text-lg text-zinc-900 dark:text-zinc-100 font-bold shrink-0 tabular-nums"
            >{{ displayConfidence }}%</span
          >
          <span
            class="font-serif text-base leading-snug text-zinc-900 dark:text-zinc-100 flex-1"
          >
            {{ prediction.statement || prediction.title }}
          </span>
        </div>
      </div>

      <!-- Metadata line - MINIMAL -->
      <div class="metadata-line">
        <span
          v-if="showStatusBadge"
          :class="
            prediction.status === 'correct' ? 'text-success' : 'text-error'
          "
          >{{ prediction.status }}</span
        >
        <span v-if="prediction.updates && prediction.updates.length > 0"
          >· {{ prediction.updates.length }}
          {{ prediction.updates.length === 1 ? 'update' : 'updates' }}</span
        >
      </div>

      <!-- Resolution excerpt if resolved -->
      <div
        v-if="prediction.resolution"
        class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-normal prose prose-sm dark:prose-invert max-w-none"
        v-html="resolutionHtml"
      ></div>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
interface PredictionUpdate {
  timestamp: string
  confidenceBefore?: number
  confidenceAfter?: number
  reasoning: string
  hash: string
  gitCommit?: string
}

interface Prediction {
  id: string
  slug?: string
  title: string
  description?: string
  confidence: number
  deadline?: string
  status?: 'pending' | 'resolved' | 'correct' | 'incorrect' | 'ambiguous'
  resolution?: string
  resolved_date?: string
  statement?: string
  categories?: string[]
  created?: string
  updates?: PredictionUpdate[]
}

const props = defineProps<{ prediction: Prediction }>()

const displayConfidence = props.prediction.confidence || 0

const showStatusBadge = computed(
  () =>
    props.prediction.status &&
    (props.prediction.status === 'correct' ||
      props.prediction.status === 'incorrect')
)

const _statusBadgeColor = computed(() => {
  if (props.prediction.status === 'correct') {
    return 'text-green-600 dark:text-green-500 bg-transparent'
  }
  return 'text-red-600 dark:text-red-500 bg-transparent'
})

const _formatDateCompact = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC'
  ]
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

// Process markdown for resolution text
const { markdownToHtml } = useMarkdown()
const resolutionHtml = ref('')

// Smart truncation - get first paragraph or first 2 sentences
const truncateResolution = (text: string): string => {
  if (!text) return ''

  // Try to get just the first paragraph
  const paragraphs = text.split(/\n{2,}/)
  if (paragraphs[0] && paragraphs[0].length < 400) {
    return paragraphs[0]
  }

  // Otherwise get first 2 sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(' ')
  }

  // Fallback to character limit at word boundary
  if (text.length <= 350) return text
  const truncated = text.substring(0, 350)
  return truncated.substring(0, truncated.lastIndexOf(' ')) + '...'
}

onMounted(async () => {
  if (props.prediction.resolution) {
    const excerpt = truncateResolution(props.prediction.resolution)
    resolutionHtml.value = await markdownToHtml(excerpt)
  }
})
</script>
