<!--
  @file GoodreadsStats.vue
  @description Goodreads reading statistics
  @props stats: Object - Goodreads data
-->
<template>
  <div v-if="data?.stats" class="space-y-2 font-mono">
    <!-- Primary stat -->
    <div class="text-center py-2">
      <div class="text-2xl font-bold">{{ data.stats.thisYear || 0 }}</div>
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-2">
        BOOKS THIS YEAR
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        {{ data.stats.totalRead || 0 }} TOTAL ·
        {{ formatRating(data.stats.averageRating) }} AVG
      </div>
    </div>

    <!-- Monthly reading activity small multiples -->
    <div v-if="monthlyReading.length" class="space-y-2 mb-4">
      <div
        v-for="month in monthlyReading"
        :key="month.key"
        class="flex items-center gap-2 text-xs"
      >
        <span class="text-zinc-500 uppercase tracking-widest w-10 text-xs">
          {{ month.label }}
        </span>
        <div class="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-sm">
          <div
            class="h-full bg-zinc-400 dark:bg-zinc-500 rounded-sm transition-all"
            :style="{ width: `${month.barPct}%` }"
          ></div>
        </div>
        <span
          class="text-zinc-700 dark:text-zinc-300 tabular-nums w-6 text-right"
        >
          {{ month.count }}
        </span>
      </div>
    </div>

    <!-- Rating distribution -->
    <div v-if="ratingDistribution.length">
      <StatsSectionHeader title="RATINGS" />
      <div class="space-y-1">
        <div
          v-for="rating in ratingDistribution"
          :key="rating.stars"
          class="flex items-center gap-2 text-xs"
        >
          <span class="text-yellow-500 w-14">
            {{ '★'.repeat(rating.stars) }}
          </span>
          <div class="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-sm">
            <div
              class="h-full bg-yellow-400 dark:bg-yellow-500 rounded-sm"
              :style="{ width: `${rating.pct}%` }"
            ></div>
          </div>
          <span class="text-zinc-500 tabular-nums w-6 text-right">
            {{ rating.count }}
          </span>
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
          <span class="text-muted">— {{ book.author }}</span>
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
            <span class="text-muted">— {{ book.author }}</span>
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
        class="link-uppercase-tiny"
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
    <div class="text-sm">Goodreads data not available</div>
  </div>
</template>

<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const formatRating = (rating) => {
  if (!rating || rating === 0) return '—'
  return rating.toFixed(1)
}

// Monthly reading small multiples (last 6 months)
const monthlyReading = computed(() => {
  const byMonth = props.data?.stats?.readingByMonth || {}
  const now = new Date()
  const months = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    months.push({ key, label, count: byMonth[key] || 0 })
  }

  const max = Math.max(...months.map((m) => m.count), 1)
  return months.map((m) => ({
    ...m,
    barPct: Math.round((m.count / max) * 100),
  }))
})

// Rating distribution from recent reads
const ratingDistribution = computed(() => {
  const reads = props.data?.books?.read || []
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  reads.forEach((b) => {
    if (b.rating && b.rating >= 1 && b.rating <= 5) counts[b.rating]++
  })

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    pct: Math.round((counts[stars] / total) * 100),
  }))
})

// Recent books for tiny spine visualization - like books on a shelf
const recentBooks = computed(() => {
  if (!props.data?.books?.read?.length) return []

  // Take recent reads and limit to reasonable amount for visualization
  return props.data.books.read.slice(0, 60).map((book) => ({
    ...book,
    // Ensure we have cover data
    cover: book.cover || null,
  }))
})
</script>
