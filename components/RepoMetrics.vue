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

const activityColors = {
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
      <span class="metric-item" :title="`${sizeInMB} MB on disk`">
        {{ sizeInMB }}
        <span class="metric-unit">MB</span>
      </span>
      <span class="metric-sep">·</span>
      <span
        class="metric-item"
        :title="`~${formatNumber(totalLines)} lines of code`"
      >
        {{ formatNumber(totalLines) }}
        <span class="metric-unit">LOC</span>
      </span>
      <span class="metric-sep">·</span>
      <span
        class="metric-item"
        :title="`${languageCount} programming languages`"
      >
        {{ languageCount }}
        <span class="metric-unit">lang</span>
      </span>
      <span
        class="activity-indicator"
        :style="{ backgroundColor: activityColors[activityScore] }"
        :title="`Activity: ${activityScore}`"
      ></span>
    </div>

    <!-- Full view: Grid of metrics -->
    <div v-else class="metrics-grid">
      <div class="metric-cell">
        <div class="metric-value">{{ sizeInMB }}</div>
        <div class="metric-label">MB</div>
      </div>
      <div class="metric-cell">
        <div class="metric-value">{{ formatNumber(totalLines) }}</div>
        <div class="metric-label">lines</div>
      </div>
      <div class="metric-cell">
        <div class="metric-value">{{ languageCount }}</div>
        <div class="metric-label">langs</div>
      </div>
      <div class="metric-cell">
        <div class="metric-value">{{ repo.stats.stars }}</div>
        <div class="metric-label">stars</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.repo-metrics {
  @apply font-mono;
}

.metrics-compact {
  @apply flex items-center gap-1.5 text-xs;
  @apply text-zinc-600 dark:text-zinc-400;
}

.metric-item {
  @apply tabular-nums;
}

.metric-unit {
  @apply text-[10px] opacity-60 ml-0.5;
}

.metric-sep {
  @apply opacity-40;
}

.activity-indicator {
  @apply w-1.5 h-1.5 rounded-full ml-1;
}

.metrics-grid {
  @apply grid grid-cols-4 gap-3 text-center;
}

.metric-cell {
  @apply space-y-0.5;
}

.metric-value {
  @apply text-base tabular-nums;
  @apply text-zinc-900 dark:text-zinc-100;
}

.metric-label {
  @apply text-[10px] uppercase tracking-wider;
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
