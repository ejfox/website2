<template>
  <div class="space-y-4">
    <Transition name="fade" mode="out-in">
      <p :key="value" class="tabular-nums tracking-tight font-fjalla" :class="[
        size === 'large' && 'text-[8rem] leading-[0.85]',
        size === 'medium' && 'text-6xl leading-[0.9]',
        size === 'small' && 'text-4xl leading-[0.95]',
      ]">
        {{ formattedValue }}
      </p>
    </Transition>
    <div class="space-y-2">
      <h3 class="text-xs tracking-[0.2em] text-gray-500 font-light uppercase">{{ label }}</h3>
      <p v-if="details" class="text-[0.65rem] text-gray-400 tracking-wider leading-relaxed max-w-xs font-sans">
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
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Tufte-inspired typography */
p {
  font-feature-settings: "tnum", "zero";
}

/* Ensure Fjalla One is used for numbers */
.font-fjalla {
  font-family: 'Fjalla One', sans-serif !important;
}
</style>