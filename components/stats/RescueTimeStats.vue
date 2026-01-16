<!--
  @file RescueTimeStats.vue
  @description RescueTime productivity statistics
  @props stats: Object - RescueTime data from API
-->
<template>
  <div v-if="hasData" class="space-y-2 font-mono">
    <!-- Primary Stats -->
    <div class="py-2">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="monthlyHours"
          format="commas"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="section-header-xs mt-2">HOURS THIS MONTH</div>
      <div class="font-mono text-sm text-zinc-600 dark:text-zinc-400 mt-4">
        <AnimatedNumber
          :value="monthlyProductivePercent"
          format="percent"
          :duration="800"
          priority="secondary"
        />
        PRODUCTIVE
      </div>
    </div>

    <!-- Activity Calendar -->
    <ActivityCalendar
      title="ACTIVITY"
      :active-dates="activityDates"
      :active-color="'#71717a'"
    />

    <!-- Time Distribution Waffle Chart -->
    <StatsSectionHeader title="TIME DISTRIBUTION" />
    <div
      class="waffle-grid"
      style="
        grid-template-columns: repeat(20, 1fr);
        grid-auto-rows: 1fr;
        aspect-ratio: 4 / 1;
      "
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <div
        v-for="(cell, i) in waffleCells"
        :key="i"
        class="transition-all duration-300 w-full h-full"
        :style="{
          backgroundColor: cell.turboColor,
          opacity: isHovering ? 1 : 0.7,
          borderRight: shouldShowBorder(i, 'right')
            ? '1px solid rgba(0,0,0,0.15)'
            : 'none',
          borderBottom: shouldShowBorder(i, 'bottom')
            ? '1px solid rgba(0,0,0,0.15)'
            : 'none',
        }"
        :title="cell.title"
      ></div>
    </div>
    <div class="flex justify-between text-zinc-500 mt-4 text-xs leading-[12px]">
      <span>{{ uniqueActivitiesCount }} TRACKED ACTIVITIES</span>
      <span>SQUARE = 1% OF TOTAL TIME</span>
    </div>

    <!-- Categories -->
    <StatsSectionHeader title="CATEGORIES" />
    <div class="space-y-2">
      <div
        v-for="category in sortedCategories.slice(0, 10)"
        :key="category.name"
        class="flex items-center gap-0.5"
      >
        <div
          class="w-2 h-2 flex-shrink-0 rounded-sm"
          :style="{ backgroundColor: category.color }"
        ></div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center gap-0.5">
            <!-- eslint-disable max-len,vue/max-len -->
            <span
              class="text-zinc-700 dark:text-zinc-300 truncate text-xs leading-[12px]"
            >
              {{ category.name }}
            </span>
            <!-- eslint-enable max-len,vue/max-len -->
            <!-- eslint-disable max-len,vue/max-len -->
            <span
              class="text-zinc-500 tabular-nums flex-shrink-0 text-xs leading-[12px]"
            >
              {{ category.percentageOfTotal }}%
            </span>
            <!-- eslint-enable max-len,vue/max-len -->
          </div>
          <!-- eslint-disable max-len,vue/max-len -->
          <div
            class="h-1 rounded-sm overflow-hidden bg-transparent dark:bg-zinc-800/10 border-b border-zinc-200/10 dark:border-zinc-800/30 mt-0.5"
          >
            <!-- eslint-enable max-len,vue/max-len -->
            <div
              class="h-full rounded-sm"
              :style="{
                width: `${category.percentageOfTotal}%`,
                backgroundColor: category.color,
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState
    v-else
    state="unavailable"
    message="RESCUETIME_DATA_UNAVAILABLE"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { format } from 'date-fns/format'
import { interpolateTurbo } from 'd3-scale-chromatic'

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

interface Activity {
  name?: string
  time?: {
    seconds?: number
    minutes?: number
    hours?: number
    hoursDecimal?: number
  }
  timeSpent?: {
    seconds?: number
    minutes?: number
    hours?: number
    hoursDecimal?: number
  }
  percentageOfTotal?: number
  productivity?: number
  productivityScore?: number
  category?: {
    name?: string
    productivity?: number
  }
}

// Add interface for daily activity data
interface DailyActivity {
  date: string
  time?: TimeBreakdown
  activities?: Activity[]
  steps?: number
  activeMinutes?: number
}

const props = defineProps<{
  stats: StatsResponse
}>()

const rescueTime = computed(() => props.stats.rescueTime)
const isHovering = ref(false)

// Check if we have data
const hasData = computed(() => {
  return (
    !!rescueTime.value &&
    (rescueTime.value.week?.summary?.total?.hoursDecimal || 0) > 0
  )
})

// Weekly Stats
// Use monthly data for yearly progress view
const monthlyHours = computed(() =>
  Math.round(rescueTime.value?.month.summary.total.hoursDecimal || 0)
)
const monthlyProductivePercent = computed(
  () => (rescueTime.value?.month.summary.productive.percentage || 0) / 100
)

// Generate activity dates from daily data (if available)
const activityDates = computed(() => {
  // This is a best-effort method without knowing the exact data structure
  // Try to find any daily activity data in the RescueTime object
  const dailyData: DailyActivity[] =
    (rescueTime.value as any)?.dailyActivities || // Try standard path
    (rescueTime.value as any)?.daily || // Try alternate path
    [] // Fallback to empty array

  if (dailyData.length > 0 && dailyData[0]?.date) {
    // If we have proper daily activity objects with dates
    return dailyData
      .filter((day) => (day.time?.seconds || 0) > 0) // Only days with activity
      .map((day) => day.date)
  }

  // Fallback: Mark the last 7 days as active (since we have weekly data)
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(format(date, 'yyyy-MM-dd'))
  }
  return days
})

// ONE simple function for both waffle and legend colors
const getTurboColor = (index: number, total: number) => {
  // Skip dark colors: map 0.3 to 1.0 instead of 0 to 1
  const normalizedIndex = index / Math.max(total - 1, 1)
  const adjustedIndex = 0.3 + normalizedIndex * 0.7 // 0.3 to 1.0 range
  return interpolateTurbo(adjustedIndex)
}

// Count unique activities after consolidation
const uniqueActivitiesCount = computed(() => {
  const activities = rescueTime.value?.week?.activities || []
  const uniqueNames = new Set(activities.map((a) => a.name))
  return uniqueNames.size
})

const waffleCells = computed(() => {
  const activities = rescueTime.value?.week?.activities || []

  if (activities.length === 0) {
    return Array(100)
      .fill(null)
      .map(() => ({
        turboColor: '#666',
        grayscaleColor: '#666',
        title: 'No data',
      }))
  }

  // Consolidate activities with same name
  const consolidatedMap = new Map<string, number>()
  activities.forEach((activity) => {
    const name = activity.name || 'Unknown'
    const existing = consolidatedMap.get(name) || 0
    consolidatedMap.set(name, existing + (activity.percentageOfTotal || 0))
  })

  // Convert to array and sort by percentage (largest first)
  const consolidatedActivities = Array.from(consolidatedMap.entries())
    .map(([name, percentage]) => ({ name, percentageOfTotal: percentage }))
    .sort((a, b) => b.percentageOfTotal - a.percentageOfTotal)

  const totalPercentage = consolidatedActivities.reduce(
    (sum, activity) => sum + activity.percentageOfTotal,
    0
  )
  const scalingFactor = totalPercentage > 0 ? 100 / totalPercentage : 1

  const cells = Array(100).fill(null)
  let cellIndex = 0

  consolidatedActivities.forEach((activity, activityIndex) => {
    const scaledPercentage = activity.percentageOfTotal * scalingFactor
    const cellsForActivity = Math.round(scaledPercentage)

    // USE SAME COLOR FUNCTION
    const turboColor = getTurboColor(
      activityIndex,
      consolidatedActivities.length
    )
    const grayColor = `#${(128 + activityIndex * 8)
      .toString(16)
      .padStart(2, '0')
      .repeat(3)}`

    for (let i = 0; i < cellsForActivity && cellIndex < 100; i++) {
      cells[cellIndex] = {
        turboColor: turboColor,
        grayscaleColor: grayColor,
        title: `${activity.name}: ${Math.round(activity.percentageOfTotal)}%`,
      }
      cellIndex++
    }
  })

  // Fill remaining
  while (cellIndex < 100) {
    cells[cellIndex] = {
      turboColor: '#666',
      grayscaleColor: '#666',
      title: 'Other',
    }
    cellIndex++
  }

  return cells
})

// Check if we should show a border between cells
const shouldShowBorder = (index: number, direction: 'right' | 'bottom') => {
  const cells = waffleCells.value
  if (!cells || index >= cells.length) return false

  const currentCell = cells[index]
  let nextCell

  if (direction === 'right') {
    // Don't show border on last column
    if ((index + 1) % 20 === 0) return true
    nextCell = cells[index + 1]
  } else {
    // bottom
    // Don't show border on last row
    if (index >= 80) return true
    nextCell = cells[index + 20]
  }

  if (!nextCell) return true

  // Show border if different colors (different activities)
  return currentCell.turboColor !== nextCell.turboColor
}

// Simple categories for display - USE SAME COLOR FUNCTION
const sortedCategories = computed(() => {
  const categories = rescueTime.value?.month?.categories || []
  const sorted = [...categories]
    .sort((a, b) => (b.percentageOfTotal || 0) - (a.percentageOfTotal || 0))
    .filter((cat) => (cat.percentageOfTotal || 0) > 0)

  return sorted.map((category, i) => ({
    name: category.name,
    percentageOfTotal: category.percentageOfTotal || 0,
    color: getTurboColor(i, sorted.length),
  }))
})
</script>

<style scoped>
.waffle-grid {
  display: grid;
  width: 100%;
  max-height: 200px;
}
</style>
