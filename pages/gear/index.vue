<template>
  <main class="px-4 md:px-6 lg:px-8 max-w-full bg-zinc-950 min-h-screen">
    <header class="mb-4">
      <div
        class="flex items-center justify-between py-3 mb-4 border-b border-zinc-800"
      >
        <div class="flex items-baseline gap-3">
          <h1 class="font-mono text-sm text-zinc-100">GEAR</h1>
          <div
            class="font-mono text-[10px] text-zinc-500"
            style="font-variant-numeric: tabular-nums"
          >
            {{ totalItems }} items · {{ displayTotalWeight.value }} ·
            {{ containerCount }} bags
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Weight Unit Selector -->
          <div class="relative">
            <select
              v-model="weightUnit"
              class="px-3 py-1 pr-6 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all cursor-pointer appearance-none"
            >
              <option value="metric">KG/G</option>
              <option value="imperial">LB/OZ</option>
            </select>
            <span
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-zinc-500 pointer-events-none"
              >▼</span
            >
          </div>
          <button
            @click="toggleSort"
            class="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all flex items-center gap-1"
            title="Toggle sort"
          >
            <span class="text-[8px]">{{
              sortBy === 'weight' ? '↓' : '↑'
            }}</span>
            {{ sortBy === 'weight' ? 'Weight' : 'Name' }}
          </button>
          <a
            href="/gear.csv"
            download
            class="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-all inline-flex items-center gap-1"
          >
            <span>↓</span> CSV
          </a>
        </div>
      </div>

      <div class="mb-3">
        <div class="mb-3">
          <h3 class="gear-section-header mb-2">Type Legend</h3>
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="type in typeStats"
              :key="type.name"
              class="flex items-center gap-1"
            >
              <span class="text-xs font-medium text-zinc-500">{{
                type.symbol
              }}</span>
              <div class="flex-1">
                <div class="font-mono text-[10px] text-zinc-400">
                  {{ type.name }}
                </div>
                <div class="text-[9px] text-zinc-500 tabular-nums">
                  {{ type.count }} · {{ type.weight }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end text-[9px] font-mono text-zinc-600 pt-2 border-t border-zinc-800"
        >
          <span class="uppercase tracking-[0.1em]">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <div class="mb-8">
      <h2 class="gear-section-header mb-4">Containers</h2>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
      >
        <a
          v-for="[container, items] in groupedGear"
          :key="container"
          :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
          class="gear-container-card group"
        >
          <div class="flex items-baseline justify-between">
            <span class="font-mono text-[10px] text-zinc-200">{{
              container
            }}</span>
            <div class="text-[8px] text-zinc-600 tabular-nums">
              <span>{{ items.length }}×</span>
              <span class="text-zinc-500">{{ getAvgItemWeight(items) }}</span>
            </div>
          </div>
          <div class="mt-1">
            <!-- Weight distribution bar -->
            <div class="flex h-0.5 bg-zinc-900">
              <div
                v-for="item in items.slice(0, 20)"
                :key="item.Name"
                class="bg-zinc-700 hover:bg-orange-500 transition-colors"
                :style="{
                  width: `${getWeightPercentage(item, items)}%`,
                  opacity:
                    0.3 + getItemWeightInOunces(item) / getMaxWeight(items)
                }"
                :title="`${item.Name}: ${formatItemWeight(item)}`"
              ></div>
            </div>
            <div
              class="flex justify-between mt-1 text-[7px] text-zinc-600 font-mono"
            >
              <span>{{ formatWeight(items) }}</span>
              <span>{{ getWeightRange(items) }}</span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div class="space-y-12">
      <section
        v-for="[container, items] in groupedGear"
        :id="container.toLowerCase().replace(/\s+/g, '-')"
        :key="container"
        class="scroll-mt-4"
      >
        <div class="gear-container-header">
          <div class="flex items-baseline gap-3">
            <h2 class="text-[11px] font-mono text-zinc-200">
              {{ container }}
            </h2>
            <span class="text-[8px] text-zinc-600"
              >{{ items.length }}×{{ getAvgItemWeight(items) }}</span
            >
            <span class="text-[8px] text-zinc-600">{{
              getWeightRange(items)
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-mono text-zinc-500 tabular-nums">{{
              formatWeight(items)
            }}</span>
            <!-- Mini histogram -->
            <div class="flex items-end gap-px h-3">
              <div
                v-for="(bucket, i) in getWeightHistogram(items)"
                :key="i"
                class="w-1 bg-zinc-700/50 hover:bg-orange-500/50 transition-colors"
                :style="{ height: `${bucket.height}%` }"
                :title="`${bucket.count} items: ${bucket.range}`"
              ></div>
            </div>
          </div>
        </div>

        <div class="relative overflow-x-auto">
          <table class="w-full text-[9px] font-mono">
            <thead class="sticky top-0 bg-zinc-950 backdrop-blur-sm">
              <tr class="border-b border-zinc-800/30">
                <th
                  class="text-left px-1 py-1 font-normal text-zinc-500 text-[8px] uppercase"
                >
                  Item
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  Type
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  Cat
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  H₂O
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  Pri
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  ⚡
                </th>
                <th
                  class="text-center px-1 py-1 font-normal text-zinc-500 text-[8px]"
                >
                  Age
                </th>
                <th
                  class="text-right px-1 py-1 font-normal text-zinc-500 text-[8px] pr-2"
                >
                  g/oz
                </th>
              </tr>
            </thead>
            <tbody class="bg-zinc-950">
              <GearItem
                v-for="item in sortItems(items)"
                :key="item.Name"
                :item="item"
                :weight-unit="weightUnit"
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { csvParse } from 'd3-dsv' // TREE-SHAKEN: Only import what we need (~2KB vs 200KB)

// HTML escaping function for attributes
const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, (m) => map[m])
}

const { calculateTotalWeight, calculateAverageWeight, getItemWeightInOunces } =
  useWeightCalculations()
const gearItems = ref([])
const weightUnit = ref('metric')
const sortBy = ref('weight')

// Initialize weight unit from localStorage on client side only
onMounted(() => {
  if (process.client) {
    weightUnit.value = localStorage.getItem('gear-weight-unit') || 'metric'
  }
})

// Watch for changes and persist to localStorage
watch(weightUnit, (newValue) => {
  if (process.client) {
    localStorage.setItem('gear-weight-unit', newValue)
  }
})

const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Creativity: '✧'
}

const getTypeSymbol = (type) => typeSymbols[type] || '—'

const getSortedItemsByType = (items) => {
  const typeOrder = [
    'Tech',
    'Utility',
    'Comfort',
    'Sleep',
    'Bag',
    'Safety',
    'Creativity'
  ]
  return [...items].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.Type)
    const bIndex = typeOrder.indexOf(b.Type)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

const PRIORITY_CONTAINERS = [
  'Body',
  'Motorcycle',
  'WLF Enduro Backpack',
  '5.11 Rush 24 Backpack'
]

const groupedGear = computed(() => {
  const groups = new Map()
  const containers = new Set(
    gearItems.value.map((item) => item['Parent Container'])
  )
  containers.forEach((container) => groups.set(container || 'Unassigned', []))

  gearItems.value.forEach((item) => {
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

const calculateTotalWeightInGrams = (items) =>
  calculateTotalWeight(items).formatted

// Helper function to format weight for any set of items
const formatWeight = (items) => {
  const weightData = calculateTotalWeight(items)
  if (weightUnit.value === 'imperial') {
    const pounds = Math.floor(weightData.ounces / 16)
    const ounces = Math.round(weightData.ounces % 16)
    return pounds > 0 ? `${pounds}lb ${ounces}oz` : `${ounces}oz`
  } else {
    const kg = Math.floor(weightData.grams / 1000)
    const grams = Math.round(weightData.grams % 1000)
    return kg > 0 ? `${kg}kg ${grams}g` : `${grams}g`
  }
}

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

// Fetch gear data using Nuxt's data fetching
const { data: csvText } = await useFetch('/api/gear-csv')

// Process CSV data when available
watchEffect(() => {
  if (csvText.value) {
    try {
      gearItems.value = csvParse(csvText.value)
        .filter((item) => {
          // Filter out empty rows and comment lines
          return (
            item.Name && item.Name.trim() !== '' && !item.Name.startsWith('#')
          )
        })
        .map(processGearItem)
    } catch (error) {
      console.error('Error parsing gear data:', error)
    }
  }
})

const totalItems = computed(() => gearItems.value.length)
const totalWeight = computed(() =>
  calculateTotalWeight(gearItems.value).ounces.toFixed(1)
)
const containerCount = computed(() => groupedGear.value?.size || 0)
const totalWeightInGrams = computed(
  () => calculateTotalWeight(gearItems.value).grams
)
const avgWeightInGrams = computed(
  () => calculateAverageWeight(gearItems.value).grams
)

// Weight display computeds based on selected unit
const displayTotalWeight = computed(() => {
  const totalWeightData = calculateTotalWeight(gearItems.value)
  if (weightUnit.value === 'imperial') {
    const pounds = Math.floor(totalWeightData.ounces / 16)
    const ounces = (totalWeightData.ounces % 16).toFixed(1)
    return {
      value: pounds > 0 ? `${pounds}lb ${ounces}oz` : `${ounces}oz`,
      unit: pounds > 0 ? '' : ''
    }
  } else {
    const kg = Math.floor(totalWeightData.grams / 1000)
    const grams = totalWeightData.grams % 1000
    return {
      value: kg > 0 ? `${kg}kg ${grams}g` : `${grams}g`,
      unit: ''
    }
  }
})

const displayAvgWeight = computed(() => {
  const avgWeightData = calculateAverageWeight(gearItems.value)
  if (weightUnit.value === 'imperial') {
    return {
      value: avgWeightData.ounces.toFixed(1),
      unit: 'oz'
    }
  } else {
    return {
      value: avgWeightData.grams,
      unit: 'g'
    }
  }
})

const typeStats = computed(() => {
  const stats = Object.keys(typeSymbols)
    .map((typeName) => {
      const items = gearItems.value.filter((item) => item.Type === typeName)
      return {
        name: typeName,
        symbol: typeSymbols[typeName],
        count: items.length,
        weight: formatWeight(items)
      }
    })
    .filter((stat) => stat.count > 0)
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

const sortItemsByName = (items) => {
  return [...items].sort((a, b) => a.Name.localeCompare(b.Name))
}

const sortItemsByWeight = (items) => {
  return [...items].sort((a, b) => {
    const aWeight = parseFloat(a.Weight_oz) || 0
    const bWeight = parseFloat(b.Weight_oz) || 0
    return bWeight - aWeight // Heaviest first
  })
}

const sortItems = (items) => {
  return sortBy.value === 'weight'
    ? sortItemsByWeight(items)
    : sortItemsByName(items)
}

const toggleSort = () => {
  sortBy.value = sortBy.value === 'weight' ? 'name' : 'weight'
}

// Tuftian data helpers
const getAvgItemWeight = (items) => {
  const avgWeight = calculateAverageWeight(items)
  if (weightUnit.value === 'imperial') {
    return avgWeight.ounces > 16
      ? `${(avgWeight.ounces / 16).toFixed(1)}lb`
      : `${avgWeight.ounces.toFixed(0)}oz`
  }
  return avgWeight.grams > 1000
    ? `${(avgWeight.grams / 1000).toFixed(1)}kg`
    : `${Math.round(avgWeight.grams)}g`
}

const getWeightPercentage = (item, allItems) => {
  const itemWeight = getItemWeightInOunces(item)
  const totalWeight = calculateTotalWeight(allItems).ounces
  return ((itemWeight / totalWeight) * 100).toFixed(1)
}

const getMaxWeight = (items) => {
  return Math.max(...items.map((item) => getItemWeightInOunces(item)))
}

const formatItemWeight = (item) => {
  const oz = getItemWeightInOunces(item)
  if (weightUnit.value === 'imperial') {
    return oz > 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(1)}oz`
  }
  const grams = Math.round(oz * 28.3495)
  return grams > 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams}g`
}

const getWeightRange = (items) => {
  const weights = items
    .map((item) => getItemWeightInOunces(item))
    .filter((w) => w > 0)
  if (weights.length === 0) return '—'
  const min = Math.min(...weights)
  const max = Math.max(...weights)

  if (weightUnit.value === 'imperial') {
    return `${min.toFixed(0)}–${max.toFixed(0)}oz`
  }
  const minG = Math.round(min * 28.3495)
  const maxG = Math.round(max * 28.3495)
  return `${minG}–${maxG}g`
}

const getWeightHistogram = (items) => {
  const weights = items
    .map((item) => getItemWeightInOunces(item))
    .filter((w) => w > 0)
  if (weights.length === 0) return []

  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const bucketCount = Math.min(10, weights.length)
  const bucketSize = (max - min) / bucketCount

  const buckets = Array(bucketCount).fill(0)
  weights.forEach((w) => {
    const bucketIndex = Math.min(
      Math.floor((w - min) / bucketSize),
      bucketCount - 1
    )
    buckets[bucketIndex]++
  })

  const maxCount = Math.max(...buckets)
  return buckets.map((count, i) => ({
    count,
    height: (count / maxCount) * 100,
    range: `${(min + i * bucketSize).toFixed(0)}-${(min + (i + 1) * bucketSize).toFixed(0)}oz`
  }))
}

const currentDate = new Date().toISOString().split('T')[0]

useHead(() => ({
  title: 'Adventure Gear Inventory',
  meta: [
    {
      name: 'description',
      content: `Comprehensive gear inventory tracking ${totalItems.value} items across ${containerCount.value} containers. Total weight: ${totalWeight.value}oz. Main categories: ${typeBreakdown.value}.`
    }
  ]
}))
</script>

<style>
.gear-section-header {
  @apply text-[10px] font-mono uppercase tracking-[0.05em] text-zinc-500;
}

.gear-container-card {
  @apply flex flex-col py-1 px-1.5 hover:bg-zinc-900/30;
  @apply border-l-2 border-l-zinc-800/50 bg-transparent;
}

.gear-container-count {
  @apply text-[10px] font-mono tabular-nums text-zinc-500;
  @apply group-hover:text-zinc-300;
}

.gear-container-header {
  @apply flex items-baseline justify-between pb-2 mb-3;
  @apply border-b border-zinc-800;
}
</style>
