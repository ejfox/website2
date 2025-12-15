<template>
  <div v-if="hasData" class="space-y-2 font-mono">
    <!-- Random Record of the Day -->
    <div v-if="randomRecord" class="border border-zinc-300 dark:border-zinc-700 rounded p-3 mb-4">
      <div class="text-xs text-zinc-500 mb-1">FEATURED</div>
      <div class="text-xs">
        <div class="font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {{ randomRecord.title }}
        </div>
        <div class="text-zinc-600 dark:text-zinc-400 truncate">
          {{ randomRecord.artist }}
        </div>
        <div class="text-zinc-500 text-xs mt-1 space-x-2">
          <span>{{ randomRecord.year }}</span>
          <span>•</span>
          <span>{{ randomRecord.format }}</span>
          <span v-if="randomRecord.price > 0">•</span>
          <span v-if="randomRecord.price > 0">${{ randomRecord.price }}</span>
        </div>
        <div v-if="randomRecord.genres?.length" class="text-zinc-500 text-xs mt-1">
          {{ randomRecord.genres.join(', ') }}
        </div>
      </div>
    </div>

    <!-- Collection Stats -->
    <div>
      <StatsSectionHeader title="COLLECTION" />
      <div class="space-y-2">
        <div class="flex items-baseline justify-between text-xs">
          <span class="text-zinc-700 dark:text-zinc-300">Total Items</span>
          <span class="text-zinc-500 tabular-nums">
            <AnimatedNumber
              :value="stats?.stats?.totalItems || 0"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
        <div
          v-if="stats?.stats?.totalValue && stats.stats.totalValue > 0"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300">Total Value</span>
          <span class="text-zinc-500 tabular-nums">
            $<AnimatedNumber
              :value="Math.round(stats.stats.totalValue)"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
        <div
          v-if="stats?.stats?.averageValue && stats.stats.averageValue > 0"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300">Avg Price</span>
          <span class="text-zinc-500 tabular-nums">
            $<AnimatedNumber
              :value="Math.round(stats.stats.averageValue * 100) / 100"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Decade Breakdown -->
    <div v-if="decadeBreakdown?.length">
      <h4 class="section-label-tracked">BY DECADE</h4>
      <div class="space-y-2">
        <div
          v-for="decade in decadeBreakdown"
          :key="decade.decade"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300">
            {{ decade.decade }}
          </span>
          <span class="text-zinc-500 tabular-nums">
            <AnimatedNumber
              :value="decade.count"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Top Genres -->
    <div v-if="topGenres?.length">
      <h4 class="section-label-tracked">TOP GENRES</h4>
      <div class="space-y-2">
        <div
          v-for="(genre, index) in topGenres.slice(0, 5)"
          :key="genre.genre"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300">
            {{ index + 1 }}. {{ genre.genre }}
          </span>
          <span class="text-zinc-500 tabular-nums">
            <AnimatedNumber
              :value="genre.count"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Top Artists -->
    <div v-if="topArtists?.length">
      <h4 class="section-label-tracked">TOP ARTISTS</h4>
      <div class="space-y-2">
        <div
          v-for="(artist, index) in topArtists.slice(0, 5)"
          :key="artist.artist"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300 truncate">
            {{ index + 1 }}. {{ artist.artist }}
          </span>
          <span class="text-zinc-500 tabular-nums flex-shrink-0 ml-2">
            <AnimatedNumber
              :value="artist.count"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState
    v-else
    state="unavailable"
    message="DISCOGS_COLLECTION_EMPTY"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsDataState from './StatsDataState.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'

interface DiscogsStats {
  stats?: {
    totalItems: number
    totalValue: number
    medianValue: number
    highestValue: number
    averageValue: number
  }
  topGenres?: Array<{
    genre: string
    count: number
  }>
  decadeBreakdown?: Array<{
    decade: string
    count: number
  }>
  topArtists?: Array<{
    artist: string
    count: number
  }>
  randomRecord?: {
    title: string
    artist: string
    year: number
    genres: string[]
    price: number
    uri: string
    resourceUrl: string
    format: string
  } | null
  collection?: Array<{
    title: string
    artist: string
    year: number
    price: number
    uri: string
    resourceUrl: string
  }>
  lastUpdated?: string
}

const props = defineProps<{
  stats?: DiscogsStats | null
}>()

const topGenres = computed(() => {
  return props.stats?.topGenres || []
})

const decadeBreakdown = computed(() => {
  return props.stats?.decadeBreakdown || []
})

const topArtists = computed(() => {
  return props.stats?.topArtists || []
})

const randomRecord = computed(() => {
  return props.stats?.randomRecord || null
})

const hasData = computed(() => {
  return !!(
    props.stats?.stats?.totalItems &&
    props.stats?.stats?.totalItems > 0
  )
})
</script>
