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

// NUKED: Animation composable usage obliterated
// const { animate } = useAnimations()
const displayValue = ref(props.value) // Show final value immediately

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
// NUKED: displayValue now shows final value immediately instead of animating

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
      // D3 thousands separator - much better than native
      return d3Format(',')
    
    case 'compact':
      // D3 SI prefix notation (1.2k, 3.4M, 5.6B)
      return d3Format('.1s')
    
    case 'percent':
      // D3 percentage with custom decimal places
      return d3Format(`.${props.decimals}%`)
    
    case 'currency':
      // D3 currency formatting
      return d3Format('$,.0f')
    
    case 'decimal':
      // D3 fixed decimal places
      return d3Format(`.${props.decimals}f`)
    
    default:
      // D3 integer formatting
      return d3Format('.0f')
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