<template>
  <section :id="id" ref="sectionRef" class="stats-section space-y-6 group">
    <h2 ref="titleRef" class="stats-section-title transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
      {{ title }}
    </h2>
    <div ref="contentRef">
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { animate, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

defineProps<{
  title: string
  id?: string
}>()

// Animation refs
const sectionRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const { timing, easing } = useAnimations()

// Epic stats section scroll-triggered animations
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    // Section container slide-in on scroll
    if (sectionRef.value) {
      animate(sectionRef.value, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.96, 1.01, 1],
        filter: ['blur(1px)', 'blur(0px)'],
        duration: timing.value.slow,
        ease: 'outElastic(1, .8)',
        autoplay: onScroll({
          target: sectionRef.value,
          onEnter: () => true
        })
      })
    }
    
    // Title dramatic entrance on scroll
    if (titleRef.value) {
      animate(titleRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.7, skewX: -8, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.1, skewX: 3, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, skewX: 0, filter: 'blur(0px)' }
        ],
        duration: timing.value.dramatic,
        ease: 'outElastic(1, .8)',
        autoplay: onScroll({
          target: titleRef.value,
          onEnter: () => true
        })
      })
    }
    
    // Content reveal on scroll with longer delay
    if (contentRef.value) {
      animate(contentRef.value, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1.02, 1],
        duration: timing.value.dramatic,
        ease: 'cubicBezier(0.2, 0, 0.38, 0.9)',
        autoplay: onScroll({
          target: contentRef.value,
          onEnter: () => true
        })
      })
    }
  })
}

onMounted(() => {
  setupScrollAnimations()
})
</script>

<style scoped>
.stats-section-title {
  @apply text-xs tracking-[0.2em] font-mono text-zinc-500;
}

/* Skip deep selectors altogether - adjust styles directly in each component */
</style>