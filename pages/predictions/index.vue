<template>
  <main class="container-main pt-8">
    <div
      v-if="predictionsError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <template v-else>
      <!-- Header: Plain English Track Record -->
      <header class="section-spacing-lg">
        <h1 class="heading-1 mb-4">Predictions</h1>

        <div
          class="font-mono text-sm text-zinc-600 dark:text-zinc-400 space-y-1"
        >
          <div>
            {{ transformedPredictions.length }} predictions ·
            {{ resolvedPredictions.length }} resolved ·
            <span v-if="correctCount > 0" class="text-success">
              {{ correctCount }} correct
            </span>
            <span v-if="incorrectCount > 0">
              ,
              <span class="text-error">{{ incorrectCount }} wrong</span>
            </span>
          </div>
          <div
            v-if="calibration?.brier_score != null"
            class="text-xs text-zinc-500"
          >
            Brier score: {{ calibration.brier_score.toFixed(3) }}
            <span class="text-zinc-400">
              ({{ brierScoreLabel(calibration.brier_score) }}, 0 = perfect, 0.25
              = coin flip)
            </span>
          </div>
        </div>
      </header>

      <!-- Zero State -->
      <section v-if="transformedPredictions.length === 0" class="card-padding">
        <p class="text-secondary">No predictions yet.</p>
      </section>

      <!-- Active Predictions -->
      <section v-if="activePredictions.length > 0" data-section="active" class="section-spacing">
        <h2 class="heading-2 mb-4">Active</h2>
        <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table class="w-full font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-zinc-300 dark:border-zinc-700">
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">
                  Conf
                </th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">
                  Statement
                </th>
                <th class="text-right pb-2 font-normal text-zinc-500">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prediction in activePredictions"
                :key="prediction.id"
                class="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td class="py-3 pr-4 align-top tabular-nums">
                  <NuxtLink
                    :to="`/predictions/${prediction.slug}`"
                    class="text-lg font-bold hover:underline"
                  >
                    {{ prediction.confidence }}%
                  </NuxtLink>
                </td>
                <td class="py-3 pr-4 align-top font-serif text-sm leading-snug text-zinc-900 dark:text-zinc-100">
                  {{ prediction.statement }}
                </td>
                <td
                  class="py-3 pr-4 align-top text-right tabular-nums text-zinc-500 whitespace-nowrap"
                >
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

      <!-- Resolved Predictions -->
      <section v-if="resolvedPredictions.length > 0" data-section="resolved" class="section-spacing">
        <h2 class="heading-2 mb-4">Resolved</h2>
        <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table class="w-full font-mono text-xs border-collapse">
            <thead>
              <tr class="border-b border-zinc-300 dark:border-zinc-700">
                <th
                  class="text-center pb-2 pr-4 font-normal text-zinc-500"
                ></th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">
                  Conf
                </th>
                <th class="text-left pb-2 pr-4 font-normal text-zinc-500">
                  Statement
                </th>
                <th class="text-left pb-2 font-normal text-zinc-500">
                  Resolved
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prediction in resolvedPredictions"
                :key="prediction.id"
                class="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td class="py-3 pr-4 align-top text-center">
                  <span
                    v-if="prediction.status === 'correct'"
                    class="text-success"
                  >
                    ✓
                  </span>
                  <span
                    v-else-if="prediction.status === 'incorrect'"
                    class="text-error"
                  >
                    ✗
                  </span>
                  <span v-else class="text-zinc-400">—</span>
                </td>
                <td class="py-3 pr-4 align-top tabular-nums">
                  <NuxtLink
                    :to="`/predictions/${prediction.slug}`"
                    class="text-lg font-bold hover:underline"
                    :class="
                      prediction.status === 'correct'
                        ? 'text-success'
                        : prediction.status === 'incorrect'
                          ? 'text-error'
                          : ''
                    "
                  >
                    {{ prediction.confidence }}%
                  </NuxtLink>
                </td>
                <td class="py-3 pr-4 align-top font-serif text-sm leading-snug text-zinc-900 dark:text-zinc-100">
                  {{ prediction.statement }}
                </td>
                <td
                  class="py-3 align-top whitespace-nowrap text-zinc-500 tabular-nums"
                >
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
        data-section="calibration"
        class="section-spacing font-mono text-xs"
      >
        <h2 class="heading-2 mb-2">Calibration</h2>
        <p class="text-zinc-500 mb-4 text-xs">
          When I say X%, does it happen X% of the time? Dots on the diagonal =
          well calibrated.
        </p>

        <!-- Calibration Curve -->
        <div class="mb-6">
          <svg
            viewBox="0 0 100 100"
            class="w-full max-w-xs h-auto aspect-square"
          >
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="100"
              class="stroke-zinc-300 dark:stroke-zinc-700"
              stroke-width="0.5"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              class="stroke-zinc-300 dark:stroke-zinc-700"
              stroke-width="0.5"
            />
            <!-- Perfect calibration line -->
            <line
              x1="0"
              y1="100"
              x2="100"
              y2="0"
              class="stroke-zinc-400 dark:stroke-zinc-600"
              stroke-width="0.5"
              stroke-dasharray="2,2"
            />
            <!-- Calibration points -->
            <circle
              v-for="bucket in calibration.calibration"
              :key="bucket.label"
              :cx="bucket.expected"
              :cy="100 - bucket.accuracy"
              :r="Math.max(2, Math.min(5, bucket.count))"
              :class="
                Math.abs(bucket.delta) <= 10 ? 'fill-success' : 'fill-error'
              "
              class="opacity-80"
            />
            <polyline
              :points="calibrationPoints"
              fill="none"
              class="stroke-zinc-900 dark:stroke-zinc-100"
              stroke-width="1"
            />
          </svg>
          <div class="text-3xs text-zinc-500 mt-1">
            x: predicted · y: actual · dashed: perfect
          </div>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr
              class="border-b border-zinc-300 dark:border-zinc-700 text-zinc-500"
            >
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
              <td
                class="py-2 pr-4 text-right tabular-nums font-bold"
                :class="deltaClass(bucket.delta)"
              >
                {{ bucket.accuracy }}%
              </td>
              <td
                class="py-2 pr-4 text-right tabular-nums"
                :class="bucket.delta >= 0 ? 'text-success' : 'text-error'"
              >
                {{ bucket.delta >= 0 ? '+' : '' }}{{ bucket.delta }}
              </td>
              <td class="py-2 text-right tabular-nums text-zinc-500">
                {{ bucket.count }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Plain English calibration summary -->
        <div class="mt-4 text-xs text-zinc-500 space-y-1">
          <div
            v-for="bucket in calibration.calibration"
            :key="bucket.label + '-text'"
          >
            When I say {{ bucket.label }}, it happens {{ bucket.accuracy }}% of
            the time
            <span v-if="Math.abs(bucket.delta) <= 5" class="text-success">
              (well calibrated)
            </span>
            <span v-else-if="bucket.delta > 5" class="text-zinc-400">
              (overconfident by {{ bucket.delta }}pp)
            </span>
            <span v-else class="text-zinc-400">
              (underconfident by {{ Math.abs(bucket.delta) }}pp)
            </span>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-12 text-xs font-mono text-zinc-500">
        <a :href="commitHistoryUrl" target="_blank" class="hover:underline">
          Verification: git history →
        </a>
      </footer>
    </template>

    <!-- Sidebar teleport -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="pt-8 pb-4 space-y-4">
          <div class="font-mono text-3xs uppercase tracking-wider text-zinc-500">
            Track Record
          </div>

          <!-- Brier score -->
          <div v-if="calibration?.brier_score != null" class="space-y-0.5">
            <div class="font-mono text-lg font-bold tabular-nums text-zinc-100">
              {{ calibration.brier_score.toFixed(3) }}
            </div>
            <div class="font-mono text-3xs text-zinc-500">
              Brier score · {{ brierScoreLabel(calibration.brier_score) }}
            </div>
          </div>

          <!-- Resolution stats -->
          <div class="space-y-1 font-mono text-3xs tabular-nums">
            <div class="flex justify-between">
              <span class="text-zinc-500">Total</span>
              <span class="text-zinc-300">{{ transformedPredictions.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Resolved</span>
              <span class="text-zinc-300">{{ resolvedPredictions.length }}</span>
            </div>
            <div v-if="correctCount > 0" class="flex justify-between">
              <span class="text-zinc-500">Correct</span>
              <span class="text-success">{{ correctCount }}</span>
            </div>
            <div v-if="incorrectCount > 0" class="flex justify-between">
              <span class="text-zinc-500">Wrong</span>
              <span class="text-error">{{ incorrectCount }}</span>
            </div>
            <div v-if="resolvedPredictions.length > 0" class="flex justify-between">
              <span class="text-zinc-500">Accuracy</span>
              <span class="text-zinc-300">
                {{ Math.round((correctCount / resolvedPredictions.length) * 100) }}%
              </span>
            </div>
          </div>

          <!-- Calibration by bucket -->
          <div v-if="calibration?.calibration?.length">
            <div class="font-mono text-3xs uppercase tracking-wider text-zinc-500 mb-1.5">
              By Confidence
            </div>
            <div class="space-y-0.5 font-mono text-3xs tabular-nums">
              <div
                v-for="bucket in calibration.calibration"
                :key="bucket.label"
                class="flex justify-between"
              >
                <span class="text-zinc-500">{{ bucket.label }}</span>
                <span :class="Math.abs(bucket.delta) <= 10 ? 'text-zinc-300' : 'text-error'">
                  {{ bucket.accuracy }}%
                  <span class="text-zinc-600">n={{ bucket.count }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Section nav -->
          <div class="space-y-1 pt-2 border-t border-zinc-800">
            <a
              v-if="activePredictions.length > 0"
              href="#"
              class="block font-mono text-3xs text-zinc-500 hover:text-zinc-300 transition-colors"
              @click.prevent="scrollToEl('active')"
            >
              Active · {{ activePredictions.length }}
            </a>
            <a
              v-if="resolvedPredictions.length > 0"
              href="#"
              class="block font-mono text-3xs text-zinc-500 hover:text-zinc-300 transition-colors"
              @click.prevent="scrollToEl('resolved')"
            >
              Resolved · {{ resolvedPredictions.length }}
            </a>
            <a
              v-if="calibration?.calibration?.length"
              href="#"
              class="block font-mono text-3xs text-zinc-500 hover:text-zinc-300 transition-colors"
              @click.prevent="scrollToEl('calibration')"
            >
              Calibration
            </a>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </main>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const { tocTarget } = useTOC()

const scrollToEl = (id: string) => {
  const section = document.querySelector(`[data-section="${id}"]`)
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
  updates?: Array<{ timestamp: string; content?: string }>
  hash?: string
  gitCommit?: string
}

const commitHistoryUrl =
  'https://github.com/ejfox/website2/commits/main/content/predictions/'

const { data: predictions, error: predictionsError } =
  await useFetch<Prediction[]>('/api/predictions')
const { data: calibration } = useCalibration()

const transformedPredictions = computed(() => {
  if (!predictions.value) return []
  return predictions.value
    .filter((p) => p.visibility === 'public')
    .map((p) => ({
      ...p,
      status: p.status || (p.resolved ? 'resolved' : 'pending'),
    }))
})

const activePredictions = computed(() =>
  transformedPredictions.value
    .filter((p) => !p.resolved)
    .sort(
      (a, b) =>
        new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()
    )
)

const resolvedPredictions = computed(() =>
  transformedPredictions.value
    .filter((p) => p.resolved)
    .sort(
      (a, b) =>
        new Date(b.resolved_date || b.created || 0).getTime() -
        new Date(a.resolved_date || a.created || 0).getTime()
    )
)

const correctCount = computed(
  () =>
    transformedPredictions.value.filter((p) => p.status === 'correct').length
)
const incorrectCount = computed(
  () =>
    transformedPredictions.value.filter((p) => p.status === 'incorrect').length
)

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

const calibrationPoints = computed(() => {
  if (!calibration.value?.calibration?.length) return ''
  return calibration.value.calibration
    .map(
      (b: { expected: number; accuracy: number }) =>
        `${b.expected},${100 - b.accuracy}`
    )
    .join(' ')
})

const daysUntil = (deadline: string | undefined): number | null => {
  if (!deadline) return null
  try {
    const target = new Date(deadline)
    const now = new Date()
    const diff = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff > 0 ? diff : null
  } catch {
    return null
  }
}

const brierScoreLabel = (score: number | null) => {
  if (score === null) return ''
  if (score < 0.15) return 'excellent'
  if (score < 0.2) return 'good'
  if (score < 0.25) return 'better than chance'
  return 'needs work'
}

const deltaClass = (delta: number) => {
  const abs = Math.abs(delta)
  if (abs <= 5) return 'text-success'
  if (abs <= 10) return 'text-zinc-900 dark:text-zinc-100'
  return 'text-error'
}

usePageSeo({
  title: 'Predictions · EJ Fox',
  description:
    'Public, timestamped predictions with SHA-256 hashes and calibration tracking.',
  type: 'article',
  section: 'Forecasting',
  tags: ['Predictions', 'Forecasting', 'Calibration', 'Probability'],
})
</script>
