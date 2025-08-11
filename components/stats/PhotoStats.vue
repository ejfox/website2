<template>
  <div v-if="stats.stats" ref="photoStatsRef" class="space-y-16 font-mono">
    <!-- Main Stats -->
    <div ref="primaryStatRef">
      <IndividualStat
        :value="stats.stats.totalPhotos"
        size="large"
        label="TOTAL PHOTOS"
        :details="`${formatNumber(stats.stats.photosThisMonth)} THIS MONTH`"
      />
    </div>

    <!-- Monthly Stats -->
    <div ref="monthlyStatsRef">
      <StatsSectionHeader title="MONTHLY STATS" />
      <div class="space-y-4">
        <div class="stat-row">
          <span class="text-zinc-400">Photos This Month</span>
          <span class="text-zinc-500 tabular-nums">{{
            formatNumber(stats.stats.photosThisMonth)
          }}</span>
        </div>
      </div>
    </div>

    <!-- Camera Stats -->
    <div v-if="hasCameraData" ref="cameraStatsRef">
      <StatsSectionHeader title="CAMERA EQUIPMENT" />
      <div class="grid grid-cols-2 gap-4 text-xs">
        <StatItem
          v-if="topCamera"
          label="MOST USED CAMERA"
          :value="topCamera"
          value-class="text-red-400"
        />
        <StatItem
          v-if="topLens"
          label="MOST USED LENS"
          :value="topLens"
          value-class="text-zinc-300"
        />
        <StatItem
          v-if="topFocalLength"
          label="FAVORITE FOCAL LENGTH"
          :value="`${topFocalLength}`"
        />
        <StatItem
          v-if="topAperture"
          label="FAVORITE APERTURE"
          :value="topAperture"
        />
      </div>
    </div>
  </div>
  <StatsDataState message="PHOTO_DATA_UNAVAILABLE" />
</template>

<script setup lang="ts">
import { computed, h, ref, onMounted, nextTick } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import type { StatsResponse } from '~/composables/useStats'
import { useNumberFormat } from '~/composables/useNumberFormat'
import { animate as _animate, stagger as _stagger, createTimeline as _createTimeline } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

// Reusable StatItem component
const StatItem = (props: {
  label: string
  value: string | number
  valueClass?: string
}) => {
  return h('div', { class: 'stat-item' }, [
    h('div', { class: 'stat-label' }, props.label),
    h(
      'div',
      { class: props.valueClass || 'text-xl text-zinc-300 tabular-nums' },
      props.value
    )
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
const { timing, easing, staggers } = useAnimations()

const _formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

// Camera/lens/focal length/aperture extraction from gearStats
const topCamera = computed(
  () => props.stats.gearStats?.cameras?.[0]?.name || null
)
const topLens = computed(() => props.stats.gearStats?.lenses?.[0]?.name || null)
const topFocalLength = computed(
  () =>
    props.stats.gearStats?.mostUsedSettings?.focalLengths?.[0]?.value || null
)
const topAperture = computed(
  () => props.stats.gearStats?.mostUsedSettings?.apertures?.[0]?.value || null
)

const hasCameraData = computed(() => {
  return !!(
    topCamera.value ||
    topLens.value ||
    topFocalLength.value ||
    topAperture.value
  )
})

// Animation refs
const photoStatsRef = ref<HTMLElement | null>(null)
const primaryStatRef = ref<HTMLElement | null>(null)
const monthlyStatsRef = ref<HTMLElement | null>(null)
const cameraStatsRef = ref<HTMLElement | null>(null)

// Epic photo stats reveal animation
const animatePhotoStats = async () => {
  if (process.server) return
  
  await nextTick()
  
  if (photoStatsRef.value) {
    const timeline = _createTimeline()
    
    // Stage 1: Primary photo stat dramatic entrance
    if (primaryStatRef.value) {
      timeline.add(primaryStatRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.8, rotateY: -20, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.1, rotateY: 5, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateY: 0, filter: 'blur(0px)' }
        ],
        duration: timing.value.dramatic,
        ease: 'outElastic(1, .8)'
      })
    }
    
    // Stage 2: Monthly stats slide in
    if (monthlyStatsRef.value) {
      timeline.add(monthlyStatsRef.value, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1.02, 1],
        duration: timing.value.slow,
        ease: 'cubicBezier(0.2, 0, 0.38, 0.9)'
      }, '-=400')
    }
    
    // Stage 3: Camera equipment grid cascade
    if (cameraStatsRef.value && hasCameraData.value) {
      const equipmentItems = cameraStatsRef.value.querySelectorAll('.stat-item')
      if (equipmentItems.length) {
        timeline.add(Array.from(equipmentItems), {
          keyframes: [
            { opacity: 0, scale: 0.7, rotateZ: -10, filter: 'blur(1px)' },
            { opacity: 0.8, scale: 1.1, rotateZ: 3, filter: 'blur(0.3px)' },
            { opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)' }
          ],
          duration: timing.value.dramatic,
          delay: _stagger(staggers.normal, { grid: [2, 2], from: 'center' }),
          ease: 'outElastic(1, .8)'
        }, '-=200')
      }
    }
  }
}

onMounted(() => {
  animatePhotoStats()
})
</script>

<style scoped>
/* Using shared styles from global.css */
</style>
