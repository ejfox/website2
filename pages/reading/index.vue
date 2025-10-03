<template>
  <div class="min-h-screen">
    <div class="px-4 md:px-8" style="max-width: 65ch">
      <!-- Header with data overlay -->
      <header class="mb-8">
        <!-- Data stream indicator -->
        <div
          class="font-mono text-xs text-zinc-400 mb-2 mt-8"
          style="font-variant-numeric: tabular-nums"
        >
          <span>READING</span>
          <span class="mx-2">·</span>
          <span>{{ books?.length || 0 }} BOOKS</span>
          <span class="mx-2">·</span>
          <span>{{ totalHighlights }} HIGHLIGHTS</span>
        </div>
        <h1
          class="font-serif text-3xl font-normal mb-2"
          style="letter-spacing: -0.02em"
        >
          Reading Collection
        </h1>
        <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
          Books, highlights, and notes from my digital library.
        </p>

        <!-- Stats -->
        <div
          v-if="books"
          class="mt-4 font-mono text-xs text-zinc-500"
          style="
            font-feature-settings:
              'lnum' 1,
              'tnum' 1;
          "
        >
          <span>UPDATED: {{ lastUpdated }}</span>
        </div>
      </header>

      <!-- Loading State -->
      <div
        v-if="pending"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div v-for="i in 6" :key="i" class="animate-pulse">
          <div
            class="bg-zinc-100 dark:bg-zinc-900 rounded-sm aspect-[3/4]"
          ></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <h2 class="font-serif text-xl text-red-600 dark:text-red-400 mb-4">
          Error Loading Books
        </h2>
        <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
          {{ error.message }}
        </p>
      </div>

      <!-- Books Grid -->
      <div
        v-else-if="books?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <NuxtLink
          v-for="book in books"
          :key="book.slug"
          :to="`/reading/${book.slug}`"
          class="group block transition-opacity duration-200 hover:opacity-75"
        >
          <!-- Book Cover -->
          <div class="aspect-[3/4] mb-4 flex items-center justify-center">
            <img
              v-if="book.metadata?.['kindle-sync']?.bookImageUrl"
              :src="book.metadata['kindle-sync'].bookImageUrl"
              :alt="`Cover of ${book.metadata['kindle-sync']?.title || book.title}`"
              class="max-h-full max-w-full object-contain rounded-sm shadow-sm"
            />
            <div
              v-else
              class="text-zinc-400 dark:text-zinc-600 text-center p-4"
            >
              <div class="text-2xl mb-2">📖</div>
              <div class="text-sm">No Cover</div>
            </div>
          </div>

          <!-- Book Info -->
          <div class="space-y-2">
            <h3
              class="font-serif text-base font-normal text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors line-clamp-2"
              style="letter-spacing: -0.01em"
            >
              {{ book.metadata?.['kindle-sync']?.title || book.title }}
            </h3>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              {{ book.metadata?.['kindle-sync']?.author }}
            </p>

            <!-- Random highlight preview -->
            <div
              v-if="book.randomHighlight"
              class="font-serif text-xs text-zinc-500 dark:text-zinc-500 italic line-clamp-3"
            >
              "{{ book.randomHighlight }}"
            </div>

            <!-- Highlights count -->
            <div
              class="flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400"
              style="
                font-feature-settings:
                  'lnum' 1,
                  'tnum' 1;
              "
            >
              <span v-if="book.metadata?.['kindle-sync']?.highlightsCount">
                {{ book.metadata['kindle-sync'].highlightsCount }} highlights
              </span>
              <span v-if="book.metadata?.['kindle-sync']?.lastAnnotatedDate">
                {{ formatDate(book.metadata['kindle-sync'].lastAnnotatedDate) }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <div class="font-mono text-xs text-zinc-400 mb-8">NO_DATA</div>
        <h2 class="font-serif text-xl text-zinc-900 dark:text-zinc-100 mb-4">
          No Books Found
        </h2>
        <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
          No reading notes have been processed yet.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Fetch reading list
const { data: books, pending, error } = await useFetch('/api/reading')

// Computed properties for stats
const totalHighlights = computed(() => {
  if (!books.value) return 0
  return books.value.reduce((total, book) => {
    return total + (book.metadata?.['kindle-sync']?.highlightsCount || 0)
  }, 0)
})

const lastUpdated = computed(() => {
  if (!books.value?.length) return 'Never'

  const dates = books.value
    .map(
      (book) =>
        book.metadata?.['kindle-sync']?.lastAnnotatedDate || book.metadata?.date
    )
    .filter(Boolean)
    .sort()

  if (dates.length === 0) return 'Unknown'

  return formatDate(dates[dates.length - 1])
})

// SEO
useHead({
  title: 'Reading Collection - EJ Fox',
  meta: [
    {
      name: 'description',
      content:
        'A collection of books, highlights, and reading notes from my digital library.'
    }
  ]
})

// Helper function
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
