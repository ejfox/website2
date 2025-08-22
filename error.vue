<template>
  <div class="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
    <div class="max-w-2xl mx-auto px-4 py-24">
      <!-- Error Header -->
      <div class="mb-12">
        <h1 class="text-6xl font-bold text-zinc-900 dark:text-white mb-4">
          {{ error.statusCode || '???' }}
        </h1>
        <p class="text-xl text-zinc-600 dark:text-zinc-400">
          {{ getErrorTitle() }}
        </p>
        <p class="text-sm text-zinc-500 dark:text-zinc-500 font-mono mt-2">
          {{ $route?.path }}
        </p>
      </div>

      <!-- Smart Suggestions -->
      <div v-if="smartSuggestions.length" class="mb-12">
        <h2 class="text-lg font-medium text-zinc-900 dark:text-white mb-4">Did you mean:</h2>
        <div class="space-y-2">
          <NuxtLink
            v-for="suggestion in smartSuggestions" 
            :key="suggestion.path"
            :to="suggestion.path"
            class="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ suggestion.path }}
            <span class="text-zinc-500 dark:text-zinc-500 text-sm ml-2">{{ suggestion.reason }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Navigation -->
      <div class="space-y-3">
        <NuxtLink 
          to="/" 
          class="block text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
        >
          ← Home
        </NuxtLink>
        <NuxtLink 
          to="/blog" 
          class="block text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
        >
          Browse blog
        </NuxtLink>
        <NuxtLink 
          to="/stats" 
          class="block text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
        >
          View stats
        </NuxtLink>
        <button 
          @click="copyErrorInfo"
          class="block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-left"
        >
          Copy error {{ copied ? '✓' : '' }}
        </button>
      </div>

      <!-- Dev Tools -->
      <div v-if="isDev" class="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <p class="text-sm text-zinc-500 dark:text-zinc-500 mb-3">Dev:</p>
        <div class="space-y-1 text-sm">
          <a 
            :href="`http://localhost:3006/api/healthcheck`"
            target="_blank"
            class="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            /api/healthcheck
          </a>
          <a 
            :href="`http://localhost:3006/api/manifest`"
            target="_blank"
            class="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            /api/manifest
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const nuxtApp = useNuxtApp()

// Props passed by Nuxt error handling
const _props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const smartSuggestions = ref([])

// Enhanced error info
const isDev = process?.dev
const fullUrl = computed(() => {
  if (process?.client) {
    return window.location.href
  }
  return `${route?.path}${Object.keys(route?.query || {}).length ? '?' + new URLSearchParams(route?.query).toString() : ''}`
})

const getErrorTitle = () => {
  const code = _props.error.statusCode
  switch (code) {
    case 404: return 'Page not found'
    case 500: return 'Server error'
    case 403: return 'Access forbidden'
    case 401: return 'Authentication required'
    case 400: return 'Bad request'
    default: return _props.error.statusMessage || 'Something went wrong'
  }
}

// Copy error info to clipboard
const copied = ref(false)
const copyErrorInfo = async () => {
  const errorInfo = `ERROR ${_props.error.statusCode}: ${_props.error.statusMessage}
URL: ${fullUrl.value}
TIME: ${new Date().toISOString()}
ENV: ${isDev ? 'dev' : 'prod'}
RENDER: ${process?.client ? 'client' : 'server'}
${_props.error.stack ? '\nSTACK:\n' + _props.error.stack : ''}`

  try {
    await navigator.clipboard.writeText(errorInfo)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const reloadPage = () => {
  if (process?.client) {
    window.location.reload()
  }
}

// Smart suggestions based on 404 path
onMounted(async () => {
  const path = route?.path || ''
  const suggestions = []
  
  try {
    // Load manifest to search through actual content
    const data = await $fetch('/api/manifest')
    const allContent = (data || []).filter(item => !item.hidden && !item.draft)
    
    if (path && path !== '/') {
      // Extract search terms from the failed path
      const pathParts = path.split('/').filter(Boolean)
      const searchTerms = pathParts.map(part => part.replace(/-/g, ' ').toLowerCase())
      
      // Search through actual content
      const matches = allContent
        .map(item => {
          const title = (item.title || '').toLowerCase()
          const slug = (item.slug || '').toLowerCase()
          let score = 0
          let matchedTerms = []
          
          searchTerms.forEach(term => {
            if (title.includes(term)) {
              score += 3
              matchedTerms.push(term)
            }
            if (slug.includes(term)) {
              score += 2  
              if (!matchedTerms.includes(term)) matchedTerms.push(term)
            }
            // Partial matches
            if (term.length > 3) {
              if (title.includes(term.slice(0, -1))) score += 1
              if (slug.includes(term.slice(0, -1))) score += 1
            }
          })
          
          return { 
            ...item, 
            score, 
            matchedTerms,
            path: item.slug.startsWith('20') ? `/blog/${item.slug}` : `/blog/${item.slug}`,
            reason: `matches "${matchedTerms.join(', ')}"`
          }
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      
      suggestions.push(...matches)
    }
    
    // Fallback: common sections if no matches
    if (suggestions.length === 0) {
      suggestions.push(
        { path: '/blog', reason: 'main content archive' },
        { path: '/stats', reason: 'quantified self data' },
        { path: '/predictions', reason: 'cryptographic bets' },
        { path: '/now', reason: 'current status' }
      )
    }
    
  } catch (error) {
    console.error('Failed to load suggestions:', error)
    // Basic fallbacks
    suggestions.push(
      { path: '/blog', reason: 'content archive' },
      { path: '/stats', reason: 'personal metrics' }
    )
  }
  
  smartSuggestions.value = suggestions
})
</script>
