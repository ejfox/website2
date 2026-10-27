<!--
  @file AnimatedNumber.vue
  @description A d3-format'ed number (commas, %, $, SI) in a <span>. Renders
    the final value on first paint (SSR-safe, no count-up on load); only a later
    change to `value` animates, over a fixed 600ms ease-out from the old value.
    Used across components/stats/* via explicit import (also auto-imports as
    <UiAnimatedNumber>).
  @props value: number - the number to display
  @props format: 'default' | 'commas' | 'compact' | 'percent' | 'currency' | 'decimal'
  @props decimals: number - decimal places (default 0; ignored by 'compact')
  @props class, style - forwarded to the span
  @props debug: boolean - turns on aria-live="polite"
  Accepted but currently unused by the code: startValue, duration, ease,
  delay, epic, priority (callers still pass duration/priority/delay).
-->
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
  debug: false,
})

const displayValue = ref(props.value) // Show final value immediately

const numberRef = ref<HTMLElement | null>(null)

/**
 * Number formatter factory - D3-powered for data visualization
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

onMounted(() => {
  displayValue.value = props.value
})

// When the value changes after mount (e.g. /stats' live refresh), count to
// it instead of snapping. Reduced motion snaps. SSR and hydration are
// untouched: the first render is always the final value.
let frame = 0
watch(
  () => props.value,
  (to, from) => {
    cancelAnimationFrame(frame)
    const start = Number(from)
    const end = Number(to)
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start === end ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      displayValue.value = to
      return
    }
    const t0 = performance.now()
    const DURATION = 600
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION)
      const eased = 1 - (1 - t) ** 3 // ease-out cubic
      displayValue.value = start + (end - start) * eased
      if (t < 1) frame = requestAnimationFrame(step)
      else displayValue.value = end
    }
    frame = requestAnimationFrame(step)
  }
)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

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
