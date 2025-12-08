<template>
  <div v-if="hasData" class="space-y-2 font-mono">
    <!-- Last 5 Songs -->
    <div v-if="stats?.recentTracks?.tracks?.length">
      <StatsSectionHeader title="LAST 5 SONGS" />
      <div class="space-y-2">
        <div
          v-for="track in (stats?.recentTracks?.tracks || []).slice(0, 5)"
          :key="track.name + track.date"
          class="flex items-baseline justify-between text-xs"
        >
          <div class="flex items-baseline gap-2 min-w-0 flex-1">
            <span class="text-zinc-700 dark:text-zinc-300 truncate text-xs">
              {{ track?.name || 'UNKNOWN' }}
            </span>
            <span class="text-zinc-500 truncate text-xs">
              {{ track?.artist?.name || 'UNKNOWN' }}
            </span>
          </div>
          <span
            v-if="track?.date"
            class="text-zinc-500 flex-shrink-0 ml-2 text-xs"
          >
            {{ formatTrackTime(track) }}
          </span>
          <span
            v-else
            class="text-zinc-500 flex-shrink-0 ml-2 uppercase text-xs"
          >
            NOW
          </span>
        </div>
      </div>
    </div>

    <!-- Top Artists -->
    <div v-if="topArtists?.length">
      <StatsSectionHeader title="TOP ARTISTS" />
      <div class="space-y-2">
        <div
          v-for="(artist, index) in topArtists.slice(0, 5)"
          :key="artist.name"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300 text-xs">
            {{ index + 1 }}. {{ artist.name }}
          </span>
          <span class="text-zinc-500 tabular-nums text-xs">
            <AnimatedNumber
              :value="parseInt(artist.playcount)"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            plays
          </span>
        </div>
      </div>
    </div>

    <!-- Top Genres if available -->
    <div v-if="topGenres?.length">
      <h4 class="section-label-tracked">TOP GENRES</h4>
      <div class="space-y-2">
        <div
          v-for="(genre, index) in topGenres.slice(0, 3)"
          :key="genre.name"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300 text-xs">
            {{ index + 1 }}. {{ genre.name }}
          </span>
          <span class="text-zinc-500 tabular-nums text-xs">
            <AnimatedNumber
              :value="genre.count"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            artists
          </span>
        </div>
      </div>
    </div>

    <!-- Top Tracks -->
    <div v-if="topTracks?.length">
      <h4 class="section-label-tracked">TOP SONGS</h4>
      <div class="space-y-2">
        <div
          v-for="(track, index) in topTracks.slice(0, 3)"
          :key="track.name"
          class="flex items-baseline justify-between text-xs"
        >
          <div class="flex items-baseline gap-2 min-w-0 flex-1">
            <span class="text-zinc-700 dark:text-zinc-300 truncate text-xs">
              {{ index + 1 }}. {{ track.name }}
            </span>
            <span class="text-zinc-500 truncate text-xs">
              {{ track.artist?.name || track.artist }}
            </span>
          </div>
          <span class="text-zinc-500 tabular-nums flex-shrink-0 ml-2 text-xs">
            <AnimatedNumber
              :value="parseInt(track.playcount || '0')"
              format="default"
              :duration="400"
              priority="tertiary"
            />
            plays
          </span>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState
    v-else
    state="unavailable"
    message="LASTFM_DATA_UNAVAILABLE"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsDataState from './StatsDataState.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'

interface Track {
  name: string
  artist: {
    name: string
  }
  date?: {
    uts: string
  }
  playcount?: string
}

interface Artist {
  name: string
  playcount: string
}

interface Genre {
  name: string
  count: number
}

interface LastFmStats {
  recentTracks?: {
    tracks?: Track[]
  }
  topArtists?: {
    artists?: Artist[]
    month?: Artist[]
    year?: Artist[]
  }
  topTracks?: {
    tracks?: Track[]
    month?: Track[]
    year?: Track[]
  }
  stats?: {
    topGenres?: Genre[]
  }
}

const props = defineProps<{
  stats?: LastFmStats | null
}>()

// Computed for easier access to nested data
const topArtists = computed(() => {
  return (
    props.stats?.topArtists?.artists || props.stats?.topArtists?.month || []
  )
})

const topTracks = computed(() => {
  return props.stats?.topTracks?.tracks || props.stats?.topTracks?.month || []
})

const topGenres = computed(() => {
  return props.stats?.stats?.topGenres || []
})

const hasData = computed(() => {
  return !!(
    props.stats?.recentTracks?.tracks?.length ||
    topArtists.value?.length ||
    topTracks.value?.length ||
    topGenres.value?.length
  )
})

const formatTrackTime = (track: Track): string => {
  if (!track.date?.uts) return 'NOW'

  const date = new Date(Number.parseInt(track.date.uts) * 1000)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffMinutes < 1) return 'NOW'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
  return `${Math.floor(diffMinutes / 1440)}d ago`
}
</script>
