<template>
  <div class="leading-tight font-mono">
    <div class="flex">
      <div class="w-4 text-zinc-400">+</div>
      <p :key="value" class="tabular-nums font-mono flex-1" :class="[
        size === 'large' && 'text-[5rem] leading-[0.9]',
        size === 'medium' && 'text-4xl leading-[0.9]',
        size === 'small' && 'text-3xl leading-[0.95]',
      ]">
        {{ formattedValue }}
      </p>
    </div>
    <div class="border-b border-dotted border-zinc-300 dark:border-zinc-700 py-1">
      <h3 class="text-sm tracking-wider text-zinc-500 uppercase font-mono">{{ label }}</h3>
      <p v-if="details" class="text-xs text-zinc-500 tracking-wide font-mono">
        {{ details }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { format } from 'd3-format'

interface Props {
  value: number | string
  label: string
  details?: string
  size?: 'small' | 'medium' | 'large'
  // Format options
  abbreviateOnMobile?: boolean
  precision?: number
  format?: 'number' | 'percent' | 'currency' | 'smart'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'large',
  abbreviateOnMobile: true,
  precision: 1,
  format: 'smart'
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// Format functions
const formatLarge = format(',.0f')
const formatCompact = format('.2~s')
const formatPercent = format('.1%')
const formatCurrency = format('$,.0f')

// Refined number formatting with better edge cases
const formattedValue = computed(() => {
  if (typeof props.value !== 'number') return props.value
  const val = props.value

  // Handle special cases
  if (val === 0) return '0'
  if (Number.isNaN(val)) return '—'
  if (!Number.isFinite(val)) return '∞'

  // Format based on type and size
  if (props.format === 'percent') {
    return formatPercent(val)
  }

  if (props.format === 'currency') {
    return formatCurrency(val)
  }

  // Smart formatting with mobile abbreviations
  if (isMobile.value && props.abbreviateOnMobile && val >= 1000) {
    return formatCompact(val)
  }

  return formatLarge(val)
})
</script>

<style scoped>
/* Monospace typography */
p {
  font-feature-settings: "tnum", "zero";
}
</style>