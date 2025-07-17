<template>
  <div class="stat-container leading-tight font-mono group relative">
    <div class="flex">
      <p
        :key="value" class="stat-value tabular-nums font-mono flex-1 transition-colors duration-200" :class="[
          size === 'large' && 'text-[5rem] leading-[0.9]',
          size === 'medium' && 'text-4xl leading-[0.9]',
          size === 'small' && 'text-3xl leading-[0.95]',
        ]"
      >
        {{ formattedValue }}
      </p>
    </div>
    <div class="stat-footer border-b border-dotted border-zinc-300 dark:border-zinc-700 py-1 transition-all duration-200">
      <h3 class="text-sm tracking-wider text-zinc-500 uppercase font-mono transition-colors duration-200">
        {{ label }}
      </h3>
      <p v-if="details" class="text-xs text-zinc-500 tracking-wide font-mono transition-colors duration-200">
        {{ details }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  formatType?: 'number' | 'percent' | 'currency' | 'smart'
}

const props = withDefaults(defineProps<Props>(), {
  details: undefined,
  size: 'large',
  abbreviateOnMobile: true,
  precision: 1,
  formatType: 'smart'
})

const { width } = useWindowSize()
const _isMobile = computed(() => width.value < 768)

// Format functions - more compact by default
const formatLarge = format(',.0f')
const formatCompact = format('.1~s')  // More compact: 36k instead of 36.0k
const formatPercent = format('.0%')    // No decimals for percentages
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
</script>

<style scoped>
/* Monospace typography */
p {
  font-feature-settings: "tnum", "zero";
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