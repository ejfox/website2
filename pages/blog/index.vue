<script setup>
import { format } from 'date-fns'
import { computed } from 'vue'
import { timeWeek, timeYear } from 'd3-time'
import { timeFormat } from 'd3-time-format'
import { startOfWeek } from 'date-fns'

const processedMarkdown = useProcessedMarkdown()

const { data: blogPosts } = await useAsyncData('blog-posts', () => processedMarkdown.getAllPosts())
const { data: weekNotes } = await useAsyncData('week-notes', () => processedMarkdown.getWeekNotes())

const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd')

// Sort week notes and convert week slug to actual dates
const sortedWeekNotes = computed(() => {
  return weekNotes.value
    .map(note => {
      const weekMatch = note.slug.match(/(\d{4})-(\d{2})/)
      if (weekMatch) {
        const year = parseInt(weekMatch[1], 10)
        const week = parseInt(weekMatch[2], 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 }) // Start from the first day of the week
        const actualDate = new Date(date.setDate(date.getDate() + (week - 1) * 7)) // Calculate week start date
        return { ...note, actualDate }
      }
      return note // Fallback if the slug doesn't match
    })
    .filter(note => note.actualDate) // Only keep notes with a valid date
    .sort((a, b) => b.actualDate - a.actualDate) // Sort by actual date in descending order
})

function groupByYear(posts) {
  if (!posts) return {}
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
  return sortedPosts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
}

const blogPostsByYear = computed(() => groupByYear(blogPosts.value))

// Get an array of years sorted in descending order
const sortedYears = computed(() =>
  Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
)
</script>

<template>
  <div class="container mx-auto px-4 py-8 lg:flex lg:flex-row lg:gap-4">
    <!-- Blog Posts -->
    <section class="mb-12 lg:w-3/4">
      <h2 class="text-2xl font-bold mb-6">Blog Posts</h2>
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-8">
        <h3
          class="text-3xl md:text-4xl lg:text-6xl my-1 md:my-2 lg:my-4 font-semibold mb-4 text-zinc-400 dark:text-zinc-600 monospace">
          {{ year }}</h3>
        <ul class="space-y-2 w-full m-0 p-0">
          <li v-for="post in blogPostsByYear[year]" :key="post.slug"
            class="border-b border-zinc-200 dark:border-zinc-800 pb-2 w-full m-0 flex flex-row min-h-24 py-1 md:py-4">
            <NuxtLink :to="`/blog/${post?.slug}`" class="no-underline hover:underline   w-1/2 pr-8">
              {{ post.title }}
            </NuxtLink>
            <!-- <span class="text-sm text-zinc-600 ml-2">{{ formatDate(post.date) }}</span> -->
            <PostMetadata :doc="post" class="inline-flex max-w-1/2 overflow-x-auto text-right text-[10px]" />
          </li>
        </ul>
      </div>
    </section>

    <!-- Week Notes -->
    <section class="mb-12 lg:w-1/4">
      <h2 class="text-2xl font-bold mb-6">Week Notes</h2>
      <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug"
        class="border-b border-zinc-200 dark:border-zinc-800 py-3 text-justify">
        <NuxtLink :to="`/blog/${weekNote.slug}`"
          class="hover:underline text-xs rounded bg-zinc-50 dark:bg-transparent font-mono block">
          {{ weekNote.slug.split('/')[1] }}
        </NuxtLink>
        <span v-if="weekNote.dek" class="text-sm text-zinc-600 dark:text-zinc-400 py-2 xl:py-4">{{ weekNote.dek
          }}</span>
        <!-- <span v-if="weekNote.date" class="text-sm text-zinc-600 ml-2">{{ formatDate(weekNote.date) }}</span> -->
      </div>
    </section>
  </div>
</template>