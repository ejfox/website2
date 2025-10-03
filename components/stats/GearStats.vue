<template>
  <div ref="gearStatsRef" class="space-y-8 pr-4 md:pr-8">
    <!-- Main Containers - HUD Style -->
    <div ref="containersRef" class="space-y-2 mb-8 font-mono">
      <StatsSectionHeader title="CARRYING_SYSTEMS" />
      <div class="space-y-1 text-xs">
        <div
          v-for="container in mainContainers"
          :key="container.name"
          class="container-item flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
        >
          <div class="flex items-center gap-2">
            <span class="text-zinc-500 w-8">{{
              container.type.substring(0, 3).toUpperCase()
            }}</span>
            <span class="text-zinc-700 dark:text-zinc-300 min-w-0 flex-1">{{
              container.name
            }}</span>
          </div>
          <div class="flex items-center gap-4 text-zinc-500 tabular-nums">
            <span>{{ container.itemCount }}x</span>
            <span class="text-right w-12">{{ container.weight }}oz</span>
          </div>
        </div>
      </div>
    </div>

    <!-- HUD Stats Inline -->
    <div ref="statsGridRef" class="font-mono text-xs space-y-1 mb-8">
      <div
        class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
      >
        <span class="text-zinc-500 uppercase tracking-widest">TOTAL_ITEMS</span>
        <span class="tabular-nums text-zinc-700 dark:text-zinc-300">
          {{ totalItems }}
        </span>
      </div>
      <div
        class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
      >
        <span class="text-zinc-500 uppercase tracking-widest"
          >TOTAL_WEIGHT</span
        >
        <span class="tabular-nums text-zinc-700 dark:text-zinc-300">
          {{ totalWeight.toFixed(1) }}oz
        </span>
      </div>
      <div
        class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
      >
        <span class="text-zinc-500 uppercase tracking-widest">CONTAINERS</span>
        <span class="tabular-nums text-zinc-700 dark:text-zinc-300">
          {{ containerCount }}
        </span>
      </div>
      <div
        class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
      >
        <span class="text-zinc-500 uppercase tracking-widest">AVG_TCWM</span>
        <span class="tabular-nums text-zinc-700 dark:text-zinc-300">
          {{ avgTCWMScore.toFixed(1) }}
        </span>
      </div>
      <div
        class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1"
      >
        <span class="text-zinc-500 uppercase tracking-widest">WEIGHT_CONV</span>
        <span class="tabular-nums text-zinc-700 dark:text-zinc-300">
          {{ ouncesToPounds.toFixed(1) }}lb / {{ ouncesToKilos.toFixed(1) }}kg
        </span>
      </div>
    </div>

    <!-- Type distribution - HUD Style -->
    <div ref="distributionRef" class="font-mono text-xs">
      <StatsSectionHeader title="TYPE_DISTRIBUTION" />
      <div class="space-y-1">
        <div
          v-for="[type, count] in sortedTypeDistribution"
          :key="type"
          class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 type-row"
        >
          <div class="flex items-center gap-2">
            <span class="text-zinc-500 w-16 text-right uppercase">{{
              type
            }}</span>
            <div class="flex-1 flex items-center">
              <div
                class="h-2 type-bar bg-zinc-400 dark:bg-zinc-600"
                :style="{
                  width: `${Math.max(8, (count / maxTypeCount) * 60)}px`
                }"
              ></div>
            </div>
          </div>
          <span
            class="text-zinc-700 dark:text-zinc-300 tabular-nums w-8 text-right"
          >
            {{ count }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Nuxt 4 auto-imports everything!
import * as d3 from 'd3'
import StatsSectionHeader from './StatsSectionHeader.vue'
// NUKED BY BLOODHOUND: import { animate, stagger as _stagger, onScroll } from '~/anime.esm.js'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

interface GearItem {
  Name?: string
  Type?: string
  'Base Weight ()'?: string
  'Parent Container'?: string
  'Time Criticality (T)'?: string
  'Consequence Severity (C)'?: string
  'Weight/Space Penalty (W)'?: string
  'Multi-Use Factor (M)'?: string
}

const props = defineProps<{
  gearStats?: {
    stats: {
      totalItems: number
      totalWeight: number
      containerCount: number
      avgTCWMScore: number
    }
    typeDistribution: Record<string, number>
  }
}>()

const gearItems = ref<GearItem[]>([])

// Computed stats - use API data if available, fall back to CSV data
const totalItems = computed(() => {
  return props.gearStats?.stats.totalItems ?? gearItems.value.length
})

const totalWeight = computed(() => {
  if (props.gearStats?.stats.totalWeight !== undefined) {
    return props.gearStats.stats.totalWeight
  }

  if (!gearItems.value?.length) return 0
  const weight = gearItems.value.reduce((sum, item) => {
    const weightStr = item['Base Weight ()']
    const weightNum =
      weightStr && weightStr.trim() !== '' ? parseFloat(weightStr) : 0
    return sum + (isNaN(weightNum) ? 0 : weightNum)
  }, 0)
  return weight
})

const containerCount = computed(() => {
  if (props.gearStats?.stats.containerCount !== undefined) {
    return props.gearStats.stats.containerCount
  }

  const containers = gearItems.value
    .map((item) => item['Parent Container'])
    .filter((container) => container && container.trim() !== '')
  return new Set(containers).size
})

const avgTCWMScore = computed(() => {
  if (props.gearStats?.stats.avgTCWMScore !== undefined) {
    return props.gearStats.stats.avgTCWMScore
  }

  if (!gearItems.value?.length) return 0
  const scores = gearItems.value.map((item) => {
    const T = Number(item['Time Criticality (T)']) || 0
    const C = Number(item['Consequence Severity (C)']) || 0
    const W = Number(item['Weight/Space Penalty (W)']) || 0
    const M = Number(item['Multi-Use Factor (M)']) || 0
    return 2 * T + 2 * C + 1.5 * W + M
  })
  return scores.reduce((a, b) => a + b, 0) / scores.length
})

interface TypeDistribution {
  [key: string]: number
}

const typeDistribution = computed<TypeDistribution>(() => {
  if (props.gearStats?.typeDistribution) {
    return props.gearStats.typeDistribution
  }

  return gearItems.value.reduce((acc: TypeDistribution, item) => {
    if (item.Type) {
      acc[item.Type] = (acc[item.Type] || 0) + 1
    }
    return acc
  }, {})
})

const sortedTypeDistribution = computed(() => {
  return Object.entries(typeDistribution.value).sort((a, b) => b[1] - a[1])
})

const maxTypeCount = computed(() => {
  return Math.max(...Object.values(typeDistribution.value))
})

const ouncesToPounds = computed(() => {
  const pounds = Number(totalWeight.value) / 16
  return pounds
})

const ouncesToKilos = computed(() => {
  const kilos = Number(totalWeight.value) * 0.0283495
  return kilos
})

// Main containers - top-level bags and carrying systems
const mainContainers = computed(() => {
  if (!gearItems.value?.length) return []

  // Find items that are bags/containers
  const containers = gearItems.value.filter(
    (item) =>
      item.Type === 'Bag' &&
      (item['Parent Container'] === 'Body' ||
        item['Parent Container'] === 'Motorcycle' ||
        !item['Parent Container'] ||
        item['Parent Container'].trim() === '')
  )

  return containers
    .map((container) => {
      const containerName = container.Name || 'Unknown Container'

      // Count items that have this container as their parent
      const childItems = gearItems.value.filter(
        (item) => item['Parent Container'] === containerName
      )

      // Calculate total weight (container + contents)
      const containerWeight =
        parseFloat(container['Base Weight ()'] || '0') || 0
      const contentsWeight = childItems.reduce((sum, item) => {
        const weight = parseFloat(item['Base Weight ()'] || '0') || 0
        return sum + weight
      }, 0)

      return {
        name: containerName,
        type: container.Type || 'Container',
        weight: (containerWeight + contentsWeight).toFixed(1),
        itemCount: childItems.length,
        parentContainer: container['Parent Container'] || 'Body'
      }
    })
    .sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight))
})

// Animation refs
const gearStatsRef = ref<HTMLElement | null>(null)
const containersRef = ref<HTMLElement | null>(null)
const statsGridRef = ref<HTMLElement | null>(null)
const distributionRef = ref<HTMLElement | null>(null)
const conversionsRef = ref<HTMLElement | null>(null)

// Load gear data and setup animations
onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText) as GearItem[]
  } catch (_error) {
    console.error('Error loading gear data:', _error)
  }

  // Animation setup removed following delete-driven development
})
</script>

<style scoped>
.text-2xl {
  font-feature-settings: 'tnum';
}

/* Container items styling */
.container-item {
  @apply transition-all duration-300;
}

/* Type bar animation base */
.type-bar {
  @apply transition-all duration-300 rounded-sm;
}
</style>
