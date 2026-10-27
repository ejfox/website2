<!--
  @file LastFmStats.vue
  @description MUSIC section of /stats (pages/stats.vue): five recent tracks,
    top artists and top tracks from Last.fm (last month).
    Data: stats.lastfm from /api/stats, built by server/api/lastfm.get.ts.
  @props stats?: LastFmStats | null - stats.lastfm
-->
<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '../ui/AnimatedNumber.vue'
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
}

const props = defineProps<{
  stats?: LastFmStats | null
}>()

// The server sends `artists` / `tracks`; `month` is an older shape kept as a
// fallback.
const topArtists = computed(() => {
  return (
    props.stats?.topArtists?.artists || props.stats?.topArtists?.month || []
  )
})

const topTracks = computed(() => {
  return props.stats?.topTracks?.tracks || props.stats?.topTracks?.month || []
})

const hasData = computed(() => {
  return !!(
    props.stats?.recentTracks?.tracks?.length ||
    topArtists.value?.length ||
    topTracks.value?.length
  )
})

// Relative age of a scrobble. Last.fm sends `date.uts` in seconds; the
// now-playing track has no date at all.
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

<template>
  <div v-if="hasData" class="space-y-2 font-mono">
    <div v-if="stats?.recentTracks?.tracks?.length">
      <StatsSectionHeader title="LAST.FM RECENT TRACKS" />
      <div class="space-y-2">
        <div
          v-for="(track, i) in (stats?.recentTracks?.tracks || []).slice(0, 5)"
          :key="`${i}-${track.name}-${track.date?.uts ?? 'now'}`"
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
          <!-- no date = Last.fm's currently-playing track -->
          <span
            v-else
            class="text-zinc-500 flex-shrink-0 ml-2 uppercase text-xs"
          >
            NOW
          </span>
        </div>
      </div>
    </div>

    <div v-if="topArtists?.length">
      <StatsSectionHeader title="LAST.FM TOP ARTISTS" />
      <div class="space-y-2">
        <div
          v-for="(artist, index) in topArtists.slice(0, 5)"
          :key="artist.name"
          class="flex items-baseline justify-between text-xs"
        >
          <span class="text-zinc-700 dark:text-zinc-300 text-xs">
            <HandDrawn
              :name="`circled-${index + 1}`"
              size="1.3em"
              class="align-text-bottom mr-1"
            />
            {{ artist.name }}
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

    <div v-if="topTracks?.length">
      <h4 class="section-label-tracked">LAST.FM TOP TRACKS</h4>
      <div class="space-y-2">
        <div
          v-for="(track, index) in topTracks.slice(0, 3)"
          :key="track.name"
          class="flex items-baseline justify-between text-xs"
        >
          <div class="flex items-baseline gap-2 min-w-0 flex-1">
            <span class="text-zinc-700 dark:text-zinc-300 truncate text-xs">
              <HandDrawn
                :name="`num-${index + 1}`"
                size="1.3em"
                class="align-text-bottom mr-1"
              />
              {{ track.name }}
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
  <StatsDataState v-else type="unavailable" message="LASTFM_DATA_UNAVAILABLE" />
</template>
