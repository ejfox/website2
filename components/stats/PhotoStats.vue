<script setup lang="ts">
import { computed } from 'vue'
import { format as d3Format } from 'd3-format'

const props = defineProps<{
  stats: {
    photos: Array<{
      public_id: string
      secure_url: string
      created_at: string
    }>
  }
}>()

const formatNumber = d3Format(',d')

// Calculate total photos
const totalPhotos = computed(() => props.stats.photos.length)

// Group photos by month
const photosByMonth = computed(() => {
  const months = new Map()

  props.stats.photos.forEach(photo => {
    const date = new Date(photo.created_at)
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' })

    if (!months.has(monthKey)) {
      months.set(monthKey, [])
    }
    months.get(monthKey).push(photo)
  })

  return Array.from(months.entries())
    .map(([month, photos]) => ({
      month,
      count: photos.length,
      photos
    }))
    .sort((a, b) => new Date(b.photos[0].created_at).getTime() - new Date(a.photos[0].created_at).getTime())
})

// Calculate recent activity
const recentActivity = computed(() => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

  return props.stats.photos.filter(photo =>
    new Date(photo.created_at) > thirtyDaysAgo
  ).length
})
</script>

<template>
  <div class="photo-stats">
    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric">
        <h3>Total Photos</h3>
        <div class="value">{{ formatNumber(totalPhotos) }}</div>
      </div>
      <div class="metric">
        <h3>Last 30 Days</h3>
        <div class="value">{{ formatNumber(recentActivity) }}</div>
      </div>
      <div class="metric">
        <h3>Monthly Average</h3>
        <div class="value">{{ formatNumber(totalPhotos / photosByMonth.length) }}</div>
      </div>
    </div>

    <!-- Monthly Breakdown -->
    <div class="section">
      <h3>Monthly Activity</h3>
      <div class="months-grid">
        <div v-for="monthData in photosByMonth" :key="monthData.month" class="month-card">
          <div class="month-header">
            <h4>{{ monthData.month }}</h4>
            <span class="count">{{ formatNumber(monthData.count) }}</span>
          </div>
          <div class="photo-grid">
            <img v-for="photo in monthData.photos.slice(0, 4)" :key="photo.public_id" :src="photo.secure_url"
              :alt="photo.public_id" class="thumbnail" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-stats {
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

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.month-card {
  background: var(--surface-background-light);
  padding: 1.5rem;
  border-radius: 0.75rem;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-header h4 {
  font-size: 1.1rem;
  color: var(--text-color);
  margin: 0;
}

.count {
  font-size: 0.9rem;
  color: var(--text-color-light);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.thumbnail {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.thumbnail:hover {
  transform: scale(1.05);
}
</style>