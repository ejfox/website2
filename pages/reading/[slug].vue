<!--
  @file reading/[slug].vue
  @description /reading/<slug>: one book's cover, Kindle metadata, Kindle and
    Amazon links (from the ASIN) and its highlights. SSR. Data:
    /api/reading/<slug> (server/api/reading/[slug].get.ts), one processed JSON
    merged with Kindle sync data; scheduled books 404 in prod.
  Gotchas:
    - Canonical home for reading notes: /blog/reading/<slug> 301s here
      (server/middleware/blog-reading-redirect.ts).
    - Processed reading JSON stores the highlights body as `html` (older
      notes may carry `content`); render whichever exists.
    - No loading/error branches: setup awaits the fetch and throws a fatal 404,
      so error.vue owns the not-found state.
-->
<script setup>
const route = useRoute()

// CSS Classes
const metadataContainerClass =
  'flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400'
const linkClass = 'interactive-link text-blue-600 dark:text-blue-400 text-sm'
const navLinkClass =
  'interactive-link inline-flex items-center text-blue-600 dark:text-blue-400'

// ── Data loading ────────────────────────────────────────────
// Fetch book data
const { data: book, error } = await useFetch(
  `/api/reading/${route.params.slug}`
)

// A missing book is a real 404, not a 200 "Book Not Found" soft-404.
if (error.value || !book.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Book not found',
    fatal: true,
  })
}

// ── SEO ─────────────────────────────────────────────────────
const bookTitle = computed(
  () => book.value?.metadata?.['kindle-sync']?.title || book.value?.title
)
const bookAuthor = computed(
  () => book.value?.metadata?.['kindle-sync']?.author || 'Unknown author'
)
const highlightsCount = computed(
  () => book.value?.metadata?.['kindle-sync']?.highlightsCount || 0
)
const bookCover = computed(
  () => book.value?.metadata?.['kindle-sync']?.bookImageUrl
)
const bookTags = computed(() => book.value?.metadata?.tags || [])

usePageSeo({
  // This page renders its own JSON-LD below; don't add a second one.
  schema: false,
  title: computed(() =>
    bookTitle.value ? `${bookTitle.value} - Reading Notes` : 'Book Not Found'
  ),
  description: computed(() =>
    bookTitle.value
      ? `Highlights and notes from ${bookTitle.value} by ${bookAuthor.value}.`
      : 'Book not found'
  ),
  type: 'article',
  section: 'Reading',
  tags: computed(() =>
    bookTags.value.length ? bookTags.value : ['Reading', 'Highlights']
  ),
  image: computed(() => bookCover.value),
  imageAlt: computed(() =>
    bookTitle.value ? `Cover of ${bookTitle.value}` : 'Book cover'
  ),
  label1: 'Highlights',
  data1: computed(() => `${highlightsCount.value} saved`),
  label2: 'Author',
  data2: computed(() => bookAuthor.value),
})

const bookSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: bookTitle.value,
  author: bookAuthor.value,
  image: bookCover.value,
  // The processed JSON has no slug field; route.path is already URL-encoded.
  url: `https://ejfox.com${route.path}`,
  about: (bookTags.value || []).map((tag) => ({ '@type': 'Thing', name: tag })),
  workExample: {
    '@type': 'CreativeWork',
    name: `${bookTitle.value} notes`,
    description:
      'Highlights and notes from ' +
      `${bookTitle.value} by ${bookAuthor.value}`,
  },
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(bookSchema.value),
    },
  ],
}))

// Helper function
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-4xl mx-auto px-4 pt-8">
      <!-- ── Book ─────────── -->
      <!-- Book Content -->
      <div v-if="book">
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
                <span v-if="book.metadata?.lastUpdated">
                  Updated: {{ formatDate(book.metadata.lastUpdated) }}
                </span>
              </div>

              <!-- Links -->
              <div class="flex gap-4 mt-4">
                <!-- kindle:// only opens where the Kindle app is installed -->
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
          <div v-html="book.html || book.content"></div>
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
