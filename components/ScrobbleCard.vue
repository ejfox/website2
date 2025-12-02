<template>
  <article class="scrobble-card">
    <div class="flex gap-3">
      <!-- Music icon -->
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
        <svg class="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-baseline gap-2 mb-2">
          <span class="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{{ count }} scrobbles</span>
          <span v-if="topArtists?.length" class="text-zinc-400 dark:text-zinc-500 text-xs">
            {{ topArtists.slice(0, 2).join(', ') }}
          </span>
        </div>

        <!-- Tracks -->
        <div class="space-y-1">
          <div
            v-for="(track, i) in topTracks"
            :key="track"
            class="flex items-center gap-2 text-sm"
          >
            <span class="text-zinc-300 dark:text-zinc-700 text-xs font-mono w-4">{{ i + 1 }}</span>
            <span class="text-zinc-600 dark:text-zinc-400 truncate">{{ track }}</span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  count: number
  topTracks: string[]
  topArtists?: string[]
  date?: string
}

defineProps<Props>()
</script>

<style scoped>
.scrobble-card {
  @apply p-4 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl;
  @apply transition-colors duration-150;
}

.scrobble-card:hover {
  @apply bg-zinc-50 dark:bg-zinc-900/50;
}
</style>
