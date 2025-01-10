<template>
  <div class="space-y-16">
    <!-- Primary Stats -->
    <div>
      <IndividualStat :value="stats.totalPosts" size="large" label="BLOG POSTS"
        :details="`${formatNumber(stats.totalWords)} WORDS · ${formatNumber(stats.averageWords)} AVG/POST`" />
    </div>

    <!-- Writing Velocity -->
    <div class="space-y-6">
      <h3 class="text-sm tracking-wider text-gray-500">WRITING VELOCITY</h3>
      <div class="space-y-4">
        <!-- Writing Span -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Active Period</span>
          <span class="text-gray-500">{{ writingSpan }}</span>
        </div>

        <!-- Writing Pace -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Writing Pace</span>
          <span class="text-gray-500">{{ writingConsistency }}</span>
        </div>

        <!-- Output -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Annual Output</span>
          <span class="text-gray-500">{{ postsPerYear }} posts · {{ formatNumber(wordsPerYear) }} words</span>
        </div>

        <!-- Writing Volume -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Total Volume</span>
          <span class="text-gray-500">{{ wordsMilestone }}</span>
        </div>
      </div>
    </div>

    <!-- Writing Patterns -->
    <div class="space-y-6">
      <h3 class="text-sm tracking-wider text-gray-500">WRITING PATTERNS</h3>
      <div class="space-y-4">
        <!-- Post Length -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Average Length</span>
          <span class="text-gray-500">{{ formatNumber(stats.averageWords) }} words</span>
        </div>

        <!-- Consistency Score -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Post Frequency</span>
          <span class="text-gray-500">{{ formatNumber(postsPerMonth) }} per month</span>
        </div>

        <!-- Writing Intensity -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Writing Intensity</span>
          <span class="text-gray-500">{{ formatNumber(wordsPerPost) }} words/post</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, differenceInDays, differenceInYears, differenceInMonths } from 'date-fns'
import IndividualStat from './IndividualStat.vue'

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

const props = defineProps<{
  stats: BlogStats
}>()

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
  const years = differenceInDays(lastDate, firstDate) / 365
  return Number((props.stats.totalPosts / years).toFixed(1))
})

// Calculate posts per month
const postsPerMonth = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 0
  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const months = differenceInMonths(lastDate, firstDate)
  return Number((props.stats.totalPosts / months).toFixed(1))
})

// Calculate words per post (moving average)
const wordsPerPost = computed(() => {
  return props.stats.totalWords / props.stats.totalPosts
})

// Calculate words per year
const wordsPerYear = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 0
  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const years = differenceInDays(lastDate, firstDate) / 365
  return Math.round(props.stats.totalWords / years)
})

// Calculate writing consistency score
const writingConsistency = computed(() => {
  if (!props.stats.firstPost || !props.stats.lastPost) return 'N/A'
  const firstDate = new Date(props.stats.firstPost)
  const lastDate = new Date(props.stats.lastPost)
  const totalDays = differenceInDays(lastDate, firstDate)
  const averageDaysBetweenPosts = totalDays / props.stats.totalPosts

  // Score based on average days between posts
  if (averageDaysBetweenPosts <= 7) return 'Weekly Writer'
  if (averageDaysBetweenPosts <= 14) return 'Bi-weekly Writer'
  if (averageDaysBetweenPosts <= 30) return 'Monthly Writer'
  if (averageDaysBetweenPosts <= 90) return 'Quarterly Writer'
  return 'Occasional Writer'
})

// Calculate words milestone
const wordsMilestone = computed(() => {
  const words = props.stats.totalWords
  if (words >= 1000000) return `${(words / 1000000).toFixed(1)}M words`
  if (words >= 100000) return `${(words / 1000).toFixed(0)}K words`
  if (words >= 10000) return `${(words / 1000).toFixed(1)}K words`
  return `${formatNumber(words)} words`
})
</script>