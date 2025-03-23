<template>
  <div v-if="stats" class="space-y-16 font-mono">
    <!-- Primary Stats -->
    <div>
      <IndividualStat :value="stats.stats.totalCommits" size="large" label="GITHUB COMMITS"
        :details="`${stats.stats.totalRepos} REPOS · ${stats.stats.totalPRs || 0} PRS`" />
    </div>

    <!-- Activity Calendar -->
    <div v-if="hasCommits">
      <ActivityCalendar title="COMMIT ACTIVITY" :active-dates="commitActivityDates" :active-color="'#4b5563'" />
    </div>

    <!-- Commit Activity -->
    <div v-if="hasCommits" class="space-y-8">
      <h4 class="section-subheader">COMMIT STATISTICS</h4>

      <div class="grid grid-cols-2 gap-8 mb-8">
        <StatSummary :value="commitStats.mostActiveDay.count" :label="`MOST ACTIVE DAY`">
          <div class="text-xs">{{ commitStats.mostActiveDay.date }}</div>
        </StatSummary>

        <StatSummary :value="commitStats.averagePerDay" label="AVG COMMITS PER DAY" />
      </div>

      <!-- Recent Commits Chart -->
      <div v-if="processedCommits.length" class="space-y-4">
        <div v-for="commit in processedCommits" :key="commit.date" class="commit-row">
          <div class="date-label">{{ formatDate(commit.date) }}</div>
          <div class="commit-bar-container">
            <div class="commit-bar" :style="{ width: `${(commit.count / commitStats.maxCommits) * 100}%` }" />
          </div>
          <div class="commit-count">{{ commit.count }}</div>
        </div>
      </div>
    </div>

    <!-- Top Repos -->
    <div v-if="hasRepos" class="space-y-6">
      <h4 class="section-subheader">TOP REPOSITORIES</h4>

      <div class="space-y-4">
        <div v-for="repo in topRepos" :key="repo.name" class="repo-row">
          <div class="flex flex-col">
            <span class="text-zinc-400">{{ repo.name }}</span>
            <span class="text-zinc-500 text-xs">{{ repo.language }}</span>
          </div>
          <div class="text-zinc-500 tabular-nums">
            {{ repo.stars }} ⭐
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="data-unavailable">
    GITHUB_DATA_UNAVAILABLE
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

// Stat summary component
const StatSummary = (props, { slots }) => {
  return h('div', { class: 'stat-summary' }, [
    h('div', { class: 'stat-value' }, props.value),
    h('div', { class: 'stat-label' }, [
      props.label,
      slots.default?.()
    ])
  ])
}

interface GitHubRepo {
  name: string
  url: string
  stars: number
  forks: number
  language: string
  description?: string
}

interface GitHubCommit {
  sha: string
  date: string
  message: string
  repo: string
}

interface GitHubStats {
  stats: {
    totalCommits: number
    totalRepos: number
    totalPRs?: number
    totalIssues?: number
    followers?: number
    following?: number
  }
  detail?: {
    topRepos?: GitHubRepo[]
    commits?: GitHubCommit[]
  }
}

const props = defineProps<{
  stats?: GitHubStats | null
}>()

// Data availability checks
const hasCommits = computed(() => {
  return !!props.stats?.detail?.commits?.length
})

const hasRepos = computed(() => {
  return !!props.stats?.detail?.topRepos?.length
})

// Data processing
const processedCommits = computed(() => {
  if (!props.stats?.detail?.commits) return []

  const commits = props.stats.detail.commits
  // Group commits by date
  const grouped = {}

  commits.forEach(commit => {
    const date = new Date(commit.date)
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        count: 0,
        commits: []
      }
    }

    grouped[dateKey].count++
    grouped[dateKey].commits.push(commit)
  })

  // Convert to array and sort by date
  return Object.values(grouped)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7) // Show most recent 7 days
})

// Calculated stats
const commitStats = computed(() => {
  if (!processedCommits.value.length) {
    return {
      maxCommits: 0,
      averagePerDay: 0,
      mostActiveDay: { date: '', count: 0 }
    }
  }

  // Find most active day
  const sortedByCount = [...processedCommits.value].sort((a, b) => b.count - a.count)
  const maxCommits = sortedByCount[0].count

  // Calculate average commits per day
  const totalCommits = processedCommits.value.reduce((sum, day) => sum + day.count, 0)
  const averagePerDay = Math.round(totalCommits / processedCommits.value.length)

  return {
    maxCommits,
    averagePerDay,
    mostActiveDay: {
      date: formatDate(sortedByCount[0].date),
      count: sortedByCount[0].count
    }
  }
})

// Top repositories
const topRepos = computed(() => {
  return props.stats?.detail?.topRepos?.slice(0, 5) || []
})

// Formatting utilities
const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'MMM d')
}

// Data for activity calendar
const commitActivityDates = computed(() => {
  if (!props.stats?.detail?.commits) return []

  // Convert commit dates to yyyy-MM-dd format
  const dates = props.stats.detail.commits.map(commit => {
    const date = new Date(commit.date)
    return format(date, 'yyyy-MM-dd')
  })

  // Return unique dates (a day with multiple commits should only count once)
  return [...new Set(dates)]
})
</script>

<style scoped>
.section-subheader {
  @apply text-xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/50 pb-2 mb-4;
}

.stat-summary {
  @apply space-y-2;
}

.stat-value {
  @apply text-2xl font-mono tabular-nums;
}

.stat-label {
  @apply text-xs tracking-wider text-zinc-500;
}

.commit-row {
  @apply flex items-center gap-4;
}

.date-label {
  @apply w-16 text-xs text-zinc-500;
}

.commit-bar-container {
  @apply flex-grow h-2 bg-zinc-800/50 rounded-none overflow-hidden;
}

.commit-bar {
  @apply h-full bg-zinc-600 rounded-none;
}

.commit-count {
  @apply w-8 text-xs text-zinc-500 tabular-nums text-right;
}

.repo-row {
  @apply flex items-center justify-between text-sm;
}

.data-unavailable {
  @apply text-sm text-zinc-400 font-mono;
}
</style>