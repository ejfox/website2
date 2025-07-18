<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl text-center space-y-12">
      <!-- Error Message -->
      <div class="space-y-2">
        <h1 class="text-base font-mono text-zinc-600 dark:text-zinc-400">
          {{ error.statusCode || 404 }}
        </h1>
        <p class="text-base text-zinc-600 dark:text-zinc-400">
          Page not found
        </p>
      </div>

      <!-- Related Posts -->
      <div v-if="relatedPosts.length > 0" class="space-y-6">
        <h3 class="text-lg font-medium">
          Maybe you were looking for:
        </h3>
        <div class="space-y-4">
          <NuxtLink
            v-for="post in relatedPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="block p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <h4 class="text-base mb-2" v-html="highlightMatches(post.title, post.matchedTerms)"></h4>
            <p class="text-base text-zinc-600 dark:text-zinc-400">
              {{ getPostType(post.slug) }} • {{ formatDate(post.date) }}
            </p>
          </NuxtLink>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <NuxtLink
          to="/"
          class="inline-block px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-lg"
        >
          Go Home
        </NuxtLink>
        <div>
          <NuxtLink
            to="/blog"
            class="text-base text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
const _props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
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
