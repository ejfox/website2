<!--
  @file GoodreadsStats.vue
  @description Goodreads reading statistics from RSS feed
  @props goodreadsStats: Object - Goodreads data from /api/goodreads
-->
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

    <!-- Currently reading -->
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
            class="w-10 h-14 object-cover rounded-sm flex-shrink-0"
          />
          <div class="min-w-0 flex-1 text-xs">
            <div class="font-medium truncate group-hover:underline">
              {{ book.title }}
            </div>
            <div class="text-muted truncate">{{ book.author }}</div>
            <div v-if="book.numPages" class="text-muted text-[10px]">
              {{ book.numPages }} pages
            </div>
          </div>
        </a>
      </div>
    </div>

    <!-- Recently read -->
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
          <span
            v-if="book.rating && book.rating >= 3"
            class="text-yellow-500 flex-shrink-0 ml-2 tabular-nums"
          >
            {{ '★'.repeat(book.rating) }}
          </span>
        </a>
      </div>
    </div>

    <!-- Footer -->
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

<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'

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

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}
</script>
