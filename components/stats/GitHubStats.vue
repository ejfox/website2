<template>
  <div
    v-if="stats"
    class="grid gap-1 auto-fit-columns font-mono overflow-hidden"
  >
    <!-- Primary Stats -->
    <div class="col-span-full">
      <div class="flex justify-around items-start gap-8 py-4">
        <div class="text-center">
          <div class="stat-value text-2xl font-bold">
            <AnimatedNumber
              :value="totalCommits"
              format="commas"
              :duration="1600"
              priority="primary"
              :decimals="0"
            />
          </div>
          <!-- eslint-disable max-len,vue/max-len -->
          <div
            class="stat-label text-xs text-zinc-500 uppercase tracking-widest mt-1"
          >
            GITHUB COMMITS
          </div>
          <!-- eslint-enable max-len,vue/max-len -->
        </div>
        <div class="text-center">
          <div class="stat-value text-2xl font-bold">
            <AnimatedNumber
              :value="stats.stats.totalRepos"
              format="default"
              :duration="1600"
              priority="secondary"
            />
          </div>
          <!-- eslint-disable max-len,vue/max-len -->
          <div
            class="stat-label text-xs text-zinc-500 uppercase tracking-widest mt-1"
          >
            REPOS
          </div>
          <!-- eslint-enable max-len,vue/max-len -->
        </div>
      </div>
    </div>

    <!-- Activity Calendar -->
    <div v-if="hasCommits" class="col-span-full">
      <StatsSectionHeader title="COMMIT ACTIVITY" />
      <div class="text-zinc-500 mb-2 text-xs leading-[10px]">
        PAST 30 DAYS · {{ commitActivityDates.length }} ACTIVE DAYS
      </div>
      <ActivityCalendar
        :active-dates="commitActivityDates"
        :active-color="'#71717a'"
      />
    </div>

    <!-- Recent Commits -->
    <div v-if="hasCommits" class="break-inside-avoid overflow-hidden min-w-0">
      <StatsSectionHeader title="RECENT COMMITS" />
      <div class="space-y-1.5">
        <div
          v-for="project in recentProjects.slice(0, 10)"
          :key="project.name"
          class="flex items-baseline justify-between text-xs"
        >
          <div class="flex items-baseline gap-2 min-w-0 flex-1">
            <!-- eslint-disable max-len,vue/max-len -->
            <a
              :href="project.url"
              target="_blank"
              rel="noopener"
              class="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors font-medium truncate text-xs"
            >
              <!-- eslint-enable max-len,vue/max-len -->
              {{ project.name }}
            </a>
            <span
              class="text-zinc-600 dark:text-zinc-400 truncate flex-1 text-xs"
            >
              {{ project.lastMessage }}
            </span>
          </div>
          <span class="text-zinc-500 flex-shrink-0 ml-2 tabular-nums text-xs">
            {{ formatRelativeTime(project.lastCommit) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Contribution Streak -->
    <div v-if="hasCommits" class="break-inside-avoid overflow-hidden min-w-0">
      <StatsSectionHeader title="LATEST STREAK" />
      <div class="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
        {{ getContributionStreak }} days
      </div>
    </div>
  </div>
  <StatsDataState v-else message="GitHub data unavailable" />
</template>

<script setup lang="ts">
// Nuxt 4 auto-imports components!
import { format } from 'date-fns/format'
import { formatDistance } from 'date-fns'

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

interface ProjectSummary {
  name: string
  url: string
  commitCount: number
  lastCommit: string
  lastMessage: string
  topTypes: string[]
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

const props = defineProps<{
  stats?: GitHubStats | null
}>()

const totalCommits = computed(() => {
  return (
    props.stats?.stats?.totalCommits ||
    props.stats?.stats?.totalContributions ||
    0
  )
})

const hasCommits = computed(() => {
  return !!props.stats?.detail?.commits?.length
})

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

// Recent projects with commit summaries
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

  // Sort by most recent commit and take top 10
  return Array.from(projects.values())
    .sort(
      (a, b) =>
        new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime()
    )
    .slice(0, 10)
})

// Contribution streak calculation
const getContributionStreak = computed(() => {
  if (!commitActivityDates.value.length) return 0

  // Sort dates
  const sortedDates = [...commitActivityDates.value].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Count consecutive days from most recent
  let streak = 1
  const firstDate = sortedDates[0]
  if (!firstDate) return 0
  let currentDate = new Date(firstDate)

  for (let i = 1; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i]
    if (!dateStr) continue
    const nextDate = new Date(dateStr)
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

function formatRelativeTime(dateStr: string) {
  return formatDistance(new Date(dateStr), new Date(), {
    addSuffix: true
  })
}
</script>
