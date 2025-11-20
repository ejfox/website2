<script setup lang="ts">
// Nuxt 4 auto-imports all composables!

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
const { stats: rawStats, isLoading: _statsLoading } = useStats()
const stats = computed(() => rawStats.value || {})
const _hasGithubData = computed(() => !!stats.value?.github?.stats)

const currentPage = ref(1)
const perPage = 64

const {
  data: gists,
  pending,
  error,
  refresh
} = await useFetch<Gist[]>(
  () => `/api/gists?per_page=${perPage}&page=${currentPage.value}`
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
  return gists.value.reduce(
    (sum, gist) => sum + Object.keys(gist.files).length,
    0
  )
})
const totalSize = computed(() => {
  if (!gists.value) return 0
  return gists.value.reduce((sum, gist) => {
    return (
      sum +
      Object.values(gist.files).reduce(
        (fileSum, file) => fileSum + (file.size || 0),
        0
      )
    )
  }, 0)
})

const languageCounts = computed(() => {
  if (!gists.value) return []

  const counts: Record<string, number> = {}

  gists.value.forEach((gist) => {
    Object.values(gist.files).forEach((file) => {
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
  return languageCounts.value
    .map(([lang, count]) => `${lang}(${count})`)
    .join(', ')
})

// OpenGraph description with overview stats
const gistsDescription = computed(() => {
  const gistCount = totalGists.value || 0
  const fileCount = totalFiles.value || 0
  const sizeKB = Math.round(totalSize.value / 1024)

  if (gistCount === 0)
    return 'Code snippets, scripts, and experiments from GitHub Gists'

  const topLangs = languageCounts.value
    .slice(0, 4)
    .map(([lang, count]) => `${lang} (${count})`)
    .join(' • ')

  return `${gistCount} gists • ${fileCount} files • ${sizeKB}KB • ${topLangs}`
})

useHead(() => ({
  title: 'Gists - EJ Fox',
  meta: [
    {
      name: 'description',
      content: gistsDescription.value
    },
    { property: 'og:title', content: 'Gists - EJ Fox' },
    {
      property: 'og:description',
      content: gistsDescription.value
    },
    { property: 'og:url', content: 'https://ejfox.com/gists' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://ejfox.com/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Gists - EJ Fox' },
    {
      name: 'twitter:description',
      content: gistsDescription.value
    },
    { name: 'twitter:image', content: 'https://ejfox.com/og-image.png' }
  ],
  link: [{ rel: 'canonical', href: 'https://ejfox.com/gists' }]
}))

// Expand/collapse state for gists
const expandedGists = ref<Set<string>>(new Set())

const toggleGist = (gistId: string) => {
  if (expandedGists.value.has(gistId)) {
    expandedGists.value.delete(gistId)
  } else {
    expandedGists.value.add(gistId)
  }
}

// Removed client-side syntax highlighting - now handled server-side
// Old highlightCode and getPreviewLines functions removed
</script>

<template>
  <div class="py-8 px-4 font-mono text-sm">
    <!-- Header -->
    <div class="mb-8 pb-4">
      <h1 class="text-mono-label mb-2">GITHUB_GISTS</h1>

      <!-- Minimal stats -->
      <div class="grid grid-cols-1 gap-1 text-xs text-muted">
        <div>
          GISTS: {{ totalGists }} | FILES: {{ totalFiles }} | SIZE:
          {{ Math.round(totalSize / 1024) }}KB
        </div>
        <div>LANGUAGES: {{ languageCountsFormatted }}</div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="stack-4">
      <div v-for="i in 8" :key="i" class="py-4">
        <div class="flex items-baseline gap-2">
          <div class="skeleton w-6 h-4"></div>
          <div class="skeleton w-64 h-4"></div>
          <div class="skeleton w-20 h-4 ml-auto"></div>
        </div>
        <div class="pl-8 mt-1">
          <div class="skeleton w-96 h-3"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="py-4 text-center text-red-500">
      Error: {{ error.message }}
    </div>

    <!-- Gist list -->
    <div v-else-if="gists" class="space-y-0">
      <div v-for="(gist, index) in gists" :key="gist.id" class="py-4">
        <div class="flex items-baseline gap-2">
          <span class="text-muted w-6 text-right"
            >{{ index + 1 + (currentPage - 1) * perPage }}.</span
          >
          <a
            :href="gist.html_url"
            target="_blank"
            rel="noopener"
            class="truncate"
          >
            {{ Object.values(gist.files)[0]?.filename || 'Untitled' }}
          </a>
          <span class="text-muted ml-auto">{{
            formatDate(gist.created_at)
          }}</span>
        </div>

        <div v-if="gist.description" class="pl-8 text-secondary text-xs mt-1">
          {{ gist.description }}
        </div>

        <div class="pl-8 text-muted text-xs mt-1 grid grid-cols-1 gap-1">
          <div
            v-for="(file, filename) in gist.files"
            :key="filename"
            class="flex items-center gap-2"
          >
            <span class="opacity-70">-</span>
            <span class="truncate">{{ filename }}</span>
            <span class="opacity-70">[{{ file.language || 'txt' }}]</span>
            <span class="opacity-70">{{ Math.round(file.size / 1024) }}kb</span>
          </div>
        </div>

        <!-- Single file gist preview -->
        <div
          v-if="gist.content && Object.keys(gist.files).length === 1"
          class="pl-8 mt-4"
        >
          <GistPreview
            :gist="gist"
            :file="Object.values(gist.files)[0]"
            :expanded="expandedGists.has(gist.id)"
            @toggle="toggleGist(gist.id)"
          />
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between pt-4 mt-8 text-xs">
        <button
          :disabled="currentPage === 1"
          class="disabled:opacity-30 disabled:cursor-not-allowed"
          @click="prevPage"
        >
          &lt;&lt; PREV
        </button>
        <span class="text-muted">PAGE {{ currentPage }}</span>
        <button
          :disabled="!gists?.length || gists.length < perPage"
          class="disabled:opacity-30 disabled:cursor-not-allowed"
          @click="nextPage"
        >
          NEXT &gt;&gt;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Monospace font for BBS style */
</style>
