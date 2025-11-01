<template>
  <article class="border border-zinc-300 dark:border-zinc-700 p-4 font-mono">
    <!-- Header row with confidence and status -->
    <div class="flex items-start justify-between mb-3 text-xs">
      <div class="flex items-center gap-3">
        <span class="font-bold text-zinc-900 dark:text-zinc-100">{{ displayConfidence }}%</span>
        <span v-if="prediction.deadline" class="text-zinc-500 dark:text-zinc-500">{{ formatDate(prediction.deadline) }}</span>
      </div>
      <span v-if="showStatusBadge" :class="statusBadgeColor" class="px-2 py-0.5 text-[10px] font-bold border capitalize" :class="prediction.status === 'correct' ? 'border-zinc-900 dark:border-zinc-100' : 'border-red-600 dark:border-red-400'">
        {{ prediction.status }}
      </span>
    </div>

    <!-- Statement -->
    <h3 class="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-3">
      <NuxtLink :to="`/predictions/${prediction.slug || prediction.id}`">
        {{ prediction.statement || prediction.title }}
      </NuxtLink>
    </h3>

    <!-- Description if present -->
    <p v-if="prediction.description" class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
      {{ prediction.description }}
    </p>

    <!-- Compact metadata footer -->
    <div class="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-500 pt-3 border-t border-zinc-200 dark:border-zinc-800">
      <div class="flex items-center gap-3">
        <span v-if="prediction.categories && prediction.categories.length > 0">{{ prediction.categories[0] }}</span>
        <span v-if="prediction.created">{{ formatDate(prediction.created) }}</span>
        <span v-if="prediction.updates && prediction.updates.length > 0" class="text-blue-600 dark:text-blue-400 font-bold">
          {{ prediction.updates.length }} update{{ prediction.updates.length > 1 ? 's' : '' }}
        </span>
      </div>
      <NuxtLink :to="`/predictions/${prediction.slug || prediction.id}`">
        View
      </NuxtLink>
    </div>

    <!-- Resolution note if resolved -->
    <div v-if="prediction.resolution" class="mt-3 pt-3 border-t" :class="prediction.status === 'correct' ? 'border-zinc-300 dark:border-zinc-700' : 'border-red-600 dark:border-red-400'">
      <div class="text-[10px] mb-1 font-bold" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
        Resolved {{ prediction.resolved_date ? formatDate(prediction.resolved_date) : '' }}
      </div>
      <div class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {{ prediction.resolution.substring(0, 150) }}{{ prediction.resolution.length > 150 ? '...' : '' }}
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

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

