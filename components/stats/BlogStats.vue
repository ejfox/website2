<template>
  <div class="space-y-3 font-mono">
    <!-- Current Status - Big Numbers for Motivation -->
    <div>
      <h4 class="section-subheader">WRITING STATUS</h4>
      <div class="grid grid-cols-2 gap-2">
        <div class="metric-card">
          <div class="text-lg font-bold tabular-nums">{{ stats.totalPosts }}</div>
          <div class="metric-label">TOTAL POSTS</div>
        </div>
        <div class="metric-card">
          <div class="text-lg font-bold tabular-nums">{{ formatNumber(stats.totalWords) }}</div>
          <div class="metric-label">TOTAL WORDS</div>
        </div>
      </div>
    </div>

    <!-- Temporal Windows - Motivation Dashboard -->
    <div>
      <h4 class="section-subheader">PROGRESS TRACKER</h4>
      <div class="space-y-1.5">
        <!-- This Month -->
        <div class="progress-row">
          <div class="flex items-center gap-2">
            <div class="month-indicator" :class="monthIndicatorClass"></div>
            <span class="progress-label">THIS MONTH</span>
          </div>
          <div class="progress-value">{{ stats.postsThisMonth || 0 }} posts · {{ formatNumber(stats.wordsThisMonth || 0) }} words</div>
        </div>

        <!-- This Week (estimated) -->
        <div class="progress-row">
          <div class="flex items-center gap-2">
            <div class="week-indicator"></div>
            <span class="progress-label">THIS WEEK</span>
          </div>
          <div class="progress-value">{{ postsThisWeek }} posts · {{ wordsThisWeek }} words</div>
        </div>

        <!-- Writing Streak -->
        <div class="progress-row">
          <div class="flex items-center gap-2">
            <div class="streak-indicator" :class="streakIndicatorClass"></div>
            <span class="progress-label">CURRENT STREAK</span>
          </div>
          <div class="progress-value">{{ currentStreak }} {{ currentStreak === 1 ? 'week' : 'weeks' }}</div>
        </div>

        <!-- Days Since Last Post -->
        <div class="progress-row">
          <div class="flex items-center gap-2">
            <div class="recency-indicator" :class="recencyIndicatorClass"></div>
            <span class="progress-label">LAST POST</span>
          </div>
          <div class="progress-value">{{ daysSinceLastPost }} {{ daysSinceLastPost === 1 ? 'day' : 'days' }} ago</div>
        </div>
      </div>
    </div>

    <!-- Velocity & Patterns -->
    <div>
      <h4 class="section-subheader">VELOCITY</h4>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="velocity-label">POSTS/YEAR</span>
          <span class="velocity-value">{{ postsPerYear.toFixed(1) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="velocity-label">WORDS/POST</span>
          <span class="velocity-value">{{ formatNumber(stats.averageWords) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="velocity-label">WORDS/DAY</span>
          <span class="velocity-value">{{ wordsPerDay.toFixed(0) }}</span>
        </div>
        <div class="flex items-center justify-between" v-if="stats.averageReadingTime">
          <span class="velocity-label">AVG READ TIME</span>
          <span class="velocity-value">{{ stats.averageReadingTime }}min</span>
        </div>
      </div>
    </div>

    <!-- Seasonal Analysis -->
    <div>
      <h4 class="section-subheader">PATTERNS</h4>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="velocity-label">BEST MONTH</span>
          <span class="velocity-value">{{ bestMonth.month }} ({{ bestMonth.count }} posts)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="velocity-label">MOST PRODUCTIVE</span>
          <span class="velocity-value">{{ mostProductiveYear.year }} ({{ mostProductiveYear.count }} posts)</span>
        </div>
        <div class="flex items-center justify-between" v-if="stats.uniqueTags">
          <span class="velocity-label">TOPICS</span>
          <span class="velocity-value">{{ stats.uniqueTags }} unique</span>
        </div>
      </div>
    </div>

    <!-- Writing Activity Calendar -->
    <div>
      <h4 class="section-subheader">ACTIVITY HEATMAP</h4>
      <ActivityCalendar :active-dates="weeklyConsistencyDates" :days="365" title="" />
      <div class="flex justify-between text-zinc-500 mt-1" style="font-size: 9px; line-height: 10px;">
        <span>{{ Math.round((weeklyConsistencyDates.length / 52) * 100) }}% of weeks active</span>
        <span>{{ weeklyConsistencyDates.length }} active weeks</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  differenceInDays,
  differenceInYears,
  differenceInMonths
} from 'date-fns'
import IndividualStat from './IndividualStat.vue'

// Import ActivityCalendar
import ActivityCalendar from './ActivityCalendar.vue'
import { format } from 'date-fns'

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
  postsThisMonth?: number
  wordsThisMonth?: number
  topTags?: string[]
  uniqueTags?: number
  averageReadingTime?: number
  postsByMonth?: Record<string, number>
}

interface StatItem {
  label: string
  value: string
  condition?: boolean
}

const props = defineProps<{
  stats: BlogStats
}>()

// Computed properties for conditional rendering and data formatting
const primaryDetails = computed(() => {
  return `${formatNumber(props.stats.totalWords)} WORDS · ${formatNumber(props.stats.averageWords)} AVG/POST`
})

const hasTagsData = computed(() => {
  return !!(
    props.stats.topTags?.length ||
    props.stats.uniqueTags ||
    props.stats.averageReadingTime
  )
})

const topTagsDisplay = computed(() => {
  if (!props.stats.topTags?.length) return ''
  return props.stats.topTags.slice(0, 3).join(', ')
})

// Simplified - no longer need these verbose computed arrays

// Formatting utilities
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(Math.round(num))
}

// Calculate writing span (e.g., "2 years, 3 months")
const writingSpan = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 'Unknown'

  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const years = differenceInYears(lastDate, firstDate)
  const months = differenceInMonths(lastDate, firstDate) % 12

  if (years === 0) {
    return months === 0 ? 'Less than a month' : `${months} months`
  }
  return months === 0 ? `${years} years` : `${years} years, ${months} months`
})

// Calculate posts per year
const postsPerYear = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 0

  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const days = differenceInDays(lastDate, firstDate)
  if (days <= 0) return props.stats.totalPosts

  const years = days / 365
  return Number((props.stats.totalPosts / years).toFixed(1))
})

// Calculate post activity dates for the calendar
const postActivityDates = computed(() => {
  if (!props.stats.postsByMonth) return []

  // Convert the postsByMonth record to active dates
  const activeDates: string[] = []

  // Using a set to avoid duplicates
  const dates = new Set<string>()

  // Each month key in postsByMonth is in the format YYYY-MM
  Object.entries(props.stats.postsByMonth).forEach(([month, count]) => {
    // For each post in that month, add a date (spread them throughout the month)
    const [year, monthNum] = month.split('-').map(Number)

    // For each post in this month, add an active date
    // Spread them evenly through the month for visualization
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const postInterval = Math.floor(daysInMonth / count)

    for (let i = 0; i < count; i++) {
      const day = 1 + i * postInterval
      // Format as YYYY-MM-DD (standard date format for the calendar)
      const date = format(new Date(year, monthNum - 1, day), 'yyyy-MM-dd')
      dates.add(date)
    }
  })

  return Array.from(dates)
})

// Calculate weekly consistency dates
const weeklyConsistencyDates = computed(() => {
  if (!props.stats.postsByMonth) return []

  // Using a Map to track weeks that have posts
  // Key: ISO week string (YYYY-WW), Value: date string for that week (YYYY-MM-DD)
  const weekMap = new Map<string, string>()

  // Each month key in postsByMonth is in the format YYYY-MM
  Object.entries(props.stats.postsByMonth).forEach(([month, count]) => {
    const [year, monthNum] = month.split('-').map(Number)

    // For each post in this month, add an active week
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const postInterval = Math.floor(daysInMonth / count)

    for (let i = 0; i < count; i++) {
      const day = 1 + i * postInterval
      const postDate = new Date(year, monthNum - 1, day)

      // Get ISO week number (1-53)
      const weekNum = getWeekNumber(postDate)

      // Create a week key in the format YYYY-WW
      const weekKey = `${postDate.getFullYear()}-${weekNum.toString().padStart(2, '0')}`

      // Store one date per week
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, format(postDate, 'yyyy-MM-dd'))
      }
    }
  })

  // Return array of dates representing weeks with posts
  return Array.from(weekMap.values())
})

// Helper to get ISO week number (1-53)
const getWeekNumber = (date: Date): number => {
  const target = new Date(date.valueOf())
  const dayNum = (date.getDay() + 6) % 7 // Make Monday day 0
  target.setDate(target.getDate() - dayNum + 3) // Go to Thursday of this week
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000) // 604800000 = 7 * 24 * 60 * 60 * 1000
}

// Temporal window calculations
const postsThisWeek = computed(() => {
  const today = new Date()
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
  const currentWeek = getWeekNumber(weekStart)
  const currentYear = today.getFullYear()
  
  // Rough estimate based on this month's activity
  const thisMonth = props.stats.postsThisMonth || 0
  return Math.round(thisMonth / 4) // Approximate posts this week
})

const wordsThisWeek = computed(() => {
  return formatNumber(postsThisWeek.value * props.stats.averageWords)
})

const currentStreak = computed(() => {
  // Estimate based on recent activity
  if (!props.stats.lastPost) return 0
  const daysSince = daysSinceLastPost.value
  if (daysSince <= 7) return Math.max(1, Math.ceil(daysSince / 7))
  return 0
})

const daysSinceLastPost = computed(() => {
  if (!props.stats.lastPost) return 999
  const lastDate = new Date(props.stats.lastPost)
  const today = new Date()
  return differenceInDays(today, lastDate)
})

const wordsPerDay = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 0
  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const days = differenceInDays(lastDate, firstDate)
  if (days <= 0) return 0
  return props.stats.totalWords / days
})

const bestMonth = computed(() => {
  if (!props.stats.postsByMonth) return { month: 'Unknown', count: 0 }
  
  let maxCount = 0
  let bestMonthKey = ''
  
  Object.entries(props.stats.postsByMonth).forEach(([month, count]) => {
    if (count > maxCount) {
      maxCount = count
      bestMonthKey = month
    }
  })
  
  if (!bestMonthKey) return { month: 'Unknown', count: 0 }
  
  const [year, month] = bestMonthKey.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthName = monthNames[parseInt(month) - 1]
  
  return { month: `${monthName} ${year}`, count: maxCount }
})

const mostProductiveYear = computed(() => {
  if (!props.stats.postsByMonth) return { year: 'Unknown', count: 0 }
  
  const yearCounts: Record<string, number> = {}
  
  Object.entries(props.stats.postsByMonth).forEach(([month, count]) => {
    const year = month.split('-')[0]
    yearCounts[year] = (yearCounts[year] || 0) + count
  })
  
  let maxCount = 0
  let bestYear = ''
  
  Object.entries(yearCounts).forEach(([year, count]) => {
    if (count > maxCount) {
      maxCount = count
      bestYear = year
    }
  })
  
  return { year: bestYear || 'Unknown', count: maxCount }
})

// Indicator classes for visual feedback
const monthIndicatorClass = computed(() => {
  const posts = props.stats.postsThisMonth || 0
  if (posts >= 4) return 'bg-zinc-800 dark:bg-zinc-200'
  if (posts >= 2) return 'bg-zinc-600 dark:bg-zinc-400'
  return 'bg-zinc-400 dark:bg-zinc-600'
})

const streakIndicatorClass = computed(() => {
  const streak = currentStreak.value
  if (streak >= 4) return 'bg-zinc-800 dark:bg-zinc-200'
  if (streak >= 2) return 'bg-zinc-600 dark:bg-zinc-400'
  return 'bg-zinc-400 dark:bg-zinc-600'
})

const recencyIndicatorClass = computed(() => {
  const days = daysSinceLastPost.value
  if (days <= 7) return 'bg-zinc-800 dark:bg-zinc-200'
  if (days <= 14) return 'bg-zinc-600 dark:bg-zinc-400'
  if (days <= 30) return 'bg-zinc-400 dark:bg-zinc-600'
  return 'bg-red-500' // Red for long gaps
})
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/30 pb-1 mb-3;
  font-size: 0.65rem;
  line-height: 1rem;
}

/* Simplified sparklines */
.writing-sparkline,
.activity-sparkline {
  @apply w-8 h-3 flex items-end gap-px;
}

.writing-sparkline::before,
.writing-sparkline::after {
  @apply bg-zinc-500 dark:bg-zinc-400 w-0.5;
  content: '';
}

.writing-sparkline::before { height: 8px; }
.writing-sparkline::after { height: 12px; }

.activity-sparkline::before,
.activity-sparkline::after {
  @apply bg-zinc-400 dark:bg-zinc-500 w-0.5;
  content: '';
}

.activity-sparkline::before { height: 6px; }
.activity-sparkline::after { height: 10px; }

/* Motivation Dashboard Styles */
.metric-card {
  @apply bg-zinc-50 dark:bg-zinc-900/30 rounded p-2 text-center border border-zinc-200 dark:border-zinc-800;
}

.metric-label {
  @apply text-zinc-500 tracking-[0.15em];
  font-size: 0.6rem;
  line-height: 0.8rem;
}

.progress-row {
  @apply flex items-center justify-between;
  font-size: 10px;
  line-height: 12px;
}

.progress-label {
  @apply text-zinc-600 dark:text-zinc-400 tracking-[0.1em];
  font-size: 9px;
  line-height: 10px;
}

.progress-value {
  @apply text-zinc-800 dark:text-zinc-200 tabular-nums;
  font-size: 10px;
  line-height: 12px;
}

.velocity-label {
  @apply text-zinc-600 dark:text-zinc-400 tracking-[0.1em];
  font-size: 9px;
  line-height: 10px;
}

.velocity-value {
  @apply text-zinc-800 dark:text-zinc-200 tabular-nums font-mono;
  font-size: 10px;
  line-height: 12px;
}

/* Status Indicators */
.month-indicator,
.week-indicator,
.streak-indicator,
.recency-indicator {
  @apply w-2 h-2 rounded-full;
}

.week-indicator {
  @apply bg-zinc-500 dark:bg-zinc-400;
}
</style>
