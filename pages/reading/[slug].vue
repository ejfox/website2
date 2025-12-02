<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="pending" class="animate-pulse">
        <div class="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-8"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <h1 class="text-2xl font-light text-red-600 dark:text-red-400 mb-4">
          Book Not Found
        </h1>
        <p class="text-secondary">
          The book "{{ route.params.slug }}" doesn't exist in the reading
          collection.
        </p>
        <NuxtLink to="/reading" :class="backLinkClass">
          ← Back to Reading List
        </NuxtLink>
      </div>

      <!-- Book Content -->
      <div v-else-if="book">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-start gap-8">
            <!-- Book Cover -->
            <div
              v-if="book.metadata?.['kindle-sync']?.bookImageUrl"
              class="flex-shrink-0"
            >
              <img
                :src="book.metadata['kindle-sync'].bookImageUrl"
                :alt="`Cover of ${book.metadata['kindle-sync'].title}`"
                class="w-24 h-auto rounded-sm shadow-sm"
              />
            </div>

            <!-- Book Info -->
            <div class="flex-grow">
              <h1
                class="text-3xl font-light text-zinc-900 dark:text-white mb-2"
              >
                {{ book.metadata?.['kindle-sync']?.title || book.title }}
              </h1>
              <p class="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
                by
                {{ book.metadata?.['kindle-sync']?.author ?? 'Unknown Author' }}
              </p>

              <!-- Metadata -->
              <div :class="metadataContainerClass">
                <span v-if="book.metadata?.['kindle-sync']?.highlightsCount">
                  {{ book.metadata?.['kindle-sync']?.highlightsCount ?? 0 }}
                  highlights
                </span>
                <span v-if="book.metadata?.['kindle-sync']?.lastAnnotatedDate">
                  Last annotated:
                  {{
                    formatDate(
                      book.metadata?.['kindle-sync']?.lastAnnotatedDate
                    )
                  }}
                </span>
                <span v-if="book.metadata?.date">
                  Added: {{ formatDate(book.metadata.date) }}
                </span>
              </div>

              <!-- Links -->
              <div class="flex gap-4 mt-4">
                <a
                  v-if="book.metadata?.['kindle-sync']?.asin"
                  :href="`kindle://book?action=open&asin=${
                    book.metadata['kindle-sync'].asin
                  }`"
                  :class="linkClass"
                >
                  Open in Kindle
                </a>
                <a
                  v-if="book.metadata?.['kindle-sync']?.asin"
                  :href="`https://www.amazon.com/dp/${
                    book.metadata['kindle-sync'].asin
                  }`"
                  target="_blank"
                  :class="linkClass"
                >
                  View on Amazon
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Book Content (Highlights) -->
        <div class="prose prose-lg dark:prose-invert max-w-none">
          <div v-html="book.content"></div>
        </div>

        <!-- Tags -->
        <div v-if="book.metadata?.tags?.length" class="mt-8">
          <h3 class="text-sm font-medium text-zinc-900 dark:text-white mb-4">
            Tags
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in book.metadata.tags"
              :key="tag"
              class="text-xs text-zinc-600 dark:text-zinc-400"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-8">
          <NuxtLink to="/reading" :class="navLinkClass">
            ← Back to Reading List
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()

// CSS Classes
const backLinkClass =
  'interactive-link inline-block mt-4 text-blue-600 dark:text-blue-400'
const metadataContainerClass =
  'flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400'
const linkClass = 'interactive-link text-blue-600 dark:text-blue-400 text-sm'
const navLinkClass =
  'interactive-link inline-flex items-center text-blue-600 dark:text-blue-400'

// Fetch book data
const {
  data: book,
  pending,
  error,
} = await useFetch(`/api/reading/${route.params.slug}`)

// SEO
useHead({
  title: book.value
    ? `${
        book.value.metadata?.['kindle-sync']?.title || book.value.title
      } - Reading Notes`
    : 'Book Not Found',
  meta: [
    {
      name: 'description',
      content: book.value
        ? `Highlights and notes from ${
            book.value.metadata?.['kindle-sync']?.title
          } by ${book.value.metadata?.['kindle-sync']?.author}`
        : 'Book not found',
    },
  ],
})

// Helper function
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
