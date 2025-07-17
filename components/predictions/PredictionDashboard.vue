<template>
  <div class="prediction-dashboard">
    <div class="dashboard-stats">
      <div class="stat-box">
        <span class="stat-label">Total Predictions</span>
        <span class="stat-value">{{ totalPredictions }}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Resolved</span>
        <span class="stat-value">{{ resolvedCount }}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Accuracy</span>
        <span class="stat-value">{{ accuracy }}%</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Brier Score</span>
        <span class="stat-value">{{ brierScore.toFixed(2) }}</span>
      </div>
    </div>
    
    <div v-if="resolvedCount > 0" class="calibration-chart">
      <h3>Calibration</h3>
      <div class="calibration-bins">
        <div v-for="bin in calibrationBins" :key="bin.range" class="calibration-bin">
          <div class="bin-label">
            {{ bin.range }}
          </div>
          <div class="bin-bar-container">
            <div class="bin-bar expected" :style="{height: bin.expected + '%'}"></div>
            <div class="bin-bar actual" :style="{height: bin.actual + '%'}"></div>
          </div>
          <div class="bin-count">
            {{ bin.count }}
          </div>
        </div>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-box expected"></span>Expected</span>
        <span class="legend-item"><span class="legend-box actual"></span>Actual</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  predictions: {
    type: Array,
    required: true
  }
})

const totalPredictions = computed(() => props.predictions.length)

const resolvedPredictions = computed(() => 
  props.predictions.filter(p => p.outcome)
)

const resolvedCount = computed(() => resolvedPredictions.value.length)

const correctCount = computed(() => 
  resolvedPredictions.value.filter(p => p.outcome.correct).length
)

const accuracy = computed(() => {
  if (resolvedCount.value === 0) return 0
  return Math.round((correctCount.value / resolvedCount.value) * 100)
})

// Brier score calculation (lower is better)
const brierScore = computed(() => {
  if (resolvedCount.value === 0) return 0
  
  return resolvedPredictions.value.reduce((sum, prediction) => {
    const p = prediction.confidence / 100
    const o = prediction.outcome.correct ? 1 : 0
    return sum + Math.pow(p - o, 2)
  }, 0) / resolvedCount.value
})

// Calibration bins
const calibrationBins = computed(() => {
  const bins = [
    { range: '0-20%', min: 0, max: 20, count: 0, correct: 0, expected: 10, actual: 0 },
    { range: '20-40%', min: 20, max: 40, count: 0, correct: 0, expected: 30, actual: 0 },
    { range: '40-60%', min: 40, max: 60, count: 0, correct: 0, expected: 50, actual: 0 },
    { range: '60-80%', min: 60, max: 80, count: 0, correct: 0, expected: 70, actual: 0 },
    { range: '80-100%', min: 80, max: 100, count: 0, correct: 0, expected: 90, actual: 0 },
  ]
  
  resolvedPredictions.value.forEach(prediction => {
    const confidence = prediction.confidence
    const bin = bins.find(b => confidence >= b.min && confidence <= b.max)
    if (bin) {
      bin.count++
      if (prediction.outcome.correct) {
        bin.correct++
      }
    }
  })
  
  bins.forEach(bin => {
    if (bin.count > 0) {
      bin.actual = Math.round((bin.correct / bin.count) * 100)
    }
  })
  
  return bins
})
</script>

<style scoped>
.prediction-dashboard {
  @apply mb-8;
}

.dashboard-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-8;
}

.stat-box {
  @apply bg-white border border-gray-200 rounded-lg p-4 text-center;
}

.stat-label {
  @apply block text-sm text-gray-600 mb-1;
}

.stat-value {
  @apply block text-2xl font-bold text-gray-800;
}

.calibration-chart {
  @apply bg-white border border-gray-200 rounded-lg p-6;
}

.calibration-chart h3 {
  @apply text-lg font-semibold mb-4;
}

.calibration-bins {
  @apply flex justify-around items-end h-40 mb-4;
}

.calibration-bin {
  @apply text-center flex-1;
}

.bin-label {
  @apply text-xs text-gray-600 mb-2;
}

.bin-bar-container {
  @apply relative h-32 flex justify-center gap-1;
}

.bin-bar {
  @apply w-6 transition-all duration-300 rounded-t;
}

.bin-bar.expected {
  @apply bg-gray-400;
}

.bin-bar.actual {
  @apply bg-blue-500;
}

.bin-count {
  @apply text-xs text-gray-600 mt-2;
}

.chart-legend {
  @apply flex justify-center gap-4;
}

.legend-item {
  @apply flex items-center gap-1 text-sm;
}

.legend-box {
  @apply w-4 h-4 inline-block;
}

.legend-box.expected {
  @apply bg-gray-400;
}

.legend-box.actual {
  @apply bg-blue-500;
}
</style>