<!--
  @file GoodreadsStats.vue
  @description BOOKS section of /stats: four headline metrics, currently
    reading (with covers), last 8 read, and a profile link.
    Data: stats.goodreads from /api/stats, built by server/api/goodreads.get.ts
    from EJ's Goodreads RSS shelf. Wired in pages/stats.vue.
  @props goodreadsStats: { stats, currentlyReading, recentlyRead, error? }
  pages/stats.vue only mounts this when .stats exists, so there the error and
  "Loading" branches never render.
-->
<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'
import { formatNumber } from '~/utils/numberFormat'

defineProps({
  goodreadsStats: {
    type: Object,
    default: () => ({}),
  },
})

const formatRating = (rating) => {
  if (!rating || rating === 0) return '—'
  return rating.toFixed(1)
}
</script>

<template>
  <div v-if="goodreadsStats?.stats" class="space-y-4 font-mono">
    <!-- Essential metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div class="metric-card">
        <div class="stat-value">
          {{ goodreadsStats.stats.totalRead || 0 }}
        </div>
        <div class="stat-label">BOOKS READ</div>
      </div>
      <div class="metric-card">
        <div class="stat-value">
          {{ formatRating(goodreadsStats.stats.averageRating) }}
        </div>
        <div class="stat-label">AVG RATING</div>
      </div>
      <div class="metric-card">
        <div class="stat-value">
          {{ goodreadsStats.stats.currentlyReading || 0 }}
        </div>
        <div class="stat-label">READING NOW</div>
      </div>
      <div class="metric-card">
        <div class="stat-value">
          {{ formatNumber(goodreadsStats.stats.pagesReadThisYear || 0) }}
        </div>
        <div class="stat-label">PAGES THIS YEAR</div>
      </div>
    </div>

    <div v-if="goodreadsStats.currentlyReading?.length">
      <StatsSectionHeader title="CURRENTLY READING" />
      <div class="space-y-2">
        <a
          v-for="book in goodreadsStats.currentlyReading"
          :key="book.id"
          :href="book.goodreadsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-start gap-3 group"
        >
          <img
            v-if="book.imageUrl"
            :src="book.imageUrl"
            :alt="book.title"
            class="w-10 aspect-[2/3] object-cover rounded-sm flex-shrink-0"
          />
          <div class="min-w-0 flex-1 text-xs">
            <div class="font-medium truncate group-hover:underline">
              {{ book.title }}
            </div>
            <div class="text-muted truncate">{{ book.author }}</div>
            <div v-if="book.numPages" class="text-muted text-3xs">
              {{ book.numPages }} pages
            </div>
          </div>
        </a>
      </div>
    </div>

    <div v-if="goodreadsStats.recentlyRead?.length">
      <StatsSectionHeader title="RECENTLY READ" />
      <div class="text-xs space-y-1">
        <a
          v-for="book in goodreadsStats.recentlyRead.slice(0, 8)"
          :key="book.id"
          :href="book.goodreadsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 -mx-1 px-1 rounded"
        >
          <span class="truncate flex-1 min-w-0">
            {{ book.title }}
            <span class="text-muted">— {{ book.author }}</span>
          </span>
          <!-- Only 3+ stars get shown; rating is EJ's own (null if unrated) -->
          <span
            v-if="book.rating && book.rating >= 3"
            class="text-amber-600 dark:text-yellow-500 flex-shrink-0 ml-2 tabular-nums"
          >
            {{ '★'.repeat(book.rating) }}
          </span>
        </a>
      </div>
    </div>

    <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <a
        :href="goodreadsStats.stats.profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="link-uppercase-tiny"
      >
        View on Goodreads ↗
      </a>
    </div>
  </div>

  <div v-else-if="goodreadsStats?.error" class="text-center py-8">
    <div class="text-sm text-muted">
      {{ goodreadsStats.error }}
    </div>
  </div>

  <div v-else class="text-center py-8 text-muted">
    <div class="text-sm">Loading Goodreads data...</div>
  </div>
</template>
