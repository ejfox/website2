<!--
  @file ChessStats.vue
  @description Chess.com statistics showing ratings, games, and performance metrics
  @props stats: Object - Chess statistics from Chess.com API
-->
<template>
  <div v-if="stats" class="space-y-2 font-mono">
    <!-- Primary Rating -->
    <div class="text-center py-2">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="highestActiveRating"
          format="commas"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-2">
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
          :value="Math.round(winRate)"
          format="commas"
          priority="tertiary"
        />
        % WIN RATE
      </div>
    </div>

    <!-- Variant Ratings Small Multiples -->
    <div class="space-y-2 mb-4">
      <div
        v-for="variant in variantStatsWithBars"
        :key="variant.name"
        class="flex items-center gap-2 text-xs"
      >
        <span class="text-zinc-500 uppercase tracking-widest w-12 text-xs">
          {{ variant.name }}
        </span>
        <!-- Rating bar visualization -->
        <div class="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-sm">
          <div
            class="h-full bg-zinc-400 dark:bg-zinc-500 rounded-sm transition-all"
            :style="{ width: `${variant.barPct}%` }"
          ></div>
        </div>
        <span
          class="text-zinc-700 dark:text-zinc-300 tabular-nums w-12 text-right"
        >
          {{ variant.current }}
        </span>
        <span
          v-if="variant.delta !== 0"
          :class="
            variant.delta > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
          class="tabular-nums text-xs w-8"
        >
          {{ variant.delta > 0 ? '+' : '' }}{{ variant.delta }}
        </span>
        <span v-else class="w-8"></span>
      </div>
    </div>

    <!-- Performance Stats -->
    <div v-if="hasGameStats">
      <StatsSectionHeader title="CHESS PERFORMANCE" />
      <div class="space-y-2">
        <div
          v-for="metric in performanceMetrics"
          :key="metric.label"
          class="flex items-center justify-between text-xs"
        >
          <span class="text-zinc-500 uppercase tracking-widest text-xs">
            {{ metric.label }}
          </span>
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {{ metric.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Matches (This Month Only) -->
    <div v-if="thisMonthGames.length">
      <StatsSectionHeader title="RECENT CHESS GAMES" />
      <div class="space-y-1">
        <div
          v-for="game in thisMonthGames.slice(0, 10)"
          :key="game.id || game.url"
          class="flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="text-zinc-500 uppercase text-xs font-medium">
              {{ formatGameTypeMinimal(game.timeControl) }}
            </span>
            <span class="font-bold text-zinc-600 dark:text-zinc-400 text-xs">
              {{
                game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'
              }}
            </span>
            <span class="text-zinc-500 text-xs">
              {{ formatTimeAgo(game.timestamp) }}
            </span>
          </div>
          <div class="flex items-center gap-0.5">
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
import AnimatedNumber from '../ui/AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import {
  formatNumber,
  formatGameTypeMinimal,
  formatRatingDiff,
  getRatingDiffClass,
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
    lowestRating?: number
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

// Format time ago for games
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now()
  const gameDate = timestamp * 1000
  const diffMs = now - gameDate
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// Variant ratings with stats (win rate, games, delta)
const variantStats = computed(() => {
  if (!props.stats) return []

  const variants = ['bullet', 'blitz', 'rapid'] as const

  return variants
    .map((variant) => {
      const current = getRating(variant)
      const best = isNewFormat.value
        ? (props.stats!.bestRating as NewFormatRatings)[variant] || 0
        : (props.stats!.bestRating as number)

      const delta = current - best

      // Get win rate for this variant
      const variantWinRate =
        isNewFormat.value && props.stats!.winRate
          ? (props.stats!.winRate as NewFormatWinRate)[variant] || 0
          : 0

      return {
        name: variant.toUpperCase(),
        current: formatNumber(current),
        delta: Math.round(delta),
        winRate: variantWinRate > 0 ? `${Math.round(variantWinRate)}%` : '',
      }
    })
    .filter((variant) => Number.parseInt(variant.current.replace(/,/g, '')) > 0)
})

// Small multiples with bar visualization
const variantStatsWithBars = computed(() => {
  const stats = variantStats.value
  if (!stats.length) return []
  const ratings = stats.map(
    (s) => Number.parseInt(s.current.replace(/,/g, '')) || 0
  )
  const maxRating = Math.max(...ratings, 1)
  return stats.map((s, i) => ({
    ...s,
    barPct: Math.round((ratings[i] / maxRating) * 100),
  }))
})

const performanceMetrics = computed(() => [
  { label: 'GAMES PLAYED', value: formatNumber(gamesPlayed.value) },
  { label: 'WIN RATE', value: `${Math.round(overallWinRate.value)}%` },
  {
    label: 'PUZZLE RATING',
    value: formatNumber(props.stats?.puzzleStats.rating || 0),
  },
])
</script>
