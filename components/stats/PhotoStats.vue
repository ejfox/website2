<template>
  <div v-if="stats.stats" class="space-y-16 font-mono">
    <!-- Main Stats -->
    <div>
      <IndividualStat :value="stats.stats.totalPhotos" size="large" label="TOTAL PHOTOS"
        :details="`${formatNumber(stats.stats.photosThisMonth)} THIS MONTH · ${formatNumber(stats.stats.averagePerMonth)} AVG/MONTH`" />
    </div>

    <!-- Monthly Stats -->
    <div>
      <h4 class="section-subheader">MONTHLY STATS</h4>
      <div class="space-y-4">
        <div v-for="item in monthlyStatItems" :key="item.label" class="stat-row">
          <span class="text-zinc-400">{{ item.label }}</span>
          <span class="text-zinc-500 tabular-nums">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- Camera Stats -->
    <div v-if="hasCameraData">
      <h4 class="section-subheader">CAMERA EQUIPMENT</h4>
      <div class="metric-box">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <StatItem v-if="stats.stats.topCamera" label="MOST USED CAMERA" :value="stats.stats.topCamera"
            valueClass="text-zinc-300" />
          <StatItem v-if="stats.stats.topLens" label="MOST USED LENS" :value="stats.stats.topLens"
            valueClass="text-zinc-300" />
          <StatItem v-if="stats.stats.topFocalLength" label="FAVORITE FOCAL LENGTH"
            :value="`${stats.stats.topFocalLength}mm`" />
          <StatItem v-if="stats.stats.topAperture" label="FAVORITE APERTURE" :value="`f/${stats.stats.topAperture}`" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="data-unavailable">
    PHOTO_DATA_UNAVAILABLE
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'

// Reusable StatItem component
const StatItem = (props: {
  label: string;
  value: string | number;
  valueClass?: string;
}) => {
  return h('div', { class: 'stat-item' }, [
    h('div', { class: 'stat-label' }, props.label),
    h('div', { class: props.valueClass || 'text-xl text-zinc-300 tabular-nums' }, props.value)
  ])
}

interface PhotoStatsInterface {
  stats: {
    totalPhotos: number
    photosThisMonth: number
    averagePerMonth: number
    topCamera?: string
    topLens?: string
    topFocalLength?: number
    topAperture?: number
  }
}

type PhotoStats = NonNullable<StatsResponse['photos']>

const props = defineProps<{
  stats: PhotoStats
}>()

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

// Monthly stats items
const monthlyStatItems = computed(() => {
  if (!props.stats.stats) return []

  return [
    {
      label: 'Photos This Month',
      value: formatNumber(props.stats.stats.photosThisMonth)
    },
    {
      label: 'Monthly Average',
      value: formatNumber(props.stats.stats.averagePerMonth)
    }
  ]
})

// Check if we have any camera equipment data
const hasCameraData = computed(() => {
  const stats = props.stats.stats
  return !!(stats?.topCamera || stats?.topLens || stats?.topFocalLength || stats?.topAperture)
})
</script>

<style scoped>
.section-subheader {
  @apply text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4;
}

.stat-row {
  @apply flex items-center justify-between text-sm;
}

.metric-box {
  @apply border border-zinc-800/50 p-4 bg-zinc-900/30;
}

.stat-item {
  @apply space-y-1;
}

.stat-label {
  @apply text-zinc-500;
}

.data-unavailable {
  @apply text-sm text-zinc-400 font-mono;
}
</style>