<template>
  <div v-if="hasData" ref="rescueTimeRef" class="space-y-4 font-mono">
    <!-- Primary Stats -->
    <div ref="primaryStatRef" class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber
          :value="monthlyHours"
          format="commas"
          :duration="timing.dramatic"
          priority="primary"
        />
      </div>
      <div class="stat-label">
        HOURS THIS MONTH
      </div>
      <div class="stat-details">
        <AnimatedNumber
          :value="monthlyProductivePercent"
          format="percent"
          :duration="timing.slow"
          priority="secondary"
        />
        PRODUCTIVE
      </div>
    </div>

    <!-- Activity Calendar -->
    <div ref="calendarRef">
      <ActivityCalendar
        title="ACTIVITY"
        :active-dates="activityDates"
        :active-color="'#71717a'"
      />
    </div>

    <!-- Application Distribution Waffle Chart -->
    <div ref="waffleRef">
      <StatsSectionHeader title="TIME DISTRIBUTION" />
      <div class="waffle-container">
        <div
          v-for="(cell, i) in waffleCells"
          :key="i"
          class="waffle-cell"
          :style="{ backgroundColor: cell.color }"
          :title="cell.title"
        ></div>
      </div>
      <div
        class="flex justify-between text-zinc-500 mt-1"
        style="font-size: 10px; line-height: 12px"
      >
        <span>EACH COLOR = CATEGORY</span>
        <span>SQUARE = 1% OF TOTAL TIME</span>
      </div>
    </div>

    <!-- Category Legend + Top Categories Combined -->
    <div ref="categoriesRef">
      <StatsSectionHeader title="CATEGORIES" />
      <div class="space-y-1.5">
        <div
          v-for="category in sortedCategories"
          :key="category.name"
          class="category-row flex items-center gap-1.5"
        >
          <div
            class="w-2 h-2 flex-shrink-0 rounded-sm"
            :style="{ backgroundColor: category.color }"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center gap-1">
              <span
                class="text-zinc-700 dark:text-zinc-300 truncate"
                style="font-size: 10px; line-height: 12px"
              >{{ category.name }}</span>
              <span
                class="text-zinc-500 tabular-nums flex-shrink-0"
                style="font-size: 10px; line-height: 12px"
              >{{ category.percentageOfTotal }}%</span>
            </div>
            <div class="category-bar-bg mt-0.5">
              <div
                class="category-bar-fill"
                :style="{
                  width: `${category.percentageOfTotal}%`,
                  backgroundColor: category.color
                }"
              ></div>
            </div>
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
import { computed, ref, onMounted, nextTick } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { format } from 'date-fns'
import { formatPercent } from '~/composables/useNumberFormat'
import { animate, stagger, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

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

const { timing } = useAnimations()

const rescueTime = computed(() => props.stats.rescueTime)

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
  () => rescueTime.value?.month.summary.productive.percentage || 0
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

// Generate a color using d3 turbo scale
const getColorForValue = (value: number) => {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value))
  // return d3.interpolateTurbo(clampedValue)
  // Use a simple color scale instead of d3
  const hue = clampedValue * 280 // From red (0) to purple (280)
  return `hsl(${hue}, 70%, 50%)`
}

// Create a unified categories data source with colors (privacy-safe)
const categoriesWithColors = computed(() => {
  const categories = rescueTime.value?.month?.categories || []

  if (categories.length === 0) return []

  // Sort first, then assign colors based on percentage for consistent mapping
  const sortedCategories = [...categories]
    .sort((a, b) => (b.percentageOfTotal || 0) - (a.percentageOfTotal || 0))
    .filter(cat => (cat.percentageOfTotal || 0) > 0)

  // Use categories instead of individual activities for privacy
  return sortedCategories.map((category, i) => ({
    name: category.name,
    percentageOfTotal: category.percentageOfTotal || 0,
    color: getColorForValue(i / Math.max(sortedCategories.length - 1, 1))
  }))
})

// Sorted categories for display (already sorted in categoriesWithColors)
const sortedCategories = computed(() => {
  return categoriesWithColors.value
})

// Waffle chart cells
const waffleCells = computed(() => {
  const activities = rescueTime.value?.week?.activities || []
  const categoryColorMap = Object.fromEntries(
    categoriesWithColors.value.map((c) => [c.name, c.color])
  )

  if (activities.length === 0) {
    return Array(100)
      .fill(null)
      .map(() => ({
        color: '#444',
        title: 'No activity data available'
      }))
  }

  // Create the cells
  const cells = Array(100)
    .fill(null)
    .map((_, i) => {
      // Find which activity corresponds to this position
      let runningPercentage = 0
      let matchingActivity = null

      for (const activity of activities) {
        runningPercentage += activity.percentageOfTotal

        if (i < Math.floor(runningPercentage)) {
          matchingActivity = activity
          break
        }
      }

      if (!matchingActivity) {
        return {
          color: '#444',
          title: 'Other activities'
        }
      }

      // Get color for this category
      const color = categoryColorMap[matchingActivity.name] || '#777'
      const hours = matchingActivity.time?.hours || 0
      const minutes = matchingActivity.time?.minutes || 0
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

      return {
        color,
        title: `${matchingActivity.name}: ${matchingActivity.percentageOfTotal}% (${timeStr})`
      }
    })

  return cells
})

// Animation refs
const rescueTimeRef = ref<HTMLElement | null>(null)
const primaryStatRef = ref<HTMLElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const waffleRef = ref<HTMLElement | null>(null)
const categoriesRef = ref<HTMLElement | null>(null)

const setupScrollAnimations = () => {
  if (process.server) return

  nextTick(() => {
    if (!rescueTimeRef.value || !hasData.value) return

    if (primaryStatRef.value) {
      animate(primaryStatRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.8, rotateX: -15, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.05, rotateX: 5, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
        ],
        duration: timing.value.dramatic,
        ease: 'outElastic(1, .8)',
        autoplay: onScroll({
          target: primaryStatRef.value,
          onEnter: () => true
        })
      })
    }

    if (calendarRef.value) {
      animate(calendarRef.value, {
        opacity: [0, 1],
        scale: [0.9, 1.02, 1],
        translateY: [20, 0],
        duration: timing.value.dramatic,
        ease: 'outElastic(1, .8)',
        autoplay: onScroll({ target: calendarRef.value, onEnter: () => true })
      })
    }

    if (waffleRef.value) {
      const waffleCells = waffleRef.value.querySelectorAll('.waffle-cell')
      if (waffleCells.length) {
        animate(Array.from(waffleCells), {
          keyframes: [
            { opacity: 0, scale: 0, rotateZ: 180 },
            { opacity: 0.8, scale: 1.2, rotateZ: -10 },
            { opacity: 1, scale: 1, rotateZ: 0 }
          ],
          duration: timing.value.dramatic,
          delay: stagger(8, { grid: [10, 10], from: 'center' }),
          ease: 'outElastic(1, .9)',
          autoplay: onScroll({ target: waffleRef.value, onEnter: () => true })
        })
      }
    }

    if (categoriesRef.value) {
      const categoryRows = categoriesRef.value.querySelectorAll('.category-row')
      if (categoryRows.length) {
        animate(Array.from(categoryRows), {
          opacity: [0, 1],
          translateX: [-20, 0],
          scale: [0.9, 1.05, 1],
          duration: timing.value.slow,
          delay: stagger(80),
          ease: 'outBack(1.7)',
          autoplay: onScroll({
            target: categoriesRef.value,
            onEnter: () => true
          })
        })
      }

      const categoryBars =
        categoriesRef.value.querySelectorAll('.category-bar-fill')
      if (categoryBars.length) {
        animate(Array.from(categoryBars), {
          scaleX: [0, 1.1, 1],
          scaleY: [0.5, 1.3, 1],
          duration: timing.value.dramatic,
          delay: stagger(100),
          ease: 'outElastic(1, .8)',
          autoplay: onScroll({ target: categoryBars[0], onEnter: () => true })
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

.category-bar-bg {
  @apply h-1 rounded-sm overflow-hidden bg-transparent dark:bg-zinc-800/10 border-b border-zinc-200/10 dark:border-zinc-800/30;
}

.category-bar-fill {
  @apply h-full rounded-sm;
  /* We'll set the background color dynamically */
}

/* Waffle chart styling */
.waffle-container {
  @apply grid grid-cols-10 gap-0.5 w-full border border-zinc-100/10 dark:border-zinc-800/50 p-2 rounded-sm;
  grid-template-rows: repeat(10, 1fr);
  aspect-ratio: 1 / 1;
}

.waffle-cell {
  @apply transition-colors duration-300 rounded-[1px];
  aspect-ratio: 1 / 1;
}

@media (max-width: 640px) {
  .waffle-container {
    @apply gap-[1px];
  }
}
</style>
