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
            <IndividualStat v-if="hasPhotoData" :value="stats?.photos?.length || 0" size="large" label="PHOTOGRAPHS"
              :details="new Date().getFullYear().toString()" />
          </ClientOnly>

          <IndividualStat v-if="blogStats" :value="blogStats.totalWords" size="large" label="WORDS WRITTEN"
            :details="`${formatNumber(blogStats.totalPosts)} POSTS · ${formatNumber(blogStats.averageWords)} AVG`" />

          <IndividualStat v-if="hasLeetCodeData" :value="totalLeetCodeSolved" size="large" label="LEETCODE PROBLEMS"
            :details="`${stats?.leetcode?.submissionStats?.easy?.count || 0} EASY · ${stats?.leetcode?.submissionStats?.medium?.count || 0} MEDIUM · ${stats?.leetcode?.submissionStats?.hard?.count || 0} HARD`" />
        </section>

        <!-- Photography Overview -->
        <ClientOnly>
          <section v-if="hasPhotoData" class="space-y-16">
            <h3 class="text-sm tracking-wider text-gray-500 mb-4">PHOTOGRAPHY OVERVIEW</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-24">
              <IndividualStat :value="stats?.photos?.length || 0" size="medium" label="PHOTOGRAPHS" />
            </div>
          </section>
        </ClientOnly>


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
  chess?: any
  code?: {
    prCount?: number
    contributions?: number[]
    currentStreak?: number
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

const { stats, isLoading, errors, hasStaleData } = useStats()
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
  return !!(stats.value?.github?.contributions?.length || stats.value?.github?.totalContributions)
})

const hasPhotoData = computed(() => {
  return !!(stats.value?.photos?.length)
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