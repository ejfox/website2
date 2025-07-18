<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
    <!-- GitHub Contributions -->
    <div v-if="stats.github?.stats">
      <IndividualStat
        :value="stats.github.stats.totalContributions" size="medium" label="GH COMMITS"
        :details="`${formatNumber(stats.github.stats.totalRepos)} REPOS`"
      />
    </div>

    <!-- Blog Stats -->
    <div v-if="blogStats">
      <IndividualStat
        :value="blogStats.totalPosts" size="medium" label="BLOG POSTS"
        :details="`${postsThisMonth} THIS MONTH`"
      />
    </div>
    <div v-else class="flex h-24 flex-col items-center justify-center p-4">
      <StatsDataState message="Loading blog stats..." type="loading" />
    </div>

    <!-- Total Words -->
    <div v-if="blogStats">
      <IndividualStat
        :value="blogStats.totalWords" size="medium" label="WORDS"
        :details="`${formatNumber(averageWordsPerPost)} AVG/POST`"
      />
    </div>
    <div v-else class="flex h-24 flex-col items-center justify-center p-4">
      <StatsDataState message="Loading word counts..." type="loading" />
    </div>

    <!-- LeetCode Problems -->
    <div v-if="stats.leetcode?.submissionStats">
      <IndividualStat
        :value="totalLeetCodeSolved" size="medium" label="LEETCODE"
        :details="`${stats.leetcode.submissionStats.hard.count}H ${stats.leetcode.submissionStats.medium.count}M ${stats.leetcode.submissionStats.easy.count}E`"
      />
    </div>

    <!-- Chess Rating -->
    <div v-if="stats.chess">
      <IndividualStat
        :value="chessRating" size="medium" label="CHESS"
        :details="`${Math.round(chessWinRate)}% WIN`"
      />
    </div>

    <!-- Typing Speed -->
    <div v-if="stats.monkeyType?.typingStats">
      <IndividualStat
        :value="Math.round(stats.monkeyType.typingStats.averageWpm || stats.monkeyType.typingStats.averageWPM || 0)" size="medium" label="AVG WPM"
        :details="`${Math.round(stats.monkeyType.typingStats.averageAccuracy || 0)}% ACC`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import StatsDataState from './StatsDataState.vue'
import type { StatsResponse } from '~/composables/useStats'
import { useNumberFormat } from '~/composables/useNumberFormat'

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

const { formatNumber } = useNumberFormat()

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
  // Use the actual postsThisMonth value from blogStats
  return props.blogStats?.postsThisMonth || 0
})
</script>
