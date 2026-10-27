<!--
  @file GitHubStats.vue
  @description GITHUB section of /stats: commit + repo totals, a 30-day
    commit strip (ActivityCalendar), latest commit per repo (top 10), and a
    streak. Everything below the totals is derived from detail.commits, the
    recent-commit list server/api/github.get.ts returns, so it only covers
    what that list reaches back to. Wired in pages/stats.vue via stats.github.
  @props stats?: GitHubStats | null - the /api/github payload
  StatsSectionHeader and StatsDataState are used via Nuxt auto-import.
-->
<script setup lang="ts">
// Explicit imports: these auto-register as UiAnimatedNumber /
// StatsActivityCalendar, so the bare tags rendered as unknown empty elements
// (the "GITHUB COMMITS" / "TOTAL REPOS" labels sat under nothing).
import AnimatedNumber from '../ui/AnimatedNumber.vue'
import ActivityCalendar from './ActivityCalendar.vue'
import { format, formatDistance } from '~/utils/date'

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
    url?: string
  }
  message: string
  occurredAt: string
  url?: string
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

// ── Derived from detail.commits ─────────────────────────────

// Falls back to contributions when the API has no commit total.
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

const recentProjects = computed(() => {
  if (!props.stats?.detail?.commits) return []

  const projects = new Map<string, ProjectSummary>()
  const typesByRepo = new Map<string, Map<string, number>>()

  props.stats.detail.commits.forEach((commit) => {
    const repoName = commit.repository.name
    const repoUrl = commit.repository.url
    const commitType = commit.type || 'other'

    if (!typesByRepo.has(repoName)) {
      typesByRepo.set(repoName, new Map())
    }
    const typeMap = typesByRepo.get(repoName)!
    typeMap.set(commitType, (typeMap.get(commitType) || 0) + 1)

    if (!projects.has(repoName)) {
      projects.set(repoName, {
        name: repoName,
        url: repoUrl,
        commitCount: 0,
        lastCommit: commit.occurredAt,
        lastMessage: commit.message,
        topTypes: [],
      })
    }

    const project = projects.get(repoName)!
    project.commitCount++

    const currentLastCommit = new Date(project.lastCommit)
    const thisCommit = new Date(commit.occurredAt)
    if (thisCommit > currentLastCommit) {
      project.lastCommit = commit.occurredAt
      project.lastMessage = commit.message
    }
  })

  typesByRepo.forEach((typeMap, repoName) => {
    const project = projects.get(repoName)
    if (project) {
      project.topTypes = Array.from(typeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type)
    }
  })

  return Array.from(projects.values())
    .sort(
      (a, b) =>
        new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime()
    )
    .slice(0, 10)
})

const getContributionStreak = computed(() => {
  if (!commitActivityDates.value.length) return 0

  const sortedDates = [...commitActivityDates.value].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Count consecutive days back from the most recent commit day, which may
  // not be today: an old run still shows as the streak.
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
    addSuffix: true,
  })
}
</script>

<template>
  <div
    v-if="stats"
    class="grid gap-x-4 gap-y-6 auto-fit-columns font-mono overflow-hidden"
  >
    <div class="col-span-full">
      <div class="flex justify-around items-start gap-2 py-2">
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
            class="stat-label text-xs text-zinc-500 uppercase tracking-wider mt-2"
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
            class="stat-label text-xs text-zinc-500 uppercase tracking-wider mt-2"
          >
            TOTAL REPOS
          </div>
          <!-- eslint-enable max-len,vue/max-len -->
        </div>
      </div>
    </div>

    <!-- ── Commit detail ─────────── -->
    <!-- No title passed, so ActivityCalendar adds its default "ACTIVITY"
         header under this one. -->
    <div v-if="hasCommits" class="col-span-full">
      <StatsSectionHeader title="GITHUB COMMIT ACTIVITY" />
      <ActivityCalendar
        :active-dates="commitActivityDates"
        :active-color="'#71717a'"
      />
    </div>

    <div v-if="hasCommits" class="break-inside-avoid overflow-hidden min-w-0">
      <StatsSectionHeader title="RECENT GITHUB COMMITS" />
      <div class="space-y-2">
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

    <div v-if="hasCommits" class="break-inside-avoid overflow-hidden min-w-0">
      <StatsSectionHeader title="GITHUB STREAK" />
      <div class="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
        {{ getContributionStreak }} days
      </div>
    </div>
  </div>
  <StatsDataState v-else message="GitHub data unavailable" />
</template>
