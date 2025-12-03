<template>
  <main class="px-4 md:px-6 lg:px-8 max-w-full bg-zinc-950 min-h-screen">
    <!-- Error State -->
    <div
      v-if="csvError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <header v-else class="section-spacing-sm">
      <div class="flex-between py-3 section-spacing-sm">
        <div class="flex items-baseline gap-3">
          <h1 class="font-mono text-sm text-zinc-100">GEAR</h1>
          <div class="font-mono text-[10px] text-muted tabular">
            {{ totalItems }} items · {{ displayTotalWeight.value }} ·
            {{ containerCount }} bags
          </div>
          <div class="font-mono text-[10px] text-zinc-500">
            Updated {{ lastUpdated || currentDate }} · source: gear sheet
            exports
          </div>
        </div>
        <div class="flex-gap-3">
          <!-- Weight Unit Selector -->
          <div class="relative">
            <select v-model="weightUnit" class="gear-select">
              <option value="metric">KG/G</option>
              <option value="imperial">LB/OZ</option>
            </select>
            <span class="select-dropdown-arrow">▼</span>
          </div>
          <button
            title="Toggle sort"
            class="gear-btn flex-gap-1"
            @click="toggleSort"
          >
            <span class="text-[8px]">
              {{ sortBy === 'weight' ? '↓' : '↑' }}
            </span>
            {{ sortBy === 'weight' ? 'Weight' : 'Name' }}
          </button>
          <a href="/gear.csv" download class="gear-btn inline-flex-gap-1">
            <span>↓</span>
            CSV
          </a>
        </div>
      </div>

      <div class="mb-3">
        <div class="mb-3">
          <h3 class="gear-section-header mb-2">Type Legend</h3>
          <div class="grid grid-cols-7 gap-2">
            <div v-for="type in typeStats" :key="type.name" class="flex-gap-1">
              <span class="text-xs font-medium text-muted">
                {{ type.symbol }}
              </span>
              <div class="flex-1">
                <div class="font-mono text-[10px] text-zinc-400">
                  {{ type.name }}
                </div>
                <div class="text-[9px] text-muted tabular">
                  {{ type.count }} · {{ type.weight }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="gear-footer-date">
          <span class="uppercase tracking-[0.1em]">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <div class="mb-8">
      <h2 class="gear-section-header mb-4">Containers</h2>
      <div class="grid-gear-responsive">
        <a
          v-for="[container, items] in groupedGear"
          :key="container"
          :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
          class="gear-container-card group"
        >
          <div class="flex items-baseline justify-between">
            <span class="font-mono text-[10px] text-zinc-200">
              {{ container }}
            </span>
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
                class="bg-zinc-700 bg-orange-500"
                :style="{
                  width: `${getWeightPercentage(item, items)}%`,
                  opacity:
                    0.3 + getItemWeightInOunces(item) / getMaxWeight(items),
                }"
                :title="`${item.Name}: ${formatItemWeight(item)}`"
              ></div>
            </div>
            <div class="gear-weight-range">
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
            <span class="text-[8px] text-zinc-600">
              {{ items.length }}×{{ getAvgItemWeight(items) }}
            </span>
            <span class="text-[8px] text-zinc-600">
              {{ getWeightRange(items) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-mono text-zinc-500 tabular-nums">
              {{ formatWeight(items) }}
            </span>
            <!-- Mini histogram -->
            <div class="flex items-end gap-px h-3">
              <div
                v-for="(bucket, i) in getWeightHistogram(items)"
                :key="i"
                class="gear-histogram"
                :style="{ height: `${bucket.height}%` }"
                :title="`${bucket.count} items: ${bucket.range}`"
              ></div>
            </div>
          </div>
        </div>

        <div class="relative overflow-x-auto">
          <table class="w-full text-[9px] font-mono">
            <thead class="sticky top-0 bg-zinc-950 backdrop-blur-sm">
              <tr class="/30">
                <th class="gear-th-left">Item</th>
                <th class="gear-th"></th>
                <th class="gear-th">Type</th>
                <th class="gear-th">Cat</th>
                <th class="gear-th">H₂O</th>
                <th class="gear-th">Pri</th>
                <th class="gear-th">⚡</th>
                <th class="gear-th">Age</th>
                <th class="gear-th-right">g/oz</th>
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
import { csvParse } from 'd3-dsv' // Only used CSV parser (~2KB)

// HTML escaping function for attributes
const _escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(text).replace(/[&<>"']/g, (m) => map[m])
}

const { calculateTotalWeight, calculateAverageWeight, getItemWeightInOunces } =
  useWeightCalculations()
const gearItems = ref([])
const weightUnit = ref('imperial')
const sortBy = ref('weight')

// Initialize weight unit from localStorage on client side only
onMounted(() => {
  if (import.meta.client) {
    weightUnit.value = localStorage.getItem('gear-weight-unit') || 'imperial'
  }
})

// Watch for changes and persist to localStorage
watch(weightUnit, (newValue) => {
  if (import.meta.client) {
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
  Creativity: '✧',
}

const _getTypeSymbol = (type) => typeSymbols[type] || '—'

const _getSortedItemsByType = (items) => {
  const typeOrder = [
    'Tech',
    'Utility',
    'Comfort',
    'Sleep',
    'Bag',
    'Safety',
    'Creativity',
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
  '5.11 Rush 24 Backpack',
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

const _calculateTotalWeightInGrams = (items) =>
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
const { data: csvText, error: csvError } = await useFetch('/api/gear-csv')

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

const totalItems = computed(() => gearItems.value?.length || 0)
const totalWeight = computed(() => {
  const total = calculateTotalWeight(gearItems.value || [])
  const ounces = total.ounces
  return typeof ounces === 'number' && !Number.isNaN(ounces)
    ? ounces.toFixed(1)
    : '0.0'
})
const containerCount = computed(() => groupedGear.value?.size || 0)
const _totalWeightInGrams = computed(() => {
  const total = calculateTotalWeight(gearItems.value || [])
  return total.grams || 0
})
const _avgWeightInGrams = computed(() => {
  const avg = calculateAverageWeight(gearItems.value || [])
  return avg.grams || 0
})

// Weight display computeds based on selected unit
const displayTotalWeight = computed(() => {
  const totalWeightData = calculateTotalWeight(gearItems.value || [])
  if (weightUnit.value === 'imperial') {
    const totalOz = totalWeightData.ounces
    if (typeof totalOz !== 'number' || Number.isNaN(totalOz)) {
      return { value: '0oz', unit: '' }
    }
    const pounds = Math.floor(totalOz / 16)
    const ounces = totalOz % 16
    const ouncesStr =
      typeof ounces === 'number' && !Number.isNaN(ounces)
        ? ounces.toFixed(1)
        : '0.0'
    return {
      value: pounds > 0 ? `${pounds}lb ${ouncesStr}oz` : `${ouncesStr}oz`,
      unit: pounds > 0 ? '' : '',
    }
  } else {
    const totalG = totalWeightData.grams
    if (typeof totalG !== 'number' || Number.isNaN(totalG)) {
      return { value: '0g', unit: '' }
    }
    const kg = Math.floor(totalG / 1000)
    const grams = Math.round(totalG % 1000)
    return {
      value: kg > 0 ? `${kg}kg ${grams}g` : `${grams}g`,
      unit: '',
    }
  }
})

const _displayAvgWeight = computed(() => {
  const avgWeightData = calculateAverageWeight(gearItems.value || [])
  if (weightUnit.value === 'imperial') {
    const oz = avgWeightData.ounces
    const value =
      typeof oz === 'number' && !Number.isNaN(oz) ? oz.toFixed(1) : '0.0'
    return {
      value,
      unit: 'oz',
    }
  } else {
    const g = avgWeightData.grams
    return {
      value: typeof g === 'number' && !Number.isNaN(g) ? g : 0,
      unit: 'g',
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
        weight: formatWeight(items),
      }
    })
    .filter((stat) => stat.count > 0)
  return stats.sort((a, b) => b.count - a.count)
})

const gearDescription = computed(() => {
  try {
    const items = totalItems.value || 0
    const weight = displayTotalWeight.value?.value || '0'
    const containers = containerCount.value || 0

    if (items === 0 || !weight || weight === '0') {
      return 'Gear inventory with weights and specs'
    }

    const setup = 'ultralight backpacking'
    const itemsText = `${items} items • ${weight} total`
    return `${itemsText} • ${containers} bags • ${setup}`
  } catch {
    return 'Gear inventory with weights and specs'
  }
})

usePageSeo({
  title: 'Gear - EJ Fox',
  description: computed(() => gearDescription.value),
  type: 'article',
  section: 'Gear',
  tags: [
    'Gear list',
    'Backpacking',
    'Camera kit',
    'Everyday carry',
    'Motorcycle',
  ],
  label1: 'Inventory',
  data1: computed(
    () => `${totalItems.value} items • ${containerCount.value} containers`
  ),
  label2: 'Weight',
  data2: computed(() => `${totalWeightOunces.value} oz (${totalWeight.value})`),
})

const sortItemsByName = (items) => {
  return [...items].sort((a, b) => a.Name.localeCompare(b.Name))
}

const sortItemsByWeight = (items) => {
  return [...items].sort((a, b) => {
    const aWeight = Number.parseFloat(a.Weight_oz) || 0
    const bWeight = Number.parseFloat(b.Weight_oz) || 0
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
    const oz = avgWeight.ounces
    if (typeof oz !== 'number' || Number.isNaN(oz)) return '0oz'
    return oz > 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(0)}oz`
  }
  const g = avgWeight.grams
  if (typeof g !== 'number' || Number.isNaN(g)) return '0g'
  return g > 1000 ? `${(g / 1000).toFixed(1)}kg` : `${Math.round(g)}g`
}

const getWeightPercentage = (item, allItems) => {
  const itemWeight = getItemWeightInOunces(item)
  const totalWeight = calculateTotalWeight(allItems).ounces
  if (!totalWeight || totalWeight === 0) return '0.0'
  const percentage = (itemWeight / totalWeight) * 100
  return typeof percentage === 'number' && !Number.isNaN(percentage)
    ? percentage.toFixed(1)
    : '0.0'
}

const getMaxWeight = (items) => {
  return Math.max(...items.map((item) => getItemWeightInOunces(item)))
}

const formatItemWeight = (item) => {
  const oz = getItemWeightInOunces(item)
  if (typeof oz !== 'number' || Number.isNaN(oz)) {
    return weightUnit.value === 'imperial' ? '0oz' : '0g'
  }
  if (weightUnit.value === 'imperial') {
    return oz > 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(1)}oz`
  }
  const grams = Math.round(oz * 28.3495)
  return grams > 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams}g`
}

const getWeightRange = (items) => {
  const weights = items
    .map((item) => getItemWeightInOunces(item))
    .filter((w) => typeof w === 'number' && !Number.isNaN(w) && w > 0)
  if (weights.length === 0) return '—'
  const min = Math.min(...weights)
  const max = Math.max(...weights)

  if (
    typeof min !== 'number' ||
    Number.isNaN(min) ||
    typeof max !== 'number' ||
    Number.isNaN(max)
  ) {
    return '—'
  }

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
    .filter((w) => typeof w === 'number' && !Number.isNaN(w) && w > 0)
  if (weights.length === 0) return []

  const min = Math.min(...weights)
  const max = Math.max(...weights)

  if (
    typeof min !== 'number' ||
    Number.isNaN(min) ||
    typeof max !== 'number' ||
    Number.isNaN(max)
  ) {
    return []
  }

  const bucketCount = Math.min(10, weights.length)
  const bucketSize = (max - min) / bucketCount || 1

  const buckets = Array(bucketCount).fill(0)
  weights.forEach((w) => {
    const bucketIndex = Math.min(
      Math.floor((w - min) / bucketSize),
      bucketCount - 1
    )
    buckets[bucketIndex]++
  })

  const maxCount = Math.max(...buckets)
  return buckets.map((count, i) => {
    const rangeStart = min + i * bucketSize
    const rangeEnd = min + (i + 1) * bucketSize
    return {
      count,
      height: (count / maxCount) * 100,
      range: `${rangeStart.toFixed(0)}-${rangeEnd.toFixed(0)}oz`,
    }
  })
}

const currentDate = new Date().toISOString().split('T')[0]

const gearSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Gear Inventory',
  numberOfItems: totalItems.value,
  itemListElement: gearItems.value.slice(0, 30).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `https://ejfox.com/gear/${item.Slug || index}`,
    name: item.Name,
  })),
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(gearSchema.value),
    },
  ],
}))
</script>

<style>
.gear-th {
  @apply text-center px-1 py-1 font-normal text-zinc-500 text-[8px];
}

.gear-th-left {
  @apply text-left px-1 py-1 font-normal text-zinc-500 text-[8px] uppercase;
}

.gear-th-right {
  @apply text-right px-1 py-1 font-normal text-zinc-500 text-[8px] pr-2;
}

.gear-weight-range {
  @apply flex justify-between mt-1 text-[7px] text-zinc-600 font-mono;
}

.gear-histogram {
  @apply w-1 bg-zinc-700/50 bg-orange-500/50;
}

.gear-section-header {
  @apply text-[10px] font-mono uppercase tracking-[0.05em] text-zinc-500;
}

.gear-container-card {
  @apply flex flex-col py-1 px-1.5;
}

.gear-container-count {
  @apply text-[10px] font-mono tabular-nums text-zinc-500;
}

.gear-container-header {
  @apply flex items-baseline justify-between pb-2 mb-3;
}
</style>
