<script setup lang="ts">
import { useFetch } from '#app'

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
}

const currentPage = ref(1)
const perPage = 64

const { data: gists, pending, error, refresh } = await useFetch<Gist[]>(() =>
  `https://api.github.com/users/ejfox/gists?per_page=${perPage}&page=${currentPage.value}`
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