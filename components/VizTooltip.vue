<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  position: { left: string; top: string }
  title?: string
  description?: string
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'max-w-xs',
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" class="viz-tooltip" :class="maxWidth" :style="position">
      <!-- Title -->
      <h3
        v-if="title"
        class="font-mono text-base font-medium mb-2 text-zinc-900 dark:text-zinc-100"
      >
        {{ title }}
      </h3>

      <!-- Description -->
      <p
        v-if="description"
        class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2"
      >
        {{ description }}
      </p>

      <!-- Custom content slot -->
      <div
        class="tooltip-content text-sm font-mono text-zinc-600 dark:text-zinc-400"
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.viz-tooltip {
  @apply absolute p-3;
  @apply bg-white dark:bg-zinc-900;
  @apply border border-zinc-200 dark:border-zinc-800 rounded-lg;
  @apply pointer-events-none;
  @apply shadow-xl;
  @apply z-50;
  transform: translateX(-50%); /* Center horizontally on cursor */
}
</style>
