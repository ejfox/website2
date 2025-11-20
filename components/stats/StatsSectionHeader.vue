<template>
  <h4 class="section-subheader">
    {{ title }}
  </h4>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 border-b pb-1 mb-4;
  @apply border-zinc-200 dark:border-zinc-800/30;
  font-size: 0.65rem;
  line-height: 1rem;
}
</style>
