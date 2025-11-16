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
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-1">
        FILMS WATCHED
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
        <div>
          <AnimatedNumber
            :value="stats.averageRating"
            format="decimal"
            :decimals="1"
            :duration="400"
            priority="secondary"
          />★ AVG
        </div>
        <div class="text-xs space-x-3">
          <span>
            <AnimatedNumber
              :value="stats.thisYear"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            THIS YEAR
          </span>
          <span v-if="stats.thisMonth > 0" class="text-zinc-500">
            <AnimatedNumber
              :value="stats.thisMonth"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            THIS MONTH
          </span>
          <span v-if="stats.rewatches > 0" class="text-zinc-500">
            <AnimatedNumber
              :value="stats.rewatches"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            REWATCHED
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Films - Enhanced -->
    <div v-if="recentFilms.length" class="space-y-4">
      <StatsSectionHeader title="RECENT" />
      <div class="space-y-2">
        <a
          v-for="film in recentFilms.slice(0, 8)"
          :key="film.slug"
          :href="film.letterboxdUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="row-hover-xs"
        >
          <div class="flex-1 min-w-0">
            <div
              class="truncate text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
            >
              {{ film.title }}
              <span
                v-if="film.isRewatch"
                class="text-zinc-400 dark:text-zinc-600 ml-1"
                title="Rewatch"
                >↻</span
              >
            </div>
            <div class="text-zinc-500 text-[10px]">
              {{ formatDate(film.watchedDate) }}
            </div>
          </div>
          <div
            v-if="film.rating"
            class="text-zinc-600 dark:text-zinc-400 text-xs tabular-nums flex-shrink-0"
          >
            <span class="inline-flex gap-[1px]">
              <span
                v-for="star in renderStars(film.rating)"
                :key="star.id"
                :class="star.class"
                >{{ star.char }}</span
              >
            </span>
          </div>
        </a>
      </div>
    </div>

    <!-- Top Rated - If we have any -->
    <div v-if="stats.topRatedFilms.length > 0" class="space-y-4">
      <StatsSectionHeader title="TOP RATED" />
      <div class="space-y-1">
        <a
          v-for="film in stats.topRatedFilms.slice(0, 5)"
          :key="film.slug"
          :href="film.letterboxdUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="row-hover-xs-centered"
        >
          <div
            class="truncate text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
          >
            {{ film.title }}
          </div>
          <div
            class="text-zinc-600 dark:text-zinc-400 tabular-nums flex-shrink-0"
          >
            <span class="inline-flex gap-[1px]">
              <span
                v-for="star in renderStars(film.rating)"
                :key="star.id"
                :class="star.class"
                >{{ star.char }}</span
              >
            </span>
          </div>
        </a>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-8">
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
  watchedDate: string | null
  isRewatch?: boolean
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

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'NO DATE'
  return format(new Date(dateString), 'MMM d').toUpperCase()
}

const renderStars = (rating: number | null) => {
  if (!rating) return []

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const stars = []
  let id = 0

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push({
      id: id++,
      char: '★',
      class: 'text-zinc-700 dark:text-zinc-300'
    })
  }

  // Half star
  if (hasHalfStar) {
    stars.push({
      id: id++,
      char: '½',
      class: 'text-zinc-700 dark:text-zinc-300 text-[9px] -ml-[1px]'
    })
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars.push({
      id: id++,
      char: '☆',
      class: 'text-zinc-400 dark:text-zinc-600'
    })
  }

  return stars
}
</script>
