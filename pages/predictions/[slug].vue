<template>
  <main v-if="prediction" class="py-12 px-4 md:px-8 mx-auto max-w-4xl font-mono">
    <!-- Header with back navigation -->
    <header class="mb-8 border-b border-zinc-300 dark:border-zinc-700 pb-4">
      <div class="flex items-center justify-between mb-2 text-xs">
        <NuxtLink
          to="/predictions"
          class="text-zinc-600 dark:text-zinc-400"
        >
          ← Back to predictions
        </NuxtLink>

        <div class="text-zinc-500 dark:text-zinc-500">
          Prediction
        </div>
      </div>
    </header>

    <!-- Main prediction statement -->
    <section class="mb-12">
      <h1 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6">
        {{ prediction.statement }}
      </h1>

      <!-- Metadata table -->
      <table class="w-full text-xs border-collapse mb-8">
        <tbody class="text-zinc-600 dark:text-zinc-400">
          <tr class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Confidence</td>
            <td class="text-right font-bold text-zinc-900 dark:text-zinc-100">{{ prediction.confidence }}%</td>
          </tr>
          <tr v-if="prediction.deadline" class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Deadline</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ formatDate(prediction.deadline) }}</td>
          </tr>
          <tr class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Created</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ formatDate(prediction.created) }}</td>
          </tr>
          <tr v-if="prediction.status && (prediction.status === 'correct' || prediction.status === 'incorrect')" class="border-b border-zinc-300 dark:border-zinc-700">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Status</td>
            <td class="text-right font-bold" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
              {{ prediction.status.toUpperCase() }}
            </td>
          </tr>
          <tr v-if="prediction.categories && prediction.categories.length > 0">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Categories</td>
            <td class="text-right text-zinc-600 dark:text-zinc-400">{{ prediction.categories.join(', ') }}</td>
          </tr>
          <tr v-if="prediction.hash">
            <td class="py-2 font-bold text-zinc-900 dark:text-zinc-100">Hash</td>
            <td class="text-right text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">{{ prediction.hash.substring(0, 16) }}...</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Evidence Section -->
    <section v-if="prediction.evidence" class="mb-12 border-t border-zinc-300 dark:border-zinc-700 pt-6">
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Evidence
      </h2>

      <div class="prose prose-sm dark:prose-invert prose-zinc max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:mb-4 prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-headings:mt-6 prose-headings:mb-3 prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-ul:my-4 prose-li:my-1 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold prose-a:text-zinc-900 dark:prose-a:text-zinc-100 prose-a:underline prose-code:text-zinc-900 dark:prose-code:text-zinc-100 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none font-mono" v-html="evidenceHtml"></div>
    </section>

    <!-- Update History Section -->
    <section v-if="prediction.updates && prediction.updates.length > 0" class="mb-12 border-t border-zinc-300 dark:border-zinc-700 pt-6">
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Update History
      </h2>

      <div class="space-y-4">
        <div
          v-for="(update, index) in sortedUpdates"
          :key="index"
          class="border-l-2 border-blue-600 dark:border-blue-400 pl-4 pb-4"
        >
          <!-- Update header -->
          <div class="flex items-center justify-between mb-2">
            <time class="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {{ formatDate(update.timestamp) }}
            </time>
            <span
              v-if="update.confidenceBefore !== undefined && update.confidenceAfter !== undefined"
              class="text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              {{ update.confidenceBefore }}% → {{ update.confidenceAfter }}%
            </span>
          </div>

          <!-- Update reasoning -->
          <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            {{ update.reasoning }}
          </p>

          <!-- Update metadata -->
          <div class="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-500">
            <span v-if="update.hash" class="font-mono">{{ update.hash.substring(0, 8) }}...</span>
            <span v-if="update.gitCommit" class="font-mono">git:{{ update.gitCommit.substring(0, 8) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Resolution Section (if resolved) -->
    <section v-if="prediction.resolution" class="mb-12 border-t border-zinc-300 dark:border-zinc-700 pt-6">
      <h2 class="text-sm font-bold mb-1" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
        Resolution: {{ prediction.status === 'correct' ? 'Correct' : prediction.status === 'incorrect' ? 'Incorrect' : 'Resolved' }}
      </h2>
      <p v-if="prediction.resolved_date" class="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
        {{ formatDate(prediction.resolved_date) }}
      </p>

      <div class="prose prose-sm dark:prose-invert prose-zinc max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:mb-4 prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-headings:mt-6 prose-headings:mb-3 prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-ul:my-4 prose-li:my-1 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-bold prose-a:text-zinc-900 dark:prose-a:text-zinc-100 prose-a:underline prose-code:text-zinc-900 dark:prose-code:text-zinc-100 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none font-mono" v-html="resolutionHtml"></div>
    </section>

    <!-- Related Predictions -->
    <section v-if="prediction.related && prediction.related.length > 0" class="mb-12 border-t border-zinc-300 dark:border-zinc-700 pt-6">
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Related
      </h2>

      <ul class="space-y-2 text-xs">
        <li v-for="relatedId in prediction.related" :key="relatedId" class="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <NuxtLink :to="`/predictions/${relatedId}`" class="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
            <span>{{ relatedId }}</span>
            <span>→</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>

  <!-- Error state -->
  <div v-else-if="error" class="px-4 md:px-8 mx-auto max-w-4xl py-12 font-mono">
    <div class="border border-red-600 dark:border-red-400 p-6">
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Error: Prediction not found
      </h2>
      <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
        The requested prediction does not exist or has been removed.
      </p>
      <NuxtLink to="/predictions" class="inline-block border border-zinc-900 dark:border-zinc-100 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100">
        Back to predictions
      </NuxtLink>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="px-4 md:px-8 mx-auto max-w-4xl py-12 font-mono">
    <p class="text-xs text-zinc-500 dark:text-zinc-500">Loading...</p>
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

const formatDate = (dateString) => {
  if (!dateString) return 'No date'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
