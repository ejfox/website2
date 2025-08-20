<template>
  <div v-if="hasData" class="space-y-8 font-mono">
    <!-- Primary Metric -->
    <div class="text-center py-4">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="stats.totalFilms"
          format="default"
          :duration="800"
          priority="primary"
        />
      </div>
      <div class="text-xs text-zinc-500 uppercase tracking-wider mt-1">FILMS WATCHED</div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        <AnimatedNumber
          :value="stats.averageRating"
          format="decimal"
          :decimals="1"
          :duration="400"
          priority="secondary"
        />★ AVG ·
        <AnimatedNumber
          :value="stats.thisYear"
          format="default"
          :duration="400"
          priority="tertiary"
        />
        THIS YEAR
      </div>
    </div>

    <!-- Recent Films - Minimal -->
    <div v-if="recentFilms.length" class="space-y-4">
      <StatsSectionHeader title="RECENT" />
      <div class="space-y-2">
        <div
          v-for="film in recentFilms"
          :key="film.slug"
          class="flex justify-between items-start text-xs gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="truncate text-zinc-700 dark:text-zinc-300">
              {{ film.title }}
            </div>
            <div class="text-zinc-500" style="font-size: 10px;">
              {{ formatDate(film.watchedDate) }}
            </div>
          </div>
          <div
            v-if="film.rating"
            class="text-zinc-600 dark:text-zinc-400 text-xs tabular-nums"
          >
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
import StatsSectionHeader from './StatsSectionHeader.vue'

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
  return (
    !!props.letterboxdStats?.stats && props.letterboxdStats.stats.totalFilms > 0
  )
})

const stats = computed(
  () =>
    props.letterboxdStats?.stats || {
      totalFilms: 0,
      thisYear: 0,
      thisMonth: 0,
      averageRating: 0,
      rewatches: 0,
      topRatedFilms: [],
      recentFilms: [],
      filmsByMonth: {}
    }
)

const recentFilms = computed(() => props.letterboxdStats?.films || [])

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM d').toUpperCase()
}
</script>

