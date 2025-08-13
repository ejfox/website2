<template>
  <div v-if="stats && hasAnyData" ref="healthStatsRef" class="space-y-16 font-mono">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <div v-if="stats.thisYear.steps > 0" class="individual-stat-large">
        <div class="stat-value">
          <AnimatedNumber :value="stats.thisYear.steps" format="commas" :duration="timing.dramatic" priority="primary" />
        </div>
        <div class="stat-label">
          STEPS THIS YEAR
        </div>
        <div class="stat-details">
          <AnimatedNumber :value="stats.thisYear.averageStepsPerDay" format="commas" :duration="timing.dramatic" priority="secondary" /> DAILY AVERAGE
        </div>
      </div>

      <div v-if="hasCurrentStats" class="grid grid-cols-2 gap-8">
        <IndividualStat
          v-if="stats.thisWeek?.steps > 0" :value="stats.thisWeek.steps" size="medium"
          label="STEPS THIS WEEK" :details="`${formatNumber(stats.today?.steps || 0)} TODAY`"
        />

        <IndividualStat
          v-if="stats.activity.monthlySteps > 0" :value="stats.activity.monthlySteps" size="medium"
          label="STEPS THIS MONTH" :details="`${stats.activity.flightsClimbed} FLIGHTS CLIMBED`"
        />
      </div>
    </div>

    <!-- Activity Momentum -->
    <div v-if="hasWeeklyActivity">
      <StatsSectionHeader title="ACTIVITY MOMENTUM" />
      <div class="momentum-stats grid grid-cols-3 gap-4 mb-6">
        <div ref="momentumRef" class="momentum-stat">
          <div class="momentum-value">
            <AnimatedNumber :value="currentStreak" format="default" :duration="timing.dramatic" priority="secondary" />
          </div>
          <div class="momentum-label">
            CURRENT STREAK
          </div>
        </div>
        <div class="momentum-stat">
          <div class="momentum-value">
            <AnimatedNumber :value="longestStreak" format="default" :duration="timing.dramatic" :delay="100" priority="secondary" />
          </div>
          <div class="momentum-label">
            LONGEST STREAK
          </div>
        </div>
        <div class="momentum-stat">
          <div class="momentum-value">
            <AnimatedNumber :value="activeWeeks" format="default" :duration="timing.slow" priority="tertiary" /><span class="text-zinc-500">/<AnimatedNumber :value="totalWeeks" format="default" :duration="timing.slow" :delay="200" priority="tertiary" /></span>
          </div>
          <div class="momentum-label">
            ACTIVE WEEKS
          </div>
        </div>
      </div>

      <ActivityCalendar :active-dates="activityDates" :active-color="'#10b981'" :days="90" />
    </div>

    <!-- Weekly Activity -->
    <div v-if="hasWeeklyActivity">
      <StatsSectionHeader title="WEEKLY ACTIVITY" />

      <!-- Weekly Stats Grid -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <StatSummary v-if="weeklyAverage > 0" :value="formatNumber(weeklyAverage)" label="AVG STEPS PER WEEK" />

        <StatSummary
          v-if="mostActiveWeek.steps > 0" :value="formatNumber(mostActiveWeek.steps)"
          label="MOST ACTIVE WEEK"
        >
          <div class="text-xs">
            {{ mostActiveWeek.date }}
          </div>
        </StatSummary>
      </div>

      <!-- Weekly Steps Chart -->
      <div v-if="hasWeeklyData" ref="weeklyBarsRef" class="space-y-4">
        <div v-for="week in weeklyActivity" :key="week.startDate" class="weekly-activity-row">
          <div class="week-label">
            {{ formatWeekRange(week.startDate, week.endDate) }}
          </div>
          <div class="activity-bar-container">
            <div class="activity-bar" :style="{ width: `${(week.steps / mostActiveWeek.steps) * 100}%` }" />
          </div>
          <div class="step-count">
            <AnimatedNumber :value="week.steps" format="commas" :duration="timing.slow" priority="tertiary" />
          </div>
        </div>
      </div>
    </div>

    <!-- Aggregated Metrics Section -->
    <div v-if="hasAggregatedMetrics" class="space-y-8">
      <StatsSectionHeader title="HEALTH METRICS" />

      <!-- Workouts Summary -->
      <MetricSection v-if="stats.aggregatedMetrics?.workoutSummary" title="WORKOUT SUMMARY">
        <template #stats>
          <MetricStatsGrid :items="workoutStats" />

          <!-- Workout Types -->
          <div class="metric-subsection">
            <div class="metric-subtitle">
              WORKOUT TYPES
            </div>
            <div class="tag-container">
              <div v-for="type in stats.aggregatedMetrics.workoutSummary.workoutTypes" :key="type" class="tag-item">
                {{ type.toUpperCase() }}
              </div>
            </div>
          </div>
        </template>
      </MetricSection>

      <!-- Sleep Summary -->
      <MetricSection v-if="stats.aggregatedMetrics?.sleepSummary" title="SLEEP SUMMARY">
        <template #stats>
          <MetricStatsGrid :items="sleepStats" />
        </template>
      </MetricSection>

      <!-- Mindfulness Summary -->
      <MetricSection v-if="stats.aggregatedMetrics?.mindfulnessSummary" title="MINDFULNESS SUMMARY">
        <template #stats>
          <MetricStatsGrid :items="mindfulnessStats" />
        </template>
      </MetricSection>
    </div>
  </div>
  <StatsDataState v-else message="HEALTH_DATA_UNAVAILABLE" />
</template>

<script setup lang="ts">
import { computed, h, ref, onMounted, nextTick } from 'vue'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber, formatWeekRange } from '~/composables/useNumberFormat'
// NUKED BY BLOODHOUND: import { animate, stagger as _stagger, onScroll } from '~/anime.esm.js'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

// Stat summary component for consistent stat display
const StatSummary = (props: { value: string | number, label: string }, { slots }: { slots: Record<string, () => any> }) => {
  return h('div', { class: 'stat-summary' }, [
    h('div', { class: 'stat-value' }, props.value),
    h('div', { class: 'stat-label' }, [
      props.label,
      slots.default?.()
    ])
  ])
}

// Metric section component for health metrics
const MetricSection = (props: { title: string }, { slots }: { slots: Record<string, () => any> }) => {
  return h('div', { class: 'space-y-4' }, [
    h('h5', { class: 'metric-title' }, props.title),
    h('div', { class: 'metric-box' }, [
      slots.stats?.()
    ])
  ])
}

// Component for metric stats grid
const MetricStatsGrid = (props: { items: Array<{ label: string, value: string | number, class?: string }> }) => {
  return h('div', { class: 'grid grid-cols-2 gap-4 text-xs' },
    props.items.map(item => {
      return h('div', { class: 'stat-item' }, [
        h('div', { class: 'stat-label' }, item.label),
        h('div', { class: item.class || 'text-xl text-zinc-300' }, item.value)
      ])
    })
  )
}

// Update the HealthStats type to include the new weekly activity data structure
type HealthStats = NonNullable<StatsResponse['health']> & {
  weeklyActivity?: Array<{
    startDate: string
    endDate: string
    steps: number
    activeMinutes: number
    days: number
    caloriesBurned: number
    distance: number
  }>,
  monthlyActivity?: Array<{
    month: string
    steps: number
    activeMinutes: number
    days: number
  }>,
  aggregatedMetrics?: {
    availableMetricTypes: string[]
    sleepSummary?: {
      averageDuration: number // in minutes
      averageQuality?: number // if available
      totalRecords: number
      lastRecordDate: string
    }
    workoutSummary?: {
      totalWorkouts: number
      totalDuration: number // in minutes
      totalDistance?: number // in km
      totalCalories?: number
      lastWorkoutDate: string
      workoutTypes: string[]
    }
    mindfulnessSummary?: {
      totalSessions: number
      totalMinutes: number
      lastSessionDate: string
    }
  }
}

interface MetricItem {
  label: string
  value: string | number
  class?: string
}

const props = defineProps<{
  stats?: HealthStats | null
}>()

const { timing, staggers } = useAnimations()

// Data availability checks
const hasAnyData = computed(() => {
  if (!props.stats) return false
  return props.stats.thisYear.steps > 0 ||
    (props.stats.thisWeek?.steps || 0) > 0 ||
    props.stats.activity.monthlySteps > 0 ||
    hasAggregatedMetrics.value
})

const hasCurrentStats = computed(() => {
  if (!props.stats) return false
  return (props.stats.thisWeek?.steps || 0) > 0 || props.stats.activity.monthlySteps > 0
})

const hasWeeklyActivity = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return false
  return props.stats.weeklyActivity.some(week => week.steps > 0)
})

const hasWeeklyData = computed(() => {
  return !!props.stats?.weeklyActivity?.length
})

const weeklyActivity = computed(() => {
  return props.stats?.weeklyActivity || []
})

const hasAggregatedMetrics = computed(() => {
  if (!props.stats?.aggregatedMetrics) return false
  return !!(
    props.stats.aggregatedMetrics.workoutSummary ||
    props.stats.aggregatedMetrics.sleepSummary ||
    props.stats.aggregatedMetrics.mindfulnessSummary
  )
})

// Statistics computations
const weeklyAverage = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return 0
  const nonZeroWeeks = props.stats.weeklyActivity.filter(week => week.steps > 0)
  if (nonZeroWeeks.length === 0) return 0
  return Math.round(nonZeroWeeks.reduce((sum, week) => sum + week.steps, 0) / nonZeroWeeks.length)
})

const mostActiveWeek = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return { steps: 0, date: '' }

  const maxWeek = [...(props.stats.weeklyActivity || [])].sort((a, b) => b.steps - a.steps)[0]
  if (!maxWeek || maxWeek.steps === 0) return { steps: 0, date: '' }

  return {
    steps: maxWeek.steps,
    date: formatWeekRange(maxWeek.startDate, maxWeek.endDate)
  }
})

// Workout stats items
const workoutStats = computed<MetricItem[]>(() => {
  if (!props.stats?.aggregatedMetrics?.workoutSummary) return []

  const summary = props.stats.aggregatedMetrics.workoutSummary
  const items: MetricItem[] = [
    { label: 'TOTAL WORKOUTS', value: summary.totalWorkouts },
    { label: 'TOTAL DURATION', value: `${summary.totalDuration} MIN` }
  ]

  if (summary.totalDistance) {
    items.push({ label: 'TOTAL DISTANCE', value: `${summary.totalDistance} KM` })
  }

  if (summary.totalCalories) {
    items.push({ label: 'TOTAL CALORIES', value: summary.totalCalories })
  }

  return items
})

// Sleep stats items
const sleepStats = computed<MetricItem[]>(() => {
  if (!props.stats?.aggregatedMetrics?.sleepSummary) return []

  const summary = props.stats.aggregatedMetrics.sleepSummary
  const items: MetricItem[] = [
    {
      label: 'AVERAGE DURATION',
      value: summary.averageDuration > 0 ? `${summary.averageDuration} MIN` : 'NO DATA'
    },
    { label: 'TOTAL RECORDS', value: summary.totalRecords }
  ]

  if (summary.averageQuality) {
    items.push({ label: 'AVERAGE QUALITY', value: `${summary.averageQuality}/10` })
  }

  items.push({
    label: 'LAST RECORD',
    value: formatSimpleDate(summary.lastRecordDate),
    class: 'text-zinc-300'
  })

  return items
})

// Mindfulness stats items
const mindfulnessStats = computed<MetricItem[]>(() => {
  if (!props.stats?.aggregatedMetrics?.mindfulnessSummary) return []

  const summary = props.stats.aggregatedMetrics.mindfulnessSummary
  return [
    { label: 'TOTAL SESSIONS', value: summary.totalSessions },
    {
      label: 'TOTAL MINUTES',
      value: summary.totalMinutes > 0 ? `${summary.totalMinutes} MIN` : 'NO DATA'
    },
    {
      label: 'LAST SESSION',
      value: formatSimpleDate(summary.lastSessionDate),
      class: 'text-zinc-300'
    }
  ]
})

// Simple date formatting helper
const formatSimpleDate = (dateStr: string) => {
  if (!dateStr) return ''
  
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } catch (_e) {
    return dateStr
  }
}

// Activity calendar data
const activityDates = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return []

  // Extract dates from weekly activity
  const dates: string[] = []

  props.stats.weeklyActivity.forEach(week => {
    if (week.steps > 0) {
      // Add the start date of active weeks
      dates.push(week.startDate)

      // For simplicity, also add the day after the start date
      // This gives a better representation of weekly activity
      const nextDay = new Date(week.startDate)
      nextDay.setDate(nextDay.getDate() + 1)
      dates.push(nextDay.toISOString().split('T')[0])
    }
  })

  return dates
})

// Streak calculations
const currentStreak = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return 0
  let streak = 0
  for (let i = props.stats.weeklyActivity.length - 1; i >= 0; i--) {
    if (props.stats.weeklyActivity[i].steps > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
})

const longestStreak = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return 0
  let maxStreak = 0
  let currentStreak = 0
  for (let i = 0; i < props.stats.weeklyActivity.length; i++) {
    if (props.stats.weeklyActivity[i].steps > 0) {
      currentStreak++
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak
      }
    } else {
      currentStreak = 0
    }
  }
  return maxStreak
})

const activeWeeks = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return 0
  return props.stats.weeklyActivity.filter(week => week.steps > 0).length
})

const totalWeeks = computed(() => {
  if (!props.stats?.weeklyActivity?.length) return 0
  return props.stats.weeklyActivity.length
})

// Animation refs
const healthStatsRef = ref<HTMLElement | null>(null)
const _primaryStatsRef = ref<HTMLElement | null>(null)
const momentumRef = ref<HTMLElement | null>(null)
const weeklyBarsRef = ref<HTMLElement | null>(null)

const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!healthStatsRef.value) return

    if (momentumRef.value) {
      const momentumStats = momentumRef.value.parentElement?.querySelectorAll('.momentum-stat')
      if (momentumStats?.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(momentumStats), {
          opacity: [0, 1],
          translateY: [20, 0],
          scale: [0.9, 1.05, 1],
          duration: timing.value.slow,
          delay: _stagger(staggers.loose),
          ease: 'outElastic(1, .8)',
          autoplay: onScroll({ target: momentumRef.value, onEnter: () => true })
        })
      }
    }
    
    if (weeklyBarsRef.value && hasWeeklyData.value) {
      const activityBars = weeklyBarsRef.value.querySelectorAll('.activity-bar')
      if (activityBars.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(activityBars), {
          scaleX: [0, 1.1, 1],
          scaleY: [0.3, 1.3, 1],
          duration: timing.value.dramatic,
          delay: _stagger(staggers.normal),
          ease: 'outElastic(1, .8)',
          autoplay: onScroll({ target: weeklyBarsRef.value, onEnter: () => true })
        })
      }
    }
  })
}

onMounted(() => {
  setupScrollAnimations()
})
</script>

<style scoped>
/* Individual stat styles for AnimatedNumber replacement */
.individual-stat-large {
  @apply text-center;
}

/* Uses global typography classes */

.stat-summary {
  @apply space-y-2;
}

.stat-value {
  @apply text-2xl font-mono tabular-nums;
}

.stat-label {
  @apply text-xs tracking-wider text-zinc-500;
}

.weekly-activity-row {
  @apply flex items-center gap-4 py-2;
}

.week-label {
  @apply w-32 text-xs;
}

.activity-bar-container {
  @apply flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden;
}

.activity-bar {
  @apply h-full bg-emerald-500 rounded-full;
}

.step-count {
  @apply w-20 text-right text-xs;
}

.metric-title {
  @apply text-xs tracking-wider text-zinc-400 uppercase;
}

.metric-box {
  @apply border border-zinc-800/50 p-4 bg-zinc-900/30;
}

.metric-subsection {
  @apply mt-4;
}

.metric-subtitle {
  @apply text-xs text-zinc-500 mb-2;
}

.tag-container {
  @apply flex flex-wrap gap-2 mt-2;
}

.tag-item {
  @apply px-2 py-1 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800;
}

.stat-item {
  @apply space-y-1;
}


/* Momentum stat styles */
.momentum-stats {
  @apply my-4;
}

.momentum-stat {
  @apply p-3 rounded-md border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center;
}

.momentum-value {
  @apply text-2xl font-bold mb-1;
}

.momentum-label {
  @apply text-xs text-zinc-500;
}
</style>