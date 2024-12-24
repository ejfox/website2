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
        <section v-if="hasMonkeyTypeData || hasGithubData || hasPhotoData || blogStats"
          class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div v-if="hasMonkeyTypeData" class="space-y-3">
            <p class="text-[10rem] leading-none font-extralight tabular-nums tracking-tight">{{ bestWPM }}</p>
            <div class="w-16 h-px bg-gray-500/20"></div>
            <h3 class="text-sm tracking-wider text-gray-500">BEST WPM</h3>
            <p class="text-xs text-gray-400 tracking-wider">
              {{ formatNumber(stats?.monkeyType?.typingStats?.testsCompleted || 0) }} TESTS
              · {{ stats?.monkeyType?.typingStats?.bestAccuracy?.toFixed(1) || 0 }}% ACC
              · {{ stats?.monkeyType?.typingStats?.bestConsistency?.toFixed(1) || 0 }}% CON
            </p>
          </div>

          <div v-if="hasGithubData" class="space-y-3">
            <p class="text-[10rem] leading-none font-extralight tabular-nums tracking-tight">{{
              formatNumber(stats?.github?.totalContributions || 0) }}</p>
            <div class="w-16 h-px bg-gray-500/20"></div>
            <h3 class="text-sm tracking-wider text-gray-500">TOTAL CONTRIBUTIONS</h3>
            <p class="text-xs text-gray-400 tracking-wider">
              {{ formatNumber(stats?.github?.prCount || 0) }} PULL REQUESTS
              · {{ formatNumber(stats?.github?.currentStreak || 0) }} DAY STREAK
            </p>
          </div>

          <ClientOnly>
            <div v-if="hasPhotoData" class="space-y-3">
              <p class="text-[10rem] leading-none font-extralight tabular-nums tracking-tight">
                {{ formatNumber(stats?.photos?.length || 0) }}
              </p>
              <div class="w-16 h-px bg-gray-500/20"></div>
              <h3 class="text-sm tracking-wider text-gray-500">TOTAL PHOTOGRAPHS</h3>
              <p class="text-xs text-gray-400 tracking-wider">
                {{ new Date().getFullYear() }}
              </p>
            </div>
          </ClientOnly>

          <div v-if="blogStats" class="space-y-3">
            <p class="text-[10rem] leading-none font-extralight tabular-nums tracking-tight">{{
              formatNumber(blogStats.totalWords) }}</p>
            <div class="w-16 h-px bg-gray-500/20"></div>
            <h3 class="text-sm tracking-wider text-gray-500">WORDS WRITTEN</h3>
            <p class="text-xs text-gray-400 tracking-wider">
              {{ formatNumber(blogStats.totalPosts) }} POSTS
              · {{ formatNumber(blogStats.averageWords) }} AVG
            </p>
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
        <ClientOnly>
          <section v-if="hasPhotoData" class="space-y-16">
            <h3 class="text-sm tracking-wider text-gray-500 mb-4">PHOTOGRAPHY OVERVIEW</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-24">
              <div class="space-y-3">
                <p class="text-5xl font-extralight tabular-nums">{{ stats?.photos?.length || 0 }}</p>
                <div class="w-12 h-px bg-gray-900"></div>
                <h3 class="text-sm tracking-wider text-gray-500">TOTAL PHOTOGRAPHS</h3>
              </div>
            </div>
          </section>
        </ClientOnly>
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
      <section v-if="wordsPerYear && Object.keys(wordsPerYear).length" class="mt-32 space-y-12">
        <div class="border-t border-gray-500/20 pt-12">
          <h4 class="text-sm tracking-wider text-gray-500 mb-12">WORDS BY YEAR</h4>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div v-for="(words, year) in wordsPerYear" :key="year" class="space-y-3">
              <p class="text-6xl font-extralight tabular-nums tracking-tight">
                {{ formatNumber(words) }}
              </p>
              <div class="w-12 h-px bg-gray-500/20"></div>
              <h3 class="text-sm tracking-wider text-gray-500">{{ year }}</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Temporal View Section -->
      <!-- <PeriodAnalysis :stats="stats" :start-date="startDate" :end-date="endDate" :selected-period="selectedPeriod"
        :has-code-data="!!stats?.github" :has-photo-data="!!stats?.photos" :today="today"
        @update:start-date="startDate = $event" @update:end-date="endDate = $event"
        @update:period="selectedPeriod = $event" /> -->



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

</script>

<style scoped>
/* Custom styles if needed */
input[type="date"] {
  color-scheme: light dark;
}
</style>