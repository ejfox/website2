<template>
  <div v-if="data?.stats" class="space-y-3 font-mono">
    <!-- Essential metrics only -->
    <div>
      <StatsSectionHeader title="READING STATUS" />
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.totalRead || 0 }}
          </div>
          <div class="stat-label">
            READ
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ formatRating(data.stats.averageRating) }}
          </div>
          <div class="stat-label">
            AVG RATING
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.topRatedBooks?.length || 0 }}
          </div>
          <div class="stat-label">
            5-STAR
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.thisYear || 0 }}
          </div>
          <div class="stat-label">
            THIS YEAR
          </div>
        </div>
      </div>
    </div>

    <!-- Currently reading - typographic approach -->
    <div v-if="data?.books?.currentlyReading?.length">
      <StatsSectionHeader title="READING NOW" />
      <div class="space-y-1">
        <div 
          v-for="book in data.books.currentlyReading" 
          :key="book.bookId"
          class="text-xs"
        >
          <span class="font-medium">{{ book.title }}</span>
          <span class="text-muted"> — {{ book.author }}</span>
        </div>
      </div>
    </div>

    <!-- Recent reads - pure typography -->
    <div v-if="recentBooks.length">
      <StatsSectionHeader title="RECENT" />
      <div class="text-xs space-y-0.5">
        <div 
          v-for="book in recentBooks.slice(0, 12)" 
          :key="book.bookId"
          class="flex items-center justify-between"
        >
          <span class="truncate flex-1 min-w-0">
            {{ book.title }}
            <span class="text-muted"> — {{ book.author }}</span>
          </span>
          <span 
            v-if="book.rating >= 4" 
            class="text-yellow-500 flex-shrink-0 ml-2"
            :class="book.rating === 5 ? 'font-bold' : ''"
          >
            {{ '★'.repeat(book.rating) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <a 
        :href="data.stats.profileUrl" 
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-muted hover:text-primary transition-colors uppercase tracking-wider"
      >
        View on Goodreads ↗
      </a>
    </div>
  </div>
  
  <div v-else-if="data?.error" class="text-center py-8">
    <div class="text-sm text-muted">
      {{ data.error }}
    </div>
    <div class="text-xs text-muted mt-2">
      RSS feeds may be restricted or parsing failed
    </div>
  </div>
  
  <div v-else class="text-center py-8 text-muted">
    <div class="text-sm">
      Goodreads data not available
    </div>
  </div>
</template>

<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const formatRating = (rating) => {
  if (!rating || rating === 0) return '—'
  return rating.toFixed(1)
}

// Recent books for tiny spine visualization - like books on a shelf
const recentBooks = computed(() => {
  if (!props.data?.books?.read?.length) return []
  
  // Take recent reads and limit to reasonable amount for visualization
  return props.data.books.read.slice(0, 60).map(book => ({
    ...book,
    // Ensure we have cover data
    cover: book.cover || null
  }))
})
</script>