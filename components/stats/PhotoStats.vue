<template>
  <div class="space-y-16">
    <!-- Main Stats -->
    <div v-if="stats.stats">
      <IndividualStat :value="stats.stats.totalPhotos" size="large" label="TOTAL PHOTOS"
        :details="`${formatNumber(stats.stats.photosThisMonth)} THIS MONTH · ${formatNumber(stats.stats.averagePerMonth)} AVG/MONTH`" />
    </div>

    <!-- Monthly Stats -->
    <div v-if="stats.stats">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">MONTHLY STATS</h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Photos This Month</span>
          <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.stats.photosThisMonth) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Monthly Average</span>
          <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.stats.averagePerMonth) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'

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
</script>