<template>
  <div class="prediction-stats">
    <div class="stat-card">
      <h3>Total Predictions</h3>
      <div class="stat-value">
        {{ stats.total }}
      </div>
    </div>

    <div class="stat-card">
      <h3>Pending</h3>
      <div class="stat-value">
        {{ stats.pending }}
      </div>
    </div>

    <div class="stat-card">
      <h3>Resolved</h3>
      <div class="stat-value">
        {{ stats.resolved }}
      </div>
    </div>

    <div class="stat-card">
      <h3>Accuracy</h3>
      <div class="stat-value">{{ stats.accuracy.toFixed(1) }}%</div>
      <div class="stat-meta">
        {{ stats.correct }}/{{ stats.resolved }} correct
      </div>
    </div>
  </div>
</template>

<script setup>
const _props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.prediction-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-8;
}

.stat-card {
  @apply bg-white dark:bg-zinc-900 border border-zinc-200
    dark:border-zinc-800 rounded-lg p-4 text-center;
}

.stat-card h3 {
  @apply text-sm text-zinc-600 dark:text-zinc-400 mb-2;
}

.stat-value {
  @apply text-2xl font-bold text-zinc-900 dark:text-zinc-100;
}

.stat-meta {
  @apply text-xs text-zinc-500 dark:text-zinc-500 mt-2;
}
</style>
