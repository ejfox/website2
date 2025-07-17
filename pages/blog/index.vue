/** * Blog Index Page * ============== * * Week Note Detection Rules *
------------------------ * A post is considered a week note if ANY of these
conditions are met: * 1. Type is 'weekNote' * 2. Slug starts with 'week-notes/'
* 3. Slug matches YYYY-WW pattern (e.g. "2024-45") * * The third pattern was
crucial and initially missed, causing week notes * to appear in both the main
blog posts section and the week notes section. * * Week Note Formats We Support:
* - Modern format: week-notes/2024-45 * - Legacy format: 2024-45 (at root level)
* - Type-based: Any post with type: 'weekNote' * * Filtering Logic *
-------------- * - Blog Posts section: Excludes anything matching week note
patterns * - Week Notes section: Only includes posts matching week note patterns
* - Recently Updated: Includes both types but filters by update date */

<script setup>
import { format, formatDistanceToNow } from 'date-fns'
import { computed, ref, onMounted, watch } from 'vue'
import { startOfWeek, subMonths } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'
import PostMetadata from '~/components/PostMetadata.vue'

const processedMarkdown = useProcessedMarkdown()
const now = new Date()


const { data: posts } = useAsyncData('blog-posts', async () => {
  try {
    // Get all regular posts (no drafts, no week notes)
    const result = await processedMarkdown.getAllPosts(false, false)

    // Process posts to ensure titles are set and filter out week notes
    return result
      .filter((post) => {
        const slug = post?.slug || ''
        const type = post?.type || post?.metadata?.type
        const slugParts = slug.split('/')
        const lastPart = slugParts[slugParts.length - 1]

        // Check if it's a week note by:
        // 1. Type is weekNote
        // 2. Slug starts with week-notes/
        // 3. Slug matches YYYY-WW pattern (e.g. 2024-45)
        const isWeekNote =
          type === 'weekNote' ||
          slug.startsWith('week-notes/') ||
          /^\d{4}-\d{2}$/.test(lastPart)

        // Whitelist approach: only show posts that match these patterns
        const isRegularBlogPost = 
          // Year-based posts (e.g., 2024/my-post)
          /^\d{4}\/[^/]+$/.test(slug)

        // Also check if it's not hidden, draft, or future
        const isHidden = post?.hidden === true || post?.metadata?.hidden === true
        const isDraft = post?.draft === true || post?.metadata?.draft === true
        const postDate = post?.date || post?.metadata?.date
        const isFuturePost = postDate && new Date(postDate) > now
        
        return !isWeekNote && isRegularBlogPost && !isHidden && !isDraft && !isFuturePost
      })
      .map((post) => {
        // Get title with proper fallbacks
        const title =
          post.title || post?.metadata?.title || formatTitle(post.slug)

        return {
          ...post,
          title,
          metadata: {
            ...post.metadata,
            title
          }
        }
      })
  } catch (err) {
    console.error('Error in blog index:', err)
    return []
  }
})

const { data: notes, error: notesError } = useAsyncData(
  'week-notes',
  async () => {
    try {
      // Get all posts including week notes
      const result = await processedMarkdown.getAllPosts(false, true)

      // Filter for week notes only
      const weekNotes =
        result?.filter((post) => {
          const slug = post?.slug || ''
          const type = post?.type || post?.metadata?.type
          const slugParts = slug.split('/')
          const lastPart = slugParts[slugParts.length - 1]

          // Check if it's a week note by:
          // 1. Type is weekNote
          // 2. Slug starts with week-notes/
          // 3. Slug matches YYYY-WW pattern (e.g. 2024-45)
          const isWeekNote =
            type === 'weekNote' ||
            slug.startsWith('week-notes/') ||
            /^\d{4}-\d{2}$/.test(lastPart)

          return isWeekNote
        }) || []

      // Process week notes to ensure all required fields
      return weekNotes.map((note) => {
        // Ensure we have a proper metadata structure
        const metadata = note?.metadata || {}
        return {
          ...note,
          metadata,
          slug: note?.slug || metadata?.slug,
          dek: note?.dek || metadata?.dek,
          date: note?.date || metadata?.date,
          type: note?.type || metadata?.type || 'weekNote'
        }
      })
    } catch (err) {
      console.error('Error fetching week notes:', err)
      return []
    }
  }
)

const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

useHead({
  title: 'Blog',
  meta: [{ name: 'description', content: 'Blog posts and week notes' }]
})

// Sort week notes and convert week slug to actual dates
const sortedWeekNotes = computed(() => {
  if (!notes.value) return []

  return notes.value
    .map((note) => {
      // Create a new object to avoid mutating the reactive source
      const processedNote = { ...note }
      const weekMatch = note?.slug?.match(/(\d{4})-(\d{2})/)

      if (weekMatch) {
        const year = parseInt(weekMatch[1], 10)
        const week = parseInt(weekMatch[2], 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
        processedNote.actualDate = new Date(
          date.setDate(date.getDate() + (week - 1) * 7)
        )
      } else {
        // If no week match, use the note's date
        const noteDate = note?.date || note?.metadata?.date
        if (noteDate) {
          processedNote.actualDate = new Date(noteDate)
        }
      }
      return processedNote
    })
    .filter((note) => {
      // Must have a date and a dek
      if (!note?.actualDate || !note?.slug) return false
      const hasDek = note?.dek || note?.metadata?.dek
      if (!hasDek) return false
      const isHidden = note?.hidden || note?.metadata?.hidden
      if (isHidden) return false
      return true
    })
    .sort((a, b) => b.actualDate - a.actualDate)
    .slice(0, 5)
})

// Watch notes for debugging
watch(
  () => notes.value,
  (newNotes) => {
    if (!newNotes) {
      return
    }
  },
  { immediate: true }
)

function groupByYear(posts) {
  if (!posts || !Array.isArray(posts)) return {}

  const grouped = {}
  posts.forEach((post) => {
    const postDate = post?.date || post?.metadata?.date
    if (!postDate) return
    const date = new Date(postDate)
    if (isNaN(date.getTime())) return
    const year = date.getFullYear()
    if (!grouped[year]) {
      grouped[year] = []
    }
    grouped[year].push(post)
  })

  // Sort posts within each year by date (newest first)
  Object.keys(grouped).forEach((year) => {
    grouped[year].sort((a, b) => {
      const dateA = new Date(b?.date || b?.metadata?.date)
      const dateB = new Date(a?.date || a?.metadata?.date)
      return dateA - dateB
    })
  })

  return grouped
}

const blogPostsByYear = computed(() => {
  if (!posts.value || !Array.isArray(posts.value)) return {}
  return groupByYear(posts.value)
})

const sortedYears = computed(() => {
  return Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
})

const blogPostElements = ref([])
const weekNoteElements = ref([])

const animDuration = 900
const animStagger = 125

const isLoading = ref(true)

onMounted(() => {
  isLoading.value = false

  // Simple fade-in for all content
  if (blogPostElements.value?.length) {
    animate(blogPostElements.value, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      easing: 'easeOutQuad',
      delay: (el, i) => i * 50
    })
  }

  if (weekNoteElements.value?.length) {
    animate(weekNoteElements.value, {
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad',
      delay: (el, i) => 300 + (i * 50)
    })
  }
})

const recentlyUpdatedPosts = computed(() => {
  if (!posts.value) return []
  const oneMonthAgo = subMonths(new Date(), 1)
  return [...posts.value]
    .filter((post) => {
      // Get metadata from either location
      const metadata = post?.metadata || post
      const isHidden = metadata?.hidden === true || metadata?.hidden === 'true'
      const isDraft = metadata?.draft === true || metadata?.draft === 'true'
      return !isHidden && !isDraft
    })
    .filter((post) => {
      const metadata = post?.metadata || post
      const updateDate = new Date(metadata?.lastUpdated || metadata?.date)
      return updateDate > oneMonthAgo
    })
    .sort((a, b) => {
      const metaA = a?.metadata || a
      const metaB = b?.metadata || b
      return (
        new Date(metaB?.lastUpdated || metaB?.date) -
        new Date(metaA?.lastUpdated || metaA?.date)
      )
    })
    .slice(0, 5)
})

// Add a helper function to format titles from slugs
function formatTitle(slug) {
  // Remove year prefix and get last part of path
  const baseName = slug.split('/').pop() || slug

  // Convert kebab-case to Title Case
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to create metadata object for PostMetadata component
function createPostMetadata(post) {
  if (!post) return null

  const metadata = post?.metadata || {}

  return {
    slug: post?.slug || metadata?.slug,
    title: post?.title || metadata?.title,
    date: post?.date || metadata?.date,
    draft: post?.draft || metadata?.draft,
    wordCount: post?.wordCount || metadata?.words,
    imageCount: post?.imageCount || metadata?.images,
    linkCount: post?.linkCount || metadata?.links,
    dek: post?.dek || metadata?.dek,
    metadata
  }
}
</script>

<template>
  <SwissGrid v-if="isLoading">
    <div class="animate-pulse">
      <div class="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
      <div class="space-y-3">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
      </div>
    </div>
  </SwissGrid>

  <SwissGrid v-else>
    <!-- Header -->
    <header class="mb-20">
      <h1 class="text-display mb-8">
        Blog
      </h1>
      <p class="text-body">
        Thoughts, projects, and explorations in technology, design, and making.
      </p>
    </header>

    <div>
      <!-- Main Blog Posts section -->
      <section>
        <div v-if="!sortedYears.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">
            No blog posts found.
          </p>
        </div>

        <!-- Yearly blog posts with Swiss design -->
        <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-24">
          <h2 class="text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-8" style="font-family: 'Signika Negative', sans-serif;">
            {{ year }}
          </h2>
        
          <div class="space-y-12">
            <article
              v-for="post in blogPostsByYear[year]"
              :key="post?.slug"
              ref="blogPostElements"
              class="group grid grid-cols-12 gap-4"
            >
              <!-- Date column -->
              <div class="col-span-3 md:col-span-2">
                <time class="text-sm text-zinc-500 dark:text-zinc-500">
                  {{ format(new Date(post?.date || post?.metadata?.date), 'MMM dd') }}
                </time>
              </div>

              <!-- Content column -->
              <div class="col-span-9 md:col-span-10">
                <h3 class="mb-2">
                  <NuxtLink
                    :to="`/blog/${post?.slug}`"
                    class="text-lg text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                  >
                    {{ post?.title || formatTitle(post?.slug) }}
                  </NuxtLink>
                </h3>
              
                <p
                  v-if="post?.metadata?.dek || post?.dek"
                  class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed"
                >
                  {{ post?.metadata?.dek || post?.dek }}
                </p>
              
                <PostMetadata
                  v-if="post"
                  :doc="createPostMetadata(post)"
                  :compact="true"
                  class="post-metadata mt-2"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Sidebar sections -->
      <aside class="mt-24 pt-12 border-t border-zinc-200 dark:border-zinc-800">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- Week Notes -->
          <section>
            <h2 class="text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-8">
              Week Notes
            </h2>

            <div v-if="!sortedWeekNotes.length" class="text-center py-8">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                No week notes found.
              </p>
            </div>

            <template v-else>
              <div class="space-y-6">
                <article
                  v-for="weekNote in sortedWeekNotes"
                  :key="weekNote.slug"
                  ref="weekNoteElements"
                >
                  <NuxtLink
                    :to="`/blog/${weekNote.slug}`"
                    class="block group"
                  >
                    <div class="mb-1">
                      <span class="text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                        Week {{ weekNote.slug.split('/')[1] }}
                      </span>
                    </div>

                    <p class="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
                      {{ weekNote.metadata?.dek || weekNote.dek }}
                    </p>
                  </NuxtLink>
                </article>
              </div>

              <div class="mt-8">
                <NuxtLink
                  to="/blog/week-notes"
                  class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  View all →
                </NuxtLink>
              </div>
            </template>
          </section>
          <!-- Recently Updated -->
          <section v-if="recentlyUpdatedPosts.length">
            <h2 class="text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-8">
              Recently Updated
            </h2>
            <div class="space-y-6">
              <article
                v-for="post in recentlyUpdatedPosts"
                :key="`recent-${post.slug}`"
              >
                <NuxtLink
                  :to="`/blog/${post.slug}`"
                  class="block group"
                >
                  <h3 class="text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors mb-1">
                    {{ post?.metadata?.title || post?.title }}
                  </h3>
                  <div class="text-sm text-zinc-500 dark:text-zinc-500">
                    {{ formatRelativeTime(
                      post?.metadata?.lastUpdated ||
                        post?.metadata?.date ||
                        post?.lastUpdated ||
                        post?.date
                    ) }}
                  </div>
                </NuxtLink>
              </article>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </SwissGrid>
</template>

<style scoped>
/* Swiss minimal styling */
.post-metadata {
  @apply text-xs text-zinc-500 dark:text-zinc-500;
}
</style>
