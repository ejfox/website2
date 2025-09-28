<template>
  <div
    ref="cardRef"
    class="gear-card p-8 max-w-md w-full shadow-lg mb-8 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
    :style="cardTransform"
  >
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="text-4xl mb-2">
        {{ getTypeSymbol(gearItem.Type) }}
      </div>
      <h1 class="text-2xl font-light text-zinc-900 dark:text-zinc-100 mb-1">
        {{ gearItem.Name }}
      </h1>
      <div
        class="text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-widest"
      >
        {{ gearItem.Type }}
      </div>
    </div>

    <!-- Photo Section -->
    <div v-if="gearImagePath" class="mb-8 flex justify-center">
      <div
        class="w-48 h-48 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
      >
        <img
          :src="gearImagePath"
          :alt="`Photo of ${gearItem.Name}`"
          class="w-full h-full object-cover"
          loading="lazy"
          width="480"
          height="480"
          style="image-rendering: pixelated"
        />
      </div>
    </div>

    <!-- Weight - Hero stat -->
    <div class="text-center mb-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div
        class="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mb-1"
      >
        {{ displayWeight }}g
      </div>
      <div
        class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-mono"
      >
        Weight
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-normal text-zinc-900 dark:text-zinc-100">
          T{{ itemTier }}
        </div>
        <div
          class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-mono"
        >
          Tier
        </div>
      </div>
      <div class="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-normal text-zinc-900 dark:text-zinc-100">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div
          class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-mono"
        >
          H₂O
        </div>
      </div>
    </div>

    <!-- Container -->
    <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">
      <span class="uppercase tracking-widest">{{
        gearItem['Parent Container'] || 'Unassigned'
      }}</span>
    </div>

    <!-- Buy link if available -->
    <div v-if="gearItem.amazon" class="text-center mt-8">
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
    <div class="mt-8 border-t border-zinc-200 dark:border-zinc-700 pt-8">
      <h3
        class="text-sm font-light text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-widest"
      >
        Item Details
      </h3>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 min-w-0"
        >
          <span
            class="text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex-shrink-0"
            >{{ formatFieldName(key) }}</span
          >
          <span
            class="text-zinc-900 dark:text-zinc-100 font-mono text-right truncate ml-2 min-w-0"
            :title="value"
            >{{ value || '—' }}</span
          >
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
// NUKED BY BLOODHOUND: const { timing, easing: _easing } = // DELETED: useAnimations()

// Animation refs
const cardRef = ref(null)

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

// Cache window dimensions to prevent recalc flashes
const windowDimensions = ref({ width: 0, height: 0 })

const updateDimensions = () => {
  if (typeof window !== 'undefined') {
    windowDimensions.value = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
}

const cardTransform = computed(() => {
  // Use cached dimensions, fallback gracefully
  const centerX = (windowDimensions.value.width || 1920) / 2
  const centerY = (windowDimensions.value.height || 1080) / 2

  const rotateX = -((mouseY.value - centerY) / centerY) * 20
  const rotateY = ((mouseX.value - centerX) / centerX) * 20
  const translateZ =
    (Math.abs(mouseX.value - centerX) / centerX +
      Math.abs(mouseY.value - centerY) / centerY) *
    15

  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother easing
    transformOrigin: 'center center',
    willChange: 'transform'
  }
})

// Simple card mount effect
const animateGearCardReveal = async () => {
  if (process.server || !cardRef.value || !window.anime) return
  await nextTick()
  // Card naturally animates via CSS transitions
}

// Single onMounted combining all setup
onMounted(() => {
  updateDimensions()
  window.addEventListener('resize', updateDimensions)
  animateGearCardReveal()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})

// Card is self-contained, no exposed methods needed
</script>

<style scoped>
.gear-card {
  transform-style: preserve-3d;
  will-change: transform, opacity, filter, scale;
  backface-visibility: hidden;
  perspective: 1500px;
  transform-origin: center center;
  /* Start more subtle for simultaneous transitions */
  opacity: 0.3;
  /* Less dramatic initial state for faster transitions */
  transform: perspective(1500px) rotateX(-90deg) rotateY(45deg) rotateZ(-20deg)
    scale(0.4) translateZ(-200px);
  filter: blur(4px) brightness(0.3) contrast(0.8);
}

/* Ensure no blur remains after animations */
.gear-card[style*='filter: none'],
.gear-card:not([style*='filter']) {
  filter: none !important;
}

/* Enhanced 3D container */
.min-h-screen {
  perspective: 2000px;
  transform-style: preserve-3d;
}

/* 3D context for child elements */
.gear-card > * {
  transform-style: preserve-3d;
  will-change: transform, opacity, filter;
}
</style>
