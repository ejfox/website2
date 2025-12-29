<template>
  <main v-if="prediction" class="container-main pt-8">
    <!-- Back link -->
    <NuxtLink
      to="/predictions"
      class="font-mono text-xs text-zinc-500 hover:underline"
    >
      ← predictions
    </NuxtLink>

    <!-- Statement + Confidence -->
    <header class="mt-8 mb-6">
      <div class="flex items-baseline gap-4 mb-3">
        <span class="font-mono text-4xl md:text-5xl font-bold tabular-nums">
          {{ prediction.confidence }}%
        </span>
        <h1 class="font-serif text-xl md:text-2xl leading-tight">
          {{ prediction.statement }}
        </h1>
      </div>

      <!-- Status line -->
      <div class="font-mono text-xs text-zinc-500 flex flex-wrap gap-x-2">
        <span
          v-if="
            prediction.status === 'correct' || prediction.status === 'incorrect'
          "
          :class="
            prediction.status === 'correct' ? 'text-success' : 'text-error'
          "
          class="font-bold"
        >
          {{ prediction.status === 'correct' ? '✓' : '✗' }}
          {{ prediction.status }}
        </span>
        <span v-if="prediction.updates?.length">
          · {{ prediction.updates.length }} update{{
            prediction.updates.length === 1 ? '' : 's'
          }}
        </span>
        <span v-if="deadline">· {{ deadline }}</span>
        <span v-if="prediction.market" class="text-zinc-400">
          · {{ prediction.market.provider }}
          <template v-if="marketDiff !== null">
            <span
              :class="
                marketDiff > 0
                  ? 'text-success'
                  : marketDiff < 0
                    ? 'text-error'
                    : ''
              "
            >
              ({{ marketDiff > 0 ? '+' : '' }}{{ marketDiff }}% vs market)
            </span>
          </template>
        </span>
      </div>
    </header>

    <!-- Resolution -->
    <section v-if="prediction.resolutionHtml" class="mb-8">
      <h2
        class="font-mono text-xs uppercase tracking-wide mb-2"
        :class="
          prediction.status === 'correct'
            ? 'text-success'
            : prediction.status === 'incorrect'
              ? 'text-error'
              : 'text-zinc-500'
        "
      >
        Resolution
      </h2>
      <div
        class="prose prose-sm dark:prose-invert max-w-none"
        v-html="prediction.resolutionHtml"
      />
    </section>

    <!-- Evidence -->
    <section v-if="prediction.evidenceHtml" class="mb-8">
      <h2 class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Evidence
      </h2>
      <div
        class="prose prose-sm dark:prose-invert max-w-none"
        v-html="prediction.evidenceHtml"
      />
    </section>

    <!-- Updates -->
    <section v-if="prediction.updates?.length" class="mb-8">
      <h2 class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-4">
        Updates
      </h2>
      <div class="space-y-4">
        <div
          v-for="(update, i) in sortedUpdates"
          :key="i"
          class="font-mono text-xs border-l-2 border-zinc-200 dark:border-zinc-800 pl-3"
        >
          <div class="text-zinc-500 mb-1">
            {{ formatDate(update.timestamp) }}
            <span
              v-if="
                update.confidenceBefore !== undefined &&
                update.confidenceAfter !== undefined
              "
              class="tabular-nums"
            >
              · {{ update.confidenceBefore }}% → {{ update.confidenceAfter }}%
            </span>
          </div>
          <div class="text-zinc-700 dark:text-zinc-300 text-sm">
            {{ update.reasoning }}
          </div>
        </div>
      </div>
    </section>

    <!-- Related (now with statements!) -->
    <section v-if="prediction.relatedPredictions?.length" class="mb-8">
      <h2 class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Related
      </h2>
      <ul class="space-y-2">
        <li
          v-for="related in prediction.relatedPredictions"
          :key="related.id"
          class="text-sm"
        >
          <NuxtLink
            :to="`/predictions/${related.slug}`"
            class="hover:underline"
          >
            <span class="font-mono text-zinc-500 tabular-nums">
              {{ related.confidence }}%
            </span>
            <span
              v-if="
                related.status === 'correct' || related.status === 'incorrect'
              "
              :class="
                related.status === 'correct' ? 'text-success' : 'text-error'
              "
              class="mx-1"
            >
              {{ related.status === 'correct' ? '✓' : '✗' }}
            </span>
            <span class="text-zinc-700 dark:text-zinc-300">
              {{ related.statement }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>

  <!-- Error/Loading -->
  <div v-else class="container-main pt-8 font-mono text-xs text-zinc-500">
    {{ error ? 'Prediction not found' : 'Loading...' }}
    <NuxtLink v-if="error" to="/predictions" class="block mt-2 hover:underline">
      ← back
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

interface PredictionResponse {
  id: string
  slug: string
  statement: string
  confidence: number
  deadline?: string
  status?: string
  resolved: boolean
  resolved_date?: string
  evidence?: string
  evidenceHtml?: string
  resolution?: string
  resolutionHtml?: string
  updates?: Array<{
    timestamp: string
    confidenceBefore?: number
    confidenceAfter?: number
    reasoning?: string
  }>
  related?: string[]
  relatedPredictions?: Array<{
    id: string
    slug: string
    statement: string
    confidence: number
    status?: string
  }>
  market?: { provider: string; slug: string }
}

interface MarketDataResponse {
  currentProb?: number
  [key: string]: unknown
}

const route = useRoute()
const params = route.params as { slug?: string | string[] }
const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug || ''

// Fetch single prediction with SSR markdown
const { data: prediction, error } = await useFetch<PredictionResponse>(
  `/api/predictions/${slug}`
)

// Fetch market data for diff calculation (only if prediction has market)
const marketUrl = computed(() => {
  const m = prediction.value?.market
  if (!m?.provider || !m?.slug) return null
  return `/api/markets/${m.provider}?slug=${m.slug}`
})
const { data: marketData } = await useFetch<MarketDataResponse>(marketUrl, {
  watch: [marketUrl],
  immediate: !!prediction.value?.market,
})

// Market diff: your confidence vs current market price
const marketDiff = computed(() => {
  if (!prediction.value?.market || !marketData.value?.currentProb) return null
  return Math.round(prediction.value.confidence - marketData.value.currentProb)
})

// Sorted updates (newest first)
const sortedUpdates = computed(() => {
  if (!prediction.value?.updates) return []
  return [...prediction.value.updates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

// Deadline display
const deadline = computed(() => {
  if (!prediction.value?.deadline) return null
  const d = new Date(prediction.value.deadline)
  const now = new Date()
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days > 0 && days < 365) return `${days}d`
  return format(d, 'MMM yyyy')
})

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}

// SEO
usePageSeo({
  title: computed(() => prediction.value?.statement || 'Prediction'),
  description: computed(() => {
    const p = prediction.value
    if (!p) return 'Cryptographically verified prediction.'
    return `${p.confidence}% · ${p.statement}`
  }),
  type: 'article',
  section: 'Forecasting',
  tags: ['Predictions'],
  label1: 'Confidence',
  data1: computed(() =>
    prediction.value?.confidence ? `${prediction.value.confidence}%` : '—'
  ),
  label2: 'Status',
  data2: computed(() => prediction.value?.status || 'Active'),
})
</script>
