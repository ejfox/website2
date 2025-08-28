<template>
  <main class="pt-16 px-8 mx-auto max-w-5xl">
    <header class="mb-48">
      <div class="mb-40">
        <h1
          class="text-5xl md:text-6xl lg:text-7xl font-light text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight mb-20"
        >
          Predictions & Forecasts
        </h1>
        <p
          class="text-zinc-600 dark:text-zinc-400 text-xl max-w-3xl leading-relaxed"
        >
          I don't know if I am any good at predicting the future, so I wanted to
          formalize the process. This is an effort to track and record a
          lifetime (!) of recorded predictions about the future, with a focus on
          transparency and immutability.
        </p>
      </div>

      <div class="border-l-2 border-zinc-200 dark:border-zinc-800 pl-16">
        <div class="mb-12">
          <h2
            class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-3"
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
        >
          Inspired by
          <a
            href="https://gwern.net/doc/statistics/prediction/index"
            target="_blank"
            rel="noopener noreferrer"
            class="text-zinc-800 dark:text-zinc-200 underline decoration-zinc-300 dark:decoration-zinc-700 decoration-1 underline-offset-4 hover:decoration-zinc-500 dark:hover:decoration-zinc-500 transition-all duration-300"
            >Gwern's prediction system</a
          >, and efforts like PredictIt or PolyMarket. But of course I want to
          own my own data and presentation. All predictions are
          cryptographically signed and commited to github for version history.
          Showing my failed predictions is an important part of this project.
        </p>
      </div>
    </header>

    <!-- Zero State -->
    <section
      v-if="transformedPredictions.length === 0"
      class="text-center mb-32"
    >
      <div
        class="w-24 h-24 mx-auto mb-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center"
      ></div>
      <h3
        class="text-2xl font-light text-zinc-700 dark:text-zinc-300 mb-8 tracking-wide"
      >
        No Predictions Yet
      </h3>
      <p
        class="text-lg text-zinc-500 dark:text-zinc-500 leading-[1.8] max-w-lg mx-auto mb-16"
      >
        This space will host cryptographically verified predictions and
        forecasts. Each entry will be immutably timestamped for accountability.
      </p>
      <div class="border-t border-zinc-100 dark:border-zinc-800 pt-16">
        <p
          class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-8"
        >
          Methodology
        </p>
        <p
          class="text-base text-zinc-500 dark:text-zinc-500 leading-[1.8] max-w-xl mx-auto"
        >
          Following academic forecasting standards with SHA-256 hashing, PGP
          signatures, and git-based version control for complete transparency.
        </p>
      </div>
    </section>

    <!-- Predictions List -->
    <section v-else>
      <div
        class="flex items-center justify-between pb-20 border-b border-zinc-200 dark:border-zinc-800 mb-40"
      >
        <div class="flex items-center gap-6">
          <button
            v-for="filterType in filters"
            :key="filterType.key"
            :class="filterButtonClass(filterType.key)"
            @click="filter = filterType.key"
          >
            {{ filterType.label }}
          </button>
        </div>
        <div class="flex items-center gap-6">
          <span
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
            >Sort</span
          >
          <select
            v-model="sortBy"
            class="px-6 py-3 text-xs bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors uppercase tracking-[0.2em]"
          >
            <option value="date">Date Created</option>
            <option value="confidence">Confidence</option>
            <option value="statement">Statement (A-Z)</option>
          </select>
        </div>
      </div>

      <TransitionGroup name="list" tag="div" class="space-y-40 md:space-y-48">
        <div
          v-for="prediction in filteredPredictions"
          :id="`prediction-${prediction.id}`"
          :key="prediction.id"
          :data-prediction-id="prediction.id"
        >
          <PredictionCard :prediction="prediction" />
        </div>
      </TransitionGroup>
    </section>

    <!-- Scoreboard -->
    <section
      v-if="transformedPredictions.length > 0"
      class="mt-64 border-t border-zinc-200 dark:border-zinc-800 pt-32"
    >
      <div class="mb-24">
        <h2
          class="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] mb-4"
        >
          Analytics
        </h2>
        <h3
          class="text-lg font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]"
        >
          All-Time Scoreboard
        </h3>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-16 mb-40">
        <div v-for="stat in stats" :key="stat.label" class="text-center py-16">
          <p
            class="text-6xl font-light mb-8 font-mono"
            :class="stat.color"
          >
            {{ stat.value }}{{ stat.suffix }}
          </p>
          <p
            class="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]"
          >
            {{ stat.label }}
          </p>
        </div>
      </div>

      <!-- Accuracy visualization if we have resolved predictions -->
      <div
        v-if="correctCount + incorrectCount > 0"
        class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-16 mb-24"
      >
        <div class="flex items-center justify-between mb-10">
          <p
            class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.15em]"
          >
            Accuracy Rate
          </p>
          <p
            class="text-3xl font-mono font-light text-zinc-900 dark:text-zinc-100"
          >
            {{ accuracyRate }}%
          </p>
        </div>
        <div
          class="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
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
        <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-8 font-mono">
          {{ correctCount + incorrectCount }} resolved •
          {{ correctCount }} correct • {{ incorrectCount }} incorrect
        </p>
      </div>

      <!-- Advanced Statistics -->
      <div v-if="correctCount + incorrectCount > 1" class="space-y-12 mb-16">
        <!-- Confidence Analysis -->
        <div
          class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-16"
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
    <div class="toc w-48">
      <div class="py-4">
        <h3
          class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-4"
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
              class="block text-sm transition-colors duration-200 no-underline"
              :class="[
                activeSection === prediction.slug
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="block truncate flex-1 min-w-0">{{
                  prediction.text
                }}</span>
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
import PredictionCard from '~/components/predictions/PredictionCard.vue'

const { data: predictions } = await useFetch('/api/predictions')
const filter = ref('all')
const sortBy = ref('date')

// Helper data
const filters = [
  {
    key: 'all',
    label: computed(() => `All (${transformedPredictions.value.length})`)
  },
  { key: 'pending', label: computed(() => `Pending (${pendingCount.value})`) },
  {
    key: 'resolved',
    label: computed(() => `Resolved (${resolvedCount.value})`)
  }
]

const filterButtonClass = (key) => [
  'px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300',
  filter.value === key
    ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
]

// Transform and filter predictions
const transformedPredictions = computed(
  () =>
    predictions.value
      ?.filter((p) => p.visibility === 'public')
      .map((p) => ({
        ...p,
        title: p.statement,
        status: p.status || (p.resolved ? 'resolved' : 'pending')
      })) || []
)

const filteredPredictions = computed(() => {
  let filtered = transformedPredictions.value
  if (filter.value === 'pending') filtered = filtered.filter((p) => !p.resolved)
  if (filter.value === 'resolved') filtered = filtered.filter((p) => p.resolved)

  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'confidence':
        return b.confidence - a.confidence
      case 'statement':
        return a.statement.localeCompare(b.statement)
      default:
        return new Date(b.created || 0) - new Date(a.created || 0)
    }
  })
})

// Computed stats
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

const avgConfidence = computed(() => {
  const valid = transformedPredictions.value.filter(
    (p) => typeof p.confidence === 'number'
  )
  return valid.length
    ? Math.round(valid.reduce((sum, p) => sum + p.confidence, 0) / valid.length)
    : 0
})

const accuracyRate = computed(() => {
  const resolved = correctCount.value + incorrectCount.value
  return resolved ? Math.round((correctCount.value / resolved) * 100) : 0
})

const stats = computed(() => [
  {
    label: 'Total',
    value: transformedPredictions.value.length,
    suffix: '',
    color: 'text-zinc-900 dark:text-zinc-100'
  },
  {
    label: 'Avg Confidence',
    value: avgConfidence.value,
    suffix: '%',
    color: 'text-zinc-900 dark:text-zinc-100'
  },
  {
    label: 'Correct',
    value: correctCount.value,
    suffix: '',
    color:
      correctCount.value > 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-zinc-400 dark:text-zinc-600'
  },
  {
    label: 'Incorrect',
    value: incorrectCount.value,
    suffix: '',
    color:
      incorrectCount.value > 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-zinc-400 dark:text-zinc-600'
  }
])

// Advanced statistics
const correctConfidenceAvg = computed(() => {
  const correct = transformedPredictions.value.filter(
    (p) => p.status === 'correct' && typeof p.confidence === 'number'
  )
  return correct.length
    ? Math.round(
        correct.reduce((sum, p) => sum + p.confidence, 0) / correct.length
      )
    : 0
})

const incorrectConfidenceAvg = computed(() => {
  const incorrect = transformedPredictions.value.filter(
    (p) => p.status === 'incorrect' && typeof p.confidence === 'number'
  )
  return incorrect.length
    ? Math.round(
        incorrect.reduce((sum, p) => sum + p.confidence, 0) / incorrect.length
      )
    : 0
})

const resolutionsByYear = computed(() => {
  const yearStats = {}
  transformedPredictions.value
    .filter((p) => p.resolved_date)
    .forEach((p) => {
      const year = new Date(p.resolved_date).getFullYear()
      if (!yearStats[year]) yearStats[year] = { total: 0, correct: 0 }
      yearStats[year].total++
      if (p.status === 'correct') yearStats[year].correct++
    })

  return Object.entries(yearStats)
    .map(([year, stats]) => ({
      year: parseInt(year),
      ...stats,
      accuracy: stats.total
        ? Math.round((stats.correct / stats.total) * 100)
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
      const correct = predictions.filter((p) => p.status === 'correct').length
      return {
        ...range,
        count: predictions.length,
        accuracy: predictions.length
          ? Math.round((correct / predictions.length) * 100)
          : 0,
        correct,
        total: predictions.length
      }
    })
    .filter((range) => range.count > 0)
})

// TOC functionality
const activeSection = ref('')
const tocTarget = ref(null)

const predictionToc = computed(() =>
  filteredPredictions.value.map((p) => ({
    slug: `prediction-${p.id}`,
    text:
      p.statement.length > 50 ? p.statement.slice(0, 47) + '...' : p.statement,
    status: p.status,
    confidence: p.confidence
  }))
)

onMounted(() => {
  if (process.client) {
    tocTarget.value = document.querySelector('#nav-toc-container')

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeSection.value = entry.target.id
        }),
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )

    nextTick(() => {
      document
        .querySelectorAll('[data-prediction-id]')
        .forEach((card) => observer.observe(card))
    })

    onUnmounted(() => observer.disconnect())
  }
})

watch([filter, filteredPredictions], async () => {
  await nextTick()
  if (process.client) {
    tocTarget.value = document.querySelector('#nav-toc-container')
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

/* DELETE sneaky padding - we're Tailwind bois! */
</style>
