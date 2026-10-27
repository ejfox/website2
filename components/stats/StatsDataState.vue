<!--
  @file StatsDataState.vue
  @description One-line mono placeholder for a stats block with no data
    ("DATA_UNAVAILABLE", "LOADING_DATA...", "DATA_ERROR"). Used across the
    components/stats/* sections and pages/stats.vue.
  @props message: string - Custom text; overrides `type` unless left at the
    default 'DATA_UNAVAILABLE'
  @props type: 'unavailable' | 'loading' | 'error' (default: unavailable)
-->
<script setup lang="ts">
interface Props {
  message?: string
  type?: 'unavailable' | 'loading' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  message: 'DATA_UNAVAILABLE',
  type: 'unavailable',
})

const computedMessage = computed(() => {
  if (props.message !== 'DATA_UNAVAILABLE') {
    return props.message
  }

  switch (props.type) {
    case 'loading':
      return 'LOADING_DATA...'
    case 'error':
      return 'DATA_ERROR'
    default:
      return 'DATA_UNAVAILABLE'
  }
})
</script>

<template>
  <div class="data-unavailable">
    {{ computedMessage }}
  </div>
</template>

<style scoped>
.data-unavailable {
  @apply text-sm text-zinc-500 dark:text-zinc-400 font-mono;
}
</style>
