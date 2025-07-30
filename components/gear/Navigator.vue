<template>
  <div
    ref="containerRef"
    class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-700 p-2 z-50"
  >
    <div class="overflow-x-auto scrollbar-hide">
      <div
        ref="itemsContainerRef"
        class="flex gap-3 items-center py-2"
        style="scroll-snap-type: x mandatory"
      >
        <div
          v-for="(item, index) in sortedGearItems"
          :key="item.Name"
          ref="gearItemRefs"
          :data-index="index"
          class="gear-item flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-2"
          :class="
            isCurrentItem(item)
              ? 'border-zinc-100 dark:border-zinc-900 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 gear-item-active'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          "
          style="scroll-snap-align: center"
          @click="navigateToGear(item)"
        >
          <div class="text-lg mb-1">
            {{ getTypeSymbol(item.Type) }}
          </div>
          <div class="text-[8px] font-mono leading-tight truncate w-full">
            {{ item.Name }}
          </div>
          <div
            class="text-[7px] font-mono"
            :class="
              isCurrentItem(item)
                ? 'text-zinc-300 dark:text-zinc-600'
                : 'text-zinc-500 dark:text-zinc-400'
            "
          >
            {{ getItemWeight(item) }}g
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { animate } from '~/anime.esm.js'
import { useScrollAnimation } from '~/composables/useScrollAnimation'
// import { useAnimatables } from '~/composables/useAnimatables'
import { useAnimations } from '~/composables/useAnimations'

const props = defineProps({
  currentSlug: {
    type: String,
    default: ''
  }
})

// Animation refs
const containerRef = ref(null)
const itemsContainerRef = ref(null)
const gearItemRefs = ref([])

// Animation composables
const {
  gridDataReveal,
  dataStream: _dataStream,
  criticalHighlight
} = useScrollAnimation()
// const _createDataCard = createDataCard

// Animation state
const itemAnimatables = ref(new Map())
const hasAnimated = ref(false)

const { getItemWeightInGrams } = useWeightCalculations()
const { timing, easing } = useAnimations()

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

// Fetch all gear items
const { data: allGearItems } = await useAsyncData('all-gear', async () => {
  const csvText = await $fetch('/gear.csv', { responseType: 'text' })
  return d3.csvParse(csvText)
})

// Helper functions
const getTypeSymbol = (type) => typeSymbols[type] || '—'
const getItemWeight = (item) => getItemWeightInGrams(item) || 0

const isCurrentItem = (item) => {
  return (
    item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === props.currentSlug
  )
}

const navigateToGear = async (item) => {
  const slug = item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Determine navigation direction for directional transitions
  const currentIndex = sortedGearItems.value.findIndex((i) => isCurrentItem(i))
  const targetIndex = sortedGearItems.value.findIndex((i) => i === item)
  const direction = targetIndex > currentIndex ? 'next' : 'prev'

  // ANIME.JS SUPERPOWER: Directional springy selection feedback
  const itemIndex = sortedGearItems.value.findIndex((i) => i === item)
  const itemEl = gearItemRefs.value[itemIndex]

  if (itemEl) {
    // Import anime.js dynamically
    const { animate, stagger } = await import('~/anime.esm.js')
    const { timing, staggers, easing } = useAnimations()

    // 1. DIRECTIONALLY-AWARE HYPER-SPRINGY EXPLOSION
    const directionMultiplier = direction === 'next' ? 1 : -1

    animate(itemEl, {
      keyframes: [
        {
          scale: 1,
          rotateZ: 0,
          rotateX: 0,
          rotateY: 0,
          translateX: 0,
          translateZ: 0,
          filter: 'brightness(1) contrast(1) saturate(1)'
        },
        {
          scale: 1.4,
          rotateZ: 12 * directionMultiplier,
          rotateX: -18,
          rotateY: 15 * directionMultiplier,
          translateX: 8 * directionMultiplier,
          translateZ: 60,
          filter: 'brightness(1.5) contrast(1.4) saturate(1.3)'
        },
        {
          scale: 0.8,
          rotateZ: -6 * directionMultiplier,
          rotateX: 10,
          rotateY: -8 * directionMultiplier,
          translateX: -3 * directionMultiplier,
          translateZ: -20,
          filter: 'brightness(1.2) contrast(1.1) saturate(1.1)'
        },
        {
          scale: 1.15,
          rotateZ: 3 * directionMultiplier,
          rotateX: -4,
          rotateY: 3 * directionMultiplier,
          translateX: 2 * directionMultiplier,
          translateZ: 12,
          filter: 'brightness(1.3) contrast(1.2) saturate(1.1)'
        },
        {
          scale: 1.08,
          rotateZ: 0,
          rotateX: 0,
          rotateY: 0,
          translateX: 0,
          translateZ: 8,
          filter: 'brightness(1.18) contrast(1.1) saturate(1.03)'
        }
      ],
      duration: timing.slow, // 800ms - standardized
      ease: easing.bounce
    })

    // 2. DIRECTIONAL RIPPLE SHOCKWAVE EFFECT
    const allItems = gearItemRefs.value.filter((el, i) => i !== itemIndex)
    if (allItems.length) {
      // Create wave pattern that spreads outward from selection
      const createDirectionalStagger = () => {
        return allItems.map((_, i) => {
          const actualIndex = i >= itemIndex ? i + 1 : i // Account for filtered item
          const distance = Math.abs(actualIndex - itemIndex)
          const isInDirection =
            direction === 'next'
              ? actualIndex > itemIndex
              : actualIndex < itemIndex

          // Items in direction of navigation get less delay, others get more
          const baseDelay = distance * staggers.tight // 50ms - standardized stagger
          const directionBonus = isInDirection ? -10 : 20

          return Math.max(0, baseDelay + directionBonus)
        })
      }

      animate(allItems, {
        keyframes: [
          {
            scale: 1,
            opacity: 1,
            rotateZ: 0,
            translateX: 0,
            filter: 'brightness(1) blur(0px)'
          },
          {
            scale: 0.85,
            opacity: 0.4,
            rotateZ: -3 * directionMultiplier,
            translateX: -2 * directionMultiplier,
            filter: 'brightness(0.6) blur(0.8px)'
          },
          {
            scale: 1.05,
            opacity: 0.75,
            rotateZ: 2 * directionMultiplier,
            translateX: 1 * directionMultiplier,
            filter: 'brightness(1.15) blur(0.3px)'
          },
          {
            scale: 1,
            opacity: 1,
            rotateZ: 0,
            translateX: 0,
            filter: 'brightness(1) blur(0px)'
          }
        ],
        duration: timing.normal, // 400ms - standardized
        delay: stagger(createDirectionalStagger()),
        ease: easing.dramatic
      })
    }

    // 3. CONTAINER RESONANCE EFFECT
    if (containerRef.value) {
      animate(containerRef.value, {
        keyframes: [
          { scale: 1, filter: 'brightness(1)' },
          { scale: 1.002, filter: 'brightness(1.03)' },
          { scale: 1, filter: 'brightness(1)' }
        ],
        duration: timing.fast, // 200ms - standardized
        ease: easing.snappy
      })
    }
  }

  // Navigate almost immediately for simultaneous transitions
  // Navigate with standardized timing
  setTimeout(() => {
    navigateTo(`/gear/${slug}`)
  }, timing.fast / 2) // 100ms - half of fast duration
}

// Keyboard navigation
const navigateDirection = (direction) => {
  if (!sortedGearItems.value.length) return

  const currentIndex = sortedGearItems.value.findIndex((item) =>
    isCurrentItem(item)
  )
  if (currentIndex === -1) return

  let nextIndex
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % sortedGearItems.value.length
  } else {
    nextIndex =
      currentIndex - 1 < 0 ? sortedGearItems.value.length - 1 : currentIndex - 1
  }

  const nextItem = sortedGearItems.value[nextIndex]
  navigateToGear(nextItem)
}

const handleKeydown = (e) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    navigateDirection('next')
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    navigateDirection('prev')
  }
}

// Computed properties
const sortedGearItems = computed(() => {
  if (!allGearItems.value) return []
  return [...allGearItems.value]
    // Don't filter out items with no weight - show them all
    .sort((a, b) => {
      const weightA = getItemWeight(a) || 0
      const weightB = getItemWeight(b) || 0
      return weightA - weightB
    })
})

// Setup gear item animations using anime.js
const setupItemAnimations = async () => {
  if (process.server || !gearItemRefs.value?.length) return
  
  await nextTick()

  // Add hover interactions with anime.js
  gearItemRefs.value.forEach((itemEl) => {
    if (!itemEl) return

    itemEl.addEventListener('mouseenter', () => {
      if (!itemEl.classList.contains('gear-item-active')) {
        animate(itemEl, {
          scale: 1.05,
          filter: ['brightness(1)', 'brightness(1.1)'],
          duration: timing.micro,
          ease: easing.decelerate
        })
      }
    })

    itemEl.addEventListener('mouseleave', () => {
      if (!itemEl.classList.contains('gear-item-active')) {
        animate(itemEl, {
          scale: 1,
          filter: ['brightness(1.1)', 'brightness(1)'],
          duration: timing.micro,
          ease: easing.standard
        })
      }
    })
  })
}

// Animate current item selection using motion tokens
const animateCurrentSelection = () => {
  if (process.server) return

  const { timing: _timing, easing: _easing } = useAnimations()

  // Reset all items to normal state
  itemAnimatables.value.forEach((animatable, index) => {
    const itemEl = gearItemRefs.value[index]
    if (itemEl && !itemEl.classList.contains('gear-item-active')) {
      animatable.animate({
        scale: 1,
        filter: 'brightness(1) contrast(1)',
        boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
      })
    }
  })

  // Highlight current item
  const currentIndex = sortedGearItems.value.findIndex((item) =>
    isCurrentItem(item)
  )
  if (currentIndex !== -1 && itemAnimatables.value.has(currentIndex)) {
    const currentAnimatable = itemAnimatables.value.get(currentIndex)
    currentAnimatable.animate({
      scale: 1.08,
      filter: 'brightness(1.15) contrast(1.1)',
      boxShadow: '0 0 12px rgba(0, 0, 0, 0.2)'
    })
  }
}

// Initial reveal animation using motion tokens
const animateInitialReveal = async () => {
  if (process.server || hasAnimated.value) return

  const { timing: _timing, easing: _easing } = useAnimations()
  await nextTick()

  // Wait for gear items to be available - DISABLED setTimeout, let it fail gracefully instead
  if (!gearItemRefs.value?.length) {
    // setTimeout(animateInitialReveal, 100)
    return
  }

  hasAnimated.value = true

  // Stage 1: Container slides up
  if (containerRef.value) {
    criticalHighlight(containerRef.value, {
      duration: timing.slow, // 800ms - standardized
      easing: easing.bounce
    })
  }

  // Stage 2: Grid reveal of gear items
  setTimeout(() => {
    if (gearItemRefs.value?.length) {
      // Calculate grid dimensions for horizontal layout
      const cols = Math.min(gearItemRefs.value.length, 8) // Max 8 items visible
      const _rows = Math.ceil(gearItemRefs.value.length / cols)

      gridDataReveal(gearItemRefs.value, { cols, rows: 1 }) // Single row for horizontal layout
    }
  }, 300)

  // Stage 3: Setup interactions after reveal
  setTimeout(() => {
    setupItemAnimations()
    animateCurrentSelection()
  }, 800)
}

// Watch for changes in current slug to update selection
watch(
  () => props.currentSlug,
  () => {
    if (hasAnimated.value && itemAnimatables.value.size > 0) {
      animateCurrentSelection()
    }
  },
  { flush: 'post' }
)

// Watch for gear items loading
watch(
  sortedGearItems,
  () => {
    if (sortedGearItems.value?.length && !hasAnimated.value) {
      nextTick(() => {
        animateInitialReveal()
      })
    }
  },
  { immediate: true }
)

// Event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // Trigger initial animation if items are already loaded
  if (sortedGearItems.value?.length) {
    nextTick(() => {
      animateInitialReveal()
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)

  // Clean up animatables
  itemAnimatables.value.clear()
})
</script>

<style scoped>
.scrollbar-hide {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Gear item animations */
.gear-item {
  will-change: transform, opacity, filter;
  backface-visibility: hidden;
  /* Start hidden for grid reveal animation */
  opacity: 0;
  transform: scale(0.9) translateY(8px);
  filter: blur(1px) brightness(0.6);
}

/* Active item styling */
.gear-item-active {
  position: relative;
}

.gear-item-active::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  pointer-events: none;
  animation: activeGlow 2s ease-in-out infinite;
}

@keyframes activeGlow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.02);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .gear-item {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }

  .gear-item-active::before {
    animation: none;
  }
}
</style>
