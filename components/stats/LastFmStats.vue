<template>
  <div v-if="hasData" class="space-y-12 font-mono @container">
    <!-- Overview Stats -->
    <div class="space-y-4">
      <!-- Stats Grid - Responsive with container queries -->
      <div class="grid grid-cols-1 @[400px]:grid-cols-2 gap-4">
        <div class="stat-block">
          <div class="text-xl @[300px]:text-2xl @[400px]:text-3xl tabular-nums">
            {{ formatNumber(stats?.stats?.totalScrobbles ?? 0) }}
          </div>
          <div class="text-[10px] text-zinc-500 tracking-[0.2em]">
            TOTAL_SCROBBLES
          </div>
        </div>
        <div class="stat-block">
          <div class="text-xl @[300px]:text-2xl @[400px]:text-3xl tabular-nums">
            {{ formatDecimal(stats?.stats?.averagePerDay, 1) }}
          </div>
          <div class="text-[10px] text-zinc-500 tracking-[0.2em]">
            DAILY_AVERAGE
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tracks - Adjust spacing for mobile -->
    <div v-if="stats.recentTracks?.tracks?.length" class="space-y-6">
      <StatsSectionHeader>RECENT_TRACKS</StatsSectionHeader>
      <div class="space-y-4">
        <div
          v-for="(track, index) in stats.recentTracks.tracks.slice(0, 5)"
          :key="index"
          class="flex items-start gap-2 @[350px]:gap-3 group"
        >
          <!-- Track Number -->
          <div class="w-4 pt-1 text-right text-xs text-zinc-600 tabular-nums">
            {{ index + 1 }}
          </div>

          <!-- Track Info -->
          <div class="min-w-0 flex-1 space-y-1">
            <div class="text-sm truncate">
              {{ track?.name || 'UNKNOWN_TRACK' }}
            </div>
            <div class="text-xs text-zinc-500 truncate">
              {{ track?.artist?.name || 'UNKNOWN_ARTIST' }}
            </div>
          </div>

          <!-- Timestamp - Hide on very small containers -->
          <div class="hidden @[350px]:block text-right pt-1">
            <div
              v-if="track?.date"
              class="text-xs text-zinc-500 tabular-nums whitespace-nowrap"
            >
              {{ formatTrackTime(track) }}
            </div>
            <div v-else class="text-xs text-zinc-500">
              <span class="inline-flex items-center gap-1.5">
                <span class="relative flex h-1.5 w-1.5">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"
                  ></span>
                </span>
                <span class="tracking-[0.2em] text-[10px]">NOW</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Stats - Adjust layout for different container sizes -->
    <div v-if="stats.topTracks || stats.topArtists" class="space-y-12">
      <div class="grid grid-cols-1 @[600px]:grid-cols-2 gap-12">
        <!-- Monthly Stats Column -->
        <div class="space-y-12">
          <!-- Monthly Top Artists -->
          <div v-if="stats.topArtists?.month" class="space-y-6">
            <StatsSectionHeader>TOP_ARTISTS_30D</StatsSectionHeader>
            <div class="space-y-2">
              <div
                v-for="(artist, index) in stats.topArtists.month.slice(0, 5)"
                :key="artist.name"
                class="flex items-baseline gap-2 @[350px]:gap-3"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 text-sm truncate">
                  {{ artist.name }}
                </div>
                <div class="text-xs text-zinc-500 tabular-nums">
                  {{ artist.playcount }}x
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Top Tracks -->
          <div v-if="stats.topTracks?.month" class="space-y-6">
            <StatsSectionHeader>TOP_TRACKS_30D</StatsSectionHeader>
            <div class="space-y-2">
              <div
                v-for="(track, index) in stats.topTracks.month.slice(0, 5)"
                :key="track.name"
                class="flex items-baseline gap-2 @[350px]:gap-3"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm truncate">
                    {{ track.name }}
                  </div>
                  <div class="text-xs text-zinc-500 truncate">
                    {{ track.artist.name }}
                  </div>
                </div>
                <div
                  class="text-xs text-zinc-500 tabular-nums whitespace-nowrap"
                >
                  {{ track.playcount }}x
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Yearly Stats Column -->
        <div class="space-y-12">
          <!-- Yearly Top Artists -->
          <div v-if="stats.topArtists?.year" class="space-y-6">
            <StatsSectionHeader>TOP_ARTISTS_365D</StatsSectionHeader>
            <div class="space-y-2">
              <div
                v-for="(artist, index) in stats.topArtists.year.slice(0, 5)"
                :key="artist.name"
                class="flex items-baseline gap-2 @[350px]:gap-3"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 text-sm truncate">
                  {{ artist.name }}
                </div>
                <div class="text-xs text-zinc-500 tabular-nums">
                  {{ artist.playcount }}x
                </div>
              </div>
            </div>
          </div>

          <!-- Yearly Top Tracks -->
          <div v-if="stats.topTracks?.year" class="space-y-6">
            <StatsSectionHeader>TOP_TRACKS_365D</StatsSectionHeader>
            <div class="space-y-2">
              <div
                v-for="(track, index) in stats.topTracks.year.slice(0, 5)"
                :key="track.name"
                class="flex items-baseline gap-2 @[350px]:gap-3"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm truncate">
                    {{ track.name }}
                  </div>
                  <div class="text-xs text-zinc-500 truncate">
                    {{ track.artist.name }}
                  </div>
                </div>
                <div
                  class="text-xs text-zinc-500 tabular-nums whitespace-nowrap"
                >
                  {{ track.playcount }}x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Info -->
    <div class="text-[10px] text-zinc-600 tracking-[0.2em] tabular-nums">
      LAST_UPDATE :: {{ new Date(stats?.lastUpdated).toLocaleString() }}
    </div>
  </div>
  <StatsDataState v-else state="unavailable" message="LASTFM_DATA_UNAVAILABLE" />
</template>

<script setup lang="ts">
import { ref as _ref, computed } from 'vue'
import { formatNumber, formatDecimal } from '~/composables/useNumberFormat'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'

interface LastFmImage {
  '#text': string
  size: string
}

interface LastFmTrack {
  name: string
  artist: {
    name: string
    url: string
  }
  url: string
  date?: {
    uts: string
    '#text': string
  }
  image: LastFmImage[]
  playcount?: string
}

interface LastFmArtist {
  name: string
  playcount: string
  url: string
  image: LastFmImage[]
}

interface LastFmStats {
  stats: {
    totalScrobbles: number
    uniqueArtists: number
    uniqueTracks: number
    averagePerDay: number
  }
  recentTracks: {
    tracks: LastFmTrack[]
    total: number
  }
  topTracks: {
    tracks: LastFmTrack[]
    total: number
  }
  topArtists: {
    artists: LastFmArtist[]
    total: number
  }
  lastUpdated: string
}

const _handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.src = '/placeholder-artist.png'
  }
}

const _getImageUrl = (
  images: LastFmImage[],
  size: string = 'medium'
): string => {
  return (
    images.find((img) => img.size === size)?.['#text'] ||
    '/placeholder-artist.png'
  )
}

const props = defineProps<{
  stats: LastFmStats
}>()

// Check if we have meaningful data
const hasData = computed(() => {
  return !!(props.stats?.stats?.totalScrobbles && props.stats.stats.totalScrobbles > 0)
})

function formatTrackTime(track: LastFmTrack): string {
  if (!track?.date?.uts) return ''
  try {
    const date = new Date(Number(track.date.uts) * 1000)
    const now = new Date()
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    )

    if (diffMinutes < 60) {
      return `${diffMinutes}m`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours}h`
    } else {
      return date
        .toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        .replace(',', '')
    }
  } catch (error) {
    console.warn('Error formatting track time:', error)
    return ''
  }
}
</script>

<style scoped>
.stat-block {
  /* Removed background and border for a clean typographical look */
}

/* Ensure all numbers use tabular figures */
.tabular-nums {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
