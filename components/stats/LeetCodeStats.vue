<template>
  <div>
    <!-- Contest Stats -->
    <div v-if="stats.contestStats">
      <IndividualStat :value="stats.contestStats.rating" size="large" label="CODING EXERCISES"
        :details="`TOP ${formatPercent(stats.contestStats.topPercentage / 100)} OF ${formatNumber(stats.contestStats.totalParticipants)} PARTICIPANTS`" />
    </div>

    <!-- Problem Stats -->
    <div v-if="stats.submissionStats" class="mt-12">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">PROBLEM STATS</h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Easy</span>
          <div class="flex items-center space-x-4">
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.easy.count) }} Solved</span>
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.easy.submissions) }}
              Submissions</span>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Medium</span>
          <div class="flex items-center space-x-4">
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.medium.count) }}
              Solved</span>
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.medium.submissions) }}
              Submissions</span>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Hard</span>
          <div class="flex items-center space-x-4">
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.hard.count) }} Solved</span>
            <span class="text-gray-500 tabular-nums">{{ formatNumber(stats.submissionStats.hard.submissions) }}
              Submissions</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Submissions -->
    <div v-if="stats.recentSubmissions?.length" class="mt-12">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">RECENT SUBMISSIONS</h4>
      <div class="space-y-4">
        <div v-for="submission in stats.recentSubmissions.slice(0, 5)" :key="submission.titleSlug"
          class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ submission.title }}</span>
          <div class="flex items-center space-x-4">
            <span class="text-gray-500 font-mono text-xs">{{ submission.lang }}</span>
            <span :class="submissionStatusClass(submission.statusDisplay)" class="font-medium tracking-wider">
              {{ submission.statusDisplay }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Stats -->
    <div v-if="stats.submissionStats" class="mt-12">
      <div class="flex flex-col items-end space-y-4">
        <div class="flex items-center justify-between w-full text-sm">
          <span class="text-gray-400">Total Problems</span>
          <span class="text-gray-500 tabular-nums">{{ formatNumber(totalSolved) }} / {{ formatNumber(totalSubmissions)
            }}</span>
        </div>
        <span class="text-[0.65rem] text-gray-400 tracking-wider">via LeetCode</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber, formatPercent } from '~/composables/useNumberFormat'

type LeetCodeStats = NonNullable<StatsResponse['leetcode']>

const props = defineProps<{
  stats: LeetCodeStats
}>()

const totalSolved = computed(() => {
  if (!props.stats.submissionStats) return 0
  return (
    props.stats.submissionStats.easy.count +
    props.stats.submissionStats.medium.count +
    props.stats.submissionStats.hard.count
  )
})

const totalSubmissions = computed(() => {
  if (!props.stats.submissionStats) return 0
  return (
    props.stats.submissionStats.easy.submissions +
    props.stats.submissionStats.medium.submissions +
    props.stats.submissionStats.hard.submissions
  )
})

const submissionStatusClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'text-green-500'
    case 'wrong answer':
      return 'text-red-500'
    case 'time limit exceeded':
      return 'text-yellow-500'
    default:
      return 'text-gray-500'
  }
}
</script>