<template>
  <div v-if="hasData" class="space-y-16 font-mono">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <IndividualStat :value="weeklyHours" size="large" label="HOURS THIS WEEK"
        :details="`${formatNumber(weeklyProductiveHours)} PRODUCTIVE (${weeklyProductivePercent}%)`" />
    </div>

    <!-- Weekly Activity -->
    <div class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">TOP ACTIVITIES</h4>

      <div class="space-y-4">
        <template v-for="activity in weeklyTopActivities" :key="activity.name">
          <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-400">{{ activity.name }}</span>
            <div class="flex items-center gap-4">
              <span class="text-zinc-400" :title="getProductivityLabel(activity.productivity)">
                {{ activity.time.formatted }}
              </span>
              <span class="text-zinc-500 w-12 text-right tabular-nums">{{ activity.percentageOfTotal }}%</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Monthly Overview -->
    <div class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">MONTHLY SUMMARY</h4>

      <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <div class="text-zinc-500">TOTAL HOURS</div>
            <div class="text-xl text-zinc-300 tabular-nums">{{ monthlyHours }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-zinc-500">PRODUCTIVE TIME</div>
            <div class="text-xl text-zinc-300 tabular-nums">{{ monthlyProductiveHours }}h ({{ monthlyProductivePercent
            }}%)
            </div>
          </div>
          <div v-if="monthlyTopCategory" class="space-y-1">
            <div class="text-zinc-500">TOP CATEGORY</div>
            <div class="text-zinc-300">{{ monthlyTopCategory.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Date Range Info -->
    <div class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">TIME PERIODS</h4>

      <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <div class="text-zinc-500">CURRENT WEEK</div>
            <div class="text-zinc-300">{{ formatDateRange(weekStart, now) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-zinc-500">CURRENT MONTH</div>
            <div class="text-zinc-300">{{ formatDateRange(monthStart, now) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-zinc-500">LAST UPDATED</div>
            <div class="text-zinc-300">{{ formatUpdateTime(lastUpdated) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Productivity Legend -->
    <div class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">PRODUCTIVITY SCALE</h4>

      <div class="flex flex-wrap gap-3">
        <div class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">VERY PRODUCTIVE</div>
        <div class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">PRODUCTIVE</div>
        <div class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">NEUTRAL</div>
        <div class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">DISTRACTING</div>
        <div class="px-2 py-1 text-[10px] border border-zinc-800/50 bg-zinc-900/50 text-zinc-400">VERY DISTRACTING</div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-zinc-400 font-mono">
    RESCUETIME_DATA_UNAVAILABLE
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import IndividualStat from './IndividualStat.vue'
import { formatNumber } from '~/composables/useNumberFormat'
import { format } from 'date-fns'

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
const lastUpdated = computed(() => rescueTime.value?.lastUpdated || new Date().toISOString())

// Check if we have data
const hasData = computed(() => {
  return !!rescueTime.value &&
    ((rescueTime.value.week?.summary?.total?.hoursDecimal || 0) > 0 ||
      (rescueTime.value.month?.summary?.total?.hoursDecimal || 0) > 0)
})

// Calculate date ranges
const now = computed(() => new Date())
const weekStart = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)) // Monday
  date.setHours(0, 0, 0, 0)
  return date
})
const monthStart = computed(() => {
  const date = new Date()
  date.setDate(1) // First day of current month
  date.setHours(0, 0, 0, 0)
  return date
})

// Format date ranges for display
const formatDateRange = (start: Date, end: Date) => {
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
}

const formatUpdateTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, 'MMM d, h:mm a')
  } catch (e) {
    return 'Unknown'
  }
}

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

// Helper to get productivity label
const getProductivityLabel = (score: number) => {
  switch (score) {
    case 2:
      return 'Very Productive'
    case 1:
      return 'Productive'
    case 0:
      return 'Neutral'
    case -1:
      return 'Distracting'
    case -2:
      return 'Very Distracting'
    default:
      return 'Neutral'
  }
}
</script>

<style scoped>
/* Custom tooltip styling */
[title] {
  position: relative;
  cursor: help;
}
</style>