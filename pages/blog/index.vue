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

  <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
    <!-- Header -->
    <header class="mb-8 sm:mb-12 lg:mb-16">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4">Blog</h1>
      <p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">Thoughts, projects, and explorations in technology, design, and making.</p>
    </header>

    <div class="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-12">
      <!-- Main Blog Posts section -->
      <section class="lg:col-span-8">

      <div v-if="!sortedYears.length" class="text-center py-16">
        <p class="text-zinc-600 dark:text-zinc-400">
          No blog posts found.
        </p>
      </div>

      <!-- Yearly blog posts with refined grid -->
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-12 lg:mb-16">
        <div class="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-6 sm:mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:pb-4">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
            {{ year }}
          </h2>
          <div class="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-medium">
            {{ blogPostsByYear[year].length }} {{ blogPostsByYear[year].length === 1 ? 'Post' : 'Posts' }}
          </div>
        </div>
        
        <div class="space-y-6 sm:space-y-8">
          <article
            v-for="post in blogPostsByYear[year]"
            :key="post?.slug"
            ref="blogPostElements"
            class="group"
          >
            <!-- Date and metadata -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
              <time class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 font-mono">
                {{ format(new Date(post?.date || post?.metadata?.date), 'MMM dd') }}
              </time>
              <div class="hidden sm:block w-px h-3 bg-zinc-300 dark:bg-zinc-700"></div>
              <PostMetadata
                v-if="post"
                :doc="createPostMetadata(post)"
                :compact="true"
                class="post-metadata transition-opacity"
              />
            </div>

            <!-- Title and description -->
            <div class="space-y-2 sm:space-y-3">
              <h3>
                <NuxtLink
                  :to="`/blog/${post?.slug}`"
                  class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors group-hover:underline decoration-1 underline-offset-2 leading-tight"
                >
                  {{ post?.title || formatTitle(post?.slug) }}
                </NuxtLink>
              </h3>
              
              <p
                v-if="post?.metadata?.dek || post?.dek"
                class="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed"
              >
                {{ post?.metadata?.dek || post?.dek }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

      <!-- Sidebar -->
      <aside class="lg:col-span-4 space-y-8 lg:space-y-16">
        <!-- Week Notes -->
        <section>
          <h2 class="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-semibold mb-4 sm:mb-6">Week Notes</h2>

          <div v-if="!sortedWeekNotes.length" class="text-center py-8">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              No week notes found.
            </p>
          </div>

          <template v-else>
            <div class="space-y-3 sm:space-y-4">
              <article
                v-for="weekNote in sortedWeekNotes"
                :key="weekNote.slug"
                ref="weekNoteElements"
                class="group"
              >
                <NuxtLink
                  :to="`/blog/${weekNote.slug}`"
                  class="block space-y-2 p-3 sm:p-4 -mx-3 sm:-mx-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xs tabular-nums font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                      {{ weekNote.slug.split('/')[1] }}
                    </span>
                    <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                  </div>

                  <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {{ weekNote.metadata?.dek || weekNote.dek }}
                  </p>
                </NuxtLink>
              </article>
            </div>

            <div class="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <NuxtLink
                to="/blog/week-notes"
                class="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium"
              >
                <span>View all week notes</span>
                <Icon name="heroicons:arrow-right" class="w-3 h-3" />
              </NuxtLink>
            </div>
          </template>
        </section>
        <!-- Recently Updated -->
        <section v-if="recentlyUpdatedPosts.length">
          <h2 class="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-semibold mb-4 sm:mb-6">
            Recently Updated
          </h2>
          <div class="space-y-3 sm:space-y-4">
            <article
              v-for="post in recentlyUpdatedPosts"
              :key="`recent-${post.slug}`"
              class="group"
            >
              <NuxtLink
                :to="`/blog/${post.slug}`"
                class="block space-y-2 p-3 sm:p-4 -mx-3 sm:-mx-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <h3 class="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline decoration-1 underline-offset-2 leading-tight">
                  {{ post?.metadata?.title || post?.title }}
                </h3>
                <div class="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Updated {{
                    formatRelativeTime(
                      post?.metadata?.lastUpdated ||
                        post?.metadata?.date ||
                        post?.lastUpdated ||
                        post?.date
                    )
                  }}
                </div>
              </NuxtLink>
            </article>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.post-title {
  transition: color 0.2s ease;
}

.post-metadata {
  border-bottom: none;
  margin: 0;
  padding: 0;
  font-size: 0.625rem;
  opacity: 0.6;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  line-height: 1.3;
  font-weight: 300;
  letter-spacing: 0.1em;
  align-items: center;
  text-transform: uppercase;
  font-family: 'Red Hat Mono', monospace;
}

.post-metadata:hover {
  opacity: 0.8;
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
