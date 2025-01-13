<template>
  <div class="space-y-16">
    <!-- Primary Stats -->
    <div>
      <IndividualStat :value="weeklyHours" size="large" label="HOURS THIS WEEK"
        :details="`${formatNumber(weeklyProductiveHours)} PRODUCTIVE · ${weeklyProductivePercent}%`" />
    </div>

    <!-- Weekly Activity -->
    <div class="space-y-6">
      <h3 class="text-sm tracking-wider text-gray-500">THIS WEEK</h3>
      <div class="space-y-4">
        <template v-for="activity in weeklyTopActivities" :key="activity.name">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">{{ activity.name }}</span>
            <div class="flex items-center gap-4">
              <span :class="[getProductivityColor(activity.productivity)]">{{ activity.time.formatted }}</span>
              <span class="text-gray-500 w-12 text-right">{{ activity.percentageOfTotal }}%</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Monthly Overview -->
    <div class="space-y-6">
      <h3 class="text-sm tracking-wider text-gray-500">THIS MONTH</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Total Hours</span>
          <span class="text-gray-500">{{ monthlyHours }}</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import IndividualStat from './IndividualStat.vue'
import { formatNumber } from '~/composables/useNumberFormat'

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

const props = defineProps<{
  stats: StatsResponse
}>()

const rescueTime = computed(() => props.stats.rescueTime)

// Weekly Stats
const weeklyHours = computed(() => Math.round(rescueTime.value?.week.summary.total.hoursDecimal || 0))
const weeklyProductiveHours = computed(() => Math.round(rescueTime.value?.week.summary.productive.time.hoursDecimal || 0))
const weeklyProductivePercent = computed(() => rescueTime.value?.week.summary.productive.percentage || 0)
const weeklyTopActivities = computed(() => rescueTime.value?.week.activities.slice(0, 5) || [])

// Monthly Stats
const monthlyHours = computed(() => Math.round(rescueTime.value?.month.summary.total.hoursDecimal || 0))
const monthlyProductiveHours = computed(() => Math.round(rescueTime.value?.month.summary.productive.time.hoursDecimal || 0))
const monthlyProductivePercent = computed(() => rescueTime.value?.month.summary.productive.percentage || 0)
const monthlyTopCategory = computed(() => rescueTime.value?.month.categories[0])

// Helper to get color based on productivity score
const getProductivityColor = (score: number) => {
  switch (score) {
    case 2:
      return 'text-green-500'
    case 1:
      return 'text-green-300'
    case 0:
      return 'text-gray-500'
    case -1:
      return 'text-red-300'
    case -2:
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}
</script>