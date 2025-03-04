<template>
  <div class="font-mono">
    <!-- Main Stats -->
    <div v-if="stats.typingStats">
      <IndividualStat :value="stats.typingStats.bestWPM" size="large" label="BEST WPM"
        :details="`${formatNumber(stats.typingStats.testsCompleted)} TESTS · ${formatNumber(stats.typingStats.bestAccuracy)}% ACC`" />
    </div>

    <!-- Recent Tests -->
    <div v-if="stats.typingStats?.recentTests?.length" class="mt-12 space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">RECENT TESTS</h4>

      <div class="space-y-4">
        <div v-for="test in stats.typingStats.recentTests.slice(0, 5)" :key="test.timestamp"
          class="flex items-center justify-between text-sm">
          <div class="flex flex-col">
            <span class="text-zinc-400">{{ formatDate(test.timestamp) }}</span>
            <span class="text-zinc-500 text-xs">{{ formatTestType(test) }}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-zinc-400 tabular-nums">{{ test.wpm }} WPM</span>
            <span class="text-zinc-500 tabular-nums w-16 text-right">{{ test.accuracy }}% ACC</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Average Stats -->
    <div v-if="stats.typingStats" class="mt-12 space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4">AVERAGES</h4>

      <div class="border border-zinc-800/50 p-4 bg-zinc-900/30">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="space-y-1">
            <div class="text-zinc-500">BEST CONSISTENCY</div>
            <div class="text-xl text-zinc-300 tabular-nums">{{ stats.typingStats.bestConsistency }}%</div>
          </div>
          <div class="space-y-1">
            <div class="text-zinc-500">BEST ACCURACY</div>
            <div class="text-xl text-zinc-300 tabular-nums">{{ stats.typingStats.bestAccuracy }}%</div>
          </div>
          <div v-if="stats.typingStats.averageWPM" class="space-y-1">
            <div class="text-zinc-500">AVERAGE WPM</div>
            <div class="text-xl text-zinc-300 tabular-nums">{{ stats.typingStats.averageWPM }}</div>
          </div>
          <div v-if="stats.typingStats.favoriteTestType" class="space-y-1">
            <div class="text-zinc-500">FAVORITE TEST</div>
            <div class="text-zinc-300">{{ formatFavoriteTest(stats.typingStats.favoriteTestType) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'

interface MonkeyTypeTest {
  timestamp: string
  wpm: number
  accuracy: number
  mode?: string
  duration?: number
  language?: string
  wordCount?: number
  difficulty?: string
}

interface MonkeyTypeStats {
  typingStats: {
    bestWPM: number
    testsCompleted: number
    bestAccuracy: number
    bestConsistency: number
    averageWPM?: number
    favoriteTestType?: {
      mode?: string
      duration?: number
      wordCount?: number
    }
    recentTests?: Array<MonkeyTypeTest>
  }
}

const props = defineProps<{
  stats: MonkeyTypeStats
}>()

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (timestamp: string): string => {
  return format(new Date(timestamp), 'MMM d, h:mm a')
}

const formatTestType = (test: MonkeyTypeTest): string => {
  const parts = []

  // Add duration or word count - this is the most important info
  if (test.duration) {
    parts.push(`${test.duration}s TEST`)
  } else if (test.wordCount) {
    parts.push(`${test.wordCount} WORDS`)
  }

  // Add mode if available and not "time" (since we already show duration)
  if (test.mode && test.mode.toLowerCase() !== 'time') {
    parts.push(test.mode.toUpperCase())
  }

  // Add language if available and not English
  if (test.language && test.language.toLowerCase() !== 'english') {
    parts.push(test.language.toUpperCase())
  }

  // Add difficulty if available
  if (test.difficulty) {
    parts.push(test.difficulty.toUpperCase())
  }

  return parts.join(' · ') || 'UNKNOWN TEST TYPE'
}

const formatFavoriteTest = (favoriteTest: { mode?: string, duration?: number, wordCount?: number }): string => {
  const parts = []

  // Add duration or word count - this is the most important info
  if (favoriteTest.duration) {
    parts.push(`${favoriteTest.duration}s TEST`)
  } else if (favoriteTest.wordCount) {
    parts.push(`${favoriteTest.wordCount} WORDS`)
  }

  // Add mode if available and not "time" (since we already show duration)
  if (favoriteTest.mode && favoriteTest.mode.toLowerCase() !== 'time') {
    parts.push(favoriteTest.mode.toUpperCase())
  }

  return parts.join(' · ') || 'UNKNOWN TEST TYPE'
}
</script>