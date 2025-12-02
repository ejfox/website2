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
