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

      <!-- Auto-search results based on failed route -->
      <div class="mb-8">
        <div v-if="searchQuery" class="mb-6">
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            I searched for content related to "<span class="font-medium">{{ searchQuery }}</span>" from your URL:
          </p>
        </div>
        
        <!-- Search Results -->
        <div v-if="searchResults.length > 0" class="space-y-3 mb-6">
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

        <!-- No results message -->
        <div v-else-if="searchQuery && searchResults.length === 0" class="mb-6">
          <p class="text-zinc-600 dark:text-zinc-400 mb-4">
            No content found matching "{{ searchQuery }}". 
          </p>
        </div>

        <!-- Full-Text Search Results -->
        <div v-if="searchQuery && (fullTextResults.length > 0 || isSearchingContent)" class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            <span v-if="isSearchingContent">Searching content...</span>
            <span v-else>Found in content ({{ fullTextResults.length }} results):</span>
          </h3>
          <div v-if="isSearchingContent" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-600 dark:border-zinc-400"></div>
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="result in fullTextResults"
              :key="result.slug"
              :to="result.url"
              class="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors text-left"
            >
              <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {{ result.title }}
              </h4>
              <div 
                v-if="result.snippet" 
                class="text-sm text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed"
                v-html="result.snippet.replace(/\*\*(.*?)\*\*/g, '<mark class=&quot;bg-yellow-200 dark:bg-yellow-800 px-1 rounded&quot;>$1</mark>')"
              ></div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-zinc-500 dark:text-zinc-500">
                  {{ formatDate(result.date) }} • {{ result.words }} words
                </p>
                <div v-if="result.tags && result.tags.length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in result.tags.slice(0, 3)"
                    :key="tag"
                    class="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Archive Search Results -->
        <div v-if="searchQuery && (archiveResults.length > 0 || isSearchingArchive)" class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            <span v-if="isSearchingArchive">Searching archive...</span>
            <span v-else>Found in archive ({{ archiveResults.length }} results):</span>
          </h3>
          <div v-if="isSearchingArchive" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-600 dark:border-zinc-400"></div>
          </div>
          <div v-else class="space-y-3">
            <a
              v-for="result in archiveResults"
              :key="result.url"
              :href="result.url"
              target="_blank"
              rel="noopener noreferrer"
              class="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors text-left"
            >
              <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center">
                {{ result.title }}
                <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4 ml-2 opacity-60" />
              </h4>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                {{ result.description }}
              </p>
              <p class="text-xs text-zinc-500 dark:text-zinc-500">
                archive.ejfox.com • {{ formatDate(result.date) }}
              </p>
            </a>
          </div>
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
const fullTextResults = ref([])
const archiveResults = ref([])
const isSearchingContent = ref(false)
const isSearchingArchive = ref(false)
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

// Enhanced search functionality
const performSearch = () => {
  if (!searchQuery.value || !allContent.value.length) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const results = allContent.value
    .map(item => {
      const title = (item.title || '').toLowerCase()
      const slug = (item.slug || '').toLowerCase()
      const tags = (item.tags || []).join(' ').toLowerCase()
      
      let score = 0
      if (title.includes(query)) score += 3
      if (slug.includes(query)) score += 2
      if (tags.includes(query)) score += 1
      
      return { ...item, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  searchResults.value = results
  
  // Also search full-text content
  if (query.length >= 3) {
    searchFullText(query)
    searchArchive(query)
  }
}

// Search full-text content via API
const searchFullText = async (query) => {
  if (!query || query.length < 3) {
    fullTextResults.value = []
    return
  }

  isSearchingContent.value = true
  try {
    const response = await $fetch('/api/search', {
      query: { q: query, limit: 5 }
    })
    fullTextResults.value = response.results || []
  } catch (error) {
    console.error('Full-text search failed:', error)
    fullTextResults.value = []
  } finally {
    isSearchingContent.value = false
  }
}

// Search archive content
const searchArchive = async (query) => {
  if (!query || query.length < 3) {
    archiveResults.value = []
    return
  }

  isSearchingArchive.value = true
  try {
    const response = await fetch(`https://archive.ejfox.com/api/search?q=${encodeURIComponent(query)}&limit=3`)
    if (response.ok) {
      const data = await response.json()
      archiveResults.value = data.results || []
    }
  } catch (error) {
    console.error('Archive search failed:', error)
    archiveResults.value = []
  } finally {
    isSearchingArchive.value = false
  }
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
    
    // Intelligent URL parsing to extract search terms
    const currentPath = window.location.pathname
    if (currentPath && currentPath !== '/') {
      const pathParts = currentPath.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        // Try different combinations of path parts as search terms
        const lastPart = pathParts[pathParts.length - 1].replace(/-/g, ' ')
        const secondLastPart = pathParts.length > 1 ? pathParts[pathParts.length - 2] : ''
        
        // Set initial search query
        searchQuery.value = lastPart
        performSearch()
        
        // If no results with last part, try with second-to-last part
        setTimeout(() => {
          if (searchResults.value.length === 0 && secondLastPart) {
            searchQuery.value = secondLastPart.replace(/-/g, ' ')
            performSearch()
          }
          
          // If still no results, try combining both parts
          setTimeout(() => {
            if (searchResults.value.length === 0 && secondLastPart) {
              searchQuery.value = `${secondLastPart.replace(/-/g, ' ')} ${lastPart}`
              performSearch()
            }
          }, 500)
        }, 500)
      }
    }
  } catch (error) {
    console.error('Failed to load content manifest:', error)
  }
})
</script>