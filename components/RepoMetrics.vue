<!--
  @file RepoMetrics.vue
  @description Repository metrics display showing size, lines of code, language count, and activity status
  @props repo: Object - Repository object with diskUsage, languages, stats, pushedAt properties
  @props compact: boolean - Use compact inline layout (default: false)
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  repo: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

// Calculate metrics
const sizeInMB = computed(() => {
  if (!props.repo.diskUsage) return 0
  return (props.repo.diskUsage / 1024).toFixed(1)
})

const languageCount = computed(() => {
  if (!props.repo.languages) return 0
  return Object.keys(props.repo.languages).length
})

const totalLines = computed(() => {
  if (!props.repo.languages) return 0
  // Rough estimate: bytes / 30 (average chars per line)
  const totalBytes = Object.values(props.repo.languages).reduce(
    (sum, val) => sum + val,
    0
  )
  return Math.round(totalBytes / 30)
})

const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const activityScore = computed(() => {
  // Days since last push
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(props.repo.pushedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  if (daysSinceUpdate < 7) return 'active'
  if (daysSinceUpdate < 30) return 'recent'
  if (daysSinceUpdate < 90) return 'moderate'
  return 'dormant'
})

const _activityColors = {
  active: '#22c55e',
  recent: '#84cc16',
  moderate: '#eab308',
  dormant: '#71717a',
}
</script>

<template>
  <div :class="['repo-metrics', { compact }]">
    <!-- Compact view: Single line of metrics -->
    <div v-if="compact" class="metrics-compact">
      <span class="metric-item">
        {{ sizeInMB }}
        <span class="metric-unit">MB</span>
      </span>
      <span class="metric-sep">·</span>
      <span class="metric-item">
        {{ formatNumber(totalLines) }}
        <span class="metric-unit">LOC</span>
      </span>
      <span class="metric-sep">·</span>
      <span class="metric-item">
        {{ languageCount }}
        <span class="metric-unit">lang</span>
      </span>
      <span class="metric-sep">·</span>
      <span class="metric-item">{{ activityScore }}</span>
    </div>

    <!-- Full view: Table of metrics (left-aligned) -->
    <div v-else class="metrics-table">
      <div class="metric-row">
        <span class="metric-value">{{ sizeInMB }}</span>
        <span class="metric-label">MB</span>
      </div>
      <div class="metric-row">
        <span class="metric-value">{{ formatNumber(totalLines) }}</span>
        <span class="metric-label">lines</span>
      </div>
      <div class="metric-row">
        <span class="metric-value">{{ languageCount }}</span>
        <span class="metric-label">langs</span>
      </div>
      <div class="metric-row">
        <span class="metric-value">{{ repo.stats.stars }}</span>
        <span class="metric-label">stars</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-metrics {
  @apply font-mono;
}

/* Compact: inline metrics */
.metrics-compact {
  @apply flex items-center gap-0.5 text-[10px];
  @apply text-zinc-600 dark:text-zinc-400;
}

.metric-item {
  @apply tabular-nums;
}

.metric-unit {
  @apply text-[9px] opacity-50;
}

.metric-sep {
  @apply opacity-30;
}

/* Full: table layout (left-aligned, brutalist) */
.metrics-table {
  @apply space-y-0;
}

.metric-row {
  @apply flex items-baseline gap-2;
  padding: 4px 0; /* 8px baseline */
}

.metric-value {
  @apply text-sm tabular-nums font-medium;
  @apply text-zinc-900 dark:text-zinc-100;
  min-width: 3ch;
}

.metric-label {
  @apply text-[10px];
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
