<template>
  <div v-if="stats && hasAnyData" class="space-y-16">
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
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">DAILY ACTIVITY</h4>

      <!-- Weekly Stats Grid -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div v-if="weeklyAverage > 0" class="space-y-2">
          <div class="text-2xl font-fjalla tabular-nums">
            {{ formatNumber(weeklyAverage) }}
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            AVG STEPS PER WEEK
          </div>
        </div>

        <div v-if="mostActiveDay.steps > 0" class="space-y-2">
          <div class="text-2xl font-fjalla tabular-nums">
            {{ formatNumber(mostActiveDay.steps) }}
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            MOST STEPS IN A DAY
            <div class="text-xs font-light">{{ mostActiveDay.date }}</div>
          </div>
        </div>
      </div>

      <!-- Daily Steps Chart -->
      <div v-if="hasNonZeroSteps" class="space-y-4">
        <div v-for="(steps, index) in nonZeroSteps" :key="stats.trends.daily.dates[reversedIndices[index]]"
          class="flex items-center gap-4">
          <div class="w-24 text-xs text-gray-500">
            {{ formatDate(stats.trends.daily.dates[reversedIndices[index]]) }}
          </div>
          <div class="flex-grow h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gray-300 dark:bg-gray-600 rounded-full"
              :style="{ width: `${(steps / mostActiveDay.steps) * 100}%` }" />
          </div>
          <div class="w-16 text-xs text-gray-500 tabular-nums text-right">
            {{ formatNumber(steps) }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-gray-400">
    Health data unavailable
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

type HealthStats = NonNullable<StatsResponse['health']>

const props = defineProps<{
  stats?: HealthStats | null
}>()

const hasAnyData = computed(() => {
  if (!props.stats) return false
  return props.stats.thisYear.steps > 0 ||
    props.stats.thisWeek.steps > 0 ||
    props.stats.activity.monthlySteps > 0
})

const hasCurrentStats = computed(() => {
  if (!props.stats) return false
  return props.stats.thisWeek.steps > 0 || props.stats.activity.monthlySteps > 0
})

const hasActivityTrends = computed(() => {
  if (!props.stats?.trends.daily.steps.length) return false
  return props.stats.trends.daily.steps.some(steps => steps > 0)
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
</script>