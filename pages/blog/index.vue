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
  <div class="container mx-auto px-4 py-8 flex flex-row gap-4">
    <!-- Blog Posts -->
    <section class="mb-12 w-3/4">
      <h2 class="text-2xl font-bold mb-6">Blog Posts</h2>
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-8">
        <h3 class="text-xl font-semibold mb-4">{{ year }}</h3>
        <ul class="space-y-2">
          <li v-for="post in blogPostsByYear[year]" :key="post.slug" class="border-b border-gray-200 pb-2">
            <NuxtLink :to="`/blog/${post?.slug}`" class="hover:underline">
              {{ post.title }}
            </NuxtLink>
            <span class="text-sm text-gray-600 ml-2">{{ formatDate(post.date) }}</span>
          </li>
        </ul>
      </div>
    </section>
    
    <!-- Week Notes -->
    <section class="mb-12 w-1/4">
      <h2 class="text-2xl font-bold mb-6">Week Notes</h2>
      <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug" class="border-b border-gray-200 pb-2">
        <NuxtLink :to="`/blog/${weekNote.slug}`" class="hover:underline">
          {{ weekNote.slug }}
        </NuxtLink>
        <span v-if="weekNote.dek" class="text-sm text-gray-600 ml-2">{{ weekNote.dek }}</span>
        <span v-if="weekNote.date" class="text-sm text-gray-600 ml-2">{{ formatDate(weekNote.date) }}</span>
      </div>
    </section>
  </div>
</template>