<script setup>
import { format } from 'date-fns'
const processedMarkdown = useProcessedMarkdown()

const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  const posts = await processedMarkdown.getProjectPosts()
  return Promise.all(posts.map(async (post) => {
    const fullPost = await processedMarkdown.getPostBySlug(post.slug)
    return { ...post, ...fullPost }
  }))
})

function formatDate(date) {
  return format(new Date(date), 'MMMM yyyy')
}

// Sort posts by date (most recent first)
const sortedProjectPosts = computed(() =>
  projectPosts.value?.sort((a, b) => new Date(b.date) - new Date(a.date)) || []
)
</script>

<template>
  <div class="container mx-auto px-2 py-8">
    <h1 class="text-4xl font-bold mb-8">Projects</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="post in sortedProjectPosts" :key="post.slug"
        class=" rounded-md border border-zinc-800 overflow-hidden">
        <article class="p-6">
          <h2 class="text-2xl font-semibold mb-2">
            <NuxtLink :to="`/blog/${post.slug}`" class="no-underline hover:underline">
              {{ post.title }}
            </NuxtLink>
          </h2>
          <!-- <p class="text-sm text-gray-600 mb-4">{{ formatDate(post.date) }}</p> -->
          <div class="prose dark:prose-invert max-w-none mb-4 break-words " v-html="post.content"></div>
          <!-- <NuxtLink :to="`/blog/${post.slug}`" class="text-blue-600 dark:text-blue-300 hover:underline">
            Read more
          </NuxtLink> -->
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped></style>