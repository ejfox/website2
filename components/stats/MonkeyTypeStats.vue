<script setup lang="ts">
import { computed } from 'vue'
import { format as d3Format } from 'd3-format'

const props = defineProps<{
  stats: {
    typingStats: {
      testsCompleted: number
      testsStarted: number
      bestWPM: number
      bestAccuracy: number
      bestConsistency: number
      timePercentile: number
      wordsPercentile: number
    }
    personalBests: {
      time: { [key: string]: any[] }
      words: { [key: string]: any[] }
    }
    speedHistogram: {
      time: { [key: string]: number }
      words: { [key: string]: number }
    }
  }
}>()

const formatNumber = d3Format(',d')
const formatPercent = d3Format('.1%')

// Calculate completion rate
const completionRate = computed(() => {
  const { testsStarted, testsCompleted } = props.stats.typingStats
  return testsStarted > 0 ? testsCompleted / testsStarted : 0
})

// Get best scores for different test modes
const bestScores = computed(() => {
  const timeTests = Object.entries(props.stats.personalBests.time || {}).map(([duration, tests]) => ({
    mode: `${duration}s`,
    ...tests[0]
  }))

  const wordTests = Object.entries(props.stats.personalBests.words || {}).map(([count, tests]) => ({
    mode: `${count} words`,
    ...tests[0]
  }))

  return [...timeTests, ...wordTests].sort((a, b) => b.wpm - a.wpm)
})

// Calculate speed distribution
const speedDistribution = computed(() => {
  const timeData = props.stats.speedHistogram.time
  const wordData = props.stats.speedHistogram.words

  const combinedData = new Map()

  // Combine data from both time and word tests
  Object.entries(timeData).forEach(([speed, count]) => {
    combinedData.set(parseInt(speed), (combinedData.get(parseInt(speed)) || 0) + count)
  })

  Object.entries(wordData).forEach(([speed, count]) => {
    combinedData.set(parseInt(speed), (combinedData.get(parseInt(speed)) || 0) + count)
  })

  return Array.from(combinedData.entries())
    .sort(([speedA], [speedB]) => speedA - speedB)
    .map(([speed, count]) => ({ speed, count }))
})
</script>

<template>
  <div class="monkeytype-stats">
    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric">
        <h3>Best WPM</h3>
        <div class="value">{{ formatNumber(stats.typingStats.bestWPM) }}</div>
      </div>
      <div class="metric">
        <h3>Best Accuracy</h3>
        <div class="value">{{ formatPercent(stats.typingStats.bestAccuracy / 100) }}</div>
      </div>
      <div class="metric">
        <h3>Best Consistency</h3>
        <div class="value">{{ formatPercent(stats.typingStats.bestConsistency / 100) }}</div>
      </div>
      <div class="metric">
        <h3>Tests Completed</h3>
        <div class="value">{{ formatNumber(stats.typingStats.testsCompleted) }}</div>
      </div>
    </div>

    <!-- Percentile Rankings -->
    <div class="section">
      <h3>Percentile Rankings</h3>
      <div class="percentiles">
        <div class="percentile">
          <span class="label">Time Tests</span>
          <div class="bar-container">
            <div class="bar" :style="{ width: `${stats.typingStats.timePercentile}%` }"></div>
            <span class="value">{{ formatPercent(stats.typingStats.timePercentile / 100) }}</span>
          </div>
        </div>
        <div class="percentile">
          <span class="label">Word Tests</span>
          <div class="bar-container">
            <div class="bar" :style="{ width: `${stats.typingStats.wordsPercentile}%` }"></div>
            <span class="value">{{ formatPercent(stats.typingStats.wordsPercentile / 100) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Speed Distribution -->
    <div class="section">
      <h3>Speed Distribution</h3>
      <div class="speed-chart">
        <div v-for="data in speedDistribution" :key="data.speed" class="speed-bar" :style="{
          height: `${(data.count / Math.max(...speedDistribution.map(d => d.count))) * 100}%`
        }" :title="`${data.speed} WPM: ${data.count} tests`"></div>
      </div>
      <div class="speed-labels">
        <span>{{ Math.min(...speedDistribution.map(d => d.speed)) }} WPM</span>
        <span>{{ Math.max(...speedDistribution.map(d => d.speed)) }} WPM</span>
      </div>
    </div>

    <!-- Best Scores -->
    <div class="section">
      <h3>Personal Bests</h3>
      <div class="best-scores">
        <div v-for="score in bestScores.slice(0, 4)" :key="score.mode" class="score-card">
          <h4>{{ score.mode }}</h4>
          <div class="score-details">
            <div class="wpm">{{ formatNumber(score.wpm) }} WPM</div>
            <div class="sub-stats">
              <span>{{ formatPercent(score.acc / 100) }} acc</span>
              <span>{{ formatPercent(score.consistency / 100) }} con</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monkeytype-stats {
  padding: 2rem;
  background: var(--surface-background);
  border-radius: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric {
  background: var(--surface-background-light);
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
}

.metric h3 {
  font-size: 0.9rem;
  color: var(--text-color-light);
  margin: 0 0 0.5rem;
}

.metric .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-color);
}

.section {
  margin-top: 2.5rem;
}

.section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.percentiles {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.percentile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  width: 100px;
  font-size: 0.9rem;
  color: var(--text-color-light);
}

.bar-container {
  flex: 1;
  height: 2rem;
  background: var(--surface-background-light);
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 0.5rem;
  transition: width 0.3s ease;
}

.value {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.9rem;
}

.speed-chart {
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.speed-bar {
  flex: 1;
  background: var(--primary-color);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  color: var(--text-color-light);
  font-size: 0.8rem;
}

.best-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.score-card {
  background: var(--surface-background-light);
  padding: 1.5rem;
  border-radius: 0.75rem;
}

.score-card h4 {
  font-size: 0.9rem;
  color: var(--text-color-light);
  margin: 0 0 0.5rem;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wpm {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--text-color);
}

.sub-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-color-light);
}
</style>