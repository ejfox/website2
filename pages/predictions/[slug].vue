<template>
  <main v-if="prediction" class="py-8 px-4 md:px-8 mx-auto max-w-4xl">
    <!-- Header -->
    <header class="mb-8">
      <NuxtLink to="/predictions" class="font-mono text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← predictions
      </NuxtLink>
    </header>

    <!-- Statement with confidence -->
    <section class="mb-8">
      <div class="flex items-start gap-4 mb-4">
        <span class="font-mono text-3xl text-zinc-900 dark:text-zinc-100 font-bold shrink-0 tabular-nums">{{ prediction.confidence }}%</span>
        <h1 class="font-serif text-2xl leading-tight text-zinc-900 dark:text-zinc-100 flex-1">
          {{ prediction.statement }}
        </h1>
      </div>

      <!-- Metadata - MINIMAL -->
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
        <span v-if="prediction.status && (prediction.status === 'correct' || prediction.status === 'incorrect')" :class="prediction.status === 'correct' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'" class="font-bold text-base">
          {{ prediction.status }}
        </span>
        <span v-if="prediction.updates && prediction.updates.length > 0">· {{ prediction.updates.length }} {{ prediction.updates.length === 1 ? 'update' : 'updates' }}</span>
        <span v-if="prediction.deadline">· {{ formatDateCompact(prediction.deadline) }}</span>
      </div>
    </section>

    <!-- Market Data -->
    <MarketData :prediction="prediction" />

    <!-- Resolution -->
    <section v-if="prediction.resolution" class="mb-12">
      <h2 class="font-mono text-xs uppercase tracking-wider mb-3" :class="prediction.status === 'correct' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
        {{ prediction.status === 'correct' ? 'Correct' : prediction.status === 'incorrect' ? 'Incorrect' : 'Resolved' }}
      </h2>
      <div class="prose prose-sm dark:prose-invert max-w-none" v-html="resolutionHtml"></div>
    </section>

    <!-- Evidence -->
    <section v-if="prediction.evidence" class="mb-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Evidence</h2>
      <div class="prose prose-sm dark:prose-invert max-w-none" v-html="evidenceHtml"></div>
    </section>

    <!-- Update History -->
    <section v-if="prediction.updates && prediction.updates.length > 0" class="mb-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">Update History</h2>

      <div class="space-y-6">
        <div
          v-for="(update, index) in sortedUpdates"
          :key="index"
          class="pl-4"
        >
          <!-- Update header -->
          <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            <span class="text-zinc-900 dark:text-zinc-100">{{ formatDateCompact(update.timestamp) }}</span>
            <span v-if="update.confidenceBefore !== undefined && update.confidenceAfter !== undefined" class="font-bold text-base tabular-nums">
              · <span class="text-zinc-600 dark:text-zinc-400">{{ update.confidenceBefore }}%</span> → <span class="text-zinc-900 dark:text-zinc-100">{{ update.confidenceAfter }}%</span>
            </span>
          </div>

          <!-- Update reasoning -->
          <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
            {{ update.reasoning }}
          </div>
        </div>
      </div>
    </section>

    <!-- Related -->
    <section v-if="prediction.related && prediction.related.length > 0" class="mb-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Related</h2>
      <ul class="space-y-1 font-serif text-sm">
        <li v-for="relatedId in prediction.related" :key="relatedId">
          <NuxtLink :to="`/predictions/${relatedId}`" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            {{ relatedId }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Webmentions -->
    <Webmentions :url="predictionUrl" />
  </main>

  <!-- Error state -->
  <div v-else-if="error" class="px-4 md:px-8 mx-auto max-w-4xl py-8 font-mono text-xs">
    <div class="p-4">
      <div class="text-red-600 dark:text-red-500 mb-2 uppercase font-bold">Error: Prediction not found</div>
      <p class="text-zinc-600 dark:text-zinc-400 mb-3">
        The requested prediction does not exist or has been removed.
      </p>
      <NuxtLink to="/predictions" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← back to predictions
      </NuxtLink>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="px-4 md:px-8 mx-auto max-w-4xl py-8 font-mono text-xs">
    <p class="text-zinc-500 dark:text-zinc-500">loading...</p>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

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

const formatDateCompact = (dateString) => {
  if (!dateString) return 'Unknown'
  const d = new Date(dateString)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

// Sort updates by timestamp (most recent first)
const sortedUpdates = computed(() => {
  if (!prediction.value?.updates) return []
  return [...prediction.value.updates].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )
})

// Prediction URL for webmentions
const config = useRuntimeConfig()
const baseURL = config.public?.baseURL || (typeof window !== 'undefined' ? window.location.origin : 'https://ejfox.com')
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
