<script setup>
import { format, formatDistanceToNow } from 'date-fns'
import { computed, ref, onMounted, watch } from 'vue'
import { startOfWeek, subMonths } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'

const route = useRoute()
const processedMarkdown = useProcessedMarkdown()
const now = new Date()

const { data: posts, error: postsError } = useAsyncData(
  'blog-posts',
  async () => {
    try {
      // Only get blog posts (not reading notes, etc)
      const result = await processedMarkdown.getAllPosts(false, false)
      console.log('Blog posts fetched:', {
        count: result?.length,
        firstPost: result?.[0],
        dates: result?.map(p => p?.date || p?.metadata?.date)
      })
      return result || []
    } catch (err) {
      console.error('Error fetching posts:', err)
      return []
    }
  },
  {
    default: () => [],
    immediate: true,
    onError: (error) => {
      console.error('Error in blog posts:', error)
      return []
    }
  }
)

const { data: notes, error: notesError } = useAsyncData(
  'week-notes',
  async () => {
    console.log('Fetching week notes...')
    try {
      // Get all posts including week notes
      const result = await processedMarkdown.getAllPosts(false, true)
      console.log('All posts for week notes:', {
        total: result?.length,
        types: result?.map(p => p?.metadata?.type || p?.type),
        slugs: result?.map(p => p?.metadata?.slug || p?.slug)
      })

      // Filter for week notes only
      const weekNotes = result?.filter(post => {
        const type = post?.metadata?.type || post?.type
        const slug = post?.metadata?.slug || post?.slug
        const isWeekNote = type === 'weekNote' || slug?.startsWith('week-notes/')
        if (isWeekNote) {
          console.log('Found week note:', { 
            type, 
            slug, 
            dek: post?.metadata?.dek || post?.dek,
            metadata: post?.metadata
          })
        }
        return isWeekNote
      }) || []

      // Process week notes to ensure all required fields
      return weekNotes.map(note => {
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
  },
  {
    default: () => [],
    onError: (error) => {
      console.error('Error in week notes:', error)
      return []
    }
  }
)

const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd')

const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

useHead({
  title: 'Blog',
  meta: [
    { name: 'description', content: 'Blog posts and week notes' }
  ]
})

// Sort week notes and convert week slug to actual dates
const sortedWeekNotes = computed(() => {
  if (!notes.value) return []

  return notes.value
    .map(note => {
      // Create a new object to avoid mutating the reactive source
      const processedNote = { ...note }
      const weekMatch = note?.slug?.match(/(\d{4})-(\d{2})/)
      
      if (weekMatch) {
        const year = parseInt(weekMatch[1], 10)
        const week = parseInt(weekMatch[2], 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
        processedNote.actualDate = new Date(date.setDate(date.getDate() + (week - 1) * 7))
      } else {
        // If no week match, use the note's date
        const noteDate = note?.date || note?.metadata?.date
        if (noteDate) {
          processedNote.actualDate = new Date(noteDate)
        }
      }
      return processedNote
    })
    .filter(note => {
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
watch(() => notes.value, (newNotes) => {
  if (!newNotes) {
    console.log('No notes value available')
    return
  }

  console.log('Processing week notes:', {
    total: newNotes?.length,
    notes: newNotes?.map(n => ({
      slug: n?.slug,
      type: n?.type || n?.metadata?.type,
      dek: n?.dek || n?.metadata?.dek,
      hidden: n?.hidden || n?.metadata?.hidden
    }))
  })
}, { immediate: true })

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

// Watch posts for debugging
watch(() => posts.value, (newPosts) => {
  console.log('Grouping posts:', {
    total: newPosts?.length,
    sample: newPosts?.[0],
    titles: newPosts?.map(p => (p?.metadata || p)?.title)
  })
}, { immediate: true })

const blogPostElements = ref([])
const weekNoteElements = ref([])

const animDuration = 900
const animStagger = 25

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

    animate(blogPostElements.value.map(el => el?.querySelector('.post-metadata')), {
      opacity: [0, 1],
      translateX: [-8, 0],
      duration: animDuration * 2,
      ease: 'easeOutQuad',
      delay: animDuration * 0.82
    })
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
    .filter(post => {
      // Get metadata from either location
      const metadata = post?.metadata || post
      const isHidden = metadata?.hidden === true || metadata?.hidden === 'true'
      const isDraft = metadata?.draft === true || metadata?.draft === 'true'
      return !isHidden && !isDraft
    })
    .filter(post => {
      const metadata = post?.metadata || post
      const updateDate = new Date(metadata?.lastUpdated || metadata?.date)
      return updateDate > oneMonthAgo
    })
    .sort((a, b) => {
      const metaA = a?.metadata || a
      const metaB = b?.metadata || b
      return new Date(metaB?.lastUpdated || metaB?.date) - new Date(metaA?.lastUpdated || metaA?.date)
    })
    .slice(0, 5)
})
</script>

<template>
  <NuxtErrorBoundary>
    <!-- Default content -->
    <template #default>
      <div v-if="isLoading" class="container mx-auto px-2 py-12 text-center">
        <p class="text-lg">Loading...</p>
      </div>

      <div v-else class="container mx-auto px-2 py-12 lg:flex lg:gap-4">
        <!-- Blog Posts section -->
        <section class="lg:w-2/3 mb-16">
          <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>

          <div v-if="!sortedYears.length" class="text-center py-8">
            <p class="text-lg text-zinc-600 dark:text-zinc-400">No blog posts found.</p>
          </div>

          <!-- Existing yearly blog posts list -->
          <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-10">
            <h3 class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-6 tracking-tight">
              {{ year }}
            </h3>
            <ul class="">
              <li v-for="post in blogPostsByYear[year]" :key="(post?.metadata || post)?.slug" ref="blogPostElements"
                class="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">

                <NuxtLink :to="`/blog/${(post?.metadata || post)?.slug}`"
                  class="post-title no-underline hover:underline text-xl lg:text-3xl font-medium mb-2 pr-2 font-fjalla"
                  :style="{ viewTransitionName: `title-${(post?.metadata || post)?.slug}` }">
                  {{ (post?.metadata || post)?.title || 'Untitled Post' }}
                  <span v-if="new Date((post?.metadata || post)?.date) > now"
                    class="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                    (Future Post)
                  </span>
                </NuxtLink>

                <div v-if="(post?.metadata || post)?.dek" class="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {{ (post?.metadata || post)?.dek }}
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- Week Notes section -->
        <section class="lg:w-1/3">
          <h2 class="text-3xl font-bold mb-8">Week Notes</h2>

          <div v-if="!sortedWeekNotes.length" class="text-center py-8">
            <p class="text-lg text-zinc-600 dark:text-zinc-400">No week notes found.</p>
          </div>

          <template v-else>
            <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug" ref="weekNoteElements"
              class="border-b border-zinc-200 dark:border-zinc-700 py-4">
              <NuxtLink :to="`/blog/${weekNote.slug}`" class="text-sm font-mono block py-1 rounded">
                <span class="hover:underline">
                  {{ weekNote.slug.split('/')[1] }}
                </span>

                <p class="text-xs text-zinc-500 mt-2">
                  {{ weekNote.metadata?.dek || weekNote.dek }}
                </p>
              </NuxtLink>
            </div>

            <UButton :to="`/blog/week-notes`" color="black" class="mt-4" icon="i-ei-arrow-right" trailing
              variant="outline">
              All Week Notes
            </UButton>
          </template>
          <div v-if="recentlyUpdatedPosts.length" class="my-12">
            <h3 class="text-2xl font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Recently Updated</h3>
            <ul>
              <li v-for="post in recentlyUpdatedPosts" :key="`recent-${post.slug}`"
                class="mb-3 border-l-4 border-zinc-300 dark:border-zinc-600 pl-4">
                <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">
                  {{ post?.metadata?.title || post?.title }}
                </NuxtLink>
                <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Updated {{ formatRelativeTime(post?.metadata?.lastUpdated || post?.metadata?.date || post?.lastUpdated
                    ||
                    post?.date) }}
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </template>

    <!-- Error handling -->
    <template #error="{ error }">
      <div class="container mx-auto px-2 py-12">
        <div class="lg:w-2/3">
          <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>
          <div v-if="posts?.length" class="mb-10">
            <template v-for="year in sortedYears" :key="`blog-${year}`">
              <h3 class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-6 tracking-tight">
                {{ year }}
              </h3>
              <ul class="mb-10">
                <li v-for="post in blogPostsByYear[year]" :key="(post?.metadata || post)?.slug"
                  class="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                  <NuxtLink :to="`/blog/${(post?.metadata || post)?.slug}`"
                    class="post-title no-underline hover:underline text-xl lg:text-3xl font-medium mb-2 pr-2 font-fjalla">
                    {{ (post?.metadata || post)?.title || 'Untitled Post' }}
                  </NuxtLink>
                  <div v-if="(post?.metadata || post)?.dek"
                    class="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {{ (post?.metadata || post)?.dek }}
                  </div>
                </li>
              </ul>
            </template>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-lg text-zinc-600 dark:text-zinc-400">No blog posts found.</p>
          </div>
        </div>

        <div class="lg:w-1/3">
          <h2 class="text-3xl font-bold mb-8">Week Notes</h2>
          <div v-if="sortedWeekNotes?.length">
            <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug"
              class="border-b border-zinc-200 dark:border-zinc-700 py-4">
              <NuxtLink :to="`/blog/${weekNote.slug}`" class="text-sm font-mono block py-1 rounded">
                <span class="hover:underline">
                  {{ weekNote.slug.split('/')[1] }}
                </span>
                <p v-if="(weekNote?.metadata || weekNote)?.dek" class="text-xs text-zinc-500 mt-2">
                  {{ (weekNote?.metadata || weekNote)?.dek }}
                </p>
              </NuxtLink>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-lg text-zinc-600 dark:text-zinc-400">No week notes found.</p>
          </div>
        </div>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>

<style scoped>
.post-title {
  transition: color 0.2s ease;
}
</style>