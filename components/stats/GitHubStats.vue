<template>
  <div class="space-y-16">
    <!-- Top Stats -->
    <div class="space-y-8">
      <IndividualStat :value="stats.stats.totalContributions" size="large" label="ALL-TIME CONTRIBUTIONS"
        :details="`${formatNumber(stats.stats.totalRepos)} PUBLIC REPOSITORIES`" />

      <div class="grid grid-cols-2 gap-8">
        <IndividualStat :value="recentCommits" size="medium" label="RECENT COMMITS"
          :details="`${formatNumber(averageCommitsPerDay)} DAILY AVERAGE`" />

        <IndividualStat :value="stats.stats.followers" size="medium" label="GITHUB FOLLOWERS"
          :details="`FOLLOWING ${formatNumber(stats.stats.following)}`" />
      </div>
    </div>

    <!-- Recent Commits -->
    <div v-if="commitsByRepo.length" class="space-y-8">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light">RECENT ACTIVITY</h4>
      <div class="space-y-8">
        <div v-for="repo in commitsByRepo" :key="repo.name" class="space-y-3">
          <!-- Repo Header -->
          <div class="flex items-center space-x-2 text-sm text-gray-400">
            <a :href="repo.url" target="_blank" class="hover:text-gray-300">
              {{ repo.name }}
            </a>
            <span class="text-gray-600">&middot;</span>
            <span class="text-gray-500">{{ repo.commits.length }} commits</span>
          </div>

          <!-- Commits -->
          <div class="space-y-2 pl-4 border-l border-gray-800">
            <div v-for="commit in repo.commits.slice(0, 3)" :key="commit.url"
              class="flex items-center justify-between text-sm group">
              <a :href="commit.url" target="_blank" class="text-gray-500 truncate max-w-[70%] hover:text-gray-300">
                {{ commit.message }}
              </a>
              <span class="text-gray-600 text-xs">
                {{ formatDate(commit.occurredAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Commit Type Breakdown -->
    <div v-if="commitTypeBreakdown.length" class="space-y-4">
      <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light">COMMIT TYPES</h4>
      <div class="space-y-2">
        <div v-for="type in commitTypeBreakdown" :key="type.type" class="flex items-center space-x-3 text-sm group"
          :title="`${type.count} commits (${type.percentage.toFixed(1)}%)`">
          <span class="w-16 text-gray-400">{{ type.type }}</span>
          <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all group-hover:opacity-100 opacity-75"
              :class="getTypeColor(type.type)" :style="{ width: `${type.percentage}%` }" />
          </div>
          <span class="text-gray-500 tabular-nums w-12 text-right">
            {{ Math.round(type.percentage) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IndividualStat from './IndividualStat.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

type GitHubStats = NonNullable<StatsResponse['github']>

const props = defineProps<{
  stats: GitHubStats
}>()

const recentCommits = computed(() =>
  props.stats.detail.commits.length || 0
)

const averageCommitsPerDay = computed(() => {
  if (!props.stats.detail.commits.length) return 0
  const days = 7 // We're getting a week's worth
  return Math.round(recentCommits.value / days)
})

const commitsByRepo = computed(() => {
  console.log('Processing commits:', props.stats.detail.commits)
  // Group commits by repo
  const grouped = props.stats.detail.commits.reduce((acc, commit) => {
    const repo = commit.repository
    if (!acc[repo.name]) {
      acc[repo.name] = {
        name: repo.name,
        url: repo.url,
        commits: []
      }
    }
    acc[repo.name].commits.push(commit)
    return acc
  }, {} as Record<string, { name: string; url: string; commits: typeof props.stats.detail.commits }>)

  console.log('Grouped commits:', grouped)
  // Convert to array and sort by most recent commit
  return Object.values(grouped).sort((a, b) => {
    const aDate = new Date(a.commits[0].occurredAt)
    const bDate = new Date(b.commits[0].occurredAt)
    return bDate.getTime() - aDate.getTime()
  })
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const typeColors = {
  feat: 'bg-emerald-500/30',
  fix: 'bg-red-500/30',
  docs: 'bg-blue-500/30',
  style: 'bg-purple-500/30',
  refactor: 'bg-yellow-500/30',
  build: 'bg-orange-500/30',
  blog: 'bg-pink-500/30',
  scaffold: 'bg-indigo-500/30',
  chore: 'bg-gray-500/30',
  other: 'bg-gray-700/30'
} as const

const getTypeColor = (type: string) =>
  typeColors[type as keyof typeof typeColors] || typeColors.other

const commitTypeBreakdown = computed(() =>
  props.stats.detail.commitTypes
)
</script>