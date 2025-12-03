<script setup>
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load lightweight repos list (without README HTML for performance)
const repos = JSON.parse(
  readFileSync(join(process.cwd(), 'data/github-repos-list.json'), 'utf-8')
)

// Filter and sort state
const searchQuery = ref('')
const selectedLanguage = ref('all')
const sortBy = ref('updated') // updated, stars, name

// Get unique languages
const languages = computed(() => {
  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))]
  return ['all', ...langs.sort()]
})

// Filtered and sorted repos
const filteredRepos = computed(() => {
  let filtered = repos

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.topics?.some((t) => t.toLowerCase().includes(query))
    )
  }

  // Language filter
  if (selectedLanguage.value !== 'all') {
    filtered = filtered.filter((repo) => repo.language === selectedLanguage.value)
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy.value === 'stars') {
      return b.stats.stars - a.stats.stars
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    } else {
      // updated (default)
      return new Date(b.pushedAt) - new Date(a.pushedAt)
    }
  })

  return sorted
})

// Stats
const totalStars = computed(() =>
  repos.reduce((sum, r) => sum + r.stats.stars, 0)
)
const totalForks = computed(() =>
  repos.reduce((sum, r) => sum + r.stats.forks, 0)
)

// SEO
useHead({
  title: 'GitHub Repositories - EJ Fox',
  meta: [
    {
      name: 'description',
      content: `Browse ${repos.length} public GitHub repositories by EJ Fox`,
    },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- Header -->
    <header class="mb-12">
      <h1 class="font-serif text-3xl mb-2">GitHub Repositories</h1>
      <p class="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
        {{ repos.length }} public repositories · {{ totalStars }} stars ·
        {{ totalForks }} forks
      </p>
    </header>

    <!-- Filters -->
    <div class="filters-container">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search repositories..."
        class="search-input"
      />

      <!-- Language Filter -->
      <select
        v-model="selectedLanguage"
        class="filter-select"
      >
        <option
          v-for="lang in languages"
          :key="lang"
          :value="lang"
        >
          {{ lang === 'all' ? 'All Languages' : lang }}
        </option>
      </select>

      <!-- Sort -->
      <select
        v-model="sortBy"
        class="filter-select"
      >
        <option value="updated">Recently Updated</option>
        <option value="stars">Most Stars</option>
        <option value="name">Name (A-Z)</option>
      </select>
    </div>

    <!-- Repos List -->
    <div class="space-y-0">
      <GithubRepoCard
        v-for="repo in filteredRepos"
        :key="repo.name"
        :name="repo.name"
        :description="repo.description"
        :language="repo.language"
        :language-color="repo.languageColor"
        :stars="repo.stats.stars"
        :forks="repo.stats.forks"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredRepos.length === 0"
      class="text-center py-12 text-zinc-500"
    >
      No repositories found matching your filters.
    </div>
  </div>
</template>

<style scoped>
.filters-container {
  @apply flex flex-wrap gap-3 mb-8;
}

.search-input {
  @apply flex-grow px-3 py-2 text-sm font-mono;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply bg-white dark:bg-zinc-950;
  @apply focus:outline-none focus:ring-1 focus:ring-zinc-400;
}

.filter-select {
  @apply px-3 py-2 text-sm font-mono;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply bg-white dark:bg-zinc-950;
  @apply focus:outline-none focus:ring-1 focus:ring-zinc-400;
}
</style>
