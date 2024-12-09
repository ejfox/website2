<template>
  <section class="space-y-24 p-12 md:p-16 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-inner">
    <!-- Period Header -->
    <header class="space-y-8">
      <div class="space-y-2">
        <h2 class="text-sm tracking-widest text-gray-400 uppercase">Period Analysis</h2>
        <h3 class="text-4xl font-light text-gray-900 dark:text-gray-100">
          {{ periodTitle }}
        </h3>
      </div>

      <!-- Time Controls -->
      <nav class="flex flex-wrap gap-8 text-sm">
        <button v-for="period in [...weekPeriods, ...monthPeriods, ...yearPeriods]" :key="period"
          @click="setTimePeriod(period)"
          class="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          :class="{ 'text-blue-600 dark:text-blue-400': selectedPeriod === period }">
          {{ period }}
        </button>
      </nav>
    </header>

    <!-- Period Stats -->
    <div v-if="stats" class="space-y-32">
      <!-- Key Metrics -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div v-for="metric in periodMetrics" :key="metric.label" class="space-y-4">
          <p class="text-7xl font-extralight tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
            {{ metric.value }}
          </p>
          <div class="w-16 h-px bg-gray-900/10 dark:bg-gray-100/10"></div>
          <h3 class="text-sm tracking-widest text-gray-400 uppercase">{{ metric.label }}</h3>
        </div>
      </section>

      <!-- Code Activity -->
      <section v-if="hasCodeData && filteredCodeContributions.length" class="space-y-6">
        <div class="space-y-1">
          <h4 class="text-sm tracking-widest text-gray-400 uppercase">Code Contributions</h4>
          <p class="text-sm text-gray-500">
            {{ filteredCodeContributions.reduce((a, b) => a + b, 0) }} contributions over {{
              filteredCodeContributions.length }} days
          </p>
        </div>

        <div class="h-[240px] bg-white/50 dark:bg-gray-800/30 rounded-2xl p-8">
          <LineChart :data="{
            values: filteredCodeContributions,
            labels: filteredCodeDates
          }" />
        </div>
      </section>

      <!-- Writing Activity -->
      <section v-if="filteredPosts.length" class="space-y-6">
        <div class="space-y-1">
          <h4 class="text-sm tracking-widest text-gray-400 uppercase">Writing Activity</h4>
          <p class="text-sm text-gray-500">
            {{ formatNumber(totalWords) }} words across {{ filteredPosts.length }} posts
          </p>
        </div>

        <div class="space-y-6 divide-y divide-gray-200/50 dark:divide-gray-700/50">
          <div v-for="post in filteredPosts" :key="post.slug"
            class="pt-6 first:pt-0 flex items-baseline justify-between">
            <div class="space-y-1">
              <h3 class="text-base text-gray-700 dark:text-gray-300">
                {{ post.title }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ formatNumber(post.wordCount || 0) }} words
              </p>
            </div>
            <time class="text-sm tabular-nums text-gray-400">
              {{ format(new Date(post.date), 'MMM d') }}
            </time>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, subYears, startOfYear, endOfYear } from 'date-fns'
import { format as d3Format } from 'd3-format'
import LineChart from '~/components/viz/LineChart.vue'
import HeatMap from '~/components/viz/HeatMap.vue'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

interface Post {
  title: string
  slug: string
  date: string
  wordCount?: number
}

interface Photo {
  public_id: string
  uploaded_at: string
}

interface Stats {
  posts?: Post[]
  github?: {
    contributions: number[]
    dates: string[]
    prCount: number
    currentStreak: number
  }
  photos?: Photo[]
}

const { getAllPosts } = useProcessedMarkdown()

const props = defineProps<{
  stats?: Stats
  startDate: string
  endDate: string
  selectedPeriod: string
  hasCodeData: boolean
  hasPhotoData: boolean
  today: string
}>()

const emit = defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  'update:period': [value: string]
}>()

// UI state
const showCustomRange = ref(false)

// Format helpers
const formatNumber = d3Format(',d')

// Period options
const weekPeriods = ['This Week', 'Last Week']
const monthPeriods = ['This Month', 'Last Month', '3 Months', '6 Months']
const yearPeriods = ['This Year', 'Last Year']

// Period title computation
const periodTitle = computed(() => {
  try {
    const start = parseISO(props.startDate)
    const end = parseISO(props.endDate)

    if (props.selectedPeriod === 'Custom') {
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
    }

    return props.selectedPeriod
  } catch (error) {
    console.error('Error computing period title:', error)
    return 'Custom Period'
  }
})

// Two-way binding for dates
const startDateModel = computed({
  get: () => props.startDate,
  set: (value) => emit('update:startDate', value)
})

const endDateModel = computed({
  get: () => props.endDate,
  set: (value) => emit('update:endDate', value)
})

// Period setting logic
const setTimePeriod = (period) => {
  try {
    const now = new Date()
    let start, end

    switch (period) {
      case 'This Week':
        start = startOfWeek(now, { weekStartsOn: 1 })
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'Last Week':
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        break
      case 'This Month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'Last Month':
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      case '3 Months':
        start = startOfMonth(subMonths(now, 2))
        end = endOfMonth(now)
        break
      case '6 Months':
        start = startOfMonth(subMonths(now, 5))
        end = endOfMonth(now)
        break
      case 'This Year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case 'Last Year':
        start = startOfYear(subYears(now, 1))
        end = endOfYear(subYears(now, 1))
        break
      default:
        console.warn('Unknown period:', period)
        return
    }

    // Ensure dates are valid before emitting
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      emit('update:startDate', format(start, 'yyyy-MM-dd'))
      emit('update:endDate', format(end, 'yyyy-MM-dd'))
      emit('update:period', period)
    } else {
      console.error('Invalid date range generated for period:', period)
    }
  } catch (error) {
    console.error('Error setting time period:', error)
  }
}

// Posts filtering
const filteredPosts = computed(() => {
  try {
    if (!props.stats?.posts) return []

    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)

    return props.stats.posts
      .filter(post => {
        if (!post?.date) return false
        const postDate = new Date(post.date)
        return postDate >= startDateObj && postDate <= endDateObj
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error('Error filtering posts:', error)
    return []
  }
})

// Total words in filtered posts
const totalWords = computed(() => {
  try {
    return filteredPosts.value.reduce((sum, post) => sum + (post?.wordCount || 0), 0)
  } catch (error) {
    console.error('Error calculating total words:', error)
    return 0
  }
})

// Filtered data computeds
const filteredCodeContributions = computed(() => {
  try {
    if (!props.stats?.github?.contributions || !props.stats?.github?.dates) return []
    if (!props.startDate || !props.endDate) return []

    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)

    return props.stats.github.contributions.filter((_, i) => {
      try {
        const date = parseISO(props.stats.github.dates[i])
        return date >= startDateObj && date <= endDateObj
      } catch (error) {
        console.error('Error parsing date in github contributions:', error)
        return false
      }
    })
  } catch (error) {
    console.error('Error filtering github contributions:', error)
    return []
  }
})

const filteredCodeDates = computed(() => {
  try {
    if (!props.stats?.github?.dates) return []
    if (!props.startDate || !props.endDate) return []

    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)

    return props.stats.github.dates.filter(date => {
      try {
        const parsedDate = parseISO(date)
        return parsedDate >= startDateObj && parsedDate <= endDateObj
      } catch (error) {
        console.error('Error parsing date in github dates:', error)
        return false
      }
    })
  } catch (error) {
    console.error('Error filtering github dates:', error)
    return []
  }
})

const filteredPhotoHeatmapData = computed(() => {
  try {
    if (!props.stats?.photos?.length) return { values: [], details: [] }
    if (!props.startDate || !props.endDate) return { values: [], details: [] }

    const days = Array(365).fill(0)
    const details = Array(365).fill([])
    const now = new Date()
    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)

    props.stats.photos.forEach(photo => {
      if (!photo?.uploaded_at) return
      const date = new Date(photo.uploaded_at)
      if (date >= startDateObj && date <= endDateObj) {
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0 && daysDiff < 365) {
          days[daysDiff]++
          if (!details[daysDiff]) details[daysDiff] = []
          details[daysDiff].push({
            name: photo.public_id?.split('/')?.pop() || 'Untitled',
            count: 1
          })
        }
      }
    })

    return {
      values: days,
      details
    }
  } catch (error) {
    console.error('Error filtering photo data:', error)
    return { values: [], details: [] }
  }
})

const periodMetrics = computed(() => {
  try {
    const metrics = []

    if (filteredPosts.value?.length) {
      metrics.push({
        label: 'Posts Written',
        value: formatNumber(filteredPosts.value.length)
      })
      metrics.push({
        label: 'Words Written',
        value: formatNumber(totalWords.value)
      })
      metrics.push({
        label: 'Avg Words per Post',
        value: formatNumber(Math.round(totalWords.value / filteredPosts.value.length))
      })
    }

    if (props.hasCodeData && filteredCodeContributions.value?.length) {
      const contributions = filteredCodeContributions.value.reduce((sum, val) => sum + (val || 0), 0)
      metrics.push({
        label: 'Code Contributions',
        value: formatNumber(contributions)
      })

      if (props.stats?.github?.prCount) {
        metrics.push({
          label: 'Pull Requests',
          value: formatNumber(props.stats.github.prCount)
        })
      }
    }

    if (props.hasPhotoData && filteredPhotoHeatmapData.value?.values?.length) {
      const photos = filteredPhotoHeatmapData.value.values.reduce((sum, val) => sum + (val || 0), 0)
      if (photos > 0) {
        metrics.push({
          label: 'Photos Captured',
          value: formatNumber(photos)
        })
      }
    }

    return metrics
  } catch (error) {
    console.error('Error calculating period metrics:', error)
    return []
  }
})

// Hide custom range when selecting a preset
watch(() => props.selectedPeriod, (newPeriod) => {
  if (newPeriod && newPeriod !== 'Custom') {
    showCustomRange.value = false
  }
})

// Watch for date changes to validate range
watch([() => props.startDate, () => props.endDate], ([newStart, newEnd]) => {
  try {
    if (!newStart || !newEnd) return

    const start = parseISO(newStart)
    const end = parseISO(newEnd)

    if (end < start) {
      console.warn('Invalid date range: end date is before start date')
      emit('update:endDate', newStart)
    }
  } catch (error) {
    console.error('Error validating date range:', error)
  }
})
</script>

<style scoped>
input[type="date"] {
  color-scheme: light dark;
}

/* Style date inputs */
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Smooth height transition for custom range */
[v-show] {
  transition: all 0.2s ease-in-out;
}
</style>