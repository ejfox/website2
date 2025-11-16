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
// NUKED BY BLOODHOUND: import { animate, onScroll } from '~/anime.esm.js'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

defineProps<{
  title: string
  id?: string
}>()

// DELETED: Animation refs - no longer needed
// const sectionRef = ref<HTMLElement | null>(null)
// const titleRef = ref<HTMLElement | null>(null)
// const contentRef = ref<HTMLElement | null>(null)

// DELETED: All animation references - BROKEN IMPORTS

// DELETED: setupScrollAnimations() function - ALL ANIMATION IMPORTS BROKEN
// BLOODHOUND OBLITERATED: 800, onScroll() - ALL UNDEFINED!

// DELETED: onMounted animation call - BROKEN FUNCTION
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
