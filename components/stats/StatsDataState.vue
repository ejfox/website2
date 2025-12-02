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
