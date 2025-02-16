<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
    <!-- GitHub Contributions -->
    <div v-if="stats.github?.stats">
      <IndividualStat :value="stats.github.stats.totalContributions" size="medium" label="CONTRIBUTIONS"
        :details="`${formatNumber(stats.github.stats.totalRepos)} REPOS`" />
    </div>
    <!-- Total Photos -->
    <div v-if="stats.photos?.stats">
      <IndividualStat :value="stats.photos.stats.totalPhotos" size="medium" label="PHOTOS"
        :details="`${formatNumber(stats.photos.stats.photosThisMonth)} THIS MONTH`" />
    </div>
    <!-- 
    <div v-if="stats.leetcode?.submissionStats">
      <IndividualStat :value="totalLeetCodeSolved" size="medium" label="LEETCODE"
        :details="`${stats.leetcode.submissionStats.easy.count} EASY · ${stats.leetcode.submissionStats.medium.count} MED · ${stats.leetcode.submissionStats.hard.count} HARD`" />
    </div>
    -->
    <!-- Chess Rating -->
    <!-- <div v-if="stats.chess && chessRating > 400">
      <IndividualStat :value="chessRating" size="medium" label="CHESS RATING" :details="`${chessWinRate}% WIN RATE`" />
    </div>
    -->
    <!-- Health Stats -->
    <!--    <div v-if="stats.health?.today">
      <IndividualStat :value="stats.health.today.steps" size="medium" label="STEPS TODAY"
        :details="`${formatNumber(stats.health.today.exerciseMinutes)} ACTIVE MINS`" />
    </div>
     -->

    <!-- Blog Stats -->
    <div v-if="blogStats">
      <IndividualStat :value="blogStats.totalPosts" size="medium" label="BLOG POSTS"
        :details="`${postsThisMonth} THIS MONTH`" />
    </div>

    <!-- Total Words -->
    <div v-if="blogStats">
      <IndividualStat :value="blogStats.totalWords" size="medium" label="TOTAL WORDS"
        :details="`${formatNumber(averageWordsPerPost)} AVG/POST`" />
    </div>

    <!-- MonkeyType WPM -->
    <!--     <div v-if="stats.monkeyType?.typingStats">
      <IndividualStat :value="stats.monkeyType.typingStats.bestWPM" size="medium" label="BEST WPM"
        :details="`${formatNumber(stats.monkeyType.typingStats.testsCompleted)} TESTS`" />
    </div> -->


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