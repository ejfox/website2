<template>
  <div>
    <!-- Main Stats -->
    <div v-if="stats.typingStats">
      <IndividualStat :value="stats.typingStats.bestWPM" size="large" label="BEST WPM"
        :details="`${formatNumber(stats.typingStats.testsCompleted)} TESTS · ${formatNumber(stats.typingStats.bestAccuracy)}% ACC`" />
    </div>

    <!-- Recent Tests -->
    <div v-if="stats.typingStats?.recentTests?.length" class="mt-12">
      <h4 class="text-sm tracking-wider text-gray-500 mb-6">RECENT TESTS</h4>
      <div class="space-y-2">
        <div v-for="test in stats.typingStats.recentTests.slice(0, 5)" :key="test.timestamp"
          class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ formatDate(test.timestamp) }}</span>
          <div class="flex items-center space-x-4">
            <span class="text-gray-500">{{ test.wpm }} WPM</span>
            <span :class="accuracyClass(test.accuracy)">{{ test.accuracy }}% ACC</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Average Stats -->
    <div v-if="stats.typingStats" class="mt-12">
      <h4 class="text-sm tracking-wider text-gray-500 mb-6">AVERAGES</h4>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Best Consistency</span>
          <span class="text-gray-500">{{ stats.typingStats.bestConsistency }}%</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Best Accuracy</span>
          <span class="text-gray-500">{{ stats.typingStats.bestAccuracy }}%</span>
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

interface MonkeyTypeStats {
  typingStats: {
    bestWPM: number
    testsCompleted: number
    bestAccuracy: number
    bestConsistency: number
    recentTests?: Array<{
      timestamp: string
      wpm: number
      accuracy: number
    }>
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

const accuracyClass = (accuracy: number): string => {
  if (accuracy >= 98) return 'text-green-500'
  if (accuracy >= 95) return 'text-yellow-500'
  return 'text-gray-500'
}
</script>