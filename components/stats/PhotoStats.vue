<template>
  <div v-if="stats.stats" class="space-y-16 font-mono">
    <!-- Main Stats -->
    <div>
      <IndividualStat
        :value="stats.stats.totalPhotos" size="large" label="TOTAL PHOTOS"
        :details="`${formatNumber(stats.stats.photosThisMonth)} THIS MONTH`"
      />
    </div>

    <!-- Monthly Stats -->
    <div>
      <StatsSectionHeader title="MONTHLY STATS" />
      <div class="space-y-4">
        <div class="stat-row">
          <span class="text-zinc-400">Photos This Month</span>
          <span class="text-zinc-500 tabular-nums">{{ formatNumber(stats.stats.photosThisMonth) }}</span>
        </div>
      </div>
    </div>

    <!-- Camera Stats -->
    <div v-if="hasCameraData">
      <StatsSectionHeader title="CAMERA EQUIPMENT" />
      <div class="metric-box">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <StatItem v-if="topCamera" label="MOST USED CAMERA" :value="topCamera" value-class="text-zinc-300" />
          <StatItem v-if="topLens" label="MOST USED LENS" :value="topLens" value-class="text-zinc-300" />
          <StatItem v-if="topFocalLength" label="FAVORITE FOCAL LENGTH" :value="`${topFocalLength}`" />
          <StatItem v-if="topAperture" label="FAVORITE APERTURE" :value="topAperture" />
        </div>
      </div>
    </div>
  </div>
  <StatsDataState message="PHOTO_DATA_UNAVAILABLE" />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import type { StatsResponse } from '~/composables/useStats'
import { useNumberFormat } from '~/composables/useNumberFormat'

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

type PhotoStats = NonNullable<StatsResponse['photos']> & {
  gearStats?: {
    cameras: { name: string; count: number; percentage: number }[]
    lenses: { name: string; count: number; percentage: number }[]
    mostUsedSettings?: {
      apertures?: { value: string; count: number }[]
      focalLengths?: { value: string; count: number }[]
    }
  }
}

const props = defineProps<{
  stats: PhotoStats
}>()

const { formatNumber } = useNumberFormat()

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

// Camera/lens/focal length/aperture extraction from gearStats
const topCamera = computed(() => props.stats.gearStats?.cameras?.[0]?.name || null)
const topLens = computed(() => props.stats.gearStats?.lenses?.[0]?.name || null)
const topFocalLength = computed(() => props.stats.gearStats?.mostUsedSettings?.focalLengths?.[0]?.value || null)
const topAperture = computed(() => props.stats.gearStats?.mostUsedSettings?.apertures?.[0]?.value || null)

const hasCameraData = computed(() => {
  return !!(topCamera.value || topLens.value || topFocalLength.value || topAperture.value)
})
</script>

<style scoped>

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

</style>