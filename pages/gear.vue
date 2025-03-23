<template>
  <main class="p-4 md:p-8 max-w-6xl mx-auto">
    <!-- Header - Minimalist with key stats inline -->
    <header class="mb-8">
      <div class="flex items-baseline justify-between border-b border-zinc-800 pb-4 mb-6">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight">Gear Inventory</h1>
        <div class="text-sm text-zinc-500">
          <a href="/gear.csv" download class="inline-flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            Download CSV
          </a>
        </div>
      </div>
      
      <!-- Key metrics bar - minimal design -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-6 text-sm">
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-mono tabular-nums font-bold">{{ totalItems }}</span>
            <span class="text-zinc-500">items</span>
          </div>
          <div class="text-xs text-zinc-500 mt-1">across {{ containerCount }} containers</div>
        </div>
        
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-mono tabular-nums font-bold">{{ totalWeight }}</span>
            <span class="text-zinc-500">oz</span>
          </div>
          <div class="text-xs text-zinc-500 mt-1">{{ ouncesToPounds }}lb / {{ ouncesToKilos }}kg</div>
        </div>
        
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-mono tabular-nums font-bold">{{ avgTCWMScore }}</span>
            <span class="text-zinc-500">avg TCWM</span>
          </div>
          <div class="text-xs text-zinc-500 mt-1">
            <span class="text-blue-400">T</span>{{ avgScores.T.toFixed(1) }}
            <span class="text-purple-400 ml-1">C</span>{{ avgScores.C.toFixed(1) }}
            <span class="text-green-400 ml-1">W</span>{{ avgScores.W.toFixed(1) }}
            <span class="text-amber-400 ml-1">M</span>{{ avgScores.M.toFixed(1) }}
          </div>
        </div>
        
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-mono tabular-nums font-bold">{{ avgWeight }}</span>
            <span class="text-zinc-500">oz/item</span>
          </div>
          <div class="text-xs text-zinc-500 mt-1">updated {{ currentDate }}</div>
        </div>
      </div>
      
      <!-- Container distribution - minimal bar graph -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-x-8 gap-y-2">
          <div v-for="[container, items] in Array.from(groupedGear).slice(0, 6)" :key="container" 
               class="flex items-center gap-2 min-w-[200px]">
            <div class="w-20 text-right truncate text-xs text-zinc-400">{{ container }}</div>
            <div class="h-2 bg-blue-600/30 dark:bg-blue-600/40 rounded-full"
              :style="{ width: `${(items.length / Math.max(...Array.from(groupedGear).map(g => g[1].length))) * 150}px` }">
            </div>
            <span class="text-xs text-zinc-500">{{ items.length }}</span>
          </div>
        </div>
      </div>
      
      <!-- TCWM legend - compact horizontal format -->
      <div class="flex items-center gap-2 text-xs py-2 border-t border-zinc-800">
        <div class="flex items-center gap-1 mr-3 text-zinc-400">TCWM:</div>
        <div class="flex items-center gap-1 mr-3"><span class="text-blue-400 font-medium">T</span>ime Criticality</div>
        <div class="flex items-center gap-1 mr-3"><span class="text-purple-400 font-medium">C</span>onsequence</div>
        <div class="flex items-center gap-1 mr-3"><span class="text-green-400 font-medium">W</span>eight/Space</div>
        <div class="flex items-center gap-1"><span class="text-amber-400 font-medium">M</span>ulti-Use</div>
      </div>
    </header>

    <!-- Container Quick Jump -->
    <div class="mb-8">
      <div class="flex flex-wrap gap-2">
        <a v-for="[container, items] in groupedGear" :key="container"
           :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
           class="px-3 py-1.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          <div class="flex items-center gap-1.5">
            <UIcon :name="containerIcons[container] || typeIcons[getContainerType(items)]" class="w-3 h-3" />
            <span>{{ container }}</span>
            <span class="text-zinc-500">{{ items.length }}</span>
          </div>
        </a>
      </div>
    </div>

    <!-- Gear list by container - minimal design -->
    <div class="space-y-10">
      <section v-for="[container, items] in groupedGear" :key="container"
              :id="container.toLowerCase().replace(/\s+/g, '-')"
              class="scroll-mt-4">
        <!-- Container header -->
        <div class="flex items-baseline justify-between border-b border-zinc-800/50 pb-2 mb-4">
          <h2 class="text-xl font-bold">{{ container }}</h2>
          <div class="text-sm text-zinc-500">
            <span class="font-mono">{{ calculateTotalWeight(items) }}oz</span>
            <span class="opacity-70 ml-1">({{ items.length }} items)</span>
          </div>
        </div>

        <!-- Container items in grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <GearItem v-for="item in sortItemsByScore(items)" :key="item.Name" :item="item" :create-viz="createViz"
            class="bg-zinc-50/30 dark:bg-zinc-900/30 rounded p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
            <template #viz="{ svgRef }">
              <div class="relative w-full aspect-square">
                <svg ref="svgRef" class="w-full h-full absolute inset-0"></svg>
              </div>
            </template>
          </GearItem>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as d3 from 'd3'

const gearItems = ref([])
const svgRefs = new Map()

// Add color scale for types
const typeColors = {
  'Tech': '#71717a',      // zinc-500
  'Utility': '#71717a',   // zinc-500
  'Comfort': '#71717a',   // zinc-500
  'Sleep': '#71717a',     // zinc-500
  'Bag': '#71717a',       // zinc-500
  'Safety': '#dc2626',    // red-600 for better visibility
  'Creativity': '#71717a' // zinc-500
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
  const mainGroup = svg.append('g')
    .attr('transform', `translate(${centerX},${centerY})`)

  // Draw simple weight circle
  const weight = parseFloat(item['Base Weight ()']) || 0
  const maxWeight = d3.max(gearItems.value, d => parseFloat(d['Base Weight ()']) || 0)
  const radius = (weight / maxWeight) * (size * 0.35)

  mainGroup.append('circle')
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', itemColor)
    .attr('stroke-width', 1.5)
    .attr('class', 'opacity-30 dark:opacity-40')

  // Add weight text in center
  mainGroup.append('text')
    .attr('class', 'font-mono text-[10px] fill-current opacity-60')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text(`${weight}oz`)

  // Add TCWM score text below
  const score = calculateTCWMScore(item)
  mainGroup.append('text')
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
  const containers = new Set(gearItems.value.map(item => item['Parent Container']))
  containers.forEach(container => groups.set(container || 'Unassigned', []))

  // Then group items
  gearItems.value.forEach(item => {
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

// Calculate total weight for a container
const calculateTotalWeight = (items) => {
  if (!items?.length) return '0.0'
  return items
    .reduce((sum, item) => sum + (parseFloat(item['Base Weight ()']) || 0), 0)
    .toFixed(1)
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
    gearItems.value.forEach(item => {
      const svgEl = svgRefs.get(item.Name)
      if (svgEl) createViz(item, svgEl)
    })
  } catch (error) {
    console.error('Error loading gear data:', error)
  }
})

// Update resize handler
const debouncedResize = useDebounceFn(() => {
  gearItems.value.forEach(item => {
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
  const types = items.map(item => item.Type).filter(Boolean)
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
  'Tech': 'i-material-symbols-light-earbuds-battery',
  'Utility': 'i-heroicons-wrench',
  'Comfort': 'i-heroicons-heart',
  'Sleep': 'i-heroicons-moon',
  'Bag': 'i-material-symbols-light-backpack-outline',
  'Safety': 'i-heroicons-shield-check',
  'Creativity': 'i-heroicons-sparkles'
}

// Add typeClasses for styling
const typeClasses = {
  'Tech': 'text-zinc-600 dark:text-zinc-400',
  'Utility': 'text-zinc-600 dark:text-zinc-400',
  'Comfort': 'text-zinc-600 dark:text-zinc-400',
  'Sleep': 'text-zinc-600 dark:text-zinc-400',
  'Bag': 'text-zinc-600 dark:text-zinc-400',
  'Safety': 'text-red-600 dark:text-red-400',  // Keep red for safety
  'Creativity': 'text-zinc-600 dark:text-zinc-400'
}

// Container-specific icons take precedence over type icons
const containerIcons = {
  'Motorcycle': 'i-fa6-solid-motorcycle',
  'WLF Enduro Backpack': 'i-material-symbols-light-backpack-rounded',
  '5.11 Rush 24 Backpack': 'i-material-symbols-light-backpack-rounded'
}

// Computed properties
const totalItems = computed(() => gearItems.value.length)
const totalWeight = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  return gearItems.value
    .reduce((sum, item) => sum + (parseFloat(item['Base Weight ()']) || 0), 0)
    .toFixed(1)
})

const containerCount = computed(() => groupedGear.value?.size || 0)

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

const avgWeight = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  const weights = gearItems.value.map(item => parseFloat(item['Base Weight ()']) || 0)
  return (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
})

// Helper function for TCWM calculation
const calculateTCWMScore = (item) => {
  const T = Number(item['Time Criticality (T)']) || 0
  const C = Number(item['Consequence Severity (C)']) || 0
  const W = Number(item['Weight/Space Penalty (W)']) || 0
  const M = Number(item['Multi-Use Factor (M)']) || 0
  return (2 * T) + (2 * C) + (1.5 * W) + M
}

const avgTCWMScore = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  const scores = gearItems.value.map(item => calculateTCWMScore(item))
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

// Average TCWM component scores
const avgScores = computed(() => {
  if (!gearItems.value?.length) return { T: 0, C: 0, W: 0, M: 0 }

  const scores = {
    T: d3.mean(gearItems.value, d => Number(d['Time Criticality (T)']) || 0),
    C: d3.mean(gearItems.value, d => Number(d['Consequence Severity (C)']) || 0),
    W: d3.mean(gearItems.value, d => Number(d['Weight/Space Penalty (W)']) || 0),
    M: d3.mean(gearItems.value, d => Number(d['Multi-Use Factor (M)']) || 0)
  }

  // Ensure all values are numbers
  Object.keys(scores).forEach(key => {
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
  return [...items].sort((a, b) => calculateTCWMScore(b) - calculateTCWMScore(a))
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