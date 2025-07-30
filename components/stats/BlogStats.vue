<template>
  <div ref="blogStatsRef" class="space-y-3 font-mono">
    <!-- Current Status - Big Numbers for Motivation -->
    <div ref="statusSectionRef">
      <StatsSectionHeader title="WRITING STATUS" />
      <div ref="statusGridRef" class="grid grid-cols-2 gap-2">
        <div ref="postsCardRef" class="metric-card">
          <div class="stat-value">
            {{ stats.totalPosts }}
          </div>
          <div class="stat-label">
            TOTAL POSTS
          </div>
        </div>
        <div ref="wordsCardRef" class="metric-card">
          <div class="stat-value">
            {{ formatNumber(stats.totalWords) }}
          </div>
          <div class="stat-label">
            TOTAL WORDS
          </div>
        </div>
      </div>
    </div>

    <!-- Temporal Windows - Motivation Dashboard -->
    <div ref="progressSectionRef">
      <StatsSectionHeader title="PROGRESS TRACKER" />
      <div ref="progressListRef" class="space-y-1.5">
        <!-- This Month -->
        <div ref="progressRowRefs" class="progress-row">
          <div class="flex items-center gap-2">
            <div class="status-indicator" :class="monthIndicatorClass"></div>
            <span class="progress-label">THIS MONTH</span>
          </div>
          <div class="progress-value">
            {{ stats.postsThisMonth || 0 }} posts · {{ formatNumber(stats.wordsThisMonth || 0) }} words
          </div>
        </div>

        <!-- This Week (estimated) -->
        <div ref="progressRowRefs" class="progress-row">
          <div class="flex items-center gap-2">
            <div class="status-indicator bg-zinc-500 dark:bg-zinc-400"></div>
            <span class="progress-label">THIS WEEK</span>
          </div>
          <div class="progress-value">
            {{ postsThisWeek }} posts · {{ wordsThisWeek }} words
          </div>
        </div>

        <!-- Writing Streak -->
        <div ref="progressRowRefs" class="progress-row">
          <div class="flex items-center gap-2">
            <div class="status-indicator" :class="streakIndicatorClass"></div>
            <span class="progress-label">CURRENT STREAK</span>
          </div>
          <div class="progress-value">
            {{ currentStreak }} {{ currentStreak === 1 ? 'week' : 'weeks' }}
          </div>
        </div>

        <!-- Days Since Last Post -->
        <div ref="progressRowRefs" class="progress-row">
          <div class="flex items-center gap-2">
            <div class="status-indicator" :class="recencyIndicatorClass"></div>
            <span class="progress-label">LAST POST</span>
          </div>
          <div class="progress-value">
            {{ daysSinceLastPost }} {{ daysSinceLastPost === 1 ? 'day' : 'days' }} ago
          </div>
        </div>
      </div>
    </div>

    <!-- Velocity & Patterns -->
    <div ref="velocitySectionRef">
      <StatsSectionHeader title="VELOCITY" />
      <div ref="velocityListRef" class="space-y-1.5">
        <div ref="velocityRowRefs" class="flex items-center justify-between">
          <span class="velocity-label">POSTS/YEAR</span>
          <span class="velocity-value">{{ postsPerYear.toFixed(1) }}</span>
        </div>
        <div ref="velocityRowRefs" class="flex items-center justify-between">
          <span class="velocity-label">WORDS/POST</span>
          <span class="velocity-value">{{ formatNumber(stats.averageWords) }}</span>
        </div>
        <div ref="velocityRowRefs" class="flex items-center justify-between">
          <span class="velocity-label">WORDS/DAY</span>
          <span class="velocity-value">{{ wordsPerDay.toFixed(0) }}</span>
        </div>
        <div v-if="stats.averageReadingTime" ref="velocityRowRefs" class="flex items-center justify-between">
          <span class="velocity-label">AVG READ TIME</span>
          <span class="velocity-value">{{ stats.averageReadingTime }}min</span>
        </div>
      </div>
    </div>

    <!-- Seasonal Analysis -->
    <div>
      <StatsSectionHeader title="PATTERNS" />
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="velocity-label">BEST MONTH</span>
          <span class="velocity-value">{{ bestMonth.month }} ({{ bestMonth.count }} posts)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="velocity-label">MOST PRODUCTIVE</span>
          <span class="velocity-value">{{ mostProductiveYear.year }} ({{ mostProductiveYear.count }} posts)</span>
        </div>
        <div v-if="stats.uniqueTags" class="flex items-center justify-between">
          <span class="velocity-label">TOPICS</span>
          <span class="velocity-value">{{ stats.uniqueTags }} unique</span>
        </div>
      </div>
    </div>

    <!-- Writing Activity Calendar -->
    <div ref="calendarSectionRef">
      <StatsSectionHeader title="ACTIVITY HEATMAP" />
      <div ref="calendarRef">
        <ActivityCalendar :active-dates="weeklyConsistencyDates" :days="365" title="" />
      </div>
      <div ref="calendarStatsRef" class="flex justify-between text-zinc-500 mt-1" style="font-size: 9px; line-height: 10px;">
        <span>{{ Math.round((weeklyConsistencyDates.length / 52) * 100) }}% of weeks active</span>
        <span>{{ weeklyConsistencyDates.length }} active weeks</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import {
  differenceInDays,
  differenceInYears,
  differenceInMonths,
  format
} from 'date-fns'
import { stagger as _stagger, createTimeline } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'
import ActivityCalendar from './ActivityCalendar.vue'
import { useNumberFormat } from '../../composables/useNumberFormat'
import StatsSectionHeader from './StatsSectionHeader.vue'

// Use the shared number formatting utilities
const { formatNumber } = useNumberFormat()

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

interface _StatItem {
  label: string
  value: string
  condition?: boolean
}

const props = defineProps<{
  stats: BlogStats
}>()

const { timing, easing } = useAnimations()

// Computed properties for conditional rendering and data formatting
const _primaryDetails = computed(() => {
  return `${formatNumber(props.stats.totalWords)} WORDS · ${formatNumber(props.stats.averageWords)} AVG/POST`
})

const _hasTagsData = computed(() => {
  return !!(
    props.stats.topTags?.length ||
    props.stats.uniqueTags ||
    props.stats.averageReadingTime
  )
})

const _topTagsDisplay = computed(() => {
  if (!props.stats.topTags?.length) return ''
  return props.stats.topTags.slice(0, 3).join(', ')
})

// Simplified - no longer need these verbose computed arrays

// Formatting utilities (now using shared utility)
// formatNumber is imported from useNumberFormat()

// Calculate writing span (e.g., "2 years, 3 months")
const _writingSpan = computed(() => {
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
const _postActivityDates = computed(() => {
  if (!props.stats.postsByMonth) return []

  // Convert the postsByMonth record to active dates
  const _activeDates: string[] = []

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
  const _currentWeek = getWeekNumber(weekStart)
  const _currentYear = today.getFullYear()
  
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

// Animation refs
const blogStatsRef = ref<HTMLElement | null>(null)
const statusSectionRef = ref<HTMLElement | null>(null)
const statusGridRef = ref<HTMLElement | null>(null)
const postsCardRef = ref<HTMLElement | null>(null)
const wordsCardRef = ref<HTMLElement | null>(null)
const progressSectionRef = ref<HTMLElement | null>(null)
const progressListRef = ref<HTMLElement | null>(null)
const progressRowRefs = ref<HTMLElement[]>([])
const velocitySectionRef = ref<HTMLElement | null>(null)
const velocityListRef = ref<HTMLElement | null>(null)
const velocityRowRefs = ref<HTMLElement[]>([])
const calendarSectionRef = ref<HTMLElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const calendarStatsRef = ref<HTMLElement | null>(null)

// Blog stats reveal animation
const animateBlogStats = async () => {
  if (process.server) return
  
  await nextTick()
  
  const timeline = createTimeline()
  
  // ANIME.JS SUPERPOWER: Perfect timeline with overlap control
  if (blogStatsRef.value) {
    timeline.add({
      targets: blogStatsRef.value,
      opacity: [0, 1],
      scale: [0.95, 1.02, 1],
      rotateX: [-5, 0], // 3D rotation impossible in CSS keyframes
      filter: ['blur(1px)', 'blur(0px)'],
      duration: timing.expressive,
      ease: easing.expressive
    })
  }
  
  // ANIME.JS SUPERPOWER: Directional stagger with 3D transforms
  const statusCards = [postsCardRef.value, wordsCardRef.value].filter(Boolean)
  if (statusCards.length) {
    timeline.add({
      targets: statusCards,
      keyframes: [
        { opacity: 0, scale: 0.7, rotateY: -60, translateZ: 30, filter: 'blur(1px)' },
        { opacity: 0.8, scale: 1.05, rotateY: 10, translateZ: -10, filter: 'blur(0.3px)' },
        { opacity: 1, scale: 1, rotateY: 0, translateZ: 0, filter: 'blur(0px)' }
      ],
      duration: timing.slower,
      delay: _stagger(120, { direction: 'reverse' }),
      ease: easing.expressive
    }, '-=400')
  }
  
  // Stage 3: Progress rows cascade
  if (progressListRef.value) {
    const progressRows = progressListRef.value.querySelectorAll('.progress-row')
    if (progressRows.length) {
      timeline.add({
        targets: Array.from(progressRows),
        opacity: [0, 1],
        translateX: [-20, 0],
        scale: [0.92, 1.02, 1],
        duration: timing.slow,
        delay: _stagger(80, { from: 'first' }),
        ease: easing.productive
      }, '-=300')
    }
  }
  
  // Stage 4: Velocity metrics matrix reveal
  if (velocityListRef.value) {
    const velocityRows = velocityListRef.value.children
    if (velocityRows.length) {
      timeline.add({
        targets: Array.from(velocityRows),
        keyframes: [
          { opacity: 0, scale: 0.8, rotateZ: -5, filter: 'blur(0.5px)' },
          { opacity: 0.8, scale: 1.1, rotateZ: 2, filter: 'blur(0.2px)' },
          { opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)' }
        ],
        duration: timing.slow,
        delay: _stagger(80, { from: 'center' }),
        ease: 'outElastic(1, .8)'
      }, '-=200')
    }
  }
  
  // Stage 5: Calendar dramatic reveal
  if (calendarRef.value) {
    timeline.add({
      targets: calendarRef.value,
      keyframes: [
        { opacity: 0, scale: 0.9, rotateX: -15, filter: 'blur(1px)' },
        { opacity: 0.8, scale: 1.03, rotateX: 5, filter: 'blur(0.3px)' },
        { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
      ],
      duration: timing.expressive,
      ease: 'outElastic(1, .8)'
    }, '-=100')
  }
  
  // Stage 6: Calendar stats reveal
  if (calendarStatsRef.value) {
    timeline.add({
      targets: calendarStatsRef.value,
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.9, 1],
      duration: timing.normal,
      ease: easing.standard
    }, '-=200')
  }
}

onMounted(() => {
  animateBlogStats()
})

// Indicator classes for visual feedback - using shared utilities
const getIndicatorClass = (value: number, thresholds: number[]) => {
  if (value >= thresholds[0]) return 'bg-zinc-800 dark:bg-zinc-200'
  if (value >= thresholds[1]) return 'bg-zinc-600 dark:bg-zinc-400'
  return 'bg-zinc-400 dark:bg-zinc-600'
}

const monthIndicatorClass = computed(() => {
  const posts = props.stats.postsThisMonth || 0
  return getIndicatorClass(posts, [4, 2])
})

const streakIndicatorClass = computed(() => {
  const streak = currentStreak.value
  return getIndicatorClass(streak, [4, 2])
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
/* Using shared styles from global.css */
</style>
