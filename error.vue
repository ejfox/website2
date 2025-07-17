<template>
  <div
    class="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center px-4"
  >
    <div class="max-w-2xl w-full text-center">
      <!-- Error Message -->
      <div class="mb-8">
        <h1
          class="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 font-mono"
        >
          {{ error.statusCode || 404 }}
        </h1>
        <h2
          class="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4"
        >
          Page not found
        </h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-4">
          The page you're looking for doesn't exist.
        </p>
      </div>

      <!-- Related Posts -->
      <div v-if="relatedPosts.length > 0" class="mb-8">
        <h3 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          Maybe you were looking for:
        </h3>
        <div class="space-y-3 text-left">
          <NuxtLink
            v-for="post in relatedPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
          >
            <h4
              class="font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
              v-html="highlightMatches(post.title, post.matchedTerms)"
            ></h4>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              {{ getPostType(post.slug) }} • {{ formatDate(post.date) }}
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Matches:
              <span class="font-medium">{{
                post.matchedTerms.join(', ')
              }}</span>
            </p>
          </NuxtLink>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <div class="flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/"
            class="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Go Home
          </NuxtLink>
          <NuxtLink
            to="/blog"
            class="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Browse Blog
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/utils/dateFormatters'

const route = useRoute()

// Props passed by Nuxt error handling
const props = defineProps({
  error: Object
})

const relatedPosts = ref([])

// Note: formatDate is now imported from utils/dateFormatters

// Get post type from slug
const getPostType = (slug) => {
  if (!slug) return 'Post'
  if (slug.startsWith('projects/')) return 'Project'
  if (slug.startsWith('week-notes/')) return 'Week Note'
  if (slug.match(/^\d{4}\//)) return 'Blog Post'
  return 'Post'
}

// Highlight matched terms in title
const highlightMatches = (title, matchedTerms) => {
  if (!title || !matchedTerms?.length) return title

  let highlighted = title
  matchedTerms.forEach((term) => {
    const regex = new RegExp(`(${term})`, 'gi')
    highlighted = highlighted.replace(
      regex,
      '<strong class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</strong>'
    )
  })
  return highlighted
}

// Simple search for related posts
onMounted(async () => {
  try {
    const data = await $fetch('/api/manifest')
    const allPosts = (data || []).filter((item) => {
      if (item.hidden === true || item.draft === true) return false
      const slug = item.slug || ''
      return /^\d{4}\/[^/]+$/.test(slug) || slug.startsWith('week-notes/')
    })

    // Extract search terms from URL
    const path = route.path
    if (path && path !== '/') {
      const pathParts = path.split('/').filter(Boolean)
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart) {
        const searchTerm = lastPart.replace(/-/g, ' ').toLowerCase()

        // Simple search - track which terms matched
        const matches = allPosts
          .map((post) => {
            const title = (post.title || '').toLowerCase()
            const slug = (post.slug || '').toLowerCase()

            let score = 0
            const matchedTerms = []

            // Score each word from the search term
            searchTerm.split(' ').forEach((word) => {
              if (word.length > 2) {
                if (title.includes(word)) {
                  score += 2
                  matchedTerms.push(word)
                }
                if (slug.includes(word)) {
                  score += 1
                  if (!matchedTerms.includes(word)) matchedTerms.push(word)
                }
              }
            })

            return { ...post, score, matchedTerms }
          })
          .filter((post) => post.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        relatedPosts.value = matches
      }
    }
  } catch (error) {
    console.error('Failed to load posts:', error)
  }
})
</script>
