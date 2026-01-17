<script setup>
// Lazy load heavy visualization components (d3 + anime.js)
const GithubForceLayout = defineAsyncComponent(
  () => import('~/components/github/GithubForceLayout.client.vue')
)
const GitHubRidgeline = defineAsyncComponent(
  () => import('~/components/github/GitHubRidgeline.client.vue')
)
const GitHubHistogramGrid = defineAsyncComponent(
  () => import('~/components/github/GitHubHistogramGrid.client.vue')
)
const GitHubParallelCoords = defineAsyncComponent(
  () => import('~/components/github/GitHubParallelCoords.client.vue')
)
const GitHubRadialTimeline = defineAsyncComponent(
  () => import('~/components/github/GitHubRadialTimeline.client.vue')
)

// Load lightweight repos list (without README HTML for performance)
const { data: reposData } = await useFetch('/api/github-repos-list')
const repos = computed(() => reposData.value || [])

// Filter and sort state
const searchQuery = ref('')
const selectedLanguage = ref('all')
const sortBy = ref('updated') // updated, stars, name

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
  repos.value.reduce((sum, r) => sum + r.stats.stars, 0)
)
const totalForks = computed(() =>
  repos.value.reduce((sum, r) => sum + r.stats.forks, 0)
)
const lastUpdated = computed(() => {
  const dates = repos.value
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
  data1: `${repos.value.length} public`,
  label2: 'Stars',
  data2: computed(
    () => `${totalStars.value} stars · ${totalForks.value} forks`
  ),
})
</script>

<template>
  <div>
    <!-- Header & Filters - Padded content -->
    <div class="container-main pt-8">
      <header class="mb-6">
        <h1
          class="font-serif text-4xl md:text-5xl mb-4 text-zinc-900 dark:text-zinc-100"
        >
          GitHub
        </h1>
        <div class="stats-grid mb-6">
          <div class="stat-card">
            <div class="stat-value">{{ repos.length }}</div>
            <div class="stat-label">REPOSITORIES</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">{{ totalStars }}</div>
            <div class="stat-label">STARS</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">{{ totalForks }}</div>
            <div class="stat-label">FORKS</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">{{ languages.length - 1 }}</div>
            <div class="stat-label">LANGUAGES</div>
          </div>
        </div>

        <p class="text-zinc-500 dark:text-zinc-500 font-mono text-xs">
          Last updated: {{ lastUpdated }}
        </p>
      </header>
    </div>

    <ClientOnly>
      <div class="mb-12">
        <GithubForceLayout :repos="repos" />
      </div>

      <div class="mb-12">
        <GitHubRidgeline :repos="repos" />
      </div>

      <div class="mb-12">
        <GitHubHistogramGrid :repos="repos" />
      </div>

      <div class="mb-12">
        <GitHubParallelCoords :repos="repos" />
      </div>

      <div class="mb-12">
        <GitHubRadialTimeline :repos="repos" />
      </div>
    </ClientOnly>
    <div class="container-main">
      <div class="mb-12">
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
  </div>
</template>

<style scoped>
/* Tuftian minimalist stats - no borders */
.stats-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.stat-card {
  @apply text-center;
  /* 8px baseline rhythm */
  padding: 8px 0;
}

.stat-value {
  @apply font-mono text-2xl font-bold;
  @apply text-zinc-900 dark:text-zinc-100;
  /* 8px rhythm */
  line-height: 32px;
  margin-bottom: 4px;
}

.stat-label {
  @apply font-mono text-[10px] uppercase tracking-wider;
  @apply text-zinc-500 dark:text-zinc-500;
  /* 8px rhythm */
  line-height: 16px;
  letter-spacing: 0.1em;
}

/* Utilitarian filters - minimal */
.filter-input {
  @apply px-3 py-2 font-mono text-sm;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply bg-transparent;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply placeholder:text-zinc-400 dark:placeholder:text-zinc-600;
  @apply focus:outline-none;
  @apply focus:border-b-zinc-900 dark:focus:border-b-zinc-100;
  @apply transition-colors duration-150;
}

.filter-select {
  @apply px-3 py-2 font-mono text-sm;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply bg-transparent;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply focus:outline-none;
  @apply focus:border-b-zinc-900 dark:focus:border-b-zinc-100;
  @apply transition-colors duration-150;
}
</style>
