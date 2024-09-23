<script setup>
import { format } from 'date-fns'
const processedMarkdown = useProcessedMarkdown()

const { data: blogPosts } = await useAsyncData('blog-posts', () => processedMarkdown.getAllPosts())
const { data: weekNotes } = await useAsyncData('week-notes', () => processedMarkdown.getWeekNotes())
const { data: drafts } = await useAsyncData('drafts', () => processedMarkdown.getDrafts())
const { data: readingPosts } = await useAsyncData('reading-posts', () => processedMarkdown.getReadingPosts())

function formatDate(date) {
  // return format(new Date(date), 'MMMM dd, yyyy')
  // MMMM-YY-DD
  return format(new Date(date), 'yyyy-MM-dd')
}

// Group posts by year
function groupByYear(posts) {
  if (!posts) return {}
  return posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
}

const blogPostsByYear = computed(() => groupByYear(blogPosts.value))
// const weekNotesByYear = computed(() => groupByYear(weekNotes.value))
const draftsByYear = computed(() => groupByYear(drafts.value))
const readingPostsByYear = computed(() => groupByYear(readingPosts.value))
</script>

<template>
  <div class="container mx-auto px-4 py-8 grid grid-cols-4 gap-4">
    <!-- Blog Posts -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Blog Posts</h2>
      <div v-for="(posts, year) in blogPostsByYear" :key="`blog-${year}`" class="mb-8">
        <h3 class="text-xl font-semibold mb-4">{{ year }}</h3>
        <ul class="space-y-2">
          <li v-for="post in posts" :key="post.slug" class="border-b border-gray-200 pb-2">
            <NuxtLink :to="`/blog/${post?.slug}`" class="hover:underline">
              {{ post.title }}
            </NuxtLink>
            <span class="text-sm text-gray-600 ml-2">{{ formatDate(post.date) }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Drafts -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Drafts</h2>
      <div v-for="(draftPosts, year) in draftsByYear" :key="`drafts-${year}`" class="mb-8">
        <h3 class="text-xl font-semibold mb-4">{{ year }}</h3>
        <ul class="space-y-2">
          <li v-for="draft in draftPosts" :key="draft.slug" class="border-b border-gray-200 pb-2">
            <NuxtLink :to="`/blog/${draft.slug}`" class="hover:underline">
              {{ draft.title }}
            </NuxtLink>
            <span class="text-sm text-gray-600 ml-2">{{ formatDate(draft.date) }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Week Notes -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Week Notes</h2>
      <ul class="space-y-2">
        <li v-for="note in weekNotes" :key="note.slug" class="border-b border-gray-200 pb-2">
          <NuxtLink :to="`/blog/${note.slug}`" class="hover:underline">
            {{ note.slug }}
          </NuxtLink>
          <!-- <span class="text-sm text-gray-600 ml-2">{{ formatDate(note.date) }}</span> -->
        </li>
      </ul>

    </section>

    <!-- Reading Posts -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Reading</h2>
      <div v-for="post in readingPosts" :key="`reading-${year}`" class="mb-8">
        <NuxtLink :to="`/blog/${post.slug}`" class="hover:underline">
          {{ post.title }}
          <strong>
            {{ post["kindle-sync"].author }}
          </strong>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>