<script setup>
// Load lightweight repos list (without README HTML for performance)
const { data: reposData } = await useFetch('/api/github-repos-list')
const repos = computed(() => reposData.value || [])

// Filter and sort state
const searchQuery = ref('')
const selectedLanguage = ref('all')
const sortBy = ref('updated') // updated, stars, name
const viewMode = ref('list') // force, list, ridgeline, grid, parallel, radial

// Get unique languages
const languages = computed(() => {
  const langs = [...new Set(repos.value.map((r) => r.language).filter(Boolean))]
  return ['all', ...langs.sort()]
})

// Filtered and sorted repos
const filteredRepos = computed(() => {
  let filtered = repos.value

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
    filtered = filtered.filter(
      (repo) => repo.language === selectedLanguage.value
    )
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
const lastUpdated = computed(() => {
  const dates = repos
    .map((r) => new Date(r.pushedAt || r.updatedAt || r.createdAt || 0))
    .filter((d) => !Number.isNaN(d.getTime()))
    .map((d) => d.getTime())

  if (!dates.length) return ''
  return new Date(Math.max(...dates)).toISOString().split('T')[0]
})

// SEO
usePageSeo({
  title: 'GitHub repositories · EJ Fox',
  description:
    'Browse public GitHub repositories with stars, forks, and activity charts.',
  type: 'article',
  section: 'Code',
  tags: ['GitHub', 'Open source', 'Repositories'],
  label1: 'Repos',
  data1: `${repos.length} public`,
  label2: 'Stars',
  data2: computed(
    () => `${totalStars.value} stars · ${totalForks.value} forks`
  ),
})
</script>

<template>
  <div class="container-main">
    <!-- Header - Match blog/projects page header spacing -->
    <header class="mb-8 md:mb-12 py-8 md:py-16 relative z-10">
      <h1 class="font-serif text-3xl mb-2">GitHub Repositories</h1>
      <p class="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
        {{ repos.length }} public repositories · {{ totalStars }} stars ·
        {{ totalForks }} forks
      </p>
      <p class="text-zinc-500 dark:text-zinc-500 font-mono text-[11px]">
        Updated {{ lastUpdated }} · source: GitHub API export
      </p>
    </header>

    <!-- View Toggle -->
    <div class="view-toggle mb-8 relative z-10">
      <button
        :class="['toggle-btn', { active: viewMode === 'force' }]"
        title="Force-directed graph"
        @click="viewMode = 'force'"
      >
        Force
      </button>
      <button
        :class="['toggle-btn', { active: viewMode === 'ridgeline' }]"
        title="Ridgeline density plot"
        @click="viewMode = 'ridgeline'"
      >
        Ridgeline
      </button>
      <button
        :class="['toggle-btn', { active: viewMode === 'grid' }]"
        title="Histogram grid"
        @click="viewMode = 'grid'"
      >
        Grid
      </button>
      <button
        :class="['toggle-btn', { active: viewMode === 'parallel' }]"
        title="Parallel coordinates"
        @click="viewMode = 'parallel'"
      >
        Parallel
      </button>
      <button
        :class="['toggle-btn', { active: viewMode === 'radial' }]"
        title="Radial timeline"
        @click="viewMode = 'radial'"
      >
        Radial
      </button>
      <button
        :class="['toggle-btn', { active: viewMode === 'list' }]"
        title="List view"
        @click="viewMode = 'list'"
      >
        List
      </button>
    </div>

    <!-- Filters (only show for list view) -->
    <div v-if="viewMode === 'list'" class="filters-container relative z-10">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search repositories..."
        class="search-input"
      />

      <!-- Language Filter -->
      <select v-model="selectedLanguage" class="filter-select">
        <option v-for="lang in languages" :key="lang" :value="lang">
          {{ lang === 'all' ? 'All Languages' : lang }}
        </option>
      </select>

      <!-- Sort -->
      <select v-model="sortBy" class="filter-select">
        <option value="updated">Recently Updated</option>
        <option value="stars">Most Stars</option>
        <option value="name">Name (A-Z)</option>
      </select>
    </div>

    <!-- Visualizations -->
    <ClientOnly>
      <div class="relative z-10">
        <!-- Force Layout -->
        <GithubForceLayout v-if="viewMode === 'force'" :repos="repos" />

        <!-- Ridgeline Plot -->
        <GitHubRidgeline v-if="viewMode === 'ridgeline'" :repos="repos" />

        <!-- Histogram Grid -->
        <GitHubHistogramGrid v-if="viewMode === 'grid'" :repos="repos" />

        <!-- Parallel Coordinates -->
        <GitHubParallelCoords v-if="viewMode === 'parallel'" :repos="repos" />

        <!-- Radial Timeline -->
        <GitHubRadialTimeline v-if="viewMode === 'radial'" :repos="repos" />
      </div>
    </ClientOnly>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="relative z-10">
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
          :repo="repo"
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
  </div>
</template>

<style scoped>
.view-toggle {
  @apply flex gap-2;
}

.toggle-btn {
  @apply px-4 py-2 text-sm font-mono;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply bg-white dark:bg-zinc-950;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply transition-all duration-150;
  @apply hover:bg-zinc-50 dark:hover:bg-zinc-900;
}

.toggle-btn.active {
  @apply bg-zinc-900 dark:bg-zinc-100;
  @apply text-white dark:text-zinc-900;
  @apply border-zinc-900 dark:border-zinc-100;
}

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
