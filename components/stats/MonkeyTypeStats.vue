<template>
  <div ref="monkeyStatsRef" class="font-mono">
    <!-- Main Stats -->
    <div v-if="hasStats" ref="mainStatsRef">
      <div class="space-y-4">
        <!-- Primary WPM Stat with AnimatedNumber -->
        <div class="individual-stat-large">
          <div class="stat-value">
            {{ Math.round(stats.typingStats.bestWPM) }}
          </div>
          <div class="stat-label">
            BEST WPM
          </div>
          <div class="stat-details">
            {{ stats.typingStats.testsCompleted }} TESTS · 
            {{ Math.round(stats.typingStats.bestAccuracy) }}% ACC
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-6">
      <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
        NO TYPING DATA
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        Visit
        <a
          href="https://monkeytype.com"
          target="_blank"
          class="text-zinc-800 dark:text-zinc-300 hover:underline"
        >MonkeyType.com</a>
        to start tracking
      </div>
    </div>

    <!-- Recent Tests -->
    <div v-if="hasRecentTests" ref="recentTestsRef" class="mt-8 space-y-6">
      <StatsSectionHeader title="RECENT TESTS" />

      <div class="space-y-4">
        <div v-for="test in recentTests" :key="test.timestamp" class="test-row">
          <div class="flex-none">
            <!-- Simplified date format -->
            <span class="text-zinc-400 text-2xs tabular-nums">{{
              formatDateMinimal(test.timestamp)
            }}</span>
          </div>
          <div v-if="hasTestType(test)" class="test-type">
            {{ formatTestTypeMinimal(test) }}
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <span class="wpm-value">
              <AnimatedNumber :value="test.wpm" format="default" :duration="timing.slow" priority="tertiary" />
            </span>
            <span class="accuracy-value">
              <AnimatedNumber :value="test.accuracy" format="decimal" :decimals="1" :duration="timing.normal" priority="tertiary" />%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div v-if="stats.typingStats" ref="performanceRef" class="mt-8 space-y-6">
      <StatsSectionHeader title="PERFORMANCE" />

      <div class="grid grid-cols-2 gap-4">
        <div class="stat-item">
          <div class="stat-label">
            TESTS
          </div>
          <div class="stat-value">
            <AnimatedNumber :value="stats.typingStats.testsCompleted" format="default" :duration="timing.dramatic" priority="secondary" />
          </div>
        </div>
        
        <div v-if="stats.typingStats.bestConsistency" class="stat-item">
          <div class="stat-label">
            CONSISTENCY
          </div>
          <div class="stat-value">
            <AnimatedNumber :value="stats.typingStats.bestConsistency" format="default" :duration="timing.slow" priority="secondary" />%
          </div>
        </div>
        
        <div v-if="stats.typingStats.averageWPM" class="stat-item">
          <div class="stat-label">
            AVG WPM
          </div>
          <div class="stat-value">
            <AnimatedNumber :value="Math.round(stats.typingStats.averageWPM)" format="default" :duration="timing.slow" priority="secondary" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { format } from 'date-fns'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import { animate, stagger, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

interface MonkeyTypeTest {
  timestamp: string
  wpm: number
  accuracy: number
  mode?: string
  duration?: number
  language?: string
  wordCount?: number
  difficulty?: string
  consistency?: number
}

interface MonkeyTypeStats {
  typingStats: {
    bestWPM: number
    testsCompleted: number
    bestAccuracy: number
    bestConsistency: number
    averageWPM?: number
    recentTests?: Array<MonkeyTypeTest>
    testTypeDistribution?: Record<string, number>
  }
}

const props = defineProps<{
  stats: MonkeyTypeStats
}>()

const { timing } = useAnimations()

// Computed properties for conditional rendering and data formatting
const hasRecentTests = computed(
  () => !!props.stats.typingStats?.recentTests?.length
)

const recentTests = computed(() => {
  if (!props.stats.typingStats?.recentTests) return []

  return [...props.stats.typingStats.recentTests]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5)
})


// Format utilities for minimal date display
const formatDateMinimal = (timestamp: string): string => {
  const date = new Date(timestamp)
  return format(date, 'MM.dd').toLowerCase()
}

// Determine if test has meaningful type info
const hasTestType = (test: MonkeyTypeTest): boolean => {
  return !!(test.duration || test.wordCount || test.mode)
}

// Format test type in minimal style
const formatTestTypeMinimal = (test: MonkeyTypeTest): string => {
  if (test.duration) {
    return `${test.duration}s`
  } else if (test.wordCount) {
    return `${test.wordCount}w`
  } else if (test.mode && test.mode.toLowerCase() !== 'time') {
    return test.mode.toLowerCase()
  }
  return ''
}

// Add a computed property to check if we have stats
const hasStats = computed(() => {
  return !!props.stats.typingStats?.bestWPM
})

// Animation refs
const monkeyStatsRef = ref<HTMLElement | null>(null)
const mainStatsRef = ref<HTMLElement | null>(null)
const recentTestsRef = ref<HTMLElement | null>(null)
const performanceRef = ref<HTMLElement | null>(null)

// Epic MonkeyType stats scroll-triggered animations
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!monkeyStatsRef.value) return

    // Main stats dramatic entrance
    if (mainStatsRef.value) {
      animate(mainStatsRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.8, rotateX: -20, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.05, rotateX: 5, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
        ],
        duration: 600, // 2025 optimal duration
        ease: 'out(2.4)', // Advanced physics
        autoplay: onScroll({
          target: mainStatsRef.value,
          onEnter: () => true
        })
      })
    }

    // Recent tests staggered entrance
    if (recentTestsRef.value) {
      const testRows = recentTestsRef.value.querySelectorAll('.test-row')
      if (testRows.length) {
        animate(Array.from(testRows), {
          opacity: [0, 1],
          translateX: [-20, 0],
          scale: [0.96, 1],
          duration: 380, // 2025 micro-timing
          delay: stagger(60),
          ease: 'out(2.6)', // Refined curve
          autoplay: onScroll({
            target: recentTestsRef.value,
            onEnter: () => true
          })
        })
      }
    }

    // Performance metrics grid stagger
    if (performanceRef.value) {
      const statItems = performanceRef.value.querySelectorAll('.stat-item')
      if (statItems.length) {
        animate(Array.from(statItems), {
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.92, 1.02, 1],
          duration: 480, // 2025 grid timing
          delay: stagger(90),
          ease: 'out(2.8)', // 2025 physics
          autoplay: onScroll({
            target: performanceRef.value,
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
/* Individual stat styles - inherits global typography */
.individual-stat-large {
  @apply text-center;
}

.test-row {
  @apply flex items-center text-xs;
}

.test-type {
  @apply text-zinc-500 ml-2;
  font-size: 0.65rem;
  line-height: 1rem;
}

.wpm-value {
  @apply text-zinc-700 dark:text-zinc-400 tabular-nums font-medium;
}

.accuracy-value {
  @apply text-zinc-500 tabular-nums w-12 text-right;
}

/* Stat item styles for performance section */
.stat-item {
  @apply space-y-1 text-center;
}

.stat-item .stat-label {
  @apply text-xs tracking-wider text-zinc-500;
}

.stat-item .stat-value {
  @apply text-lg font-mono tabular-nums text-zinc-800 dark:text-zinc-200;
}
</style>
