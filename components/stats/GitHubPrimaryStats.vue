<template>
  <div ref="containerRef" class="github-stats-container">
    <!-- Primary GitHub Stats with AnimatedNumber -->
    <div class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="totalCommits" format="commas" :duration="timing.expressive" priority="primary" epic />
      </div>
      <div class="stat-label">
        GITHUB COMMITS
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.stats.totalRepos" format="default" :duration="timing.slower" priority="secondary" /> REPOS · 
        <AnimatedNumber :value="stats.stats.followers || 0" format="default" :duration="timing.slow" priority="tertiary" /> FOLLOWERS
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { animate, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

interface GitHubStats {
  stats: {
    totalCommits?: number
    totalContributions?: number
    totalRepos: number
    totalPRs?: number
    totalIssues?: number
    followers?: number
    following?: number
  }
  detail?: any
  contributions?: number[]
  dates?: string[]
}

const props = defineProps<{
  stats: GitHubStats
}>()

const { timing, easing } = useAnimations()

const totalCommits = computed(() => {
  return (
    props.stats?.stats?.totalCommits ||
    props.stats?.stats?.totalContributions ||
    0
  )
})

// Animation refs
const containerRef = ref<HTMLElement | null>(null)

// Epic GitHub stats scroll-triggered animations
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!containerRef.value) return

    // Epic container entrance with 3D morphing on scroll
    animate(containerRef.value, {
      keyframes: [
        { opacity: 0, scale: 0.6, rotateX: -45, rotateY: 20, filter: 'blur(2px)' },
        { opacity: 0.8, scale: 1.08, rotateX: 8, rotateY: -3, filter: 'blur(0.5px)' },
        { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, filter: 'blur(0px)' }
      ],
      duration: timing.expressive,
      ease: easing.bounce,
      autoplay: onScroll({
        target: containerRef.value,
        onEnter: () => true
      })
    })
  })
}

onMounted(() => {
  setupScrollAnimations()
})
</script>

<style scoped>
.github-stats-container {
  transform-style: preserve-3d;
  perspective: 1200px;
}

/* Individual stat styles - inherits global typography */
.individual-stat-large {
  @apply text-center;
}
</style>