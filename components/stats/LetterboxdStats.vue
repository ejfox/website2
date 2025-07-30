<template>
  <div v-if="data?.stats" class="space-y-3 font-mono">
    <!-- Essential metrics only -->
    <div>
      <StatsSectionHeader title="FILM STATUS" />
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.totalFilms || 0 }}
          </div>
          <div class="stat-label">
            WATCHED
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ formatRating(data.stats.averageRating) }}
          </div>
          <div class="stat-label">
            AVG RATING
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.topRatedFilms?.length || 0 }}
          </div>
          <div class="stat-label">
            5-STAR
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.thisYear || 0 }}
          </div>
          <div class="stat-label">
            THIS YEAR
          </div>
        </div>
      </div>
    </div>

    <!-- Minimal poster grid - Tufte-style data visualization -->
    <div v-if="recentPosters.length">
      <StatsSectionHeader title="RECENT" />
      <div class="flex flex-wrap gap-0.5">
        <div 
          v-for="film in recentPosters" 
          :key="film.letterboxdUrl"
          class="w-3 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-sm flex-shrink-0 relative group overflow-hidden"
          :title="`${film.title} (${film.year})${film.rating ? ' ★'.repeat(film.rating) : ''}`"
        >
          <!-- Tiny poster thumbnail if available -->
          <img 
            v-if="film.poster"
            :src="film.poster"
            :alt="film.title"
            class="w-full h-full object-cover"
            loading="lazy"
          >
          <!-- Rating indicator overlay -->
          <div 
            v-if="film.rating >= 4"
            class="absolute inset-0 border border-yellow-400"
            :class="film.rating === 5 ? 'border-2' : 'border-1'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <a 
        href="https://letterboxd.com/ejfox/" 
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-muted hover:text-primary transition-colors uppercase tracking-wider"
      >
        View on Letterboxd ↗
      </a>
    </div>
  </div>
  
  <div v-else-if="data?.error" class="text-center py-8">
    <div class="text-sm text-muted">
      {{ data.error }}
    </div>
    <div class="text-xs text-muted mt-2">
      RSS feed may be empty or parsing failed
    </div>
  </div>

  <div v-else class="text-center py-8 text-muted">
    <div class="text-sm">
      Letterboxd data not available
    </div>
  </div>
</template>

<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const formatRating = (rating) => {
  if (!rating || rating === 0) return '—'
  return rating.toFixed(1)
}

// Recent films for tiny poster visualization
const recentPosters = computed(() => {
  if (!props.data?.films?.length) return []
  
  // Take recent films and limit to reasonable amount for visualization
  return props.data.films.slice(0, 50).map(film => ({
    ...film,
    // Ensure we have poster data - could be from letterboxd RSS or fallback
    poster: film.poster || film.image || null
  }))
})
</script>