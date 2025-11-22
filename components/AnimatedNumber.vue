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
import { format as d3Format } from 'd3-format'

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
  style?: string | Record<string, string | number>
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  startValue: 0,
  duration: 500,
  ease: 'cubicBezier(0.4, 0.0, 0.2, 1)',
  delay: 0,
  format: 'default',
  decimals: 0,
  epic: false,
  priority: 'secondary',
  class: '',
  style: '',
  debug: false
})

const displayValue = ref(props.value) // Show final value immediately

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
function formatValue(format: string, decimals: number) {
  switch (format) {
    case 'commas':
      return d3Format(`,.${decimals}f`)
    case 'compact':
      return d3Format(`~s`) // SI prefix
    case 'percent':
      return d3Format(`.${decimals}%`)
    case 'currency':
      return d3Format(`$,.${decimals}f`)
    case 'decimal':
      return d3Format(`.${decimals}f`)
    default:
      return d3Format(`,.${decimals}f`) // Default to commas
  }
}
const formatter = computed(() => {
  return formatValue(props.format, props.decimals)
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
