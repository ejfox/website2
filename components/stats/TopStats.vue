<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
    <!-- GitHub Contributions -->
    <div v-if="stats.github?.stats">
      <IndividualStat :value="stats.github.stats.totalContributions" size="medium" label="TOTAL GH CONTRIBUTIONS"
        :details="`${formatNumber(stats.github.stats.totalRepos)} REPOS`" />
    </div>

    <!-- Blog Stats -->
    <div v-if="blogStats">
      <IndividualStat :value="blogStats.totalPosts" size="medium" label="TOTAL BLOG POSTS"
        :details="`${postsThisMonth} THIS MONTH`" />
    </div>
    <div v-else class="flex flex-col justify-center items-center h-24 bg-zinc-900/30 border border-zinc-800/50 p-4">
      <div class="text-zinc-400 text-sm font-mono animate-pulse">Loading blog stats...</div>
    </div>

    <!-- Total Words -->
    <div v-if="blogStats">
      <IndividualStat :value="blogStats.totalWords" size="medium" label="TOTAL WORDS PUBLISHED"
        :details="`${formatNumber(averageWordsPerPost)} AVG/POST`" />
    </div>
    <div v-else class="flex flex-col justify-center items-center h-24 bg-zinc-900/30 border border-zinc-800/50 p-4">
      <div class="text-zinc-400 text-sm font-mono animate-pulse">Loading word counts...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

const props = defineProps<{
  stats: StatsResponse
  blogStats?: BlogStats
}>()

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

const totalLeetCodeSolved = computed(() => {
  if (!props.stats.leetcode?.submissionStats) return 0
  const { easy, medium, hard } = props.stats.leetcode.submissionStats
  return easy.count + medium.count + hard.count
})

const chessRating = computed(() => {
  if (!props.stats.chess) return 0
  return typeof props.stats.chess.currentRating === 'object'
    ? props.stats.chess.currentRating.blitz
    : props.stats.chess.currentRating
})

const chessWinRate = computed(() => {
  if (!props.stats.chess) return 0
  return typeof props.stats.chess.winRate === 'object'
    ? props.stats.chess.winRate.overall
    : props.stats.chess.winRate
})

const averageWordsPerPost = computed(() => {
  if (!props.blogStats) return 0
  return Math.round(props.blogStats.averageWords)
})

const postsThisMonth = computed(() => {
  if (!props.blogStats?.lastPost) return 0
  const lastPostDate = new Date(props.blogStats.lastPost)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return props.blogStats.totalPosts > 0 && lastPostDate > oneMonthAgo ? 1 : 0
})
</script>
