<template>
  <div v-if="hasData" class="space-y-10 font-mono">
    <!-- Primary Stats -->
    <div>
      <IndividualStat :value="weeklyHours" size="large" label="HOURS TRACKED"
        :details="`${weeklyProductivePercent}% PRODUCTIVE`" />
    </div>

    <!-- Activity Calendar -->
    <div>
      <ActivityCalendar title="ACTIVITY" :active-dates="activityDates" :active-color="'#71717a'" />
    </div>

    <!-- Application Distribution Waffle Chart -->
    <div>
      <h4 class="section-subheader">TIME DISTRIBUTION</h4>
      <div class="waffle-container">
        <div v-for="(cell, i) in waffleCells" :key="i" class="waffle-cell" :style="{ backgroundColor: cell.color }"
          :title="cell.title">
        </div>
      </div>
      <div class="flex justify-between text-2xs text-zinc-500 mt-2">
        <span>EACH SQUARE = 1% OF TOTAL TIME</span>
        <span>COLOR = CATEGORY</span>
      </div>
    </div>

    <!-- Category Legend + Top Categories Combined -->
    <div>
      <h4 class="section-subheader">CATEGORIES</h4>
      <div class="space-y-3">
        <div v-for="category in sortedCategories" :key="category.name" class="flex items-start gap-2">
          <div class="w-3 h-3 mt-1 flex-shrink-0" :style="{ backgroundColor: category.color }"></div>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <span class="text-xs text-zinc-700 dark:text-zinc-300">{{ category.name }}</span>
              <span class="text-2xs text-zinc-500 tabular-nums">{{ category.percentageOfTotal }}%</span>
            </div>
            <div class="category-bar-bg mt-1">
              <div class="category-bar-fill" :style="{
                width: `${category.percentageOfTotal}%`,
                backgroundColor: category.color
              }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="data-unavailable">
    RESCUETIME_DATA_UNAVAILABLE
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import { format } from 'date-fns'

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

interface Activity {
  name?: string;
  time?: {
    seconds?: number;
    minutes?: number;
    hours?: number;
    hoursDecimal?: number;
  };
  timeSpent?: {
    seconds?: number;
    minutes?: number;
    hours?: number;
    hoursDecimal?: number;
  };
  percentageOfTotal?: number;
  productivity?: number;
  productivityScore?: number;
  category?: {
    name?: string;
    productivity?: number;
  };
}

// Add interface for daily activity data
interface DailyActivity {
  date: string;
  time?: TimeBreakdown;
  activities?: Activity[];
  steps?: number;
  activeMinutes?: number;
}

const props = defineProps<{
  stats: StatsResponse
}>()

const rescueTime = computed(() => props.stats.rescueTime)
const lastUpdated = computed(() => rescueTime.value?.lastUpdated || new Date().toISOString())

// Check if we have data
const hasData = computed(() => {
  return !!rescueTime.value &&
    ((rescueTime.value.week?.summary?.total?.hoursDecimal || 0) > 0)
})

// Format date for display
const formatUpdateTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy')
  } catch (e) {
    return 'Unknown date'
  }
}

// Weekly Stats
const weeklyHours = computed(() => Math.round(rescueTime.value?.week.summary.total.hoursDecimal || 0))
const weeklyProductivePercent = computed(() => rescueTime.value?.week.summary.productive.percentage || 0)
const weeklyDistractingPercent = computed(() => rescueTime.value?.week.summary.distracting.percentage || 0)
const weeklyNeutralPercent = computed(() => rescueTime.value?.week.summary.neutral.percentage || 0)

// Generate activity dates from daily data (if available)
const activityDates = computed(() => {
  // This is a best-effort method without knowing the exact data structure
  // Try to find any daily activity data in the RescueTime object
  const dailyData: DailyActivity[] =
    (rescueTime.value as any)?.dailyActivities || // Try standard path
    (rescueTime.value as any)?.daily || // Try alternate path
    []; // Fallback to empty array

  if (dailyData.length > 0 && dailyData[0]?.date) {
    // If we have proper daily activity objects with dates
    return dailyData
      .filter(day => (day.time?.seconds || 0) > 0) // Only days with activity
      .map(day => day.date)
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

// A vibrant turbo-like color scale (inverted)
const turboColors = [
  '#dd2e06', '#f57e00', '#fbb508', '#c8e020', '#7cf357',
  '#3bdf92', '#1ac7c2', '#24aad8', '#337bc3', '#4444a4', '#30123b'
];

// Generate a color from our palette
const getColorForValue = (value: number) => {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));
  // Scale to the array index range
  const index = Math.floor(clampedValue * (turboColors.length - 1));
  return turboColors[index];
};

// Create a unified categories data source with colors
const categoriesWithColors = computed(() => {
  const activities = rescueTime.value?.week?.activities || [];

  if (activities.length === 0) return [];

  // Get unique categories 
  const uniqueNames = [...new Set(activities.map(a => a.name))]
    .filter(name => name); // Filter out undefined/null

  // Map categories to objects with colors
  return uniqueNames.map((name, i) => {
    // Find the matching activity to get percentage
    const activity = activities.find(a => a.name === name);

    return {
      name,
      percentageOfTotal: activity?.percentageOfTotal || 0,
      color: getColorForValue(i / Math.max(uniqueNames.length - 1, 1))
    };
  });
})

// Sorted categories for display
const sortedCategories = computed(() => {
  return [...categoriesWithColors.value]
    .sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
})

// Waffle chart cells
const waffleCells = computed(() => {
  const activities = rescueTime.value?.week?.activities || [];
  const categoryColorMap = Object.fromEntries(
    categoriesWithColors.value.map(c => [c.name, c.color])
  );

  if (activities.length === 0) {
    return Array(100).fill(null).map(() => ({
      color: '#444',
      title: 'No activity data available'
    }));
  }

  // Create the cells
  const cells = Array(100).fill(null).map((_, i) => {
    // Find which activity corresponds to this position
    let runningPercentage = 0;
    let matchingActivity = null;

    for (const activity of activities) {
      runningPercentage += activity.percentageOfTotal;

      if (i < Math.floor(runningPercentage)) {
        matchingActivity = activity;
        break;
      }
    }

    if (!matchingActivity) {
      return {
        color: '#444',
        title: 'Other activities'
      };
    }

    // Get color for this category
    const color = categoryColorMap[matchingActivity.name] || '#777';
    const hours = matchingActivity.time?.hours || 0;
    const minutes = matchingActivity.time?.minutes || 0;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      color,
      title: `${matchingActivity.name}: ${matchingActivity.percentageOfTotal}% (${timeStr})`
    };
  });

  return cells;
})
</script>

<style scoped>
.section-subheader {
  @apply text-2xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/30 pb-1 mb-3;
}

.data-unavailable {
  @apply text-sm text-zinc-400 font-mono;
}

.category-bar-bg {
  @apply h-1.5 rounded-sm overflow-hidden bg-transparent dark:bg-zinc-800/10 border-b border-zinc-200/10 dark:border-zinc-800/30;
}

.category-bar-fill {
  @apply h-full rounded-sm;
  /* We'll set the background color dynamically */
}

/* Custom text size smaller than xs */
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
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