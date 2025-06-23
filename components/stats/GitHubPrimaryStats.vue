<template>
  <IndividualStat
    :value="totalCommits"
    size="large"
    label="GITHUB COMMITS"
    :details="`${stats.stats.totalRepos} REPOS · ${stats.stats.followers || 0} FOLLOWERS`"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'

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