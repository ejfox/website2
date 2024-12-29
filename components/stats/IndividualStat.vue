<template>
  <div class="space-y-3">
    <p class="tabular-nums tracking-tight font-fjalla" :class="[
      size === 'large' && 'text-[7.8rem] leading-none',
      size === 'medium' && 'text-6xl leading-tight',
      size === 'small' && 'text-4xl leading-snug',
    ]">
      {{ formattedValue }}
    </p>
    <div class="h-px bg-gray-500/20" :class="[
      size === 'large' && 'w-16',
      size === 'medium' && 'w-14',
      size === 'small' && 'w-12',
    ]"></div>
    <h3 class="text-sm tracking-wider text-gray-500">{{ label }}</h3>
    <p v-if="details" class="text-xs text-gray-400 tracking-wider">
      {{ details }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: number | string
  label: string
  details?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'large'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return new Intl.NumberFormat().format(props.value)
  }
  return props.value
})
</script>