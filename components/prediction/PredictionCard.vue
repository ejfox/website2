<template>
  <article
    :class="[
      'prediction-card p-0 space-y-8 transition-all duration-300',
      prediction.status === 'correct' ? 'border-l-4 border-green-500 dark:border-green-600 pl-6' :
      prediction.status === 'incorrect' ? 'border-l-4 border-red-500 dark:border-red-600 pl-6' :
      'pl-0'
    ]"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-xl md:text-2xl font-light text-zinc-900 dark:text-zinc-100 leading-9 tracking-normal" style="font-family: 'Fjalla One', sans-serif;">
          <NuxtLink 
            :to="`/predictions/${prediction.slug || prediction.id}`"
            class="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {{ prediction.statement || prediction.title }}
          </NuxtLink>
        </h3>
        <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-6" style="font-family: 'Signika Negative', sans-serif;">
          <span :class="statusColor" class="font-medium">
            {{ prediction.confidence }}% confidence
          </span>
          <span v-if="prediction.deadline" class="ml-3 text-zinc-500 dark:text-zinc-500">
            • {{ formatDate(prediction.deadline) }}
          </span>
        </p>
      </div>
      <span
        v-if="prediction.status && (prediction.status === 'correct' || prediction.status === 'incorrect')" :class="statusBadgeColor" 
        class="px-3 py-1 text-xs font-medium rounded-full uppercase tracking-[0.1em]"
      >
        {{ prediction.status }}
      </span>
    </div>

    <p v-if="prediction.description" class="text-zinc-600 dark:text-zinc-400 leading-8 text-base" style="font-family: 'Signika Negative', sans-serif;">
      {{ prediction.description }}
    </p>

    <!-- Confidence visualization bar -->
    <div class="w-full h-px bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
      <div 
        class="h-full bg-zinc-500 dark:bg-zinc-500 transition-all duration-700 ease-out"
        :style="{ width: `${prediction.confidence}%` }"
      />
    </div>

    <div v-if="prediction.evidence" class="border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <details class="group">
        <summary class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300 list-none">
          Evidence & Reasoning
        </summary>
        <div
          class="mt-6 prose prose-zinc dark:prose-invert max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:font-medium prose-headings:tracking-wide prose-h1:text-lg prose-h1:mb-4 prose-h1:mt-8 prose-h2:text-base prose-h2:mb-3 prose-h2:mt-6 prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-[0.1em] prose-h3:text-zinc-500 dark:prose-h3:text-zinc-500 prose-ul:my-4 prose-li:my-1 prose-li:marker:text-zinc-400 dark:prose-li:marker:text-zinc-600 prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-strong:font-medium prose-em:text-zinc-700 dark:prose-em:text-zinc-300 prose-em:italic prose-a:text-zinc-800 dark:prose-a:text-zinc-200 prose-a:underline prose-a:decoration-zinc-300 dark:prose-a:decoration-zinc-700 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-500 prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none"
          style="font-family: 'Signika Negative', sans-serif;"
          v-html="evidenceHtml"
        >
        </div>
      </details>
    </div>

    <div v-if="prediction.verification" class="border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <details>
        <summary class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300">
          Verification Details
        </summary>
        <div class="mt-4">
          <PredictionVerificationDisplay :verification="prediction.verification" />
        </div>
      </details>
    </div>

    <!-- Resolution section for resolved predictions -->
    <div
      v-if="prediction.resolution" class="border-t-2 pt-8" :class="[
        prediction.status === 'correct' ? 'border-green-200 dark:border-green-900' :
        prediction.status === 'incorrect' ? 'border-red-200 dark:border-red-900' :
        'border-zinc-200 dark:border-zinc-800'
      ]"
    >
      <div class="mb-6">
        <h4
          class="text-xs font-medium uppercase tracking-[0.2em] mb-3" :class="[
            prediction.status === 'correct' ? 'text-green-600 dark:text-green-400' :
            prediction.status === 'incorrect' ? 'text-red-600 dark:text-red-400' :
            'text-zinc-500 dark:text-zinc-500'
          ]"
        >
          Resolution
          <span v-if="prediction.resolved_date" class="font-mono normal-case tracking-normal ml-2 text-zinc-400 dark:text-zinc-600">
            • {{ formatDate(prediction.resolved_date) }}
          </span>
        </h4>
        
        <div
          class="prose prose-zinc dark:prose-invert max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:font-medium prose-headings:tracking-wide prose-h1:text-lg prose-h1:mb-4 prose-h1:mt-8 prose-h2:text-base prose-h2:mb-3 prose-h2:mt-6 prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-[0.1em] prose-h3:text-zinc-500 dark:prose-h3:text-zinc-500 prose-ul:my-4 prose-li:my-1 prose-li:marker:text-zinc-400 dark:prose-li:marker:text-zinc-600 prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-strong:font-medium prose-em:text-zinc-700 dark:prose-em:text-zinc-300 prose-em:italic prose-a:text-zinc-800 dark:prose-a:text-zinc-200 prose-a:underline prose-a:decoration-zinc-300 dark:prose-a:decoration-zinc-700 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-500 prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none"
          style="font-family: 'Signika Negative', sans-serif;"
          v-html="resolutionHtml"
        >
        </div>
      </div>
    </div>

    <!-- Related predictions section -->
    <div v-if="prediction.related && prediction.related.length > 0" class="border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <h4 class="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">
        Related Predictions
      </h4>
      <div class="space-y-3">
        <NuxtLink 
          v-for="relatedId in prediction.related" 
          :key="relatedId"
          :to="`/predictions/${relatedId}`"
          class="block p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300 group"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              {{ relatedId }}
            </span>
            <Icon name="heroicons:arrow-right" class="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import PredictionVerificationDisplay from './VerificationDisplay.vue'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

interface Prediction {
  title: string
  description: string
  confidence: number
  deadline?: string
  status?: 'pending' | 'resolved' | 'correct' | 'incorrect' | 'ambiguous'
  reasoning?: string
  verification?: any
  evidence?: string
  resolution?: string
  resolved_date?: string
  statement?: string
  related?: string[]
}

const props = defineProps<{
  prediction: Prediction
}>()

const evidenceHtml = ref('')
const resolutionHtml = ref('')

onMounted(async () => {
  if (props.prediction.evidence) {
    evidenceHtml.value = await markdownToHtml(props.prediction.evidence)
  }
  if (props.prediction.resolution) {
    resolutionHtml.value = await markdownToHtml(props.prediction.resolution)
  }
})

const statusColor = computed(() => {
  if (props.prediction.confidence >= 80) return 'text-zinc-800 dark:text-zinc-200'
  if (props.prediction.confidence >= 60) return 'text-zinc-600 dark:text-zinc-400'
  return 'text-zinc-500 dark:text-zinc-500'
})

const statusBadgeColor = computed(() => {
  switch (props.prediction.status) {
    case 'correct':
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
    case 'incorrect':
      return 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300'
    case 'ambiguous':
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
    case 'resolved':
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
    default:
      return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const markdownToHtml = async (markdown: string) => {
  if (!markdown) return ''
  
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
    
    const result = await processor.process(markdown)
    return String(result)
  } catch (error) {
    console.error('Error processing markdown:', error)
    return markdown
  }
}
</script>
