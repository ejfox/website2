<template>
  <div ref="gearStatsRef" class="space-y-8">
    <!-- Top-level stats in grid -->
    <div ref="statsGridRef" class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
      <div class="gear-stat-card space-y-1">
        <div class="text-2xl tabular-nums">
          <AnimatedNumber :value="totalItems" format="default" :duration="timing.expressive" priority="primary" epic />
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Total Items
        </div>
      </div>
      
      <div class="gear-stat-card space-y-1">
        <div class="text-2xl tabular-nums">
          <AnimatedNumber :value="parseFloat(totalWeight)" format="decimal" decimals="1" :duration="timing.expressive" priority="primary" epic />
          <span class="text-sm text-zinc-500">oz</span>
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Total Weight
        </div>
      </div>

      <div class="gear-stat-card space-y-1">
        <div class="text-2xl tabular-nums">
          <AnimatedNumber :value="containerCount" format="default" :duration="timing.slower" priority="secondary" epic />
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Containers
        </div>
      </div>

      <div class="gear-stat-card space-y-1">
        <div class="text-2xl tabular-nums">
          <AnimatedNumber :value="parseFloat(avgTCWMScore)" format="decimal" decimals="1" :duration="timing.slow" priority="secondary" epic />
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Avg TCWM
        </div>
      </div>
    </div>

    <!-- Type distribution -->
    <div ref="distributionRef" class="space-y-3">
      <div class="text-xs text-zinc-500 uppercase tracking-wider">
        Gear Type Distribution
      </div>
      <div class="space-y-2">
        <div
          v-for="[type, count] in sortedTypeDistribution" :key="type" 
          class="flex items-center gap-2 text-xs type-row"
        >
          <div class="w-24 text-right truncate text-zinc-500">
            {{ type }}
          </div>
          <div
            class="h-4 bg-zinc-800/50 type-bar" 
            :style="{ width: `${(count / maxTypeCount) * 200}px` }"
          >
          </div>
          <span class="text-zinc-400">
            <AnimatedNumber :value="count" format="default" :duration="timing.normal" priority="tertiary" />
          </span>
        </div>
      </div>
    </div>

    <!-- Weight conversions -->
    <div ref="conversionsRef" class="text-xs text-zinc-500">
      <span class="uppercase tracking-wider">Weight Conversion:</span>
      <AnimatedNumber :value="parseFloat(ouncesToPounds)" format="decimal" decimals="1" :duration="timing.slow" priority="tertiary" />lb / 
      <AnimatedNumber :value="parseFloat(ouncesToKilos)" format="decimal" decimals="1" :duration="timing.normal" priority="tertiary" />kg
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import AnimatedNumber from '../AnimatedNumber.vue'
import { animate, stagger as _stagger, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

interface GearItem {
  Type?: string
  'Base Weight ()'?: string
  'Parent Container'?: string
  'Time Criticality (T)'?: string
  'Consequence Severity (C)'?: string
  'Weight/Space Penalty (W)'?: string
  'Multi-Use Factor (M)'?: string
}

const gearItems = ref<GearItem[]>([])
const { timing, easing, staggers } = useAnimations()

// Computed stats
const totalItems = computed(() => gearItems.value.length)

const totalWeight = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  return gearItems.value
    .reduce((sum, item) => sum + (parseFloat(item['Base Weight ()'] || '0') || 0), 0)
    .toFixed(1)
})

const containerCount = computed(() => {
  return new Set(gearItems.value.map(item => item['Parent Container'])).size
})

const avgTCWMScore = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  const scores = gearItems.value.map(item => {
    const T = Number(item['Time Criticality (T)']) || 0
    const C = Number(item['Consequence Severity (C)']) || 0
    const W = Number(item['Weight/Space Penalty (W)']) || 0
    const M = Number(item['Multi-Use Factor (M)']) || 0
    return (2 * T) + (2 * C) + (1.5 * W) + M
  })
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

interface TypeDistribution {
  [key: string]: number
}

const typeDistribution = computed<TypeDistribution>(() => {
  return gearItems.value.reduce((acc: TypeDistribution, item) => {
    if (item.Type) {
      acc[item.Type] = (acc[item.Type] || 0) + 1
    }
    return acc
  }, {})
})

const sortedTypeDistribution = computed(() => {
  return Object.entries(typeDistribution.value)
    .sort((a, b) => b[1] - a[1])
})

const maxTypeCount = computed(() => {
  return Math.max(...Object.values(typeDistribution.value))
})

const ouncesToPounds = computed(() => {
  const pounds = Number(totalWeight.value) / 16
  return pounds.toFixed(1)
})

const ouncesToKilos = computed(() => {
  const kilos = Number(totalWeight.value) * 0.0283495
  return kilos.toFixed(1)
})

// Animation refs
const gearStatsRef = ref<HTMLElement | null>(null)
const statsGridRef = ref<HTMLElement | null>(null)
const distributionRef = ref<HTMLElement | null>(null)
const conversionsRef = ref<HTMLElement | null>(null)

// Epic gear stats scroll-triggered animations
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!gearStatsRef.value) return

    // Stats grid staggered entrance
    if (statsGridRef.value) {
      const statCards = statsGridRef.value.querySelectorAll('.gear-stat-card')
      if (statCards.length) {
        animate(Array.from(statCards), {
          keyframes: [
            { opacity: 0, scale: 0.7, translateY: 20, filter: 'blur(1px)' },
            { opacity: 0.8, scale: 1.08, translateY: -3, filter: 'blur(0.3px)' },
            { opacity: 1, scale: 1, translateY: 0, filter: 'blur(0px)' }
          ],
          duration: timing.expressive,
          delay: _stagger(staggers.loose, { from: 'first' }),
          ease: easing.bounce,
          autoplay: onScroll({
            target: statsGridRef.value,
            onEnter: () => true
          })
        })
      }
    }

    // Type distribution bars epic growth
    if (distributionRef.value) {
      const typeBars = distributionRef.value.querySelectorAll('.type-bar')
      const typeRows = distributionRef.value.querySelectorAll('.type-row')
      
      if (typeBars.length) {
        animate(Array.from(typeBars), {
          scaleX: [0, 1.1, 1],
          duration: timing.slow,
          delay: _stagger(staggers.normal),
          ease: easing.bounce,
          autoplay: onScroll({
            target: distributionRef.value,
            onEnter: () => true
          })
        })
      }

      if (typeRows.length) {
        animate(Array.from(typeRows), {
          opacity: [0, 1],
          translateX: [-10, 0],
          duration: timing.expressive,
          delay: _stagger(staggers.tight),
          ease: easing.standard,
          autoplay: onScroll({
            target: distributionRef.value,
            onEnter: () => true
          })
        })
      }
    }

    // Weight conversions subtle entrance
    if (conversionsRef.value) {
      animate(conversionsRef.value, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: timing.slow,
        ease: easing.standard,
        autoplay: onScroll({
          target: conversionsRef.value,
          onEnter: () => true
        })
      })
    }
  })
}

// Load gear data and setup animations
onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText) as GearItem[]
  } catch (_error) {
    console.error('Error loading gear data:', _error)
  }
  
  setupScrollAnimations()
})
</script>

<style scoped>
.text-2xl {
  font-feature-settings: "tnum";
}

/* Gear stat card styling */
.gear-stat-card {
  @apply p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30;
}

/* Type bar animation base */
.type-bar {
  @apply transition-all duration-300 rounded-sm;
}
</style> 