<!-- AnimatedNumber: d3-powered counter with priority staggering -->
<template>
  <span 
    ref="numberRef" 
    :class="props.class"
    :style="props.style"
    :aria-live="debug ? 'polite' : 'off'"
  >
    {{ formatter(displayValue) }}
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { format as d3Format } from 'd3-format'
// NUKED: Animation import removed by bloodhound
// import { useAnimations } from '~/composables/useAnimations'

interface Props {
  value: number
  startValue?: number
  duration?: number
  ease?: string
  delay?: number
  format?: 'default' | 'commas' | 'compact' | 'percent' | 'currency' | 'decimal'
  decimals?: number
  epic?: boolean
  priority?: 'primary' | 'secondary' | 'tertiary'
  class?: string
  style?: string | Record<string, any>
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  startValue: 0,
  duration: 500,
  ease: 'cubicBezier(0.4, 0.0, 0.2, 1)',
  delay: 0,
  format: 'default',
  decimals: 1,
  epic: false,
  priority: 'secondary',
  class: '',
  style: '',
  debug: false
})

// NUKED: Animation composable usage obliterated
// const { animate } = // DELETED: useAnimations()
const displayValue = ref(props.value) // Show final value immediately

/**
 * Priority-based stagger delays for visual hierarchy
 * 
 * PERFORMANCE: Computed once, cached until priority changes
 * Creates clear information hierarchy in number reveals
 */
const staggeredDelay = computed(() => {
  const priorityDelays = {
    primary: 0,        // Most important numbers show first
    secondary: 100,    // Standard delay for secondary data
    tertiary: 200      // Least important, longest delay
  } as const
  return props.delay + priorityDelays[props.priority]
})

// Component refs
const numberRef = ref<HTMLElement | null>(null)
// DELETED: duplicate displayValue - already defined on line 36

/**
 * Number formatter factory - D3-powered for data visualization
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses d3-format for consistent data viz formatting
 * - Computed once and cached
 * - Specialized formatters for different data types
 * 
 * D3 FORMAT STRINGS:
 * - ',' = thousands separator
 * - '.2f' = 2 decimal places
 * - '.0%' = percentage
 * - '$,.0f' = currency
 * - '.1s' = SI prefix (1.2k, 3.4M)
 * 
 * EDITING: Add new d3 format strings here
 */
const formatter = computed(() => {
  switch (props.format) {
    case 'commas':
      // Native thousands separator - lightweight
      return (num: number) => num.toLocaleString()
    
    case 'compact':
      // Native compact notation
      return (num: number) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
        return String(Math.round(num))
      }
    
    case 'percent':
      // Native percentage
      return (num: number) => `${(num * 100).toFixed(props.decimals)}%`
    
    case 'currency':
      // Native currency formatting
      return (num: number) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    
    case 'decimal':
      // Native decimal places
      return (num: number) => num.toFixed(props.decimals)
    
    default:
      // Native integer formatting
      return (num: number) => String(Math.round(num))
  }
})

/**
 * Animation lifecycle - Mount and trigger counter
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Uses setTimeout for stagger delay (non-blocking)
 * - Defers animation until after component mount
 * - Passes formatter function for efficient updates
 */
// NUKED BY BLOODHOUND: All animation code obliterated
// onMounted(() => {
//   // Animation code completely removed - numbers show immediately
// })

// Set final value immediately on mount
onMounted(() => {
  displayValue.value = props.value
})
</script>