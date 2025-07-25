<template>
  <div v-if="stats" class="space-y-4">
    <!-- Primary Stats -->
    <div class="space-y-4">
      <!-- Chess Rating -->
      <IndividualStat
        :value="highestActiveRating" size="large" label="CHESS RATING"
        :details="`${formatNumber(bestRating)} PEAK · ${winRate}% WIN RATE`"
      />

      <!-- Rating Histogram -->
      <div v-if="hasRatingHistory" class="mt-1">
        <div class="histogram-container">
          <div
            v-for="(game, index) in ratingHistogramData" :key="index" class="histogram-bar" :style="{
              height: `${getBarHeight(game.rating)}px`,
              opacity: getBarOpacity(index),
              backgroundColor: getChessBarColor(game.result)
            }" :title="`${game.rating} - ${game.result.toUpperCase()}`"
          ></div>
        </div>
        <div class="histogram-labels">
          <span class="text-zinc-400" style="font-size: 10px; line-height: 12px;">RECENT GAMES</span>
          <span class="text-zinc-400 tabular-nums" style="font-size: 10px; line-height: 12px;">{{ ratingRange }}</span>
        </div>
      </div>

      <!-- Activity Calendar -->
      <div v-if="hasRatingHistory" class="mt-6">
        <ActivityCalendar title="CHESS ACTIVITY" :active-dates="chessActivityDates" :active-color="'#71717a'" />
      </div>

      <!-- Variant Ratings with Sparklines -->
      <div class="space-y-2 mt-3">
        <div v-if="hasRating('bullet')" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <div class="bullet-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">BULLET</span>
          </div>
          <div class="text-lg tabular-nums font-bold">
            {{ formatNumber(getRating('bullet')) }}
          </div>
        </div>
        <div v-if="hasRating('blitz')" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <div class="blitz-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">BLITZ</span>
          </div>
          <div class="text-lg tabular-nums font-bold">
            {{ formatNumber(getRating('blitz')) }}
          </div>
        </div>
        <div v-if="hasRating('rapid')" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <div class="rapid-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">RAPID</span>
          </div>
          <div class="text-lg tabular-nums font-bold">
            {{ formatNumber(getRating('rapid')) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="hasGameStats">
      <StatsSectionHeader title="PERFORMANCE" />
      <div class="space-y-2">
        <div class="velocity-row">
          <div class="flex items-center gap-2">
            <div class="games-sparkline"></div>
            <span class="velocity-label">GAMES PLAYED</span>
          </div>
          <div class="velocity-value">
            {{ formatNumber(gamesPlayed) }}
          </div>
        </div>
        
        <div class="velocity-row">
          <div class="flex items-center gap-2">
            <div class="winrate-sparkline"></div>
            <span class="velocity-label">WIN RATE</span>
          </div>
          <div class="velocity-value">
            {{ Math.round(overallWinRate) }}%
          </div>
        </div>
        
        <div class="velocity-row">
          <div class="flex items-center gap-2">
            <div class="puzzle-sparkline"></div>
            <span class="velocity-label">PUZZLE RATING</span>
          </div>
          <div class="velocity-value">
            {{ formatNumber(stats.puzzleStats.rating) }}
          </div>
        </div>
      </div>

      <!-- Recent Games -->
      <StatsSectionHeader title="RECENT MATCHES" class="mt-4" />
      <div v-if="stats.recentGames?.length" class="space-y-1">
        <div v-for="game in recentGamesSorted" :key="game.id || game.url" class="game-row">
          <div class="flex-none flex items-center gap-1">
            <span class="text-zinc-400 tabular-nums" style="font-size: 10px; line-height: 12px;">{{ formatGameDateMinimal(game.timestamp) }}</span>
            <span class="text-zinc-400 tabular-nums" style="font-size: 9px; line-height: 10px;">{{ formatGameTime(game.timestamp) }}</span>
          </div>
          <div class="game-type text-zinc-500 ml-2" style="font-size: 9px; line-height: 10px;">
            {{ formatGameTypeMinimal(game.timeControl) }}
          </div>
          <div class="result-indicator" :class="getChessResultColor(game.result)"></div>
          <div class="ml-auto flex items-center gap-1">
            <span class="rating-value text-sm tabular-nums font-medium">{{ game.rating }}</span>
            <span
              v-if="game.ratingDiff && game.ratingDiff !== 0" class="tabular-nums font-medium" style="font-size: 10px; line-height: 12px;"
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
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import { 
  formatNumber, 
  formatGameDateMinimal, 
  formatGameTime, 
  formatGameTypeMinimal, 
  formatRatingDiff,
  getChessResultColor,
  getChessBarColor,
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
  }
  recentGames: ChessGame[]
  lastUpdated: string
}

const props = defineProps<{
  stats?: ChessStats | null
}>()

// These functions are now imported from useNumberFormat
// - formatRatingDiff
// - getRatingDiffClass  
// - getChessResultColor
// - getChessBarColor

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

const _currentRating = computed(() => {
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

// These functions are now imported from useNumberFormat
// - formatGameDateMinimal
// - formatGameTime
// - formatGameTypeMinimal

// Rating histogram data
const hasRatingHistory = computed(() => {
  return props.stats?.recentGames && props.stats.recentGames.length > 0
})

const ratingHistogramData = computed(() => {
  if (!props.stats?.recentGames) return []

  // Use only games with rating info, oldest to newest
  return [...props.stats.recentGames]
    .filter(game => !!game.rating)
    .reverse()
})

const ratingStats = computed(() => {
  if (ratingHistogramData.value.length === 0) return { min: 0, max: 0 }

  const ratings = ratingHistogramData.value.map(game => game.rating || 0)
  return {
    min: Math.min(...ratings),
    max: Math.max(...ratings)
  }
})

const ratingRange = computed(() => {
  const { min, max } = ratingStats.value
  return `${min}–${max}`
})

// Histogram bar height calculation
const getBarHeight = (rating: number = 0) => {
  if (ratingHistogramData.value.length === 0) return 0

  const { min, max } = ratingStats.value
  const range = max - min || max || 1 // Avoid division by zero

  // Calculate height
  const minHeight = 4
  const maxHeight = 28

  if (max === min) return minHeight + (maxHeight - minHeight) / 2

  const percentage = (rating - min) / range
  return minHeight + percentage * (maxHeight - minHeight)
}

const getBarOpacity = (index: number) => {
  const total = ratingHistogramData.value.length
  if (total <= 1) return 0.8

  const minOpacity = 0.5
  const opacityStep = (0.8 - minOpacity) / (total - 1)

  return minOpacity + (index * opacityStep)
}

// This function is now imported from useNumberFormat as getChessBarColor

// Option 2: Use highest rating
const highestActiveRating = computed(() => {
  if (!props.stats) return 0
  const ratings = Object.values(props.stats.currentRating as NewFormatRatings)
  return Math.max(...ratings)
})

// Activity calendar data
const chessActivityDates = computed(() => {
  if (!props.stats?.recentGames) return []

  // Extract unique dates from recent games
  const uniqueDates = new Set(
    props.stats.recentGames.map(game =>
      format(new Date(game.timestamp * 1000), 'yyyy-MM-dd')
    )
  )

  return Array.from(uniqueDates)
})

// This function is now imported from useNumberFormat

// Sort games by timestamp (most recent first)
const recentGamesSorted = computed(() => {
  if (!props.stats?.recentGames) return []

  return [...props.stats.recentGames]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
})
</script>

<style scoped>
/* Section headers and data unavailable states are now handled by shared components */

.game-row {
  @apply flex items-center text-xs;
}

.game-type {
  @apply text-zinc-500 ml-2;
}

.result-indicator {
  @apply w-1.5 h-1.5 rounded-full ml-2;
}

.rating-value {
  @apply tabular-nums font-medium;
}

/* Histogram styles */
.histogram-container {
  @apply flex items-end justify-between h-7 w-full space-x-px mt-1;
}

.histogram-bar {
  @apply flex-1 bg-zinc-800 dark:bg-zinc-500 transition-all duration-300;
}

.histogram-labels {
  @apply flex justify-between pt-1 text-zinc-400;
}

/* Sparkline indicators */
.bullet-sparkline,
.blitz-sparkline,
.rapid-sparkline,
.games-sparkline,
.winrate-sparkline,
.puzzle-sparkline {
  @apply w-8 h-3 flex items-end gap-px;
}

.bullet-sparkline::before,
.bullet-sparkline::after {
  content: '';
  @apply bg-zinc-400 dark:bg-zinc-500;
  width: 2px;
}

.bullet-sparkline::before {
  height: 8px;
}

.bullet-sparkline::after {
  height: 12px;
}

.blitz-sparkline::before,
.blitz-sparkline::after {
  content: '';
  @apply bg-zinc-500 dark:bg-zinc-400;
  width: 2px;
}

.blitz-sparkline::before {
  height: 10px;
}

.blitz-sparkline::after {
  height: 6px;
}

.rapid-sparkline::before,
.rapid-sparkline::after {
  content: '';
  @apply bg-zinc-600 dark:bg-zinc-300;
  width: 2px;
}

.rapid-sparkline::before {
  height: 6px;
}

.rapid-sparkline::after {
  height: 10px;
}

.games-sparkline::before,
.games-sparkline::after {
  content: '';
  @apply bg-zinc-300 dark:bg-zinc-600;
  width: 2px;
}

.games-sparkline::before {
  height: 4px;
}

.games-sparkline::after {
  height: 12px;
}

.winrate-sparkline::before,
.winrate-sparkline::after {
  content: '';
  @apply bg-zinc-400 dark:bg-zinc-500;
  width: 2px;
}

.winrate-sparkline::before {
  height: 8px;
}

.winrate-sparkline::after {
  height: 10px;
}

.puzzle-sparkline::before,
.puzzle-sparkline::after {
  content: '';
  @apply bg-zinc-500 dark:bg-zinc-400;
  width: 2px;
}

.puzzle-sparkline::before {
  height: 12px;
}

.puzzle-sparkline::after {
  height: 8px;
}
</style>