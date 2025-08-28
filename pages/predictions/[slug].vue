<template>
  <main v-if="prediction" class="py-32 px-8 mx-auto max-w-4xl">
    <!-- Header with back navigation -->
    <header class="mb-32">
      <div class="flex items-center justify-between mb-24">
        <NuxtLink
          to="/predictions"
          class="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors uppercase tracking-[0.2em]"
        >
          ← All Predictions
        </NuxtLink>

        <div
          class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] font-mono"
        >
          Report
        </div>
      </div>
    </header>

    <!-- Main prediction statement -->
    <section class="mb-48">
      <div
        :class="[
          'border-l-2 pl-12',
          prediction.status === 'correct'
            ? 'border-green-500 dark:border-green-600'
            : prediction.status === 'incorrect'
              ? 'border-red-500 dark:border-red-600'
              : 'border-zinc-200 dark:border-zinc-800'
        ]"
      >
        <h1
          class="text-4xl md:text-5xl lg:text-6xl font-light text-zinc-900 dark:text-zinc-100 leading-[1.1] mb-24 tracking-tight"
        >
          {{ prediction.statement }}
        </h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-16 mt-24">
        <div class="text-center">
          <p
            class="text-6xl font-light text-zinc-900 dark:text-zinc-100 mb-4 font-mono"
          >
            {{ prediction.confidence }}%
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]"
          >
            Confidence
          </p>
        </div>
        <div v-if="prediction.deadline" class="text-center">
          <p class="text-xl font-light text-zinc-700 dark:text-zinc-300 mb-4">
            {{ formatDate(prediction.deadline) }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]"
          >
            Deadline
          </p>
        </div>
        <div
          v-if="
            prediction.status &&
            (prediction.status === 'correct' ||
              prediction.status === 'incorrect')
          "
          class="text-center"
        >
          <p
            :class="[
              'text-xl font-light mb-4 uppercase tracking-[0.1em]',
              prediction.status === 'correct'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            ]"
          >
            {{ prediction.status }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]"
          >
            Status
          </p>
        </div>
      </div>
    </section>

    <!-- Evidence Section -->
    <section v-if="prediction.evidence" class="mb-48">
      <div class="mb-16">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
        >
          01
        </h2>
        <h3
          class="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
        >
          Evidence & Reasoning
        </h3>
      </div>

      <div
        class="prose prose-xl dark:prose-invert prose-zinc max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-[1.8] prose-p:mb-8 prose-headings:font-light prose-headings:tracking-tight prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200 prose-h1:text-2xl prose-h1:mb-8 prose-h1:mt-16 prose-h2:text-xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:border-b prose-h2:border-zinc-200 dark:prose-h2:border-zinc-800 prose-h2:pb-3 prose-h3:text-lg prose-h3:mb-4 prose-h3:mt-8 prose-ul:my-8 prose-li:my-3 prose-li:leading-[1.8] prose-li:marker:text-zinc-300 dark:prose-li:marker:text-zinc-700 prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-strong:font-medium prose-em:text-zinc-700 dark:prose-em:text-zinc-300 prose-em:italic prose-a:text-zinc-800 dark:prose-a:text-zinc-200 prose-a:underline prose-a:decoration-zinc-300 dark:prose-a:decoration-zinc-700 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-500 prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-code:font-mono prose-code:before:content-none prose-code:after:content-none"
        v-html="evidenceHtml"
      ></div>
    </section>

    <!-- Resolution Section (if resolved) -->
    <section v-if="prediction.resolution" class="mb-48">
      <div class="mb-16">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
        >
          02
        </h2>
        <h3
          class="text-sm font-medium uppercase tracking-[0.2em]"
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
            class="font-mono normal-case tracking-normal ml-4 text-zinc-400 dark:text-zinc-600 text-xs"
          >
            {{ formatDate(prediction.resolved_date) }}
          </span>
        </h3>
      </div>

      <div
        class="prose prose-xl dark:prose-invert prose-zinc max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-[1.8] prose-p:mb-8 prose-headings:font-light prose-headings:tracking-tight prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200 prose-h1:text-2xl prose-h1:mb-8 prose-h1:mt-16 prose-h2:text-xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:border-b prose-h2:border-zinc-200 dark:prose-h2:border-zinc-800 prose-h2:pb-3 prose-h3:text-lg prose-h3:mb-4 prose-h3:mt-8 prose-ul:my-8 prose-li:my-3 prose-li:leading-[1.8] prose-li:marker:text-zinc-300 dark:prose-li:marker:text-zinc-700 prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-strong:font-medium prose-em:text-zinc-700 dark:prose-em:text-zinc-300 prose-em:italic prose-a:text-zinc-800 dark:prose-a:text-zinc-200 prose-a:underline prose-a:decoration-zinc-300 dark:prose-a:decoration-zinc-700 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-500 prose-code:text-zinc-700 dark:prose-code:text-zinc-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-code:font-mono prose-code:before:content-none prose-code:after:content-none"
        v-html="resolutionHtml"
      ></div>
    </section>

    <!-- Related Predictions -->
    <section
      v-if="prediction.related && prediction.related.length > 0"
      class="mb-48"
    >
      <div class="mb-16">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
        >
          03
        </h2>
        <h3
          class="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
        >
          Related Predictions
        </h3>
      </div>

      <div class="space-y-6">
        <div
          v-for="relatedId in prediction.related"
          :key="relatedId"
          class="py-6 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0"
        >
          <NuxtLink
            :to="`/predictions/${relatedId}`"
            class="group flex items-center justify-between hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <span
              class="text-base text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
              >{{ relatedId }}</span
            >
            <span
              class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]"
              >→</span
            >
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Metadata Footer -->
    <footer class="border-t border-zinc-100 dark:border-zinc-900 pt-24">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div>
          <h3
            class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-4"
          >
            Created
          </h3>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            {{ formatDate(prediction.created) }}
          </p>
        </div>
        <div v-if="prediction.categories && prediction.categories.length > 0">
          <h3
            class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-4"
          >
            Categories
          </h3>
          <div class="flex flex-wrap gap-3">
            <span
              v-for="category in prediction.categories"
              :key="category"
              class="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
            >
              {{ category }}
            </span>
          </div>
        </div>
        <div>
          <h3
            class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-4"
          >
            Visibility
          </h3>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
            {{ prediction.visibility || 'public' }}
          </p>
        </div>
      </div>
    </footer>
  </main>

  <!-- Error state -->
  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center min-h-[50vh] px-4"
  >
    <h2 class="text-2xl font-medium text-zinc-800 dark:text-zinc-200 mb-4">
      Prediction not found
    </h2>
    <p class="text-zinc-600 dark:text-zinc-400 mb-6 text-center">
      The prediction you're looking for doesn't exist or has been removed.
    </p>
    <NuxtLink
      to="/predictions"
      class="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
    >
      View All Predictions
    </NuxtLink>
  </div>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center min-h-[50vh]">
    <p class="text-zinc-600 dark:text-zinc-400">Loading prediction...</p>
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
