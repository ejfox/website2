<!--
  @file GearStats.vue
  @description GEAR section of /stats (full width): totals, bags with their
    contents' weight, weight/count by type, essentials, recently used.
    Two sources: the headline totals + type counts come from the gearStats
    prop (stats.gear from /api/stats, server/api/gear-stats.get.ts); every
    per-item list is computed here from data/gear.csv, fetched client-side
    from /api/gear-csv on mount. Until that lands (and during SSR) the lists
    are empty and the totals fall back to the prop. Wired in pages/stats.vue.
  @props gearStats?: { stats: { totalItems, totalWeight, containerCount },
    typeDistribution } - totalWeight is in ounces
-->
<script setup lang="ts">
import * as d3 from 'd3'
import _StatsSectionHeader from './StatsSectionHeader.vue'

interface GearItem {
  Name?: string
  Type?: string
  Weight_oz?: string
  'Parent Container'?: string
  Tags?: string
  Last_Used?: string
  Purchase_Date?: string
}

const props = defineProps<{
  gearStats?: {
    stats: {
      totalItems: number
      totalWeight: number
      containerCount: number
    }
    typeDistribution: Record<string, number>
  }
}>()

const gearItems = ref<GearItem[]>([])

// ── Totals (prop first, CSV fallback) ───────────────────────

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
    const weightStr = item.Weight_oz
    const weightNum =
      weightStr && weightStr.trim() !== '' ? Number.parseFloat(weightStr) : 0
    return sum + (Number.isNaN(weightNum) ? 0 : weightNum)
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

// ── Unit conversions (28.35 g/oz, 16 oz/lb) ─────────────────

const ouncesToPounds = computed(() => {
  const pounds = Number(totalWeight.value) / 16
  return pounds
})

const gramsPerItem = computed(() => {
  if (totalItems.value === 0) return 0
  return (totalWeight.value * 28.35) / totalItems.value
})

// Smart weight formatter: grams for <300g (10.5oz), pounds for heavy,
// oz otherwise
const formatWeight = (oz: number) => {
  const grams = oz * 28.35
  if (grams < 300) {
    return `${grams.toFixed(0)}g`
  } else if (oz >= 16) {
    const lbs = oz / 16
    const remainingOz = oz % 16
    return remainingOz > 0
      ? `${lbs.toFixed(0)}lb ${remainingOz.toFixed(1)}oz`
      : `${lbs.toFixed(0)}lb`
  } else {
    return `${oz.toFixed(1)}oz`
  }
}

// ── Per-item lists (CSV only) ───────────────────────────────

// Weights are summed from the CSV, but count/avg divide by typeDistribution,
// which is the API's count when the prop is present.
const weightPerType = computed(() => {
  if (!gearItems.value?.length) return []

  const typeWeights = gearItems.value.reduce(
    (acc: Record<string, number>, item) => {
      if (item.Type && item.Weight_oz) {
        const weight = Number.parseFloat(item.Weight_oz) || 0
        acc[item.Type] = (acc[item.Type] || 0) + weight
      }
      return acc
    },
    {}
  )

  return Object.entries(typeWeights)
    .map(([type, weight]) => ({
      type,
      weight: weight,
      count: typeDistribution.value[type] || 0,
      avgWeight: weight / (typeDistribution.value[type] || 1),
    }))
    .sort((a, b) => b.weight - a.weight)
})

// Favorite/essential items (pinned to top)
const favoriteItems = computed(() => {
  return [...gearItems.value]
    .filter((item) => {
      const tags = item.Tags?.toLowerCase() || ''
      return (
        tags.includes('essential') ||
        tags.includes('edc') ||
        tags.includes('favorite')
      )
    })
    .sort(
      (a, b) =>
        Number.parseFloat(b.Weight_oz || '0') -
        Number.parseFloat(a.Weight_oz || '0')
    )
})

const recentlyUsed = computed(() => {
  return [...gearItems.value]
    .filter((item) => {
      const lastUsed = item.Last_Used
      return lastUsed && lastUsed.match(/^\d{4}-\d{2}-\d{2}$/)
    })
    .sort((a, b) => {
      const dateA = new Date(a.Last_Used || '')
      const dateB = new Date(b.Last_Used || '')
      return dateB.getTime() - dateA.getTime() // Most recent first
    })
})

// Main containers - top-level bags and carrying systems. "Top-level" = a Bag
// whose parent is Body, Motorcycle or blank. Weight counts direct children
// only, not bags nested inside the bag.
const mainContainers = computed(() => {
  if (!gearItems.value?.length) return []

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
      const containerWeight = Number.parseFloat(container.Weight_oz || '0') || 0
      const contentsWeight = childItems.reduce((sum, item) => {
        const weight = Number.parseFloat(item.Weight_oz || '0') || 0
        return sum + weight
      }, 0)

      return {
        name: containerName,
        type: container.Type || 'Container',
        weight: (containerWeight + contentsWeight).toFixed(1),
        itemCount: childItems.length,
        parentContainer: container['Parent Container'] || 'Body',
      }
    })
    .sort((a, b) => Number.parseFloat(b.weight) - Number.parseFloat(a.weight))
})

const gearStatsRef = ref<HTMLElement | null>(null)

// ── CSV load ────────────────────────────────────────────────

// Client-only (onMounted). pages/stats.vue lazy-hydrates this section on
// visibility, so the CSV is only fetched once GEAR scrolls into view.
onMounted(async () => {
  try {
    const response = await fetch('/api/gear-csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText) as GearItem[]
  } catch (_error) {
    console.error('Error loading gear data:', _error)
  }
})
</script>

<template>
  <div
    ref="gearStatsRef"
    class="space-y-2 pr-4 md:pr-8 font-mono text-2xs leading-4"
  >
    <!-- ── Summary grid ─────────── -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
      <div class="flex justify-between">
        <span class="text-zinc-500">ITEMS</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ totalItems }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">CONTAINERS</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ containerCount }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">WEIGHT</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ totalWeight.toFixed(1) }}oz
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">TYPES</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ Object.keys(typeDistribution).length }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">LBS</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ ouncesToPounds.toFixed(2) }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">G/ITEM</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ gramsPerItem.toFixed(0) }}g
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-zinc-500">OZ/ITEM</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ (totalWeight / totalItems).toFixed(1) }}
        </span>
      </div>
      <div class="flex justify-between">
        <!-- Total weight / container count, i.e. per container, not per item -->
        <span class="text-zinc-500">AVG WT</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
          {{ (totalWeight / containerCount).toFixed(1) }}oz
        </span>
      </div>
    </div>

    <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>

    <!-- ── Containers ─────────── -->
    <div class="space-y-0.5">
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        BAGS
      </div>
      <div
        v-for="container in mainContainers"
        :key="container.name"
        class="row-hover-gap"
      >
        <div class="flex items-baseline gap-1 min-w-0 flex-1">
          <span class="text-zinc-500 text-3xs">
            {{ container.type.substring(0, 3) }}
          </span>
          <span class="text-zinc-700 dark:text-zinc-300 truncate text-2xs">
            {{ container.name }}
          </span>
        </div>
        <div
          class="flex items-baseline gap-2 tabular-nums text-3xs flex-shrink-0"
          :class="['text-zinc-500']"
        >
          <span>{{ container.itemCount }}</span>
          <span class="text-zinc-700 dark:text-zinc-300">
            {{ formatWeight(parseFloat(container.weight)) }}
          </span>
        </div>
      </div>
    </div>

    <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>

    <!-- Weight Per Type -->
    <div class="space-y-0.5">
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        WEIGHT BY TYPE
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div
          v-for="item in weightPerType.slice(0, 10)"
          :key="item.type"
          class="flex items-baseline justify-between gap-0.5"
        >
          <span class="text-zinc-500 text-3xs uppercase truncate">
            {{ item.type }}
          </span>
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-3xs">
            {{ formatWeight(item.weight) }}
          </span>
        </div>
      </div>
    </div>

    <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>

    <!-- Type Distribution: bar is 0–20px scaled to the top type, 4px floor so
         a count of 1 is still visible -->
    <div class="space-y-0.5">
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        TYPE COUNTS
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div
          v-for="[type, count] in sortedTypeDistribution.slice(0, 10)"
          :key="type"
          class="flex items-center justify-between gap-0.5"
        >
          <span class="text-zinc-500 text-3xs uppercase truncate">
            {{ type }}
          </span>
          <div class="flex items-center gap-0.5">
            <div
              class="h-1 bg-zinc-400 dark:bg-zinc-600 rounded-[1px]"
              :style="{
                width: `${Math.max(4, (count / maxTypeCount) * 20)}px`,
              }"
            ></div>
            <span
              class="tabular-nums text-3xs w-4 text-right"
              :class="['text-zinc-700 dark:text-zinc-300']"
            >
              {{ count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Favorites - Pinned to Top -->
    <div v-if="favoriteItems.length > 0" class="space-y-0.5">
      <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        ⭐ ESSENTIALS
      </div>
      <div
        v-for="item in favoriteItems.slice(0, 8)"
        :key="item.Name"
        class="flex justify-between gap-2 text-3xs"
      >
        <span class="text-zinc-700 dark:text-zinc-300 truncate">
          {{ item.Name }}
        </span>
        <span class="text-zinc-500 tabular-nums flex-shrink-0">
          {{ formatWeight(parseFloat(item.Weight_oz || '0')) }}
        </span>
      </div>
    </div>

    <!-- Recently Used -->
    <div v-if="recentlyUsed.length > 0" class="space-y-0.5">
      <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        RECENTLY USED
      </div>
      <div
        v-for="item in recentlyUsed.slice(0, 8)"
        :key="item.Name"
        class="flex justify-between gap-2 text-3xs"
      >
        <span class="text-zinc-700 dark:text-zinc-300 truncate">
          {{ item.Name }}
        </span>
        <div class="flex items-baseline gap-1">
          <span class="text-zinc-500 text-3xs">{{ item.Last_Used }}</span>
          <span class="text-zinc-500 tabular-nums flex-shrink-0">
            {{ formatWeight(parseFloat(item.Weight_oz || '0')) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Average Weight Per Type -->
    <div v-if="weightPerType.length > 0" class="space-y-0.5">
      <div class="h-px bg-zinc-200 dark:bg-raised my-2"></div>
      <div class="text-zinc-500 text-3xs uppercase tracking-wider mb-2">
        AVG WT/TYPE
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div
          v-for="item in weightPerType.slice(0, 8)"
          :key="item.type + '-avg'"
          class="flex items-baseline justify-between gap-0.5"
        >
          <span class="text-zinc-500 text-3xs uppercase truncate">
            {{ item.type }}
          </span>
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-3xs">
            {{ formatWeight(item.avgWeight) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* None of these three classes appear in the template above. */
.text-2xl {
  font-feature-settings: 'tnum';
}

.container-item {
  @apply transition-all duration-300;
}

/* Type bar animation base */
.type-bar {
  @apply transition-all duration-300 rounded-sm;
}
</style>
