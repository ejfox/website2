<template>
  <div v-if="hasData" class="space-y-8 font-mono">
    <!-- Primary Metric -->
    <div class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="stats.pageviews.value" format="commas" :duration="800" priority="primary" />
      </div>
      <div class="stat-label">
        PAGEVIEWS
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.visitors.value" format="default" :duration="400" priority="secondary" /> VISITORS · 
        <AnimatedNumber :value="stats.visits.value" format="default" :duration="400" priority="tertiary" /> VISITS
      </div>
    </div>

    <!-- Key Metrics Grid - Tufte Style -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
      <div class="flex justify-between items-baseline">
        <span class="text-zinc-700 dark:text-zinc-400">BOUNCE RATE</span>
        <span class="tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">
          <AnimatedNumber :value="bounceRate" format="default" :duration="400" priority="tertiary" />%
        </span>
      </div>
      <div class="flex justify-between items-baseline">
        <span class="text-zinc-700 dark:text-zinc-400">AVG SESSION</span>
        <span class="tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">
          {{ avgSessionTime }}
        </span>
      </div>
      <div class="flex justify-between items-baseline">
        <span class="text-zinc-700 dark:text-zinc-400">vs PREV PERIOD</span>
        <span class="tabular-nums font-medium" :class="growthClass">
          {{ pageviewGrowth }}
        </span>
      </div>
      <div class="flex justify-between items-baseline">
        <span class="text-zinc-700 dark:text-zinc-400">LAST 30 DAYS</span>
        <span class="tabular-nums text-zinc-500 text-2xs">
          {{ lastUpdated }}
        </span>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-6">
    <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
      NO ANALYTICS DATA
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns/format'
import AnimatedNumber from '../AnimatedNumber.vue'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

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

// DELETED: // DELETED: const { timing } = // DELETED: useAnimations() - BROKEN IMPORT - BROKEN IMPORT

const hasData = computed(() => {
  return !!props.umamiStats?.stats
})

const stats = computed(() => props.umamiStats?.stats || {
  pageviews: { value: 0, prev: 0 },
  visitors: { value: 0, prev: 0 },
  visits: { value: 0, prev: 0 },
  bounces: { value: 0, prev: 0 },
  totaltime: { value: 0, prev: 0 }
})

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

const pageviewGrowth = computed(() => {
  const current = stats.value.pageviews.value
  const prev = stats.value.pageviews.prev
  if (prev === 0) return '+∞'
  
  const growth = ((current - prev) / prev) * 100
  const sign = growth > 0 ? '+' : ''
  return `${sign}${Math.round(growth)}%`
})

const growthClass = computed(() => {
  const current = stats.value.pageviews.value
  const prev = stats.value.pageviews.prev
  const growth = current - prev
  
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-zinc-500'
})

const lastUpdated = computed(() => {
  if (!props.umamiStats?.lastUpdated) return 'UNKNOWN'
  return format(new Date(props.umamiStats.lastUpdated), 'MMM d').toUpperCase()
})
</script>