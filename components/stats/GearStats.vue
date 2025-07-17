<template>
  <div class="space-y-8">
    <!-- Top-level stats in grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
      <div class="space-y-1">
        <div class="text-2xl tabular-nums">
          {{ totalItems }}
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Total Items
        </div>
      </div>
      
      <div class="space-y-1">
        <div class="text-2xl tabular-nums">
          {{ totalWeight }}
          <span class="text-sm text-zinc-500">oz</span>
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Total Weight
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-2xl tabular-nums">
          {{ containerCount }}
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Containers
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-2xl tabular-nums">
          {{ avgTCWMScore }}
        </div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider">
          Avg TCWM
        </div>
      </div>
    </div>

    <!-- Type distribution -->
    <div class="space-y-3">
      <div class="text-xs text-zinc-500 uppercase tracking-wider">
        Gear Type Distribution
      </div>
      <div class="space-y-2">
        <div
          v-for="[type, count] in sortedTypeDistribution" :key="type" 
          class="flex items-center gap-2 text-xs"
        >
          <div class="w-24 text-right truncate text-zinc-500">
            {{ type }}
          </div>
          <div
            class="h-4 bg-zinc-800/50" 
            :style="{ width: `${(count / maxTypeCount) * 200}px` }"
          >
          </div>
          <span class="text-zinc-400">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- Weight conversions -->
    <div class="text-xs text-zinc-500">
      <span class="uppercase tracking-wider">Weight Conversion:</span>
      {{ ouncesToPounds }}lb / {{ ouncesToKilos }}kg
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as d3 from 'd3'

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

// Load gear data
onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText) as GearItem[]
  } catch (error) {
    console.error('Error loading gear data:', error)
  }
})

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
</script>

<style scoped>
.text-2xl {
  font-feature-settings: "tnum";
}
</style> 