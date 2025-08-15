<template>
  <div v-if="hasData" class="space-y-8 font-mono">
    <!-- Primary Metric -->
    <div class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="stats.totalFilms" format="default" :duration="800" priority="primary" />
      </div>
      <div class="stat-label">
        FILMS WATCHED
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.averageRating" format="decimal" :decimals="1" :duration="400" priority="secondary" />★ AVG · 
        <AnimatedNumber :value="stats.thisYear" format="default" :duration="400" priority="tertiary" /> THIS YEAR
      </div>
    </div>

    <!-- Recent Films - Minimal -->
    <div v-if="recentFilms.length" class="space-y-4">
      <div class="text-xs tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        RECENT
      </div>
      <div class="space-y-2">
        <div 
          v-for="film in recentFilms.slice(0, 3)"
          :key="film.slug"
          class="flex justify-between items-start text-xs gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="truncate text-zinc-700 dark:text-zinc-300">
              {{ film.title }}
            </div>
            <div class="text-zinc-500 text-2xs">
              {{ formatDate(film.watchedDate) }}
            </div>
          </div>
          <div v-if="film.rating" class="text-zinc-600 dark:text-zinc-400 text-xs tabular-nums">
            {{ film.rating }}★
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-6">
    <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
      NO FILM DATA
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns/format'
import AnimatedNumber from '../AnimatedNumber.vue'
// NUKED BY BLOODHOUND: import { useAnimations } from '~/composables/useAnimations'

interface LetterboxdFilm {
  title: string
  slug: string
  rating: number | null
  letterboxdUrl: string
  watchedDate: string
}

interface LetterboxdStats {
  films: LetterboxdFilm[]
  stats: {
    totalFilms: number
    thisYear: number
    thisMonth: number
    averageRating: number
    rewatches: number
    topRatedFilms: LetterboxdFilm[]
    recentFilms: LetterboxdFilm[]
    filmsByMonth: Record<string, number>
  }
  lastUpdated: string
  source: string
  error?: string
}

const props = defineProps<{
  letterboxdStats?: LetterboxdStats | null
}>()

// DELETED: const { timing } = // DELETED: useAnimations() - BROKEN IMPORT

const hasData = computed(() => {
  return !!props.letterboxdStats?.stats && props.letterboxdStats.stats.totalFilms > 0
})

const stats = computed(() => props.letterboxdStats?.stats || {
  totalFilms: 0,
  thisYear: 0,
  thisMonth: 0,
  averageRating: 0,
  rewatches: 0,
  topRatedFilms: [],
  recentFilms: [],
  filmsByMonth: {}
})

const recentFilms = computed(() => props.letterboxdStats?.films || [])

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM d').toUpperCase()
}
</script>