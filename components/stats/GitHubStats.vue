<template>
  <div v-if="stats" class="space-y-16">
    <!-- Primary Stats -->
    <div class="space-y-12">
      <IndividualStat :value="stats.stats.totalContributions" size="large" label="ALL-TIME CODE CONTRIBUTIONS"
        :details="`${formatNumber(stats.stats.totalRepos)} PUBLIC REPOSITORIES`" />

      <div class="grid grid-cols-2 gap-8">
        <IndividualStat :value="yearlyContributions" size="medium" label="CONTRIBUTIONS THIS YEAR"
          :details="`${formatNumber(averageContributionsPerDay)} DAILY AVERAGE`" />

        <IndividualStat :value="stats.stats.followers" size="medium" label="GITHUB FOLLOWERS"
          :details="`FOLLOWING ${formatNumber(stats.stats.following)}`" />
      </div>
    </div>

    <!-- Contribution Heatmap -->
    <div v-if="stats.contributions?.length">
      <ContributionHeatmap :data="contributionData" :show-legend="true" title="ACTIVITY THIS YEAR"
        subtitle="via GitHub" />

      <div class="mt-4 text-xs text-gray-500 space-y-1">
        <div>
          <span class="font-medium">Most Active Day:</span>
          {{ mostActiveDay.date }} with {{ mostActiveDay.count }} contributions
        </div>
        <div>
          <span class="font-medium">Active Days:</span>
          {{ activeDays }} days ({{ Math.round(activeDaysPercentage) }}% of year)
        </div>
      </div>
    </div>

    <!-- Repository Stats -->
    <div v-if="stats.repositories?.length">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-8">MOST STARRED PROJECTS</h4>
      <div class="space-y-4">
        <div v-for="(repo, index) in stats.repositories.slice(0, 5)" :key="repo.name + index"
          class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ repo.name }}</span>
          <div class="flex items-center space-x-6">
            <span class="text-gray-500 tabular-nums">{{ formatNumber(repo.stars) }} stars</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-gray-400">
    GitHub data unavailable
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import ContributionHeatmap from '../ContributionHeatmap.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

type GitHubStats = NonNullable<StatsResponse['github']>

const props = defineProps<{
  stats?: GitHubStats | null
}>()

const yearlyContributions = computed(() => {
  if (!props.stats?.contributions) return 0
  return props.stats.contributions.reduce((sum, count) => sum + count, 0)
})

const activeDays = computed(() => {
  if (!props.stats?.contributions) return 0
  return props.stats.contributions.filter(count => count > 0).length
})

const activeDaysPercentage = computed(() => {
  if (!props.stats?.contributions) return 0
  return (activeDays.value / props.stats.contributions.length) * 100
})

const averageContributionsPerDay = computed(() => {
  if (!props.stats?.contributions) return 0
  return Math.round(yearlyContributions.value / activeDays.value)
})

const mostActiveDay = computed(() => {
  if (!props.stats?.contributions || !props.stats?.dates) return { date: '', count: 0 }
  const maxIndex = props.stats.contributions.indexOf(Math.max(...props.stats.contributions))
  return {
    date: new Date(props.stats.dates[maxIndex]).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    count: props.stats.contributions[maxIndex]
  }
})

const contributionData = computed(() => {
  if (!props.stats?.contributions || !props.stats?.dates) return []
  return props.stats.contributions.map((count: number, i: number) => ({
    date: props.stats!.dates[i],
    count
  }))
})
</script>