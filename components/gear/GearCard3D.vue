<template>
  <div class="w-full max-w-2xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center space-y-3">
      <div class="text-5xl">{{ getTypeSymbol(gearItem.Type) }}</div>
      <h1 class="text-3xl font-light text-zinc-900 dark:text-zinc-100">
        {{ gearItem.Name }}
      </h1>
      <div class="text-sm uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
        {{ gearItem.Type }}
      </div>
    </div>

    <!-- Photo Section -->
    <div v-if="gearImagePath" class="flex justify-center">
      <img
        :src="gearImagePath"
        :alt="`Photo of ${gearItem.Name}`"
        class="w-full max-w-md rounded-lg"
        loading="lazy"
        width="480"
        height="480"
      />
    </div>

    <!-- Weight - Hero stat -->
    <div class="text-center p-6 border border-zinc-200 dark:border-zinc-800">
      <div class="text-4xl font-mono font-bold mb-2 text-zinc-900 dark:text-zinc-100">
        {{ displayWeight }}g
      </div>
      <div class="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
        Weight
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="text-center p-4 border border-zinc-200 dark:border-zinc-800">
        <div class="text-xl font-mono text-zinc-900 dark:text-zinc-100 mb-1">
          T{{ itemTier }}
        </div>
        <div class="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Tier
        </div>
      </div>
      <div class="text-center p-4 border border-zinc-200 dark:border-zinc-800">
        <div class="text-xl font-mono text-zinc-900 dark:text-zinc-100 mb-1">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div class="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          H₂O
        </div>
      </div>
    </div>

    <!-- Container -->
    <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">
      <span class="uppercase tracking-wider">{{
        gearItem['Parent Container'] || 'Unassigned'
      }}</span>
    </div>

    <!-- Buy link if available -->
    <div v-if="gearItem.Amazon_URL" class="text-center">
      <a
        :href="amazonUrl"
        target="_blank"
        rel="nofollow noopener"
        class="inline-block px-4 py-2 border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-colors"
      >
        Buy on Amazon
      </a>
    </div>

    <!-- Item Details Table -->
    <div class="border-t border-zinc-200 dark:border-zinc-800 pt-8 space-y-2">
      <h3 class="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-4">
        Details
      </h3>
      <div class="space-y-1 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="flex justify-between items-start py-2 border-b border-zinc-100 dark:border-zinc-900"
        >
          <span class="uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex-shrink-0">
            {{ formatFieldName(key) }}
          </span>
          <span class="font-mono text-right text-zinc-900 dark:text-zinc-100 truncate ml-4">
            {{ value || '—' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  gearItem: {
    type: Object,
    default: () => ({})
  }
})

const { getItemWeightInGrams } = useWeightCalculations()

// Type symbols
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

const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[()]/g, '')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

// Computed properties
const displayWeight = computed(() => {
  const baseWeight = props.gearItem['Base Weight ()']
  const loadedWeight = props.gearItem['Loaded Weight ()']

  if (!baseWeight && !loadedWeight) {
    return '?'
  }

  return getItemWeightInGrams(props.gearItem) || 0
})

const itemTier = computed(() => {
  const T = Number(props.gearItem['Time Criticality (T)']) || 0
  const C = Number(props.gearItem['Consequence Severity (C)']) || 0
  const W = Number(props.gearItem['Weight/Space Penalty (W)']) || 0
  const M = Number(props.gearItem['Multi-Use Factor (M)']) || 0
  const score = 2 * T + 2 * C + 1.5 * W + M

  if (score >= 35) return 1
  if (score >= 25) return 2
  return 3
})

const amazonUrl = computed(() => {
  if (!props.gearItem?.amazon) return '#'
  const url = new URL(props.gearItem.amazon)
  url.searchParams.set('tag', 'ejfox0c-20')
  return url.toString()
})

const gearImagePath = computed(() => {
  if (props.gearItem.imageUrl && props.gearItem.imageUrl.trim() !== '') {
    return props.gearItem.imageUrl
  }
  return null
})

const itemDetails = computed(() => {
  const details = {}
  Object.keys(props.gearItem).forEach((key) => {
    const value = props.gearItem[key]
    if (value && value.toString().trim() !== '') {
      details[key] = value
    }
  })
  return details
})
</script>

