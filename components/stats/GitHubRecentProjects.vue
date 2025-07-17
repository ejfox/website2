<template>
  <div v-if="hasCommits">
    <h4 class="section-subheader">
      RECENT COMMITS
    </h4>
    <div class="space-y-3">
      <div
        v-for="project in recentProjects.slice(0, 2)"
        :key="project.name"
        class="project-item"
      >
        <div class="flex justify-between items-start gap-2">
          <a
            :href="project.url"
            target="_blank"
            rel="noopener"
            class="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors font-medium truncate min-w-0 flex-1"
          >
            {{ project.name }}
          </a>
          <span class="text-2xs text-zinc-500 flex-shrink-0">{{
            formatRelativeTime(project.lastCommit)
          }}</span>
        </div>
        <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
          "{{ project.lastMessage }}"
        </p>
        <div class="flex justify-between items-center text-2xs text-zinc-500 mt-2 gap-2">
          <span class="flex-shrink-0">{{ project.commitCount }} commits</span>
          <div class="flex items-center gap-1 overflow-hidden">
            <span
              v-for="type in project.topTypes"
              :key="type"
              class="px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wider flex-shrink-0"
              :class="getTypeClass(type)"
            >
              {{ type }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistance } from 'date-fns'

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
  detail?: {
    commits?: GitHubCommit[]
  }
}

const props = defineProps<{
  stats: GitHubStats
}>()

const hasCommits = computed(() => {
  return !!props.stats?.detail?.commits?.length
})

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

function formatRelativeTime(dateStr: string) {
  return formatDistance(new Date(dateStr), new Date(), { addSuffix: true })
}

function getTypeClass(type: string) {
  // Use different zinc shades for monochromatic distinction
  const classes = {
    feat: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200',
    fix: 'bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200',
    docs: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    style: 'bg-zinc-150 dark:bg-zinc-750 text-zinc-700 dark:text-zinc-300',
    refactor: 'bg-zinc-250 dark:bg-zinc-650 text-zinc-800 dark:text-zinc-200',
    test: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400',
    chore: 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300',
    other: 'bg-zinc-100 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400'
  }

  // @ts-expect-error - Type might not be in our predefined map
  return classes[type] || classes.other
}
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/30 pb-1 mb-3;
  font-size: 0.65rem;
  line-height: 1rem;
}

.project-item {
  @apply p-3 bg-zinc-100/50 dark:bg-zinc-900/20 rounded-md;
}
</style>