<script setup>
import { format } from 'date-fns'
const processedMarkdown = useProcessedMarkdown()

const { data: blogPosts } = await useAsyncData('blog-posts', () => processedMarkdown.getAllPosts())
const { data: weekNotes } = await useAsyncData('week-notes', () => processedMarkdown.getWeekNotes())
const { data: drafts } = await useAsyncData('drafts', () => processedMarkdown.getDrafts())
const { data: readingPosts } = await useAsyncData('reading-posts', () => processedMarkdown.getReadingPosts())

function formatDate(date) {
  return format(new Date(date), 'MMMM dd, yyyy')
}

function groupByYear(posts) {
  if (!posts) return {}
  const grouped = posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})

  // Sort posts within each year
  Object.keys(grouped).forEach(year => {
    grouped[year].sort((a, b) => new Date(b.date) - new Date(a.date))
  })

  // Sort years in descending order
  return Object.fromEntries(
    Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]))
  )
}

const blogPostsByYear = computed(() => groupByYear(blogPosts.value))
const weekNotesByYear = computed(() => groupByYear(weekNotes.value))
const draftsByYear = computed(() => groupByYear(drafts.value))
const readingPostsByYear = computed(() => groupByYear(readingPosts.value))
</script>

<template>
  <div class="container mx-auto px-4 py-8 ">
    <!-- Blog Posts -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Blog Posts</h2>
      <div class="grid grid-cols-2 gap-2">
        <div v-for="(posts, year) in blogPostsByYear" :key="`blog-${year}`" class="mb-8">
          <h3 class="text-xl font-semibold mb-4">{{ year }}</h3>
          <ul class="space-y-2">
            <li v-for="post in posts" :key="post.slug" class="border-b border-gray-200 pb-2">
              <NuxtLink :to="`/blog/${post.slug}`" class="hover:underline">
                {{ post.title }}
              </NuxtLink>
              <small class="block">
                {{ post.dek }}
              </small>

              <span class="text-sm text-gray-600 ml-2">{{ formatDate(post.date) }}</span>
            </li>
          </ul>
        </div>
      </div>

    </section>
  </div>
</template>