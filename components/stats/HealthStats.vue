<template>
  <div v-if="stats && hasAnyData" class="space-y-16 font-mono">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <IndividualStat v-if="stats.thisYear.steps > 0" :value="stats.thisYear.steps" size="large" label="STEPS THIS YEAR"
        :details="`${formatNumber(stats.thisYear.averageStepsPerDay)} DAILY AVERAGE`" />

      <div v-if="hasCurrentStats" class="grid grid-cols-2 gap-8">
        <IndividualStat v-if="stats.thisWeek?.steps > 0" :value="stats.thisWeek.steps" size="medium"
          label="STEPS THIS WEEK" :details="`${formatNumber(stats.today?.steps || 0)} TODAY`" />

        <IndividualStat v-if="stats.activity.monthlySteps > 0" :value="stats.activity.monthlySteps" size="medium"
          label="STEPS THIS MONTH" :details="`${stats.activity.flightsClimbed} FLIGHTS CLIMBED`" />
      </div>
    </div>

    <!-- Weekly Activity -->
    <div v-if="hasWeeklyActivity">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-8">WEEKLY ACTIVITY</h4>

      <!-- Weekly Stats Grid -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div v-if="weeklyAverage > 0" class="space-y-2">
          <div class="text-2xl font-mono tabular-nums">
            {{ formatNumber(weeklyAverage) }}
          </div>
          <div class="text-xs tracking-wider text-zinc-500">
            AVG STEPS PER WEEK
          </div>
        </div>

        <div v-if="mostActiveWeek.steps > 0" class="space-y-2">
          <div class="text-2xl font-mono tabular-nums">
            {{ formatNumber(mostActiveWeek.steps) }}
          </div>
          <div class="text-xs tracking-wider text-zinc-500">
            MOST ACTIVE WEEK
            <div class="text-xs">{{ mostActiveWeek.date }}</div>
          </div>
        </div>
      </div>

      <!-- Weekly Steps Chart -->
      <div v-if="hasWeeklyData" class="space-y-4">
        <div v-for="(week, index) in weeklyActivity" :key="week.startDate" class="flex items-center gap-4">
          <div class="w-24 text-xs text-zinc-500">
            {{ formatWeekRange(week.startDate, week.endDate) }}
          </div>
          <div class="flex-grow h-2 bg-zinc-800/50 rounded-none overflow-hidden">
            <div class="h-full bg-zinc-600 rounded-none"
              :style="{ width: `${(week.steps / mostActiveWeek.steps) * 100}%` }" />
          </div>
          <div class="w-20 text-xs text-zinc-500 tabular-nums text-right">
            {{ formatNumber(week.steps) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Aggregated Metrics Section -->
    <div v-if="hasAggregatedMetrics" class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">HEALTH METRICS</h4>

      <!-- Workouts Summary -->
      <div v-if="stats.aggregatedMetrics?.workoutSummary" class="space-y-4">
        <h5 class="text-xs tracking-wider text-zinc-400 uppercase">WORKOUT SUMMARY</h5>
        <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="text-zinc-500">TOTAL WORKOUTS</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.workoutSummary.totalWorkouts }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-zinc-500">TOTAL DURATION</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.workoutSummary.totalDuration }} MIN</div>
            </div>
            <div v-if="stats.aggregatedMetrics.workoutSummary.totalDistance" class="space-y-1">
              <div class="text-zinc-500">TOTAL DISTANCE</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.workoutSummary.totalDistance }} KM</div>
            </div>
            <div v-if="stats.aggregatedMetrics.workoutSummary.totalCalories" class="space-y-1">
              <div class="text-zinc-500">TOTAL CALORIES</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.workoutSummary.totalCalories }}</div>
            </div>
          </div>

          <!-- Workout Types -->
          <div class="mt-4 pt-4 border-t border-zinc-800/50">
            <div class="text-zinc-500 text-xs mb-2">WORKOUT TYPES</div>
            <div class="flex flex-wrap gap-2">
              <div v-for="type in stats.aggregatedMetrics.workoutSummary.workoutTypes" :key="type"
                class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">
                {{ type.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sleep Summary -->
      <div v-if="stats.aggregatedMetrics?.sleepSummary" class="space-y-4">
        <h5 class="text-xs tracking-wider text-zinc-400 uppercase">SLEEP SUMMARY</h5>
        <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="text-zinc-500">AVERAGE DURATION</div>
              <div class="text-xl text-zinc-300">
                <template v-if="stats.aggregatedMetrics.sleepSummary.averageDuration > 0">
                  {{ stats.aggregatedMetrics.sleepSummary.averageDuration }} MIN
                </template>
                <template v-else>
                  NO DATA
                </template>
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-zinc-500">TOTAL RECORDS</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.sleepSummary.totalRecords }}</div>
            </div>
            <div v-if="stats.aggregatedMetrics.sleepSummary.averageQuality" class="space-y-1">
              <div class="text-zinc-500">AVERAGE QUALITY</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.sleepSummary.averageQuality }}/10</div>
            </div>
            <div class="space-y-1">
              <div class="text-zinc-500">LAST RECORD</div>
              <div class="text-zinc-300">{{ formatSimpleDate(stats.aggregatedMetrics.sleepSummary.lastRecordDate) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mindfulness Summary -->
      <div v-if="stats.aggregatedMetrics?.mindfulnessSummary" class="space-y-4">
        <h5 class="text-xs tracking-wider text-zinc-400 uppercase">MINDFULNESS SUMMARY</h5>
        <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <div class="text-zinc-500">TOTAL SESSIONS</div>
              <div class="text-xl text-zinc-300">{{ stats.aggregatedMetrics.mindfulnessSummary.totalSessions }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-zinc-500">TOTAL MINUTES</div>
              <div class="text-xl text-zinc-300">
                <template v-if="stats.aggregatedMetrics.mindfulnessSummary.totalMinutes > 0">
                  {{ stats.aggregatedMetrics.mindfulnessSummary.totalMinutes }} MIN
                </template>
                <template v-else>
                  NO DATA
                </template>
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-zinc-500">LAST SESSION</div>
              <div class="text-zinc-300">{{ formatSimpleDate(stats.aggregatedMetrics.mindfulnessSummary.lastSessionDate)
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-zinc-400 font-mono">
    HEALTH_DATA_UNAVAILABLE
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

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

const props = defineProps<{
  stats?: HealthStats | null
}>()

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

const formatWeekRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // If in the same month, only show month once
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}`
  }

  // Different months
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatSimpleDate = (dateStr: string) => {
  // Handle both ISO date strings and simple YYYY-MM-DD formats
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    // If parsing fails, return the original string
    return dateStr;
  }
}
</script>