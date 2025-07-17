<template>
  <div
    class="gear-card card-gear p-8 max-w-md w-full shadow-lg mb-8 overflow-hidden"
    :style="cardTransform"
  >
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">
        {{ getTypeSymbol(gearItem.Type) }}
      </div>
      <h1 class="text-2xl font-bold text-primary mb-1">
        {{ gearItem.Name }}
      </h1>
      <div class="text-sm text-muted uppercase tracking-wider">
        {{ gearItem.Type }}
      </div>
    </div>

    <!-- Photo Section -->
    <div v-if="gearImagePath" class="mb-6 flex justify-center">
      <div
        class="w-48 h-48 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
      >
        <NuxtImg
          :src="gearImagePath"
          :alt="`Photo of ${gearItem.Name}`"
          class="w-full h-full object-cover"
          loading="lazy"
          width="480"
          height="480"
          placeholder
          :style="{ imageRendering: 'pixelated' }"
        />
      </div>
    </div>

    <!-- Weight - Hero stat -->
    <div class="text-center mb-6 p-4 bg-subtle rounded-xl">
      <div class="text-3xl font-bold text-tabular text-primary mb-1">
        {{ displayWeight }}g
      </div>
      <div class="text-mono-label">
        Weight
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="stat-container">
        <div class="text-lg font-semibold text-primary">
          T{{ itemTier }}
        </div>
        <div class="text-mono-label">
          Tier
        </div>
      </div>
      <div class="stat-container">
        <div class="text-lg font-semibold text-primary">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div class="text-mono-label">
          H₂O
        </div>
      </div>
    </div>

    <!-- Container -->
    <div class="text-center text-sm text-muted">
      <span class="uppercase tracking-wider">{{
        gearItem['Parent Container'] || 'Unassigned'
      }}</span>
    </div>

    <!-- Buy link if available -->
    <div v-if="gearItem.amazon" class="text-center mt-6">
      <a
        :href="amazonUrl"
        target="_blank"
        rel="nofollow noopener"
        class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
      >
        Buy
      </a>
    </div>

    <!-- Item Details Table -->
    <div class="mt-8 border-t border-muted pt-6">
      <h3
        class="text-sm font-semibold text-primary mb-4 uppercase tracking-wider"
      >
        Item Details
      </h3>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="flex-between py-1 border-b border-subtle last:border-b-0 min-w-0"
        >
          <span class="text-muted uppercase tracking-wider flex-shrink-0">{{
            formatFieldName(key)
          }}</span>
          <span
            class="text-primary font-mono text-right truncate ml-2 min-w-0"
            :title="value"
          >{{ value || '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMouse } from '@vueuse/core'

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

// Helper functions
const getTypeSymbol = (type) => typeSymbols[type] || '—'

const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[()]/g, '')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

// Computed properties
const displayWeight = computed(() => getItemWeightInGrams(props.gearItem) || 0)

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

// 3D mouse tracking
const { x: mouseX, y: mouseY } = useMouse()

const cardTransform = computed(() => {
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2

  const rotateX = -((mouseY.value - centerY) / centerY) * 20
  const rotateY = ((mouseX.value - centerX) / centerX) * 20
  const translateZ =
    (Math.abs(mouseX.value - centerX) / centerX +
      Math.abs(mouseY.value - centerY) / centerY) *
    15

  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
    transition: 'transform 0.3s ease-out'
  }
})
</script>

<style scoped>
.gear-card {
  transform-style: preserve-3d;
}
</style>
