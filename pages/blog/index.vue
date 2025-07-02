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

  if (blogPostElements.value?.length) {
    animate(blogPostElements.value, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: animDuration,
      ease: 'easeOutQuad',
      delay: stagger(animStagger)
    })

    animate(
      blogPostElements.value.map((el) => el?.querySelector('.post-metadata')),
      {
        opacity: [0, 1],
        translateX: [-8, 0],
        duration: animDuration * 2,
        ease: 'easeOutQuad',
        delay: animDuration * 0.82
      }
    )
  }

  if (weekNoteElements.value?.length) {
    animate(weekNoteElements.value, {
      opacity: [0, 1],
      translateX: [20, 0],
      duration: animDuration,
      ease: 'easeInOutQuad',
      delay: stagger(animStagger, { start: 600 })
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
  <div v-if="isLoading" class="container mx-auto px-4 py-12 text-center">
    <p class="text-lg">Loading...</p>
  </div>

  <div v-else class="container mx-auto px-4 py-12 lg:flex lg:gap-8">
    <!-- Blog Posts section -->
    <section class="lg:w-2/3 mb-16">
      <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>

      <div v-if="!sortedYears.length" class="text-center py-8">
        <p class="text-lg text-zinc-600 dark:text-zinc-400">
          No blog posts found.
        </p>
      </div>

      <!-- Existing yearly blog posts list -->
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-8">
        <h3
          class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-4 tracking-tight"
        >
          {{ year }}
        </h3>
        <ul>
          <li
            v-for="post in blogPostsByYear[year]"
            :key="post?.slug"
            ref="blogPostElements"
            class="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4"
          >
            <!-- PostMetadata now above the title -->
            <PostMetadata
              v-if="post"
              :doc="createPostMetadata(post)"
              :compact="true"
              class="post-metadata transition-opacity my-4"
            />

            <NuxtLink
              :to="`/blog/${post?.slug}`"
              class="post-title no-underline hover:underline text-xl lg:text-3xl font-medium mb-2 pr-4 font-fjalla"
            >
              {{ post?.title || formatTitle(post?.slug) }}
              <span
                v-if="new Date(post?.date) > now"
                class="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-4"
              >
                (Future Post)
              </span>
            </NuxtLink>

            <div
              v-if="post?.metadata?.dek || post?.dek"
              class="font-mono text-xs text-zinc-600 dark:text-zinc-400"
            >
              {{ post?.metadata?.dek || post?.dek }}
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Week Notes section -->
    <section class="lg:w-1/3">
      <h2 class="text-3xl font-bold mb-8">Week Notes</h2>

      <div v-if="!sortedWeekNotes.length" class="text-center py-8">
        <p class="text-lg text-zinc-600 dark:text-zinc-400">
          No week notes found.
        </p>
      </div>

      <template v-else>
        <div
          v-for="weekNote in sortedWeekNotes"
          :key="weekNote.slug"
          ref="weekNoteElements"
          class="border-b border-zinc-200 dark:border-zinc-700 py-4"
        >
          <NuxtLink
            :to="`/blog/${weekNote.slug}`"
            class="text-sm font-mono block py-4 rounded"
          >
            <span class="hover:underline">
              {{ weekNote.slug.split('/')[1] }}
            </span>

            <p class="text-xs text-zinc-500 mt-4">
              {{ weekNote.metadata?.dek || weekNote.dek }}
            </p>
          </NuxtLink>
        </div>

        <NuxtLink
          to="/blog/week-notes"
          class="inline-flex items-center gap-1.5 px-4 py-2 mt-8 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          All Week Notes
          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </template>
      <div v-if="recentlyUpdatedPosts.length" class="mt-16 mb-8">
        <h3
          class="text-2xl font-semibold text-zinc-600 dark:text-zinc-300 mb-8"
        >
          Recently Updated
        </h3>
        <ul>
          <li
            v-for="post in recentlyUpdatedPosts"
            :key="`recent-${post.slug}`"
            class="mb-4 border-l-4 border-zinc-300 dark:border-zinc-600 pl-4"
          >
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="text-lg font-medium hover:underline"
            >
              {{ post?.metadata?.title || post?.title }}
            </NuxtLink>
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
              Updated
              {{
                formatRelativeTime(
                  post?.metadata?.lastUpdated ||
                    post?.metadata?.date ||
                    post?.lastUpdated ||
                    post?.date
                )
              }}
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.post-title {
  transition: color 0.2s ease;
}

.post-metadata {
  border-bottom: none;
  margin: 0 0 2px 0;
  padding: 0;
  font-size: 0.7rem;
  opacity: 0.5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  line-height: 1.2;
}

.post-metadata:hover {
  opacity: 0.75;
}

/* View Transitions API support */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* Removed view transition styles */
</style>
