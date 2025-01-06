<template>
  <div v-if="stats" class="space-y-16">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <!-- Chess Rating -->
      <IndividualStat :value="currentRating" size="large" label="CHESS RATING"
        :details="`${formatNumber(bestRating)} PEAK · ${winRate}% WIN RATE`" />

      <div class="grid grid-cols-2 gap-8">
        <!-- Bullet Rating -->
        <IndividualStat v-if="isNewFormat && (stats.currentRating as NewFormatRatings).bullet > 0"
          :value="(stats.currentRating as NewFormatRatings).bullet" size="medium" label="BULLET RATING"
          :details="`${formatNumber((stats.bestRating as NewFormatRatings).bullet)} PEAK`" />

        <!-- Puzzle Rating -->
        <IndividualStat :value="stats.puzzleStats.rating" size="medium" label="PUZZLE RATING"
          :details="`${formatNumber(stats.puzzleStats.bestRating)} PEAK`" />
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="hasGameStats">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">GAME HISTORY</h4>
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div class="space-y-2">
          <div class="text-2xl font-fjalla tabular-nums">
            {{ formatNumber(gamesPlayed) }}
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            TOTAL GAMES
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-2xl font-fjalla tabular-nums">
            {{ Math.round(overallWinRate) }}%
          </div>
          <div class="text-xs tracking-wider text-gray-500">
            OVERALL WIN RATE
          </div>
        </div>
      </div>

      <!-- Recent Games -->
      <div v-if="stats.recentGames?.length" class="space-y-4">
        <div v-for="game in stats.recentGames" :key="game.id || game.url"
          class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4">
            <div class="w-16 text-xs text-gray-500">
              {{ formatGameDate(game.timestamp) }}
            </div>
            <div class="text-gray-400">
              {{ game.timeControl }}
            </div>
          </div>
          <div class="flex items-center gap-6">
            <span :class="[
              'text-xs uppercase tracking-wider',
              game.result === 'win' ? 'text-green-500' : 'text-red-500'
            ]">
              {{ game.result }}
            </span>
            <span v-if="game.rating" class="text-gray-500 tabular-nums w-12 text-right">
              {{ game.rating }}
              <span v-if="game.ratingDiff && game.ratingDiff !== 0" class="text-xs ml-1" :class="[
                game.ratingDiff > 0 ? 'text-green-500' : 'text-red-500'
              ]">
                {{ game.ratingDiff > 0 ? '+' : '' }}{{ game.ratingDiff }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-gray-400">
    Chess data unavailable
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

interface ChessGame {
  id?: string
  url?: string
  opponent: string
  timeControl: string
  result: 'win' | 'loss' | 'draw'
  timestamp: number
  rating?: number
  ratingDiff?: number
}

interface NewFormatRatings {
  bullet: number
  blitz: number
  rapid: number
}

interface NewFormatWinRate extends NewFormatRatings {
  overall: number
}

interface NewFormatGamesPlayed extends NewFormatRatings {
  total: number
}

interface ChessStats {
  currentRating: number | NewFormatRatings
  bestRating: number | NewFormatRatings
  gamesPlayed: number | NewFormatGamesPlayed
  winRate: number | NewFormatWinRate
  puzzleStats: {
    rating: number
    totalSolved: number
    bestRating: number
  }
  recentGames: ChessGame[]
  lastUpdated: string
}

const props = defineProps<{
  stats?: ChessStats | null
}>()

const isNewFormat = computed(() => {
  return typeof props.stats?.currentRating === 'object'
})

const currentRating = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.currentRating as NewFormatRatings).blitz
    : props.stats.currentRating as number
})

const bestRating = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.bestRating as NewFormatRatings).blitz
    : props.stats.bestRating as number
})

const winRate = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.winRate as NewFormatWinRate).blitz
    : props.stats.winRate as number
})

const gamesPlayed = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.gamesPlayed as NewFormatGamesPlayed).total
    : props.stats.gamesPlayed as number
})

const overallWinRate = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.winRate as NewFormatWinRate).overall
    : props.stats.winRate as number
})

const hasGameStats = computed(() => {
  if (!props.stats) return false
  return gamesPlayed.value > 0
})

const formatGameDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>