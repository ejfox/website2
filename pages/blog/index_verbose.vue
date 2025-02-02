<script setup>
import { format } from 'date-fns'
const processedMarkdown = useProcessedMarkdown()

// Get ALL posts without filtering
const { data: allPosts } = await useAsyncData('all-posts', () => 
  processedMarkdown.getAllPosts(true, true, true)
)

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

const postsByYear = computed(() => groupByYear(allPosts.value))
</script>

<template>
  <div class="container mx-auto px-4 py-8 font-mono">
    <h2 class="text-xl mb-6">All Posts ({{ allPosts?.length || 0 }})</h2>
    <div v-for="(posts, year) in postsByYear" :key="`year-${year}`" class="mb-4">
      <h3 class="text-lg mb-2">{{ year }} ({{ posts.length }})</h3>
      <ul class="space-y-1">
        <li v-for="post in posts" :key="post.slug" 
            class="flex items-baseline gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 p-1">
          <span class="text-gray-500 shrink-0">{{ formatDate(post.date) }}</span>
          <span class="text-gray-400 shrink-0">/{{ post.slug.split('/')[0] }}/</span>
          <NuxtLink :to="`/blog/${post?.slug}`" class="hover:underline truncate">
            {{ post.title || post.slug }}
          </NuxtLink>
          <span v-if="post.draft" class="text-red-500 shrink-0">[draft]</span>
          <span v-if="post.hidden" class="text-orange-500 shrink-0">[hidden]</span>
          <span v-if="post.wordCount" class="text-gray-400 shrink-0">
            ({{ post.wordCount }} words)
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.font-mono {
  font-variant-ligatures: none;
}
</style>