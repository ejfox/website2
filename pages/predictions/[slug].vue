<template>
  <main v-if="prediction" class="py-8 px-4 md:px-8 mx-auto max-w-4xl font-mono text-xs">
    <!-- Dense header -->
    <header class="mb-6 border-b border-zinc-300 dark:border-zinc-700 pb-3">
      <NuxtLink to="/predictions" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
        &lt; predictions
      </NuxtLink>
    </header>

    <!-- Statement as plaintext header -->
    <section class="mb-6">
      <h1 class="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-4">
        {{ prediction.statement }}
      </h1>

      <!-- Dense metadata block -->
      <div class="text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
        <div><span class="text-zinc-900 dark:text-zinc-100">confidence:</span> {{ prediction.confidence }}%</div>
        <div v-if="prediction.deadline"><span class="text-zinc-900 dark:text-zinc-100">deadline:</span> {{ formatDateISO(prediction.deadline) }}</div>
        <div><span class="text-zinc-900 dark:text-zinc-100">created:</span> {{ formatDateISO(prediction.created) }}</div>
        <div v-if="prediction.status && (prediction.status === 'correct' || prediction.status === 'incorrect')">
          <span class="text-zinc-900 dark:text-zinc-100">status:</span>
          <span :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
            {{ prediction.status.toUpperCase() }}
          </span>
        </div>
        <div v-if="prediction.categories && prediction.categories.length > 0">
          <span class="text-zinc-900 dark:text-zinc-100">categories:</span> {{ prediction.categories.join(', ') }}
        </div>
        <div v-if="prediction.hash">
          <span class="text-zinc-900 dark:text-zinc-100">hash:</span> {{ prediction.hash.substring(0, 16) }}...
        </div>
      </div>
    </section>

    <!-- Evidence Section -->
    <section v-if="prediction.evidence" class="mb-6 border-t border-zinc-300 dark:border-zinc-700 pt-3">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wide">Evidence</div>
      <div class="text-zinc-600 dark:text-zinc-400 leading-relaxed" v-html="evidenceHtml"></div>
    </section>

    <!-- Update History Section -->
    <section v-if="prediction.updates && prediction.updates.length > 0" class="mb-6 border-t border-zinc-300 dark:border-zinc-700 pt-3">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wide">Update History ({{ prediction.updates.length }})</div>

      <div class="space-y-3">
        <div
          v-for="(update, index) in sortedUpdates"
          :key="index"
          class="border-l border-zinc-400 dark:border-zinc-600 pl-3"
        >
          <!-- Dense update header -->
          <div class="text-zinc-900 dark:text-zinc-100 mb-1">
            <span class="font-bold">{{ formatDateISO(update.timestamp) }}</span>
            <span v-if="update.confidenceBefore !== undefined && update.confidenceAfter !== undefined">
              : {{ update.confidenceBefore }}% → {{ update.confidenceAfter }}%
            </span>
          </div>

          <!-- Update reasoning -->
          <div class="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-1">
            {{ update.reasoning }}
          </div>

          <!-- Update metadata -->
          <div class="text-zinc-500 dark:text-zinc-500 text-[10px]">
            <span v-if="update.hash">hash={{ update.hash.substring(0, 12) }}</span>
            <span v-if="update.gitCommit"> git={{ update.gitCommit.substring(0, 8) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Resolution Section (if resolved) -->
    <section v-if="prediction.resolution" class="mb-6 border-t border-zinc-300 dark:border-zinc-700 pt-3">
      <div class="mb-2 uppercase tracking-wide" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
        Resolution: {{ prediction.status === 'correct' ? 'CORRECT' : prediction.status === 'incorrect' ? 'INCORRECT' : 'RESOLVED' }}
      </div>
      <div v-if="prediction.resolved_date" class="text-zinc-500 dark:text-zinc-500 mb-2">
        {{ formatDateISO(prediction.resolved_date) }}
      </div>
      <div class="text-zinc-600 dark:text-zinc-400 leading-relaxed" v-html="resolutionHtml"></div>
    </section>

    <!-- Related Predictions -->
    <section v-if="prediction.related && prediction.related.length > 0" class="mb-6 border-t border-zinc-300 dark:border-zinc-700 pt-3">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wide">Related</div>
      <ul class="space-y-1">
        <li v-for="relatedId in prediction.related" :key="relatedId">
          <NuxtLink :to="`/predictions/${relatedId}`" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline">
            → {{ relatedId }}
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

const formatDateISO = (dateString) => {
  if (!dateString) return 'unknown'
  const d = new Date(dateString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
