<template>
  <article ref="cardRef" :class="cardClasses">
    <div ref="headerRef" class="flex items-start justify-between">
      <div class="flex-1">
        <h3 ref="titleRef" class="text-2xl md:text-3xl font-light text-zinc-900 dark:text-zinc-100 leading-tight tracking-normal mb-6" style="font-family: 'Fjalla One', sans-serif;">
          <NuxtLink :to="`/predictions/${prediction.slug || prediction.id}`" class="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            {{ prediction.statement || prediction.title }}
          </NuxtLink>
        </h3>
        <p ref="metadataRef" class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed" style="font-family: 'Signika Negative', sans-serif;">
          <span ref="confidenceRef" :class="statusColor" class="font-medium">{{ displayConfidence }}% confidence</span>
          <span v-if="prediction.deadline" ref="deadlineRef" class="ml-4 text-zinc-500 dark:text-zinc-500">• {{ formatDate(prediction.deadline) }}</span>
        </p>
      </div>
      <span v-if="showStatusBadge" ref="badgeRef" :class="statusBadgeColor" class="px-4 py-2 text-xs font-medium rounded-full uppercase tracking-[0.1em] ml-6">
        {{ prediction.status }}
      </span>
    </div>

    <p v-if="prediction.description" ref="descriptionRef" class="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base" style="font-family: 'Signika Negative', sans-serif;">
      {{ prediction.description }}
    </p>

    <div ref="progressContainerRef" class="w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
      <div ref="progressBarRef" class="h-full bg-zinc-500 dark:bg-zinc-500 transition-all duration-700 ease-out" :style="{ width: `${displayProgress}%` }" />
    </div>

    <div v-if="prediction.evidence" ref="evidenceRef" class="border-t border-zinc-200 dark:border-zinc-800 pt-12">
      <details class="group">
        <summary class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300 list-none mb-2">
          Evidence & Reasoning
        </summary>
        <div class="mt-8 prediction-prose" v-html="evidenceHtml">
        </div>
      </details>
    </div>

    <div v-if="prediction.verification" ref="verificationRef" class="border-t border-zinc-200 dark:border-zinc-800 pt-12">
      <details>
        <summary class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300 mb-2">
          Verification Details
        </summary>
        <div class="mt-8">
          <PredictionVerificationDisplay :verification="prediction.verification" />
        </div>
      </details>
    </div>

    <!-- Resolution section for resolved predictions -->
    <div
      v-if="prediction.resolution" ref="resolutionRef" class="border-t-2 pt-12" :class="[
        prediction.status === 'correct' ? 'border-green-200 dark:border-green-900' :
        prediction.status === 'incorrect' ? 'border-red-200 dark:border-red-900' :
        'border-zinc-200 dark:border-zinc-800'
      ]"
    >
      <div class="mb-8">
        <h4
          class="text-xs font-medium uppercase tracking-[0.2em] mb-4" :class="[
            prediction.status === 'correct' ? 'text-green-600 dark:text-green-400' :
            prediction.status === 'incorrect' ? 'text-red-600 dark:text-red-400' :
            'text-zinc-500 dark:text-zinc-500'
          ]"
        >
          Resolution
          <span v-if="prediction.resolved_date" class="font-mono normal-case tracking-normal ml-3 text-zinc-400 dark:text-zinc-600">
            • {{ formatDate(prediction.resolved_date) }}
          </span>
        </h4>
        
        <div class="prediction-prose" v-html="resolutionHtml">
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
import PredictionVerificationDisplay from './VerificationDisplay.vue'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { useScrollAnimation } from '~/composables/useScrollAnimation'
import { useAnimatables } from '~/composables/useAnimatables'
import { useAnimations } from '~/composables/useAnimations'

interface Prediction {
  title: string
  description: string
  confidence: number
  deadline?: string
  status?: 'pending' | 'resolved' | 'correct' | 'incorrect' | 'ambiguous'
  verification?: any
  evidence?: string
  resolution?: string
  resolved_date?: string
  statement?: string
  related?: string[]
}

const props = defineProps<{ prediction: Prediction }>()
const evidenceHtml = ref('')
const resolutionHtml = ref('')

// Animation refs
const cardRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const metadataRef = ref<HTMLElement | null>(null)
const confidenceRef = ref<HTMLElement | null>(null)
const deadlineRef = ref<HTMLElement | null>(null)
const badgeRef = ref<HTMLElement | null>(null)
const descriptionRef = ref<HTMLElement | null>(null)
const progressContainerRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const evidenceRef = ref<HTMLElement | null>(null)
const verificationRef = ref<HTMLElement | null>(null)
const resolutionRef = ref<HTMLElement | null>(null)

// Animation composables
const { dataProcessing, dataStream, criticalHighlight, dataCounter } = useScrollAnimation()
const { createDataCard } = useAnimatables()
const { timing, easing, staggers } = useAnimations()

// Animation state
const displayConfidence = ref(0)
const displayProgress = ref(0)
const cardAnimatable = ref<any>(null)
const hasAnimated = ref(false)

// Computed properties
const cardClasses = computed(() => [
  'prediction-card p-0 space-y-12 transition-all duration-300',
  props.prediction.status === 'correct' ? 'border-l-4 border-green-500 dark:border-green-600 pl-8' :
  props.prediction.status === 'incorrect' ? 'border-l-4 border-red-500 dark:border-red-600 pl-8' : 'pl-0'
])

const showStatusBadge = computed(() => 
  props.prediction.status && (props.prediction.status === 'correct' || props.prediction.status === 'incorrect')
)

const statusColor = computed(() => {
  const conf = props.prediction.confidence
  if (conf >= 80) return 'text-zinc-800 dark:text-zinc-200'
  if (conf >= 60) return 'text-zinc-600 dark:text-zinc-400'
  return 'text-zinc-500 dark:text-zinc-500'
})

const statusBadgeColor = computed(() => {
  const statusColors = {
    correct: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    incorrect: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300',
    ambiguous: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    resolved: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
  }
  return statusColors[props.prediction.status] || 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
})

const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const markdownToHtml = async (markdown: string) => {
  if (!markdown) return ''
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
    return String(result)
  } catch (error) {
    console.error('Error processing markdown:', error)
    return markdown
  }
}

// Setup interactive card effects
const setupCardInteractions = () => {
  if (process.server || !cardRef.value) return
  
  try {
    cardAnimatable.value = createDataCard(cardRef.value)
    
    // Add hover interactions for the entire card
    cardRef.value.addEventListener('mouseenter', () => {
      if (cardAnimatable.value) {
        cardAnimatable.value.animate({
          scale: 1.01,
          filter: 'brightness(1.02) contrast(1.02)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        })
      }
    })
    
    cardRef.value.addEventListener('mouseleave', () => {
      if (cardAnimatable.value) {
        cardAnimatable.value.animate({
          scale: 1,
          filter: 'brightness(1) contrast(1)',
          boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
        })
      }
    })
  } catch (_e) {
    // Silently handle animatable creation errors
  }
}

// Animate confidence number and progress bar using motion tokens
const animateConfidenceDisplay = () => {
  if (process.server) return
  
  // Animate confidence number
  if (confidenceRef.value) {
    dataCounter(confidenceRef.value, props.prediction.confidence, {
      duration: timing.slower, // 1200ms - standardized
      ease: easing.standard,
      update: () => {
        const currentVal = parseFloat(confidenceRef.value?.textContent?.replace(/[^0-9.-]/g, '') || '0')
        displayConfidence.value = Math.round(currentVal)
      },
      complete: () => {
        displayConfidence.value = props.prediction.confidence
      }
    })
  }
  
  // Animate progress bar with standardized timing
  setTimeout(() => {
    displayProgress.value = props.prediction.confidence
  }, timing.normal)
}

// Main card reveal animation with data processing effect using motion tokens
const animateCardReveal = async () => {
  if (process.server || hasAnimated.value) return
  
  await nextTick()
  if (!cardRef.value) return
  
  hasAnimated.value = true
  
  // Stage 1: Main card processing reveal
  dataProcessing(cardRef.value, {
    duration: timing.slow, // 800ms - standardized
    ease: easing.standard
  })
  
  // Stage 2: Title critical highlight
  setTimeout(() => {
    if (titleRef.value) {
      criticalHighlight(titleRef.value, {
        duration: timing.slow, // 800ms - standardized
        easing: easing.standard
      })
    }
  }, timing.normal) // 400ms - standardized
  
  // Stage 3: Metadata stream
  setTimeout(() => {
    if (metadataRef.value) {
      dataStream(metadataRef.value, {
        duration: timing.normal, // 400ms - standardized
        easing: easing.standard
      })
    }
    
    // Badge highlight if present
    if (badgeRef.value) {
      criticalHighlight(badgeRef.value, {
        duration: timing.normal, // 400ms - standardized
        easing: easing.expressive
      })
    }
  }, timing.slow - 200) // 600ms - standardized
  
  // Stage 4: Description and confidence animation
  setTimeout(() => {
    if (descriptionRef.value) {
      dataStream(descriptionRef.value, {
        duration: timing.normal, // 400ms - standardized
        easing: easing.standard
      })
    }
    
    // Animate confidence display
    animateConfidenceDisplay()
  }, timing.slow) // 800ms - standardized
  
  // Stage 5: Secondary sections
  const sections = [
    evidenceRef.value,
    verificationRef.value,
    resolutionRef.value
  ].filter(Boolean)
  
  sections.forEach((section, i) => {
    setTimeout(() => {
      dataStream(section, {
        duration: timing.slow,
        easing: easing.standard,
        delay: i * staggers.normal
      })
    }, timing.expressive + (i * staggers.loose))
  })
  
  // Stage 6: Setup interactions after reveal
  setTimeout(() => {
    setupCardInteractions()
  }, timing.expressive + staggers.dramatic)
}

onMounted(async () => {
  // Process markdown content
  if (props.prediction.evidence) evidenceHtml.value = await markdownToHtml(props.prediction.evidence)
  if (props.prediction.resolution) resolutionHtml.value = await markdownToHtml(props.prediction.resolution)
  
  // Initialize display values
  displayConfidence.value = 0
  displayProgress.value = 0
  
  // Start animation sequence
  await nextTick()
  animateCardReveal()
})
</script>

<style scoped>
/* Shared prose styling for evidence and resolution sections */
.prediction-prose {
  @apply prose prose-zinc dark:prose-invert max-w-none;
  @apply prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed;
  @apply prose-headings:font-medium prose-headings:tracking-wide;
  @apply prose-h1:text-lg prose-h1:mb-6 prose-h1:mt-10;
  @apply prose-h2:text-base prose-h2:mb-4 prose-h2:mt-8;
  @apply prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-[0.1em] prose-h3:text-zinc-500 dark:prose-h3:text-zinc-500;
  @apply prose-ul:my-6 prose-li:my-2 prose-li:marker:text-zinc-400 dark:prose-li:marker:text-zinc-600;
  @apply prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-strong:font-medium;
  @apply prose-em:text-zinc-700 dark:prose-em:text-zinc-300 prose-em:italic;
  @apply prose-a:text-zinc-800 dark:prose-a:text-zinc-200 prose-a:underline prose-a:decoration-zinc-300 dark:prose-a:decoration-zinc-700 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-500;
  @apply prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none;
  font-family: 'Signika Negative', sans-serif;
}

/* Prediction card base styling */
.prediction-card {
  will-change: transform, opacity, filter;
}
</style>