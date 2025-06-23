<template>
  <div v-if="stats" class="space-y-4">
    <!-- Primary Stats -->
    <div class="space-y-4">
      <!-- Chess Rating -->
      <IndividualStat :value="highestActiveRating" size="large" label="CHESS RATING"
        :details="`${formatNumber(bestRating)} PEAK · ${winRate}% WIN RATE`" />

      <!-- Rating Histogram -->
      <div v-if="hasRatingHistory" class="mt-1">
        <div class="histogram-container">
          <div v-for="(game, index) in ratingHistogramData" :key="index" class="histogram-bar" :style="{
            height: `${getBarHeight(game.rating)}px`,
            opacity: getBarOpacity(index),
            backgroundColor: getBarColor(game.result)
          }" :title="`${game.rating} - ${game.result.toUpperCase()}`"></div>
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
          <div class="text-lg tabular-nums font-bold">{{ formatNumber(getRating('bullet')) }}</div>
        </div>
        <div v-if="hasRating('blitz')" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <div class="blitz-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">BLITZ</span>
          </div>
          <div class="text-lg tabular-nums font-bold">{{ formatNumber(getRating('blitz')) }}</div>
        </div>
        <div v-if="hasRating('rapid')" class="flex items-center justify-between py-1">
          <div class="flex items-center gap-2">
            <div class="rapid-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">RAPID</span>
          </div>
          <div class="text-lg tabular-nums font-bold">{{ formatNumber(getRating('rapid')) }}</div>
        </div>
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="hasGameStats">
      <h4 class="section-subheader">PERFORMANCE</h4>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="games-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">GAMES PLAYED</span>
          </div>
          <div class="text-base tabular-nums font-bold">{{ formatNumber(gamesPlayed) }}</div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="winrate-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">WIN RATE</span>
          </div>
          <div class="text-base tabular-nums font-bold">{{ Math.round(overallWinRate) }}%</div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="puzzle-sparkline"></div>
            <span class="text-zinc-500" style="font-size: 10px; line-height: 12px;">PUZZLE RATING</span>
          </div>
          <div class="text-base tabular-nums font-bold">{{ formatNumber(stats.puzzleStats.rating) }}</div>
        </div>
      </div>

      <!-- Recent Games -->
      <h4 class="section-subheader mt-4">RECENT MATCHES</h4>
      <div v-if="stats.recentGames?.length" class="space-y-1">
        <div v-for="game in recentGamesSorted" :key="game.id || game.url" class="game-row">
          <div class="flex-none flex items-center gap-1">
            <span class="text-zinc-400 tabular-nums" style="font-size: 10px; line-height: 12px;">{{ formatGameDateMinimal(game.timestamp) }}</span>
            <span class="text-zinc-400 tabular-nums" style="font-size: 9px; line-height: 10px;">{{ formatGameTime(game.timestamp) }}</span>
          </div>
          <div class="game-type text-zinc-500 ml-2" style="font-size: 9px; line-height: 10px;">{{ formatGameTypeMinimal(game.timeControl) }}</div>
          <div class="result-indicator" :class="resultColor(game.result)"></div>
          <div class="ml-auto flex items-center gap-1">
            <span class="rating-value text-sm tabular-nums font-medium">{{ game.rating }}</span>
            <span v-if="game.ratingDiff && game.ratingDiff !== 0" class="tabular-nums font-medium" style="font-size: 10px; line-height: 12px;"
              :class="ratingDiffClass(game.ratingDiff)">
              {{ formatRatingDiff(game.ratingDiff) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="data-unavailable">
    Chess data unavailable
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import { formatNumber } from '~/composables/useNumberFormat'

// Turbo color palette
const turboColors = [
  '#30123b', '#4444a4', '#337bc3', '#24aad8', '#1ac7c2',
  '#3bdf92', '#7cf357', '#c8e020', '#fbb508', '#f57e00', '#dd2e06'
];

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

// Format helpers
const formatRatingDiff = (diff: number): string => {
  return diff > 0 ? `+${diff}` : `${diff}`
}

const ratingDiffClass = (diff: number) => {
  return diff > 0 ? 'text-zinc-600 dark:text-zinc-400' : 'text-red-500'
}

const resultColor = (result: string) => {
  if (result === 'win') return 'bg-zinc-400 dark:bg-zinc-500'
  if (result === 'loss') return 'bg-red-500'
  return 'bg-zinc-500' // draw
}

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

// Minimal date format
const formatGameDateMinimal = (timestamp: number) => {
  return format(new Date(timestamp * 1000), 'MM.dd')
}

// Format game type in minimal style
const formatGameTypeMinimal = (timeControl: string) => {
  // Map time controls to shorter versions
  const map: Record<string, string> = {
    'bullet': 'blt',
    'blitz': 'blz',
    'rapid': 'rpd',
    'daily': 'day'
  }

  return map[timeControl.toLowerCase()] || timeControl.substring(0, 3)
}

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

const getBarColor = (result: string) => {
  if (result === 'win') return '#a1a1aa' // Gray-400 
  if (result === 'loss') return '#3f3f46' // Gray-700
  return '#71717a' // Gray-500 for draw
}

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

// Format game time in HH:MM format
const formatGameTime = (timestamp: number) => {
  return format(new Date(timestamp * 1000), 'HH:mm')
}

// Sort games by timestamp (most recent first)
const recentGamesSorted = computed(() => {
  if (!props.stats?.recentGames) return []

  return [...props.stats.recentGames]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
})
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 border-b border-zinc-800/30 pb-1 mb-3;
  font-size: 0.65rem;
  line-height: 1rem;
}

.stat-summary {
  @apply space-y-0.5;
}

.stat-value {
  @apply text-base tabular-nums;
}

.stat-label {
  @apply text-zinc-500 tracking-wider;
  font-size: 0.65rem;
  line-height: 1rem;
}

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

.data-unavailable {
  @apply text-sm text-zinc-400;
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