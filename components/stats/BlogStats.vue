<template>
  <div class="font-mono flex flex-col space-y-20">
    <!-- Primary Stats -->
    <!-- <div> -->
    <!--   <IndividualStat :value="stats.totalPosts" size="large" label="BLOG POSTS" :details="primaryDetails" /> -->
    <!-- </div> -->
    <!---->
    <!-- Writing Velocity -->
    <div class="stat-section">
      <h3 class="section-subheader">WRITING VELOCITY</h3>

      <div class="stats-table">
        <div
          v-for="(item, index) in velocityStats"
          :key="index"
          class="stats-row"
        >
          <div class="stats-label">{{ item.label }}</div>
          <div class="stats-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <!-- Content Stats -->
    <div v-if="hasTagsData" class="stat-section">
      <h3 class="section-subheader">CONTENT</h3>

      <div class="stats-table">
        <div
          v-for="(item, index) in contentStats"
          :key="index"
          class="stats-row"
        >
          <div class="stats-label">{{ item.label }}</div>
          <div class="stats-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <!-- Weekly Posting Consistency -->
    <div class="stat-section">
      <h3 class="section-subheader">RECENT WRITING</h3>
      <ActivityCalendar :active-dates="weeklyConsistencyDates" :days="52" />
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

// Velocity stats items
const velocityStats = computed<StatItem[]>(() =>
  [
    // { label: 'Active Period', value: writingSpan.value },
    { label: 'Annual Output', value: `~${postsPerYear.value} posts per year` },
    {
      label: 'Recent Activity',
      value: `${props.stats.postsThisMonth} posts this month`,
      condition: !!props.stats.postsThisMonth
    }
  ].filter((item) => item.condition !== false)
)

// Content stats items
const contentStats = computed<StatItem[]>(() =>
  [
    // {
    //   label: 'Top Topics',
    //   value: topTagsDisplay.value,
    //   condition: !!props.stats.topTags?.length
    // },
    {
      label: 'Topics Covered',
      value: `${props.stats.uniqueTags} unique tags`,
      condition: !!props.stats.uniqueTags
    },
    {
      label: 'Avg. Reading Time',
      value: `${props.stats.averageReadingTime} min`,
      condition: !!props.stats.averageReadingTime
    }
  ].filter((item) => item.condition !== false)
)

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
</script>

<style scoped>
.section-subheader {
  @apply text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/30 pb-1 mb-6;
}

.stats-table {
  @apply grid w-full gap-y-6;
}

.stats-row {
  @apply grid grid-cols-2 items-baseline py-1 border-b border-zinc-800/20;
}

.stats-label {
  @apply text-zinc-500 text-sm tracking-wider font-light;
}

.stats-value {
  @apply text-zinc-300 text-sm tabular-nums tracking-wider text-right font-normal;
}

.stat-section {
  @apply relative space-y-6;
}

.stat-section::before {
  content: '';
  @apply absolute -left-8 top-0 h-full w-px bg-gradient-to-b from-zinc-800/0 via-zinc-800/50 to-zinc-800/0;
}
</style>
