<template>
  <div
    ref="containerRef"
    class="stat-container leading-tight font-mono group relative"
  >
    <div class="flex">
      <p
        ref="valueRef"
        class="stat-value tabular-nums font-mono flex-1"
        :class="[
          'transition-colors duration-200',
          size === 'large' && 'text-7xl leading-[0.9]',
          size === 'medium' && 'text-4xl leading-[0.9]',
          size === 'small' && 'text-3xl leading-[0.95]'
        ]"
      >
        {{ displayValue }}
      </p>
    </div>
    <div ref="footerRef" class="stat-footer-dotted">
      <h3 ref="labelRef" class="label-mono-sm">
        {{ label }}
      </h3>
      <p
        v-if="details"
        ref="detailsRef"
        class="text-xs text-zinc-500 tracking-wide font-mono"
        :class="['transition-colors duration-200']"
      >
        {{ details }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
// DELETED: Heavy d3-format dependency
// DELETED: All animation references - BROKEN IMPORTS

interface Props {
  value: number | string
  label: string
  details?: string
  size?: 'small' | 'medium' | 'large'
  // Format options
  abbreviateOnMobile?: boolean
  precision?: number
  formatType?: 'number' | 'percent' | 'currency' | 'smart'
}

const props = withDefaults(defineProps<Props>(), {
  details: undefined,
  size: 'large',
  abbreviateOnMobile: true,
  precision: 1,
  formatType: 'smart'
})

// Animation refs
const containerRef = ref<HTMLElement | null>(null)
const valueRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const labelRef = ref<HTMLElement | null>(null)
const detailsRef = ref<HTMLElement | null>(null)

// Animation state
const displayValue = ref(typeof props.value === 'number' ? '0' : props.value)

const { width } = useWindowSize()
const _isMobile = computed(() => width.value < 768)

// Format functions - more compact by default
// DELETED: D3 formatters - using native alternatives
const formatLarge = (num: number) =>
  num.toLocaleString('en-US', { maximumFractionDigits: 0 })
const formatCompact = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(num)
}
const formatPercent = (num: number) => `${Math.round(num * 100)}%`
const formatCurrency = (num: number) =>
  `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

// Refined number formatting with better edge cases
const formattedValue = computed(() => {
  if (typeof props.value !== 'number') return props.value
  const val = props.value

  // Handle special cases
  if (val === 0) return '0'
  if (Number.Number.isNaN(val)) return '—'
  if (!Number.Number.isFinite(val)) return '∞'

  // Format based on type and size
  if (props.formatType === 'percent') {
    return formatPercent(val / 100) // Assuming input is already 0-100
  }

  if (props.formatType === 'currency') {
    return formatCurrency(val)
  }

  // Smart formatting based on the value
  if (props.formatType === 'smart' || props.formatType === 'number') {
    // Keep exact values for smaller numbers
    if (val < 1000) {
      return formatLarge(val)
    }
    // Use K notation for thousands
    if (val < 1000000) {
      return formatCompact(val).toUpperCase() // 66K instead of 66k
    }
    // Use M notation for millions
    return formatCompact(val).toUpperCase() // 1.2M instead of 1.2m
  }

  return formatLarge(val)
})

// Setup metrics animatable for interactive effects - DISABLED
const setupInteractiveEffects = () => {
  // Legacy animation system disabled - needs complete rewrite
  return
}

// Animate value changes - DISABLED
const animateValueChange = () => {
  displayValue.value = formattedValue.value
  return
}

// Helper to format numbers during animation
const _formatNumberForDisplay = (val: number): string => {
  if (typeof val !== 'number' || Number.Number.isNaN(val)) return '0'

  // Use same formatting logic but simplified for animation
  if (val < 1000) return Math.round(val).toString()
  if (val < 1000000) return `${Math.round(val / 1000)}K`
  return `${(val / 1000000).toFixed(1)}M`
}

// Initial reveal animation
const animateInitialReveal = async () => {
  if (import.meta.server) return

  await nextTick()

  // Stage 1: Reveal the container with system scan effect
  if (containerRef.value) {
    // criticalHighlight(containerRef.value, {
    //   duration: 1600, // DELETED - 1600 undefined
    //   easing: 'outElastic(1, .8)'
    // })
  }

  // Stage 2: Animate the value counter
  if (typeof props.value === 'number' && valueRef.value) {
    setTimeout(() => {
      animateValueChange()
    }, 300)
  }

  // Stage 3: Stream in the label and details
  setTimeout(() => {
    if (labelRef.value) {
      // dataStream(labelRef.value, {
      //   duration: 800, // DELETED - 800 undefined
      //   easing: 'cubicBezier(0.4, 0, 0.2, 1)'
      // })
    }

    if (detailsRef.value) {
      setTimeout(() => {
        // dataStream(detailsRef.value, {
        //   duration: 400, // DELETED - 400 undefined
        //   easing: 'cubicBezier(0.4, 0, 0.2, 1)'
        // })
      }, 150)
    }
  }, 600)
}

// Watch for value changes
watch(
  () => props.value,
  () => {
    if (typeof props.value === 'number') {
      animateValueChange()
    } else {
      displayValue.value = formattedValue.value
    }
  }
)

onMounted(() => {
  // Set initial display value
  displayValue.value =
    typeof props.value === 'number' ? '0' : formattedValue.value

  // Setup animations
  setupInteractiveEffects()
  animateInitialReveal()
})
</script>

<style scoped>
/* Monospace typography */
p {
  font-feature-settings: 'tnum', 'zero';
}

/* Subtle hover effect */
.stat-container:hover .stat-value {
  @apply text-zinc-900 dark:text-zinc-100;
}

.stat-container:hover .stat-footer {
  @apply border-zinc-400 dark:border-zinc-600;
}

.stat-container:hover h3,
.stat-container:hover p {
  @apply text-zinc-600 dark:text-zinc-400;
}

/* Smooth number transitions */
.stat-value {
  @apply text-zinc-800 dark:text-zinc-200;
}
</style>
