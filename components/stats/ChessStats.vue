<template>
  <div v-if="stats" class="space-y-4 font-mono">
    <!-- Primary Rating -->
    <div class="text-center py-4">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="highestActiveRating"
          format="commas"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-1">
        CHESS RATING
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        <AnimatedNumber
          :value="bestRating"
          format="commas"
          priority="secondary"
        />
        PEAK ·
        <AnimatedNumber
          :value="winRate"
          format="percent"
          priority="tertiary"
        />% WIN RATE
      </div>
    </div>

    <!-- Variant Ratings with Deltas -->
    <div class="space-y-1.5 mb-4">
      <div
        v-for="variant in variantRatingsWithDeltas"
        :key="variant.name"
        class="flex items-center justify-between text-xs"
      >
        <span class="text-zinc-500 uppercase tracking-widest text-xs">{{
          variant.name
        }}</span>
        <div class="flex items-center gap-2">
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">{{
            variant.current
          }}</span>
          <span
            v-if="variant.delta !== 0"
            :class="
              variant.delta > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
            class="tabular-nums text-xs"
          >
            {{ variant.delta > 0 ? '+' : '' }}{{ variant.delta }}
          </span>
        </div>
      </div>
    </div>

    <!-- Performance Stats -->
    <div v-if="hasGameStats">
      <StatsSectionHeader title="PERFORMANCE" />
      <div class="space-y-1.5">
        <div
          v-for="metric in performanceMetrics"
          :key="metric.label"
          class="flex items-center justify-between text-xs"
        >
          <span class="text-zinc-500 uppercase tracking-widest text-xs">{{
            metric.label
          }}</span>
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">{{
            metric.value
          }}</span>
        </div>
      </div>
    </div>

    <!-- Recent Matches (This Month Only) -->
    <div v-if="thisMonthGames.length">
      <StatsSectionHeader title="THIS MONTH'S GAMES" />
      <div class="space-y-1">
        <div
          v-for="game in thisMonthGames.slice(0, 10)"
          :key="game.id || game.url"
          class="flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="text-zinc-500 text-xs">
              {{ formatGameDateMinimal(game.timestamp) }}
              {{ formatGameTime(game.timestamp) }}
            </span>
            <span class="text-zinc-500 uppercase text-xs">
              {{ formatGameTypeMinimal(game.timeControl) }}
            </span>
            <span class="font-bold text-zinc-600 dark:text-zinc-400 text-xs">
              {{
                game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'
              }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <span class="tabular-nums font-medium">{{ game.rating }}</span>
            <span
              v-if="game.ratingDiff && game.ratingDiff !== 0"
              class="tabular-nums text-xs"
              :class="getRatingDiffClass(game.ratingDiff)"
            >
              {{ formatRatingDiff(game.ratingDiff) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState v-else message="Chess data unavailable" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import {
  formatNumber,
  formatGameDateMinimal,
  formatGameTime,
  formatGameTypeMinimal,
  formatRatingDiff,
  getRatingDiffClass
} from '~/composables/useNumberFormat'

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
    lowestRating: number
    lastUpdated?: number
  }
  recentPuzzles?: Array<{
    date: string
    rating: number
    solved: boolean
  }>
  recentGames: ChessGame[]
  lastUpdated: string
}

const props = defineProps<{
  stats?: ChessStats | null
}>()

// Type conversion helpers
const isNewFormat = computed(() => {
  return typeof props.stats?.currentRating === 'object'
})

// Getter for specific rating type
const getRating = (type: keyof NewFormatRatings) => {
  if (!props.stats) return 0

  if (isNewFormat.value) {
    return (props.stats.currentRating as NewFormatRatings)[type]
  }

  // For old format, return the same value for all types
  return props.stats.currentRating as number
}

// Check if a specific rating type exists
const hasRating = (type: keyof NewFormatRatings) => {
  return getRating(type) > 0
}

// Get highest active rating
const highestActiveRating = computed(() => {
  if (!props.stats) return 0

  if (isNewFormat.value) {
    const ratings = props.stats.currentRating as NewFormatRatings
    return Math.max(ratings.bullet || 0, ratings.blitz || 0, ratings.rapid || 0)
  }

  return props.stats.currentRating as number
})

const bestRating = computed(() => {
  if (!props.stats) return 0

  if (isNewFormat.value) {
    const ratings = props.stats.bestRating as NewFormatRatings
    return Math.max(ratings.bullet || 0, ratings.blitz || 0, ratings.rapid || 0)
  }

  return props.stats.bestRating as number
})

const winRate = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.winRate as NewFormatWinRate).overall
    : (props.stats.winRate as number)
})

const gamesPlayed = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.gamesPlayed as NewFormatGamesPlayed).total
    : (props.stats.gamesPlayed as number)
})

const overallWinRate = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.winRate as NewFormatWinRate).overall
    : (props.stats.winRate as number)
})

const hasGameStats = computed(() => {
  if (!props.stats) return false
  return gamesPlayed.value > 0 && bestRating.value > 0
})

// This month's games only
const thisMonthGames = computed(() => {
  if (!props.stats?.recentGames) return []

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return [...props.stats.recentGames]
    .filter((game) => {
      const gameDate = new Date(game.timestamp * 1000)
      return gameDate >= startOfMonth
    })
    .sort((a, b) => b.timestamp - a.timestamp)
})

// Variant ratings with deltas (current vs best)
const variantRatingsWithDeltas = computed(() => {
  if (!props.stats) return []

  const variants = ['bullet', 'blitz', 'rapid'] as const

  return variants
    .map((variant) => {
      const current = getRating(variant)
      const best = isNewFormat.value
        ? (props.stats!.bestRating as NewFormatRatings)[variant] || 0
        : (props.stats!.bestRating as number)

      const delta = current - best

      return {
        name: variant.toUpperCase(),
        current: formatNumber(current),
        delta: Math.round(delta)
      }
    })
    .filter((variant) => parseInt(variant.current.replace(/,/g, '')) > 0)
})

// Legacy: Keep for compatibility
const variantRatings = computed(() =>
  [
    { name: 'BULLET', rating: formatNumber(getRating('bullet')) },
    { name: 'BLITZ', rating: formatNumber(getRating('blitz')) },
    { name: 'RAPID', rating: formatNumber(getRating('rapid')) }
  ].filter((variant) => parseInt(variant.rating.replace(/,/g, '')) > 0)
)

const performanceMetrics = computed(() => [
  { label: 'GAMES PLAYED', value: formatNumber(gamesPlayed.value) },
  { label: 'WIN RATE', value: `${Math.round(overallWinRate.value)}%` },
  {
    label: 'PUZZLE RATING',
    value: formatNumber(props.stats?.puzzleStats.rating || 0)
  }
])
</script>
