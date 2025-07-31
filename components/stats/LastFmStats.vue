<template>
  <div v-if="hasData" ref="lastfmStatsRef" class="space-y-12 font-mono @container">
    <!-- Recent Tracks - Adjust spacing for mobile -->
    <div v-if="stats.recentTracks?.tracks?.length" class="space-y-6">
      <StatsSectionHeader title="RECENT_TRACKS" />
      <div class="space-y-4">
        <div
          v-for="(track, index) in (stats.recentTracks?.tracks || []).slice(0, 5)"
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
              <span class="tracking-[0.2em] text-[10px]">CURRENTLY PLAYING</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Top Genres -->
    <div v-if="stats.stats?.topGenres?.length" class="space-y-6 mb-12">
      <StatsSectionHeader title="TOP_GENRES" />
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="genre in stats.stats.topGenres.slice(0, 6)"
          :key="genre.name"
          class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs"
        >
          {{ genre.name }} (<AnimatedNumber :value="genre.count" format="default" :duration="timing.normal" priority="tertiary" />)
        </div>
      </div>
    </div>

    <!-- Top Stats - Adjust layout for different container sizes -->
    <div v-if="stats.topTracks || stats.topArtists" class="space-y-12">
      <div class="grid grid-cols-1 @[600px]:grid-cols-2 gap-12">
        <!-- Monthly Stats Column -->
        <div class="space-y-12">
          <!-- Monthly Top Artists -->
          <div v-if="stats.topArtists?.month" ref="monthlyArtistsRef" class="space-y-6">
            <StatsSectionHeader title="TOP_ARTISTS_30D" />
            <div class="space-y-2">
              <div
                v-for="(artist, index) in (stats.topArtists?.month || []).slice(0, 5)"
                :key="artist.name"
                class="flex items-baseline gap-2 @[350px]:gap-3 artist-row"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 text-sm truncate">
                  {{ artist.name }}
                </div>
                <div class="text-xs text-zinc-500 tabular-nums">
                  <AnimatedNumber :value="parseInt(artist.playcount)" format="default" :duration="timing.slow" priority="tertiary" />x
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Top Tracks -->
          <div v-if="stats.topTracks?.month" ref="monthlyTracksRef" class="space-y-6">
            <StatsSectionHeader title="TOP_TRACKS_30D" />
            <div class="space-y-2">
              <div
                v-for="(track, index) in (stats.topTracks?.month || []).slice(0, 5)"
                :key="track.name"
                class="flex items-baseline gap-2 @[350px]:gap-3 track-row"
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
                  <AnimatedNumber :value="parseInt(track.playcount)" format="default" :duration="timing.slow" priority="tertiary" />x
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Yearly Stats Column -->
        <div class="space-y-12">
          <!-- Yearly Top Artists -->
          <div v-if="stats.topArtists?.year" ref="yearlyArtistsRef" class="space-y-6">
            <StatsSectionHeader title="TOP_ARTISTS_365D" />
            <div class="space-y-2">
              <div
                v-for="(artist, index) in (stats.topArtists?.year || []).slice(0, 5)"
                :key="artist.name"
                class="flex items-baseline gap-2 @[350px]:gap-3 artist-row"
              >
                <div class="w-4 text-right text-xs text-zinc-600 tabular-nums">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 text-sm truncate">
                  {{ artist.name }}
                </div>
                <div class="text-xs text-zinc-500 tabular-nums">
                  <AnimatedNumber :value="parseInt(artist.playcount)" format="default" :duration="timing.slow" priority="tertiary" />x
                </div>
              </div>
            </div>
          </div>

          <!-- Yearly Top Tracks -->
          <div v-if="stats.topTracks?.year" ref="yearlyTracksRef" class="space-y-6">
            <StatsSectionHeader title="TOP_TRACKS_365D" />
            <div class="space-y-2">
              <div
                v-for="(track, index) in (stats.topTracks?.year || []).slice(0, 5)"
                :key="track.name"
                class="flex items-baseline gap-2 @[350px]:gap-3 track-row"
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
                  <AnimatedNumber :value="parseInt(track.playcount)" format="default" :duration="timing.slow" priority="tertiary" />x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState v-else state="unavailable" message="LASTFM_DATA_UNAVAILABLE" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { formatNumber as _formatNumber, formatDecimal as _formatDecimal } from '~/composables/useNumberFormat'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'
import AnimatedNumber from '../AnimatedNumber.vue'
import { animate, stagger, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

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

const { timing, easing, staggers } = useAnimations()

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
  } catch (_error) {
    console.warn('Error formatting track time:', _error)
    return ''
  }
}

// Animation refs
const lastfmStatsRef = ref<HTMLElement | null>(null)
const monthlyArtistsRef = ref<HTMLElement | null>(null)
const monthlyTracksRef = ref<HTMLElement | null>(null)
const yearlyArtistsRef = ref<HTMLElement | null>(null)
const yearlyTracksRef = ref<HTMLElement | null>(null)

// Epic LastFM stats scroll-triggered animations
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!lastfmStatsRef.value) return


    // Monthly artists with wave/spiral stagger patterns
    if (monthlyArtistsRef.value) {
      const artistRows = monthlyArtistsRef.value.querySelectorAll('.artist-row')
      if (artistRows.length) {
        animate(Array.from(artistRows), {
          opacity: [0, 1],
          translateX: [-15, 0],
          rotateZ: [-2, 0], // Subtle rotation impossible in staggered CSS
          scale: [0.96, 1],
          duration: timing.slow,
          delay: stagger(staggers.tight, { 
            direction: 'normal',
            easing: 'out(2)'  // Eased stagger timing - anime.js exclusive!
          }),
          ease: easing.productive,
          autoplay: onScroll({ target: monthlyArtistsRef.value, onEnter: () => true })
        })
      }
    }

    // Monthly tracks staggered entrance
    if (monthlyTracksRef.value) {
      const trackRows = monthlyTracksRef.value.querySelectorAll('.track-row')
      if (trackRows.length) {
        animate(Array.from(trackRows), {
          opacity: [0, 1],
          translateX: [-15, 0],
          scale: [0.96, 1],
          duration: timing.slow,
          delay: stagger(staggers.normal),
          ease: easing.productive,
          autoplay: onScroll({ target: monthlyTracksRef.value, onEnter: () => true })
        })
      }
    }

    // Yearly artists staggered entrance
    if (yearlyArtistsRef.value) {
      const artistRows = yearlyArtistsRef.value.querySelectorAll('.artist-row')
      if (artistRows.length) {
        animate(Array.from(artistRows), {
          opacity: [0, 1],
          translateX: [15, 0],
          scale: [0.95, 1],
          duration: timing.expressive,
          delay: stagger(staggers.normal),
          ease: easing.standard,
          autoplay: onScroll({ target: yearlyArtistsRef.value, onEnter: () => true })
        })
      }
    }

    // Yearly tracks staggered entrance
    if (yearlyTracksRef.value) {
      const trackRows = yearlyTracksRef.value.querySelectorAll('.track-row')
      if (trackRows.length) {
        animate(Array.from(trackRows), {
          opacity: [0, 1],
          translateX: [15, 0],
          scale: [0.95, 1],
          duration: timing.expressive,
          delay: stagger(staggers.normal),
          ease: easing.standard,
          autoplay: onScroll({ target: yearlyTracksRef.value, onEnter: () => true })
        })
      }
    }
  })
}

onMounted(() => {
  setupScrollAnimations()
})
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
/* Stat item styles */
.stat-item {
  @apply space-y-1 text-center;
}

.stat-item .stat-label {
  @apply text-xs tracking-wider text-zinc-500;
}

.stat-item .stat-value {
  @apply text-lg font-mono tabular-nums text-zinc-800 dark:text-zinc-200;
}
</style>
