<template>
  <div ref="leetCodeRef" class="font-mono">
    <!-- Main Stats -->
    <div v-if="stats.submissionStats" ref="primaryStatRef" class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="totalSolved" format="commas" :duration="timing.slower" priority="primary" />
      </div>
      <div class="stat-label">
        PROBLEMS SOLVED
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.submissionStats.easy.count" format="commas" :duration="timing.slow" priority="secondary" /> EASY · 
        <AnimatedNumber :value="stats.submissionStats.medium.count" format="commas" :duration="timing.slow" :delay="50" priority="secondary" /> MEDIUM · 
        <AnimatedNumber :value="stats.submissionStats.hard.count" format="commas" :duration="timing.slow" priority="tertiary" /> HARD
      </div>

      <!-- Difficulty Distribution -->
      <div ref="difficultyBarRef" class="mt-4">
        <div class="difficulty-bar">
          <div
            class="easy-bar" :style="{
              width: `${difficultyPercentages.easy}%`,
              opacity: difficultyPercentages.easy > 5 ? 1 : 0.7,
              backgroundColor: '#a1a1aa' /* Gray-400 */
            }"
            :title="`Easy: ${formatNumber(stats.submissionStats.easy.count)} problems (${formatPercent(difficultyPercentages.easy / 100, 0)})`"
          >
          </div>
          <div
            class="medium-bar" :style="{
              width: `${difficultyPercentages.medium}%`,
              opacity: difficultyPercentages.medium > 5 ? 1 : 0.7,
              backgroundColor: '#71717a' /* Gray-500 */
            }"
            :title="`Medium: ${formatNumber(stats.submissionStats.medium.count)} problems (${formatPercent(difficultyPercentages.medium / 100, 0)})`"
          >
          </div>
          <div
            class="hard-bar" :style="{
              width: `${difficultyPercentages.hard}%`,
              opacity: difficultyPercentages.hard > 5 ? 1 : 0.7,
              backgroundColor: '#3f3f46' /* Gray-700 */
            }"
            :title="`Hard: ${formatNumber(stats.submissionStats.hard.count)} problems (${formatPercent(difficultyPercentages.hard / 100, 0)})`"
          >
          </div>
        </div>
        <div class="flex justify-between text-2xs text-zinc-500 mt-1">
          <span>EASY</span>
          <span>MEDIUM</span>
          <span>HARD</span>
        </div>
      </div>

      <!-- Activity Calendar (using new reusable component) -->
      <div v-if="hasActivityData" ref="calendarRef" class="mt-6">
        <ActivityCalendar title="ACTIVITY" :active-dates="activityDates" :active-color="'#71717a'" :days="30" />
      </div>
    </div>

    <!-- Problem Stats - Simplified Table -->
    <div v-if="stats.submissionStats" ref="breakdownRef" class="mt-8">
      <StatsSectionHeader title="DIFFICULTY BREAKDOWN" />
      <div class="grid grid-cols-3 gap-x-4 gap-y-1">
        <!-- Column Headers -->
        <div class="text-zinc-500 text-2xs tracking-wider">
          EASY
        </div>
        <div class="text-zinc-500 text-2xs tracking-wider">
          MEDIUM
        </div>
        <div class="text-zinc-500 text-2xs tracking-wider">
          HARD
        </div>

        <!-- Values -->
        <div class="tabular-nums font-medium">
          <AnimatedNumber :value="stats.submissionStats.easy.count" format="commas" priority="secondary" />
        </div>
        <div class="tabular-nums font-medium">
          <AnimatedNumber :value="stats.submissionStats.medium.count" format="commas" :delay="100" priority="secondary" />
        </div>
        <div class="tabular-nums font-medium">
          <AnimatedNumber :value="stats.submissionStats.hard.count" format="commas" priority="tertiary" />
        </div>
      </div>
    </div>

    <!-- Language Stats - Refined with bars -->
    <div v-if="hasLanguageStats" ref="languagesRef" class="mt-8">
      <StatsSectionHeader title="LANGUAGES" />
      <div class="space-y-2.5">
        <div v-for="(item, index) in languageEntries" :key="index" class="language-item">
          <div class="flex justify-between items-center mb-1">
            <span class="text-zinc-700 dark:text-zinc-300 text-xs">{{ item.language }}</span>
            <span class="text-zinc-500 text-2xs tabular-nums">
              <AnimatedNumber :value="item.count" format="commas" :delay="index * 80" priority="tertiary" /> <span class="ml-0.5">{{ item.count > 1 ? 'SOLUTIONS' : 'SOLUTION' }}</span>
            </span>
          </div>
          <div class="lang-bar-bg">
            <div
              class="lang-bar-fill" :style="{
                width: `${(item.count / totalLanguageSolutions) * 100}%`,
                backgroundColor: item.color
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Submissions -->
    <div v-if="recentAcceptedSubmissions.length" ref="recentRef" class="mt-8">
      <StatsSectionHeader title="RECENT SOLUTIONS" />
      <div class="space-y-2">
        <div v-for="submission in recentAcceptedSubmissions" :key="submission.titleSlug" class="submission-row">
          <div class="flex-none">
            <span class="text-zinc-400 text-2xs tabular-nums">{{ formatDateMinimal(submission.timestamp) }}</span>
          </div>
          <a :href="`https://leetcode.com/problems/${submission.titleSlug}/`" target="_blank" class="problem-title">
            {{ truncateTitle(submission.title) }}
          </a>
          <div class="submission-lang text-2xs">
            {{ submission.lang }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { format } from 'date-fns'
import ActivityCalendar from './ActivityCalendar.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { formatNumber, formatPercent } from '~/composables/useNumberFormat'
import type { StatsResponse } from '~/composables/useStats'
import { stagger as _stagger, createTimeline } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

// Monochromatic zinc shades for language differentiation
const zincShades = [
  'rgb(161, 161, 170)', // zinc-400
  'rgb(113, 113, 122)', // zinc-500  
  'rgb(82, 82, 91)',    // zinc-600
  'rgb(63, 63, 70)'     // zinc-700
];

// Get zinc shade for index
const getColorForIndex = (index: number, _total: number) => {
  return zincShades[index % zincShades.length];
};

type LeetCodeStats = NonNullable<StatsResponse['leetcode']>

const props = defineProps<{
  stats: LeetCodeStats
}>()

const { timing, easing } = useAnimations()

// Total problems solved
const totalSolved = computed(() => {
  if (!props.stats.submissionStats) return 0
  return (
    props.stats.submissionStats.easy.count +
    props.stats.submissionStats.medium.count +
    props.stats.submissionStats.hard.count
  )
})

// Difficulty distribution
const difficultyPercentages = computed(() => {
  if (totalSolved.value === 0) return { easy: 33.3, medium: 33.3, hard: 33.3 }

  return {
    easy: (props.stats.submissionStats.easy.count / totalSolved.value) * 100,
    medium: (props.stats.submissionStats.medium.count / totalSolved.value) * 100,
    hard: (props.stats.submissionStats.hard.count / totalSolved.value) * 100
  }
})

// Language statistics
const languageEntries = computed(() => {
  const stats: Record<string, number> = {}

  props.stats.recentSubmissions
    .filter(s => s.statusDisplay === 'Accepted')
    .forEach(submission => {
      const lang = submission.lang
      stats[lang] = (stats[lang] || 0) + 1
    })

  // Convert to array for easier iteration with indices
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4) // Limit to top 4 languages
    .map(([language, count], index, array) => ({
      language,
      count,
      color: getColorForIndex(index, array.length)
    }))
})

const totalLanguageSolutions = computed(() => {
  return languageEntries.value.reduce((sum, item) => sum + item.count, 0)
})

const hasLanguageStats = computed(() => languageEntries.value.length > 0)

// Recent submissions
const recentAcceptedSubmissions = computed(() => {
  return props.stats.recentSubmissions
    .filter(s => s.statusDisplay === 'Accepted')
    .slice(0, 5)
})

// Format utilities
const formatDateMinimal = (timestamp: string): string => {
  // Parse timestamp as epoch seconds
  const date = new Date(parseInt(timestamp) * 1000)
  return format(date, 'MM.dd')
}

// Truncate long problem titles
const truncateTitle = (title: string): string => {
  return title.length > 30 ? title.substring(0, 28) + '...' : title
}

// Activity calendar
const hasActivityData = computed(() => {
  return props.stats.recentSubmissions && props.stats.recentSubmissions.length > 0
})

const activityDates = computed(() => {
  if (!props.stats.recentSubmissions) return []

  // Extract active dates from submissions
  return props.stats.recentSubmissions
    .filter(s => s.statusDisplay === 'Accepted')
    .map(s => {
      const date = new Date(parseInt(s.timestamp) * 1000)
      return format(date, 'yyyy-MM-dd')
    })
})

// Animation refs
const leetCodeRef = ref<HTMLElement | null>(null)
const primaryStatRef = ref<HTMLElement | null>(null)
const difficultyBarRef = ref<HTMLElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const breakdownRef = ref<HTMLElement | null>(null)
const languagesRef = ref<HTMLElement | null>(null)
const recentRef = ref<HTMLElement | null>(null)

const animateLeetCodeStats = async () => {
  if (process.server) return
  
  await nextTick()
  
  if (leetCodeRef.value) {
    const timeline = createTimeline()
    
    if (primaryStatRef.value) {
      timeline.add({
        targets: primaryStatRef.value,
        keyframes: [
          { opacity: 0, scale: 0.8, rotateX: -20, filter: 'blur(1px)' },
          { opacity: 0.8, scale: 1.1, rotateX: 5, filter: 'blur(0.3px)' },
          { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
        ],
        duration: timing.expressive,
        ease: 'outElastic(1, .8)'
      })
    }
    
    if (difficultyBarRef.value) {
      const difficultyBars = difficultyBarRef.value.querySelectorAll('.easy-bar, .medium-bar, .hard-bar')
      if (difficultyBars.length) {
        timeline.add({
          targets: Array.from(difficultyBars),
          scaleX: [0, 1.2, 1],
          scaleY: [0.3, 1.5, 1],
          duration: timing.slow,
          delay: _stagger(150),
          ease: 'outElastic(1, .8)'
        }, '-=400')
      }
    }
    
    if (calendarRef.value && hasActivityData.value) {
      timeline.add({
        targets: calendarRef.value,
        opacity: [0, 1],
        scale: [0.9, 1.02, 1],
        translateY: [20, 0],
        duration: timing.slower,
        ease: 'outElastic(1, .8)'
      }, '-=300')
    }
    
    if (breakdownRef.value) {
      const breakdownItems = breakdownRef.value.children
      if (breakdownItems.length) {
        timeline.add({
          targets: Array.from(breakdownItems),
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.9, 1.05, 1],
          duration: timing.slow,
          delay: _stagger(80),
          ease: 'outBack(1.7)'
        }, '-=200')
      }
    }
    
    if (languagesRef.value && hasLanguageStats.value) {
      const languageItems = languagesRef.value.querySelectorAll('.language-item')
      if (languageItems.length) {
        timeline.add({
          targets: Array.from(languageItems),
          opacity: [0, 1],
          translateX: [-20, 0],
          scale: [0.9, 1.02, 1],
          duration: timing.slow,
          delay: _stagger(100),
          ease: 'outBack(1.7)'
        }, '-=150')
        
        const langBars = languagesRef.value.querySelectorAll('.lang-bar-fill')
        if (langBars.length) {
          timeline.add({
            targets: Array.from(langBars),
            scaleX: [0, 1.1, 1],
            scaleY: [0.5, 1.3, 1],
            duration: timing.expressive,
            delay: _stagger(120),
            ease: 'outElastic(1, .8)'
          }, '-=300')
        }
      }
    }
    
    if (recentRef.value && recentAcceptedSubmissions.value.length) {
      const submissionRows = recentRef.value.querySelectorAll('.submission-row')
      if (submissionRows.length) {
        timeline.add({
          targets: Array.from(submissionRows),
          opacity: [0, 1],
          translateX: [-25, 0],
          scale: [0.95, 1],
          duration: timing.normal,
          delay: _stagger(60),
          ease: easing.standard
        }, '-=100')
      }
    }
  }
}

onMounted(() => {
  animateLeetCodeStats()
})
</script>

<style scoped>
/* Individual stat styles for AnimatedNumber replacement */
.individual-stat-large {
  @apply text-center;
}

/* Uses global typography classes */

.difficulty-bar {
  @apply flex h-2 w-full rounded-sm overflow-hidden;
}

.easy-bar {
  @apply bg-zinc-300 dark:bg-zinc-600;
}

.medium-bar {
  @apply bg-zinc-400 dark:bg-zinc-500;
}

.hard-bar {
  @apply bg-zinc-600 dark:bg-zinc-400;
}

.submission-row {
  @apply flex items-center text-xs;
}

.problem-title {
  @apply ml-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline truncate max-w-[16rem];
}

.submission-lang {
  @apply ml-auto text-zinc-500;
}

/* Language bar styles */
.language-item {
  @apply w-full;
}

.lang-bar-bg {
  @apply h-1 w-full rounded-sm overflow-hidden;
}

.lang-bar-fill {
  @apply h-full bg-zinc-700 dark:bg-zinc-400;
}

/* Activity calendar */
.activity-grid {
  @apply grid grid-cols-30 gap-1 h-4;
}

.activity-cell {
  @apply w-full h-full rounded-[1px];
}

/* For grid-cols-30 */
@media (min-width: 640px) {
  .grid-cols-30 {
    grid-template-columns: repeat(30, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .grid-cols-30 {
    grid-template-columns: repeat(15, minmax(0, 1fr));
  }

  .activity-grid {
    @apply grid-rows-2;
  }
}
</style>