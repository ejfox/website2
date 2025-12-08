<template>
  <div ref="cardRef" class="gear-card-container" :style="cardTransform">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="text-4xl mb-2">
        {{ getTypeSymbol(gearItem.Type) }}
      </div>
      <h1 class="text-2xl font-light text-zinc-900 dark:text-zinc-100 mb-2">
        {{ gearItem.Name }}
      </h1>
      <div :class="headerLabelClass">
        {{ gearItem.Type }}
      </div>
    </div>

    <!-- Photo Section -->
    <div v-if="gearImagePath" class="mb-8 flex justify-center">
      <div class="gear-img-square">
        <img
          :src="gearImagePath"
          :alt="`Photo of ${gearItem.Name}`"
          class="w-full h-full object-cover"
          loading="lazy"
          width="480"
          height="480"
        />
      </div>
    </div>

    <!-- Weight - Hero stat -->
    <div class="text-center mb-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div :class="weightDisplayClass">{{ displayWeight }}g</div>
      <div :class="weightLabelClass">Weight</div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-normal text-zinc-900 dark:text-zinc-100">
          T{{ itemTier }}
        </div>
        <div :class="tierLabelClass">Tier</div>
      </div>
      <div class="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-normal text-zinc-900 dark:text-zinc-100">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div :class="tierLabelClass">H₂O</div>
      </div>
    </div>

    <!-- Container -->
    <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">
      <span class="uppercase tracking-widest">
        {{ gearItem['Parent Container'] || 'Unassigned' }}
      </span>
    </div>

    <!-- Buy link if available -->
    <div v-if="gearItem.amazon" class="text-center mt-8">
      <a
        :href="amazonUrl"
        target="_blank"
        rel="nofollow noopener"
        class="btn-inline-flex"
      >
        Buy
      </a>
    </div>

    <!-- Item Details Table -->
    <div class="mt-8 border-t border-zinc-200 dark:border-zinc-700 pt-8">
      <h3 class="label-tracked-md">Item Details</h3>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="row-bordered"
        >
          <span :class="fieldLabelClass">{{ formatFieldName(key) }}</span>
          <span :class="fieldValueClass" :title="value">
            {{ value || '—' }}
          </span>
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
    default: () => ({}),
  },
})

const { getItemWeightInGrams } = useWeightCalculations()

// Component refs
const cardRef = ref(null)

// Type symbols
const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Creativity: '✧',
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

// Class strings
const headerLabelClass =
  'text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-400'
const weightDisplayClass =
  'text-3xl font-bold font-mono mb-2 text-zinc-900 dark:text-zinc-100'
const weightLabelClass =
  'text-xs font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400'
const tierLabelClass =
  'text-xs font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400'
const fieldLabelClass =
  'flex-shrink-0 uppercase tracking-widest text-zinc-600 dark:text-zinc-400'
const fieldValueClass =
  'font-mono text-right truncate ml-2 min-w-0 text-zinc-900 dark:text-zinc-100'

// Computed properties
const displayWeight = computed(() => {
  // If both weight fields are empty, show "?" instead of 0
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
    transform: `perspective(1000px) rotateX(${rotateX}deg)
      rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
    transition: 'transform 0.3s ease-out',
    filter: 'blur(0px)',
  }
})
</script>

<style scoped>
.gear-card-container {
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.3s ease-out;
}
</style>
