<template>
  <div class="font-mono">
    <!-- Main Stats -->
    <div v-if="hasStats">
      <div class="space-y-4">
        <IndividualStat
          :value="stats.typingStats.bestWPM"
          size="large"
          label="BEST WPM"
          :details="statsDetails"
        />
      </div>
    </div>
    <div v-else class="text-center py-6">
      <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
        NO TYPING DATA
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        Visit
        <a
          href="https://monkeytype.com"
          target="_blank"
          class="text-zinc-800 dark:text-zinc-300 hover:underline"
        >MonkeyType.com</a>
        to start tracking
      </div>
    </div>

    <!-- Recent Tests -->
    <div v-if="hasRecentTests" class="mt-8 space-y-6">
      <StatsSectionHeader title="RECENT TESTS" />

      <div class="space-y-4">
        <div v-for="test in recentTests" :key="test.timestamp" class="test-row">
          <div class="flex-none">
            <!-- Simplified date format -->
            <span class="text-zinc-400 text-2xs tabular-nums">{{
              formatDateMinimal(test.timestamp)
            }}</span>
          </div>
          <div v-if="hasTestType(test)" class="test-type">
            {{ formatTestTypeMinimal(test) }}
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <span class="wpm-value">{{ test.wpm }}</span>
            <span class="accuracy-value">{{ test.accuracy.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div v-if="stats.typingStats" class="mt-8 space-y-6">
      <StatsSectionHeader title="PERFORMANCE" />

      <div class="grid grid-cols-2 gap-4">
        <StatDisplay label="TESTS" :value="stats.typingStats.testsCompleted" />
        <!-- <StatDisplay label="BEST ACC" :value="`${stats.typingStats.bestAccuracy}%`" /> -->
        <StatDisplay
          v-if="stats.typingStats.bestConsistency"
          label="CONSISTENCY"
          :value="`${stats.typingStats.bestConsistency}%`"
        />
        <StatDisplay
          v-if="stats.typingStats.averageWpm"
          label="AVG WPM"
          :value="Math.round(stats.typingStats.averageWpm)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'

interface MonkeyTypeTest {
  timestamp: string
  wpm: number
  accuracy: number
  mode?: string
  duration?: number
  language?: string
  wordCount?: number
  difficulty?: string
  consistency?: number
}

interface MonkeyTypeStats {
  typingStats: {
    bestWPM: number
    testsCompleted: number
    bestAccuracy: number
    bestConsistency: number
    averageWPM?: number
    recentTests?: Array<MonkeyTypeTest>
    testTypeDistribution?: Record<string, number>
  }
}

const props = defineProps<{
  stats: MonkeyTypeStats
}>()

// Computed properties for conditional rendering and data formatting
const hasRecentTests = computed(
  () => !!props.stats.typingStats?.recentTests?.length
)

const recentTests = computed(() => {
  if (!props.stats.typingStats?.recentTests) return []

  return [...props.stats.typingStats.recentTests]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5)
})

const statsDetails = computed(() => {
  const { testsCompleted, bestAccuracy } = props.stats.typingStats
  return `${testsCompleted} TESTS · ${bestAccuracy}% ACC`
})

// Test type distribution data
const _testTypeDistribution = computed(() => {
  // If available, use the API's test type distribution
  if (props.stats.typingStats?.testTypeDistribution) {
    return props.stats.typingStats.testTypeDistribution
  }

  // Otherwise, calculate from recent tests as fallback
  if (!hasRecentTests.value) return {}

  const distribution: Record<string, number> = {}
  recentTests.value.forEach((test) => {
    const type = _getTestType(test)
    distribution[type] = (distribution[type] || 0) + 1
  })

  return distribution
})

const _totalTests = computed(() => {
  return (
    Object.values(_testTypeDistribution.value).reduce(
      (sum, count) => sum + count,
      0
    ) || 1
  )
})

const _hasTestTypes = computed(() => {
  return Object.keys(_testTypeDistribution.value).length > 0
})

// Helper to determine the test type from a test object
const _getTestType = (test: MonkeyTypeTest): string => {
  if (test.duration) return `time_${test.duration}`
  if (test.wordCount) return `words_${test.wordCount}`
  return 'unknown'
}

// Format test preference display
const _formatTestPref = (type: string): string => {
  if (type.startsWith('time_')) {
    return `${type.split('_')[1]}s TEST`
  }
  if (type.startsWith('words_')) {
    return `${type.split('_')[1]} WORDS`
  }
  return type.toUpperCase()
}

// Format utilities for minimal date display
const formatDateMinimal = (timestamp: string): string => {
  const date = new Date(timestamp)
  return format(date, 'MM.dd').toLowerCase()
}

// Determine if test has meaningful type info
const hasTestType = (test: MonkeyTypeTest): boolean => {
  return !!(test.duration || test.wordCount || test.mode)
}

// Format test type in minimal style
const formatTestTypeMinimal = (test: MonkeyTypeTest): string => {
  if (test.duration) {
    return `${test.duration}s`
  } else if (test.wordCount) {
    return `${test.wordCount}w`
  } else if (test.mode && test.mode.toLowerCase() !== 'time') {
    return test.mode.toLowerCase()
  }
  return ''
}

// Add a computed property to check if we have stats
const hasStats = computed(() => {
  return !!props.stats.typingStats?.bestWPM
})

// Reusable stat display component
const StatDisplay = (props: { label: string; value: string | number }) => {
  return h('div', { class: 'stat-item' }, [
    h('div', { class: 'stat-label' }, props.label),
    h('div', { class: 'stat-value' }, props.value)
  ])
}
</script>

<style scoped>
.test-row {
  @apply flex items-center text-xs;
}

.test-type {
  @apply text-zinc-500 ml-2;
  font-size: 0.65rem;
  line-height: 1rem;
}

.wpm-value {
  @apply text-zinc-700 dark:text-zinc-400 tabular-nums font-medium;
}

.accuracy-value {
  @apply text-zinc-500 tabular-nums w-12 text-right;
}

/* Using shared styles from global.css for .stat-item, .stat-label, .stat-value */
</style>
