<template>
  <main class="pt-8 px-8 mx-auto max-w-5xl">
    <header class="">
      <div class="mb-32">
        <h1
          class="text-5xl md:text-6xl lg:text-7xl font-light text-zinc-900 dark:text-zinc-100 leading-[1.05] tracking-tight mb-16"
          style="font-family: 'Fjalla One', sans-serif"
        >
          Predictions & Forecasts
        </h1>

        <p
          class="text-zinc-600 dark:text-zinc-400 text-xl max-w-3xl"
          style="font-family: 'Signika Negative', sans-serif"
        >
          I don't know if I am any good at predicting the future, so I wanted to
          formalize the process. This is an effort to track and record a
          lifetime (!) of recorded predictions about the future, with a focus on
          transparency and immutability.
        </p>
      </div>

      <div class="border-l-2 border-zinc-200 dark:border-zinc-800 pl-12">
        <div class="mb-8">
          <h2
            class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
          >
            About
          </h2>
          <h3
            class="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
          >
            This System
          </h3>
        </div>

        <p
          class="text-base text-zinc-600 dark:text-zinc-400 leading-[1.8] max-w-2xl"
          style="font-family: 'Signika Negative', sans-serif"
        >
          Inspired by
          <a
            href="https://gwern.net/doc/statistics/prediction/index"
            target="_blank"
            class="text-zinc-800 dark:text-zinc-200 underline decoration-zinc-300 dark:decoration-zinc-700 decoration-1 underline-offset-4 hover:decoration-zinc-500 dark:hover:decoration-zinc-500 transition-all duration-300"
          >
            Gwern's prediction system </a
          >, and efforts like PredictIt or PolyMarket. But of course I want to
          own my own data and presentation. All predictions are
          cryptographically signed and commited to github for version history.
          Showing my failed predictions is an important part of this project.
        </p>
      </div>
    </header>

    <!-- Zero State -->
    <section v-if="transformedPredictions.length === 0" class="">
      <div class="text-center mb-32">
        <div
          class="w-24 h-24 mx-auto mb-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center"
        >
          <Icon
            name="heroicons:crystal-ball"
            class="w-12 h-12 text-zinc-400 dark:text-zinc-600"
          />
        </div>
        <h3
          class="text-2xl font-light text-zinc-700 dark:text-zinc-300 mb-8 tracking-wide"
          style="font-family: 'Fjalla One', sans-serif"
        >
          No Predictions Yet
        </h3>
        <p
          class="text-lg text-zinc-500 dark:text-zinc-500 leading-[1.8] max-w-lg mx-auto"
          style="font-family: 'Signika Negative', sans-serif"
        >
          This space will host cryptographically verified predictions and
          forecasts. Each entry will be immutably timestamped for
          accountability.
        </p>
      </div>

      <div class="border-t border-zinc-100 dark:border-zinc-800">
        <div class="text-center">
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-8"
          >
            Methodology
          </p>
          <p
            class="text-base text-zinc-500 dark:text-zinc-500 leading-[1.8] max-w-xl mx-auto"
            style="font-family: 'Signika Negative', sans-serif"
          >
            Following academic forecasting standards with SHA-256 hashing, PGP
            signatures, and git-based version control for complete transparency.
          </p>
        </div>
      </div>
    </section>

    <!-- Predictions List -->
    <section v-else>
      <!-- Filter and sort controls -->
      <div class="mb-32">
        <div
          class="flex items-center justify-between pb-16 border-b border-zinc-200 dark:border-zinc-800"
        >
          <!-- Filter buttons -->
          <div class="flex items-center gap-4">
            <button
              :class="[
                'px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300',
                filter === 'all'
                  ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
              @click="filter = 'all'"
            >
              All ({{ transformedPredictions.length }})
            </button>
            <button
              :class="[
                'px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300',
                filter === 'pending'
                  ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
              @click="filter = 'pending'"
            >
              Pending ({{ pendingCount }})
            </button>
            <button
              :class="[
                'px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300',
                filter === 'resolved'
                  ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ]"
              @click="filter = 'resolved'"
            >
              Resolved ({{ resolvedCount }})
            </button>
          </div>

          <!-- Sort dropdown -->
          <div class="flex items-center gap-4">
            <span
              class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
              >Sort</span
            >
            <select
              v-model="sortBy"
              class="px-4 py-2 text-xs bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors uppercase tracking-[0.2em]"
            >
              <option value="date">Date Created</option>
              <option value="confidence">Confidence</option>
              <option value="statement">Statement (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <TransitionGroup name="list" tag="div" class="space-y-24 md:space-y-32">
        <div
          v-for="prediction in filteredPredictions"
          :id="`prediction-${prediction.id}`"
          :key="prediction._path + prediction.title"
          :data-prediction-id="prediction.id"
        >
          <PredictionCard :prediction="prediction" />
        </div>
      </TransitionGroup>
    </section>

    <!-- Scoreboard -->
    <section
      v-if="transformedPredictions.length > 0"
      class="mt-48 border-t border-zinc-200 dark:border-zinc-800 pt-24"
    >
      <div class="mb-16">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
        >
          Analytics
        </h2>
        <h3
          class="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
        >
          All-Time Scoreboard
        </h3>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-12 mb-32">
        <div class="text-center py-12">
          <p
            class="text-5xl font-light text-zinc-900 dark:text-zinc-100 mb-6 font-mono"
            style="font-family: 'Red Hat Mono', monospace"
          >
            {{ totalPredictions }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
          >
            Total
          </p>
        </div>

        <div class="text-center py-12">
          <p
            class="text-5xl font-light text-zinc-900 dark:text-zinc-100 mb-6 font-mono"
            style="font-family: 'Red Hat Mono', monospace"
          >
            {{ avgConfidence }}%
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
          >
            Avg Confidence
          </p>
        </div>

        <div class="text-center py-12">
          <p
            class="text-5xl font-light mb-6 font-mono"
            style="font-family: 'Red Hat Mono', monospace"
            :class="
              correctCount > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-zinc-400 dark:text-zinc-600'
            "
          >
            {{ correctCount }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
          >
            Correct
          </p>
        </div>

        <div class="text-center py-12">
          <p
            class="text-5xl font-light mb-6 font-mono"
            style="font-family: 'Red Hat Mono', monospace"
            :class="
              incorrectCount > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-400 dark:text-zinc-600'
            "
          >
            {{ incorrectCount }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
          >
            Incorrect
          </p>
        </div>
      </div>

      <!-- Accuracy visualization if we have resolved predictions -->
      <div
        v-if="correctCount + incorrectCount > 0"
        class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-12 mb-16"
      >
        <div class="flex items-center justify-between mb-6">
          <p
            class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.15em]"
          >
            Accuracy Rate
          </p>
          <p
            class="text-2xl font-mono font-light text-zinc-900 dark:text-zinc-100"
            style="font-family: 'Red Hat Mono', monospace"
          >
            {{ accuracyRate }}%
          </p>
        </div>
        <div
          class="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
        >
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="
              accuracyRate >= 70
                ? 'bg-green-600 dark:bg-green-400'
                : accuracyRate >= 50
                  ? 'bg-yellow-600 dark:bg-yellow-400'
                  : 'bg-red-600 dark:bg-red-400'
            "
            :style="{ width: `${accuracyRate}%` }"
          />
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-6 font-mono">
          {{ correctCount + incorrectCount }} resolved •
          {{ correctCount }} correct • {{ incorrectCount }} incorrect
        </p>
      </div>

      <!-- Advanced Statistics -->
      <div v-if="correctCount + incorrectCount > 1" class="space-y-8 mb-12">
        <!-- Confidence Analysis -->
        <div
          class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-12"
        >
          <h3
            class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.15em] mb-6"
          >
            Confidence Analysis
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-if="correctCount > 0" class="text-center">
              <p
                class="text-2xl font-mono font-light text-green-600 dark:text-green-400 mb-2"
                style="font-family: 'Red Hat Mono', monospace"
              >
                {{ correctConfidenceAvg }}%
              </p>
              <p
                class="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.15em]"
              >
                Avg Confidence (Correct)
              </p>
            </div>
            <div v-if="incorrectCount > 0" class="text-center">
              <p
                class="text-2xl font-mono font-light text-red-600 dark:text-red-400 mb-2"
                style="font-family: 'Red Hat Mono', monospace"
              >
                {{ incorrectConfidenceAvg }}%
              </p>
              <p
                class="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.15em]"
              >
                Avg Confidence (Incorrect)
              </p>
            </div>
          </div>
          <div
            v-if="correctCount > 0 && incorrectCount > 0"
            class="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
          >
            <p class="text-xs text-zinc-500 dark:text-zinc-500 text-center">
              <span
                v-if="correctConfidenceAvg > incorrectConfidenceAvg"
                class="text-green-600 dark:text-green-400"
              >
                ✓ Higher confidence on correct predictions (+{{
                  correctConfidenceAvg - incorrectConfidenceAvg
                }}%)
              </span>
              <span
                v-else-if="incorrectConfidenceAvg > correctConfidenceAvg"
                class="text-red-600 dark:text-red-400"
              >
                ⚠ Higher confidence on incorrect predictions (+{{
                  incorrectConfidenceAvg - correctConfidenceAvg
                }}%)
              </span>
              <span v-else class="text-zinc-600 dark:text-zinc-400">
                Similar confidence levels across outcomes
              </span>
            </p>
          </div>
        </div>

        <!-- Calibration Chart -->
        <div
          v-if="calibrationData.length > 0"
          class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-12"
        >
          <h3
            class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.15em] mb-6"
          >
            Calibration by Confidence Range
          </h3>
          <div class="space-y-4">
            <div
              v-for="range in calibrationData"
              :key="range.label"
              class="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
            >
              <div class="flex items-center gap-4">
                <span
                  class="text-sm font-mono text-zinc-700 dark:text-zinc-300 w-16"
                  >{{ range.label }}</span
                >
                <div
                  class="w-32 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="
                      range.accuracy >= 80
                        ? 'bg-green-600 dark:bg-green-400'
                        : range.accuracy >= 60
                          ? 'bg-yellow-600 dark:bg-yellow-400'
                          : 'bg-red-600 dark:bg-red-400'
                    "
                    :style="{ width: `${range.accuracy}%` }"
                  />
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-mono text-zinc-900 dark:text-zinc-100"
                  >{{ range.accuracy }}%</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-500 ml-2"
                  >({{ range.correct }}/{{ range.total }})</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Resolutions by Year -->
        <div
          v-if="resolutionsByYear.length > 0"
          class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-12"
        >
          <h3
            class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.15em] mb-6"
          >
            Resolutions by Year
          </h3>
          <div class="space-y-4">
            <div
              v-for="yearData in resolutionsByYear"
              :key="yearData.year"
              class="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
            >
              <div class="flex items-center gap-4">
                <span
                  class="text-sm font-mono text-zinc-700 dark:text-zinc-300 w-12"
                  >{{ yearData.year }}</span
                >
                <div
                  class="w-32 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="
                      yearData.accuracy >= 70
                        ? 'bg-green-600 dark:bg-green-400'
                        : yearData.accuracy >= 50
                          ? 'bg-yellow-600 dark:bg-yellow-400'
                          : 'bg-red-600 dark:bg-red-400'
                    "
                    :style="{ width: `${yearData.accuracy}%` }"
                  />
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-mono text-zinc-900 dark:text-zinc-100"
                  >{{ yearData.accuracy }}%</span
                >
                <span class="text-xs text-zinc-500 dark:text-zinc-500 ml-2"
                  >({{ yearData.correct }}/{{ yearData.total }})</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Commitment Log -->
    <section class="mt-48 border-t border-zinc-200 dark:border-zinc-800 pt-24">
      <div class="mb-16">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-2"
        >
          Audit
        </h2>
        <h3
          class="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
        >
          Commitment Log
        </h3>
      </div>

      <div class="border-l-2 border-zinc-200 dark:border-zinc-800 pl-12">
        <p
          class="text-base text-zinc-600 dark:text-zinc-400 leading-[1.8] mb-12 max-w-2xl"
        >
          All predictions are tracked through git commits, creating an immutable
          audit trail.
        </p>

        <a
          href="https://github.com/ejfox/website2/commits/main/content/predictions/"
          target="_blank"
          class="inline-flex items-center gap-3 px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300 uppercase tracking-[0.2em]"
        >
          <Icon name="mdi:github" class="w-4 h-4" />
          View on GitHub
        </a>
      </div>
    </section>
  </main>

  <!-- Desktop TOC -->
  <teleport
    v-if="tocTarget && predictionToc.length > 0"
    to="#nav-toc-container"
  >
    <div class="toc">
      <div class="px-6 py-6">
        <h3
          class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-6"
        >
          Predictions
        </h3>
        <ul class="space-y-1">
          <li
            v-for="prediction in predictionToc"
            :key="prediction.slug"
            class="group relative"
          >
            <a
              :href="`#${prediction.slug}`"
              class="block py-2 pr-3 pl-4 -ml-4 text-[13px] leading-relaxed transition-all duration-200 rounded-lg"
              :class="[
                activeSection === prediction.slug
                  ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="block truncate">{{ prediction.text }}</span>
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="text-xs font-mono text-zinc-400 dark:text-zinc-600"
                    >{{ prediction.confidence }}%</span
                  >
                  <div
                    v-if="
                      prediction.status === 'correct' ||
                      prediction.status === 'incorrect'
                    "
                    class="w-2 h-2 rounded-full"
                    :class="
                      prediction.status === 'correct'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    "
                  />
                </div>
              </div>
            </a>
            <!-- Active indicator -->
            <div
              v-if="activeSection === prediction.slug"
              class="absolute left-0 top-2 bottom-2 w-[2px] bg-zinc-900 dark:bg-zinc-100 rounded-full"
            />
          </li>
        </ul>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import PredictionCard from '~/components/prediction/PredictionCard.vue'
import { usePredictions } from '~/composables/usePredictions'

const { data: predictions } = await useFetch('/api/predictions')

// Filter and sort state
const filter = ref('all')
const sortBy = ref('date') // 'date', 'confidence', 'statement'

// Filter and transform predictions
const transformedPredictions = computed(() => {
  if (!predictions.value) return []

  return predictions.value
    .filter((pred) => pred.visibility === 'public')
    .map((pred) => ({
      title: pred.statement,
      statement: pred.statement,
      confidence: pred.confidence,
      deadline: pred.deadline,
      categories: pred.categories || [],
      created: pred.created,
      resolved: pred.resolved,
      resolved_date: pred.resolved_date,
      evidence: pred.evidence,
      resolution: pred.resolution,
      related: pred.related,
      id: pred.id,
      slug: pred.slug,
      status: pred.status || (pred.resolved ? 'resolved' : 'pending')
    }))
})

// Filtered and sorted predictions
const filteredPredictions = computed(() => {
  let filtered = transformedPredictions.value

  // Apply filter
  if (filter.value === 'pending') {
    filtered = filtered.filter((pred) => !pred.resolved)
  } else if (filter.value === 'resolved') {
    filtered = filtered.filter((pred) => pred.resolved)
  }

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'confidence':
        return b.confidence - a.confidence // High to low
      case 'statement':
        return a.statement.localeCompare(b.statement) // A to Z
      case 'date':
      default:
        return new Date(b.created || 0) - new Date(a.created || 0) // Recent first
    }
  })

  return sorted
})

// Counts
const totalPredictions = computed(() => transformedPredictions.value.length)
const pendingCount = computed(
  () => transformedPredictions.value.filter((p) => !p.resolved).length
)
const resolvedCount = computed(
  () => transformedPredictions.value.filter((p) => p.resolved).length
)
const correctCount = computed(
  () =>
    transformedPredictions.value.filter((p) => p.status === 'correct').length
)
const incorrectCount = computed(
  () =>
    transformedPredictions.value.filter((p) => p.status === 'incorrect').length
)

// Statistics
const avgConfidence = computed(() => {
  if (transformedPredictions.value.length === 0) return 0
  const validPredictions = transformedPredictions.value.filter(
    (p) => typeof p.confidence === 'number' && !isNaN(p.confidence)
  )
  if (validPredictions.length === 0) return 0
  const sum = validPredictions.reduce((acc, pred) => acc + pred.confidence, 0)
  return Math.round(sum / validPredictions.length)
})

const accuracyRate = computed(() => {
  const resolved = transformedPredictions.value.filter(
    (p) => p.status === 'correct' || p.status === 'incorrect'
  )
  if (resolved.length === 0) return 0
  const correct = resolved.filter((p) => p.status === 'correct').length
  return Math.round((correct / resolved.length) * 100)
})

// Advanced statistics
const correctConfidenceAvg = computed(() => {
  const correct = transformedPredictions.value.filter(
    (p) =>
      p.status === 'correct' &&
      typeof p.confidence === 'number' &&
      !isNaN(p.confidence)
  )
  if (correct.length === 0) return 0
  const sum = correct.reduce((acc, pred) => acc + pred.confidence, 0)
  return Math.round(sum / correct.length)
})

const incorrectConfidenceAvg = computed(() => {
  const incorrect = transformedPredictions.value.filter(
    (p) =>
      p.status === 'incorrect' &&
      typeof p.confidence === 'number' &&
      !isNaN(p.confidence)
  )
  if (incorrect.length === 0) return 0
  const sum = incorrect.reduce((acc, pred) => acc + pred.confidence, 0)
  return Math.round(sum / incorrect.length)
})

const resolutionsByYear = computed(() => {
  const resolved = transformedPredictions.value.filter((p) => p.resolved_date)
  const years = {}

  resolved.forEach((pred) => {
    const year = new Date(pred.resolved_date).getFullYear()
    if (!years[year]) {
      years[year] = { total: 0, correct: 0, incorrect: 0 }
    }
    years[year].total++
    if (pred.status === 'correct') years[year].correct++
    if (pred.status === 'incorrect') years[year].incorrect++
  })

  return Object.entries(years)
    .map(([year, stats]) => ({
      year: parseInt(year),
      ...stats,
      accuracy:
        stats.correct + stats.incorrect > 0
          ? Math.round(
              (stats.correct / (stats.correct + stats.incorrect)) * 100
            )
          : 0
    }))
    .sort((a, b) => b.year - a.year)
})

const calibrationData = computed(() => {
  const ranges = [
    { min: 90, max: 100, label: '90-100%' },
    { min: 80, max: 89, label: '80-89%' },
    { min: 70, max: 79, label: '70-79%' },
    { min: 60, max: 69, label: '60-69%' },
    { min: 50, max: 59, label: '50-59%' },
    { min: 0, max: 49, label: '0-49%' }
  ]

  return ranges
    .map((range) => {
      const predictions = transformedPredictions.value.filter(
        (p) =>
          p.confidence >= range.min &&
          p.confidence <= range.max &&
          (p.status === 'correct' || p.status === 'incorrect')
      )

      if (predictions.length === 0) return { ...range, count: 0, accuracy: 0 }

      const correct = predictions.filter((p) => p.status === 'correct').length
      const accuracy = Math.round((correct / predictions.length) * 100)

      return {
        ...range,
        count: predictions.length,
        accuracy,
        correct,
        total: predictions.length
      }
    })
    .filter((range) => range.count > 0)
})

// Dynamic filter title
const filterTitle = computed(() => {
  if (filter.value === 'pending') return 'Pending Predictions'
  if (filter.value === 'resolved') return 'Resolved Predictions'
  return 'All Predictions'
})

// TOC functionality (similar to blog pages)
const activeSection = ref('')
const tocTarget = ref(null)

// Create TOC data from predictions
const predictionToc = computed(() => {
  return filteredPredictions.value.map((prediction, index) => ({
    slug: `prediction-${prediction.id}`,
    text:
      prediction.statement.length > 50
        ? prediction.statement.slice(0, 47) + '...'
        : prediction.statement,
    fullText: prediction.statement,
    status: prediction.status,
    confidence: prediction.confidence
  }))
})

onMounted(() => {
  if (process.client) {
    tocTarget.value = document.querySelector('#nav-toc-container')
  }

  // Set up intersection observer for predictions
  const predictionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  )

  nextTick(() => {
    // Observe prediction cards
    const predictionCards = document.querySelectorAll('[data-prediction-id]')
    predictionCards.forEach((card) => predictionObserver.observe(card))
  })

  // Clean up
  onUnmounted(() => {
    predictionObserver.disconnect()
  })
})

// Watch for filter changes to re-initialize TOC and observers
watch([filter, filteredPredictions], async () => {
  await nextTick()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (process.client) {
    tocTarget.value = document.querySelector('#nav-toc-container')

    // Re-initialize intersection observer for new prediction cards
    const predictionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id
          }
        })
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )

    const predictionCards = document.querySelectorAll('[data-prediction-id]')
    predictionCards.forEach((card) => predictionObserver.observe(card))
  }
})

useSeoMeta({
  title: 'Predictions & Forecasts',
  description:
    'Public predictions with cryptographic verification and accountability',
  ogTitle: 'Predictions & Forecasts | ejfox.com',
  ogDescription: 'Cryptographically verified predictions and forecasts',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc {
  @apply py-4 px-4;
}

.toc h3 {
  @apply text-zinc-800 dark:text-zinc-200 font-medium mb-4;
}

.toc ul {
  @apply pl-0 space-y-4;
}
</style>
