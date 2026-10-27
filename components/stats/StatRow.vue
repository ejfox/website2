<!--
  @file StatRow.vue
  @description One label → value line. Used by the ?simple text-only mode
    of /stats (pages/stats.vue) inside StatsStatSection. Formats with the
    numberFormat() helpers (utils/numberFormat). A default slot replaces the
    formatted value for custom content.
  @props label: string - Stat label
  @props value: string | number - Stat value (null/undefined renders empty)
  @props format: 'number' | 'percentage' | 'decimal' | 'raw' (default: number)
  @props decimals: number - Decimal places for format="decimal" (default: 0)
-->
<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    default: null,
  },
  format: {
    type: String,
    default: 'number',
    validator: (value) =>
      ['number', 'percentage', 'decimal', 'raw'].includes(value),
  },
  decimals: {
    type: Number,
    default: 0,
  },
})

const { formatNumber, formatDecimal, formatPercentage } = numberFormat()

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) return ''

  switch (props.format) {
    case 'number':
      return formatNumber(props.value)
    case 'percentage':
      return formatPercentage(props.value)
    case 'decimal':
      return formatDecimal(props.decimals)(props.value)
    case 'raw':
    default:
      return props.value
  }
})
</script>

<template>
  <div class="flex-between">
    <div class="text-muted">{{ label }}</div>
    <div class="text-primary tabular">
      <slot>{{ formattedValue }}</slot>
    </div>
  </div>
</template>
