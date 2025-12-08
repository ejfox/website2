<template>
  <main class="container-main pt-8">
    <!-- Error State -->
    <div
      v-if="predictionsError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <header v-else class="section-spacing-lg">
      <h1 class="heading-1 mb-4">Predictions</h1>

      <div class="label-xs">
        <div>
          <span class="text-primary mono-lg tabular">
            {{ transformedPredictions?.length || 0 }}
          </span>
          total ·
          <span class="text-success mono-lg tabular">{{ correctCount }}</span>
          correct ·
          <span class="text-error mono-lg tabular">{{ incorrectCount }}</span>
          incorrect ·
          <span class="text-primary mono-lg tabular">{{ pendingCount }}</span>
          pending
        </div>
        <div class="text-muted">
          {{ lastUpdated ? `Updated ${lastUpdated}` : 'Updating live' }} ·
          sources: git + SHA-256 hashes
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

    <!-- Predictions List -->
    <section v-else>
      <!-- ACTIVE Predictions -->
      <div v-if="activePredictions.length > 0" class="section-spacing">
        <h2 class="heading-2 mb-4">Active</h2>
        <div class="grid-predictions">
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
        <h2 class="heading-2 mb-4">Resolved</h2>
        <div class="grid-predictions">
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
    <div
      v-if="kalshiData?.positions && kalshiData.positions.length > 0"
      class="section-spacing"
    >
      <h2 class="heading-3 mb-4">Market Positions</h2>

      <!-- Portfolio Performance Stats -->
      <div
        v-if="kalshiData?.portfolioStats"
        class="section-spacing-sm grid-2col-lg"
      >
        <div>
          <div class="stat-label">Open P&L</div>
          <div
            v-if="kalshiData.portfolioStats.totalUnrealizedPnL >= 0"
            class="mono-2xl text-success"
          >
            +${{ kalshiData.portfolioStats.totalUnrealizedPnL.toFixed(2) }}
          </div>
          <div v-else class="mono-2xl text-error">
            ${{ kalshiData.portfolioStats.totalUnrealizedPnL.toFixed(2) }}
          </div>
          <div class="stat-details">
            {{
              (
                (kalshiData.portfolioStats.totalUnrealizedPnL /
                  kalshiData.portfolioStats.totalInvested) *
                100
              ).toFixed(1)
            }}%
          </div>
        </div>

        <div>
          <div class="stat-label">Closed P&L</div>
          <div
            v-if="kalshiData.portfolioStats.totalRealizedPnL >= 0"
            class="mono-2xl text-success"
          >
            +${{ kalshiData.portfolioStats.totalRealizedPnL.toFixed(2) }}
          </div>
          <div v-else class="mono-2xl text-error">
            ${{ kalshiData.portfolioStats.totalRealizedPnL.toFixed(2) }}
          </div>
          <div class="stat-details">
            {{ kalshiData.portfolioStats.closedPositions.length }} positions
          </div>
        </div>

        <div>
          <div class="stat-label">Total P&L</div>
          <div
            v-if="
              kalshiData.portfolioStats.totalUnrealizedPnL +
                kalshiData.portfolioStats.totalRealizedPnL >=
              0
            "
            class="mono-2xl text-success"
          >
            +${{
              (
                kalshiData.portfolioStats.totalUnrealizedPnL +
                kalshiData.portfolioStats.totalRealizedPnL
              ).toFixed(2)
            }}
          </div>
          <div v-else class="mono-2xl text-error">
            ${{
              (
                kalshiData.portfolioStats.totalUnrealizedPnL +
                kalshiData.portfolioStats.totalRealizedPnL
              ).toFixed(2)
            }}
          </div>
          <div class="stat-details">all time</div>
        </div>

        <div>
          <div class="stat-label">Portfolio Value</div>
          <div class="mono-2xl text-primary">
            ${{ kalshiData.portfolioStats.totalValue.toFixed(2) }}
          </div>
          <div class="stat-details">{{ kalshiData.positions.length }} open</div>
        </div>
      </div>

      <div class="grid-predictions">
        <article
          v-for="position in kalshiData.positions"
          :id="`kalshi-${position.ticker}`"
          :key="position.ticker"
          class="card-padding"
        >
          <!-- Title + Side -->
          <div class="mb-2">
            <div class="flex-gap-3">
              <span
                :class="
                  position.position > 0 ? 'badge-side-yes' : 'badge-side-no'
                "
              >
                {{ position.position > 0 ? 'YES' : 'NO' }}
              </span>
              <div class="text-body-lg text-balance">
                {{ getMarketTitle(position.ticker) }}
              </div>
            </div>
          </div>

          <!-- Dense data table -->
          <table class="table-dense mb-2">
            <tbody>
              <tr>
                <td class="py-0.5">Position</td>
                <td class="table-cell-value">
                  {{
                    Math.abs(position.position) > 0
                      ? `${Math.abs(position.position)} × $${
                          (
                            position.market_exposure_dollars /
                            Math.abs(position.position)
                          ).toFixed(2)
                        }`
                      : `${Math.abs(position.position)} (closed)`
                  }}
                </td>
              </tr>
              <tr>
                <td class="py-0.5">Exposure</td>
                <td class="table-cell-primary">
                  ${{ Number(position.market_exposure_dollars).toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(position.fees_paid_dollars) > 0">
                <td class="py-0.5">Fees</td>
                <td class="text-right tabular">
                  -${{ Number(position.fees_paid_dollars).toFixed(2) }}
                </td>
              </tr>
              <tr v-if="Number(position.realized_pnl_dollars) !== 0">
                <td class="py-0.5">Realized P&L</td>
                <td
                  class="table-cell-value"
                  :class="
                    Number(position.realized_pnl_dollars) >= 0
                      ? 'text-success'
                      : 'text-error'
                  "
                >
                  {{ Number(position.realized_pnl_dollars) >= 0 ? '+' : '' }}${{
                    Number(position.realized_pnl_dollars).toFixed(2)
                  }}
                </td>
              </tr>
              <tr>
                <td class="py-0.5">Total Traded</td>
                <td class="text-right tabular">
                  ${{ Number(position.total_traded_dollars).toFixed(2) }}
                </td>
              </tr>
              <tr v-if="getCommentary(position.ticker)?.tags?.length">
                <td class="py-0.5">Tags</td>
                <td class="text-right">
                  <span
                    v-for="tag in getCommentary(position.ticker)?.tags"
                    :key="tag"
                    class="mr-1"
                  >
                    #{{ tag }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Commentary -->
          <div
            v-if="parsedCommentaries[position.ticker]"
            class="text-sm text-muted leading-relaxed prose prose-sm prose-zinc dark:prose-invert max-w-none"
            v-html="parsedCommentaries[position.ticker]"
          />
        </article>
      </div>

      <!-- Fills Table -->
      <div v-if="kalshiData?.fills && kalshiData.fills.length > 0" class="mt-8">
        <h3 class="heading-3 mb-4">Recent Fills</h3>
        <div class="overflow-x-auto -mx-4 px-4">
          <div class="min-w-[450px]">
            <table class="table-header">
              <thead>
                <tr>
                  <th class="table-th">Time</th>
                  <th class="table-th">Market</th>
                  <th class="table-th-right">Side</th>
                  <th class="table-th-right">Qty</th>
                  <th class="table-th-right">Price</th>
                </tr>
              </thead>
              <tbody class="text-muted">
                <tr
                  v-for="fill in kalshiData.fills.slice(0, 10)"
                  :key="fill.fill_id"
                >
                  <td class="table-cell tabular">
                    {{ formatRelativeTime(fill.created_time) }}
                  </td>
                  <td class="table-cell">{{ fill.ticker }}</td>
                  <td
                    class="table-cell-value mono-lg"
                    :class="fill.side === 'yes' ? 'text-success' : 'text-error'"
                  >
                    {{ fill.side.toUpperCase() }}
                  </td>
                  <td class="table-cell text-right tabular">
                    {{ fill.count }}
                  </td>
                  <td class="table-cell text-right tabular">
                    {{ (fill.price * 100).toFixed(0) }}¢
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <section v-if="transformedPredictions.length > 0" class="mt-12">
      <h2 class="heading-2 mb-4">Statistics</h2>

      <!-- Summary stats -->
      <div class="label-xs section-spacing-sm stack-1">
        <div>
          <span class="text-primary mono-lg tabular">
            {{ transformedPredictions.length }}
          </span>
          predictions ·
          <span class="text-primary mono-lg tabular">{{ resolvedCount }}</span>
          resolved ·
          <span class="text-primary mono-lg tabular">{{ pendingCount }}</span>
          pending
        </div>
        <div v-if="correctCount + incorrectCount > 0">
          Accuracy
          <span class="text-primary font-mono text-xl font-bold tabular">
            {{ accuracyRate }}%
          </span>
          · Avg confidence
          <span class="text-primary font-mono text-xl font-bold tabular">
            {{ avgConfidence }}%
          </span>
        </div>
      </div>

      <!-- Calibration Analysis -->
      <div v-if="correctCount + incorrectCount > 0" class="mb-6">
        <h3 class="calibration-header">Calibration</h3>

        <!-- Confidence breakdown -->
        <table
          v-if="correctCount + incorrectCount > 1"
          class="w-full border-collapse mb-6 font-mono text-xs"
        >
          <thead>
            <tr>
              <th class="table-th">Analysis</th>
              <th class="table-th-right">Avg</th>
              <th class="table-th-right">n</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr v-if="correctCount > 0">
              <td class="py-1">Correct</td>
              <td class="confidence-cell success">
                {{ correctConfidenceAvg }}%
              </td>
              <td class="text-right">{{ correctCount }}</td>
            </tr>
            <tr v-if="incorrectCount > 0">
              <td class="py-1">Incorrect</td>
              <td class="confidence-cell error">
                {{ incorrectConfidenceAvg }}%
              </td>
              <td class="text-right">{{ incorrectCount }}</td>
            </tr>
            <tr v-if="correctCount > 0 && incorrectCount > 0">
              <td class="py-1">Differential</td>
              <td
                class="text-right font-bold text-2xl tabular-nums"
                :class="
                  correctConfidenceAvg > incorrectConfidenceAvg
                    ? 'text-success'
                    : 'text-error'
                "
              >
                {{ correctConfidenceAvg > incorrectConfidenceAvg ? '+' : ''
                }}{{ correctConfidenceAvg - incorrectConfidenceAvg }}%
              </td>
              <td class="text-right">
                {{
                  correctConfidenceAvg > incorrectConfidenceAvg ? 'good' : 'bad'
                }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Calibration by range -->
        <table
          v-if="calibrationData.length > 0"
          class="w-full border-collapse mb-6 font-mono text-xs"
        >
          <thead>
            <tr>
              <th class="table-th-left">Range</th>
              <th class="table-th-right">Accuracy</th>
              <th class="table-th-right">n</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr v-for="range in calibrationData" :key="range.label">
              <td class="py-1">{{ range.label }}</td>
              <td class="accuracy-cell">{{ range.accuracy }}%</td>
              <td class="text-right">{{ range.total }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Resolutions by year -->
        <table
          v-if="resolutionsByYear.length > 0"
          class="w-full border-collapse mb-6 font-mono text-xs"
        >
          <thead>
            <tr>
              <th class="table-th-left">Year</th>
              <th class="table-th-right">Accuracy</th>
              <th class="table-th-right">n</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr v-for="yearData in resolutionsByYear" :key="yearData.year">
              <td class="py-1">{{ yearData.year }}</td>
              <td class="accuracy-cell">{{ yearData.accuracy }}%</td>
              <td class="text-right">{{ yearData.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Meta-Analysis (Gwern Mode) -->
    <section
      v-if="calibration && calibration.summary.resolved > 0"
      class="mt-12"
    >
      <h2 class="heading-2 mb-4">Meta-Analysis</h2>

      <!-- Brier Score -->
      <div v-if="calibration.brier_score !== null" class="mb-6">
        <div class="calibration-label mb-2">Brier Score</div>
        <div class="flex items-baseline gap-2">
          <span
            v-if="calibration.brier_score < 0.2"
            class="mono-4xl text-success"
          >
            {{ calibration.brier_score.toFixed(3) }}
          </span>
          <span
            v-else-if="calibration.brier_score < 0.25"
            class="mono-4xl text-primary"
          >
            {{ calibration.brier_score.toFixed(3) }}
          </span>
          <span v-else class="mono-4xl text-error">
            {{ calibration.brier_score.toFixed(3) }}
          </span>
          <span class="calibration-label">
            {{
              calibration.brier_score < 0.2
                ? '(excellent)'
                : calibration.brier_score < 0.25
                  ? '(good)'
                  : '(needs work)'
            }}
          </span>
        </div>
        <div class="calibration-label mt-2">
          0 = perfect · 1 = worst · &lt;0.25 = good
        </div>
      </div>

      <!-- Calibration Buckets -->
      <div
        v-if="calibration.calibration && calibration.calibration.length > 0"
        class="mb-6"
      >
        <h3 class="calibration-header">Calibration Curve</h3>
        <table class="calibration-table">
          <thead>
            <tr>
              <th class="table-th">Confidence</th>
              <th class="table-th-right">Expected</th>
              <th class="table-th-right">Actual</th>
              <th class="table-th-right">Δ</th>
              <th class="table-th-right">n</th>
            </tr>
          </thead>
          <tbody class="table-muted-body">
            <tr v-for="bucket in calibration.calibration" :key="bucket.label">
              <td class="py-1">{{ bucket.label }}</td>
              <td class="py-1 text-right tabular-nums">
                {{ bucket.expected }}%
              </td>
              <td
                class="calibration-table-value"
                :class="deltaClass(bucket.delta)"
              >
                {{ bucket.accuracy }}%
              </td>
              <td
                class="delta-cell"
                :class="bucket.delta >= 0 ? 'text-success' : 'text-error'"
              >
                {{ bucket.delta >= 0 ? '+' : '' }}{{ bucket.delta }}pp
              </td>
              <td class="py-1 text-right tabular-nums">{{ bucket.count }}</td>
            </tr>
          </tbody>
        </table>
        <div class="calibration-label mt-2">
          Well-calibrated means actual ≈ expected (Δ near 0)
        </div>
      </div>

      <!-- Category Performance -->
      <div
        v-if="calibration.by_category && calibration.by_category.length > 0"
        class="mb-6"
      >
        <h3 class="calibration-header">By Category</h3>
        <table class="calibration-table">
          <thead>
            <tr>
              <th class="table-th">Category</th>
              <th class="table-th-right">Accuracy</th>
              <th class="table-th-right">Correct</th>
              <th class="table-th-right">Total</th>
            </tr>
          </thead>
          <tbody class="table-muted-body">
            <tr v-for="cat in calibration.by_category" :key="cat.category">
              <td class="py-1">{{ cat.category }}</td>
              <td
                class="calibration-table-value"
                :class="accuracyClass(cat.accuracy)"
              >
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
        <h3 class="calibration-header">Update Patterns</h3>
        <div class="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <div class="section-label-transition">Predictions Updated</div>
            <div class="calibration-value">
              {{ calibration.update_analysis.predictionsWithUpdates }}
            </div>
          </div>
          <div>
            <div class="section-label-transition">Total Updates</div>
            <div class="calibration-value">
              {{ calibration.update_analysis.totalUpdates }}
            </div>
          </div>
          <div>
            <div class="section-label-transition">Avg Updates/Prediction</div>
            <div class="calibration-value">
              {{ calibration.update_analysis.avgUpdatesPerPrediction }}
            </div>
          </div>
          <div>
            <div class="section-label-transition">Avg Confidence Δ</div>
            <div
              class="value-transition"
              :class="
                positiveNegativeClass(
                  calibration.update_analysis.avgConfidenceChange
                )
              "
            >
              {{
                calibration.update_analysis.avgConfidenceChange >= 0 ? '+' : ''
              }}{{ calibration.update_analysis.avgConfidenceChange }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Market Comparison -->
      <div v-if="calibration.market_comparison" class="mb-6">
        <h3 class="calibration-header">vs Market Baseline</h3>
        <div class="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <div class="section-label-transition">
              Disagreements (&gt;10% diff)
            </div>
            <div class="calibration-value">
              {{ calibration.market_comparison.disagreements }} /
              {{ calibration.market_comparison.total }}
            </div>
          </div>
          <div>
            <div class="section-label-transition">Accuracy When Disagreed</div>
            <div
              class="value-transition"
              :class="
                accuracyClass(
                  calibration.market_comparison.accuracyWhenDisagreed
                )
              "
            >
              {{ calibration.market_comparison.accuracyWhenDisagreed }}%
            </div>
          </div>
        </div>
        <div class="calibration-label mt-2">
          {{
            calibration.market_comparison.accuracyWhenDisagreed >= 50
              ? 'Beating the market when you disagree'
              : 'Market outperforming when you disagree'
          }}
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="calibration-label">
        <div class="mb-2">
          Analysis based on
          <span class="text-zinc-900 dark:text-zinc-100 font-bold">
            {{ calibration.summary.resolved }}
          </span>
          resolved predictions
        </div>
        <div v-if="calibration.generated_at" class="generated-at">
          Generated {{ new Date(calibration.generated_at).toLocaleString() }}
        </div>
      </div>
    </section>

    <!-- Version Control -->
    <section class="mt-12">
      <h2 class="heading-2 mb-4">Version Control</h2>
      <div class="version-info">
        <div>Markdown + SHA-256 + Git timestamps</div>
        <div>github.com/ejfox/website2/content/predictions/</div>
      </div>
      <a :href="commitHistoryUrl" target="_blank" class="link-subtle">
        View commit history →
      </a>
    </section>
  </main>

  <!-- Desktop TOC -->
  <ClientOnly>
    <teleport
      v-if="tocTarget && predictionToc.length > 0"
      to="#nav-toc-container"
    >
      <div
        ref="tocContainer"
        class="toc w-48 font-mono overflow-y-auto"
        :style="{ maxHeight: `${tocMaxHeight}px` }"
      >
        <div class="pt-8 pb-4 space-y-6">
          <!-- Section for each type -->
          <div v-for="section in predictionToc" :key="section.type">
            <!-- Section header -->
            <div class="toc-section-label">
              <span v-if="section.type === 'kalshi'">
                Markets ({{ section.items.length }})
              </span>
              <span v-else-if="section.type === 'active'">
                Active ({{ section.items.length }})
              </span>
              <span v-else-if="section.type === 'resolved'">
                Resolved ({{ section.items.length }})
              </span>
            </div>

            <ul class="space-y-2 text-xs">
              <!-- Kalshi items -->
              <template v-if="section.type === 'kalshi'">
                <li
                  v-for="item in section.items"
                  :key="item.slug"
                  class="group relative"
                >
                  <a
                    :href="`#${item.slug}`"
                    class="block no-underline"
                    :class="[
                      activeSection === item.slug
                        ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400',
                    ]"
                  >
                    <div class="flex items-start gap-2">
                      <span
                        class="shrink-0 font-bold"
                        :class="
                          item.side === 'YES' ? 'text-success' : 'text-error'
                        "
                      >
                        {{ item.side }}
                      </span>
                      <span class="block line-clamp-2 flex-1 min-w-0">
                        {{ item.text }}
                      </span>
                    </div>
                  </a>
                </li>
              </template>

              <!-- Prediction items -->
              <template v-else>
                <li
                  v-for="item in section.items"
                  :key="item.slug"
                  class="group relative"
                >
                  <a
                    :href="`#${item.slug}`"
                    class="block no-underline"
                    :class="[
                      activeSection === item.slug
                        ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400',
                    ]"
                    :style="{ opacity: 0.7 + (item.confidence / 100) * 0.3 }"
                  >
                    <div class="flex items-start gap-2">
                      <span class="text-zinc-500 dark:text-zinc-500 shrink-0">
                        {{ item.confidence }}%
                      </span>
                      <span class="block line-clamp-2 flex-1 min-w-0">
                        {{ item.text }}
                      </span>
                      <span
                        v-if="
                          item.status === 'correct' ||
                          item.status === 'incorrect'
                        "
                        class="shrink-0"
                        :class="
                          item.status === 'correct'
                            ? 'text-success'
                            : 'text-error'
                        "
                      >
                        {{ item.status === 'correct' ? '✓' : '✗' }}
                      </span>
                    </div>
                  </a>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </div>
    </teleport>
  </ClientOnly>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import PredictionCard from '~/components/predictions/PredictionCard.vue'

const commitHistoryUrl =
  'https://github.com/ejfox/website2/commits/main/content/predictions/'

const { formatRelativeTime } = useDateFormat()
const { markdownToHtml } = useMarkdown()

// Dynamic TOC height calculation using VueUse
const { height: windowHeight } = useWindowSize()
const tocContainer = ref(null)

// Calculate available height: viewport - nav header - padding
const tocMaxHeight = computed(() => {
  // Reserve space for: branding (80px) + nav links (200px) + padding (64px)
  return Math.max(300, windowHeight.value - 344)
})

const { data: predictions, error: predictionsError } =
  await useFetch('/api/predictions')
const { data: kalshiData } = useKalshi()
const { data: calibration } = useCalibration()

const totalPredictions = computed(
  () => predictions.value?.filter((p) => p.visibility === 'public').length || 0
)

const predictionsSchema = computed(() => {
  const items =
    predictions.value
      ?.filter((p) => p.visibility === 'public')
      .slice(0, 20)
      .map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://ejfox.com/predictions/${p.slug}`,
        name: p.statement,
      })) || []

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Predictions',
    numberOfItems: totalPredictions.value,
    itemListElement: items,
  }
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(predictionsSchema.value),
    },
  ],
}))

// Transform and filter predictions
const transformedPredictions = computed(
  () =>
    predictions.value
      ?.filter((p) => p.visibility === 'public')
      .map((p) => ({
        ...p,
        title: p.statement,
        status: p.status || (p.resolved ? 'resolved' : 'pending'),
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
    .sort(
      (a, b) =>
        new Date(b.resolved_date || b.created || 0) -
        new Date(a.resolved_date || a.created || 0)
    )
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

const lastUpdated = computed(() => {
  const dates = []
  transformedPredictions.value.forEach((p) => {
    if (p.created) dates.push(new Date(p.created).getTime())
    if (p.updates && p.updates.length > 0) {
      const last = p.updates[p.updates.length - 1]?.timestamp
      if (last) dates.push(new Date(last).getTime())
    }
  })
  if (!dates.length) return ''
  const max = Math.max(...dates)
  return new Date(max).toISOString().split('T')[0]
})

usePageSeo({
  title: 'Predictions · EJ Fox',
  description:
    'Public, timestamped predictions with SHA-256 hashes plus performance and calibration tracking.',
  type: 'article',
  section: 'Forecasting',
  tags: ['Predictions', 'Forecasting', 'Calibration', 'Probability'],
  label1: 'Public predictions',
  data1: computed(() => `${totalPredictions.value} total`),
  label2: 'Resolved so far',
  data2: computed(() => `${resolvedCount.value} resolved`),
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

// Status class helpers
const _unrealizedPnLClass = computed(() =>
  kalshiData.value?.portfolioStats?.totalUnrealizedPnL >= 0
    ? 'text-success'
    : 'text-error'
)

const _realizedPnLClass = computed(() =>
  kalshiData.value?.portfolioStats?.totalRealizedPnL >= 0
    ? 'text-success'
    : 'text-error'
)

const _totalPnLClass = computed(() => {
  if (!kalshiData.value?.portfolioStats) return ''
  const total =
    kalshiData.value.portfolioStats.totalUnrealizedPnL +
    kalshiData.value.portfolioStats.totalRealizedPnL
  return total >= 0 ? 'text-success' : 'text-error'
})

// Calibration class helpers
const _brierScoreClass = (score) => {
  if (score < 0.2) return 'text-success'
  if (score < 0.25) return 'text-primary'
  return 'text-error'
}

const deltaClass = (delta) => {
  const abs = Math.abs(delta)
  if (abs <= 5) return 'text-success'
  if (abs <= 10) return 'text-primary'
  return 'text-error'
}

const accuracyClass = (accuracy) => {
  if (accuracy >= 70) return 'text-success'
  if (accuracy >= 50) return 'text-primary'
  return 'text-error'
}

const positiveNegativeClass = (value) =>
  value >= 0 ? 'text-success' : 'text-error'

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
        : 0,
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
    { min: 0, max: 49, label: '0-49%' },
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
        total: predictions.length,
      }
    })
    .filter((range) => range.count > 0)
})

// TOC functionality
const activeSection = ref('')
const { tocTarget } = useTOC()

const predictionToc = computed(() => {
  const sections = []

  // Kalshi positions section
  if (kalshiData.value?.positions && kalshiData.value.positions.length > 0) {
    const kalshiItems = kalshiData.value.positions.map((pos) => ({
      slug: `kalshi-${pos.ticker}`,
      text: getMarketTitle(pos.ticker),
      type: 'kalshi',
      side: pos.position > 0 ? 'YES' : 'NO',
      ticker: pos.ticker,
    }))
    sections.push({ type: 'kalshi', items: kalshiItems })
  }

  // Active predictions section
  if (activePredictions.value.length > 0) {
    const active = activePredictions.value.map((p) => ({
      slug: `prediction-${p.id}`,
      text:
        p.statement.length > 50
          ? p.statement.slice(0, 47) + '...'
          : p.statement,
      status: p.status,
      confidence: p.confidence,
      type: 'prediction',
      resolved: false,
    }))
    sections.push({ type: 'active', items: active })
  }

  // Resolved predictions section
  if (resolvedPredictions.value.length > 0) {
    const resolved = resolvedPredictions.value.map((p) => ({
      slug: `prediction-${p.id}`,
      text:
        p.statement.length > 50
          ? p.statement.slice(0, 47) + '...'
          : p.statement,
      status: p.status,
      confidence: p.confidence,
      type: 'prediction',
      resolved: true,
    }))
    sections.push({ type: 'resolved', items: resolved })
  }

  return sections
})

onMounted(() => {
  if (import.meta.client) {
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

// Parsed commentary cache
const parsedCommentaries = ref({})

// Watch kalshiData and parse commentaries when they load
watch(
  () => kalshiData.value?.commentaries,
  async (commentaries) => {
    if (!commentaries) return

    const parsed = {}
    for (const [ticker, commentary] of Object.entries(commentaries)) {
      if (commentary?.commentary) {
        parsed[ticker] = await markdownToHtml(commentary.commentary)
      }
    }
    parsedCommentaries.value = parsed
  },
  { immediate: true }
)

// Kalshi helpers
const getMarketTitle = (ticker) => {
  // Try commentary title first (user-provided, most accurate)
  if (kalshiData.value?.commentaries?.[ticker]?.marketTitle) {
    return kalshiData.value.commentaries[ticker].marketTitle
  }

  // Try API market details (official Kalshi title)
  if (kalshiData.value?.marketDetails?.[ticker]?.title) {
    return kalshiData.value.marketDetails[ticker].title
  }

  // Fall back to ticker if no data available (resolved/closed markets)
  return ticker
}

const _getMarketPrice = (ticker) => {
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
</script>

<style scoped>
.confidence-cell {
  @apply text-right font-bold text-2xl tabular-nums;
}

.confidence-cell.success {
  @apply text-green-600 dark:text-green-500;
}

.confidence-cell.error {
  @apply text-red-600 dark:text-red-500;
}

.accuracy-cell {
  @apply text-right text-zinc-900 dark:text-zinc-100;
  @apply font-bold text-2xl tabular-nums;
}

.delta-cell {
  @apply py-1 text-right tabular-nums font-bold;
}

.table-th-left {
  @apply text-left pb-2 text-zinc-900 dark:text-zinc-100 font-normal;
}

.table-th-right {
  @apply text-right pb-2 text-zinc-900 dark:text-zinc-100 font-normal;
}

.table-muted-body {
  @apply text-zinc-500 dark:text-zinc-500;
}

.section-label-transition {
  @apply text-zinc-500 dark:text-zinc-500 mb-2;
}

.value-transition {
  @apply font-bold text-2xl tabular-nums;
}

.calibration-table {
  @apply w-full border-collapse font-mono text-xs;
  @apply tracking-normal dark:tracking-wide;
}

.generated-at {
  @apply text-zinc-400 dark:text-zinc-600;
}

.version-info {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-500 space-y-1 mb-4;
}

.toc-section-label {
  @apply text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-2;
}
</style>
