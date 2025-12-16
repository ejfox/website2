<!--
  @file StatsDataState.vue
  @description Data state message component for unavailable/loading/error states
  @props message: string - Custom message (default: DATA_UNAVAILABLE)
  @props type: string - State type: unavailable, loading, error
-->
<template>
  <div class="data-unavailable">
    {{ computedMessage }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
  type?: 'unavailable' | 'loading' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  message: 'DATA_UNAVAILABLE',
  type: 'unavailable',
})

// Generate appropriate message based on type
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

<style scoped>
.data-unavailable {
  @apply text-sm text-zinc-500 dark:text-zinc-400 font-mono;
}
</style>
