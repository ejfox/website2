<script setup lang="ts">
import { useFetch } from '#app'
import { useStats } from '~/composables/useStats'
import GitHubStats from '~/components/stats/GitHubStats.vue'

interface GistFile {
  filename: string
  type: string
  language: string
  raw_url: string
  size: number
}

interface Gist {
  id: string
  description: string
  created_at: string
  updated_at: string
  files: Record<string, GistFile>
  html_url: string
  content?: string
}

// Fetch GitHub stats for the top section
const { stats: rawStats, isLoading: statsLoading } = useStats()
const stats = computed(() => rawStats.value || {})
const hasGithubData = computed(() => !!(stats.value?.github?.stats))

const currentPage = ref(1)
const perPage = 64

const { data: gists, pending, error, refresh } = await useFetch<Gist[]>(() =>
  `/api/gists?per_page=${perPage}&page=${currentPage.value}`
)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const nextPage = () => {
  if (gists.value?.length === perPage) {
    currentPage.value++
    refresh()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    refresh()
  }
}

// Calculate stats for minimal display
const totalGists = computed(() => gists.value?.length || 0)
const totalFiles = computed(() => {
  if (!gists.value) return 0
  return gists.value.reduce((sum, gist) => sum + Object.keys(gist.files).length, 0)
})
const totalSize = computed(() => {
  if (!gists.value) return 0
  return gists.value.reduce((sum, gist) => {
    return sum + Object.values(gist.files).reduce((fileSum, file) => fileSum + (file.size || 0), 0)
  }, 0)
})

const languageCounts = computed(() => {
  if (!gists.value) return []

  const counts: Record<string, number> = {}

  gists.value.forEach(gist => {
    Object.values(gist.files).forEach(file => {
      if (file.language) {
        counts[file.language] = (counts[file.language] || 0) + 1
      }
    })
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
})

const languageCountsFormatted = computed(() => {
  return languageCounts.value.map(([lang, count]) => `${lang}(${count})`).join(', ')
})

// Expand/collapse state for gists
const expandedGists = ref<Set<string>>(new Set())

const toggleGist = (gistId: string) => {
  if (expandedGists.value.has(gistId)) {
    expandedGists.value.delete(gistId)
  } else {
    expandedGists.value.add(gistId)
  }
}

// Syntax highlighting
const highlightCode = async (code: string, language: string) => {
  if (process.client) {
    try {
      const { createHighlighter } = await import('shiki')
      const highlighter = await createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown', 'bash', 'python', 'go', 'rust', 'java', 'cpp']
      })
      
      return highlighter.codeToHtml(code, {
        lang: language.toLowerCase() || 'text',
        theme: 'github-dark'
      })
    } catch (error) {
      console.warn('Failed to highlight code:', error)
      return `<pre><code>${code}</code></pre>`
    }
  }
  return `<pre><code>${code}</code></pre>`
}

// Get preview lines (first 10 lines)
const getPreviewLines = (content: string) => {
  return content.split('\n').slice(0, 10).join('\n')
}
</script>

<template>
  <div class="py-8 px-4 font-mono text-sm">
    
    <!-- Header -->
    <div class="mb-8 border-b border-zinc-800 pb-4">
      <h1 class="text-2xl uppercase tracking-wide mb-2">GitHub Gists</h1>

      <!-- Minimal stats -->
      <div class="grid grid-cols-1 gap-1 text-xs text-zinc-500">
        <div>GISTS: {{ totalGists }} | FILES: {{ totalFiles }} | SIZE: {{ Math.round(totalSize / 1024) }}KB</div>
        <div>LANGUAGES: {{ languageCountsFormatted }}</div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="py-4 text-center text-zinc-500">
      Loading...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-4 text-center text-red-500">
      Error: {{ error.message }}
    </div>

    <!-- Gist list -->
    <div v-else-if="gists" class="space-y-0">
      <div v-for="(gist, index) in gists" :key="gist.id" class="border-t border-zinc-800/30 py-3">
        <div class="flex items-baseline gap-2">
          <span class="text-zinc-500 w-6 text-right">{{ index + 1 + (currentPage - 1) * perPage }}.</span>
          <a :href="gist.html_url" target="_blank" rel="noopener" class="hover:underline hover:text-zinc-300 truncate">
            {{ Object.values(gist.files)[0]?.filename || 'Untitled' }}
          </a>
          <span class="text-zinc-500 ml-auto">{{ formatDate(gist.created_at) }}</span>
        </div>

        <div v-if="gist.description" class="pl-8 text-zinc-400 text-xs mt-1">
          {{ gist.description }}
        </div>

        <div class="pl-8 text-zinc-500 text-xs mt-1 grid grid-cols-1 gap-1">
          <div v-for="(file, filename) in gist.files" :key="filename" class="flex items-center gap-2">
            <span class="opacity-70">-</span>
            <span class="truncate">{{ filename }}</span>
            <span class="opacity-70">[{{ file.language || 'txt' }}]</span>
            <span class="opacity-70">{{ Math.round(file.size / 1024) }}kb</span>
          </div>
        </div>

        <!-- Single file gist preview -->
        <div v-if="gist.content && Object.keys(gist.files).length === 1" class="pl-8 mt-3">
          <GistPreview 
            :gist="gist" 
            :file="Object.values(gist.files)[0]"
            :expanded="expandedGists.has(gist.id)"
            @toggle="toggleGist(gist.id)"
          />
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center pt-4 border-t border-zinc-800 mt-6 text-xs">
        <button @click="prevPage" :disabled="currentPage === 1" class="disabled:opacity-30 disabled:cursor-not-allowed">
          &lt;&lt; PREV
        </button>
        <span class="text-zinc-500">PAGE {{ currentPage }}</span>
        <button @click="nextPage" :disabled="!gists?.length || gists.length < perPage"
          class="disabled:opacity-30 disabled:cursor-not-allowed">
          NEXT &gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Monospace font for BBS style */
</style>