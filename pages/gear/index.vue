<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
    <header class="mb-12 lg:mb-16">
      <div class="flex items-baseline justify-between pb-6 mb-8 border-b border-zinc-300 dark:border-zinc-700">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Gear Inventory
        </h1>
        <a href="/gear.csv" download class="gear-csv-link">
          ↓ CSV
        </a>
      </div>

      <div class="mb-8 lg:mb-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mb-6">
          <div class="gear-stat">
            <div class="gear-stat-label">
              Total
            </div>
            <div class="gear-stat-value">
              {{ totalItems }}
            </div>
            <div class="gear-stat-unit">
              items
            </div>
          </div>
          <div class="gear-stat">
            <div class="gear-stat-label">
              Weight
            </div>
            <div class="gear-stat-value">
              {{ totalWeightInGrams }}
            </div>
            <div class="gear-stat-unit">
              grams
            </div>
          </div>
          <div class="gear-stat">
            <div class="gear-stat-label">
              Avg Wt
            </div>
            <div class="gear-stat-value">
              {{ avgWeightInGrams }}
            </div>
            <div class="gear-stat-unit">
              grams
            </div>
          </div>
          <div class="gear-stat">
            <div class="gear-stat-label">
              Containers
            </div>
            <div class="gear-stat-value">
              {{ containerCount }}
            </div>
            <div class="gear-stat-unit">
              total
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="gear-section-header mb-3">
            Type Legend
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div v-for="type in typeStats" :key="type.name" class="flex items-center gap-2 text-xs">
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">{{ type.symbol }}</span>
              <div class="flex-1">
                <div class="font-medium text-zinc-700 dark:text-zinc-300">
                  {{ type.name }}
                </div>
                <div class="text-[10px] text-zinc-500 tabular-nums">
                  {{ type.count }} items · {{ type.weight }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <span class="uppercase tracking-[0.1em]">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <div class="mb-16">
      <h2 class="gear-section-header mb-6">
        Containers
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <a
          v-for="[container, items] in groupedGear" :key="container" 
          :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
          class="gear-container-card group"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{{ container }}</span>
            <span class="gear-container-count">{{ items.length }}</span>
          </div>
          <div class="flex flex-wrap gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              v-for="item in getSortedItemsByType(items)" :key="item.Name" 
              :title="`${item.Type}: ${item.Name}`" class="cursor-help"
            >
              {{ getTypeSymbol(item.Type) }}
            </span>
          </div>
        </a>
      </div>
    </div>

    <div class="space-y-16">
      <section
        v-for="[container, items] in groupedGear" :id="container.toLowerCase().replace(/\s+/g, '-')"
        :key="container" class="scroll-mt-4"
      >
        <div class="gear-container-header">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {{ container }}
          </h2>
          <div class="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-x-4">
            <span class="tabular-nums">{{ calculateTotalWeightInGrams(items) }}</span>
            <span class="uppercase tracking-[0.1em]">{{ items.length }} items</span>
          </div>
        </div>

        <div class="relative">
          <div class="gear-table-header">
            <div class="col-span-6">
              Item
            </div>
            <div class="col-span-2 text-center">
              Type
            </div>
            <div class="col-span-2 text-center">
              H₂O
            </div>
            <div class="col-span-1 text-center">
              Tier
            </div>
            <div class="col-span-1 text-right">
              Wt
            </div>
          </div>
          <div class="divide-y divide-zinc-800/10">
            <GearItem v-for="item in sortItemsByScore(items)" :key="item.Name" :item="item" />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { csvParse } from 'd3-dsv' // TREE-SHAKEN: Only import what we need (~2KB vs 200KB)

const { calculateTotalWeight, calculateAverageWeight } = useWeightCalculations()
const gearItems = ref([])

const typeSymbols = {
  Tech: '▲', Utility: '⬟', Comfort: '○', Sleep: '☽',
  Bag: '▣', Safety: '◆', Creativity: '✧'
}

const getTypeSymbol = (type) => typeSymbols[type] || '—'

const getSortedItemsByType = (items) => {
  const typeOrder = ['Tech', 'Utility', 'Comfort', 'Sleep', 'Bag', 'Safety', 'Creativity']
  return [...items].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.Type)
    const bIndex = typeOrder.indexOf(b.Type)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

const PRIORITY_CONTAINERS = ['Body', 'Motorcycle', 'WLF Enduro Backpack', '5.11 Rush 24 Backpack']

const groupedGear = computed(() => {
  const groups = new Map()
  const containers = new Set(gearItems.value.map(item => item['Parent Container']))
  containers.forEach(container => groups.set(container || 'Unassigned', []))
  
  gearItems.value.forEach(item => {
    const container = item['Parent Container'] || 'Unassigned'
    groups.get(container).push(item)
  })

  const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
    const aIndex = PRIORITY_CONTAINERS.indexOf(a[0])
    const bIndex = PRIORITY_CONTAINERS.indexOf(b[0])
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
  return new Map(sortedEntries)
})

const calculateTotalWeightInGrams = (items) => calculateTotalWeight(items).formatted

const addAffiliateCode = (url) => {
  if (!url?.includes('amazon.com')) return url
  const amazonUrl = new URL(url)
  amazonUrl.searchParams.set('tag', 'ejfox0c-20')
  return amazonUrl.toString()
}

const processGearItem = (item) => {
  if (item.amazon) item.amazon = addAffiliateCode(item.amazon)
  return item
}

onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = csvParse(csvText).map(processGearItem) // Tree-shaken D3!
  } catch (error) {
    console.error('Error loading gear data:', error)
  }
})


const totalItems = computed(() => gearItems.value.length)
const totalWeight = computed(() => calculateTotalWeight(gearItems.value).ounces.toFixed(1))
const containerCount = computed(() => groupedGear.value?.size || 0)
const totalWeightInGrams = computed(() => calculateTotalWeight(gearItems.value).grams)
const avgWeightInGrams = computed(() => calculateAverageWeight(gearItems.value).grams)

const typeStats = computed(() => {
  const stats = Object.keys(typeSymbols)
    .map(typeName => {
      const items = gearItems.value.filter(item => item.Type === typeName)
      const totalWeightData = calculateTotalWeight(items)
      return {
        name: typeName,
        symbol: typeSymbols[typeName],
        count: items.length,
        weight: totalWeightData.formatted
      }
    })
    .filter(stat => stat.count > 0)
  return stats.sort((a, b) => b.count - a.count)
})

const typeBreakdown = computed(() => {
  const types = gearItems.value.reduce((acc, item) => {
    if (item.Type) acc[item.Type] = (acc[item.Type] || 0) + 1
    return acc
  }, {})
  return Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ')
})

const calculateTCWMScore = (item) => {
  const T = Number(item['Time Criticality (T)']) || 0
  const C = Number(item['Consequence Severity (C)']) || 0
  const W = Number(item['Weight/Space Penalty (W)']) || 0
  const M = Number(item['Multi-Use Factor (M)']) || 0
  return 2 * T + 2 * C + 1.5 * W + M
}

const sortItemsByScore = (items) => {
  return [...items].sort((a, b) => calculateTCWMScore(b) - calculateTCWMScore(a))
}

const currentDate = new Date().toISOString().split('T')[0]

useHead(() => ({
  title: 'Adventure Gear Inventory',
  meta: [{
    name: 'description',
    content: `Comprehensive gear inventory tracking ${totalItems.value} items across ${containerCount.value} containers. Total weight: ${totalWeight.value}oz. Main categories: ${typeBreakdown.value}.`
  }]
}))
</script>

<style>
.gear-csv-link {
  @apply text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400;
  @apply inline-flex items-center gap-1.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors;
}

.gear-stat {
  @apply space-y-1;
}

.gear-stat-label {
  @apply text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400;
}

.gear-stat-value {
  @apply text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100;
}

.gear-stat-unit {
  @apply text-xs text-zinc-500 dark:text-zinc-400;
}

.gear-section-header {
  @apply text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400;
}

.gear-container-card {
  @apply flex flex-col py-3 px-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50;
  @apply transition-colors border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg;
}

.gear-container-count {
  @apply text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400;
  @apply group-hover:text-zinc-700 dark:group-hover:text-zinc-300;
}

.gear-container-header {
  @apply flex items-baseline justify-between pb-4 mb-8;
  @apply border-b border-zinc-300 dark:border-zinc-700;
}

.gear-table-header {
  @apply grid grid-cols-12 gap-3 py-3 px-2 text-xs font-mono uppercase tracking-[0.1em];
  @apply text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/50 dark:border-zinc-700/50 mb-4;
}
</style>
