<script setup>
import { format } from 'date-fns'
import { computed } from 'vue'
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
  <div class="container mx-auto px-4 py-8 lg:flex lg:gap-8">
    <!-- Blog Posts -->
    <section class="lg:w-2/3 mb-16">
      <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-10">
        <h3 class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-6 tracking-tight">
          {{ year }}
        </h3>
        <ul class="space-y-4">
          <li v-for="post in blogPostsByYear[year]" :key="post.slug"
            class="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 pb-3">
            <NuxtLink :to="`/blog/${post?.slug}`" class="no-underline hover:underline text-lg font-medium w-2/3">
              {{ post.title }}
            </NuxtLink>
            <PostMetadata :doc="post" class="text-xs text-zinc-600 dark:text-zinc-400 w-1/3 text-right" />
          </li>
        </ul>
      </div>
    </section>

    <!-- Week Notes -->
    <section class="lg:w-1/3">
      <h2 class="text-3xl font-bold mb-8">Week Notes</h2>
      <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4">
        <NuxtLink :to="`/blog/${weekNote.slug}`"
          class="hover:underline text-sm bg-zinc-50 dark:bg-transparent font-mono block px-2 py-1 rounded">
          {{ weekNote.slug.split('/')[1] }}
        </NuxtLink>
        <p v-if="weekNote.dek" class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          {{ weekNote.dek }}
        </p>
      </div>
    </section>
  </div>
</template>
