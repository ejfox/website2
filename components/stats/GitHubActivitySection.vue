<template>
  <div v-if="hasCommits">
    <ActivityCalendar
      title="COMMIT ACTIVITY"
      :active-dates="commitActivityDates"
      :active-color="'#71717a'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns/format'
import ActivityCalendar from './ActivityCalendar.vue'

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
</script>