<template>
  <div class="max-w-6xl mx-auto px-4 py-24 uppercase">


    <!-- Error States -->
    <div v-if="Object.keys(errors).length" class="mb-16 p-4 bg-red-50/50 rounded-lg">
      <h3 class="text-sm font-medium text-red-800/75">Some data sources are unavailable:</h3>
      <div v-for="(error, service) in errors" :key="service" class="text-red-600/75 text-sm capitalize">
        {{ service }}: {{ error }}
      </div>
    </div>

    <div v-if="hasStaleData" class="mb-8 p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
      <h3 class="text-sm font-medium text-yellow-800/75 dark:text-yellow-200/75">
        Some data may be outdated
      </h3>
      <p class="text-yellow-600/75 dark:text-yellow-300/75 text-sm">
        Using cached data while services are unavailable
      </p>
    </div>

    <div class="space-y-32">
      <!-- All-time Stats Section -->
      <section class="space-y-16">
        <h2 class="text-sm tracking-wider text-gray-500">LIFETIME METRICS</h2>

        <!-- Primary Metrics -->
        <section v-if="hasTypingData || hasCodeData" class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div v-if="hasTypingData" class="space-y-3">
            <p class="text-[8rem] leading-none font-extralight tabular-nums tracking-tight">{{ bestWPM }}</p>
            <div class="w-16 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">BEST WPM</h3>
            <p class="text-xs text-gray-400">
              {{ stats?.monkeyType?.typingStats?.testsCompleted || 0 }} tests completed
              · {{ stats?.monkeyType?.typingStats?.bestAccuracy?.toFixed(1) || 0 }}% accuracy
              · {{ stats?.monkeyType?.typingStats?.bestConsistency?.toFixed(1) || 0 }}% consistency
            </p>
            <!-- <p class="text-xs text-gray-400">
              Faster than {{ stats?.monkeyType?.typingStats?.timePercentile?.toFixed(1) || 0 }}% of users on 60s tests
              · {{ stats?.monkeyType?.typingStats?.wordsPercentile?.toFixed(1) || 0 }}% on word tests
            </p> -->
          </div>
        </section>

        <!-- Secondary Metrics -->
        <!-- <h3 class="text-sm tracking-wider text-gray-500 mb-8">CUMULATIVE TOTALS</h3>
        <section class="grid grid-cols-1 md:grid-cols-3 gap-24">
          <div v-for="metric in availableHeaderMetrics" :key="metric.label" class="space-y-3">
            <p class="text-6xl font-extralight tabular-nums tracking-tight">{{ metric.value }}</p>
            <div class="w-12 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">{{ metric.label }}</h3>
          </div>

          <div v-if="hasCodeData" class="space-y-3">
            <p class="text-[8rem] leading-none font-extralight tabular-nums tracking-tight">{{ codeStreak }}</p>
            <div class="w-16 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">DAY CURRENT CODING STREAK</h3>
            <h5 class="text-xs text-gray-500">
              <UIcon name="i-mdi-github" class="w-4 h-4" />
            </h5>
          </div>
        </section> -->


        <!-- All-time Photography Stats -->
        <section v-if="hasPhotoData" class="space-y-16">
          <h3 class="text-sm tracking-wider text-gray-500 mb-4">PHOTOGRAPHY OVERVIEW</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-24">
            <div class="space-y-3">
              <p class="text-5xl font-extralight tabular-nums">{{ stats?.photography?.totalPhotos || 0 }}</p>
              <div class="w-12 h-px bg-gray-900"></div>
              <h3 class="text-sm tracking-wider text-gray-500">TOTAL PHOTOGRAPHS</h3>
              <p class="text-xs text-gray-400">Captured {{ new Date().getFullYear() }}</p>
            </div>
          </div>
        </section>
      </section>

      <!-- Code Stats Section -->
      <section v-if="hasCodeData" class="space-y-12">
        <div class="border-t border-gray-100 pt-12 space-y-4">
          <div class="flex justify-between items-baseline">
            <h4 class="text-sm tracking-wider text-gray-500">CONTRIBUTION PATTERNS</h4>
            <p class="text-xs text-gray-400">{{ new Date().getFullYear() }} Calendar</p>
          </div>
          <div class="h-[160px]">
            <HeatMap :data="githubHeatmapData" :showFullYear="true" :showLegend="true" :legendLabels="{
              start: 'No Contributions',
              end: `${Math.max(...(stats?.code?.contributions || [0]))} Contributions`
            }" />
          </div>
          <p class="text-xs text-gray-400 text-center">
            Total Contributions: {{ stats?.code?.contributions?.reduce((a, b) => a + b, 0) || 0 }}
            · Peak Day: {{ Math.max(...(stats?.code?.contributions || [0])) }} commits
            · Active Days: {{ stats?.code?.contributions?.filter(c => c > 0).length || 0 }}
          </p>
        </div>
      </section>

      <!-- Blog Stats Section -->
      <section v-if="blogStats" class="space-y-12">
        <div class="">
          <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-4">WRITING ACTIVITY</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            <div class="space-y-2">
              <p class="text-4xl font-extralight tabular-nums">
                {{ formatNumber(blogStats.totalPosts) }}
              </p>
              <div class="w-12 h-px bg-gray-900/10 dark:bg-gray-100/10"></div>
              <h3 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80">TOTAL POSTS</h3>
              <p class="text-xs text-gray-400">
                First post: {{ formatDate(blogStats.firstPost) }}
              </p>
            </div>

            <div class="space-y-2">
              <p class="text-4xl font-extralight tabular-nums">
                {{ formatNumber(blogStats.totalWords) }}
              </p>
              <div class="w-12 h-px bg-gray-900/10 dark:bg-gray-100/10"></div>
              <h3 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80">WORDS WRITTEN</h3>
              <p class="text-xs text-gray-400">
                {{ formatNumber(blogStats.averageWords) }} words per post
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- Words Per Year Section -->
      <section v-if="wordsPerYear" class="space-y-12">
        <div class="border-t border-gray-200/50 dark:border-gray-700/50 pt-12">
          <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-8">WORDS WRITTEN PER YEAR</h4>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div v-for="(words, year) in wordsPerYear" :key="year" class="space-y-2">
              <p class="text-4xl font-extralight tabular-nums">
                {{ formatNumber(words) }}
              </p>
              <div class="w-12 h-px bg-gray-900/10 dark:bg-gray-100/10"></div>
              <h3 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80">{{ year }}</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Temporal View Section -->
      <PeriodAnalysis :stats="stats" :start-date="startDate" :end-date="endDate" :selected-period="selectedPeriod"
        :has-code-data="!!stats?.github" :has-photo-data="!!stats?.photos" :today="today"
        @update:start-date="startDate = $event" @update:end-date="endDate = $event"
        @update:period="selectedPeriod = $event" />



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
  monkeyType: MonkeyTypeResponse
  github: {
    contributions: number[]
    dates: string[]
    currentStreak: number
    prCount: number
    totalContributions: number
    repositories: any[]
  }
  photos: any[]
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
  if (start && end) {
    startDate.value = start
    endDate.value = end
    selectedPeriod.value = period || 'Custom'
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

// Data availability checks
const hasTypingData = computed(() => {
  return !!stats.value?.monkeyType?.typingStats?.bestWPM
})

const hasCodeData = computed(() => Array.isArray(stats?.github?.contributions) && stats.github.contributions.length > 0)
const hasPhotoData = computed(() => Array.isArray(stats?.photos))

const hasMultipleDataSources = computed(() => {
  const availableSources = [
    hasTypingData.value,
    hasCodeData.value,
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

  if (hasCodeData.value) {
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

const productivityPulse = computed(() => stats?.typing?.productivityPulse ?? 0)
const accuracy = computed(() => stats?.typing?.accuracy ?? 0)
const musicStreak = computed(() => stats?.music?.currentStreak ?? 0)
const sleepScore = computed(() => stats?.health?.sleepScore ?? 0)
const activeMinutes = computed(() => stats?.health?.activeMinutes ?? 0)
const chessRating = computed(() => stats?.chess?.currentRating ?? 0)
const peakRating = computed(() => stats?.chess?.peakRating ?? 0)
const codeStreak = computed(() => stats.value?.github?.currentStreak ?? 0)
const prCount = computed(() => stats?.code?.prCount ?? 0)

const topArtists = computed(() => {
  if (!hasMusicData.value) return []

  return (stats?.music?.topArtists ?? [])
    .slice(0, 5)
    .map(artist => ({
      name: artist?.name ?? 'Unknown Artist',
      plays: formatNumber(artist?.plays ?? 0)
    }))
})

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num ?? 0)
}

const photoHeatmapData = computed(() => {
  if (!stats?.photography?.photos?.length) return { values: [] }

  const days = Array(365).fill(0)
  const details = Array(365).fill([])
  const now = new Date()

  stats.photography.photos.forEach(photo => {
    const date = new Date(photo.uploaded_at)
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (daysDiff >= 0 && daysDiff < 365) {
      days[daysDiff]++

      if (!details[daysDiff]) details[daysDiff] = []
      details[daysDiff].push({
        name: photo.id.split('/').pop(),
        count: 1
      })
    }
  })

  return {
    values: days,
    details
  }
})

const githubHeatmapData = computed(() => {
  if (!stats?.code?.contributions?.length) return { values: [] }

  // GitHub data is already in the right order (oldest to newest)
  // but we need to pad it to 365 days if shorter
  const values = [...stats.code.contributions]
  while (values.length < 365) {
    values.unshift(0)
  }

  // Add repository details from hourlyDetails if available
  const details = stats.code.hourlyDetails?.map(hour =>
    hour.map(repo => ({
      name: repo.name,
      count: repo.count
    }))
  ) || Array(365).fill([])

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
const blogStats = ref(null)
const wordsPerYear = ref(null)
onMounted(async () => {
  try {
    const posts = await getAllPosts(false, false)
    if (!posts?.length) {
      console.warn('No posts found')
      blogStats.value = {
        totalPosts: 0,
        totalWords: 0,
        averageWords: 0,
        firstPost: null,
        lastPost: null
      }
      return
    }

    // Calculate words per year while we already have the posts
    const yearCounts = {}
    posts.forEach(post => {
      if (!post?.date) return
      const year = getValidDate(post.date).getFullYear()
      if (!yearCounts[year]) {
        yearCounts[year] = 0
      }
      yearCounts[year] += post.wordCount || 0
    })

    // Sort years in descending order
    wordsPerYear.value = Object.fromEntries(
      Object.entries(yearCounts)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    )

    // Calculate blog stats with null checks
    blogStats.value = {
      totalPosts: posts.length,
      totalWords: posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0),
      averageWords: Math.round(posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0) / (posts.length || 1)),
      firstPost: posts[posts.length - 1]?.date,
      lastPost: posts[0]?.date,
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
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return format(date, 'MMMM d, yyyy')
}

// Add helper function for date validation
const getValidDate = (dateString) => {
  if (!dateString) return new Date()
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? new Date() : date
}

</script>

<style scoped>
/* Custom styles if needed */
input[type="date"] {
  color-scheme: light dark;
}
</style>