<template>
  <div v-if="stats" class="space-y-10 font-mono">
    <!-- Primary Stats -->
    <div>
      <IndividualStat
        :value="totalCommits"
        size="large"
        label="GITHUB COMMITS"
        :details="`${stats.stats.totalRepos} REPOS · ${stats.stats.followers || 0} FOLLOWERS`"
      />
    </div>

    <!-- Activity Calendar -->
    <div v-if="hasCommits">
      <ActivityCalendar
        title="COMMIT ACTIVITY"
        :active-dates="commitActivityDates"
        :active-color="'#71717a'"
      />
    </div>

    <!-- Commit Types Analysis -->
    <div v-if="commitTypes.length">
      <h4 class="section-subheader">COMMIT PATTERNS</h4>
      <div class="space-y-3">
        <div
          v-for="type in commitTypes.slice(0, 5)"
          :key="type.type"
          class="flex items-start gap-2"
        >
          <div
            class="w-3 h-3 mt-1 flex-shrink-0 rounded-sm"
            :class="getTypeClass(type.type)"
          ></div>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <span class="text-xs text-zinc-700 dark:text-zinc-300">{{
                type.type
              }}</span>
              <span class="text-2xs text-zinc-500 tabular-nums"
                >{{ type.count }} ({{ Math.round(type.percentage) }}%)</span
              >
            </div>
            <div class="category-bar-bg mt-1">
              <div
                class="category-bar-fill"
                :class="getTypeClass(type.type)"
                :style="{
                  width: `${type.percentage}%`
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Projects -->
    <div v-if="hasCommits">
      <h4 class="section-subheader">RECENT COMMITS</h4>
      <div class="space-y-3">
        <div
          v-for="project in recentProjects.slice(0, 3)"
          :key="project.name"
          class="project-item"
        >
          <div class="flex justify-between items-start">
            <a
              :href="project.url"
              target="_blank"
              rel="noopener"
              class="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors font-medium"
            >
              {{ project.name }}
            </a>
            <span class="text-2xs text-zinc-500">{{
              formatRelativeTime(project.lastCommit)
            }}</span>
          </div>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
            "{{ project.lastMessage }}"
          </p>
          <div class="flex justify-between text-2xs text-zinc-500 mt-2">
            <span>{{ project.commitCount }} commits</span>
            <div class="flex items-center gap-1">
              <span
                v-for="type in project.topTypes"
                :key="type"
                class="px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wider"
                :class="getTypeClass(type)"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- GitHub Insights -->
    <div v-if="hasCommits">
      <h4 class="section-subheader">GITHUB INSIGHTS</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="insight-card p-3 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-md"
        >
          <div class="text-xs text-zinc-500 mb-1">LATEST STREAK</div>
          <div class="text-zinc-700 dark:text-zinc-300">
            {{ getContributionStreak }} days
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="data-unavailable">GITHUB_DATA_UNAVAILABLE</div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { format, formatDistance } from 'date-fns'
import IndividualStat from './IndividualStat.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import type { StatsResponse } from '~/composables/useStats'
import { formatNumber } from '~/composables/useNumberFormat'

// Stat summary component
const StatSummary = (
  props: { value: number | string; label: string },
  { slots }: { slots: any }
) => {
  return h('div', { class: 'stat-summary' }, [
    h('div', { class: 'stat-value' }, props.value),
    h('div', { class: 'stat-label' }, [props.label, slots.default?.()])
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
  repository: {
    name: string
    url: string
  }
  message: string
  occurredAt: string
  url: string
  type: string
}

interface GitHubStats {
  stats: {
    totalCommits?: number
    totalContributions?: number
    totalRepos: number
    totalPRs?: number
    totalIssues?: number
    followers?: number
    following?: number
  }
  detail?: {
    topRepos?: GitHubRepo[]
    commits?: GitHubCommit[]
    commitTypes?: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  contributions?: number[]
  dates?: string[]
}

interface ProjectSummary {
  name: string
  url: string
  commitCount: number
  lastCommit: string
  lastMessage: string
  topTypes: string[]
}

const props = defineProps<{
  stats?: GitHubStats | null
}>()

// Get totalCommits safely - use either totalCommits or totalContributions
const totalCommits = computed(() => {
  return (
    props.stats?.stats?.totalCommits ||
    props.stats?.stats?.totalContributions ||
    0
  )
})

// Data availability checks
const hasCommits = computed(() => {
  return !!props.stats?.detail?.commits?.length
})

const hasRepos = computed(() => {
  return !!props.stats?.detail?.topRepos?.length
})

// Get commit types
const commitTypes = computed(() => {
  return props.stats?.detail?.commitTypes || []
})

// Recent projects - derived from commit data
const recentProjects = computed(() => {
  if (!props.stats?.detail?.commits) return []

  const projects = new Map<string, ProjectSummary>()
  const typesByRepo = new Map<string, Map<string, number>>()

  // Process commits to group by repository
  props.stats.detail.commits.forEach((commit) => {
    const repoName = commit.repository.name
    const repoUrl = commit.repository.url
    const commitType = commit.type || 'other'

    // Count commit types for this repo
    if (!typesByRepo.has(repoName)) {
      typesByRepo.set(repoName, new Map())
    }
    const typeMap = typesByRepo.get(repoName)!
    typeMap.set(commitType, (typeMap.get(commitType) || 0) + 1)

    // Update or create repository summary
    if (!projects.has(repoName)) {
      projects.set(repoName, {
        name: repoName,
        url: repoUrl,
        commitCount: 0,
        lastCommit: commit.occurredAt,
        lastMessage: commit.message,
        topTypes: []
      })
    }

    const project = projects.get(repoName)!
    project.commitCount++

    // Update last commit if this one is newer
    const currentLastCommit = new Date(project.lastCommit)
    const thisCommit = new Date(commit.occurredAt)
    if (thisCommit > currentLastCommit) {
      project.lastCommit = commit.occurredAt
      project.lastMessage = commit.message
    }
  })

  // Calculate top types for each repo
  typesByRepo.forEach((typeMap, repoName) => {
    const project = projects.get(repoName)
    if (project) {
      // Sort types by count and take top 2
      project.topTypes = Array.from(typeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type)
    }
  })

  // Sort by most recent commit and take top 5
  return Array.from(projects.values())
    .sort(
      (a, b) =>
        new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime()
    )
    .slice(0, 5)
})

// Formatting utilities
const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'MMM d')
}

function formatRelativeTime(dateStr: string) {
  return formatDistance(new Date(dateStr), new Date(), { addSuffix: true })
}

function getTypeClass(type: string) {
  const classes = {
    feat: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
    fix: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    docs: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    style:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    refactor:
      'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
    test: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    chore: 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300',
    other: 'bg-zinc-100 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400'
  }

  // @ts-ignore - Type might not be in our predefined map
  return classes[type] || classes.other
}

// Data for activity calendar
const commitActivityDates = computed(() => {
  if (!props.stats?.detail?.commits) return []

  // Convert commit dates to yyyy-MM-dd format
  const dates = props.stats.detail.commits.map((commit) => {
    const date = new Date(commit.occurredAt)
    return format(date, 'yyyy-MM-dd')
  })

  // Return unique dates (a day with multiple commits should only count once)
  return [...new Set(dates)]
})

// Most productive date (not day of week)
const getMostProductiveDate = computed(() => {
  if (!props.stats?.detail?.commits?.length) return 'No data'

  // Count commits by date
  const dateCount = new Map<string, number>()

  props.stats.detail.commits.forEach((commit) => {
    const date = new Date(commit.occurredAt)
    const dateKey = format(date, 'yyyy-MM-dd')
    dateCount.set(dateKey, (dateCount.get(dateKey) || 0) + 1)
  })

  // Find date with most commits
  let maxDate = ''
  let maxCount = 0

  dateCount.forEach((count, date) => {
    if (count > maxCount) {
      maxCount = count
      maxDate = date
    }
  })

  if (!maxDate) return 'No data'

  // Format the date as MMM D (e.g., Jan 15)
  return format(new Date(maxDate), 'MMM d')
})

const getContributionStreak = computed(() => {
  if (!commitActivityDates.value.length) return 0

  // Sort dates
  const sortedDates = [...commitActivityDates.value].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Count consecutive days from most recent
  let streak = 1
  let currentDate = new Date(sortedDates[0])

  for (let i = 1; i < sortedDates.length; i++) {
    const nextDate = new Date(sortedDates[i])
    const dayDiff = Math.round(
      (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (dayDiff === 1) {
      streak++
      currentDate = nextDate
    } else if (dayDiff > 1) {
      break
    }
  }

  return streak
})
</script>

<style scoped>
.section-subheader {
  @apply text-2xs tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/30 pb-1 mb-3;
}

.stat-summary {
  @apply space-y-2;
}

.stat-value {
  @apply text-xl font-mono tabular-nums;
}

.stat-label {
  @apply text-xs tracking-wider text-zinc-500;
}

.category-bar-bg {
  @apply h-1.5 rounded-sm overflow-hidden bg-transparent dark:bg-zinc-800/10 border-b border-zinc-200/10 dark:border-zinc-800/30;
}

.category-bar-fill {
  @apply h-full rounded-sm;
}

.project-item {
  @apply p-3 bg-zinc-100/50 dark:bg-zinc-900/20 rounded-md;
}

.data-unavailable {
  @apply text-sm text-zinc-500 dark:text-zinc-400 font-mono;
}

/* Custom text size smaller than xs */
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}
</style>
