<!--
  @file LeetCodeStats.vue
  @description LeetCode coding challenge statistics
  @props stats: Object - LeetCode stats from API
-->
<template>
  <div class="font-mono">
    <!-- Main Stats -->
    <div v-if="stats.submissionStats" class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber
          :value="totalSolved"
          format="commas"
          :duration="1600"
          priority="primary"
        />
      </div>
      <div class="stat-label">PROBLEMS SOLVED</div>
      <div class="stat-details">
        <AnimatedNumber
          :value="stats.submissionStats.easy.count"
          format="commas"
          :duration="800"
          priority="secondary"
        />
        EASY ·
        <AnimatedNumber
          :value="stats.submissionStats.medium.count"
          format="commas"
          :duration="800"
          :delay="50"
          priority="secondary"
        />
        MEDIUM ·
        <AnimatedNumber
          :value="stats.submissionStats.hard.count"
          format="commas"
          :duration="800"
          priority="tertiary"
        />
        HARD
      </div>

      <!-- Difficulty Distribution Bar -->
      <div class="mt-4">
        <div class="difficulty-bar">
          <div
            class="easy-bar"
            :style="{
              width: `${difficultyPercentages.easy}%`,
              backgroundColor: '#a1a1aa',
            }"
            :title="`Easy: ${formatNumber(
              stats.submissionStats.easy.count
            )} problems`"
          ></div>
          <div
            class="medium-bar"
            :style="{
              width: `${difficultyPercentages.medium}%`,
              backgroundColor: '#71717a',
            }"
            :title="`Medium: ${formatNumber(
              stats.submissionStats.medium.count
            )} problems`"
          ></div>
          <div
            class="hard-bar"
            :style="{
              width: `${difficultyPercentages.hard}%`,
              backgroundColor: '#3f3f46',
            }"
            :title="`Hard: ${formatNumber(
              stats.submissionStats.hard.count
            )} problems`"
          ></div>
        </div>
        <div class="flex justify-between text-2xs text-zinc-500 mt-2">
          <span>EASY</span>
          <span>MEDIUM</span>
          <span>HARD</span>
        </div>
      </div>
    </div>

    <!-- Language Stats -->
    <div v-if="hasLanguageStats" class="mt-8">
      <StatsSectionHeader title="LANGUAGES" />
      <div class="space-y-2">
        <div
          v-for="(item, index) in topLanguages"
          :key="index"
          class="flex justify-between items-center text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300">
            {{ item.language }}
          </span>
          <span class="text-zinc-500 tabular-nums">
            <AnimatedNumber
              :value="item.count"
              format="commas"
              :delay="index * 80"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Submissions -->
    <div v-if="recentAcceptedSubmissions.length" class="mt-8">
      <StatsSectionHeader title="RECENT SOLUTIONS" />
      <div class="space-y-2">
        <div
          v-for="submission in recentAcceptedSubmissions"
          :key="submission.titleSlug"
          class="submission-row"
        >
          <div class="flex-none">
            <span class="text-zinc-400 text-2xs tabular-nums">
              {{ formatDateMinimal(submission.timestamp) }}
            </span>
          </div>
          <a
            :href="`https://leetcode.com/problems/${submission.titleSlug}/`"
            target="_blank"
            class="problem-title"
          >
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
import { computed } from 'vue'
import { format } from 'date-fns/format'
import StatsSectionHeader from './StatsSectionHeader.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { formatNumber } from '~/composables/useNumberFormat'
import type { StatsResponse } from '~/composables/useStats'

type LeetCodeStats = NonNullable<StatsResponse['leetcode']>

const props = defineProps<{
  stats: LeetCodeStats
}>()

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
    medium:
      (props.stats.submissionStats.medium.count / totalSolved.value) * 100,
    hard: (props.stats.submissionStats.hard.count / totalSolved.value) * 100,
  }
})

// Language statistics - top 3 only
const topLanguages = computed(() => {
  const stats: Record<string, number> = {}

  props.stats.recentSubmissions
    .filter((s) => s.statusDisplay === 'Accepted')
    .forEach((submission) => {
      const lang = submission.lang
      stats[lang] = (stats[lang] || 0) + 1
    })

  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([language, count]) => ({ language, count }))
})

const hasLanguageStats = computed(() => topLanguages.value.length > 0)

// Recent submissions - top 3 only
const recentAcceptedSubmissions = computed(() => {
  return props.stats.recentSubmissions
    .filter((s) => s.statusDisplay === 'Accepted')
    .slice(0, 3)
})

// Format utilities
const formatDateMinimal = (timestamp: string): string => {
  const date = new Date(Number.parseInt(timestamp) * 1000)
  return format(date, 'MM.dd')
}

const truncateTitle = (title: string): string => {
  return title.length > 25 ? title.substring(0, 23) + '...' : title
}
</script>

<style scoped>
.individual-stat-large {
  @apply text-center;
}

.difficulty-bar {
  @apply flex h-2 w-full rounded-sm overflow-hidden;
}

.submission-row {
  @apply flex items-center text-xs;
}

.problem-title {
  @apply ml-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900
    dark:hover:text-zinc-100 hover:underline truncate max-w-[16rem];
}

.submission-lang {
  @apply ml-auto text-zinc-500;
}
</style>
