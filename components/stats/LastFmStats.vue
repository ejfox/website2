<template>
  <div v-if="stats.error" class="space-y-4">
    <div class="text-sm text-zinc-400">
      Unable to load Last.fm data: {{ stats.error.message }}
    </div>
    <div class="text-xs text-zinc-500">
      <a href="https://www.last.fm/user/pseudoplacebo" target="_blank" rel="noopener noreferrer" 
         class="hover:text-zinc-300 transition-colors">
        View Last.fm Profile →
      </a>
    </div>
  </div>
  <div v-else class="space-y-8">
    <!-- Overview -->
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card">
          <div class="text-2xl font-mono">{{ formatNumber(stats.stats?.totalScrobbles || 0) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">Total Scrobbles</div>
        </div>
        <div class="stat-card">
          <div class="text-2xl font-mono">{{ formatNumber(stats.stats?.averagePerDay || 0) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">Daily Average</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card">
          <div class="text-2xl font-mono">{{ formatNumber(stats.stats?.uniqueArtists || 0) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">Unique Artists</div>
        </div>
        <div class="stat-card">
          <div class="text-2xl font-mono">{{ formatNumber(stats.stats?.uniqueTracks || 0) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">Unique Tracks</div>
        </div>
      </div>
    </div>

    <!-- Recent Tracks -->
    <div v-if="stats.recentTracks?.tracks?.length" class="space-y-4">
      <h3 class="text-xs text-zinc-500 uppercase tracking-wider">Recently Played</h3>
      <div class="space-y-3">
        <div v-for="(track, index) in stats.recentTracks.tracks.slice(0, 5)" :key="index" class="flex items-center gap-3">
          <div class="w-10 h-10 bg-zinc-800 flex-shrink-0">
            <img v-if="getTrackImage(track)" :src="getTrackImage(track)" alt="" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-600">
              <UIcon name="i-heroicons-musical-note" class="w-5 h-5" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm truncate">{{ track.name }}</div>
            <div class="text-xs text-zinc-500 truncate">{{ track.artist.name }}</div>
          </div>
          <div v-if="track.date" class="text-xs text-zinc-500 whitespace-nowrap">
            {{ formatTimeAgo(track.date.uts) }}
          </div>
          <div v-else class="text-xs text-zinc-500 whitespace-nowrap">
            <span class="inline-flex items-center gap-1">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Now Playing
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Artists -->
    <div v-if="stats.topArtists?.artists?.length" class="space-y-4">
      <h3 class="text-xs text-zinc-500 uppercase tracking-wider">Top Artists (Month)</h3>
      <div class="space-y-2">
        <div v-for="(artist, index) in stats.topArtists.artists.slice(0, 5)" :key="index" 
             class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="text-xs text-zinc-500 w-4 text-right">{{ index + 1 }}</div>
            <div class="text-sm">{{ artist.name }}</div>
          </div>
          <div class="text-xs text-zinc-500">{{ artist.playcount }} plays</div>
        </div>
      </div>
    </div>

    <!-- Top Albums -->
    <div v-if="stats.topAlbums?.albums?.length" class="space-y-4">
      <h3 class="text-xs text-zinc-500 uppercase tracking-wider">Top Albums (Month)</h3>
      <div class="space-y-2">
        <div v-for="(album, index) in stats.topAlbums.albums.slice(0, 5)" :key="index" 
             class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="text-xs text-zinc-500 w-4 text-right">{{ index + 1 }}</div>
            <div class="min-w-0 flex-1">
              <div class="text-sm truncate">{{ album.name }}</div>
              <div class="text-xs text-zinc-500 truncate">{{ album.artist.name }}</div>
            </div>
          </div>
          <div class="text-xs text-zinc-500">{{ album.playcount }} plays</div>
        </div>
      </div>
    </div>

    <!-- Top Tracks -->
    <div v-if="stats.topTracks?.tracks?.length" class="space-y-4">
      <h3 class="text-xs text-zinc-500 uppercase tracking-wider">Top Tracks (Month)</h3>
      <div class="space-y-2">
        <div v-for="(track, index) in stats.topTracks.tracks.slice(0, 5)" :key="index" 
             class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="text-xs text-zinc-500 w-4 text-right">{{ index + 1 }}</div>
            <div class="min-w-0 flex-1">
              <div class="text-sm truncate">{{ track.name }}</div>
              <div class="text-xs text-zinc-500 truncate">{{ track.artist.name }}</div>
            </div>
          </div>
          <div class="text-xs text-zinc-500">{{ track.playcount }} plays</div>
        </div>
      </div>
    </div>

    <!-- Last.fm Profile Link -->
    <div class="text-center pt-4">
      <a :href="stats.userInfo.url" target="_blank" rel="noopener noreferrer" 
         class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        View Last.fm Profile →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  image: Array<{
    size: string
    '#text': string
  }>
}

interface LastFmStats {
  recentTracks: {
    tracks: LastFmTrack[]
    total: number
  }
  topArtists: {
    artists: Array<{
      name: string
      playcount: string
      url: string
      image: Array<{
        size: string
        '#text': string
      }>
    }>
    total: number
  }
  topAlbums: {
    albums: Array<{
      name: string
      playcount: string
      artist: {
        name: string
        url: string
      }
      url: string
      image: Array<{
        size: string
        '#text': string
      }>
    }>
    total: number
  }
  topTracks: {
    tracks: Array<{
      name: string
      artist: {
        name: string
        url: string
      }
      url: string
      playcount?: string
      image: Array<{
        size: string
        '#text': string
      }>
    }>
    total: number
  }
  userInfo: {
    playcount: number
    registered: {
      unixtime: string
      formatted: string
    }
    url: string
    image: string
  }
  stats: {
    totalScrobbles: number
    uniqueArtists: number
    uniqueTracks: number
    averagePerDay: number
    topGenres: Array<{
      name: string
      count: number
    }>
  }
  lastUpdated: string
  error?: {
    message: string
    statusCode: number
  }
}

const props = defineProps<{
  stats: LastFmStats
}>()

// Format large numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Get medium-sized image from track
const getTrackImage = (track: LastFmTrack): string => {
  const mediumImage = track.image.find(img => img.size === 'medium')
  return mediumImage && mediumImage['#text'] ? mediumImage['#text'] : ''
}

// Get album image
const getAlbumImage = (album: any): string => {
  const mediumImage = album.image.find(img => img.size === 'medium')
  return mediumImage && mediumImage['#text'] ? mediumImage['#text'] : ''
}

// Format time ago for recent tracks
const formatTimeAgo = (timestamp: string): string => {
  const now = Math.floor(Date.now() / 1000)
  const seconds = now - parseInt(timestamp)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return new Date(parseInt(timestamp) * 1000).toLocaleDateString()
}
</script>

<style scoped>
.stat-card {
  @apply p-3 bg-zinc-900/50 border border-zinc-800/50;
}
</style>
