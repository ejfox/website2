<template>
  <main v-if="prediction" class="py-8 px-4 md:px-8 mx-auto max-w-4xl">
    <!-- Header -->
    <header class="mb-6 pb-3 border-b border-zinc-300 dark:border-zinc-700">
      <NuxtLink to="/predictions" class="font-mono text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← predictions
      </NuxtLink>
    </header>

    <!-- Statement -->
    <section class="mb-6">
      <h1 class="font-serif text-xl leading-tight text-zinc-900 dark:text-zinc-100 mb-4">
        {{ prediction.statement }}
      </h1>

      <!-- Metadata -->
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
        <div><span class="text-zinc-900 dark:text-zinc-100">Confidence</span> {{ prediction.confidence }}%</div>
        <div v-if="prediction.deadline"><span class="text-zinc-900 dark:text-zinc-100">Deadline</span> {{ formatDateCompact(prediction.deadline) }}</div>
        <div><span class="text-zinc-900 dark:text-zinc-100">Created</span> {{ formatDateCompact(prediction.created) }}</div>
        <div v-if="prediction.status && (prediction.status === 'correct' || prediction.status === 'incorrect')">
          <span class="text-zinc-900 dark:text-zinc-100">Status</span>
          <span :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
            {{ prediction.status.toUpperCase() }}
          </span>
        </div>
        <div v-if="prediction.categories && prediction.categories.length > 0">
          <span class="text-zinc-900 dark:text-zinc-100">Categories</span> {{ prediction.categories.join(', ') }}
        </div>
        <div v-if="prediction.hash">
          <span class="text-zinc-900 dark:text-zinc-100">Hash</span> {{ prediction.hash.substring(0, 16) }}...
        </div>
      </div>
    </section>

    <!-- Evidence -->
    <section v-if="prediction.evidence" class="mb-6 pb-6 border-b border-zinc-300 dark:border-zinc-700">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Evidence</h2>
      <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-normal prose prose-sm dark:prose-invert max-w-none" v-html="evidenceHtml"></div>
    </section>

    <!-- Update History -->
    <section v-if="prediction.updates && prediction.updates.length > 0" class="mb-6 pb-6 border-b border-zinc-300 dark:border-zinc-700">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Update History</h2>

      <div class="space-y-4">
        <div
          v-for="(update, index) in sortedUpdates"
          :key="index"
          class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4"
        >
          <!-- Update header -->
          <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-1">
            <span class="text-zinc-900 dark:text-zinc-100">{{ formatDateCompact(update.timestamp) }}</span>
            <span v-if="update.confidenceBefore !== undefined && update.confidenceAfter !== undefined" class="text-zinc-600 dark:text-zinc-400">
              · {{ update.confidenceBefore }}% → {{ update.confidenceAfter }}%
            </span>
          </div>

          <!-- Update reasoning -->
          <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-snug mb-1">
            {{ update.reasoning }}
          </div>

          <!-- Update metadata -->
          <div class="font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
            <span v-if="update.hash">{{ update.hash.substring(0, 12) }}</span>
            <span v-if="update.gitCommit"> · git:{{ update.gitCommit.substring(0, 8) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Resolution -->
    <section v-if="prediction.resolution" class="mb-6 pb-6 border-b border-zinc-300 dark:border-zinc-700">
      <h2 class="font-mono text-xs uppercase tracking-wider mb-1" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
        {{ prediction.status === 'correct' ? 'Correct' : prediction.status === 'incorrect' ? 'Incorrect' : 'Resolved' }}
      </h2>
      <div v-if="prediction.resolved_date" class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-3">
        {{ formatDateCompact(prediction.resolved_date) }}
      </div>
      <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-normal prose prose-sm dark:prose-invert max-w-none" v-html="resolutionHtml"></div>
    </section>

    <!-- Related -->
    <section v-if="prediction.related && prediction.related.length > 0" class="mb-6">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Related</h2>
      <ul class="space-y-1 font-serif text-sm">
        <li v-for="relatedId in prediction.related" :key="relatedId">
          <NuxtLink :to="`/predictions/${relatedId}`" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            {{ relatedId }}
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>

  <!-- Error state -->
  <div v-else-if="error" class="px-4 md:px-8 mx-auto max-w-4xl py-8 font-mono text-xs">
    <div class="border border-red-600 dark:border-red-400 p-4">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase">Error: Prediction not found</div>
      <p class="text-zinc-600 dark:text-zinc-400 mb-3">
        The requested prediction does not exist or has been removed.
      </p>
      <NuxtLink to="/predictions" class="text-zinc-600 dark:text-zinc-400 underline hover:no-underline">
        &lt; back to predictions
      </NuxtLink>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="px-4 md:px-8 mx-auto max-w-4xl py-8 font-mono text-xs">
    <p class="text-zinc-500 dark:text-zinc-500">loading...</p>
  </div>
</template>

<script setup>
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

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
const evidenceHtml = ref('')
const resolutionHtml = ref('')

const markdownToHtml = async (markdown) => {
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
