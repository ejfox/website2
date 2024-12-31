<template>
  <div class="max-w-6xl mx-auto px-4 py-12 uppercase">
    <!-- Error States -->
    <div v-if="Object.keys(errors).length && showErrors"
      class="mb-8 p-4 bg-gray-50/5 rounded-lg border border-gray-500/10">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-400">Data Source Status</h3>
        <button @click="showErrors = false" class="text-gray-400 hover:text-gray-300">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>
      <div class="space-y-1">
        <div v-for="(error, service) in errors" :key="service"
          class="text-gray-400/75 text-sm capitalize flex items-center space-x-2">
          <UIcon :name="error ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'" class="w-4 h-4"
            :class="error ? 'text-gray-500' : 'text-green-500'" />
          <span>{{ service }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasStaleData" class="mb-8 p-4 bg-gray-50/5 rounded-lg border border-gray-500/10">
      <div class="flex items-center space-x-2 text-gray-400/75">
        <UIcon name="i-heroicons-clock" class="w-4 h-4" />
        <span class="text-sm">Using cached data</span>
      </div>
    </div>

    <div class="space-y-32">
      <!-- All-time Stats Section -->
      <section class="space-y-16">
        <h2 class="text-sm tracking-wider text-gray-500">STATS</h2>

        <!-- Primary Metrics -->
        <section v-if="hasMonkeyTypeData || hasGithubData || hasPhotoData || blogStats || hasLeetCodeData"
          class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <IndividualStat v-if="hasMonkeyTypeData" :value="bestWPM" size="large" label="BEST WPM"
            :details="`${formatNumber(stats?.monkeyType?.typingStats?.testsCompleted || 0)} TESTS · ${stats?.monkeyType?.typingStats?.bestAccuracy?.toFixed(1) || 0}% ACC · ${stats?.monkeyType?.typingStats?.bestConsistency?.toFixed(1) || 0}% CON`" />

          <IndividualStat v-if="hasGithubData" :value="stats?.github?.totalContributions || 0" size="large"
            label="CONTRIBUTIONS"
            :details="`${formatNumber(stats?.github?.stats?.totalPRs || 0)} PULL REQUESTS · ${formatNumber(stats?.github?.currentStreak || 0)} DAY STREAK`" />

          <ClientOnly>
            <IndividualStat v-if="hasPhotoData" :value="currentYearPhotos" size="large" label="PHOTOGRAPHS"
              :details="currentYear.toString()" />
          </ClientOnly>

          <IndividualStat v-if="blogStats" :value="blogStats.totalWords" size="large" label="WORDS WRITTEN"
            :details="`${formatNumber(blogStats.totalPosts)} POSTS · ${formatNumber(blogStats.averageWords)} AVG`" />

          <IndividualStat v-if="hasLeetCodeData" :value="totalLeetCodeSolved" size="large" label="LEETCODE PROBLEMS"
            :details="`${stats?.leetcode?.submissionStats?.easy?.count || 0} EASY · ${stats?.leetcode?.submissionStats?.medium?.count || 0} MEDIUM · ${stats?.leetcode?.submissionStats?.hard?.count || 0} HARD`" />
        </section>


        <!-- Code Stats Section -->
        <section v-if="hasGithubData" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12 space-y-8">
            <div class="flex justify-between items-baseline">
              <h4 class="text-sm tracking-wider text-gray-500">CONTRIBUTION PATTERNS</h4>
              <p class="text-xs text-gray-400 tracking-wider">{{ new Date().getFullYear() }}</p>
            </div>
            <div class="h-[160px]">
              <HeatMap :data="githubHeatmapData" :showFullYear="true" :showLegend="true" :legendLabels="{
                start: '0',
                end: formatNumber(Math.max(...(stats?.github?.contributions || [0])))
              }" />
            </div>
            <p class="text-xs text-gray-400 tracking-wider text-center space-x-4">
              <span>PEAK: {{ formatNumber(Math.max(...((stats?.github?.contributions as any[]) || [0]))) }}</span>
              <span>·</span>
              <span>ACTIVE: {{ formatNumber((stats?.github?.contributions as any[])?.filter((c: number) => c > 0).length
                || 0) }} DAYS</span>
            </p>
          </div>
        </section>

        <!-- Our new GitHub Stats Section -->
        <section v-if="hasGithubData" class="mt-32 space-y-16 font-mono">
          <!-- Main Stats -->
          <div class="grid grid-cols-3 gap-12 text-center">
            <div>
              <div class="text-6xl font-light mb-2">{{ stats.github.stats.totalRepos }}</div>
              <div class="text-xs tracking-wider text-gray-500">REPOSITORIES</div>
            </div>
            <div>
              <div class="text-6xl font-light mb-2">{{ stats.github.stats.totalPRs }}</div>
              <div class="text-xs tracking-wider text-gray-500">PULL REQUESTS</div>
              <div class="text-[10px] mt-1 text-gray-600">{{ stats.github.stats.mergedPRs }} MERGED</div>
            </div>
            <div>
              <div class="text-6xl font-light mb-2">{{ stats.github.currentStreak }}</div>
              <div class="text-xs tracking-wider text-gray-500">DAY STREAK</div>
              <div class="text-[10px] mt-1 text-gray-600">{{ stats.github.longestStreak }} DAYS LONGEST</div>
            </div>
          </div>
        </section>


        <!-- LeetCode Section -->
        <section v-if="hasLeetCodeData" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12">
            <h4 class="text-sm tracking-wider text-gray-500 mb-12">LEETCODE PROGRESS</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              <IndividualStat :value="stats?.leetcode?.submissionStats?.easy?.count || 0" size="medium" label="EASY"
                :details="`${stats?.leetcode?.submissionStats?.easy?.submissions || 0} submissions`" />
              <IndividualStat :value="stats?.leetcode?.submissionStats?.medium?.count || 0" size="medium" label="MEDIUM"
                :details="`${stats?.leetcode?.submissionStats?.medium?.submissions || 0} submissions`" />
              <IndividualStat :value="stats?.leetcode?.submissionStats?.hard?.count || 0" size="medium" label="HARD"
                :details="`${stats?.leetcode?.submissionStats?.hard?.submissions || 0} submissions`" />
            </div>

            <div v-if="stats?.leetcode?.recentSubmissions?.length" class="mt-12">
              <h4 class="text-sm tracking-wider text-gray-500 mb-6">RECENT SUBMISSIONS</h4>
              <div class="space-y-2">
                <div v-for="submission in stats.leetcode.recentSubmissions.slice(0, 5)" :key="submission.titleSlug"
                  class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">{{ submission.title }}</span>
                  <div class="flex items-center space-x-4">
                    <span class="text-gray-500">{{ submission.lang }}</span>
                    <span :class="submission.statusDisplay === 'Accepted' ? 'text-green-500' : 'text-gray-500'">
                      {{ submission.statusDisplay }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Chess Stats Section -->
        <section v-if="hasChessData" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12">
            <h4 class="text-sm tracking-wider text-gray-500 mb-12">CHESS PROGRESS</h4>

            <!-- Main Chess Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              <IndividualStat :value="stats.chess.currentRating.rapid" size="medium" label="RAPID RATING"
                :details="`Peak: ${stats.chess.bestRating.rapid || 'N/A'}`" />
              <IndividualStat :value="stats.chess.currentRating.blitz" size="medium" label="BLITZ RATING"
                :details="`Peak: ${stats.chess.bestRating.blitz}`" />
              <IndividualStat :value="stats.chess.currentRating.bullet" size="medium" label="BULLET RATING"
                :details="`Peak: ${stats.chess.bestRating.bullet}`" />
            </div>

            <!-- Games Overview -->
            <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <div class="text-4xl font-light mb-2">{{ formatNumber(stats.chess.gamesPlayed.total) }}</div>
                <div class="text-xs tracking-wider text-gray-500">TOTAL GAMES</div>
              </div>
              <div>
                <div class="text-4xl font-light mb-2">{{ stats.chess.winRate.overall.toFixed(1) }}%</div>
                <div class="text-xs tracking-wider text-gray-500">WIN RATE</div>
              </div>
              <div>
                <div class="text-4xl font-light mb-2">{{ stats.chess.puzzleStats.rating }}</div>
                <div class="text-xs tracking-wider text-gray-500">PUZZLE RATING</div>
              </div>
              <div>
                <div class="text-4xl font-light mb-2">{{ formatNumber(stats.chess.puzzleStats.totalSolved) }}</div>
                <div class="text-xs tracking-wider text-gray-500">PUZZLES SOLVED</div>
              </div>
            </div>

            <!-- Recent Games -->
            <div v-if="stats.chess.recentGames?.length" class="mt-12">
              <h4 class="text-sm tracking-wider text-gray-500 mb-6">RECENT GAMES</h4>
              <div class="space-y-2">
                <div v-for="game in stats.chess.recentGames" :key="game.id"
                  class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">{{ game.opponent }}</span>
                  <div class="flex items-center space-x-4">
                    <span class="text-gray-500">{{ game.timeControl }}</span>
                    <span :class="{
                      'text-green-500': game.result === 'win',
                      'text-red-500': game.result === 'loss',
                      'text-gray-500': game.result === 'draw'
                    }">
                      {{ game.result.toUpperCase() }}
                      <span class="text-gray-600 text-xs ml-1">
                        {{ game.ratingDiff > 0 ? '+' : '' }}{{ game.ratingDiff }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Blog Stats Section -->
        <section v-if="blogStats" class="space-y-12">
          <div class="">
            <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-4">WRITING ACTIVITY</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
              <IndividualStat :value="blogStats.totalPosts" size="medium" label="POSTS"
                :details="`First post: ${formatDate(blogStats.firstPost)}`" />

              <IndividualStat :value="blogStats.totalWords" size="medium" label="WORDS"
                :details="`${formatNumber(blogStats.averageWords)} words per post`" />
            </div>
          </div>
        </section>

        <!-- Words Per Year Section -->
        <section v-if="wordsPerYear && Object.keys(wordsPerYear).length" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12">
            <h4 class="text-sm tracking-wider text-gray-500 mb-12">WORDS BY YEAR</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div v-for="(words, year) in wordsPerYear" :key="year" class="flex flex-col items-center">
                <WaffleChart :data="words" :total="maxWordsByYear" />
                <div class="mt-4 text-center">
                  <div class="text-4xl font-condensed">{{ formatNumber(words) }}</div>
                  <div class="text-gray-500 text-sm">{{ year }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Repositories Per Month Section -->
        <section v-if="hasGithubData" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12">
            <h4 class="text-sm tracking-wider text-gray-500 mb-8">REPOSITORIES PER MONTH</h4>
            <div class="grid grid-cols-2 gap-x-12 gap-y-8">
              <div v-for="month in lastTwelveMonths" :key="month.key" class="space-y-2 border-t border-gray-800 pt-4">
                <div class="flex justify-between items-baseline">
                  <div class="text-sm text-gray-400">{{ month.label }}</div>
                  <div class="text-xs text-gray-500">{{ month.repos.length }} REPOS</div>
                </div>

                <ul v-if="month.repos.length" class="space-y-1.5">
                  <li v-for="repo in month.repos" :key="repo.name"
                    class="text-[10px] flex items-baseline justify-between">
                    <span class="text-gray-400 font-medium">{{ repo.name }}</span>
                    <span class="text-gray-600">{{ repo.language }}</span>
                  </li>
                </ul>
                <div v-else class="text-[10px] text-gray-600">NO NEW REPOSITORIES</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Photo Contributions Section -->
        <section v-if="hasPhotoData" class="mt-32 space-y-16">
          <ContributionHeatmap :data="photoContributions" title="PHOTO UPLOADS"
            :subtitle="`${currentYearPhotos} photos in ${currentYear}`" :showLegend="true" :colorScheme="heatmapColors"
            :legendLabels="{
              start: '0',
              end: `${maxContributions} per day`
            }" />

          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <IndividualStat :value="photoStats.photosThisMonth" label="THIS MONTH" size="small" />
            <IndividualStat :value="photoStats.averagePerMonth" label="AVG / MONTH" size="small" />
            <IndividualStat :value="stats.value?.photos?.currentStreak" label="DAY STREAK" size="small" />
            <IndividualStat :value="stats.value?.photos?.longestStreak" label="LONGEST STREAK" size="small" />
          </div>
        </section>

        <!-- Add this section where you want the health stats to appear -->
        <section v-if="hasHealthData" class="mt-32 space-y-12">
          <div class="border-t border-gray-500/20 pt-12">
            <h4 class="text-sm tracking-wider text-gray-500 mb-12">HEALTH METRICS</h4>

            <!-- Today's Stats -->
            <div class="space-y-16">
              <h5 class="text-sm tracking-wider text-gray-500">TODAY</h5>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                <IndividualStat :value="stats.health.today.steps" size="medium" label="STEPS"
                  :details="`${formatNumber(stats.health.averages.dailySteps)} daily average`" />
                <IndividualStat :value="stats.health.today.standHours" size="medium" label="STAND HOURS"
                  :details="`${formatNumber(stats.health.averages.dailyStandHours)} daily average`" />
                <IndividualStat :value="stats.health.today.exerciseMinutes" size="medium" label="EXERCISE MINUTES"
                  :details="`${formatNumber(stats.health.averages.dailyExerciseMinutes)} daily average`" />
                <IndividualStat :value="stats.health.today.calories" size="medium" label="ACTIVE CALORIES" />
              </div>

              <!-- This Week's Stats -->
              <h5 class="text-sm tracking-wider text-gray-500 mt-16">THIS WEEK</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                <IndividualStat :value="stats.health.thisWeek.steps" size="medium" label="WEEKLY STEPS"
                  :details="`${formatNumber(stats.health.thisYear.averageStepsPerDay)} daily average`" />
                <IndividualStat :value="stats.health.thisWeek.exerciseMinutes" size="medium" label="WEEKLY EXERCISE"
                  :details="`${formatNumber(stats.health.thisYear.averageExercisePerWeek)} minutes per week avg`" />
                <IndividualStat :value="stats.health.thisWeek.calories" size="medium" label="WEEKLY CALORIES" />
              </div>

              <!-- Monthly Activity -->
              <h5 class="text-sm tracking-wider text-gray-500 mt-16">THIS MONTH</h5>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                <IndividualStat :value="stats.health.activity.monthlySteps" size="medium" label="MONTHLY STEPS" />
                <IndividualStat :value="stats.health.activity.monthlyExerciseMinutes" size="medium"
                  label="MONTHLY EXERCISE" />
                <IndividualStat :value="stats.health.activity.monthlyDistance" size="medium" label="DISTANCE (KM)" />
                <IndividualStat :value="stats.health.activity.flightsClimbed" size="medium" label="FLIGHTS CLIMBED" />
              </div>

              <!-- Heart Rate Stats (if available) -->
              <template v-if="hasHeartRateData">
                <h5 class="text-sm tracking-wider text-gray-500 mt-16">HEART RATE</h5>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                  <IndividualStat :value="stats.health.heartRate.current" size="medium" label="CURRENT BPM" />
                  <IndividualStat :value="stats.health.heartRate.resting" size="medium" label="RESTING BPM" />
                  <IndividualStat :value="stats.health.heartRate.walking" size="medium" label="WALKING BPM" />
                  <IndividualStat :value="stats.health.heartRate.variability" size="medium" label="HRV" />
                </div>
              </template>
            </div>
          </div>
        </section>

      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import LineChart from '~/components/viz/LineChart.vue'
import HeatMap from '~/components/viz/HeatMap.vue'
import { computed, ref, onMounted, watch } from 'vue'
import { useStats } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import PeriodAnalysis from '~/components/stats/PeriodAnalysis.vue'
import IndividualStat from '~/components/stats/IndividualStat.vue'
import WaffleChart from '~/components/viz/WaffleChart.vue'
import * as d3 from 'd3'
import { useColorMode } from '@vueuse/core'

interface MonkeyTypeResponse {
  typingStats: {
    testsCompleted: number
    testsStarted: number
    bestWPM: number
    bestAccuracy: number
    bestConsistency: number
    timePercentile: number
    wordsPercentile: number
  }
  personalBests: {
    time: { [key: string]: any[] }
    words: { [key: string]: any[] }
  }
  speedHistogram: {
    time: { [key: string]: number }
    words: { [key: string]: number }
  }
  lastUpdated: string
}

interface StatsResponse {
  monkeyType?: {
    typingStats?: {
      bestWPM: number
      testsCompleted: number
      bestAccuracy: number
      bestConsistency: number
    }
  }
  github?: {
    contributions?: number[]
    totalContributions?: number
    currentStreak?: number
    prCount?: number
  }
  photos?: any[]
  typing?: any
  music?: any
  health?: any
  chess?: {
    currentRating: {
      bullet: number
      blitz: number
      rapid: number
    }
    bestRating: {
      bullet: number
      blitz: number
      rapid: number
    }
    gamesPlayed: {
      bullet: number
      blitz: number
      rapid: number
      total: number
    }
    winRate: {
      bullet: number
      blitz: number
      rapid: number
      overall: number
    }
    puzzleStats: {
      rating: number
      totalSolved: number
      bestRating: number
    }
    recentGames: Array<{
      id: string
      opponent: string
      timeControl: string
      result: 'win' | 'loss' | 'draw'
      timestamp: number
      rating: number
      ratingDiff: number
    }>
    lastUpdated: string
  }
  photography?: any
  leetcode?: {
    contestStats: {
      rating: number
      globalRanking: number
      totalParticipants: number
      topPercentage: number
    } | null
    submissionStats: {
      easy: { count: number, submissions: number }
      medium: { count: number, submissions: number }
      hard: { count: number, submissions: number }
    }
    recentSubmissions: Array<{
      title: string
      titleSlug: string
      timestamp: string
      statusDisplay: string
      lang: string
    }>
  }
}

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

interface Photo {
  id: string
  uploaded_at: string
  width: number
  height: number
}

interface Post {
  date?: string
  wordCount?: number
}

const { stats, isLoading, errors: statsErrors, hasStaleData: statsHasStaleData } = useStats()
const { getAllPosts } = useProcessedMarkdown()

const route = useRoute()
const router = useRouter()
const { copy } = useClipboard()

// Time period state
const today = computed(() => format(new Date(), 'yyyy-MM-dd'))
const selectedPeriod = ref('This Month')
const startDate = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
const endDate = ref(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

// URL handling
onMounted(() => {
  const { start, end, period } = route.query
  if (typeof start === 'string' && typeof end === 'string') {
    startDate.value = start
    endDate.value = end
    selectedPeriod.value = typeof period === 'string' ? period : 'Custom'
  }
})

// Update URL when dates change
watch([startDate, endDate, selectedPeriod], () => {
  router.push({
    query: {
      ...route.query,
      start: startDate.value,
      end: endDate.value,
      period: selectedPeriod.value
    }
  })
})

// Share functionality
const copyShareLink = async () => {
  await copy(window.location.href)
  // You might want to add a toast notification here
}

// Add this near the top of the script
const showErrors = ref(true)

// Update the data availability checks to be more graceful
const hasMonkeyTypeData = computed(() => {
  return !!(stats.value?.monkeyType?.typingStats?.bestWPM)
})

const hasGithubData = computed(() => {
  try {
    console.log('Checking GitHub Data:', {
      stats: stats.value?.github,
      hasStats: !!stats.value?.github?.stats,
      hasContributions: !!stats.value?.github?.contributions?.length,
      hasRepos: !!stats.value?.github?.repositories?.length,
      totalContributions: stats.value?.github?.totalContributions
    })

    return !!(
      stats.value?.github?.stats &&
      (stats.value?.github?.contributions?.length > 0 ||
        stats.value?.github?.repositories?.length > 0 ||
        stats.value?.github?.totalContributions > 0)
    )
  } catch (error) {
    console.error('Error checking GitHub data:', error)
    return false
  }
})

const hasPhotoData = computed(() => {
  return !!(stats.value?.photos?.stats?.totalPhotos)
})

const hasCodeData = computed(() => {
  return !!(stats.value?.github || stats.value?.code)
})

const hasMultipleDataSources = computed(() => {
  const availableSources = [
    hasMonkeyTypeData.value,
    hasGithubData.value,
    hasPhotoData.value
  ].filter(Boolean).length

  return availableSources >= 2
})

const availableHeaderMetrics = computed(() => {
  const metrics = []

  if (blogStats.value) {
    // metrics.push({
    //   label: 'Blog Posts',
    //   value: formatNumber(blogStats.value.totalPosts)
    // })
    // metrics.push({
    //   label: 'Total Words Written',
    //   value: formatNumber(blogStats.value.totalWords)
    // })
    // metrics.push({
    //   label: 'Avg Words per Post',
    //   value: formatNumber(blogStats.value.averageWords)
    // })
  }

  if (hasGithubData.value) {
    metrics.push({
      label: 'Total Contributions',
      value: formatNumber(stats.value.github.totalContributions)
    })
    metrics.push({
      label: 'Pull Requests',
      value: formatNumber(stats.value.github.prCount)
    })
    metrics.push({
      label: 'Current Streak',
      value: formatNumber(stats.value.github.currentStreak)
    })
  }

  if (hasPhotoData.value) {
    metrics.push({
      label: 'Photos',
      value: formatNumber(stats.value.photos.length)
    })
  }

  return metrics
})

const bestWPM = computed(() => {
  return Math.round(stats.value?.monkeyType?.typingStats?.bestWPM || 0)
})

const productivityPulse = computed(() => (stats.value as any)?.typing?.productivityPulse ?? 0)
const accuracy = computed(() => (stats.value as any)?.typing?.accuracy ?? 0)
const musicStreak = computed(() => (stats.value as any)?.music?.currentStreak ?? 0)
const sleepScore = computed(() => (stats.value as any)?.health?.sleepScore ?? 0)
const activeMinutes = computed(() => (stats.value as any)?.health?.activeMinutes ?? 0)
const chessRating = computed(() => (stats.value as any)?.chess?.currentRating ?? 0)
const peakRating = computed(() => (stats.value as any)?.chess?.peakRating ?? 0)
const codeStreak = computed(() => stats.value?.github?.currentStreak ?? 0)
const prCount = computed(() => (stats.value as any)?.code?.prCount ?? 0)

const topArtists = computed(() => {
  return []
})

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num ?? 0)
}

const photoHeatmapData = computed(() => {
  if (!stats.value?.photos?.length) return { values: [], details: [] }

  const days = Array(365).fill(0)
  const details = Array(365).fill([])
  const now = new Date()

  stats.value.photos.forEach((photo: Photo) => {
    const date = new Date(photo.uploaded_at)
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff >= 0 && daysDiff < 365) {
      days[daysDiff]++
      details[daysDiff] = [{
        name: photo.id.split('/').pop() || '',
        count: 1
      }]
    }
  })

  return {
    values: days,
    details
  }
})

const githubHeatmapData = computed(() => {
  if (!stats.value?.github?.contributions?.length) return { values: [], details: [] }

  const values = [...stats.value.github.contributions]
  while (values.length < 365) {
    values.unshift(0)
  }

  const details = Array(365).fill([]).map(() => [])

  return {
    values,
    details
  }
})

// Loading progress tracking
const loadingProgress = ref(0)
const loadingStatus = ref('Initializing...')

// Track loading progress
watch(isLoading, (loading) => {
  if (loading) {
    // Reset progress when loading starts
    loadingProgress.value = 0
    loadingStatus.value = 'Initializing...'

    // Simulate realistic loading progress
    const progressSteps = [
      { progress: 15, status: 'Fetching GitHub stats...' },
      { progress: 35, status: 'Loading photo data...' },
      { progress: 55, status: 'Processing code contributions...' },
      { progress: 75, status: 'Calculating metrics...' },
      { progress: 90, status: 'Preparing visualizations...' },
      { progress: 100, status: 'Almost there...' }
    ]

    let currentStep = 0
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length && isLoading.value) {
        const { progress, status } = progressSteps[currentStep]
        loadingProgress.value = progress
        loadingStatus.value = status
        currentStep++
      } else {
        clearInterval(progressInterval)
      }
    }, 400) // Adjust timing as needed

    // Cleanup
    watch(isLoading, () => {
      clearInterval(progressInterval)
    }, { immediate: true })
  }
})

// Fetch blog stats
const blogStats = ref<BlogStats | null>(null)
const wordsPerYear = ref<Record<string, number>>({})
onMounted(async () => {
  try {
    const posts = await getAllPosts(false, false) as Post[]
    if (!posts?.length) {
      blogStats.value = {
        totalPosts: 0,
        totalWords: 0,
        averageWords: 0,
        firstPost: null,
        lastPost: null
      }
      wordsPerYear.value = {}
      return
    }

    const yearCounts: Record<string, number> = {}
    posts.forEach((post: Post) => {
      if (!post?.date) return
      const year = getValidDate(post.date).getFullYear().toString()
      yearCounts[year] = (yearCounts[year] || 0) + (post.wordCount || 0)
    })

    wordsPerYear.value = Object.fromEntries(
      Object.entries(yearCounts).sort(([a], [b]) => Number(b) - Number(a))
    )

    blogStats.value = {
      totalPosts: posts.length,
      totalWords: posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0),
      averageWords: Math.round(posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0) / posts.length),
      firstPost: posts[posts.length - 1]?.date || null,
      lastPost: posts[0]?.date || null
    }
  } catch (error) {
    console.error('Error calculating blog stats:', error)
    blogStats.value = {
      totalPosts: 0,
      totalWords: 0,
      averageWords: 0,
      firstPost: null,
      lastPost: null
    }
    wordsPerYear.value = {}
  }
})

// Add this helper function
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'MMMM d, yyyy')
}

// Add helper function for date validation
const getValidDate = (dateString: string | null): Date => {
  if (!dateString) return new Date()
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? new Date() : date
}

// Add this to your script section to debug
watch(() => stats.value, (newStats) => {
  console.log('Stats structure:', newStats)
}, { immediate: true })

// Add this computed property
const maxWordsByYear = computed(() => {
  if (!wordsPerYear.value || !Object.keys(wordsPerYear.value).length) return 1000
  return Math.max(...Object.values(wordsPerYear.value))
})

// Add these computed properties
const hasLeetCodeData = computed(() => {
  console.log('LeetCode data:', stats.value?.leetcode)
  return !!stats.value?.leetcode?.submissionStats
})

const totalLeetCodeSolved = computed(() => {
  if (!stats.value?.leetcode?.submissionStats) return 0
  const { easy, medium, hard } = stats.value.leetcode.submissionStats
  return (easy?.count || 0) + (medium?.count || 0) + (hard?.count || 0)
})

// We assume stats is already populated by useStats()
const reposByMonthSvg = ref<SVGSVGElement | null>(null)

const reposByMonth = computed(() => {
  const repos = stats.value?.github?.repositories || []
  if (!repos.length) return []

  const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')
  const formatMonth = d3.timeFormat('%Y-%m')
  const map = new Map<string, number>()

  repos.forEach((repo: any) => {
    if (!repo.createdAt) return
    const date = parseTime(repo.createdAt)
    if (!date) return
    const key = formatMonth(date)
    map.set(key, (map.get(key) || 0) + 1)
  })

  const data: Array<{ month: string; count: number }> = []
  for (const [month, count] of map.entries()) {
    data.push({ month, count })
  }

  // Sort by chronological order
  data.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  return data
})

onMounted(() => {
  // Re-render whenever reposByMonth changes
  watch(
    reposByMonth,
    () => {
      if (!reposByMonthSvg.value) return
      renderReposByMonthChart()
    },
    { immediate: true }
  )
})



const activeReposCount = computed(() => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  return stats.value?.github?.repositories?.filter(repo => {
    return new Date(repo.updatedAt) > oneYearAgo
  }).length || 0
})

const totalContributions = computed(() =>
  stats.value?.github?.totalContributions || 0
)

const avgContributionsPerDay = computed(() => {
  const total = totalContributions.value
  return (total / 365).toFixed(1)
})

const longestStreak = computed(() =>
  stats.value?.github?.longestStreak || 0
)

const topLanguages = computed(() => {
  const langs = new Map()
  let total = 0

  stats.value?.github?.repositories?.forEach(repo => {
    if (repo.primaryLanguage) {
      const count = (langs.get(repo.primaryLanguage.name) || 0) + 1
      langs.set(repo.primaryLanguage.name, {
        count,
        color: repo.primaryLanguage.color
      })
      total++
    }
  })

  return Array.from(langs.entries())
    .map(([name, data]) => ({
      name,
      color: data.color,
      count: data.count,
      percentage: Math.round((data.count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const topStarredRepos = computed(() => {
  return [...(stats.value?.github?.repositories || [])]
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 5)
    .map(repo => ({
      name: repo.name,
      stars: repo.stars || 0
    }))
})

// Add these computed properties
const reposThisYear = computed(() => {
  const currentYear = new Date().getFullYear()
  return stats.value?.github?.repositories?.filter(repo => {
    return new Date(repo.createdAt).getFullYear() === currentYear
  }).length || 0
})

const avgReposPerMonth = computed(() => {
  if (!reposByMonth.value.length) return 0
  const total = stats.value?.github?.repositories?.length || 0
  return (total / reposByMonth.value.length).toFixed(1)
})

const mostProductiveMonth = computed(() => {
  if (!reposByMonth.value.length) return { count: 0, month: '' }
  const max = reposByMonth.value.reduce((max, curr) =>
    curr.count > max.count ? curr : max
    , reposByMonth.value[0])

  const date = d3.timeParse('%Y-%m')(max.month)
  return {
    count: max.count,
    month: date ? d3.timeFormat('%b %Y')(date) : ''
  }
})

const consecutiveMonths = computed(() => {
  if (!reposByMonth.value.length) return 0
  let maxStreak = 0
  let currentStreak = 0

  reposByMonth.value.forEach((month, i) => {
    if (month.count > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  return maxStreak
})

const mostActiveTime = computed(() => {
  // This is a placeholder - you might want to calculate this based on commit times
  // if available in your GitHub data
  return "Weekday Evenings"
})

// Computed property for chart data
const chartData = computed(() => {
  if (!reposByMonth.value.length) return []

  const maxCount = Math.max(...reposByMonth.value.map(m => m.count))

  return reposByMonth.value.map(month => ({
    ...month,
    heightPercent: (month.count / maxCount) * 100
  }))
})

// Helper function to format months
const formatMonth = (monthStr: string) => {
  const date = d3.timeParse('%Y-%m')(monthStr)
  return date ? d3.timeFormat('%b %y')(date) : ''
}

const lastTwelveMonths = computed(() => {
  if (!stats.value?.github?.repositories) return []

  // Create array of last 12 months
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: d3.timeFormat('%Y-%m')(date),
      label: d3.timeFormat('%B %Y')(date),
      repos: []
    })
  }

  // Fill in repos for each month
  stats.value.github.repositories
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(repo => {
      const date = new Date(repo.createdAt)
      const monthKey = d3.timeFormat('%Y-%m')(date)

      const monthData = months.find(m => m.key === monthKey)
      if (monthData) {
        monthData.repos.push({
          name: repo.name,
          language: repo.primaryLanguage?.name || ''
        })
      }
    })

  return months
})

const monthsSinceFirstRepo = computed(() => {
  if (!stats.value?.github?.repositories?.length) return 0

  const dates = stats.value.github.repositories.map(repo => new Date(repo.createdAt))
  const firstDate = new Date(Math.min(...dates))
  const now = new Date()

  return (
    (now.getFullYear() - firstDate.getFullYear()) * 12 +
    (now.getMonth() - firstDate.getMonth()) + 1
  )
})

// Add this computed property for words by month
const wordsByMonth = computed(() => {
  if (!blogStats.value?.posts) return []

  const monthlyWords = new Map<string, number>()

  blogStats.value.posts.forEach(post => {
    const date = new Date(post.date)
    const monthKey = d3.timeFormat('%Y-%m')(date)
    if (!monthKey) return

    monthlyWords.set(
      monthKey,
      (monthlyWords.get(monthKey) || 0) + (post.wordCount || 0)
    )
  })

  return Array.from(monthlyWords.entries())
    .map(([month, words]) => ({ month, words }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
})

// Update the renderReposByMonthChart function to use our theme colors
function renderReposByMonthChart() {
  if (!reposByMonthSvg.value) return
  const svgElement = reposByMonthSvg.value
  const data = reposByMonth.value
  if (!data.length) return

  const svg = d3.select(svgElement)
  const { width, height } = svgElement.getBoundingClientRect()
  svg.selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 50, left: 40 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const x = d3.scaleBand()
    .domain(data.map(d => d.month))
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) || 0])
    .nice()
    .range([innerHeight, 0])

  const chart = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Add bars with our theme colors
  chart.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('fill', 'rgb(75, 85, 99)') // gray-600
    .attr('x', d => x(d.month) || 0)
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => innerHeight - y(d.count))

  // X Axis with rotated labels
  const xAxis = d3.axisBottom(x)
    .tickFormat((d: string) => {
      const parsedDate = d3.timeParse('%Y-%m')(d)!
      return d3.timeFormat('%b %y')(parsedDate)
    })

  chart.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .attr('class', 'text-gray-500 text-xs')
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-40)')
    .attr('text-anchor', 'end')

  // Y Axis
  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => d.toString())

  chart.append('g')
    .attr('class', 'text-gray-500 text-xs')
    .call(yAxis)
}

// Add with other computed properties
const hasChessData = computed(() => {
  return !!(stats.value?.chess?.currentRating)
})

// Add these computed properties and functions
const isServiceLoaded = (service: string) => {
  switch (service.toLowerCase()) {
    case 'github':
      return !!(stats.value?.github?.totalContributions || stats.value?.github?.repositories?.length)
    case 'photos':
      return !!(stats.value?.photos?.stats?.totalPhotos)
    case 'chess':
      return !!(stats.value?.chess?.currentRating?.blitz ||
        stats.value?.chess?.currentRating?.bullet ||
        stats.value?.chess?.currentRating?.rapid)
    case 'leetcode':
      return !!(stats.value?.leetcode?.submissionStats?.easy?.count ||
        stats.value?.leetcode?.submissionStats?.medium?.count ||
        stats.value?.leetcode?.submissionStats?.hard?.count)
    case 'monkeytype':
      return !!(stats.value?.monkeyType?.typingStats?.bestWPM)
    default:
      return false
  }
}

// Update the errors computed property
const errors = computed(() => ({
  github: !isServiceLoaded('github'),
  photos: !isServiceLoaded('photos'),
  chess: !isServiceLoaded('chess'),
  leetcode: !isServiceLoaded('leetcode'),
  monkeytype: !isServiceLoaded('monkeytype')
}))

// Update hasStaleData computed
const hasStaleData = computed(() => {
  const now = new Date()
  const staleThreshold = 5 * 60 * 1000 // 5 minutes in milliseconds

  return Object.entries({
    github: stats.value?.github?.lastUpdated,
    photos: stats.value?.photos?.[0]?.lastUpdated,
    chess: stats.value?.chess?.lastUpdated,
    leetcode: stats.value?.leetcode?.lastUpdated,
    monkeytype: stats.value?.monkeyType?.lastUpdated
  }).some(([_, lastUpdated]) => {
    if (!lastUpdated) return false
    const timeDiff = now.getTime() - new Date(lastUpdated).getTime()
    return timeDiff > staleThreshold
  })
})

const githubContributions = computed(() => {
  if (!stats.value?.github?.contributions) return []
  return stats.value.github.dates.map((date, i) => ({
    date,
    count: stats.value.github.contributions[i]
  }))
})

const photoContributions = computed(() => {
  if (!stats.value?.photos?.dates || !stats.value?.photos?.contributions) return []

  return stats.value.photos.dates.map((date, i) => ({
    date,
    count: stats.value.photos.contributions[i]
  }))
})

// Add this to help debug
watch(() => stats.value?.photos, (newPhotos) => {
  console.log('Photos data:', newPhotos)
  console.log('Has photo data:', hasPhotoData.value)
  console.log('Photo contributions:', photoContributions.value)
}, { immediate: true })

// Add some debug logging
watch(() => stats.value?.photos, (photos) => {
  if (photos) {
    console.log('Photo stats:', photos.stats)
    console.log('Max contributions:', Math.max(...(photos.contributions || [0])))
    console.log('Current streak:', photos.currentStreak)
    console.log('Longest streak:', photos.longestStreak)
  }
}, { immediate: true })

const maxContributions = computed(() => {
  return Math.max(...(stats.value?.photos?.contributions || [0]))
})

const photoStats = computed(() => {
  const data = stats.value?.photos?.stats
  if (!data) return {
    totalPhotos: 0,
    photosThisYear: 0,
    photosThisMonth: 0,
    averagePerMonth: 0
  }

  const currentYear = new Date().getFullYear()
  return {
    totalPhotos: data.totalPhotos || 0,
    photosThisYear: stats.value?.photos?.photos?.filter(p =>
      new Date(p.uploaded_at).getFullYear() === currentYear
    ).length || 0,
    photosThisMonth: data.photosThisMonth || 0,
    averagePerMonth: data.averagePerMonth || 0
  }
})

// Add color scheme handling at the top of the script
const colorMode = useColorMode()

const heatmapColors = computed(() => {
  return colorMode.value === 'dark'
    ? ['rgb(22, 27, 34)', '#312e81', '#4338ca', '#6366f1', '#818cf8']  // Dark mode blues
    : ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#475569']  // Light mode grays
})

// Create a single source of truth for the current year
const currentYear = computed(() => new Date().getFullYear())

// Update currentYearPhotos to use the computed year
const currentYearPhotos = computed(() => {
  if (!stats.value?.photos?.photos) return 0
  return stats.value.photos.photos.filter(p =>
    new Date(p.uploaded_at).getFullYear() === currentYear.value
  ).length
})

const hasHealthData = computed(() => {
  return !!stats.value?.health?.today
})

const hasHeartRateData = computed(() => {
  return !!(
    stats.value?.health?.heartRate?.current ||
    stats.value?.health?.heartRate?.resting ||
    stats.value?.health?.heartRate?.walking ||
    stats.value?.health?.heartRate?.variability
  )
})

</script>

<style scoped>
/* Custom styles if needed */
input[type="date"] {
  color-scheme: light dark;
}

.bar-chart-container {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 2px;
  height: 100%;
}
</style>