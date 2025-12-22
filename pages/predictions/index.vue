<template>
  <main class="container-main pt-8">
    <!-- Error State -->
    <div
      v-if="predictionsError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <template v-else>
      <!-- HERO: Brier Score -->
      <header class="section-spacing-lg">
        <h1 class="heading-1 mb-6">Predictions</h1>

        <!-- Brier Score Hero -->
        <div
          v-if="calibration && calibration.summary.resolved > 0"
          class="mb-8"
        >
          <div class="flex items-baseline gap-4 mb-2">
            <span
              class="font-mono tabular-nums font-bold"
              :class="[
                brierScoreClass(calibration.brier_score),
                'text-6xl md:text-8xl',
              ]"
            >
              {{ formatBrierScore(calibration.brier_score) }}
            </span>
            <span class="text-zinc-500 dark:text-zinc-500 text-sm uppercase tracking-wide">
              Brier Score
            </span>
          </div>
          <div class="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <div>
              {{ brierScoreLabel(calibration.brier_score) }} ·
              Based on {{ calibration.summary.resolved }} resolved predictions
            </div>
            <div class="text-xs text-zinc-500">
              0 = perfect · 0.25 = chance · 1 = always wrong
            </div>
          </div>
        </div>

        <!-- Verification Summary -->
        <div class="font-mono text-xs border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div class="tabular-nums">
            <span class="text-zinc-900 dark:text-zinc-100">{{ correctCount }}/{{ correctCount + incorrectCount }}</span>
            <span class="text-zinc-500 ml-1">correct</span>
            <span class="text-zinc-400 mx-2">·</span>
            <span class="text-zinc-600 dark:text-zinc-400">{{ pendingCount }}</span>
            <span class="text-zinc-500 ml-1">pending</span>
            <span v-if="kalshiPositionCount > 0" class="text-zinc-400 mx-2">·</span>
            <span v-if="kalshiPositionCount > 0" class="text-zinc-600 dark:text-zinc-400">${{ formatExposure(totalKalshiExposure) }}</span>
            <span v-if="kalshiPositionCount > 0" class="text-zinc-500 ml-1">at stake</span>
          </div>
        </div>
      </header>

      <!-- Zero State -->
      <section v-if="transformedPredictions.length === 0" class="card-padding">
        <div class="text-primary mb-2 uppercase">No predictions yet</div>
        <p class="text-secondary">
          Cryptographically verified predictions with SHA-256 hashing, PGP
          signatures, and git-based version control.
        </p>
      </section>

      <!-- Dense Table View: Active Predictions -->
      <section v-if="activePredictions.length > 0" class="section-spacing">
        <h2 class="heading-2 mb-4">Active</h2>
        <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table class="w-full font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-zinc-300 dark:border-zinc-700">
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">Conf</th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">Statement</th>
                <th class="text-right pb-2 font-normal text-zinc-500">Deadline</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prediction in activePredictions"
                :key="prediction.id"
                class="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td class="py-3 pr-4 align-top tabular-nums">
                  <span class="text-lg font-bold">{{ prediction.confidence }}%</span>
                </td>
                <td class="py-3 pr-4 align-top">
                  <NuxtLink
                    :to="`/predictions/${prediction.slug}`"
                    class="text-zinc-900 dark:text-zinc-100 hover:underline font-serif text-sm leading-snug"
                  >
                    {{ prediction.statement }}
                  </NuxtLink>
                </td>
                <td class="py-3 pr-4 align-top text-right tabular-nums text-zinc-500 whitespace-nowrap">
                  <template v-if="daysUntil(prediction.deadline) !== null">
                    {{ daysUntil(prediction.deadline) }}d
                  </template>
                  <template v-else>
                    {{ formatDeadline(prediction.deadline) }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Dense Table View: Resolved Predictions -->
      <section v-if="resolvedPredictions.length > 0" class="section-spacing">
        <h2 class="heading-2 mb-4">Resolved</h2>
        <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table class="w-full font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-zinc-300 dark:border-zinc-700">
                <th class="text-center pb-2 pr-4 font-normal text-zinc-500"></th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">Conf</th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">Statement</th>
                <th class="text-left pb-2 font-normal text-zinc-500">Resolved</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prediction in resolvedPredictions"
                :key="prediction.id"
                class="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td class="py-3 pr-4 align-top text-center">
                  <span v-if="prediction.status === 'correct'" class="text-success">✓</span>
                  <span v-else-if="prediction.status === 'incorrect'" class="text-error">✗</span>
                  <span v-else class="text-zinc-400">—</span>
                </td>
                <td class="py-3 pr-4 align-top tabular-nums">
                  <span
                    class="text-lg font-bold"
                    :class="prediction.status === 'correct' ? 'text-success' : prediction.status === 'incorrect' ? 'text-error' : ''"
                  >{{ prediction.confidence }}%</span>
                  <span
                    v-if="brierContribution(prediction) !== null"
                    class="text-zinc-400 text-[10px] ml-2"
                    :title="`Brier: (${prediction.confidence/100} - ${prediction.status === 'correct' ? 1 : 0})² = ${brierContribution(prediction)?.toFixed(3)}`"
                  >{{ brierContribution(prediction)?.toFixed(2) }}</span>
                </td>
                <td class="py-3 pr-4 align-top">
                  <NuxtLink
                    :to="`/predictions/${prediction.slug}`"
                    class="text-zinc-900 dark:text-zinc-100 hover:underline font-serif text-sm leading-snug"
                  >
                    {{ prediction.statement }}
                  </NuxtLink>
                </td>
                <td class="py-3 align-top whitespace-nowrap text-zinc-500 tabular-nums">
                  {{ formatResolvedDate(prediction.resolved_date) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Calibration -->
      <section
        v-if="calibration?.calibration?.length"
        class="section-spacing font-mono text-xs"
      >
        <h2 class="heading-2 mb-4">Calibration</h2>

        <!-- Calibration Curve -->
        <div class="mb-6">
          <svg viewBox="0 0 100 100" class="w-full max-w-xs h-auto aspect-square">
            <!-- Grid -->
            <line x1="0" y1="100" x2="100" y2="100" class="stroke-zinc-300 dark:stroke-zinc-700" stroke-width="0.5" />
            <line x1="0" y1="0" x2="0" y2="100" class="stroke-zinc-300 dark:stroke-zinc-700" stroke-width="0.5" />
            <!-- Perfect calibration line -->
            <line x1="0" y1="100" x2="100" y2="0" class="stroke-zinc-400 dark:stroke-zinc-600" stroke-width="0.5" stroke-dasharray="2,2" />
            <!-- Calibration points -->
            <circle
              v-for="bucket in calibration.calibration"
              :key="bucket.label"
              :cx="bucket.expected"
              :cy="100 - bucket.accuracy"
              :r="Math.max(2, Math.min(5, bucket.count))"
              :class="Math.abs(bucket.delta) <= 10 ? 'fill-success' : 'fill-error'"
              class="opacity-80"
            />
            <!-- Connect points with line -->
            <polyline
              :points="calibrationPoints"
              fill="none"
              class="stroke-zinc-900 dark:stroke-zinc-100"
              stroke-width="1"
            />
          </svg>
          <div class="text-[10px] text-zinc-500 mt-1">
            x: predicted · y: actual · dashed: perfect
          </div>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-zinc-300 dark:border-zinc-700 text-zinc-500">
              <th class="text-left pb-2 pr-4 font-normal">Range</th>
              <th class="text-right pb-2 pr-4 font-normal">Actual</th>
              <th class="text-right pb-2 pr-4 font-normal">Δ</th>
              <th class="text-right pb-2 font-normal">n</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="bucket in calibration.calibration"
              :key="bucket.label"
              class="border-b border-zinc-200 dark:border-zinc-800"
            >
              <td class="py-2 pr-4">{{ bucket.label }}</td>
              <td class="py-2 pr-4 text-right tabular-nums font-bold" :class="deltaClass(bucket.delta)">
                {{ bucket.accuracy }}%
              </td>
              <td class="py-2 pr-4 text-right tabular-nums" :class="bucket.delta >= 0 ? 'text-success' : 'text-error'">
                {{ bucket.delta >= 0 ? '+' : '' }}{{ bucket.delta }}
              </td>
              <td class="py-2 text-right tabular-nums text-zinc-500">{{ bucket.count }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Footer -->
      <footer class="mt-12 text-xs font-mono text-zinc-500">
        <a :href="commitHistoryUrl" target="_blank" class="hover:underline">
          Verification: git history →
        </a>
      </footer>
    </template>
  </main>
</template>

<script setup lang="ts">
import { formatBrierScore } from '~/composables/useNumberFormat'
import { format } from 'date-fns'
import type { KalshiApiResponse } from '~/server/types/kalshi'

// Type definitions for predictions API
interface Prediction {
  id: string
  slug: string
  statement: string
  confidence: number
  deadline?: string
  categories?: string[]
  visibility: string
  created?: string
  resolved: boolean
  resolved_date?: string
  status?: 'correct' | 'incorrect' | 'pending' | 'resolved'
  evidence?: string
  resolution?: string
  related?: string[]
  updates?: Array<{ timestamp: string; content?: string }>
  updatedAt?: string
  market?: {
    provider: 'polymarket' | 'kalshi'
    slug: string
    autoResolve?: boolean
  }
  hash?: string
  gitCommit?: string
}

const commitHistoryUrl =
  'https://github.com/ejfox/website2/commits/main/content/predictions/'

// Fetch predictions data
const { data: predictions, error: predictionsError } =
  await useFetch<Prediction[]>('/api/predictions')
const { data: calibration } = useCalibration()

// Fetch Kalshi data for financial verification
const { data: kalshiData } = await useFetch<KalshiApiResponse>('/api/kalshi', {
  default: () => null,
})

// Transform and filter predictions
const transformedPredictions = computed(() => {
  if (!predictions.value) return []
  return predictions.value
    .filter((p) => p.visibility === 'public')
    .map((p) => ({
      ...p,
      status: p.status || (p.resolved ? 'resolved' : 'pending'),
    }))
})

// Separate active and resolved
const activePredictions = computed(() =>
  transformedPredictions.value
    .filter((p) => !p.resolved)
    .sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())
)

const resolvedPredictions = computed(() =>
  transformedPredictions.value
    .filter((p) => p.resolved)
    .sort((a, b) =>
      new Date(b.resolved_date || b.created || 0).getTime() -
      new Date(a.resolved_date || a.created || 0).getTime()
    )
)

// Counts
const pendingCount = computed(
  () => transformedPredictions.value.filter((p) => !p.resolved).length
)
const correctCount = computed(
  () => transformedPredictions.value.filter((p) => p.status === 'correct').length
)
const incorrectCount = computed(
  () => transformedPredictions.value.filter((p) => p.status === 'incorrect').length
)

// Kalshi data
const kalshiPositionCount = computed(
  () => kalshiData.value?.positions?.length || 0
)
const totalKalshiExposure = computed(() => {
  if (!kalshiData.value?.positions) return 0
  return kalshiData.value.positions.reduce(
    (sum, p) => sum + (p.market_exposure_dollars || 0),
    0
  )
})

// Formatting helpers
const formatDeadline = (deadline: string | undefined) => {
  if (!deadline) return '—'
  try {
    return format(new Date(deadline), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

const formatResolvedDate = (date: string | undefined) => {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMM yyyy')
  } catch {
    return '—'
  }
}

const formatExposure = (value: number) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toFixed(0)
}

// Calibration curve points for SVG polyline
const calibrationPoints = computed(() => {
  if (!calibration.value?.calibration?.length) return ''
  return calibration.value.calibration
    .map((b: { expected: number; accuracy: number }) => `${b.expected},${100 - b.accuracy}`)
    .join(' ')
})

// Utilitarian helpers
const daysUntil = (deadline: string | undefined): number | null => {
  if (!deadline) return null
  try {
    const target = new Date(deadline)
    const now = new Date()
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  } catch {
    return null
  }
}

const brierContribution = (prediction: { resolved: boolean; status?: string; confidence: number }): number | null => {
  if (!prediction.resolved || !prediction.status) return null
  const outcome = prediction.status === 'correct' ? 1 : 0
  const forecast = prediction.confidence / 100
  return (forecast - outcome) ** 2
}

// Brier score helpers
const brierScoreClass = (score: number | null) => {
  if (score === null) return 'text-zinc-500'
  if (score < 0.15) return 'text-success'
  if (score < 0.2) return 'text-green-600 dark:text-green-500'
  if (score < 0.25) return 'text-zinc-900 dark:text-zinc-100'
  return 'text-error'
}

const brierScoreLabel = (score: number | null) => {
  if (score === null) return ''
  if (score < 0.15) return 'Excellent calibration'
  if (score < 0.2) return 'Good calibration'
  if (score < 0.25) return 'Better than chance'
  return 'Needs improvement'
}

const deltaClass = (delta: number) => {
  const abs = Math.abs(delta)
  if (abs <= 5) return 'text-success'
  if (abs <= 10) return 'text-zinc-900 dark:text-zinc-100'
  return 'text-error'
}

// SEO
const totalPredictions = computed(
  () => predictions.value?.filter((p) => p.visibility === 'public').length || 0
)

usePageSeo({
  title: 'Predictions · EJ Fox',
  description:
    'Public, timestamped predictions with SHA-256 hashes and calibration tracking.',
  type: 'article',
  section: 'Forecasting',
  tags: ['Predictions', 'Forecasting', 'Calibration', 'Probability'],
  label1: 'Public predictions',
  data1: computed(() => `${totalPredictions.value} total`),
  label2: 'Brier Score',
  data2: computed(() =>
    calibration.value?.brier_score
      ? formatBrierScore(calibration.value.brier_score)
      : '—'
  ),
})
</script>
