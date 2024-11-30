<template>
  <section class="space-y-16 p-8 md:p-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl shadow-inner">
    <!-- Period Controls -->
    <div class="flex flex-col md:flex-row md:items-baseline justify-between gap-6">
      <div class="space-y-2">
        <h2 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80">PERIOD ANALYSIS</h2>
        <h3 class="text-2xl font-medium text-gray-900 dark:text-gray-100">
          {{ periodTitle }}
        </h3>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <!-- Time Period Groups -->
        <div class="flex items-center gap-3">
          <button v-for="period in weekPeriods" :key="period" @click="setTimePeriod(period)"
            class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            :class="{ 'text-blue-600 dark:text-blue-400 font-medium': selectedPeriod === period }">
            {{ period }}
          </button>
        </div>
        <div class="flex items-center gap-3">
          <button v-for="period in monthPeriods" :key="period" @click="setTimePeriod(period)"
            class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            :class="{ 'text-blue-600 dark:text-blue-400 font-medium': selectedPeriod === period }">
            {{ period }}
          </button>
        </div>
        <div class="flex items-center gap-3">
          <button v-for="period in yearPeriods" :key="period" @click="setTimePeriod(period)"
            class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            :class="{ 'text-blue-600 dark:text-blue-400 font-medium': selectedPeriod === period }">
            {{ period }}
          </button>
        </div>
        <div class="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
        <!-- Custom Date Range Toggle -->
        <button @click="showCustomRange = !showCustomRange"
          class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-1">
          <UIcon :name="showCustomRange ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'" class="w-4 h-4" />
          Custom Range
        </button>

      </div>
    </div>

    <!-- Custom Date Range Picker -->
    <div v-show="showCustomRange" class="flex items-center gap-4 transition-all duration-200 ease-in-out 
             bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm">
      <input type="date" v-model="startDateModel" class="flex-[0.45] min-w-0 text-sm border rounded-lg px-3 py-2 bg-transparent
               border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400
               focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none
               transition-colors" :max="endDate" />
      <span class="flex-[0.1] text-center text-sm text-gray-400 font-medium">to</span>
      <input type="date" v-model="endDateModel" class="flex-[0.45] min-w-0 text-sm border rounded-lg px-3 py-2 bg-transparent
               border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400
               focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none
               transition-colors" :min="startDate" :max="today" />
    </div>

    <!-- Period Stats -->
    <div v-if="stats" class="space-y-16">
      <!-- Period Metrics -->
      <h3 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-8">PERIOD TOTALS</h3>
      <section class="grid grid-cols-1 md:grid-cols-3 gap-24">
        <div v-for="metric in periodMetrics" :key="metric.label" class="space-y-3">
          <p class="text-6xl font-extralight tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
            {{ metric.value }}
          </p>
          <div class="w-12 h-px bg-gray-900/10 dark:bg-gray-100/10"></div>
          <h3 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80">{{ metric.label }}</h3>
        </div>
      </section>

      <!-- Period Visualizations -->
      <div class="space-y-12">
        <!-- Code Activity -->
        <div v-if="hasCodeData && filteredCodeContributions.length"
          class="border-t border-gray-200/50 dark:border-gray-700/50 pt-12">
          <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-4">CODE CONTRIBUTIONS</h4>
          <p class="text-xs text-gray-400 mb-4">
            {{ filteredCodeContributions.reduce((a, b) => a + b, 0) }} contributions over {{
              filteredCodeContributions.length }} days
          </p>
          <div class="h-[320px] w-full bg-white/50 dark:bg-gray-800/30 rounded-xl p-6 shadow-inner">
            <LineChart :data="{
              values: filteredCodeContributions,
              labels: filteredCodeDates
            }" />
          </div>
        </div>

        <!-- Photo Activity -->
        <div v-if="hasPhotoData && filteredPhotoHeatmapData?.values?.length"
          class="border-t border-gray-200/50 dark:border-gray-700/50 pt-12">
          <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-4">PHOTO FREQUENCY</h4>
          <div class="flex justify-between items-baseline mb-4">
            <p class="text-xs text-gray-400">
              {{ filteredPhotoHeatmapData.values.reduce((a, b) => a + b, 0) }} photos captured
            </p>
            <p class="text-xs text-gray-400">Each cell represents one day</p>
          </div>
          <div class="h-[160px] bg-white/50 dark:bg-gray-800/30 rounded-xl p-6 shadow-inner">
            <HeatMap :data="filteredPhotoHeatmapData" :start-date="startDate" :end-date="endDate" :showLegend="true"
              :legendLabels="{
                start: 'Less Frequent',
                end: 'More Frequent'
              }" />
          </div>
        </div>

        <!-- Writing Activity -->
        <div v-if="filteredPosts.length" class="border-t border-gray-200/50 dark:border-gray-700/50 pt-12">
          <h4 class="text-sm tracking-wider text-gray-500/80 dark:text-gray-400/80 mb-4">WRITING ACTIVITY</h4>
          <div class="flex justify-between items-baseline mb-4">
            <p class="text-xs text-gray-400">
              {{ filteredPosts.length }} posts · {{ formatNumber(totalWords) }} words
            </p>
            <p class="text-xs text-gray-400">
              {{ formatNumber(Math.round(totalWords / filteredPosts.length)) }} words per post
            </p>
          </div>

          <!-- Posts List -->
          <div class="space-y-4 mt-8 bg-white/50 dark:bg-gray-800/30 rounded-xl p-6 shadow-inner">
            <div v-for="post in filteredPosts" :key="post.slug"
              class="flex items-baseline justify-between gap-4 py-2 group">
              <div class="space-y-1">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 
                           group-hover:text-blue-500 dark:group-hover:text-blue-400">
                  {{ post.title }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ formatNumber(post.wordCount || 0) }} words
                </p>
              </div>
              <time class="text-xs tabular-nums text-gray-400">
                {{ format(new Date(post.date), 'MMM d, yyyy') }}
              </time>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, subYears } from 'date-fns'
import LineChart from '~/components/viz/LineChart.vue'
import HeatMap from '~/components/viz/HeatMap.vue'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

const props = defineProps({
  stats: Object,
  startDate: String,
  endDate: String,
  selectedPeriod: String,
  hasCodeData: Boolean,
  hasPhotoData: Boolean,
  today: String
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'update:period'])

// Two-way binding for dates
const startDateModel = computed({
  get: () => props.startDate,
  set: (value) => emit('update:startDate', value)
})

const endDateModel = computed({
  get: () => props.endDate,
  set: (value) => emit('update:endDate', value)
})

// Filtered data computeds
const filteredCodeContributions = computed(() => {
  if (!props.stats?.code?.contributions) return []
  return props.stats.code.contributions.filter((_, i) => {
    const date = parseISO(props.stats.code.dates[i])
    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)
    return date >= startDateObj && date <= endDateObj
  })
})

const filteredCodeDates = computed(() => {
  if (!props.stats?.code?.dates) return []
  return props.stats.code.dates.filter(date => {
    const parsedDate = parseISO(date)
    const startDateObj = parseISO(props.startDate)
    const endDateObj = parseISO(props.endDate)
    return parsedDate >= startDateObj && parsedDate <= endDateObj
  })
})

const filteredPhotoHeatmapData = computed(() => {
  if (!props.stats?.photography?.photos) return { values: [], details: [] }

  const days = Array(365).fill(0)
  const details = Array(365).fill([])
  const now = new Date()
  const startDateObj = parseISO(props.startDate)
  const endDateObj = parseISO(props.endDate)

  props.stats.photography.photos.forEach(photo => {
    const date = new Date(photo.uploaded_at)
    if (date >= startDateObj && date <= endDateObj) {
      const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      if (daysDiff >= 0 && daysDiff < 365) {
        days[daysDiff]++
        if (!details[daysDiff]) details[daysDiff] = []
        details[daysDiff].push({
          name: photo.id.split('/').pop(),
          count: 1
        })
      }
    }
  })

  return {
    values: days,
    details
  }
})

const periodMetrics = computed(() => {
  const metrics = []

  if (filteredPosts.value.length) {
    metrics.push({
      label: 'Posts Written',
      value: formatNumber(filteredPosts.value.length)
    })
    metrics.push({
      label: 'Words Written',
      value: formatNumber(totalWords.value)
    })
  }

  if (props.hasCodeData) {
    const contributions = filteredCodeContributions.value.reduce((sum, val) => sum + val, 0)
    metrics.push({
      label: 'Code Contributions',
      value: formatNumber(contributions)
    })
  }

  if (props.hasPhotoData) {
    const photos = filteredPhotoHeatmapData.value.values.reduce((sum, val) => sum + val, 0)
    metrics.push({
      label: 'Photos Taken',
      value: formatNumber(photos)
    })
  }

  return metrics
})

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num ?? 0)
}

// Period selection
const setTimePeriod = (period) => {
  emit('update:period', period)
  const now = new Date()

  switch (period) {
    case 'This Week':
      emit('update:startDate', format(startOfWeek(now), 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfWeek(now), 'yyyy-MM-dd'))
      break
    case 'Last Week':
      const lastWeek = subWeeks(now, 1)
      emit('update:startDate', format(startOfWeek(lastWeek), 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfWeek(lastWeek), 'yyyy-MM-dd'))
      break
    case 'This Month':
      emit('update:startDate', format(startOfMonth(now), 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfMonth(now), 'yyyy-MM-dd'))
      break
    case 'Last Month':
      emit('update:startDate', format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'))
      break
    case 'Last 3 Months':
      emit('update:startDate', format(startOfMonth(subMonths(now, 3)), 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfMonth(now), 'yyyy-MM-dd'))
      break
    case 'This Year':
      emit('update:startDate', format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'))
      emit('update:endDate', format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'))
      break
    case 'Last Year':
      const lastYear = subYears(now, 1)
      emit('update:startDate', format(new Date(lastYear.getFullYear(), 0, 1), 'yyyy-MM-dd'))
      emit('update:endDate', format(new Date(lastYear.getFullYear(), 11, 31), 'yyyy-MM-dd'))
      break
    case 'Same Week Last Year':
      const sameWeekLastYear = subYears(currentWeek, 1)
      emit('update:startDate', format(sameWeekLastYear, 'yyyy-MM-dd'))
      emit('update:endDate', format(endOfWeek(sameWeekLastYear), 'yyyy-MM-dd'))
      break
  }

  // Hide custom range when selecting a preset
  showCustomRange.value = false
}

const showCustomRange = ref(false)

// Group periods by type
const weekPeriods = ['This Week', 'Last Week', 'Same Week Last Year']
const monthPeriods = ['This Month', 'Last Month', 'Last 3 Months']
const yearPeriods = ['This Year', 'Last Year']

// Format date range for display
const periodTitle = computed(() => {
  // If it's a preset period, use that
  if (props.selectedPeriod) {
    return props.selectedPeriod
  }

  // Otherwise format the date range
  const start = parseISO(props.startDate)
  const end = parseISO(props.endDate)

  // If same year
  if (start.getFullYear() === end.getFullYear()) {
    // If same month
    if (start.getMonth() === end.getMonth()) {
      // If same day
      if (start.getDate() === end.getDate()) {
        return format(start, 'MMMM d, yyyy')
      }
      // Same month
      return `${format(start, 'MMMM d')}–${format(end, 'd')}, ${format(end, 'yyyy')}`
    }
    // Same year
    return `${format(start, 'MMMM d')}–${format(end, 'MMMM d')}, ${format(end, 'yyyy')}`
  }

  // Different years
  return `${format(start, 'MMMM d, yyyy')}–${format(end, 'MMMM d, yyyy')}`
})

// Get posts data
const { getAllPosts } = useProcessedMarkdown()
const posts = ref([])
onMounted(async () => {
  posts.value = await getAllPosts(false, false)
})

// Filter posts by selected period
const filteredPosts = computed(() => {
  if (!posts.value.length) return []

  const startDateObj = parseISO(props.startDate)
  const endDateObj = parseISO(props.endDate)

  return posts.value
    .filter(post => {
      const postDate = new Date(post.date)
      return postDate >= startDateObj && postDate <= endDateObj
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Calculate total words for period
const totalWords = computed(() =>
  filteredPosts.value.reduce((sum, post) => sum + (post.wordCount || 0), 0)
)
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