<template>
  <div v-if="stats.stats" class="space-y-16 font-mono">
    <!-- Main Stats -->
    <div>
      <IndividualStat :value="stats.stats.totalPhotos" size="large" label="TOTAL PHOTOS"
        :details="`${formatNumber(stats.stats.photosThisMonth)} THIS MONTH`" />
    </div>

    <!-- Monthly Stats -->
    <div>
      <h4 class="section-subheader">MONTHLY STATS</h4>
      <div class="space-y-4">
        <div class="stat-row">
          <span class="text-zinc-400">Photos This Month</span>
          <span class="text-zinc-500 tabular-nums">{{ formatNumber(stats.stats.photosThisMonth) }}</span>
        </div>
      </div>
    </div>

    <!-- Camera Stats -->
    <div v-if="hasCameraData">
      <h4 class="section-subheader">CAMERA EQUIPMENT</h4>
      <div class="metric-box">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <StatItem v-if="topCamera" label="MOST USED CAMERA" :value="topCamera" valueClass="text-zinc-300" />
          <StatItem v-if="topLens" label="MOST USED LENS" :value="topLens" valueClass="text-zinc-300" />
          <StatItem v-if="topFocalLength" label="FAVORITE FOCAL LENGTH" :value="`${topFocalLength}`" />
          <StatItem v-if="topAperture" label="FAVORITE APERTURE" :value="topAperture" />
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

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

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