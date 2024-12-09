<script setup lang="ts">
import { computed } from 'vue'
import { format as d3Format } from 'd3-format'
import { format } from 'date-fns'

const props = defineProps<{
  stats: {
    contributions: number[]
    dates: string[]
    currentStreak: number
    longestStreak: number
    totalContributions: number
    repositories: Array<{
      name: string
      description: string
      stars: number
      forks: number
      primaryLanguage?: {
        name: string
        color: string
      }
    }>
    languages: Array<{
      name: string
      count: number
      size: number
      color: string
    }>
    stats: {
      totalRepos: number
      totalPRs: number
      mergedPRs: number
      followers: number
      following: number
      totalLinesChanged: number
      totalFilesChanged: number
    }
    mergedPRs: Array<{
      title: string
      mergedAt: string
      additions: number
      deletions: number
      repository: string
    }>
  }
}>()

const formatNumber = d3Format(',d')
const formatPercent = d3Format('.1%')

// Calculate language percentages
const languageStats = computed(() => {
  if (!props.stats?.languages?.length) return []

  const totalSize = props.stats.languages.reduce((sum, lang) => sum + lang.size, 0)
  return props.stats.languages.map(lang => ({
    ...lang,
    percentage: lang.size / totalSize
  }))
})

// Calculate PR impact
const prImpact = computed(() => {
  if (!props.stats?.mergedPRs?.length) {
    return {
      additions: 0,
      deletions: 0,
      netChange: 0
    }
  }

  const totalAdditions = props.stats.mergedPRs.reduce((sum, pr) => sum + pr.additions, 0)
  const totalDeletions = props.stats.mergedPRs.reduce((sum, pr) => sum + pr.deletions, 0)
  return {
    additions: totalAdditions,
    deletions: totalDeletions,
    netChange: totalAdditions - totalDeletions
  }
})

// Add loading state
const isLoading = computed(() => {
  return !props.stats?.languages || !props.stats?.repositories || !props.stats?.mergedPRs
})
</script>

<template>
  <div class="github-stats">
    <div v-if="isLoading" class="loading">
      <p>Loading GitHub stats...</p>
    </div>
    <template v-else>
      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric">
          <h3>Total Contributions</h3>
          <div class="value">{{ formatNumber(stats.totalContributions) }}</div>
        </div>
        <div class="metric">
          <h3>Current Streak</h3>
          <div class="value">{{ stats.currentStreak }} days</div>
        </div>
        <div class="metric">
          <h3>Longest Streak</h3>
          <div class="value">{{ stats.longestStreak }} days</div>
        </div>
        <div class="metric">
          <h3>Total Repositories</h3>
          <div class="value">{{ formatNumber(stats.stats.totalRepos) }}</div>
        </div>
      </div>

      <!-- Language Distribution -->
      <div v-if="languageStats.length" class="section">
        <h3>Language Distribution</h3>
        <div class="language-bars">
          <div v-for="lang in languageStats" :key="lang.name" class="language-bar" :style="{
            width: `${lang.percentage * 100}%`,
            backgroundColor: lang.color || '#ddd'
          }" :title="`${lang.name}: ${formatPercent(lang.percentage)}`">
            <span class="language-name" v-if="lang.percentage > 0.05">
              {{ lang.name }}
            </span>
          </div>
        </div>
        <div class="language-legend">
          <div v-for="lang in languageStats.slice(0, 5)" :key="lang.name" class="legend-item">
            <div class="color-dot" :style="{ backgroundColor: lang.color || '#ddd' }"></div>
            <span>{{ lang.name }}</span>
            <span class="percentage">{{ formatPercent(lang.percentage) }}</span>
          </div>
        </div>
      </div>

      <!-- Repository Highlights -->
      <div v-if="stats.repositories?.length" class="section">
        <h3>Top Repositories</h3>
        <div class="repo-grid">
          <div v-for="repo in stats.repositories.slice(0, 6)" :key="repo.name" class="repo-card">
            <h4>{{ repo.name }}</h4>
            <p class="description">{{ repo.description || 'No description' }}</p>
            <div class="repo-stats">
              <span class="stars">⭐ {{ formatNumber(repo.stars) }}</span>
              <span class="forks">🔱 {{ formatNumber(repo.forks) }}</span>
              <span v-if="repo.primaryLanguage" class="primary-lang" :style="{ color: repo.primaryLanguage.color }">
                ● {{ repo.primaryLanguage.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pull Request Impact -->
      <div class="section">
        <h3>Pull Request Impact</h3>
        <div class="pr-stats">
          <div class="pr-metric">
            <span class="label">Total PRs</span>
            <span class="value">{{ formatNumber(stats.stats.totalPRs) }}</span>
          </div>
          <div class="pr-metric">
            <span class="label">Merged</span>
            <span class="value">{{ formatNumber(stats.stats.mergedPRs) }}</span>
          </div>
          <div class="pr-metric">
            <span class="label">Lines Added</span>
            <span class="value green">+{{ formatNumber(prImpact.additions) }}</span>
          </div>
          <div class="pr-metric">
            <span class="label">Lines Removed</span>
            <span class="value red">-{{ formatNumber(prImpact.deletions) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.github-stats {
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

.language-bars {
  height: 2rem;
  display: flex;
  border-radius: 0.5rem;
  overflow: hidden;
}

.language-bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  transition: all 0.2s ease;
}

.language-bar:hover {
  filter: brightness(1.1);
}

.language-name {
  color: white;
  font-size: 0.8rem;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.language-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.percentage {
  color: var(--text-color-light);
}

.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.repo-card {
  background: var(--surface-background-light);
  padding: 1.5rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.repo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.repo-card h4 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: var(--text-color);
}

.description {
  font-size: 0.9rem;
  color: var(--text-color-light);
  margin: 0 0 1rem;
  line-height: 1.4;
}

.repo-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.stars,
.forks {
  color: var(--text-color-light);
}

.primary-lang {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pr-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.pr-metric {
  background: var(--surface-background-light);
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
}

.pr-metric .label {
  font-size: 0.9rem;
  color: var(--text-color-light);
  display: block;
  margin-bottom: 0.5rem;
}

.pr-metric .value {
  font-size: 1.2rem;
  font-weight: bold;
}

.green {
  color: #28a745;
}

.red {
  color: #dc3545;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-light);
}
</style>