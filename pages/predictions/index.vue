<template>
  <main class="px-4 md:px-8 max-w-4xl">
    <header class="mb-6 pb-6 border-b border-zinc-300 dark:border-zinc-700">
      <h1 class="font-serif text-2xl text-zinc-900 dark:text-zinc-100 mb-3">
        Predictions
      </h1>

      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
        <div><span class="text-zinc-900 dark:text-zinc-100">{{ transformedPredictions?.length || 0 }}</span> total · <span class="text-zinc-900 dark:text-zinc-100">{{ correctCount }}</span> correct · <span class="text-zinc-900 dark:text-zinc-100">{{ incorrectCount }}</span> incorrect · <span class="text-zinc-900 dark:text-zinc-100">{{ pendingCount }}</span> pending</div>
        <div>SHA-256 hash + git timestamps · <a href="https://gwern.net/doc/statistics/prediction/index" target="_blank" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">gwern</a></div>
      </div>
    </header>

    <!-- Zero State -->
    <section v-if="transformedPredictions.length === 0" class="border border-zinc-300 dark:border-zinc-700 p-4">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase">No predictions yet</div>
      <p class="text-zinc-600 dark:text-zinc-400">
        Cryptographically verified predictions with SHA-256 hashing, PGP signatures, and git-based version control.
      </p>
    </section>

    <!-- Predictions List -->
    <section v-else>
      <div class="flex items-center justify-between pb-3 mb-6 border-b border-zinc-300 dark:border-zinc-700 font-mono text-xs">
        <div class="flex items-center gap-4 text-zinc-500 dark:text-zinc-500">
          <button
            v-for="filterType in filters"
            :key="filterType.key"
            :class="filterButtonClass(filterType.key)"
            @click="filter = filterType.key"
          >
            {{ filterType.label }}
          </button>
        </div>
        <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-500">
          <label>Sort</label>
          <select
            v-model="sortBy"
            class="px-2 py-1 bg-transparent text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
          >
            <option value="date">Date</option>
            <option value="confidence">Confidence</option>
            <option value="statement">Statement</option>
          </select>
        </div>
      </div>

      <div class="border-t border-zinc-300 dark:border-zinc-700">
        <PredictionCard
          v-for="prediction in filteredPredictions"
          :id="`prediction-${prediction.id}`"
          :key="prediction.id"
          :prediction="prediction"
        />
      </div>
    </section>

    <!-- Statistics -->
    <section v-if="transformedPredictions.length > 0" class="mt-8 pt-6 border-t border-zinc-300 dark:border-zinc-700">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">Statistics</h2>

      <!-- Summary stats -->
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-6 space-y-1">
        <div><span class="text-zinc-900 dark:text-zinc-100">{{ transformedPredictions.length }}</span> predictions · <span class="text-zinc-900 dark:text-zinc-100">{{ resolvedCount }}</span> resolved · <span class="text-zinc-900 dark:text-zinc-100">{{ pendingCount }}</span> pending</div>
        <div v-if="correctCount + incorrectCount > 0">Accuracy <span class="text-zinc-900 dark:text-zinc-100">{{ accuracyRate }}%</span> · Avg confidence <span class="text-zinc-900 dark:text-zinc-100">{{ avgConfidence }}%</span></div>
      </div>

      <!-- Calibration Analysis -->
      <div v-if="correctCount + incorrectCount > 0" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Calibration</h3>

      <!-- Confidence breakdown -->
      <table v-if="correctCount + incorrectCount > 1" class="w-full border-collapse mb-6 font-mono text-xs">
        <thead>
          <tr class="border-b border-zinc-300 dark:border-zinc-700">
            <th class="text-left py-2 text-zinc-900 dark:text-zinc-100 font-normal">Analysis</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">Avg</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-if="correctCount > 0" class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2">Correct</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ correctConfidenceAvg }}%</td>
            <td class="text-right">{{ correctCount }}</td>
          </tr>
          <tr v-if="incorrectCount > 0" class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2">Incorrect</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ incorrectConfidenceAvg }}%</td>
            <td class="text-right">{{ incorrectCount }}</td>
          </tr>
          <tr v-if="correctCount > 0 && incorrectCount > 0">
            <td class="py-2">Differential</td>
            <td class="text-right" :class="correctConfidenceAvg > incorrectConfidenceAvg ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
              {{ correctConfidenceAvg > incorrectConfidenceAvg ? '+' : '' }}{{ correctConfidenceAvg - incorrectConfidenceAvg }}%
            </td>
            <td class="text-right">
              {{ correctConfidenceAvg > incorrectConfidenceAvg ? 'good' : 'bad' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Calibration by range -->
      <table v-if="calibrationData.length > 0" class="w-full border-collapse mb-6 font-mono text-xs">
        <thead>
          <tr class="border-b border-zinc-300 dark:border-zinc-700">
            <th class="text-left py-2 text-zinc-900 dark:text-zinc-100 font-normal">Range</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">Accuracy</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-for="range in calibrationData" :key="range.label" class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2">{{ range.label }}</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ range.accuracy }}%</td>
            <td class="text-right">{{ range.total }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Resolutions by year -->
      <table v-if="resolutionsByYear.length > 0" class="w-full border-collapse mb-6 font-mono text-xs">
        <thead>
          <tr class="border-b border-zinc-300 dark:border-zinc-700">
            <th class="text-left py-2 text-zinc-900 dark:text-zinc-100 font-normal">Year</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">Accuracy</th>
            <th class="text-right py-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-for="yearData in resolutionsByYear" :key="yearData.year" class="border-b border-zinc-200 dark:border-zinc-800">
            <td class="py-2">{{ yearData.year }}</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100">{{ yearData.accuracy }}%</td>
            <td class="text-right">{{ yearData.total }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Version Control -->
    <section class="mt-8 pt-6 border-t border-zinc-300 dark:border-zinc-700">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Version Control</h2>
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 space-y-1 mb-3">
        <div>Markdown + SHA-256 + Git timestamps</div>
        <div>github.com/ejfox/website2/content/predictions/</div>
      </div>
      <a
        href="https://github.com/ejfox/website2/commits/main/content/predictions/"
        target="_blank"
        class="font-mono text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        View commit history →
      </a>
    </section>
  </main>

  <!-- Desktop TOC -->
  <teleport
    v-if="tocTarget && predictionToc.length > 0"
    to="#nav-toc-container"
  >
    <div class="toc w-48 font-mono">
      <div class="py-4">
        <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          On this page
        </h3>
        <ul class="space-y-2 text-xs">
          <li
            v-for="prediction in predictionToc"
            :key="prediction.slug"
            class="group relative"
          >
            <a
              :href="`#${prediction.slug}`"
              class="block no-underline"
              :class="[
                activeSection === prediction.slug
                  ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400'
              ]"
            >
              <div class="flex items-start gap-2">
                <span class="text-zinc-500 dark:text-zinc-500 shrink-0">{{ prediction.confidence }}%</span>
                <span class="block truncate flex-1 min-w-0">{{ prediction.text }}</span>
                <span v-if="prediction.status === 'correct' || prediction.status === 'incorrect'" class="shrink-0" :class="prediction.status === 'correct' ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'">
                  {{ prediction.status === 'correct' ? '✓' : '✗' }}
                </span>
              </div>
            </a>
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
  'transition-colors',
  filter.value === key
    ? 'text-zinc-900 dark:text-zinc-100'
    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
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
