<template>
  <div class="prediction-stats">
    <div class="stat-card">
      <h3>Total Predictions</h3>
      <div class="stat-value">{{ stats.total }}</div>
    </div>
    
    <div class="stat-card">
      <h3>Pending</h3>
      <div class="stat-value">{{ stats.pending }}</div>
    </div>
    
    <div class="stat-card">
      <h3>Resolved</h3>
      <div class="stat-value">{{ stats.resolved }}</div>
    </div>
    
    <div class="stat-card">
      <h3>Accuracy</h3>
      <div class="stat-value">{{ stats.accuracy.toFixed(1) }}%</div>
      <div class="stat-meta">{{ stats.correct }}/{{ stats.resolved }} correct</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.prediction-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-8;
}

.stat-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 text-center;
}

.stat-card h3 {
  @apply text-sm text-gray-600 mb-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900;
}

.stat-meta {
  @apply text-xs text-gray-500 mt-1;
}
</style>