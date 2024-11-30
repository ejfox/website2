<template>
  <div class="max-w-6xl mx-auto px-4 py-24 uppercase">
    <!-- Loading State -->
    <div v-if="isLoading" class="fixed inset-x-0 top-0 z-50">
      <UProgress :value="loadingProgress" indicator />
      <div class="text-center py-2">
        <div class="text-gray-400 text-sm">{{ loadingStatus }}</div>
      </div>
    </div>

    <!-- Error States -->
    <div v-if="Object.keys(errors).length" class="mb-16 p-4 bg-red-50/50 rounded-lg">
      <h3 class="text-sm font-medium text-red-800/75">Some data sources are unavailable:</h3>
      <div v-for="(error, service) in errors" :key="service" class="text-red-600/75 text-sm capitalize">
        {{ service }}: {{ error }}
      </div>
    </div>

    <div class="space-y-32">
      <!-- All-time Stats Section -->
      <section class="space-y-16">
        <h2 class="text-2xl font-light tracking-wider text-gray-700">All-time Stats</h2>
        <!-- Primary Metrics -->
        <section v-if="hasTypingData || hasCodeData" class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div v-if="hasTypingData" class="space-y-3">
            <p class="text-[8rem] leading-none font-extralight tabular-nums tracking-tight">{{ currentWPM }}</p>
            <div class="w-16 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">AVERAGE WPM</h3>
          </div>

          <div v-if="hasCodeData" class="space-y-3">
            <p class="text-[8rem] leading-none font-extralight tabular-nums tracking-tight">{{ codeStreak }}</p>
            <div class="w-16 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">DAY CODING STREAK</h3>
            <h5 class="text-xs text-gray-500">
              <UIcon name="i-mdi-github" class="w-4 h-4" />
            </h5>
          </div>
        </section>

        <!-- Secondary Metrics -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-24">
          <div v-for="metric in availableHeaderMetrics" :key="metric.label" class="space-y-3">
            <p class="text-6xl font-extralight tabular-nums tracking-tight">{{ metric.value }}</p>
            <div class="w-12 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">{{ metric.label }}</h3>
          </div>
        </section>
      </section>

      <!-- Temporal View Section -->
      <section class="space-y-16">
        <div class="flex items-baseline justify-between">
          <h2 class="text-2xl font-light tracking-wider text-gray-700">Time Period Stats</h2>
          <div class="flex items-center gap-4">
            <!-- Quick Period Selectors -->
            <button v-for="period in ['This Month', 'Last Month', 'This Year']" :key="period"
              @click="setTimePeriod(period)" class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              :class="{ 'text-blue-600': selectedPeriod === period }">
              {{ period }}
            </button>
            <!-- Custom Date Range -->
            <div class="flex items-center gap-2">
              <input type="date" v-model="startDate" class="text-sm border rounded px-2 py-1" :max="endDate" />
              <span class="text-gray-400">to</span>
              <input type="date" v-model="endDate" class="text-sm border rounded px-2 py-1" :min="startDate"
                :max="today" />
            </div>
            <!-- Share Button -->
            <button @click="copyShareLink"
              class="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
              <UIcon name="i-mdi-share" class="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        <!-- Period Stats -->
        <div v-if="periodStats" class="space-y-16">
          <!-- Period Metrics -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-24">
            <div v-for="metric in periodMetrics" :key="metric.label" class="space-y-3">
              <p class="text-6xl font-extralight tabular-nums tracking-tight">{{ metric.value }}</p>
              <div class="w-12 h-px bg-gray-900"></div>
              <h3 class="text-sm tracking-wider text-gray-500">{{ metric.label }}</h3>
            </div>
          </section>

          <!-- Period Visualizations -->
          <div class="space-y-12">
            <!-- Code Activity -->
            <div v-if="hasCodeData" class="border-t border-gray-100 pt-12">
              <div class="h-[320px] w-full">
                <LineChart :data="{
                  values: filteredCodeContributions,
                  labels: filteredCodeDates
                }" />
              </div>
            </div>

            <!-- Photo Activity -->
            <div v-if="hasPhotoData" class="border-t border-gray-100 pt-12">
              <div class="h-[160px]">
                <HeatMap :data="filteredPhotoHeatmapData" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Visualization Sections -->
      <section v-if="hasCodeData" class="space-y-12">
        <div class="border-t border-gray-100 pt-12">
          <div class="h-[320px] w-full">
            <LineChart :data="{
              values: stats?.code?.contributions.length ? stats.code.contributions : [0],
              labels: stats?.code?.dates.length ? stats.code.dates : ['No Data']
            }" />
          </div>
        </div>
      </section>

      <!-- Photography Stats -->
      <section v-if="hasPhotoData" class="space-y-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-24">
          <div class="space-y-3">
            <p class="text-5xl font-extralight tabular-nums">{{ stats?.photography?.totalPhotos || 0 }}</p>
            <div class="w-12 h-px bg-gray-900"></div>
            <h3 class="text-sm tracking-wider text-gray-500">TOTAL PHOTOGRAPHS</h3>
            <p class="text-xs text-gray-400">Captured {{ new Date().getFullYear() }}</p>
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-baseline">
            <h4 class="text-sm tracking-wider text-gray-500">PHOTO CAPTURE FREQUENCY</h4>
            <p class="text-xs text-gray-400">Each cell represents one day</p>
          </div>
          <div class="h-[160px]">
            <template v-if="stats?.photography?.photos?.length">
              <HeatMap :data="photoHeatmapData" />
            </template>
            <template v-else>
              <div class="h-full flex items-center justify-center text-gray-400">
                No photo data available
              </div>
            </template>
          </div>
          <div class="flex justify-between text-xs text-gray-400">
            <span>Less Frequent</span>
            <div class="flex gap-1 items-center">
              <div class="w-3 h-3 bg-blue-50"></div>
              <div class="w-3 h-3 bg-blue-200"></div>
              <div class="w-3 h-3 bg-blue-400"></div>
              <div class="w-3 h-3 bg-blue-600"></div>
            </div>
            <span>More Frequent</span>
          </div>
        </div>
      </section>

      <!-- Code Stats Section -->
      <section v-if="hasCodeData" class="space-y-12">
        <div class="border-t border-gray-100 pt-12 space-y-4">
          <div class="flex justify-between items-baseline">
            <h4 class="text-sm tracking-wider text-gray-500">GITHUB CONTRIBUTION ACTIVITY</h4>
            <p class="text-xs text-gray-400">{{ new Date().getFullYear() }} Calendar</p>
          </div>
          <div class="h-[160px]">
            <HeatMap :data="githubHeatmapData" />
          </div>
          <div class="flex justify-between text-xs text-gray-400">
            <span>No Contributions</span>
            <div class="flex gap-1 items-center">
              <div class="w-3 h-3 bg-blue-50"></div>
              <div class="w-3 h-3 bg-blue-200"></div>
              <div class="w-3 h-3 bg-blue-400"></div>
              <div class="w-3 h-3 bg-blue-600"></div>
            </div>
            <span>{{ Math.max(...(stats?.code?.contributions || [0])) }} Contributions</span>
          </div>
          <p class="text-xs text-gray-400 text-center">
            Total Contributions: {{ stats?.code?.contributions?.reduce((a, b) => a + b, 0) || 0 }}
            · Peak Day: {{ Math.max(...(stats?.code?.contributions || [0])) }} commits
            · Active Days: {{ stats?.code?.contributions?.filter(c => c > 0).length || 0 }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import LineChart from '~/components/viz/LineChart.vue'
import HeatMap from '~/components/viz/HeatMap.vue'
import { computed, ref, onMounted, watch } from 'vue'
import { useStats } from '~/composables/useStats'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'

const { stats, isLoading, errors } = useStats()

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

// Period selection
const setTimePeriod = (period) => {
  selectedPeriod.value = period
  const now = new Date()

  switch (period) {
    case 'This Month':
      startDate.value = format(startOfMonth(now), 'yyyy-MM-dd')
      endDate.value = format(endOfMonth(now), 'yyyy-MM-dd')
      break
    case 'Last Month':
      startDate.value = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      endDate.value = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      break
    case 'This Year':
      startDate.value = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd')
      endDate.value = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd')
      break
  }
}

// Share functionality
const copyShareLink = async () => {
  await copy(window.location.href)
  // You might want to add a toast notification here
}

// Filtered data computeds
const filteredCodeContributions = computed(() => {
  if (!stats.value?.code?.contributions) return []
  return stats.value.code.contributions.filter((_, i) => {
    const date = parseISO(stats.value.code.dates[i])
    return date >= parseISO(startDate.value) && date <= parseISO(endDate.value)
  })
})

const filteredCodeDates = computed(() => {
  if (!stats.value?.code?.dates) return []
  return stats.value.code.dates.filter(date => {
    const parsedDate = parseISO(date)
    return parsedDate >= parseISO(startDate.value) && parsedDate <= parseISO(endDate.value)
  })
})

const filteredPhotoHeatmapData = computed(() => {
  // Filter photo heatmap data based on selected date range
  return photoHeatmapData.value.filter(d => {
    const date = parseISO(d.date)
    return date >= parseISO(startDate.value) && date <= parseISO(endDate.value)
  })
})

const periodMetrics = computed(() => {
  const metrics = []

  if (hasCodeData.value) {
    const contributions = filteredCodeContributions.value.reduce((sum, val) => sum + val, 0)
    metrics.push({
      label: 'Code Contributions',
      value: formatNumber(contributions)
    })
  }

  if (hasPhotoData.value) {
    const photos = filteredPhotoHeatmapData.value.reduce((sum, day) => sum + day.value, 0)
    metrics.push({
      label: 'Photos Taken',
      value: formatNumber(photos)
    })
  }

  // Add more period-specific metrics here

  return metrics
})

const hasTypingData = computed(() => !!stats?.typing?.currentWPM)
const hasMusicData = computed(() => !!stats?.music?.currentStreak)
const hasChessData = computed(() => !!stats?.chess?.currentRating)
const hasCodeData = computed(() => Array.isArray(stats?.code?.contributions) && stats.code.contributions.length > 0)
const hasPhotoData = computed(() => !!stats?.photography?.totalPhotos)
const hasWeatherData = computed(() => !!stats?.weather?.current)

const hasMultipleDataSources = computed(() => {
  const availableSources = [
    hasTypingData.value,
    hasMusicData.value,
    hasChessData.value,
    hasCodeData.value,
    hasPhotoData.value,
    hasWeatherData.value
  ].filter(Boolean).length

  return availableSources >= 2
})

const availableHeaderMetrics = computed(() => {
  const metrics = []

  if (hasTypingData.value) {
    metrics.push({
      label: 'Total Keystrokes',
      value: formatNumber(stats?.metrics?.keystrokes)
    })
  }

  if (hasMusicData.value) {
    metrics.push({
      label: 'Hours of Music',
      value: formatNumber(stats?.metrics?.musicHours)
    })
  }

  if (hasChessData.value) {
    metrics.push({
      label: 'Chess Games',
      value: formatNumber(stats?.metrics?.chessGames)
    })
  }

  if (hasPhotoData.value) {
    metrics.push({
      label: 'Photos Captured',
      value: formatNumber(stats?.metrics?.photos)
    })
  }

  if (hasCodeData.value) {
    metrics.push({
      label: 'Lines of Code',
      value: formatNumber(stats?.metrics?.linesOfCode)
    })
  }

  if (stats?.monkeyType) {
    metrics.push({
      label: 'Total Tests Completed',
      value: formatNumber(stats.monkeyType.completedTests)
    })
    metrics.push({
      label: 'Time Typing (minutes)',
      value: formatNumber(Math.floor(stats.monkeyType.timeTyping))
    })
  }

  if (stats?.github) {
    metrics.push({
      label: 'Total Repositories',
      value: formatNumber(stats.github.totalRepos)
    })
    metrics.push({
      label: 'Followers',
      value: formatNumber(stats.github.followers)
    })
    metrics.push({
      label: 'Stars',
      value: formatNumber(stats.github.stars)
    })
    metrics.push({
      label: 'Contributions in the Last Year',
      value: formatNumber(stats.github.contributions)
    })
  }

  return metrics
})

const currentWPM = computed(() => stats?.typing?.currentWPM ?? 0)
const productivityPulse = computed(() => stats?.typing?.productivityPulse ?? 0)
const bestWPM = computed(() => stats?.typing?.bestWPM ?? 0)
const accuracy = computed(() => stats?.typing?.accuracy ?? 0)
const musicStreak = computed(() => stats?.music?.currentStreak ?? 0)
const sleepScore = computed(() => stats?.health?.sleepScore ?? 0)
const activeMinutes = computed(() => stats?.health?.activeMinutes ?? 0)
const chessRating = computed(() => stats?.chess?.currentRating ?? 0)
const peakRating = computed(() => stats?.chess?.peakRating ?? 0)
const codeStreak = computed(() => stats?.code?.currentStreak ?? 0)
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

</script>

<style scoped>
/* Custom styles if needed */
input[type="date"] {
  color-scheme: light dark;
}
</style>