<template>
  <div class="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center px-4">
    <div class="max-w-2xl w-full text-center">
      <!-- Logo/Avatar -->
      <div class="mb-8">
        <NuxtImg 
          src="https://res.cloudinary.com/ejf/image/upload/w_128/v1733606048/me_full.png" 
          alt="EJ Fox" 
          class="w-24 h-24 rounded-full mx-auto"
          loading="eager"
          preset="avatar"
        />
      </div>

      <!-- Error Message -->
      <div class="mb-8">
        <h1 class="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 font-mono tracking-tighter">
          {{ error.statusCode || 404 }}
        </h1>
        <h2 class="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          {{ getErrorTitle() }}
        </h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-4">
          {{ getErrorMessage() }}
        </p>
        <!-- Simple metadata display -->
        <div class="text-xs text-zinc-500 dark:text-zinc-500 mt-4 font-mono opacity-60">
          {{ metadata }}
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="mb-8">
        <h3 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          Found {{ searchResults.length }} related {{ searchResults.length === 1 ? 'result' : 'results' }}:
        </h3>
        <div class="space-y-3">
          <NuxtLink
            v-for="result in searchResults.slice(0, 5)"
            :key="result.slug"
            :to="`/blog/${result.slug}`"
            class="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors text-left"
          >
            <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {{ result.title }}
            </h4>
            <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              {{ formatDate(result.date) }}
            </p>
            <div v-if="result.tags && result.tags.length > 0" class="flex flex-wrap gap-1">
              <span
                v-for="tag in result.tags.slice(0, 3)"
                :key="tag"
                class="px-2 py-1 text-xs rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                {{ tag }}
              </span>
            </div>
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

        <!-- Quick Links -->
        <div class="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Quick links:</p>
          <div class="flex flex-wrap justify-center gap-3">
            <NuxtLink to="/stats" class="text-sm link-muted">/stats</NuxtLink>
            <NuxtLink to="/gear" class="text-sm link-muted">/gear</NuxtLink>
            <NuxtLink to="/predictions" class="text-sm link-muted">/predictions</NuxtLink>
            <NuxtLink to="/scrapbook" class="text-sm link-muted">/scrapbook</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns'

const route = useRoute()

// Props passed by Nuxt error handling
const props = defineProps({
  error: Object
})

// Basic metadata
const metadata = ref('')

// Search functionality
const searchResults = ref([])
const searchQuery = ref('')
const allContent = ref([])

// Error handling
const getErrorTitle = () => {
  const status = props.error?.statusCode || 404
  if (status === 404) {
    return "Page not found"
  } else if (status >= 500) {
    return "Server Error"
  } else if (status >= 400) {
    return "Client Error"
  } else {
    return "Error"
  }
}

const getErrorMessage = () => {
  const status = props.error?.statusCode || 404
  if (status === 404) {
    return "The page you're looking for doesn't exist. But maybe I can help you find what you need."
  } else if (status >= 500) {
    return "Something went wrong on our end. Please try again later."
  } else {
    return "An unexpected error occurred. Let's see if we can find what you were looking for."
  }
}

// Date formatting
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

// Generate simple metadata
const generateMetadata = () => {
  const now = new Date()
  const items = [
    `timestamp: ${now.toISOString()}`,
    `error.code: ${props.error?.statusCode || 404}`,
    `path: ${route.path}`,
    `user-agent: ${navigator?.userAgent?.split(' ')[0] || 'unknown'}`
  ]
  metadata.value = items.join(' | ')
}

// Search functionality
const performSearch = () => {
  if (!searchQuery.value || !allContent.value.length) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const results = allContent.value
    .filter(item => {
      const title = (item.title || '').toLowerCase()
      const slug = (item.slug || '').toLowerCase()
      const tags = (item.tags || []).join(' ').toLowerCase()
      
      return title.includes(query) || slug.includes(query) || tags.includes(query)
    })
    .slice(0, 5)

  searchResults.value = results
}

// Load content and search on mount
onMounted(async () => {
  generateMetadata()
  
  try {
    const data = await $fetch('/api/manifest')
    allContent.value = (data || []).filter(item => {
      if (item.hidden === true || item.draft === true) return false
      const slug = item.slug || ''
      return /^\d{4}\/[^/]+$/.test(slug) || slug.startsWith('week-notes/') || slug.startsWith('projects/')
    })
    
    // Extract search terms from current path
    const currentPath = window.location.pathname
    if (currentPath && currentPath !== '/') {
      const pathParts = currentPath.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        searchQuery.value = pathParts[pathParts.length - 1].replace(/-/g, ' ')
        performSearch()
      }
    }
  } catch (error) {
    console.error('Failed to load content manifest:', error)
  }
})
</script>