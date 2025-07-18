<template>
  <main
    class="sans-serif max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
  >
    <!-- Header - Swiss minimalist -->
    <header class="mb-12 lg:mb-16">
      <div
        class="flex items-baseline justify-between pb-6 mb-8 border-b border-zinc-300 dark:border-zinc-700"
      >
        <h1
          class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Gear Inventory
        </h1>
        <div
          class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
        >
          <a
            href="/gear.csv"
            download
            class="inline-flex items-center gap-1.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <Icon name="i-heroicons-arrow-down-tray" class="w-3 h-3" />
            CSV
          </a>
        </div>
      </div>

      <!-- Summary statistics - minimal data presentation -->
      <div class="mb-8 lg:mb-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mb-6">
          <div class="space-y-1">
            <div
              class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
            >
              Total
            </div>
            <div
              class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
            >
              {{ totalItems }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              items
            </div>
          </div>
          <div class="space-y-1">
            <div
              class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
            >
              Weight
            </div>
            <div
              class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
            >
              {{ totalWeightInGrams }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              grams
            </div>
          </div>
          <div class="space-y-1">
            <div
              class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
            >
              Avg Wt
            </div>
            <div
              class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
            >
              {{ avgWeightInGrams }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              grams
            </div>
          </div>
          <div class="space-y-1">
            <div
              class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
            >
              Containers
            </div>
            <div
              class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
            >
              {{ containerCount }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              total
            </div>
          </div>
        </div>

        <!-- Type legend -->
        <div class="mb-6">
          <h3 class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-3">
            Type Legend
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div
              v-for="type in typeStats" :key="type.name" 
              class="flex items-center gap-2 text-xs"
            >
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">{{ type.symbol }}</span>
              <div class="flex-1">
                <div class="font-medium text-zinc-700 dark:text-zinc-300">
                  {{ type.name }}
                </div>
                <div class="text-[10px] text-zinc-500 dark:text-zinc-500 tabular-nums">
                  {{ type.count }} items · {{ type.weight }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Minimal metadata -->
        <div
          class="flex justify-end text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50"
        >
          <span class="uppercase tracking-[0.1em]">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <!-- Container navigation - minimal list -->
    <div class="mb-16">
      <h2
        class="text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-6"
      >
        Containers
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <a
          v-for="[container, items] in groupedGear"
          :key="container"
          :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
          class="group flex flex-col py-3 px-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{{
              container
            }}</span>
            <span
              class="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
            >{{ items.length }}</span>
          </div>
          <div class="flex flex-wrap gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              v-for="item in getSortedItemsByType(items)" :key="item.Name" 
              :title="`${item.Type}: ${item.Name}`"
              class="cursor-help"
            >
              {{ getTypeSymbol(item.Type) }}
            </span>
          </div>
        </a>
      </div>
    </div>

    <!-- Gear inventory by container -->
    <div class="space-y-16">
      <section
        v-for="[container, items] in groupedGear"
        :id="container.toLowerCase().replace(/\s+/g, '-')"
        :key="container"
        class="scroll-mt-4"
      >
        <!-- Container header -->
        <div
          class="flex items-baseline justify-between pb-4 mb-8 border-b border-zinc-300 dark:border-zinc-700"
        >
          <h2
            class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight"
          >
            {{ container }}
          </h2>
          <div
            class="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-x-4"
          >
            <span class="tabular-nums">{{ calculateTotalWeightInGrams(items) }}</span>
            <span class="uppercase tracking-[0.1em]">{{ items.length }} items</span>
          </div>
        </div>

        <!-- Container items - inventory table format -->
        <div class="relative">
          <!-- Table header -->
          <div
            class="grid grid-cols-12 gap-3 py-3 px-2 text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/50 dark:border-zinc-700/50 mb-4"
          >
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

          <!-- Items -->
          <div class="divide-y divide-zinc-800/10">
            <GearItem
              v-for="item in sortItemsByScore(items)"
              :key="item.Name"
              :item="item"
            />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as d3 from 'd3'

const { calculateTotalWeight, calculateAverageWeight, getWeightCategories, formatWeight: _formatWeight } = useWeightCalculations()

const gearItems = ref([])
const svgRefs = new Map()

// Type symbols mapping (same as in GearItem)
const typeSymbols = {
  'Tech': '▲',
  'Utility': '⬟', 
  'Comfort': '○',
  'Sleep': '☽',
  'Bag': '▣',
  'Safety': '◆',
  'Creativity': '✧'
}

// Get unicode symbol for item type
const getTypeSymbol = (type) => {
  return typeSymbols[type] || '—'
}

// Sort items by type for consistent symbol ordering
const getSortedItemsByType = (items) => {
  const typeOrder = ['Tech', 'Utility', 'Comfort', 'Sleep', 'Bag', 'Safety', 'Creativity']
  
  return [...items].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.Type)
    const bIndex = typeOrder.indexOf(b.Type)
    
    // If type not found, put at end
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })
}

// Add color scale for types
const typeColors = {
  Tech: '#71717a', // zinc-500
  Utility: '#71717a', // zinc-500
  Comfort: '#71717a', // zinc-500
  Sleep: '#71717a', // zinc-500
  Bag: '#71717a', // zinc-500
  Safety: '#dc2626', // red-600 for better visibility
  Creativity: '#71717a' // zinc-500
}

// Helper function to get color with fallback
const getTypeColor = (type) => {
  return typeColors[type] || '#94a3b8' // default to slate if type not found
}

// Helper to set SVG refs
const setSvgRef = (el, name) => {
  if (el) svgRefs.set(name, el)
}

// Updated visualization function
const createViz = (item, svgEl) => {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  // Get the actual dimensions from the SVG element
  const bbox = svgEl.getBoundingClientRect()
  const width = bbox.width
  const height = bbox.height
  const size = Math.min(width, height)
  const centerX = width / 2
  const centerY = height / 2

  // Get color based on type
  const itemColor = getTypeColor(item.Type)

  // Create a group for centering
  const mainGroup = svg
    .append('g')
    .attr('transform', `translate(${centerX},${centerY})`)

  // Draw simple weight circle
  const weight = parseFloat(item['Base Weight ()']) || 0
  const maxWeight = d3.max(
    gearItems.value,
    (d) => parseFloat(d['Base Weight ()']) || 0
  )
  const radius = (weight / maxWeight) * (size * 0.35)

  mainGroup
    .append('circle')
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', itemColor)
    .attr('stroke-width', 1.5)
    .attr('class', 'opacity-30 dark:opacity-40')

  // Add weight text in center
  mainGroup
    .append('text')
    .attr('class', 'font-mono text-[10px] fill-current opacity-60')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text(`${weight}oz`)

  // Add TCWM score text below
  const score = calculateTCWMScore(item)
  mainGroup
    .append('text')
    .attr('class', 'font-mono text-[9px] fill-current opacity-40')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('y', radius + 12)
    .text(`TCWM: ${score.toFixed(1)}`)
}

// Group items by container
const groupedGear = computed(() => {
  const groups = new Map()

  // First, collect all unique containers
  const containers = new Set(
    gearItems.value.map((item) => item['Parent Container'])
  )
  containers.forEach((container) => groups.set(container || 'Unassigned', []))

  // Then group items
  gearItems.value.forEach((item) => {
    const container = item['Parent Container'] || 'Unassigned'
    groups.get(container).push(item)
  })

  // Sort containers to ensure Body and important containers come first
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

// Calculate total weight for a container - show in grams or lbs
const calculateTotalWeightInGrams = (items) => {
  return calculateTotalWeight(items).formatted
}

// Add affiliate URL handling
const addAffiliateCode = (url) => {
  if (!url || !url.includes('amazon.com')) return url
  const amazonUrl = new URL(url)
  amazonUrl.searchParams.set('tag', 'ejfox0c-20')
  return amazonUrl.toString()
}

// Update the GearItem component to use the affiliate URL
const processGearItem = (item) => {
  if (item.amazon) {
    item.amazon = addAffiliateCode(item.amazon)
  }
  return item
}

// Update the onMounted hook to process Amazon links
onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText).map(processGearItem)

    await nextTick()
    gearItems.value.forEach((item) => {
      const svgEl = svgRefs.get(item.Name)
      if (svgEl) createViz(item, svgEl)
    })
  } catch (error) {
    console.error('Error loading gear data:', error)
  }
})

// Update resize handler
const debouncedResize = useDebounceFn(() => {
  gearItems.value.forEach((item) => {
    const svgEl = svgRefs.get(item.Name)
    if (svgEl) createViz(item, svgEl)
  })
}, 250)

onMounted(() => {
  window.addEventListener('resize', debouncedResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
})

// Helper function to determine container type
function getContainerType(items) {
  // Return the most common type in the container
  const types = items.map((item) => item.Type).filter(Boolean)
  if (!types.length) return null

  return Object.entries(
    types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])[0][0]
}

// Update typeIcons to match GearItem.vue
const typeIcons = {
  Tech: 'i-material-symbols-light-earbuds-battery',
  Utility: 'i-heroicons-wrench',
  Comfort: 'i-heroicons-heart',
  Sleep: 'i-heroicons-moon',
  Bag: 'i-material-symbols-light-backpack-outline',
  Safety: 'i-heroicons-shield-check',
  Creativity: 'i-heroicons-sparkles'
}

// Add typeClasses for styling
const typeClasses = {
  Tech: 'text-zinc-600 dark:text-zinc-400',
  Utility: 'text-zinc-600 dark:text-zinc-400',
  Comfort: 'text-zinc-600 dark:text-zinc-400',
  Sleep: 'text-zinc-600 dark:text-zinc-400',
  Bag: 'text-zinc-600 dark:text-zinc-400',
  Safety: 'text-red-600 dark:text-red-400', // Keep red for safety
  Creativity: 'text-zinc-600 dark:text-zinc-400'
}

// Container-specific icons take precedence over type icons
const containerIcons = {
  Motorcycle: 'i-fa6-solid-motorcycle',
  'WLF Enduro Backpack': 'i-material-symbols-light-backpack-rounded',
  '5.11 Rush 24 Backpack': 'i-material-symbols-light-backpack-rounded'
}

// Computed properties
const totalItems = computed(() => gearItems.value.length)
const totalWeight = computed(() => calculateTotalWeight(gearItems.value).ounces.toFixed(1))
const containerCount = computed(() => groupedGear.value?.size || 0)

// Type statistics for legend
const typeStats = computed(() => {
  const stats = Object.keys(typeSymbols).map(typeName => {
    const items = gearItems.value.filter(item => item.Type === typeName)
    const totalWeightData = calculateTotalWeight(items)
    
    return {
      name: typeName,
      symbol: typeSymbols[typeName],
      count: items.length,
      weight: totalWeightData.formatted,
      items: items
    }
  }).filter(stat => stat.count > 0) // Only show types that have items
  
  // Sort by count descending
  return stats.sort((a, b) => b.count - a.count)
})

const typeBreakdown = computed(() => {
  const types = gearItems.value.reduce((acc, item) => {
    if (item.Type) {
      acc[item.Type] = (acc[item.Type] || 0) + 1
    }
    return acc
  }, {})
  return Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ')
})

// SEO metadata
useHead(() => ({
  title: 'Adventure Gear Inventory',
  meta: [
    {
      name: 'description',
      content: `Comprehensive gear inventory tracking ${totalItems.value} items across ${containerCount.value} containers. Total weight: ${totalWeight.value}oz. Main categories: ${typeBreakdown.value}.`
    }
  ]
}))

const avgWeight = computed(() => calculateAverageWeight(gearItems.value).ounces.toFixed(1))

// Total weight in grams
const totalWeightInGrams = computed(() => calculateTotalWeight(gearItems.value).grams)

// Average weight in grams
const avgWeightInGrams = computed(() => calculateAverageWeight(gearItems.value).grams)

// Helper function for TCWM calculation
const calculateTCWMScore = (item) => {
  const T = Number(item['Time Criticality (T)']) || 0
  const C = Number(item['Consequence Severity (C)']) || 0
  const W = Number(item['Weight/Space Penalty (W)']) || 0
  const M = Number(item['Multi-Use Factor (M)']) || 0
  return 2 * T + 2 * C + 1.5 * W + M
}

const avgTCWMScore = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  const scores = gearItems.value.map((item) => calculateTCWMScore(item))
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

// Average TCWM component scores
const avgScores = computed(() => {
  if (!gearItems.value?.length) return { T: 0, C: 0, W: 0, M: 0 }

  const scores = {
    T: d3.mean(gearItems.value, (d) => Number(d['Time Criticality (T)']) || 0),
    C: d3.mean(
      gearItems.value,
      (d) => Number(d['Consequence Severity (C)']) || 0
    ),
    W: d3.mean(
      gearItems.value,
      (d) => Number(d['Weight/Space Penalty (W)']) || 0
    ),
    M: d3.mean(gearItems.value, (d) => Number(d['Multi-Use Factor (M)']) || 0)
  }

  // Ensure all values are numbers
  Object.keys(scores).forEach((key) => {
    scores[key] = Number(scores[key]) || 0
  })

  return scores
})

// Weight conversion helpers
const ouncesToPounds = computed(() => {
  const pounds = Number(totalWeight.value) / 16
  return pounds.toFixed(1)
})

const ouncesToKilos = computed(() => {
  const kilos = Number(totalWeight.value) * 0.0283495
  return kilos.toFixed(1)
})

// Sort items by TCWM score
const sortItemsByScore = (items) => {
  return [...items].sort(
    (a, b) => calculateTCWMScore(b) - calculateTCWMScore(a)
  )
}

// Priority containers for sorting
const PRIORITY_CONTAINERS = [
  'Body',
  'Motorcycle',
  'WLF Enduro Backpack',
  '5.11 Rush 24 Backpack'
]

// Get current date for last updated
const currentDate = new Date().toISOString().split('T')[0]

// Weight distribution computed properties
const weightCategories = computed(() => getWeightCategories(gearItems.value))
const lightweightCount = computed(() => weightCategories.value.lightweight)
const mediumweightCount = computed(() => weightCategories.value.mediumweight)
const heavyweightCount = computed(() => weightCategories.value.heavyweight)
</script>

<style>
/* Custom scrollbar styling */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.thin-scrollbar::-webkit-scrollbar {
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dark .thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
