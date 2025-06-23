<template>
  <div v-if="stats" class="grid gap-3 sm:gap-4 md:gap-6 auto-fit-columns font-mono overflow-hidden">
    <!-- Primary Stats - Full Width -->
    <div class="col-span-full">
      <GitHubPrimaryStats :stats="stats" />
    </div>

    <!-- Activity Calendar - Full Width (only if lots of data) -->
    <div v-if="showFullCalendar" class="col-span-full">
      <GitHubActivitySection :stats="stats" />
    </div>

    <!-- Commit Types Analysis - Single Column -->
    <div class="github-card">
      <GitHubCommitPatterns :stats="stats" />
    </div>

    <!-- Recent Projects - Single Column -->
    <div class="github-card">
      <GitHubRecentProjects :stats="stats" />
    </div>

    <!-- GitHub Insights - Single Column -->
    <div class="github-card">
      <GitHubInsights :stats="stats" />
    </div>

    <!-- Mini Contributions - Single Column -->
    <div class="github-card">
      <GitHubMiniContributions :stats="stats" />
    </div>
  </div>
  <div v-else class="data-unavailable">GITHUB_DATA_UNAVAILABLE</div>
</template>

<script setup lang="ts">
import GitHubPrimaryStats from './GitHubPrimaryStats.vue'
import GitHubActivitySection from './GitHubActivitySection.vue'
import GitHubCommitPatterns from './GitHubCommitPatterns.vue'
import GitHubRecentProjects from './GitHubRecentProjects.vue'
import GitHubInsights from './GitHubInsights.vue'
import GitHubMiniContributions from './GitHubMiniContributions.vue'
import { computed } from 'vue'

interface GitHubRepo {
  name: string
  url: string
  stars: number
  forks: number
  language: string
  description?: string
}

interface GitHubCommit {
  repository: {
    name: string
    url: string
  }
  message: string
  occurredAt: string
  url: string
  type: string
}

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
  detail?: {
    topRepos?: GitHubRepo[]
    commits?: GitHubCommit[]
    commitTypes?: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  contributions?: number[]
  dates?: string[]
}

const props = defineProps<{
  stats?: GitHubStats | null
}>()

// Only show full calendar if we have commits
const showFullCalendar = computed(() => {
  if (!props.stats?.detail?.commits) return false
  return props.stats.detail.commits.length > 0
})
</script>

<style scoped>
.data-unavailable {
  @apply text-sm text-zinc-500 dark:text-zinc-400 font-mono;
}

.auto-fit-columns {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.github-card {
  @apply break-inside-avoid overflow-hidden min-w-0;
}

/* Responsive breakpoints */
@media (max-width: 640px) {
  .auto-fit-columns {
    grid-template-columns: 1fr;
  }
}
</style>
