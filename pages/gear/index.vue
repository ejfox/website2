<!--
  @file gear/index.vue
  @description /gear: the whole gear inventory, grouped by bag ("Parent
    Container"), with per-container weight sparklines/histograms and one dense
    table per container. Data: raw CSV from /api/gear-csv (data/gear.csv),
    parsed client+server with d3-dsv. Prerendered in prod (PRERENDERED_ROUTES
    in nuxt.config.ts), so a CSV edit needs a deploy to show.
  Gotchas: Column names are the CSV header verbatim: Name, Weight_oz,
    Parent Container, Type, Scan_3D_URL… Weight math lives in utils/weight.ts
    (weightCalculations); rows render in components/gear/GearItem.vue.
-->
<script setup>
// ── Setup ───────────────────────────────────────────────────
import { csvParse } from 'd3-dsv' // Only used CSV parser (~2KB)

const { tocTarget } = useTOC()
const { revealContainer: gearReveal } = useScrollReveal({
  selector: 'tbody tr',
  staggerDelay: 10,
  translateY: 3,
  duration: 120,
})

const scrollToContainer = (container) => {
  const id = container.toLowerCase().replace(/\s+/g, '-')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const { calculateTotalWeight, calculateAverageWeight, getItemWeightInOunces } =
  weightCalculations()
const gearItems = ref([])
const weightUnit = ref('imperial')
const sortBy = ref('weight')

// Initialize weight unit from localStorage on client side only
// Read in onMounted (not setup) so SSR and first client render agree on
// 'imperial'; a metric reader sees the units flip after hydration.
onMounted(() => {
  if (import.meta.client) {
    weightUnit.value = localStorage.getItem('gear-weight-unit') || 'imperial'
  }
})

watch(weightUnit, (newValue) => {
  if (import.meta.client) {
    localStorage.setItem('gear-weight-unit', newValue)
  }
})

// ── Grouping ────────────────────────────────────────────────
// Keys must match the CSV `Type` values exactly; a type missing here is
// left out of the legend (typeStats only iterates these keys).
const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Food: '⬢',
  Creativity: '✧',
}

// Containers listed first, in this order; the rest follow A→Z. Matched
// exactly against `Parent Container`, so a renamed bag silently drops to
// the alphabetical tail.
const PRIORITY_CONTAINERS = [
  'Body',
  'Motorcycle',
  'WLF Enduro Pack Vest',
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

// ── Weight formatting ───────────────────────────────────────
// Compound units ("2lb 3oz", "1kg 40g"), not decimals: 16 oz per lb.
const formatWeight = (items) => {
  const weightData = calculateTotalWeight(items)
  if (weightUnit.value === 'imperial') {
    const totalOz = Math.round(weightData.ounces)
    const pounds = Math.floor(totalOz / 16)
    const ounces = totalOz % 16
    return pounds > 0 ? `${pounds}lb ${ounces}oz` : `${ounces}oz`
  } else {
    const kg = Math.floor(weightData.grams / 1000)
    const grams = Math.round(weightData.grams % 1000)
    return kg > 0 ? `${kg}kg ${grams}g` : `${grams}g`
  }
}

const containerComparison = computed(() => {
  if (!groupedGear.value.size) return []
  const data = Array.from(groupedGear.value.entries()).map(([name, items]) => {
    const totalOz = calculateTotalWeight(items).ounces || 0
    return {
      name,
      short: name.split(' ')[0].slice(0, 6),
      items: items.length,
      weight: formatWeight(items),
      totalOz,
    }
  })
  // Floor of 1 avoids divide-by-zero when every container weighs 0.
  const maxOz = Math.max(...data.map((d) => d.totalOz), 1)
  return data.map((d) => ({
    ...d,
    heightPct: Math.round((d.totalOz / maxOz) * 100),
  }))
})

// ── Data loading ────────────────────────────────────────────
// The Amazon affiliate tag is added per row (Amazon_URL) in
// components/gear/GearItem.vue.
const { data: csvText, error: csvError } = await useFetch('/api/gear-csv')

watchEffect(() => {
  if (csvText.value) {
    try {
      gearItems.value = csvParse(csvText.value).filter((item) => {
        // Filter out empty rows and comment lines
        return (
          item.Name && item.Name.trim() !== '' && !item.Name.startsWith('#')
        )
      })
    } catch (error) {
      console.error('Error parsing gear data:', error)
    }
  }
})

// ── Summary stats ───────────────────────────────────────────
const scannedItems = computed(() =>
  gearItems.value.filter((item) => item.Scan_3D_URL?.trim())
)

const totalItems = computed(() => gearItems.value?.length || 0)
const totalWeight = computed(() => {
  const total = calculateTotalWeight(gearItems.value || [])
  const ounces = total.ounces
  return typeof ounces === 'number' && !Number.isNaN(ounces)
    ? ounces.toFixed(1)
    : '0.0'
})
const containerCount = computed(
  () =>
    new Set(
      (gearItems.value || [])
        .map((item) => item['Parent Container'])
        .filter((c) => c && c.trim() !== '')
    ).size
)

const displayTotalWeight = computed(() => {
  const totalWeightData = calculateTotalWeight(gearItems.value || [])
  if (weightUnit.value === 'imperial') {
    const totalOz = totalWeightData.ounces
    if (typeof totalOz !== 'number' || Number.isNaN(totalOz)) {
      return { value: '0oz', unit: '' }
    }
    // Round to tenths BEFORE splitting into lb/oz, or float noise can show
    // "15.99oz" instead of rolling over to the next pound.
    const tenthsOz = Math.round(totalOz * 10) / 10
    const pounds = Math.floor(tenthsOz / 16)
    const ounces = tenthsOz - pounds * 16
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

// ── SEO ─────────────────────────────────────────────────────
usePageSeo({
  // This page renders its own JSON-LD below; don't add a second one.
  schema: false,
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
  data2: computed(() => `${totalWeight.value} oz`),
})

// ── Sorting ─────────────────────────────────────────────────
// Copies before sorting: items are the arrays inside groupedGear, and an
// in-place sort would mutate the computed's cached state.
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

// ── Per-container stats ─────────────────────────────────────
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
  if (!items?.length) return 1
  const max = Math.max(...items.map((item) => getItemWeightInOunces(item)))
  return max > 0 ? max : 1
}

const formatItemWeight = (item) => {
  const oz = getItemWeightInOunces(item)
  if (typeof oz !== 'number' || Number.isNaN(oz)) {
    return weightUnit.value === 'imperial' ? '0oz' : '0g'
  }
  if (weightUnit.value === 'imperial') {
    return oz > 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(1)}oz`
  }
  // 28.3495 g per oz, same constant as utils/weight.ts
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

  // Up to 10 equal-width bins over [min, max]. `|| 1` covers min === max
  // (all items the same weight), which would otherwise divide by zero.
  // Bin labels are always oz, even in metric mode.
  const bucketCount = Math.min(10, weights.length)
  const bucketSize = (max - min) / bucketCount || 1

  const buckets = Array(bucketCount).fill(0)
  weights.forEach((w) => {
    // Clamp: w === max lands at index bucketCount, one past the last bin.
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

// ── JSON-LD ─────────────────────────────────────────────────
// Prerendered, so the HTML's "Updated" is the build date, not the CSV's
// last edit.
const currentDate = new Date().toISOString().split('T')[0]

// Same slug as /api/gear/:slug (server/utils/gear-data.ts) and GearItem links.
const gearSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Gear Inventory',
  numberOfItems: totalItems.value,
  itemListElement: gearItems.value.slice(0, 30).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `https://ejfox.com/gear/${slugifyGear(item.Name)}`,
    name: item.Name,
  })),
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(gearSchema.value),
    },
  ],
}))
</script>

<template>
  <div data-page-main class="px-4 md:px-6 lg:px-8 max-w-full min-h-screen pt-8">
    <!-- ── Header: totals, unit/sort controls, legend ─────────── -->
    <div
      v-if="csvError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <header v-else class="section-spacing-sm">
      <!-- Mobile: Stack vertically, Desktop: Horizontal layout -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-3 section-spacing-sm"
      >
        <div class="flex flex-col gap-2">
          <h1 class="font-mono text-sm text-zinc-900 dark:text-zinc-100">
            GEAR
          </h1>
          <div class="font-mono text-3xs text-muted tabular">
            {{ totalItems }} items · {{ displayTotalWeight.value }} ·
            {{ containerCount }} bags
          </div>
          <div class="font-mono text-3xs text-zinc-500">
            Updated {{ currentDate }} · source: gear sheet exports
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto"
        >
          <label for="weight-unit" class="sr-only">Weight unit</label>
          <div class="relative w-full sm:w-auto">
            <select
              id="weight-unit"
              v-model="weightUnit"
              class="gear-select w-full sm:w-auto"
            >
              <option value="metric">KG/G</option>
              <option value="imperial">LB/OZ</option>
            </select>
            <span class="select-dropdown-arrow">▼</span>
          </div>
          <button
            title="Toggle sort"
            class="gear-btn flex-gap-0.5 w-full sm:w-auto"
            @click="toggleSort"
          >
            <span class="text-5xs">
              {{ sortBy === 'weight' ? '↓' : '↑' }}
            </span>
            {{ sortBy === 'weight' ? 'Weight' : 'Name' }}
          </button>
          <a
            href="/api/gear-csv"
            download
            class="gear-btn inline-flex-gap-0.5 w-full sm:w-auto"
          >
            <span>↓</span>
            CSV
          </a>
        </div>
      </div>

      <div class="mb-4">
        <div class="mb-4">
          <h3 class="gear-section-header mb-2">Type Legend</h3>
          <!-- Mobile: 2 cols, Tablet: 4 cols, Desktop: 7 cols -->
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2"
          >
            <div
              v-for="type in typeStats"
              :key="type.name"
              class="flex-gap-0.5"
            >
              <span class="text-xs font-medium text-muted">
                {{ type.symbol }}
              </span>
              <div class="flex-1 min-w-0">
                <div
                  class="font-mono text-3xs text-zinc-500 dark:text-zinc-400 truncate"
                >
                  {{ type.name }}
                </div>
                <div class="text-4xs text-muted tabular">
                  {{ type.count }} · {{ type.weight }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="gear-footer-date">
          <span class="uppercase tracking-[0.1em]">{{ currentDate }}</span>
        </div>

        <p class="mt-2 text-3xs leading-3 text-zinc-500 font-mono">
          Some product links are affiliate links — as an Amazon Associate I earn
          from qualifying purchases. It costs you nothing extra.
        </p>

        <div v-if="containerComparison.length" class="mt-4">
          <h3 class="gear-section-header mb-2">Weight by Container</h3>
          <div class="flex items-end gap-1 h-12">
            <div
              v-for="c in containerComparison"
              :key="c.name"
              v-tooltip="`${c.name}: ${c.items} items, ${c.weight}`"
              class="flex-1 h-full flex flex-col justify-end items-center group cursor-default"
            >
              <div
                class="w-full bg-zinc-300 dark:bg-zinc-600 transition-colors"
                :class="{ 'group-hover:bg-zinc-500': true }"
                :style="{ height: `${c.heightPct}%`, minHeight: '2px' }"
              ></div>
            </div>
          </div>
          <div class="flex gap-1 mt-1">
            <div
              v-for="c in containerComparison"
              :key="`lbl-${c.name}`"
              class="flex-1 text-center overflow-hidden"
            >
              <span class="text-5xs font-mono text-zinc-500 truncate block">
                {{ c.short }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ── 3D scans (WebGL, client only) ──────────────────────── -->
    <ClientOnly>
      <div v-if="scannedItems.length > 0" class="mb-8">
        <h2 class="gear-section-header mb-4">3D Scans</h2>
        <GearGear3DGallery :items="scannedItems" />
      </div>
    </ClientOnly>

    <!-- ── Container cards (jump links) ───────────────────────── -->
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
            <span class="font-mono text-3xs text-zinc-800 dark:text-zinc-200">
              {{ container }}
            </span>
            <div class="text-5xs text-zinc-600 tabular-nums">
              <span>{{ items.length }}×</span>
              <span class="text-zinc-500">{{ getAvgItemWeight(items) }}</span>
            </div>
          </div>
          <div class="mt-2">
            <!-- One bar per item (first 20): width = share of the
                 container's weight, opacity scales with item weight -->
            <div class="flex items-end h-4 bg-zinc-900/30 rounded-sm">
              <div
                v-for="item in items.slice(0, 20)"
                :key="item.Name"
                v-tooltip="`${item.Name}: ${formatItemWeight(item)}`"
                class="bg-zinc-600 h-0.5 hover:h-full hover:bg-zinc-400 transition-all duration-100 cursor-default"
                :style="{
                  width: `${getWeightPercentage(item, items)}%`,
                  opacity:
                    0.3 + getItemWeightInOunces(item) / getMaxWeight(items),
                }"
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

    <!-- ── Per-container tables ───────────────────────────────── -->
    <!-- Section ids must match the slugging in scrollToContainer and the
         card/TOC hrefs: lowercase, whitespace → "-". -->
    <div ref="gearReveal" class="space-y-12">
      <section
        v-for="[container, items] in groupedGear"
        :id="container.toLowerCase().replace(/\s+/g, '-')"
        :key="container"
        class="scroll-mt-4"
      >
        <div class="gear-container-header">
          <div class="flex items-baseline gap-3">
            <h2 class="text-3xs font-mono text-zinc-800 dark:text-zinc-200">
              {{ container }}
            </h2>
            <span class="text-5xs text-zinc-600">
              {{ items.length }}×{{ getAvgItemWeight(items) }}
            </span>
            <span class="text-5xs text-zinc-600">
              {{ getWeightRange(items) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-5xs font-mono text-zinc-500 tabular-nums">
              {{ formatWeight(items) }}
            </span>
            <div class="flex items-end gap-px h-3">
              <div
                v-for="(bucket, i) in getWeightHistogram(items)"
                :key="i"
                v-tooltip="`${bucket.count} items: ${bucket.range}`"
                class="gear-histogram"
                :style="{ height: `${bucket.height}%` }"
              ></div>
            </div>
          </div>
        </div>

        <GearSpecimenPlate
          v-if="items.length >= 2"
          :items="items.slice(0, 6)"
          class="mb-4"
        />

        <!-- phones can't fit all nine columns: say so, and fade the edge -->
        <div
          class="sm:hidden text-right font-mono text-4xs text-zinc-500 mb-0.5"
          aria-hidden="true"
        >
          scroll →
        </div>
        <div class="relative overflow-x-auto gear-table-scroll">
          <table class="w-full text-4xs font-mono">
            <thead class="sticky top-0 bg-surface backdrop-blur-sm">
              <tr class="border-b border-zinc-200/30 dark:border-zinc-700/30">
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
            <tbody>
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
    <!-- ── Sidebar TOC (teleported into the layout's nav) ─────── -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="space-y-4">
          <div
            class="font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            Containers
          </div>

          <div class="space-y-0.5">
            <a
              v-for="[container, items] in groupedGear"
              :key="`nav-${container}`"
              :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
              class="flex justify-between font-mono text-3xs tabular-nums text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              @click.prevent="scrollToContainer(container)"
            >
              <span class="truncate mr-2">{{ container }}</span>
              <span class="text-zinc-600 whitespace-nowrap">
                {{ formatWeight(items) }}
              </span>
            </a>
          </div>

          <div
            class="space-y-1 pt-2 border-t border-zinc-800 font-mono text-3xs tabular-nums"
          >
            <div class="flex justify-between">
              <span class="text-zinc-500">Items</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ totalItems }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Total</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ displayTotalWeight.value }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Bags</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ containerCount }}
              </span>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style>
/* NOTE: unscoped — these class names are global. */
/* ── Table scroll shadows ─────────────────────────────────── */
/* Scroll shadows (CSS only): the bg-surface covers ride along with the
   content (attachment: local) and hide the tinted edges (attachment: scroll)
   once you reach that end — so an edge only shows where more table hides. */
.gear-table-scroll {
  background:
    linear-gradient(to right, var(--bg-surface) 30%, transparent) left center /
      2rem 100% no-repeat local,
    linear-gradient(to left, var(--bg-surface) 30%, transparent) right center /
      2rem 100% no-repeat local,
    linear-gradient(to right, rgb(113 113 122 / 0.35), transparent) left
      center / 0.75rem 100% no-repeat scroll,
    linear-gradient(to left, rgb(113 113 122 / 0.35), transparent) right
      center / 0.75rem 100% no-repeat scroll;
}
/* ── Layout helpers ───────────────────────────────────────── */
.flex-between {
  @apply flex items-center justify-between;
}

.flex-gap-0.5 {
  @apply flex items-center gap-0.5;
}

.inline-flex-gap-0.5 {
  @apply inline-flex items-center gap-0.5;
}

.grid-gear-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2;
}

/* ── Controls ─────────────────────────────────────────────── */
.gear-btn {
  @apply px-3 py-2 text-3xs font-mono uppercase tracking-wide;
  @apply text-zinc-700 dark:text-zinc-300;
  @apply bg-zinc-100 dark:bg-surface;
  @apply hover:bg-zinc-200 dark:hover:bg-zinc-800;
  @apply border border-zinc-300 dark:border-zinc-700;
  @apply hover:border-zinc-400 dark:hover:border-zinc-600;
  @apply transition-colors duration-200;
  @apply min-h-[44px] flex items-center justify-center; /* Touch-friendly */
}

.gear-select {
  @apply px-3 py-2 pr-8 text-3xs font-mono uppercase tracking-wide;
  @apply text-zinc-700 dark:text-zinc-300;
  @apply bg-zinc-100 dark:bg-surface;
  @apply border border-zinc-300 dark:border-zinc-700;
  @apply appearance-none cursor-pointer;
  @apply min-h-[44px]; /* Touch-friendly */
}

/* text-5xs (8px) applied as raw CSS — @apply can't resolve a @layer-utilities
   class from another file inside a scoped <style>. Value matches .text-5xs. */
.select-dropdown-arrow {
  @apply absolute right-3 top-1/2 -translate-y-1/2;
  @apply text-zinc-500 dark:text-zinc-500 pointer-events-none;
  font-size: 0.5rem;
  line-height: 0.75rem;
  letter-spacing: 0.03em;
}

/* ── Table headers + stats ────────────────────────────────── */
/* Same raw 8px values as above, for the same @apply reason. */
.gear-th {
  @apply text-center px-1 py-1 font-normal text-zinc-500;
  font-size: 0.5rem;
  line-height: 0.75rem;
  letter-spacing: 0.03em;
}

.gear-th-left {
  @apply text-left px-1 py-1 font-normal text-zinc-500 uppercase;
  font-size: 0.5rem;
  line-height: 0.75rem;
  letter-spacing: 0.03em;
}

.gear-th-right {
  @apply text-right px-1 py-1 font-normal text-zinc-500 pr-2;
  font-size: 0.5rem;
  line-height: 0.75rem;
  letter-spacing: 0.03em;
}

.gear-weight-range {
  @apply flex justify-between mt-2 text-zinc-600 font-mono;
  font-size: 0.5rem;
  line-height: 0.75rem;
  letter-spacing: 0.03em;
}

.gear-histogram {
  @apply w-1 bg-zinc-700/50;
}

.gear-section-header {
  @apply text-3xs font-mono uppercase tracking-[0.05em] text-zinc-500;
}

.gear-container-card {
  @apply flex flex-col py-1 px-1;
}

.gear-container-header {
  @apply flex items-baseline justify-between pb-2 mb-4;
}

.gear-footer-date {
  @apply font-mono text-3xs uppercase tracking-[0.1em] mt-2;
  @apply text-zinc-500 dark:text-zinc-600;
}
</style>
