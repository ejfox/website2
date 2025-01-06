<script setup>
import { format, formatDistanceToNow } from 'date-fns'
import { computed, ref, onMounted } from 'vue'
import { startOfWeek, subMonths } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'

// Add console logs to track component lifecycle
console.log('Component setup starting')

const processedMarkdown = useProcessedMarkdown()
console.log('processedMarkdown initialized')

// Add error handling and logging to data fetching
const { data: posts, error: postsError } = await useAsyncData('blog-posts', () => {
  console.log('Fetching posts...')
  try {
    const result = await processedMarkdown.getAllPosts(false, false)
    console.log('Posts fetched:', result?.length)
    return result
  } catch (err) {
    console.error('Error fetching posts:', err)
    return []
  }
})

const { data: notes, error: notesError } = await useAsyncData('week-notes', () => {
  console.log('Fetching notes...')
  try {
    const result = await processedMarkdown.getWeekNotes()
    console.log('Notes fetched:', result?.length)
    return result
  } catch (err) {
    console.error('Error fetching notes:', err)
    return []
  }
})

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
      const weekMatch = note?.slug?.match(/(\d{4})-(\d{2})/)
      if (weekMatch) {
        const year = parseInt(weekMatch[1], 10)
        const week = parseInt(weekMatch[2], 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
        const actualDate = new Date(date.setDate(date.getDate() + (week - 1) * 7))
        return { ...note, actualDate }
      }
      return note
    })
    .filter(note => note?.actualDate && note?.dek)
    .filter(note => !note?.hidden)
    .sort((a, b) => b.actualDate - a.actualDate)
    .slice(0, 5)
})

function groupByYear(posts) {
  if (!posts) {
    console.warn('No posts passed to groupByYear')
    return {}
  }

  console.log('Grouping posts by year:', posts.length, 'posts')
  const sortedPosts = [...posts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  console.log('After sorting posts:', sortedPosts.length, 'posts')
  return sortedPosts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
}

const blogPostsByYear = computed(() => {
  console.log('Computing blogPostsByYear with:', posts.value?.length, 'posts')
  return groupByYear(posts.value)
})

const sortedYears = computed(() => Object.keys(blogPostsByYear.value).sort((a, b) => b - a))

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
      // Handle both old and new visibility formats
      const isHidden = post?.visibility?.isHidden || post?.hidden === true || post?.hidden === 'true'
      return !isHidden
    })
    .filter(post => {
      const updateDate = new Date(post?.lastUpdated || post?.date)
      return updateDate > oneMonthAgo
    })
    .sort((a, b) => new Date(b?.lastUpdated || b?.date) - new Date(a?.lastUpdated || a?.date))
    .slice(0, 5)
})
</script>

<template>
  <NuxtErrorBoundary>
    <div v-if="isLoading" class="container mx-auto px-2 py-12 text-center">
      <p class="text-lg">Loading...</p>
    </div>

    <div v-else>
      <template #error="{ error }">
        <div class="container mx-auto px-2 py-12 text-center">
          <p class="text-lg text-red-500">{{ error.message }}</p>
          <button class="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded" @click="error.value = null">
            Try Again
          </button>
        </div>
      </template>

      <div class="container mx-auto px-2 py-12 lg:flex lg:gap-4">
        <!-- Blog Posts -->
        <section class="lg:w-2/3 mb-16">
          <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>

          <div v-if="!sortedYears.length" class="text-center py-8">
            <p class="text-lg text-zinc-600 dark:text-zinc-400">No blog posts found.</p>
          </div>

          <!-- Existing yearly blog posts list -->
          <div v-else v-for="year in sortedYears" :key="`blog-${year}`" class="mb-10">
            <h3 class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-6 tracking-tight">
              {{ year }}
            </h3>
            <ul class="">
              <li v-for="post in blogPostsByYear[year]" :key="post.slug" ref="blogPostElements"
                class="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">

                <NuxtLink :to="`/blog/${post.slug}`"
                  class="post-title no-underline hover:underline text-xl lg:text-3xl font-medium mb-2 pr-2 font-fjalla"
                  :style="{ viewTransitionName: `title-${post.slug}` }">
                  {{ post.title }}
                </NuxtLink>

                <div v-if="post.dek" class="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {{ post.dek }}
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- Week Notes -->
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

                <p v-if="weekNote.dek" class="text-xs text-zinc-500 mt-2">
                  {{ weekNote.dek }}
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
                  {{ post.title }}
                </NuxtLink>
                <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Updated {{ formatRelativeTime(post.lastUpdated || post.date) }}
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>

    <!-- Add error handling -->
    <template #error="{ error }">
      <div class="container mx-auto px-2 py-12 text-center">
        <p class="text-lg text-red-500">Error loading blog: {{ error.message }}</p>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>
<style scoped>
.post-title {
  transition: color 0.2s ease;
}
</style>
