<!--
  @file GitHubMiniContributions.vue
  @description Mini GitHub contribution heatmap calendar visualization showing recent activity
  @props stats: Object - GitHub statistics with commits data
-->
<template>
  <div v-if="hasCommits">
    <h4 class="section-subheader">CONTRIBUTIONS</h4>
    <div class="mini-calendar">
      <div class="contribution-grid">
        <div
          v-for="(week, weekIndex) in contributionWeeks"
          :key="`week-${weekIndex}`"
          class="week-column"
        >
          <div
            v-for="(day, dayIndex) in week"
            :key="`day-${weekIndex}-${dayIndex}`"
            class="contribution-square"
            :class="{
              'bg-zinc-600 dark:bg-zinc-500': day.hasContribution,
              'bg-zinc-200/50 dark:bg-zinc-800/50': !day.hasContribution,
            }"
            :title="`${day.date}: ${day.count} contributions`"
          ></div>
        </div>
      </div>
      <div
        class="flex justify-between text-zinc-500 mt-2"
        style="font-size: 10px; line-height: 12px"
      >
        <span>{{ firstDate }}</span>
        <span>{{ lastDate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, startOfWeek, addDays } from 'date-fns'

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

// Get contribution data for last 8 weeks
const contributionWeeks = computed(() => {
  if (!props.stats?.detail?.commits) return []

  // Count commits by date
  const commitsByDate = new Map<string, number>()
  props.stats.detail.commits.forEach((commit) => {
    const date = format(new Date(commit.occurredAt), 'yyyy-MM-dd')
    commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1)
  })

  // Get the last 8 weeks of data
  const today = new Date()
  const weeksAgo = 8
  const startDate = startOfWeek(addDays(today, -weeksAgo * 7), {
    weekStartsOn: 0,
  })

  const weeks = []
  for (let w = 0; w < weeksAgo; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      const dateStr = format(date, 'yyyy-MM-dd')
      const count = commitsByDate.get(dateStr) || 0
      week.push({
        date: dateStr,
        hasContribution: count > 0,
        count,
      })
    }
    weeks.push(week)
  }

  return weeks
})

const firstDate = computed(() => {
  if (!contributionWeeks.value.length) return ''
  const firstWeek = contributionWeeks.value[0]
  if (!firstWeek.length) return ''
  return format(new Date(firstWeek[0].date), 'MMM d')
})

const lastDate = computed(() => {
  if (!contributionWeeks.value.length) return ''
  const lastWeek = contributionWeeks.value[contributionWeeks.value.length - 1]
  if (!lastWeek.length) return ''
  return format(new Date(lastWeek[6].date), 'MMM d')
})
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 pb-1 mb-3;
  @apply border-b border-zinc-200 dark:border-zinc-800/30;
  font-size: 0.65rem;
  line-height: 1rem;
}

.contribution-grid {
  @apply flex gap-1;
}

.week-column {
  @apply flex flex-col gap-1;
}

.contribution-square {
  @apply w-2 h-2 rounded-sm transition-colors duration-200;
}

.mini-calendar {
  @apply p-3 bg-zinc-100/50 dark:bg-zinc-900/20 rounded-md;
}
</style>
