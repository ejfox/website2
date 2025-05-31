<template>
  <article class="prediction-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ prediction.title }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span :class="statusColor">
            {{ prediction.confidence }}% confidence
          </span>
          <span v-if="prediction.deadline" class="ml-2">
            • Resolves by {{ formatDate(prediction.deadline) }}
          </span>
        </p>
      </div>
      <span v-if="prediction.status" :class="statusBadgeColor" 
        class="px-2 py-1 text-xs font-medium rounded-full">
        {{ prediction.status }}
      </span>
    </div>

    <p class="text-gray-700 dark:text-gray-300">
      {{ prediction.description }}
    </p>

    <div v-if="prediction.reasoning" class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <details>
        <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900">
          Reasoning
        </summary>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ prediction.reasoning }}
        </p>
      </details>
    </div>

    <div v-if="prediction.verification" class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <details open>
        <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 mb-3">
          Verification Details
        </summary>
        <PredictionVerificationDisplay :verification="prediction.verification" />
      </details>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import PredictionVerificationDisplay from './VerificationDisplay.vue'

interface Prediction {
  title: string
  description: string
  confidence: number
  deadline?: string
  status?: 'pending' | 'resolved' | 'correct' | 'incorrect' | 'ambiguous'
  reasoning?: string
  verification?: any
}

const props = defineProps<{
  prediction: Prediction
}>()

const statusColor = computed(() => {
  if (props.prediction.confidence >= 80) return 'text-green-600 dark:text-green-400'
  if (props.prediction.confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-orange-600 dark:text-orange-400'
})

const statusBadgeColor = computed(() => {
  switch (props.prediction.status) {
    case 'correct':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
    case 'incorrect':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
    case 'ambiguous':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
    case 'resolved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
