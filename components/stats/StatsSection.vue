<template>
  <section :id="id" class="stats-section space-y-8 group">
    <h2 class="stats-section-title-hover">
      {{ title }}
    </h2>
    <div>
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
// from '~/composables/useAnimations'

defineProps<{
  title: string
  id?: string
}>()

// const sectionRef = ref<HTMLElement | null>(null)
// const titleRef = ref<HTMLElement | null>(null)
// const contentRef = ref<HTMLElement | null>(null)

// onMounted(() => {
// setupScrollAnimations() - DELETED
// })
</script>

<style scoped>
.stats-section-title {
  @apply text-xs tracking-[0.2em] font-mono text-zinc-500;
}

/* Skip deep selectors altogether - adjust styles directly in each component */
</style>
