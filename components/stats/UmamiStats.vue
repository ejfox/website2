<template>
  <div v-if="hasData" class="space-y-4 font-mono">
    <!-- Primary Stats -->
    <div class="text-center py-4">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="stats.pageviews.value"
          format="commas"
          :duration="800"
          priority="primary"
        />
      </div>
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-1">
        PAGEVIEWS
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        <AnimatedNumber
          :value="stats.visitors.value"
          format="default"
          :duration="400"
          priority="secondary"
        />
        VISITORS ·
        <AnimatedNumber
          :value="stats.visits.value"
          format="default"
          :duration="400"
          priority="tertiary"
        />
        VISITS
      </div>
    </div>

    <!-- Key Metrics -->
    <div>
      <StatsSectionHeader title="ENGAGEMENT" />
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >BOUNCE RATE</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            <AnimatedNumber
              :value="bounceRate"
              format="default"
              :duration="400"
              priority="tertiary"
            />%
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >AVG SESSION</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ avgSessionTime }}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >PAGES/SESSION</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ pagesPerSession }}
          </span>
        </div>
      </div>
    </div>

    <!-- Growth Metrics -->
    <div>
      <StatsSectionHeader title="GROWTH (VS PREV 30 DAYS)" />
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >PAGEVIEWS</span
          >
          <span class="tabular-nums" :class="getGrowthClass(pageviewGrowth)">
            {{ formatGrowth(pageviewGrowth) }}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >VISITORS</span
          >
          <span class="tabular-nums" :class="getGrowthClass(visitorGrowth)">
            {{ formatGrowth(visitorGrowth) }}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >ENGAGEMENT TIME</span
          >
          <span class="tabular-nums" :class="getGrowthClass(timeGrowth)">
            {{ formatGrowth(timeGrowth) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Traffic Quality -->
    <div>
      <h4 class="section-label-tracked">TRAFFIC QUALITY</h4>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >RETURN RATE</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ returnRate }}%
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >ENGAGEMENT RATE</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ engagementRate }}%
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 uppercase tracking-widest text-xs"
            >DAILY AVG</span
          >
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ dailyAverage }} views
          </span>
        </div>
      </div>
    </div>

    <!-- Period Info -->
    <div class="flex justify-between text-zinc-500 text-xs">
      <span>LAST 30 DAYS</span>
      <span>UPDATED {{ lastUpdated }}</span>
    </div>
  </div>
  <div v-else class="text-center py-8">
    <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
      NO ANALYTICS DATA
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns/format'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'

interface UmamiStats {
  stats: {
    pageviews: { value: number; prev: number }
    visitors: { value: number; prev: number }
    visits: { value: number; prev: number }
    bounces: { value: number; prev: number }
    totaltime: { value: number; prev: number }
  }
  websiteId: string
  lastUpdated: string
  shareUrl: string
}

const props = defineProps<{
  umamiStats?: UmamiStats | null
}>()

const hasData = computed(() => {
  return !!props.umamiStats?.stats
})

const stats = computed(
  () =>
    props.umamiStats?.stats || {
      pageviews: { value: 0, prev: 0 },
      visitors: { value: 0, prev: 0 },
      visits: { value: 0, prev: 0 },
      bounces: { value: 0, prev: 0 },
      totaltime: { value: 0, prev: 0 }
    }
)

// Engagement Metrics
const bounceRate = computed(() => {
  const visits = stats.value.visits.value
  const bounces = stats.value.bounces.value
  return visits > 0 ? Math.round((bounces / visits) * 100) : 0
})

const avgSessionTime = computed(() => {
  const totalTime = stats.value.totaltime.value
  const visits = stats.value.visits.value
  if (visits === 0) return '0s'

  const avgSeconds = totalTime / visits
  const minutes = Math.floor(avgSeconds / 60)
  const seconds = Math.round(avgSeconds % 60)

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

const pagesPerSession = computed(() => {
  const pageviews = stats.value.pageviews.value
  const visits = stats.value.visits.value
  if (visits === 0) return '0'
  return (pageviews / visits).toFixed(1)
})

// Growth Calculations
const pageviewGrowth = computed(() => {
  const current = stats.value.pageviews.value
  const prev = stats.value.pageviews.prev
  if (prev === 0) return current > 0 ? 100 : 0
  return ((current - prev) / prev) * 100
})

const visitorGrowth = computed(() => {
  const current = stats.value.visitors.value
  const prev = stats.value.visitors.prev
  if (prev === 0) return current > 0 ? 100 : 0
  return ((current - prev) / prev) * 100
})

const timeGrowth = computed(() => {
  const current = stats.value.totaltime.value
  const prev = stats.value.totaltime.prev
  if (prev === 0) return current > 0 ? 100 : 0
  return ((current - prev) / prev) * 100
})

// Traffic Quality Metrics
const returnRate = computed(() => {
  const visits = stats.value.visits.value
  const visitors = stats.value.visitors.value
  if (visitors === 0) return 0
  // If visits > visitors, we have returning visitors
  const returningVisits = Math.max(0, visits - visitors)
  return Math.round((returningVisits / visits) * 100)
})

const engagementRate = computed(() => {
  // Inverse of bounce rate
  return 100 - bounceRate.value
})

const dailyAverage = computed(() => {
  // Assuming 30 day period
  return Math.round(stats.value.pageviews.value / 30)
})

// Formatting helpers
const formatGrowth = (growth: number): string => {
  if (growth === 0) return '0%'
  const sign = growth > 0 ? '+' : ''
  return `${sign}${Math.round(growth)}%`
}

const getGrowthClass = (growth: number): string => {
  if (growth > 0) return 'text-success'
  if (growth < 0) return 'text-error'
  return 'text-zinc-500'
}

const lastUpdated = computed(() => {
  if (!props.umamiStats?.lastUpdated) return 'UNKNOWN'
  return format(new Date(props.umamiStats.lastUpdated), 'MMM d').toUpperCase()
})
</script>
