<!--
  @file TopStats.vue
  @description Headline row at the top of /stats (pages/stats.vue): one card
    each for GitHub, blog posts, words, LeetCode, chess and typing. Server-rendered
    with the page, so these numbers are in the first paint. A card only renders
    when its source has data; the two blog cards show a loading state instead.
  @props stats: StatsResponse - full /api/stats payload (composables/useStats.ts)
  @props blogStats?: BlogStats - the page's validBlogStats (posts/words/avg)
-->
<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '../ui/AnimatedNumber.vue'
import StatsDataState from './StatsDataState.vue'
import type { StatsResponse } from '~/composables/useStats'
import { numberFormat } from '~/utils/numberFormat'
import { primaryTimeControl } from '~/utils/chess'

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

const { formatNumber: _formatNumber } = numberFormat()

const totalLeetCodeSolved = computed(() => {
  if (!props.stats.leetcode?.submissionStats) return 0
  const { easy, medium, hard } = props.stats.leetcode.submissionStats
  return easy.count + medium.count + hard.count
})

// Same time control the chess section leads with (blitz unless absent)
const chessControl = computed(() => primaryTimeControl(props.stats.chess))

const chessRating = computed(() => {
  if (!props.stats.chess) return 0
  const ratings = props.stats.chess.currentRating
  if (typeof ratings !== 'object') return ratings
  return chessControl.value ? ratings[chessControl.value] : 0
})

const chessWinRate = computed(() => {
  if (!props.stats.chess) return 0
  const rates = props.stats.chess.winRate
  if (typeof rates !== 'object') return rates
  // win rate of the rated control shown above it, not a cross-control blend
  return chessControl.value ? rates[chessControl.value] : rates.overall
})

const typingAccuracy = computed(() =>
  Math.round((props.stats.monkeyType?.typingStats as any)?.averageAccuracy || 0)
)

const averageWordsPerPost = computed(() => {
  if (!props.blogStats) return 0
  return Math.round(props.blogStats.averageWords)
})

const postsThisMonth = computed(() => {
  return props.blogStats?.postsThisMonth || 0
})
</script>

<template>
  <div class="flex flex-wrap justify-center sm:justify-between gap-2">
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
        <HandDrawnMark>
          <AnimatedNumber
            :value="blogStats.totalWords"
            format="commas"
            :duration="1600"
            priority="primary"
            :decimals="0"
          />
        </HandDrawnMark>
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
      <div class="stat-details whitespace-nowrap">
        {{ stats.leetcode.submissionStats.hard.count }}H ·
        {{ stats.leetcode.submissionStats.medium.count }}M ·
        {{ stats.leetcode.submissionStats.easy.count }}E
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
      <div class="stat-label">
        {{ chessControl ? `CHESS · ${chessControl}` : 'CHESS' }}
      </div>
      <div class="stat-details">
        <AnimatedNumber
          :value="Math.round(chessWinRate)"
          format="default"
          :duration="1600"
          priority="secondary"
          :decimals="0"
        />
        % WIN
      </div>
    </div>

    <!-- Typing Speed -->
    <div
      v-if="stats.monkeyType?.typingStats"
      class="top-stat-card"
      :style="{ '--stat-index': 5 }"
    >
      <!-- server/api/monkeytype.get.ts emits averageWpm; averageWPM is a
           fallback for the older casing -->
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
      <div v-if="typingAccuracy > 0" class="stat-details">
        <AnimatedNumber
          :value="typingAccuracy"
          format="default"
          :duration="800"
          priority="secondary"
        />
        % ACC
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-stat-card {
  @apply text-center p-4 flex-1;
  min-width: 100px;
  /* at 0% the radial glow is invisible; nothing in the repo changes it */
  --card-glow: 0%;
  background: radial-gradient(
    circle at center,
    rgba(156, 163, 175, var(--card-glow)) 0%,
    transparent 70%
  );
  transform-style: preserve-3d;
}
</style>
