<!--
  @file StatRow.vue
  @description Simple stat row with label and formatted value
  @props label: string - Stat label
  @props value: string | number - Stat value
  @props format: string - Format type (number, percentage, decimal, raw)
  @props decimals: number - Decimal places (default: 0)
-->
<template>
  <div class="flex-between">
    <div class="text-muted">{{ label }}</div>
    <div class="text-primary tabular">
      <slot>{{ formattedValue }}</slot>
    </div>
  </div>
</template>

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

const { formatNumber, formatDecimal, formatPercentage } = useNumberFormat()

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
