<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Error Header -->
      <div class="text-center space-y-4 py-8">
        <h1 class="text-6xl font-bold font-mono text-red-600 dark:text-red-400">
          {{ error.statusCode || 'ERROR' }}
        </h1>
        <p class="text-xl text-zinc-800 dark:text-zinc-200">
          {{ getErrorTitle() }}
        </p>
        <p class="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
          {{ new Date().toISOString() }}
        </p>
      </div>

      <!-- Detailed Error Info -->
      <div class="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          🔍 Error Details
        </h2>
        
        <div class="grid gap-4">
          <div class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Message
            </h3>
            <p class="font-mono text-sm text-red-600 dark:text-red-400">
              {{ error.statusMessage || error.message || 'Unknown error' }}
            </p>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              URL
            </h3>
            <p class="font-mono text-sm break-all text-zinc-700 dark:text-zinc-300">
              {{ fullUrl }}
            </p>
          </div>

          <div v-if="error.stack" class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Stack Trace
            </h3>
            <pre class="text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">{{ error.stack }}</pre>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Request Info
            </h3>
            <div class="text-sm space-y-1">
              <p><strong>Method:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ $route.meta?.method || 'GET' }}</code></p>
              <p><strong>Path:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ $route?.path }}</code></p>
              <p><strong>Query:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ JSON.stringify($route?.query) }}</code></p>
              <p><strong>Params:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ JSON.stringify($route.params) }}</code></p>
              <p><strong>User Agent:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-xs">{{ userAgent }}</code></p>
            </div>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Environment
            </h3>
            <div class="text-sm space-y-1">
              <p><strong>Environment:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ isDev ? 'development' : 'production' }}</code></p>
              <p><strong>Rendered on:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ process.client ? 'client' : 'server' }}</code></p>
              <p><strong>Nuxt Version:</strong> <code class="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{{ nuxtApp?.versions?.nuxt || 'unknown' }}</code></p>
            </div>
          </div>

          <div v-if="error.data" class="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Additional Data
            </h3>
            <pre class="text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(error.data, null, 2) }}</pre>
          </div>

          <div v-if="isDev" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 class="font-medium text-red-900 dark:text-red-100 mb-2">
              🔧 Full Error Object (Dev Only)
            </h3>
            <pre class="text-xs font-mono text-red-800 dark:text-red-200 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{{ JSON.stringify(error, null, 2) }}</pre>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Debugging Tips
            </h3>
            <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc pl-4">
              <li v-if="error.statusCode === 404">
                Check if the file exists in <code class="bg-blue-200 dark:bg-blue-800 px-1 rounded">content/processed/</code>
              </li>
              <li v-if="error.statusCode === 500">
                Check server logs and API endpoints for detailed stack traces
              </li>
              <li v-if="error.statusCode === 500">
                Verify all imports and composables are working correctly
              </li>
              <li>Check browser console for additional client-side errors</li>
              <li>Verify API endpoints are responding: <code class="bg-blue-200 dark:bg-blue-800 px-1 rounded">/api/manifest</code>, <code class="bg-blue-200 dark:bg-blue-800 px-1 rounded">/api/posts/*</code></li>
            </ul>
          </div>
        </div>
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

      <!-- Quick Actions -->
      <div class="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          🚀 Quick Actions
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            to="/"
            class="flex items-center justify-center px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium"
          >
            🏠 Go Home
          </NuxtLink>
          
          <NuxtLink
            to="/blog"
            class="flex items-center justify-center px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors font-medium"
          >
            📝 Browse Blog
          </NuxtLink>

          <button
            class="flex items-center justify-center px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors font-medium"
            @click="copyErrorInfo"
          >
            📋 {{ copied ? 'Copied!' : 'Copy Error Info' }}
          </button>

          <button
            class="flex items-center justify-center px-6 py-3 border border-amber-300 dark:border-amber-600 text-amber-900 dark:text-amber-100 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium"
            @click="reloadPage"
          >
            🔄 Reload Page
          </button>
        </div>

        <div v-if="isDev" class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            Dev Tools:
          </p>
          <div class="flex flex-wrap gap-2">
            <a 
              :href="`http://localhost:3006/api/manifest`"
              target="_blank"
              class="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              Check Manifest API
            </a>
            <a 
              :href="`http://localhost:3006${$route?.path}`"
              target="_blank"
              class="text-xs px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              Retry Current URL
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/utils/dateFormatters'

const route = useRoute()
const nuxtApp = useNuxtApp()

// Props passed by Nuxt error handling
const _props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const relatedPosts = ref([])

// Enhanced error info
const isDev = process.dev
const fullUrl = computed(() => {
  if (process.client) {
    return window.location.href
  }
  return `${route?.path}${Object.keys(route?.query).length ? '?' + new URLSearchParams(route?.query).toString() : ''}`
})

const userAgent = computed(() => {
  if (process.client) {
    return navigator.userAgent
  }
  return 'Server-side render'
})

const getErrorTitle = () => {
  const code = _props.error.statusCode
  switch (code) {
    case 404: return 'Page Not Found'
    case 500: return 'Internal Server Error'
    case 403: return 'Access Forbidden'
    case 401: return 'Unauthorized'
    case 400: return 'Bad Request'
    default: return _props.error.statusMessage || 'Something went wrong'
  }
}

// Copy error info to clipboard
const copied = ref(false)
const copyErrorInfo = async () => {
  const errorInfo = {
    statusCode: _props.error.statusCode,
    message: _props.error.statusMessage || _props.error.message,
    url: fullUrl.value,
    userAgent: userAgent.value,
    timestamp: new Date().toISOString(),
    route: {
      path: route?.path,
      query: route?.query,
      params: route.params
    },
    stack: _props.error.stack,
    data: _props.error.data
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy error info:', err)
  }
}

const reloadPage = () => {
  if (process.client) {
    window.location.reload()
  }
}

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
    const path = route?.path
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
