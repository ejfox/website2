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

// Get top 5 categories by time spent
const topCategories = computed(() => {
  return rescueTime.value?.categories?.slice(0, 5) || []
})

// Get top 5 activities
const topActivities = computed(() => {
  return rescueTime.value?.activities?.slice(0, 5) || []
})

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

// Computed values for main stats
const productiveHours = computed(() => {
  if (!rescueTime.value?.summary?.productive?.time?.hoursDecimal) return 0
  return rescueTime.value.summary.productive.time.hoursDecimal
})

const totalHours = computed(() => {
  if (!rescueTime.value?.summary?.total?.time?.hoursDecimal) return 0
  return rescueTime.value.summary.total.time.hoursDecimal
})

const productivityScore = computed(() => {
  if (!rescueTime.value?.summary?.productive?.percentage) return 0
  return rescueTime.value.summary.productive.percentage
})

const mostProductiveCategory = computed(() => {
  if (!topCategories.value?.length) return null
  return topCategories.value.reduce((prev, curr) => {
    return curr.productivity > prev.productivity ? curr : prev
  })
})

const formatTime = (time: TimeBreakdown) => {
  if (!time?.hoursDecimal) return '0m'
  return time.hoursDecimal >= 1 ? time.formatted : Math.round(time.hoursDecimal * 60) + 'm'
}

const currentMonth = computed(() => {
  return new Date().toLocaleString('en-US', { month: 'long' })
})

const statsDetails = computed(() => {
  return productivityScore.value + '% PRODUCTIVE · ' + formatNumber(totalHours.value) + 'H THIS MONTH'
})

const averageHoursPerDay = computed(() => {
  if (!totalHours.value) return 0
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.round((totalHours.value / daysInMonth) * 10) / 10
})
</script>

<template>
  <div v-if="rescueTime?.summary" class="space-y-16">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <!-- Month Indicator -->
      <div class="text-xs tracking-[0.2em] text-gray-500 font-light">
        {{ currentMonth.toUpperCase() }} OVERVIEW
      </div>

      <!-- Productive Hours -->
      <IndividualStat :value="productiveHours" size="large" label="PRODUCTIVE HOURS" :details="statsDetails" />

      <div class="grid grid-cols-2 gap-8">
        <!-- Most Productive Category -->
        <div v-if="mostProductiveCategory" class="space-y-2">
          <div class="text-2xl font-fjalla">
            {{ mostProductiveCategory.name }}
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            MOST PRODUCTIVE CATEGORY
          </div>
          <div class="text-sm text-gray-600">
            {{ formatTime(mostProductiveCategory.time) }}
          </div>
        </div>

        <!-- Average Time -->
        <div class="space-y-2">
          <div class="text-2xl font-fjalla tabular-nums">
            {{ averageHoursPerDay }}h
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            AVERAGE DAILY HOURS
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div v-if="topCategories.length">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">MONTHLY CATEGORIES</h4>
      <div class="space-y-4">
        <div v-for="category in topCategories" :key="category.name"
          class="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <div class="flex items-center gap-4">
            <div class="w-24 text-xs tracking-wider text-gray-500">
              {{ formatTime(category.time) }}
            </div>
            <div :class="getProductivityColor(category.productivity)" class="font-medium">
              {{ category.name }}
            </div>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
            {{ category.percentageOfTotal }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Details -->
    <div v-if="topActivities.length">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">TOP MONTHLY ACTIVITIES</h4>
      <div class="space-y-4">
        <div v-for="activity in topActivities" :key="activity.name"
          class="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <div class="flex items-center gap-4">
            <div class="w-24 text-xs tracking-wider text-gray-500">
              {{ formatTime(activity.time) }}
            </div>
            <div class="space-y-1">
              <div :class="getProductivityColor(activity.productivity)" class="font-medium">
                {{ activity.name }}
              </div>
              <div class="text-xs text-gray-500">{{ activity.category }}</div>
            </div>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
            {{ activity.percentageOfTotal }}%
          </div>
        </div>
      </div>
    </div>

    <div v-if="rescueTime.lastUpdated" class="text-xs text-gray-500 dark:text-gray-400">
      Last updated: {{ new Date(rescueTime.lastUpdated).toLocaleString() }}
    </div>
  </div>
  <div v-else class="text-gray-500 dark:text-gray-400">
    No RescueTime data available
  </div>
</template>