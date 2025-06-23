<template>
  <section :id="id" class="stats-section space-y-6 group">
    <h2 class="stats-section-title transition-colors duration-200 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
      {{ title }}
    </h2>
    <slot></slot>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  id?: string
}>()
</script>

<style scoped>
.stats-section-title {
  @apply text-xs tracking-[0.2em] font-mono text-zinc-500;
}

/* Skip deep selectors altogether - adjust styles directly in each component */
</style>