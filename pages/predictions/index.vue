<template>
  <main class="px-4 md:px-8 max-w-4xl">
    <header class="mb-8">
      <h1 class="font-serif text-2xl text-zinc-900 dark:text-zinc-100 mb-3">
        Predictions
      </h1>

      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
        <div><span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ transformedPredictions?.length || 0 }}</span> total · <span class="text-green-600 dark:text-green-500 font-bold text-lg tabular-nums">{{ correctCount }}</span> correct · <span class="text-red-600 dark:text-red-500 font-bold text-lg tabular-nums">{{ incorrectCount }}</span> incorrect · <span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ pendingCount }}</span> pending</div>
      </div>
    </header>

    <!-- Zero State -->
    <section v-if="transformedPredictions.length === 0" class="py-4">
      <div class="text-zinc-900 dark:text-zinc-100 mb-2 uppercase">No predictions yet</div>
      <p class="text-zinc-600 dark:text-zinc-400">
        Cryptographically verified predictions with SHA-256 hashing, PGP signatures, and git-based version control.
      </p>
    </section>

    <!-- Predictions List -->
    <section v-else>
      <!-- ACTIVE Predictions -->
      <div v-if="activePredictions.length > 0" class="mb-12">
        <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">Active</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          <PredictionCard
            v-for="prediction in activePredictions"
            :id="`prediction-${prediction.id}`"
            :key="prediction.id"
            :prediction="prediction"
          />
        </div>
      </div>

      <!-- RESOLVED Predictions -->
      <div v-if="resolvedPredictions.length > 0">
        <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">Resolved</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          <PredictionCard
            v-for="prediction in resolvedPredictions"
            :id="`prediction-${prediction.id}`"
            :key="prediction.id"
            :prediction="prediction"
          />
        </div>
      </div>
    </section>

    <!-- MARKET POSITIONS -->
    <div v-if="kalshiData?.positions && kalshiData.positions.length > 0" class="mb-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-4 transition-colors duration-300">Market Positions</h2>
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 tracking-normal dark:tracking-wide mb-6 transition-colors duration-300">
        <div><span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ kalshiData.positions.length }}</span> active positions · <span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">${{ ((kalshiData.balance?.portfolio_value || 0) / 100).toFixed(2) }}</span> portfolio value</div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        <article
          v-for="position in kalshiData.positions"
          :key="position.ticker"
          class="py-4"
        >
          <div class="mb-2">
            <div class="flex items-start gap-3 mb-1">
              <span
                class="font-mono text-lg font-bold shrink-0 tabular-nums tracking-tight dark:tracking-normal transition-colors duration-300"
                :class="position.position > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'"
              >
                {{ position.position > 0 ? 'YES' : 'NO' }}
              </span>
              <div class="font-serif text-base leading-snug text-zinc-900 dark:text-zinc-100 flex-1 transition-colors duration-300">
                {{ getMarketTitle(position.ticker) }}
              </div>
            </div>
          </div>

          <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 tracking-normal dark:tracking-wide flex items-center gap-2 mb-2 transition-colors duration-300">
            <span>{{ Math.abs(position.position) }} @ {{ (position.total_cost / Math.abs(position.position) / 100).toFixed(0) }}¢</span>
            <span v-if="getCommentary(position.ticker)?.tags?.length">·</span>
            <span
              v-for="tag in getCommentary(position.ticker)?.tags"
              :key="tag"
            >
              #{{ tag }}
            </span>
          </div>

          <div v-if="getCommentary(position.ticker)" class="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-normal tracking-normal dark:tracking-wide transition-colors duration-300">
            {{ getCommentary(position.ticker).commentary }}
          </div>
        </article>
      </div>

      <!-- Fills Table -->
      <div v-if="kalshiData?.fills && kalshiData.fills.length > 0" class="mt-8">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-3 transition-colors duration-300">Recent Fills</h3>
        <table class="w-full border-collapse font-mono text-xs tracking-normal dark:tracking-wide">
          <thead>
            <tr>
              <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Time</th>
              <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Market</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Side</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Qty</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Price</th>
            </tr>
          </thead>
          <tbody class="text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
            <tr v-for="fill in kalshiData.fills.slice(0, 10)" :key="fill.fill_id" class="transition-colors duration-300">
              <td class="py-1 tabular-nums">{{ formatTime(fill.created_time) }}</td>
              <td class="py-1">{{ fill.ticker }}</td>
              <td class="py-1 text-right font-bold tracking-tight dark:tracking-normal transition-colors duration-300" :class="fill.side === 'yes' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">{{ fill.side.toUpperCase() }}</td>
              <td class="py-1 text-right tabular-nums">{{ fill.count }}</td>
              <td class="py-1 text-right tabular-nums">{{ (fill.price * 100).toFixed(0) }}¢</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Statistics -->
    <section v-if="transformedPredictions.length > 0" class="mt-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">Statistics</h2>

      <!-- Summary stats -->
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-6 space-y-1">
        <div><span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ transformedPredictions.length }}</span> predictions · <span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ resolvedCount }}</span> resolved · <span class="text-zinc-900 dark:text-zinc-100 font-bold text-lg tabular-nums">{{ pendingCount }}</span> pending</div>
        <div v-if="correctCount + incorrectCount > 0">Accuracy <span class="text-zinc-900 dark:text-zinc-100 font-bold text-xl tabular-nums">{{ accuracyRate }}%</span> · Avg confidence <span class="text-zinc-900 dark:text-zinc-100 font-bold text-xl tabular-nums">{{ avgConfidence }}%</span></div>
      </div>

      <!-- Calibration Analysis -->
      <div v-if="correctCount + incorrectCount > 0" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">Calibration</h3>

      <!-- Confidence breakdown -->
      <table v-if="correctCount + incorrectCount > 1" class="w-full border-collapse mb-6 font-mono text-xs">
        <thead>
          <tr>
            <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Analysis</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Avg</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-if="correctCount > 0">
            <td class="py-1">Correct</td>
            <td class="text-right text-green-600 dark:text-green-500 font-bold text-2xl tabular-nums">{{ correctConfidenceAvg }}%</td>
            <td class="text-right">{{ correctCount }}</td>
          </tr>
          <tr v-if="incorrectCount > 0">
            <td class="py-1">Incorrect</td>
            <td class="text-right text-red-600 dark:text-red-500 font-bold text-2xl tabular-nums">{{ incorrectConfidenceAvg }}%</td>
            <td class="text-right">{{ incorrectCount }}</td>
          </tr>
          <tr v-if="correctCount > 0 && incorrectCount > 0">
            <td class="py-1">Differential</td>
            <td class="text-right font-bold text-2xl tabular-nums" :class="correctConfidenceAvg > incorrectConfidenceAvg ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
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
          <tr>
            <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Range</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Accuracy</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-for="range in calibrationData" :key="range.label">
            <td class="py-1">{{ range.label }}</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums">{{ range.accuracy }}%</td>
            <td class="text-right">{{ range.total }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Resolutions by year -->
      <table v-if="resolutionsByYear.length > 0" class="w-full border-collapse mb-6 font-mono text-xs">
        <thead>
          <tr>
            <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Year</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">Accuracy</th>
            <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal">n</th>
          </tr>
        </thead>
        <tbody class="text-zinc-500 dark:text-zinc-500">
          <tr v-for="yearData in resolutionsByYear" :key="yearData.year">
            <td class="py-1">{{ yearData.year }}</td>
            <td class="text-right text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums">{{ yearData.accuracy }}%</td>
            <td class="text-right">{{ yearData.total }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Meta-Analysis (Gwern Mode) -->
    <section v-if="calibration && calibration.summary.resolved > 0" class="mt-12">
      <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-4 transition-colors duration-300">Meta-Analysis</h2>

      <!-- Brier Score -->
      <div v-if="calibration.brier_score !== null" class="mb-6">
        <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mb-2 transition-colors duration-300">Brier Score</div>
        <div class="flex items-baseline gap-2">
          <span class="font-mono text-4xl font-bold tabular-nums tracking-tight dark:tracking-normal transition-colors duration-300"
                :class="calibration.brier_score < 0.20 ? 'text-green-600 dark:text-green-500' : calibration.brier_score < 0.25 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-500'">
            {{ calibration.brier_score.toFixed(3) }}
          </span>
          <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
            {{ calibration.brier_score < 0.20 ? '(excellent)' : calibration.brier_score < 0.25 ? '(good)' : '(needs work)' }}
          </span>
        </div>
        <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-1 transition-colors duration-300">
          0 = perfect · 1 = worst · &lt;0.25 = good
        </div>
      </div>

      <!-- Calibration Buckets -->
      <div v-if="calibration.calibration && calibration.calibration.length > 0" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-3 transition-colors duration-300">Calibration Curve</h3>
        <table class="w-full border-collapse font-mono text-xs tracking-normal dark:tracking-wide">
          <thead>
            <tr>
              <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Confidence</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Expected</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Actual</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Δ</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">n</th>
            </tr>
          </thead>
          <tbody class="text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
            <tr v-for="bucket in calibration.calibration" :key="bucket.label" class="transition-colors duration-300">
              <td class="py-1">{{ bucket.label }}</td>
              <td class="py-1 text-right tabular-nums">{{ bucket.expected }}%</td>
              <td class="py-1 text-right font-bold text-lg tabular-nums tracking-tight dark:tracking-normal transition-colors duration-300"
                  :class="Math.abs(bucket.delta) <= 5 ? 'text-green-600 dark:text-green-500' : Math.abs(bucket.delta) <= 10 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-500'">
                {{ bucket.accuracy }}%
              </td>
              <td class="py-1 text-right tabular-nums font-bold transition-colors duration-300"
                  :class="bucket.delta >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
                {{ bucket.delta >= 0 ? '+' : '' }}{{ bucket.delta }}pp
              </td>
              <td class="py-1 text-right tabular-nums">{{ bucket.count }}</td>
            </tr>
          </tbody>
        </table>
        <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2 transition-colors duration-300">
          Well-calibrated means actual ≈ expected (Δ near 0)
        </div>
      </div>

      <!-- Category Performance -->
      <div v-if="calibration.by_category && calibration.by_category.length > 0" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-3 transition-colors duration-300">By Category</h3>
        <table class="w-full border-collapse font-mono text-xs tracking-normal dark:tracking-wide">
          <thead>
            <tr>
              <th class="text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Category</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Accuracy</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Correct</th>
              <th class="text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal transition-colors duration-300">Total</th>
            </tr>
          </thead>
          <tbody class="text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
            <tr v-for="cat in calibration.by_category" :key="cat.category" class="transition-colors duration-300">
              <td class="py-1">{{ cat.category }}</td>
              <td class="py-1 text-right font-bold text-lg tabular-nums tracking-tight dark:tracking-normal transition-colors duration-300"
                  :class="cat.accuracy >= 70 ? 'text-green-600 dark:text-green-500' : cat.accuracy >= 50 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-500'">
                {{ cat.accuracy }}%
              </td>
              <td class="py-1 text-right tabular-nums">{{ cat.correct }}</td>
              <td class="py-1 text-right tabular-nums">{{ cat.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Update Analysis -->
      <div v-if="calibration.update_analysis" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-3 transition-colors duration-300">Update Patterns</h3>
        <div class="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Predictions Updated</div>
            <div class="text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums transition-colors duration-300">
              {{ calibration.update_analysis.predictionsWithUpdates }}
            </div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Total Updates</div>
            <div class="text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums transition-colors duration-300">
              {{ calibration.update_analysis.totalUpdates }}
            </div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Avg Updates/Prediction</div>
            <div class="text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums transition-colors duration-300">
              {{ calibration.update_analysis.avgUpdatesPerPrediction }}
            </div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Avg Confidence Δ</div>
            <div class="font-bold text-2xl tabular-nums transition-colors duration-300"
                 :class="calibration.update_analysis.avgConfidenceChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
              {{ calibration.update_analysis.avgConfidenceChange >= 0 ? '+' : '' }}{{ calibration.update_analysis.avgConfidenceChange }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Market Comparison -->
      <div v-if="calibration.market_comparison" class="mb-6">
        <h3 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider dark:tracking-widest mb-3 transition-colors duration-300">vs Market Baseline</h3>
        <div class="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Disagreements (&gt;10% diff)</div>
            <div class="text-zinc-900 dark:text-zinc-100 font-bold text-2xl tabular-nums transition-colors duration-300">
              {{ calibration.market_comparison.disagreements }} / {{ calibration.market_comparison.total }}
            </div>
          </div>
          <div>
            <div class="text-zinc-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Accuracy When Disagreed</div>
            <div class="font-bold text-2xl tabular-nums transition-colors duration-300"
                 :class="calibration.market_comparison.accuracyWhenDisagreed >= 50 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
              {{ calibration.market_comparison.accuracyWhenDisagreed }}%
            </div>
          </div>
        </div>
        <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2 transition-colors duration-300">
          {{ calibration.market_comparison.accuracyWhenDisagreed >= 50 ? 'Beating the market when you disagree' : 'Market outperforming when you disagree' }}
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
        <div class="mb-1">
          Analysis based on <span class="text-zinc-900 dark:text-zinc-100 font-bold">{{ calibration.summary.resolved }}</span> resolved predictions
        </div>
        <div v-if="calibration.generated_at" class="text-zinc-400 dark:text-zinc-600 transition-colors duration-300">
          Generated {{ new Date(calibration.generated_at).toLocaleString() }}
        </div>
      </div>
    </section>

    <!-- Version Control -->
    <section class="mt-12">
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
              :style="{ opacity: 0.7 + (prediction.confidence / 100) * 0.3 }"
            >
              <div class="flex items-start gap-2">
                <span class="text-zinc-500 dark:text-zinc-500 shrink-0">{{ prediction.confidence }}%</span>
                <span class="block line-clamp-2 flex-1 min-w-0">{{ prediction.text }}</span>
                <span v-if="prediction.status === 'correct' || prediction.status === 'incorrect'" class="shrink-0" :class="prediction.status === 'correct' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
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

useSeoMeta({
  title: 'Predictions - EJ Fox',
  description: 'Cryptographically verified predictions with SHA-256 hashing and git-based version control',
  ogTitle: 'Predictions - EJ Fox',
  ogDescription: 'Cryptographically verified predictions and forecasts',
  ogUrl: 'https://ejfox.com/predictions',
  ogType: 'website',
  ogImage: 'https://ejfox.com/og-image.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Predictions - EJ Fox',
  twitterDescription: 'Cryptographically verified predictions and forecasts',
  twitterImage: 'https://ejfox.com/og-image.png'
})

const { data: predictions } = await useFetch('/api/predictions')
const { data: kalshiData } = useKalshi()
const { data: calibration } = useCalibration()
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

// Separate active and resolved predictions
const activePredictions = computed(() => {
  return transformedPredictions.value
    .filter((p) => !p.resolved)
    .sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0))
})

const resolvedPredictions = computed(() => {
  return transformedPredictions.value
    .filter((p) => p.resolved)
    .sort((a, b) => new Date(b.resolved_date || b.created || 0) - new Date(a.resolved_date || a.created || 0))
})

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
      year: Number.parseInt(year),
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

const predictionToc = computed(() => {
  const active = activePredictions.value.map((p) => ({
    slug: `prediction-${p.id}`,
    text: p.statement.length > 50 ? p.statement.slice(0, 47) + '...' : p.statement,
    status: p.status,
    confidence: p.confidence,
    resolved: false
  }))

  const resolved = resolvedPredictions.value.map((p) => ({
    slug: `prediction-${p.id}`,
    text: p.statement.length > 50 ? p.statement.slice(0, 47) + '...' : p.statement,
    status: p.status,
    confidence: p.confidence,
    resolved: true
  }))

  return [...active, ...resolved]
})

onMounted(() => {
  if (import.meta.client) {
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

watch([activePredictions, resolvedPredictions], async () => {
  await nextTick()
  if (import.meta.client) {
    tocTarget.value = document.querySelector('#nav-toc-container')
  }
})

// Kalshi helpers
const getMarketTitle = (ticker) => {
  if (!kalshiData.value?.marketDetails?.[ticker]) {
    return ticker
  }
  return kalshiData.value.marketDetails[ticker].title || ticker
}

const getMarketPrice = (ticker) => {
  if (!kalshiData.value?.marketDetails?.[ticker]) {
    return '—'
  }
  const market = kalshiData.value.marketDetails[ticker]
  const price = market.last_price || market.yes_bid || 0
  return `${(price * 100).toFixed(0)}¢`
}

const getCommentary = (ticker) => {
  return kalshiData.value?.commentaries?.[ticker]
}

const formatTime = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString()
}
</script>
