<template>
  <section :id="id" class="space-y-6">
    <h2 class="stats-section-title">
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