<template>
  <div
    class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6"
  >
    <!-- GitHub Contributions -->
    <div
      v-if="stats.github?.stats"
      class="top-stat-card"
      :style="{ '--stat-index': 0 }"
    >
      <div class="stat-value">
        <AnimatedNumber
          :value="stats.github.stats.totalContributions"
          format="commas"
          :duration="1600"
          priority="primary"
          :decimals="0"
        />
      </div>
      <div class="stat-label">GH COMMITS</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="stats.github.stats.totalRepos"
          format="default"
          :duration="800"
          priority="secondary"
          :decimals="0"
        />
        REPOS
      </div>
    </div>

    <!-- Blog Stats -->
    <div v-if="blogStats" class="top-stat-card" :style="{ '--stat-index': 1 }">
      <div class="stat-value">
        <AnimatedNumber
          :value="blogStats.totalPosts"
          format="default"
          :duration="800"
          priority="primary"
          :decimals="0"
        />
      </div>
      <div class="stat-label">BLOG POSTS</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="postsThisMonth"
          format="default"
          :duration="1600"
          priority="secondary"
          :decimals="0"
        />
        THIS MONTH
      </div>
    </div>
    <div
      v-else
      class="top-stat-card flex h-24 flex-col items-center justify-center p-4"
    >
      <StatsDataState message="Loading blog stats..." type="loading" />
    </div>

    <!-- Total Words -->
    <div v-if="blogStats" class="top-stat-card" :style="{ '--stat-index': 2 }">
      <div class="stat-value">
        <AnimatedNumber
          :value="blogStats.totalWords"
          format="commas"
          :duration="1600"
          priority="primary"
          :decimals="0"
        />
      </div>
      <div class="stat-label">WORDS</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="averageWordsPerPost"
          format="commas"
          :duration="1600"
          priority="secondary"
          :decimals="0"
        />
        AVG/POST
      </div>
    </div>
    <div
      v-else
      class="top-stat-card flex h-24 flex-col items-center justify-center p-4"
    >
      <StatsDataState message="Loading word counts..." type="loading" />
    </div>

    <!-- LeetCode Problems -->
    <div
      v-if="stats.leetcode?.submissionStats"
      class="top-stat-card"
      :style="{ '--stat-index': 3 }"
    >
      <div class="stat-value">
        <AnimatedNumber
          :value="totalLeetCodeSolved"
          format="default"
          :duration="1600"
          priority="primary"
          :decimals="0"
        />
      </div>
      <div class="stat-label">LEETCODE</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="stats.leetcode.submissionStats.hard.count"
          format="default"
          :duration="800"
          priority="tertiary"
        />H
        <AnimatedNumber
          :value="stats.leetcode.submissionStats.medium.count"
          format="default"
          :duration="800"
          priority="tertiary"
        />M
        <AnimatedNumber
          :value="stats.leetcode.submissionStats.easy.count"
          format="default"
          :duration="800"
          priority="tertiary"
        />E
      </div>
    </div>

    <!-- Chess Rating -->
    <div
      v-if="stats.chess"
      class="top-stat-card"
      :style="{ '--stat-index': 4 }"
    >
      <div class="stat-value">
        <AnimatedNumber
          :value="chessRating"
          format="commas"
          :duration="1600"
          priority="primary"
          :decimals="0"
        />
      </div>
      <div class="stat-label">CHESS</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="Math.round(chessWinRate)"
          format="default"
          :duration="1600"
          priority="secondary"
          :decimals="0"
        />% WIN
      </div>
    </div>

    <!-- Typing Speed -->
    <div
      v-if="stats.monkeyType?.typingStats"
      class="top-stat-card"
      :style="{ '--stat-index': 5 }"
    >
      <div class="stat-value">
        <AnimatedNumber
          :value="
            Math.round(
              (stats.monkeyType.typingStats as any).averageWpm ||
                (stats.monkeyType.typingStats as any).averageWPM ||
                0
            )
          "
          format="default"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="stat-label">AVG WPM</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="
            Math.round(
              (stats.monkeyType.typingStats as any).averageAccuracy || 0
            )
          "
          format="default"
          :duration="800"
          priority="secondary"
        />% ACC
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsDataState from './StatsDataState.vue'
import type { StatsResponse } from '~/composables/useStats'
import { useNumberFormat } from '~/composables/useNumberFormat'
// NUKED BY BLOODHOUND: import { animate, stagger as _stagger, onScroll as _onScroll } from '~/anime.esm.js'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
  postsThisMonth?: number
}

const props = defineProps<{
  stats: StatsResponse
  blogStats?: BlogStats
}>()

const { formatNumber: _formatNumber } = useNumberFormat()
// DELETED: All animation references - BROKEN IMPORTS

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

// DELETED: Animation refs - no longer needed
// const topStatsRef = ref<HTMLElement | null>(null)

// DELETED: All broken animation code causing 53/100 performance score
// BLOODHOUND OBLITERATED: 800, stagger(), /* staggers. - DELETED */normal - ALL UNDEFINED!
// onMounted(() => {
// ALL ANIMATION CODE DELETED - BROKEN IMPORTS
// })
</script>

<style scoped>
/* Subtle top stats card styling - with anime.js custom properties */
.top-stat-card {
  @apply text-center p-4;
  --card-glow: 0%;
  background: radial-gradient(
    circle at center,
    rgba(156, 163, 175, var(--card-glow)) 0%,
    transparent 70%
  );
  transform-style: preserve-3d;
}
</style>
