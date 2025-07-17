<template>
  <div v-if="hasCommits">
    <h4 class="section-subheader">
      GITHUB INSIGHTS
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        class="insight-card p-3 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-md"
      >
        <div class="text-xs text-zinc-500 mb-1">
          LATEST STREAK
        </div>
        <div class="text-zinc-700 dark:text-zinc-300">
          {{ getContributionStreak }} days
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

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
  @apply tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/30 pb-1 mb-3;
  font-size: 0.65rem;
  line-height: 1rem;
}

.insight-card {
  @apply p-3 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-md;
}
</style>