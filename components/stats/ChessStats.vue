<template>
  <div v-if="stats" class="space-y-8">
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
          <span class="text-zinc-400 text-2xs">RECENT GAMES</span>
          <span class="text-zinc-400 text-2xs">{{ ratingRange }}</span>
        </div>
      </div>

      <!-- Activity Calendar -->
      <div v-if="hasRatingHistory" class="mt-6">
        <ActivityCalendar title="CHESS ACTIVITY" :active-dates="chessActivityDates" :active-color="'#71717a'" />
      </div>

      <!-- Variant Ratings -->
      <div class="grid grid-cols-3 gap-4 mt-2">
        <div class="text-center" v-if="hasRating('bullet')">
          <div class="text-xl tabular-nums">{{ formatNumber(getRating('bullet')) }}</div>
          <div class="text-2xs text-zinc-500 mt-1">BULLET</div>
        </div>
        <div class="text-center" v-if="hasRating('blitz')">
          <div class="text-xl tabular-nums">{{ formatNumber(getRating('blitz')) }}</div>
          <div class="text-2xs text-zinc-500 mt-1">BLITZ</div>
        </div>
        <div class="text-center" v-if="hasRating('rapid')">
          <div class="text-xl tabular-nums">{{ formatNumber(getRating('rapid')) }}</div>
          <div class="text-2xs text-zinc-500 mt-1">RAPID</div>
        </div>
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="hasGameStats">
      <h4 class="section-subheader">METRICS</h4>
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-summary">
          <div class="stat-value">{{ formatNumber(gamesPlayed) }}</div>
          <div class="stat-label">GAMES</div>
        </div>

        <div class="stat-summary">
          <div class="stat-value">{{ Math.round(overallWinRate) }}%</div>
          <div class="stat-label">WINS</div>
        </div>

        <div class="stat-summary">
          <div class="stat-value">{{ formatNumber(stats.puzzleStats.rating) }}</div>
          <div class="stat-label">PUZZLE</div>
        </div>
      </div>

      <!-- Recent Games -->
      <h4 class="section-subheader mt-6">MATCHES</h4>
      <div v-if="stats.recentGames?.length" class="space-y-2">
        <div v-for="game in recentGamesSorted" :key="game.id || game.url" class="game-row">
          <div class="flex-none flex items-center">
            <span class="text-zinc-400 text-2xs tabular-nums">{{ formatGameDateMinimal(game.timestamp) }}</span>
            <span class="text-zinc-400 text-2xs ml-1">{{ formatGameTime(game.timestamp) }}</span>
          </div>
          <div class="game-type text-2xs ml-2">{{ formatGameTypeMinimal(game.timeControl) }}</div>
          <div class="result-indicator" :class="resultColor(game.result)"></div>
          <div class="ml-auto flex items-center">
            <span class="rating-value">{{ game.rating }}</span>
            <span v-if="game.ratingDiff && game.ratingDiff !== 0" class="text-2xs ml-1"
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
  return diff > 0 ? 'text-green-500' : 'text-red-500'
}

const resultColor = (result: string) => {
  if (result === 'win') return 'bg-green-500'
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
  @apply text-2xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/30 pb-1 mb-3;
}

.stat-summary {
  @apply space-y-0.5;
}

.stat-value {
  @apply text-base tabular-nums;
}

.stat-label {
  @apply text-2xs text-zinc-500 tracking-wider;
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

/* Custom text size smaller than xs */
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}
</style>