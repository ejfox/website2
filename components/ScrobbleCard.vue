<template>
  <article class="scrobble-card">
    <div class="flex gap-2">
      <!-- Icon -->
      <div class="flex-shrink-0 pt-1">
        <span class="text-zinc-400 dark:text-zinc-600 text-xs">♫</span>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-baseline gap-2 mb-1 text-xs">
          <span class="text-zinc-400 dark:text-zinc-500">
            {{ count }} plays
          </span>
          <span
            v-if="topArtists?.length"
            class="text-zinc-500 dark:text-zinc-400"
          >
            {{ topArtists.slice(0, 2).join(', ') }}
          </span>
        </div>

        <!-- Tracks -->
        <div class="space-y-0.5">
          <div
            v-for="track in topTracks.slice(0, 3)"
            :key="track"
            class="text-sm text-zinc-700 dark:text-zinc-300 truncate"
          >
            {{ track }}
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
  @apply py-3 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.scrobble-card:hover {
  @apply bg-zinc-50/30 dark:bg-zinc-900/30;
}
</style>
