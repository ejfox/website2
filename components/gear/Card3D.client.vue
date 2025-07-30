<template>
  <div
    ref="cardRef"
    class="gear-card p-8 max-w-md w-full shadow-lg mb-8 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
    :style="cardTransform"
  >
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">
        {{ getTypeSymbol(gearItem.Type) }}
      </div>
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {{ gearItem.Name }}
      </h1>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
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
    <div class="text-center mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div class="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mb-1">
        {{ displayWeight }}g
      </div>
      <div class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
        Weight
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          T{{ itemTier }}
        </div>
        <div class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
          Tier
        </div>
      </div>
      <div class="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div class="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
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
    <div class="mt-8 border-t border-zinc-200 dark:border-zinc-700 pt-6">
      <h3
        class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider"
      >
        Item Details
      </h3>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 min-w-0"
        >
          <span class="text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex-shrink-0">{{
            formatFieldName(key)
          }}</span>
          <span
            class="text-zinc-900 dark:text-zinc-100 font-mono text-right truncate ml-2 min-w-0"
            :title="value"
          >{{ value || '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMouse } from '@vueuse/core'
import { animate, stagger as _stagger } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

const props = defineProps({
  gearItem: {
    type: Object,
    default: () => ({})
  }
})

const { getItemWeightInGrams } = useWeightCalculations()
const { timing, easing: _easing } = useAnimations()

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
    transition: 'transform 0.3s ease-out',
    filter: 'blur(0px)' // Ensure no blur from animations sticks
  }
})

// Epic gear card reveal sequence with physics morphing
const animateGearCardReveal = async () => {
  if (process.server || !cardRef.value) return
  
  await nextTick()
  
  // Stage 1: RAPID SPRINGY ENTRANCE for simultaneous flow
  animate(cardRef.value, {
    keyframes: [
      { 
        opacity: 0.3, 
        scale: 0.4, 
        rotateX: -90, 
        rotateY: 45, 
        rotateZ: -20,
        perspective: 1500,
        translateZ: -200,
        filter: 'blur(4px) brightness(0.3) contrast(0.8)'
      },
      { 
        opacity: 0.7, 
        scale: 1.2, 
        rotateX: 20, 
        rotateY: -15, 
        rotateZ: 10,
        perspective: 1300,
        translateZ: 80,
        filter: 'blur(1px) brightness(1.3) contrast(1.2)'
      },
      { 
        opacity: 0.9, 
        scale: 0.95, 
        rotateX: -3, 
        rotateY: 5, 
        rotateZ: -2,
        perspective: 1400,
        translateZ: -10,
        filter: 'blur(0.2px) brightness(1.05) contrast(1.05)'
      },
      { 
        opacity: 1, 
        scale: 1, 
        rotateX: 0, 
        rotateY: 0, 
        rotateZ: 0,
        perspective: 1500,
        translateZ: 0,
        filter: 'blur(0px) brightness(1) contrast(1)'
      }
    ],
    duration: 500, // Much faster for simultaneous flow
    ease: 'outElastic(1, .6)', // Still springy but faster
    complete: () => {
      // Ensure card is crisp after animation
      if (cardRef.value) {
        cardRef.value.style.filter = 'none'
      }
    }
  })
  
  // Stage 2: EXPLOSIVE content cascade with directional physics
  setTimeout(() => {
    const sections = cardRef.value?.querySelectorAll('div[class*="mb-6"], div[class*="mt-8"]')
    if (sections?.length) {
      animate(Array.from(sections), {
        keyframes: [
          { 
            opacity: 0, 
            translateY: 60, 
            translateX: -30,
            scale: 0.7, 
            rotateX: -25, 
            rotateZ: -8,
            filter: 'blur(2px) brightness(0.6)' 
          },
          { 
            opacity: 0.6, 
            translateY: -10, 
            translateX: 5,
            scale: 1.15, 
            rotateX: 8, 
            rotateZ: 3,
            filter: 'blur(0.3px) brightness(1.2)' 
          },
          { 
            opacity: 1, 
            translateY: 0, 
            translateX: 0,
            scale: 1, 
            rotateX: 0, 
            rotateZ: 0,
            filter: 'blur(0px) brightness(1)' 
          }
        ],
        duration: 400, // Faster cascade
        delay: _stagger(60, { from: 'center', direction: 'reverse' }),
        ease: 'outElastic(1, .8)' // Maximum spring!
      })
    }
  }, 200) // Earlier start
  
  // Stage 3: DYNAMIC floating with physics variation
  setTimeout(() => {
    const floatAnimation = () => {
      const randomVariation = () => Math.random() * 0.5 - 0.25 // ±0.25 variation
      
      animate(cardRef.value, {
        translateY: [0, -15 + randomVariation(), 0],
        translateX: [0, 3 + randomVariation(), 0],
        rotateX: [0, 4 + randomVariation(), 0],
        rotateY: [0, -3 + randomVariation(), 0],
        rotateZ: [0, 1 + randomVariation(), 0],
        scale: [1, 1.008 + randomVariation() * 0.01, 1],
        filter: ['brightness(1)', `brightness(${1.02 + randomVariation() * 0.02})`, 'brightness(1)'],
        duration: 6000 + Math.random() * 2000, // Variable timing
        ease: 'inOutSine',
        complete: floatAnimation
      })
    }
    floatAnimation()
  }, 1800)
  
  // Stage 4: Ambient detail pulse - DISABLED (causing looping animations)
  // setTimeout(() => {
  //   const details = cardRef.value?.querySelectorAll('.text-lg, .text-3xl, .text-2xl')
  //   if (details?.length) {
  //     const pulseDetails = () => {
  //       animate(Array.from(details), {
  //         scale: [1, 1.02, 1],
  //         filter: ['contrast(1)', 'contrast(1.05)', 'contrast(1)'],
  //         duration: timing.expressive * 7,
  //         delay: _stagger(800, { from: 'random' }),
  //         ease: 'inOutQuad',
  //         complete: () => setTimeout(pulseDetails, 8000)
  //       })
  //     }
  //     pulseDetails()
  //   }
  // }, 2500)
}

// Epic gear card exit sequence for navigation transitions
const animateGearCardExit = async (direction = 'neutral') => {
  if (process.server || !cardRef.value) return
  
  // Direction-based exit animation
  const exitTransforms = {
    left: { rotateY: -60, translateX: -300, rotateZ: -15 },
    right: { rotateY: 60, translateX: 300, rotateZ: 15 },
    neutral: { rotateY: 0, translateX: 0, rotateZ: 0, scale: 0.3 }
  }
  
  const transform = exitTransforms[direction] || exitTransforms.neutral
  
  // Stage 1: Quick prep animation
  animate(cardRef.value, {
    scale: [1, 1.05],
    filter: ['brightness(1)', 'brightness(1.2)'],
    duration: timing.micro,
    ease: 'outQuad'
  })
  
  // Stage 2: Physics-based exit explosion
  setTimeout(() => {
    animate(cardRef.value, {
      opacity: [1, 0.3, 0],
      scale: [1.05, 1.3, transform.scale || 0.2],
      rotateX: [0, -20, -90],
      rotateY: [0, transform.rotateY * 0.5, transform.rotateY],
      rotateZ: [0, transform.rotateZ * 0.5, transform.rotateZ],
      translateX: [0, transform.translateX * 0.3, transform.translateX],
      translateZ: [0, 100, -200],
      filter: ['brightness(1.2)', 'brightness(2)', 'brightness(0.1)'],
      duration: timing.slow,
      ease: 'inBack(1.7)'
    })
  }, 150)
}

// Expose exit animation for page transitions
const triggerExit = (direction) => animateGearCardExit(direction)

onMounted(() => {
  animateGearCardReveal()
})

// Expose the exit function to parent components
defineExpose({
  triggerExit
})
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
  transform: 
    perspective(1500px) 
    rotateX(-90deg) 
    rotateY(45deg) 
    rotateZ(-20deg) 
    scale(0.4) 
    translateZ(-200px);
  filter: blur(4px) brightness(0.3) contrast(0.8);
}

/* Ensure no blur remains after animations */
.gear-card[style*="filter: none"],
.gear-card:not([style*="filter"]) {
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
