<template>
  <article ref="cardRef" :class="cardClasses">
    <div ref="headerRef" class="flex items-start justify-between">
      <div class="flex-1">
        <h3
          ref="titleRef"
          class="text-2xl md:text-3xl font-light text-zinc-900 dark:text-zinc-100 leading-tight tracking-normal mb-6"
        >
          <NuxtLink
            :to="`/predictions/${prediction.slug || prediction.id}`"
            class="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {{ prediction.statement || prediction.title }}
          </NuxtLink>
        </h3>
        <p
          ref="metadataRef"
          class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed"
        >
          <span ref="confidenceRef" :class="statusColor" class="font-medium"
            >{{ displayConfidence }}% confidence</span
          >
          <span
            v-if="prediction.deadline"
            ref="deadlineRef"
            class="ml-4 text-zinc-500 dark:text-zinc-500"
            >• {{ formatDate(prediction.deadline) }}</span
          >
        </p>
      </div>
      <span
        v-if="showStatusBadge"
        ref="badgeRef"
        :class="statusBadgeColor"
        class="px-4 py-2 text-xs font-medium rounded-full uppercase tracking-[0.1em] ml-6"
      >
        {{ prediction.status }}
      </span>
    </div>

    <p
      v-if="prediction.description"
      ref="descriptionRef"
      class="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base"
    >
      {{ prediction.description }}
    </p>

    <div
      ref="progressContainerRef"
      class="w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden"
    >
      <div
        ref="progressBarRef"
        class="h-full bg-zinc-500 dark:bg-zinc-500 transition-all duration-700 ease-out"
        :style="{ width: `${displayProgress}%` }"
      />
    </div>

    <div
      v-if="prediction.evidence"
      ref="evidenceRef"
      class="border-t border-zinc-200 dark:border-zinc-800 pt-12"
    >
      <details class="group">
        <summary
          class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300 list-none mb-2"
        >
          Evidence & Reasoning
        </summary>
        <div class="mt-8 prediction-prose" v-html="evidenceHtml"></div>
      </details>
    </div>

    <div
      v-if="prediction.verification"
      ref="verificationRef"
      class="border-t border-zinc-200 dark:border-zinc-800 pt-12"
    >
      <details>
        <summary
          class="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors duration-300 mb-2"
        >
          Verification Details
        </summary>
        <div class="mt-8">
          <PredictionVerificationDisplay
            :verification="prediction.verification"
          />
        </div>
      </details>
    </div>

    <!-- Resolution section for resolved predictions -->
    <div
      v-if="prediction.resolution"
      ref="resolutionRef"
      class="border-t-2 pt-12"
      :class="[
        prediction.status === 'correct'
          ? 'border-green-200 dark:border-green-900'
          : prediction.status === 'incorrect'
            ? 'border-red-200 dark:border-red-900'
            : 'border-zinc-200 dark:border-zinc-800'
      ]"
    >
      <div class="mb-8">
        <h4
          class="text-xs font-medium uppercase tracking-[0.2em] mb-4"
          :class="[
            prediction.status === 'correct'
              ? 'text-green-600 dark:text-green-400'
              : prediction.status === 'incorrect'
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-500 dark:text-zinc-500'
          ]"
        >
          Resolution
          <span
            v-if="prediction.resolved_date"
            class="font-mono normal-case tracking-normal ml-3 text-zinc-400 dark:text-zinc-600"
          >
            • {{ formatDate(prediction.resolved_date) }}
          </span>
        </h4>

        <div class="prediction-prose" v-html="resolutionHtml"></div>
      </div>
    </div>

    <!-- Related predictions section -->
    <div
      v-if="prediction.related && prediction.related.length > 0"
      class="border-t border-zinc-200 dark:border-zinc-800 pt-8"
    >
      <h4
        class="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4"
      >
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
            <span
              class="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors"
            >
              {{ relatedId }}
            </span>
            →
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
// DELETED: useScrollAnimation import removed
// DELETED: All animation imports removed

interface Prediction {
  id: string
  slug?: string
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

// COMMENTED OUT: All animation composables to prevent content hiding
// const { dataProcessing, dataStream, criticalHighlight, dataCounter } = useScrollAnimation()
// const { createDataCard } = useAnimatables()
// // NUKED BY BLOODHOUND: const { timing, easing, staggers } = // DELETED: useAnimations()

// Mock animation variables to prevent undefined errors following delete-driven development
const cardAnimatable = ref(null)
const hasAnimated = ref(false)
const timing = ref({
  slow: 800,
  normal: 400,
  dramatic: 1200,
  quick: 150
})
const staggers = {
  loose: 100,
  dramatic: 200,
  normal: 50
}
const dataProcessing = null
const dataStream = null
const criticalHighlight = null
const dataCounter = null

// Animation state removed - using direct values now
const displayConfidence = ref(props.prediction.confidence || 0)
const displayProgress = ref(props.prediction.confidence || 0)

// Computed properties
const cardClasses = computed(() => [
  'prediction-card p-0 space-y-12 transition-all duration-300',
  props.prediction.status === 'correct'
    ? 'border-l-4 border-green-500 dark:border-green-600 pl-8'
    : props.prediction.status === 'incorrect'
      ? 'border-l-4 border-red-500 dark:border-red-600 pl-8'
      : 'pl-0'
])

const showStatusBadge = computed(
  () =>
    props.prediction.status &&
    (props.prediction.status === 'correct' ||
      props.prediction.status === 'incorrect')
)

const statusColor = computed(() => {
  const conf = props.prediction.confidence
  if (conf >= 80) return 'text-zinc-800 dark:text-zinc-200'
  if (conf >= 60) return 'text-zinc-600 dark:text-zinc-400'
  return 'text-zinc-500 dark:text-zinc-500'
})

const statusBadgeColor = computed(() => {
  const statusColors: Record<string, string> = {
    correct: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    incorrect: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300',
    ambiguous: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    resolved: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
  }
  return props.prediction.status
    ? statusColors[props.prediction.status] ||
        'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
})

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

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
    // Animation disabled following delete-driven development
    // cardAnimatable.value = createDataCard(cardRef.value as any)

    // Add hover interactions for the entire card
    cardRef.value.addEventListener('mouseenter', () => {
      // Animation disabled following delete-driven development
    })

    cardRef.value.addEventListener('mouseleave', () => {
      // Animation disabled following delete-driven development
    })
  } catch (_e) {
    // Silently handle animatable creation errors
  }
}

// Animation disabled following delete-driven development
const animateConfidenceDisplay = () => {
  if (process.server) return

  // Directly set values without animation
  displayConfidence.value = props.prediction.confidence
  displayProgress.value = props.prediction.confidence
}

// Main card reveal animation with data processing effect using motion tokens
// Animation disabled following delete-driven development
const animateCardReveal = async () => {
  if (process.server) return

  await nextTick()
  if (!cardRef.value) return

  // Simply set confidence values and setup interactions
  animateConfidenceDisplay()
  setupCardInteractions()
}

onMounted(async () => {
  // Process markdown content
  if (props.prediction.evidence)
    evidenceHtml.value = await markdownToHtml(props.prediction.evidence)
  if (props.prediction.resolution)
    resolutionHtml.value = await markdownToHtml(props.prediction.resolution)

  // DELETED: All animation code removed for better performance
})
</script>

<style scoped>
/* Simple prose styling - DELETE bloated @apply prose */
.prediction-prose {
  @apply text-zinc-600 dark:text-zinc-400 leading-relaxed;
}

.prediction-prose p {
  @apply mb-4 leading-relaxed;
}

.prediction-prose h1,
.prediction-prose h2,
.prediction-prose h3 {
  @apply font-medium tracking-wide text-zinc-800 dark:text-zinc-200;
}

.prediction-prose ul {
  @apply my-6 pl-6 list-disc;
}

.prediction-prose li {
  @apply my-2;
}

.prediction-prose strong {
  @apply text-zinc-800 dark:text-zinc-200 font-medium;
}

.prediction-prose a {
  @apply text-zinc-800 dark:text-zinc-200 underline hover:text-zinc-600 dark:hover:text-zinc-400;
}

.prediction-prose code {
  @apply bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-sm font-mono;
}

/* Prediction card base styling */
.prediction-card {
  will-change: transform, opacity, filter;
}
</style>
