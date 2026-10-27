<!--
  @file RescueTimeStats.vue
  @description PRODUCTIVITY section of /stats (pages/stats.vue): hours and
    productive % this month, an activity calendar, a 20×5 waffle of this
    WEEK's activities (1 cell = 1%), and this MONTH's top categories.
    Data: stats.rescueTime from /api/stats, built by server/api/rescuetime.get.ts.
  @props stats: StatsResponse - the WHOLE stats payload, not stats.rescueTime
    (the page passes :stats="stats")
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../ui/AnimatedNumber.vue'
import { format } from '~/utils/date'
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
// Waffle cells sit at 0.7 opacity and go solid while the grid is hovered.
const isHovering = ref(false)

const hasData = computed(() => {
  return (
    !!rescueTime.value &&
    (rescueTime.value.week?.summary?.total?.hoursDecimal || 0) > 0
  )
})

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

  // Fallback: Mark the last 7 days as active (since we have weekly data).
  // server/api/rescuetime.get.ts sends neither dailyActivities nor daily, so
  // today this branch always runs: the calendar's 7 days are assumed, not
  // measured.
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(format(date, 'yyyy-MM-dd'))
  }
  return days
})

// One function for both waffle and legend colors
const getTurboColor = (index: number, total: number) => {
  // Skip dark colors: map 0.3 to 1.0 instead of 0 to 1
  const normalizedIndex = index / Math.max(total - 1, 1)
  const adjustedIndex = 0.3 + normalizedIndex * 0.7 // 0.3 to 1.0 range
  return interpolateTurbo(adjustedIndex)
}

// ── Waffle (this week's activities) ────────────────────────────
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
  // Rescale so the consolidated shares fill exactly 100 cells; per-activity
  // rounding can still leave a few, which get padded as "Other" below.
  const scalingFactor = totalPercentage > 0 ? 100 / totalPercentage : 1

  const cells = Array(100).fill(null)
  let cellIndex = 0

  consolidatedActivities.forEach((activity, activityIndex) => {
    const scaledPercentage = activity.percentageOfTotal * scalingFactor
    const cellsForActivity = Math.round(scaledPercentage)

    const turboColor = getTurboColor(
      activityIndex,
      consolidatedActivities.length
    )
    // grayscaleColor is carried on each cell but nothing reads it.
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

// Hairline between cells of different activities, so each activity reads as
// one block. 20 = grid columns, 80 = first cell of the last row (5 rows).
const shouldShowBorder = (index: number, direction: 'right' | 'bottom') => {
  const cells = waffleCells.value
  if (!cells || index >= cells.length) return false

  const currentCell = cells[index]
  let nextCell

  if (direction === 'right') {
    if ((index + 1) % 20 === 0) return true
    nextCell = cells[index + 1]
  } else {
    // bottom
    if (index >= 80) return true
    nextCell = cells[index + 20]
  }

  if (!nextCell) return true

  // Show border if different colors (different activities)
  return currentCell.turboColor !== nextCell.turboColor
}

// ── Categories (this month) ─────────────────────────────────────
// Colored by rank with the same turbo ramp as the waffle; the ranks differ,
// so a color here doesn't match a waffle activity of the same color.
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

<template>
  <!-- ── Headline ──────────────── -->
  <div v-if="hasData" class="space-y-2 font-mono">
    <div class="py-2">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="monthlyHours"
          format="commas"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="section-header-xs mt-2">RESCUETIME HOURS THIS MONTH</div>
      <div class="font-mono text-sm text-zinc-600 dark:text-zinc-400 mt-4">
        <!-- a 0–1 fraction: format="percent" multiplies by 100 -->
        <AnimatedNumber
          :value="monthlyProductivePercent"
          format="percent"
          :duration="800"
          priority="secondary"
        />
        RESCUETIME PRODUCTIVE
      </div>
    </div>

    <ActivityCalendar
      title="RESCUETIME ACTIVITY"
      :active-dates="activityDates"
      :active-color="'#71717a'"
    />

    <!-- ── Waffle ──────────────── -->
    <StatsSectionHeader title="RESCUETIME TIME DISTRIBUTION" />
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
        v-tooltip="cell.title"
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
      ></div>
    </div>
    <div
      class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-zinc-500 mt-4 text-xs leading-4"
    >
      <span>{{ uniqueActivitiesCount }} TRACKED ACTIVITIES</span>
      <span>SQUARE = 1% OF TOTAL TIME</span>
    </div>

    <!-- ── Categories ──────────────── -->
    <StatsSectionHeader title="RESCUETIME CATEGORIES" />
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
              class="text-zinc-700 dark:text-zinc-300 truncate text-xs leading-3"
            >
              {{ category.name }}
            </span>
            <!-- eslint-enable max-len,vue/max-len -->
            <!-- eslint-disable max-len,vue/max-len -->
            <span
              class="text-zinc-500 tabular-nums flex-shrink-0 text-xs leading-3"
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
    type="unavailable"
    message="RESCUETIME_DATA_UNAVAILABLE"
  />
</template>

<style scoped>
.waffle-grid {
  display: grid;
  width: 100%;
  max-height: 200px;
}
</style>
