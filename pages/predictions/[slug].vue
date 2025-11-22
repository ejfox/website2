<template>
  <main v-if="prediction" class="py-8 container-main">
    <!-- Header -->
    <header class="section-spacing-lg">
      <NuxtLink to="/predictions" class="mono-xs text-muted link-hover">
        ← predictions
      </NuxtLink>
    </header>

    <!-- Statement with confidence -->
    <section class="section-spacing-lg">
      <div class="flex-gap-4 section-spacing-sm">
        <span class="font-mono text-3xl text-primary font-bold shrink-0 tabular"
          >{{ prediction.confidence }}%</span
        >
        <h1 class="font-serif text-2xl leading-tight text-primary flex-1">
          {{ prediction.statement }}
        </h1>
      </div>

      <!-- Metadata - MINIMAL -->
      <div class="mono-xs text-muted flex-gap-2">
        <span
          v-if="
            prediction.status &&
            (prediction.status === 'correct' ||
              prediction.status === 'incorrect')
          "
          :class="
            prediction.status === 'correct' ? 'text-success' : 'text-error'
          "
          class="font-bold text-base"
        >
          {{ prediction.status }}
        </span>
        <span v-if="prediction.updates && prediction.updates.length > 0"
          >· {{ prediction.updates.length }}
          {{ prediction.updates.length === 1 ? 'update' : 'updates' }}</span
        >
        <span v-if="prediction.deadline"
          >· {{ formatShortDate(prediction.deadline) }}</span
        >
      </div>
    </section>

    <!-- Market Data -->
    <MarketData :prediction="prediction" />

    <!-- Resolution -->
    <section v-if="prediction.resolution" class="section-spacing">
      <h2
        class="heading-2 mb-3"
        :class="prediction.status === 'correct' ? 'text-success' : 'text-error'"
      >
        {{
          prediction.status === 'correct'
            ? 'Correct'
            : prediction.status === 'incorrect'
              ? 'Incorrect'
              : 'Resolved'
        }}
      </h2>
      <div
        class="prose prose-sm dark:prose-invert max-w-none"
        v-html="resolutionHtml"
      ></div>
    </section>

    <!-- Evidence -->
    <section v-if="prediction.evidence" class="section-spacing">
      <h2 class="heading-2 mb-3">Evidence</h2>
      <div
        class="prose prose-sm dark:prose-invert max-w-none"
        v-html="evidenceHtml"
      ></div>
    </section>

    <!-- Update History -->
    <section
      v-if="prediction.updates && prediction.updates.length > 0"
      class="section-spacing"
    >
      <h2 class="heading-2 section-spacing-sm">Update History</h2>

      <div class="space-y-6">
        <div v-for="(update, index) in sortedUpdates" :key="index" class="pl-4">
          <!-- Update header -->
          <div class="mono-xs text-muted mb-2">
            <span class="text-primary">{{
              formatShortDate(update.timestamp)
            }}</span>
            <span
              v-if="
                update.confidenceBefore !== undefined &&
                update.confidenceAfter !== undefined
              "
              class="font-bold text-base tabular"
            >
              ·
              <span class="text-secondary">{{ update.confidenceBefore }}%</span>
              → <span class="text-primary">{{ update.confidenceAfter }}%</span>
            </span>
          </div>

          <!-- Update reasoning -->
          <div class="text-body">
            {{ update.reasoning }}
          </div>
        </div>
      </div>
    </section>

    <!-- Related -->
    <section
      v-if="prediction.related && prediction.related.length > 0"
      class="section-spacing"
    >
      <h2 class="heading-2 mb-3">Related</h2>
      <ul class="stack-1 font-serif text-sm">
        <li v-for="relatedId in prediction.related" :key="relatedId">
          <NuxtLink
            :to="`/predictions/${relatedId}`"
            class="text-secondary link-hover"
          >
            {{ relatedId }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Webmentions -->
    <Webmentions :url="predictionUrl" />
  </main>

  <!-- Error state -->
  <div v-else-if="error" class="container-main py-8 mono-xs">
    <div class="p-4">
      <div class="text-error mb-2 uppercase font-bold">
        Error: Prediction not found
      </div>
      <p class="text-secondary mb-3">
        The requested prediction does not exist or has been removed.
      </p>
      <NuxtLink to="/predictions" class="text-secondary link-hover">
        ← back to predictions
      </NuxtLink>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="px-4 md:px-8 mx-auto max-w-4xl py-8 font-mono text-xs">
    <p class="text-muted">loading...</p>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug
const { formatShortDate } = useDateFormat()

// Fetch prediction data
const { data: prediction, error } = await useAsyncData(
  `prediction-${slug}`,
  async () => {
    try {
      const predictions = await $fetch('/api/predictions')
      return predictions.find((p) => p.slug === slug || p.id === slug)
    } catch (error) {
      console.error('Error fetching prediction:', error)
      throw error
    }
  }
)

// Process markdown content
const { markdownToHtml } = useMarkdown()
const evidenceHtml = ref('')
const resolutionHtml = ref('')

onMounted(async () => {
  if (prediction.value) {
    if (prediction.value.evidence) {
      evidenceHtml.value = await markdownToHtml(prediction.value.evidence)
    }
    if (prediction.value.resolution) {
      resolutionHtml.value = await markdownToHtml(prediction.value.resolution)
    }
  }
})

// Sort updates by timestamp (most recent first)
const sortedUpdates = computed(() => {
  if (!prediction.value?.updates) return []
  return [...prediction.value.updates].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )
})

// Prediction URL for webmentions
const config = useRuntimeConfig()
const baseURL =
  config.public?.baseURL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://ejfox.com')
const predictionUrl = computed(() => `${baseURL}/predictions/${slug}`)

// SEO meta
useSeoMeta({
  title: prediction.value?.statement || 'Prediction',
  description:
    prediction.value?.evidence?.slice(0, 160) ||
    'A forecasting prediction with cryptographic verification',
  ogTitle: `${prediction.value?.statement || 'Prediction'} | ejfox.com`,
  ogDescription:
    prediction.value?.evidence?.slice(0, 160) ||
    'Cryptographically verified prediction',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
