<template>
  <div v-if="stats && hasAnyData" class="space-y-16 font-mono">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <IndividualStat v-if="stats.thisYear.steps > 0" :value="stats.thisYear.steps" size="large" label="STEPS THIS YEAR"
        :details="`${formatNumber(stats.thisYear.averageStepsPerDay)} DAILY AVERAGE`" />

      <div v-if="hasCurrentStats" class="grid grid-cols-2 gap-8">
        <IndividualStat v-if="stats.thisWeek.steps > 0" :value="stats.thisWeek.steps" size="medium"
          label="STEPS THIS WEEK" :details="`${formatNumber(stats.today.steps)} TODAY`" />

        <IndividualStat v-if="stats.activity.monthlySteps > 0" :value="stats.activity.monthlySteps" size="medium"
          label="STEPS THIS MONTH" :details="`${stats.activity.flightsClimbed} FLIGHTS CLIMBED`" />
      </div>
    </div>

    <!-- Activity Trends -->
    <div v-if="hasActivityTrends">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-8">DAILY ACTIVITY</h4>

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

        <div v-if="mostActiveDay.steps > 0" class="space-y-2">
          <div class="text-2xl font-mono tabular-nums">
            {{ formatNumber(mostActiveDay.steps) }}
          </div>
          <div class="text-xs tracking-wider text-zinc-500">
            MOST STEPS IN A DAY
            <div class="text-xs">{{ mostActiveDay.date }}</div>
          </div>
        </div>
      </div>

      <!-- Daily Steps Chart -->
      <div v-if="hasNonZeroSteps" class="space-y-4">
        <div v-for="(steps, index) in nonZeroSteps" :key="stats.trends.daily.dates[reversedIndices[index]]"
          class="flex items-center gap-4">
          <div class="w-24 text-xs text-zinc-500">
            {{ formatDate(stats.trends.daily.dates[reversedIndices[index]]) }}
          </div>
          <div class="flex-grow h-1 bg-zinc-800/50 rounded-none overflow-hidden">
            <div class="h-full bg-zinc-600 rounded-none"
              :style="{ width: `${(steps / mostActiveDay.steps) * 100}%` }" />
          </div>
          <div class="w-16 text-xs text-zinc-500 tabular-nums text-right">
            {{ formatNumber(steps) }}
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

      <!-- Available Metric Types -->
      <div v-if="stats.aggregatedMetrics?.availableMetricTypes?.length" class="space-y-4">
        <h5 class="text-xs tracking-wider text-zinc-400 uppercase">AVAILABLE METRICS</h5>
        <div class="flex flex-wrap gap-2 text-[10px]">
          <div v-for="metricType in stats.aggregatedMetrics.availableMetricTypes" :key="metricType"
            class="px-2 py-1 border border-zinc-800/50 bg-zinc-900/30 text-zinc-400">
            {{ metricType }}
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

// Update the HealthStats type to include aggregatedMetrics instead of rawMetrics
type HealthStats = NonNullable<StatsResponse['health']> & {
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
    props.stats.thisWeek.steps > 0 ||
    props.stats.activity.monthlySteps > 0 ||
    hasAggregatedMetrics.value
})

const hasCurrentStats = computed(() => {
  if (!props.stats) return false
  return props.stats.thisWeek.steps > 0 || props.stats.activity.monthlySteps > 0
})

const hasActivityTrends = computed(() => {
  if (!props.stats?.trends.daily.steps.length) return false
  return props.stats.trends.daily.steps.some(steps => steps > 0)
})

const hasAggregatedMetrics = computed(() => {
  if (!props.stats?.aggregatedMetrics) return false
  return !!(
    props.stats.aggregatedMetrics.workoutSummary ||
    props.stats.aggregatedMetrics.sleepSummary ||
    props.stats.aggregatedMetrics.mindfulnessSummary ||
    props.stats.aggregatedMetrics.availableMetricTypes?.length
  )
})

const nonZeroSteps = computed(() => {
  if (!props.stats?.trends.daily.steps) return []
  return props.stats.trends.daily.steps
    .slice()
    .reverse()
    .filter(steps => steps > 0)
})

const hasNonZeroSteps = computed(() => nonZeroSteps.value.length > 0)

const reversedIndices = computed(() => {
  if (!props.stats?.trends.daily.steps) return []
  return [...Array(props.stats.trends.daily.steps.length).keys()]
    .reverse()
    .filter((_, i) => props.stats!.trends.daily.steps[props.stats!.trends.daily.steps.length - 1 - i] > 0)
})

const weeklyAverage = computed(() => {
  if (!props.stats?.trends.weekly.steps.length) return 0
  const nonZeroWeeks = props.stats.trends.weekly.steps.filter(steps => steps > 0)
  if (nonZeroWeeks.length === 0) return 0
  return Math.round(nonZeroWeeks.reduce((sum, steps) => sum + steps, 0) / nonZeroWeeks.length)
})

const mostActiveDay = computed(() => {
  if (!props.stats?.trends.daily.steps.length) return { steps: 0, date: '' }
  const maxSteps = Math.max(...props.stats.trends.daily.steps)
  if (maxSteps === 0) return { steps: 0, date: '' }
  const maxIndex = props.stats.trends.daily.steps.indexOf(maxSteps)
  return {
    steps: maxSteps,
    date: formatDate(props.stats.trends.daily.dates[maxIndex])
  }
})

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