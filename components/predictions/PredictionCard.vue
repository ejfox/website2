<template>
  <article class="border-b border-zinc-300 dark:border-zinc-700 py-4">
    <!-- Metadata line with academic density -->
    <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-2">
      <span class="text-zinc-900 dark:text-zinc-100 font-bold">{{ displayConfidence }}%</span>
      <span v-if="prediction.deadline"> · {{ formatDateCompact(prediction.deadline) }}</span>
      <span v-if="showStatusBadge" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'"> · {{ prediction.status }}</span>
      <span v-if="prediction.updates && prediction.updates.length > 0" class="text-zinc-600 dark:text-zinc-400"> · {{ prediction.updates.length }} {{ prediction.updates.length === 1 ? 'update' : 'updates' }}</span>
    </div>

    <!-- Statement in serif -->
    <div class="mb-2">
      <NuxtLink :to="`/predictions/${prediction.slug || prediction.id}`" class="font-serif text-sm leading-snug text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400">
        {{ prediction.statement || prediction.title }}
      </NuxtLink>
    </div>

    <!-- Categories and created date -->
    <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
      <span v-if="prediction.categories && prediction.categories.length > 0">{{ prediction.categories.join(', ') }}</span>
      <span v-if="prediction.created && prediction.categories && prediction.categories.length > 0"> · </span>
      <span v-if="prediction.created">{{ formatDateCompact(prediction.created) }}</span>
    </div>

    <!-- Resolution note if resolved -->
    <div v-if="prediction.resolution" class="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-700">
      <div class="font-mono text-xs mb-1" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
        {{ prediction.status === 'correct' ? 'CORRECT' : 'INCORRECT' }} · {{ prediction.resolved_date ? formatDateCompact(prediction.resolved_date) : '' }}
      </div>
      <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
        {{ prediction.resolution.substring(0, 200) }}{{ prediction.resolution.length > 200 ? '...' : '' }}
      </div>
    </div>
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
    (props.prediction.status === 'correct' || props.prediction.status === 'incorrect')
)

const statusBadgeColor = computed(() => {
  if (props.prediction.status === 'correct') {
    return 'text-zinc-900 dark:text-zinc-100 bg-transparent'
  }
  return 'text-red-600 dark:text-red-400 bg-transparent'
})

const formatDateCompact = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}
</script>

