<template>
  <div class="github-stats-container">
    <!-- Primary GitHub Stats with AnimatedNumber -->
    <div class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="totalCommits" format="commas" :duration="1600" priority="primary" epic />
      </div>
      <div class="stat-label">
        GITHUB COMMITS
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.stats.totalRepos" format="default" :duration="1600" priority="secondary" /> REPOS · 
        <AnimatedNumber :value="stats.stats.followers || 0" format="default" :duration="800" priority="tertiary" /> FOLLOWERS
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '../AnimatedNumber.vue'

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


const totalCommits = computed(() => {
  return (
    props.stats?.stats?.totalCommits ||
    props.stats?.stats?.totalContributions ||
    0
  )
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