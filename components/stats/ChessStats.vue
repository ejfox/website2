<template>
  <div v-if="stats" ref="chessStatsRef" class="space-y-4">
    <!-- Rating Display -->
    <div ref="primaryStatsRef" class="space-y-4">
      <div class="individual-stat-large">
        <div class="stat-value">
          <AnimatedNumber 
            :value="highestActiveRating" 
            format="commas"
            :duration="timing.dramatic"
            priority="primary"
          />
        </div>
        <div class="stat-label">
          CHESS RATING
        </div>
        <div class="stat-details">
          <AnimatedNumber :value="bestRating" format="commas" priority="secondary" /> PEAK · 
          <AnimatedNumber :value="winRate" format="percent" priority="tertiary" />% WIN RATE
        </div>
      </div>

      <!-- Rating Histogram -->
      <div v-if="hasRatingHistory" ref="histogramRef" class="mt-1">
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
          <span class="text-zinc-400 text-2xs">RECENT GAMES</span>
          <span class="text-zinc-400 tabular-nums text-2xs">{{ ratingRange }}</span>
        </div>
      </div>

      <!-- Activity Calendar -->
      <div v-if="hasRatingHistory" ref="calendarRef" class="mt-6">
        <ActivityCalendar title="CHESS ACTIVITY" :active-dates="chessActivityDates" :active-color="'#71717a'" />
      </div>

      <!-- Variant Ratings with Sparklines -->
      <div ref="variantsRef" class="space-y-2 mt-3">
        <div v-if="hasRating('bullet')" class="progress-row py-1">
          <div class="flex items-center gap-2">
            <div class="bullet-sparkline"></div>
            <span class="progress-label">BULLET</span>
          </div>
          <div class="progress-value">
            {{ formatNumber(getRating('bullet')) }}
          </div>
        </div>
        <div v-if="hasRating('blitz')" class="progress-row py-1">
          <div class="flex items-center gap-2">
            <div class="blitz-sparkline"></div>
            <span class="progress-label">BLITZ</span>
          </div>
          <div class="progress-value">
            {{ formatNumber(getRating('blitz')) }}
          </div>
        </div>
        <div v-if="hasRating('rapid')" class="progress-row py-1">
          <div class="flex items-center gap-2">
            <div class="rapid-sparkline"></div>
            <span class="progress-label">RAPID</span>
          </div>
          <div class="progress-value">
            {{ formatNumber(getRating('rapid')) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="hasGameStats" ref="performanceRef">
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
      <div v-if="stats.recentGames?.length" ref="recentGamesRef" class="space-y-1">
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
            <span v-if="game.ratingDiff && game.ratingDiff !== 0" class="tabular-nums font-medium" style="font-size: 10px; line-height: 12px;" :class="getRatingDiffClass(game.ratingDiff)">{{ formatRatingDiff(game.ratingDiff) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState v-else message="Chess data unavailable" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { format } from 'date-fns'
// NUKED BY BLOODHOUND: import { animate, stagger as _stagger, createTimeline as _createTimeline, onScroll } from '~/anime.esm.js'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
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

// NUKED BY BLOODHOUND: const { timing, easing, staggers } = useAnimations()

// Animation refs
const chessStatsRef = ref<HTMLElement | null>(null)
const primaryStatsRef = ref<HTMLElement | null>(null)
const histogramRef = ref<HTMLElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const variantsRef = ref<HTMLElement | null>(null)
const performanceRef = ref<HTMLElement | null>(null)
const recentGamesRef = ref<HTMLElement | null>(null)


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

// Sort games by timestamp (most recent first)
const recentGamesSorted = computed(() => {
  if (!props.stats?.recentGames) return []

  return [...props.stats.recentGames]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
})

// Epic chess stats scroll-triggered animation using anime.js native onScroll
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!chessStatsRef.value) return

    // Stage 1: Primary stats dramatic entrance on scroll
    if (primaryStatsRef.value) {
      // NUKED: // NUKED BY BLOODHOUND: // animate(primaryStatsRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.8, rotateX: -15, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.05, rotateX: 5, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
        ],
        duration: timing.value.dramatic,
        ease: 'cubicBezier(0.2, 0, 0.38, 0.9)',
        autoplay: onScroll({
          target: primaryStatsRef.value,
          onEnter: () => true
        })
      })
    }
    
    // Stage 2: Epic histogram bars cascade on scroll
    if (histogramRef.value) {
      const bars = histogramRef.value.querySelectorAll('.histogram-bar')
      if (bars.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(bars), {
          scaleY: [0, 1.2, 1],
          opacity: [0, 1],
          duration: timing.value.slow,
          delay: _stagger(staggers.tight, { from: 'center' }),
          ease: 'outElastic(1, .8)',
          autoplay: onScroll({
            target: histogramRef.value,
            onEnter: () => true
          })
        })
      }
    }
    
    // Stage 3: Variant ratings matrix reveal on scroll
    if (variantsRef.value) {
      const variants = variantsRef.value.children
      if (variants.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(variants), {
          opacity: [0, 1],
          translateX: [-15, 0],
          scale: [0.9, 1.05, 1],
          duration: timing.value.dramatic,
          delay: _stagger(staggers.loose),
          ease: 'cubicBezier(0.2, 0, 0.38, 0.9)',
          autoplay: onScroll({
            target: variantsRef.value,
            onEnter: () => true
          })
        })
      }
    }
    
    // Stage 4: Activity calendar emergence on scroll
    if (calendarRef.value) {
      // NUKED: // NUKED BY BLOODHOUND: // animate(calendarRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.9, rotateY: -10, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.02, rotateY: 3, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateY: 0, filter: 'blur(0px)' }
        ],
        duration: timing.value.dramatic,
        ease: 'cubicBezier(0.2, 0, 0.38, 0.9)',
        autoplay: onScroll({
          target: calendarRef.value,
          onEnter: () => true
        })
      })
    }
    
    // Stage 5: Performance metrics reveal on scroll
    if (performanceRef.value) {
      const performanceRows = performanceRef.value.querySelectorAll('.velocity-row')
      if (performanceRows.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(performanceRows), {
          opacity: [0, 1],
          translateY: [10, 0],
          scale: [0.95, 1],
          duration: timing.value.slow,
          delay: _stagger(staggers.tight),
          ease: 'cubicBezier(0.4, 0, 0.2, 1)',
          autoplay: onScroll({
            target: performanceRef.value,
            onEnter: () => true
          })
        })
      }
    }
    
    // Stage 6: Recent games slide in on scroll
    if (recentGamesRef.value) {
      const gameRows = recentGamesRef.value.querySelectorAll('.game-row')
      if (gameRows.length) {
        // NUKED: // NUKED BY BLOODHOUND: // animate(Array.from(gameRows), {
          opacity: [0, 1],
          translateX: [-20, 0],
          scale: [0.98, 1],
          duration: timing.value.normal,
          delay: _stagger(staggers.tight),
          ease: 'cubicBezier(0.4, 0, 0.2, 1)',
          autoplay: onScroll({
            target: recentGamesRef.value,
            onEnter: () => true
          })
        })
      }
    }
  })
}

onMounted(() => {
  setupScrollAnimations()
})
</script>

<style scoped>
/* Section headers and data unavailable states are now handled by shared components */

/* Additional text size utilities */
.text-2xs {
  font-size: 0.625rem; /* 10px */
  line-height: 0.75rem; /* 12px */
}

.text-3xs {
  font-size: 0.5625rem; /* 9px */
  line-height: 0.625rem; /* 10px */
}

/* Individual stat styles for AnimatedNumber replacement */
.individual-stat-large {
  @apply text-center;
}

/* Uses global typography classes */

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

/* Sparkline indicators - simplified with CSS custom properties */
.bullet-sparkline,
.blitz-sparkline,
.rapid-sparkline,
.games-sparkline,
.winrate-sparkline,
.puzzle-sparkline {
  @apply w-8 h-3 flex items-end gap-px;
}

[class$="-sparkline"]::before,
[class$="-sparkline"]::after {
  content: '';
  width: 2px;
  height: var(--bar-height);
  background-color: var(--bar-color);
}

.bullet-sparkline {
  --bar-color: theme('colors.zinc.400');
}
.bullet-sparkline::before { --bar-height: 8px; }
.bullet-sparkline::after { --bar-height: 12px; }

.blitz-sparkline {
  --bar-color: theme('colors.zinc.500');
}
.blitz-sparkline::before { --bar-height: 10px; }
.blitz-sparkline::after { --bar-height: 6px; }

.rapid-sparkline {
  --bar-color: theme('colors.zinc.600');
}
.rapid-sparkline::before { --bar-height: 6px; }
.rapid-sparkline::after { --bar-height: 10px; }

.games-sparkline {
  --bar-color: theme('colors.zinc.300');
}
.games-sparkline::before { --bar-height: 4px; }
.games-sparkline::after { --bar-height: 12px; }

.winrate-sparkline {
  --bar-color: theme('colors.zinc.400');
}
.winrate-sparkline::before { --bar-height: 8px; }
.winrate-sparkline::after { --bar-height: 10px; }

.puzzle-sparkline {
  --bar-color: theme('colors.zinc.500');
}
.puzzle-sparkline::before { --bar-height: 12px; }
.puzzle-sparkline::after { --bar-height: 8px; }

@media (prefers-color-scheme: dark) {
  .bullet-sparkline { --bar-color: theme('colors.zinc.500'); }
  .blitz-sparkline { --bar-color: theme('colors.zinc.400'); }
  .rapid-sparkline { --bar-color: theme('colors.zinc.300'); }
  .games-sparkline { --bar-color: theme('colors.zinc.600'); }
  .winrate-sparkline { --bar-color: theme('colors.zinc.500'); }
  .puzzle-sparkline { --bar-color: theme('colors.zinc.400'); }
}
</style>