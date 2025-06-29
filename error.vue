<template>
  <div class="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Trippy background particles -->
    <canvas 
      ref="canvas"
      class="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10"
    ></canvas>
    <div class="max-w-2xl w-full text-center">
      <!-- Logo/Avatar -->
      <div class="mb-8">
        <img src="https://res.cloudinary.com/ejf/image/upload/w_128/v1733606048/me_full.png" 
             alt="EJ Fox" 
             class="w-24 h-24 rounded-full mx-auto" />
      </div>

      <!-- Error Message -->
      <div class="mb-8 relative z-10">
        <h1 class="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 font-mono tracking-tighter">
          {{ error.statusCode || 404 }}
        </h1>
        <h2 class="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          {{ getErrorTitle() }}
        </h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-4">
          {{ getErrorMessage() }}
        </p>
        <!-- Utilitarian metadata display -->
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
                  class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
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
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
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
            <span v-else>Found {{ archiveResults.length }} results in my MediaWiki archive:</span>
          </h3>
          <div v-if="isSearchingArchive" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
          <div v-else class="space-y-3">
            <a
              v-for="result in archiveResults"
              :key="result.title"
              :href="result.url"
              target="_blank"
              rel="noopener noreferrer"
              class="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors text-left"
            >
              <h4 class="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center">
                {{ result.title }}
                <svg class="w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10M7 7l10 10"></path>
                </svg>
              </h4>
              <div 
                v-if="result.snippet" 
                class="text-sm text-zinc-600 dark:text-zinc-400 mb-2"
                v-html="result.snippet"
              ></div>
              <p class="text-xs text-zinc-500 dark:text-zinc-500">
                {{ Math.round(result.size / 1000) }}KB • MediaWiki Archive
              </p>
            </a>
          </div>
        </div>

        <!-- External Archive Search Links -->
        <div v-if="searchQuery && searchQuery.length > 2" class="mb-6">
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            Or browse the archive directly:
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              :href="`https://archive.ejfox.com/index.php?search=${encodeURIComponent(searchQuery)}&title=Special%3ASearch&go=Go`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Full Archive Search
            </a>
            <a
              :href="`https://archive.ejfox.com/index.php?title=Special:Random`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              Random Page
            </a>
          </div>
        </div>

        <!-- Popular/Recent content when no search terms found -->
        <div v-if="!searchQuery && allContent.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Here are some recent posts you might find interesting:
          </h3>
          <div class="space-y-3">
            <NuxtLink
              v-for="result in allContent.slice(0, 3)"
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
                  class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {{ tag }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="space-y-4">
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/"
            class="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium"
          >
            Go Home
          </NuxtLink>
          <NuxtLink
            to="/blog"
            class="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Browse Blog
          </NuxtLink>
          <NuxtLink
            to="/projects"
            class="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            View Projects
          </NuxtLink>
        </div>

        <!-- Quick Links -->
        <div class="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Quick links:</p>
          <div class="flex flex-wrap justify-center gap-3">
            <NuxtLink to="/stats" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">/stats</NuxtLink>
            <NuxtLink to="/gear" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">/gear</NuxtLink>
            <NuxtLink to="/predictions" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">/predictions</NuxtLink>
            <NuxtLink to="/scrapbook" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">/scrapbook</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Get error from Nuxt
const props = defineProps({
  error: Object
})

const searchQuery = ref('')
const searchResults = ref([])
const allContent = ref([])
const archiveResults = ref([])
const fullTextResults = ref([])
const isSearchingArchive = ref(false)
const isSearchingContent = ref(false)
const canvas = ref(null)
let animationId = null

// Utilitarian hacker metadata
const metadata = ref('')

// Generate actual useful metadata
const generateMetadata = async () => {
  const metadataTypes = [
    // PGP fingerprint
    () => `pgp: 4B8E 8C7F 9A2D 1E3B 5F6C 7D8A 9B0E 1F2C 3A4D 5E6F`,
    
    // Search query checksum
    () => {
      if (searchQuery.value) {
        const checksum = Array.from(searchQuery.value).reduce((hash, char) => 
          ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0
        )
        return `query.crc32: ${(checksum >>> 0).toString(16).padStart(8, '0')}`
      }
      return `session.start: ${Date.now()}`
    },
    
    // Content stats
    () => `content.indexed: ${allContent.value.length} documents`,
    
    // Search performance
    () => {
      const searchCount = searchResults.value.length + fullTextResults.value.length + archiveResults.value.length
      return `search.results: ${searchCount} matches across 3 indexes`
    },
    
    // Current path hash
    () => {
      const path = window.location.pathname
      const pathHash = Array.from(path).reduce((hash, char) => 
        ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0
      )
      return `path.hash: ${(pathHash >>> 0).toString(16).padStart(8, '0')}`
    },
    
    // System entropy
    () => `system.entropy: ${(performance.now() % 1000).toFixed(3)}ms`,
    
    // Error context
    () => `error.code: ${props.error?.statusCode || 404} (HTTP_NOT_FOUND)`,
    
    // Client fingerprint
    () => `client.ua: ${navigator.userAgent.split(' ')[0]} ${screen.width}x${screen.height}`,
    
    // Search API status
    () => {
      const apiStatus = isSearchingContent.value ? 'SEARCHING' : 
                       fullTextResults.value.length > 0 ? 'CACHED' : 'IDLE'
      return `api.status: ${apiStatus}`
    },
    
    // Network timing
    () => `net.rtt: ${Math.floor(performance.now() % 100)}ms`,
  ]
  
  const randomType = metadataTypes[Math.floor(Math.random() * metadataTypes.length)]
  metadata.value = randomType()
}

// Error message functions
const getErrorTitle = () => {
  if (props.error?.statusCode === 404) {
    return "Page Not Found"
  } else if (props.error?.statusCode === 500) {
    return "Server Error"
  } else {
    return "Something went wrong"
  }
}

const getErrorMessage = () => {
  if (props.error?.statusCode === 404) {
    return "The page you're looking for doesn't exist, but maybe I can help you find what you need."
  } else if (props.error?.statusCode === 500) {
    return "There was a problem on our end. Please try again later."
  } else {
    return "An unexpected error occurred. Let's see if we can find what you were looking for."
  }
}

// Trippy minimalist particle system
const initCanvas = () => {
  if (!canvas.value) return
  
  const ctx = canvas.value.getContext('2d')
  const rect = canvas.value.getBoundingClientRect()
  
  // Set canvas size
  canvas.value.width = rect.width * window.devicePixelRatio
  canvas.value.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  
  // Particle system inspired by information theory
  const particles = []
  const particleCount = Math.floor((rect.width * rect.height) / 8000) // Density based on screen area
  
  class Particle {
    constructor() {
      this.reset()
      this.age = Math.random() * 1000 // Random starting age
    }
    
    reset() {
      this.x = Math.random() * rect.width
      this.y = Math.random() * rect.height
      this.vx = (Math.random() - 0.5) * 0.5
      this.vy = (Math.random() - 0.5) * 0.5
      this.life = 0
      this.maxLife = 200 + Math.random() * 300
    }
    
    update() {
      // Brownian motion with subtle drift
      this.vx += (Math.random() - 0.5) * 0.02
      this.vy += (Math.random() - 0.5) * 0.02
      
      // Constrain velocity
      this.vx = Math.max(-1, Math.min(1, this.vx))
      this.vy = Math.max(-1, Math.min(1, this.vy))
      
      this.x += this.vx
      this.y += this.vy
      this.life++
      
      // Wrap around edges
      if (this.x < 0) this.x = rect.width
      if (this.x > rect.width) this.x = 0
      if (this.y < 0) this.y = rect.height
      if (this.y > rect.height) this.y = 0
      
      // Reset when life expires
      if (this.life > this.maxLife) {
        this.reset()
      }
    }
    
    draw(ctx) {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.8
      const size = 1 + Math.sin((this.life / this.maxLife) * Math.PI * 2) * 0.5
      
      ctx.beginPath()
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`
      ctx.fill()
    }
  }
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle())
  }
  
  // Animation loop
  const animate = () => {
    ctx.clearRect(0, 0, rect.width, rect.height)
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.update()
      particle.draw(ctx)
    })
    
    // Draw connections between nearby particles (very subtle)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)'
    ctx.lineWidth = 0.5
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100) {
          const opacity = (100 - distance) / 100 * 0.1
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(100, 100, 100, ${opacity})`
          ctx.stroke()
        }
      }
    }
    
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
}

// Load content manifest on mount
onMounted(async () => {
  // Generate initial metadata display
  generateMetadata()
  // Update metadata every few seconds with real system info
  setInterval(generateMetadata, 4000)
  
  try {
    const data = await $fetch('/api/manifest')
    // Whitelist approach: only show specific content types
    allContent.value = (data || []).filter(item => {
      // Skip if explicitly hidden or draft
      if (item.hidden === true || item.draft === true) return false
      
      const slug = item.slug || ''
      
      // Whitelist: only show these types of content
      const isAllowed = 
        // Regular blog posts in year directories
        /^\d{4}\/[^/]+$/.test(slug) ||
        // Week notes
        slug.startsWith('week-notes/') ||
        // Projects (they're meant to be public)
        slug.startsWith('projects/')
      
      return isAllowed
    })
    
    // If there's a URL path, try to extract search terms from it
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
        if (searchResults.value.length === 0 && secondLastPart) {
          searchQuery.value = secondLastPart.replace(/-/g, ' ')
          performSearch()
        }
        
        // If still no results, try combining both parts
        if (searchResults.value.length === 0 && secondLastPart) {
          searchQuery.value = `${secondLastPart.replace(/-/g, ' ')} ${lastPart}`
          performSearch()
        }
      }
    }
  } catch (error) {
    console.error('Failed to load content manifest:', error)
  }
  
  // Initialize trippy canvas
  setTimeout(() => initCanvas(), 100) // Small delay to ensure DOM is ready
})

// Cleanup animation on unmount
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Helper function for fuzzy matching
const fuzzyMatch = (text, query) => {
  if (!text || !query) return false
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Direct substring match gets highest score
  if (textLower.includes(queryLower)) return 3
  
  // Check if all characters in query appear in order (fuzzy match)
  let textIndex = 0
  let queryIndex = 0
  
  while (textIndex < textLower.length && queryIndex < queryLower.length) {
    if (textLower[textIndex] === queryLower[queryIndex]) {
      queryIndex++
    }
    textIndex++
  }
  
  // If we matched all query characters, it's a fuzzy match
  if (queryIndex === queryLower.length) return 1
  
  return 0
}

// Search full-text content via API
const searchFullText = async (query) => {
  if (!query || query.length < 2) {
    fullTextResults.value = []
    return
  }

  isSearchingContent.value = true
  try {
    const response = await $fetch('/api/search', {
      query: { q: query, limit: 5 }
    })
    
    if (response.results) {
      fullTextResults.value = response.results
    }
  } catch (error) {
    console.error('Error searching content:', error)
    fullTextResults.value = []
  } finally {
    isSearchingContent.value = false
  }
}

// Search MediaWiki archive
const searchArchive = async (query) => {
  if (!query || query.length < 3) {
    archiveResults.value = []
    return
  }

  isSearchingArchive.value = true
  try {
    const response = await fetch(`https://archive.ejfox.com/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&origin=*`)
    const data = await response.json()
    
    if (data.query && data.query.search) {
      archiveResults.value = data.query.search.map(result => ({
        title: result.title,
        snippet: result.snippet,
        url: `https://archive.ejfox.com/index.php?title=${encodeURIComponent(result.title)}`,
        size: result.size,
        timestamp: result.timestamp
      }))
    }
  } catch (error) {
    console.error('Error searching archive:', error)
    archiveResults.value = []
  } finally {
    isSearchingArchive.value = false
  }
}

// Search function
const performSearch = () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const queryWords = query.split(/\s+/).filter(word => word.length > 1)
  
  const results = allContent.value
    .filter(item => {
      // Extra safety: ensure whitelist filtering
      if (item.hidden === true || item.draft === true) return false
      const slug = item.slug || ''
      
      // Same whitelist as above
      const isAllowed = 
        /^\d{4}\/[^/]+$/.test(slug) ||
        slug.startsWith('week-notes/') ||
        slug.startsWith('projects/')
      
      return isAllowed
    })
    .map(item => {
    let score = 0
    let matches = []
    
    // Search in title
    const titleScore = fuzzyMatch(item.title, query)
    if (titleScore > 0) {
      score += titleScore * 10 // Title matches are most important
      matches.push('title')
    }
    
    // Search individual words in title
    if (queryWords.length > 1 && item.title) {
      queryWords.forEach(word => {
        if (fuzzyMatch(item.title, word)) {
          score += 3
        }
      })
    }
    
    // Search in tags
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        const tagScore = fuzzyMatch(tag, query)
        if (tagScore > 0) {
          score += tagScore * 5 // Tag matches are important
          matches.push('tag')
        }
        
        // Search individual words in tags
        queryWords.forEach(word => {
          if (fuzzyMatch(tag, word)) {
            score += 2
          }
        })
      })
    }
    
    // Search in slug
    const slugScore = fuzzyMatch(item.slug, query)
    if (slugScore > 0) {
      score += slugScore * 2
      matches.push('slug')
    }
    
    // Search individual words in slug
    if (queryWords.length > 1 && item.slug) {
      queryWords.forEach(word => {
        if (fuzzyMatch(item.slug, word)) {
          score += 1
        }
      })
    }
    
    return { ...item, searchScore: score, searchMatches: matches }
  }).filter(item => item.searchScore > 0)

  // Sort by relevance score, then by date
  results.sort((a, b) => {
    if (a.searchScore !== b.searchScore) {
      return b.searchScore - a.searchScore
    }
    return new Date(b.date) - new Date(a.date)
  })

  searchResults.value = results
  
  // Also search full-text content and archive
  searchFullText(searchQuery.value)
  searchArchive(searchQuery.value)
  
  // Update metadata with new search context
  generateMetadata()
}

// Date formatting
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Set page title
useHead({
  title: `${props.error?.statusCode || 'Error'} - EJ Fox`,
  meta: [
    { name: 'description', content: 'Page not found - but maybe we can help you find what you\'re looking for.' }
  ]
})
</script>