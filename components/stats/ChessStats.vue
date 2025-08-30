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
      <div class="text-xs text-zinc-500 uppercase tracking-wider mt-1">
        CHESS RATING
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        <AnimatedNumber :value="bestRating" format="commas" priority="secondary" /> PEAK · 
        <AnimatedNumber :value="winRate" format="percent" priority="tertiary" />% WIN RATE
      </div>
    </div>

    <!-- Variant Ratings with Deltas -->
    <div class="space-y-1.5 mb-4">
      <div 
        v-for="variant in variantRatingsWithDeltas" 
        :key="variant.name"
        class="flex items-center justify-between text-xs"
      >
        <span class="text-zinc-500 uppercase tracking-wider" style="font-size: 10px">{{ variant.name }}</span>
        <div class="flex items-center gap-2">
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">{{ variant.current }}</span>
          <span v-if="variant.delta !== 0" 
                :class="variant.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                class="tabular-nums" 
                style="font-size: 9px">
            {{ variant.delta > 0 ? '+' : '' }}{{ variant.delta }}
          </span>
        </div>
      </div>
    </div>

    <!-- Rating Histogram (This makes no sense but keeping for now) -->
    <div v-if="hasRatingHistory">
      <div class="flex items-end justify-between h-8 w-full gap-px">
        <div
          v-for="(game, index) in ratingHistogramData.slice(-20)"
          :key="index"
          class="flex-1 transition-all duration-300"
          :style="{
            height: getBarHeight(game.rating) + '%',
            opacity: 0.3 + (index / ratingHistogramData.slice(-20).length) * 0.7,
            backgroundColor: getChessBarColor(game.result)
          }"
          :title="`${game.rating} - ${game.result.toUpperCase()}`"
        ></div>
      </div>
      <div class="flex justify-between text-zinc-500 mt-1" style="font-size: 9px">
        <span>RECENT GAMES</span>
        <span class="tabular-nums">{{ ratingRange }}</span>
      </div>
    </div>

    <!-- Activity Calendar -->
    <div v-if="hasRatingHistory">
      <ActivityCalendar 
        title="CHESS ACTIVITY" 
        :active-dates="chessActivityDates" 
        :active-color="'#71717a'" 
      />
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
          <span class="text-zinc-500 uppercase tracking-wider" style="font-size: 10px">{{ metric.label }}</span>
          <span class="text-zinc-700 dark:text-zinc-300 tabular-nums">{{ metric.value }}</span>
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
            <span class="text-zinc-500" style="font-size: 10px">
              {{ formatGameDateMinimal(game.timestamp) }} {{ formatGameTime(game.timestamp) }}
            </span>
            <span class="text-zinc-500 uppercase" style="font-size: 9px">
              {{ formatGameTypeMinimal(game.timeControl) }}
            </span>
            <span 
              class="font-bold text-zinc-600 dark:text-zinc-400"
              style="font-size: 9px"
            >
              {{ game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D' }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <span class="tabular-nums font-medium">{{ game.rating }}</span>
            <span 
              v-if="game.ratingDiff && game.ratingDiff !== 0" 
              class="tabular-nums"
              style="font-size: 10px"
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
import { format } from 'date-fns/format'
import { scaleLinear } from 'd3-scale'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
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
    return Math.max(
      ratings.bullet || 0,
      ratings.blitz || 0,
      ratings.rapid || 0
    )
  }
  
  return props.stats.currentRating as number
})

const bestRating = computed(() => {
  if (!props.stats) return 0
  
  if (isNewFormat.value) {
    const ratings = props.stats.bestRating as NewFormatRatings
    return Math.max(
      ratings.bullet || 0,
      ratings.blitz || 0,
      ratings.rapid || 0
    )
  }
  
  return props.stats.bestRating as number
})

const winRate = computed(() => {
  if (!props.stats) return 0
  return isNewFormat.value
    ? (props.stats.winRate as NewFormatWinRate).overall
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
  return gamesPlayed.value > 0 && bestRating.value > 0
})

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

// Activity dates for calendar
const chessActivityDates = computed(() => {
  if (!props.stats?.recentGames) return []
  
  return props.stats.recentGames.map(game => {
    const date = new Date(game.timestamp)
    return format(date, 'yyyy-MM-dd')
  })
})

// Recent games sorted
const recentGamesSorted = computed(() => {
  if (!props.stats?.recentGames) return []
  
  return [...props.stats.recentGames].sort((a, b) => b.timestamp - a.timestamp)
})

// Use d3 scale for bar heights
const getBarHeight = (rating: number = 0) => {
  const { min, max } = ratingStats.value
  const scale = scaleLinear()
    .domain([min, max])
    .range([20, 100])
    .clamp(true)
  
  return scale(rating)
}

// This month's games only
const thisMonthGames = computed(() => {
  if (!props.stats?.recentGames) return []
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return [...props.stats.recentGames]
    .filter(game => {
      const gameDate = new Date(game.timestamp * 1000)
      return gameDate >= startOfMonth
    })
    .sort((a, b) => b.timestamp - a.timestamp)
})

// Variant ratings with deltas (current vs best)
const variantRatingsWithDeltas = computed(() => {
  if (!props.stats) return []
  
  const variants = ['bullet', 'blitz', 'rapid'] as const
  
  return variants.map(variant => {
    const current = getRating(variant)
    const best = isNewFormat.value
      ? (props.stats!.bestRating as NewFormatRatings)[variant] || 0
      : props.stats!.bestRating as number
    
    const delta = current - best
    
    return {
      name: variant.toUpperCase(),
      current: formatNumber(current),
      delta: Math.round(delta)
    }
  }).filter(variant => parseInt(variant.current.replace(/,/g, '')) > 0)
})

// Legacy: Keep for compatibility
const variantRatings = computed(() => [
  { name: 'BULLET', rating: formatNumber(getRating('bullet')) },
  { name: 'BLITZ', rating: formatNumber(getRating('blitz')) },
  { name: 'RAPID', rating: formatNumber(getRating('rapid')) }
].filter(variant => parseInt(variant.rating.replace(/,/g, '')) > 0))

const performanceMetrics = computed(() => [
  { label: 'GAMES PLAYED', value: formatNumber(gamesPlayed.value) },
  { label: 'WIN RATE', value: `${Math.round(overallWinRate.value)}%` },
  { label: 'PUZZLE RATING', value: formatNumber(props.stats?.puzzleStats.rating || 0) }
])
</script>