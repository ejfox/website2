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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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
</script>

<template>
  <div class="py-8 max-w-screen-sm">
    <h1 class="text-3xl font-bold mb-8">Latest GitHub Gists</h1>

    <div v-if="pending" class="py-4">
      Loading gists...
    </div>

    <div v-else-if="error" class="py-4">
      Error loading gists: {{ error.message }}
    </div>

    <div v-else-if="gists" class="space-y-4">
      <div v-for="gist in gists" :key="gist.id" class="py-2 rounded-lg transition-colors container group">
        <a :href="gist.html_url" target="_blank" rel="noopener" class="block">
          <div class="flex justify-between items-start gap-4 mb-2">
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-semibold truncate group-hover:text-blue-400 transition-colors">
                {{ Object.values(gist.files)[0]?.filename || 'Untitled' }}
              </h2>
              <p v-if="gist.description" class="text-lg prose measure text-gray-300 mt-1">
                {{ gist.description }}
              </p>
            </div>
            <span class="text-xs text-gray-400 shrink-0 mt-1 pr-2 md:pr-8">
              {{ formatDate(gist.created_at) }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-2 mt-3">
            <div v-for="(file, filename) in gist.files" :key="filename"
              class="flex items-center text-xs text-gray-400 gap-2">
              <span class="font-medium truncate">{{ filename }}</span>
              <span class="shrink-0">{{ file.language }}</span>
              <span class="shrink-0">{{ Math.round(file.size / 1024 * 100) / 100 }}kb</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Pagination Controls -->
      <div class="flex justify-between items-center pt-8">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800">
          Previous
        </button>
        <span class="text-sm text-gray-400">Page {{ currentPage }}</span>
        <button @click="nextPage" :disabled="!gists?.length || gists.length < perPage"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>