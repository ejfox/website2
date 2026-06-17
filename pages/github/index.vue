<script setup>
import { ref, computed } from 'vue'

const CommitHeatmap = defineAsyncComponent(
  () => import('~/components/github/CommitHeatmap.client.vue')
)

// Lightweight list + derived activity (year × week buckets)
const { data: reposData } = await useFetch('/api/github-repos-list')
const { data: activityData } = await useFetch('/api/github/activity')

const repos = computed(() => reposData.value || [])
const activity = computed(
  () =>
    activityData.value || {
      years: [],
      weeks: [],
      totalCommits: 0,
      totalRepos: 0,
    }
)

// Filter / sort state
const searchQuery = ref('')
const selectedLanguage = ref('all')
const selectedYear = ref(null)
const sortBy = ref('updated') // updated | stars | name | network

const languages = computed(() => {
  const langs = [...new Set(repos.value.map((r) => r.language).filter(Boolean))]
  return ['all', ...langs.sort()]
})

const filteredRepos = computed(() => {
  let filtered = repos.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.topics?.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (selectedLanguage.value !== 'all') {
    filtered = filtered.filter((r) => r.language === selectedLanguage.value)
  }

  if (selectedYear.value) {
    const y = selectedYear.value
    filtered = filtered.filter((r) => {
      const pushed = r.pushedAt ? new Date(r.pushedAt).getUTCFullYear() : null
      const created = r.createdAt
        ? new Date(r.createdAt).getUTCFullYear()
        : null
      // Show repos active in or older than the selected year
      return (
        (pushed !== null && pushed >= y && created !== null && created <= y) ||
        pushed === y ||
        created === y
      )
    })
  }

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'stars') return b.stats.stars - a.stats.stars
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'network')
      return Number(b.hasNetwork) - Number(a.hasNetwork)
    return new Date(b.pushedAt) - new Date(a.pushedAt)
  })
})

// Stats
const totalStars = computed(() =>
  repos.value.reduce((sum, r) => sum + r.stats.stars, 0)
)
const totalForks = computed(() =>
  repos.value.reduce((sum, r) => sum + r.stats.forks, 0)
)
const reposWithNetwork = computed(
  () => repos.value.filter((r) => r.hasNetwork).length
)

function onHeatmapSelect({ year }) {
  selectedYear.value = year
}

usePageSeo({
  title: 'GitHub repositories · EJ Fox',
  description:
    'Year-by-week commit heatmap and a dense listing of public GitHub repositories.',
  type: 'article',
  section: 'Code',
  tags: ['GitHub', 'Open source', 'Repositories'],
  label1: 'Repos',
  data1: computed(() => `${repos.value.length} public`),
  label2: 'Commits',
  data2: computed(
    () => `${activity.value.totalCommits.toLocaleString()} commits`
  ),
})
</script>

<template>
  <div
    class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-6 pb-12 space-y-8"
  >
    <!-- Title -->
    <header class="flex items-baseline justify-between">
      <h1
        class="font-serif text-3xl md:text-4xl text-zinc-900 dark:text-zinc-100"
      >
        GitHub
      </h1>
      <a
        href="https://github.com/ejfox"
        target="_blank"
        class="font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        @ejfox ↗
      </a>
    </header>

    <!-- Stats ticker (matches the [slug] page strip) -->
    <dl class="stats-ticker">
      <div class="stat">
        <dt>Repos</dt>
        <dd>{{ repos.length }}</dd>
      </div>
      <div class="stat">
        <dt>Commits</dt>
        <dd>{{ activity.totalCommits.toLocaleString() }}</dd>
      </div>
      <div class="stat">
        <dt>Stars</dt>
        <dd>{{ totalStars }}</dd>
      </div>
      <div class="stat">
        <dt>Forks</dt>
        <dd>{{ totalForks }}</dd>
      </div>
      <div class="stat">
        <dt>Languages</dt>
        <dd>{{ languages.length - 1 }}</dd>
      </div>
      <div class="stat">
        <dt>With graph</dt>
        <dd>{{ reposWithNetwork }}</dd>
      </div>
    </dl>

    <!-- Hero heatmap -->
    <ClientOnly>
      <CommitHeatmap
        :years="activity.years"
        :weeks="activity.weeks"
        :total-commits="activity.totalCommits"
        :total-repos="activity.totalRepos"
        @select="onHeatmapSelect"
      />
    </ClientOnly>

    <!-- Filter bar -->
    <div
      class="flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-xs"
    >
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search repos, topics, descriptions…"
        class="filter-input flex-1 min-w-[16rem]"
      />
      <select v-model="selectedLanguage" class="filter-select">
        <option v-for="l in languages" :key="l" :value="l">
          {{ l === 'all' ? 'All languages' : l }}
        </option>
      </select>
      <select v-model="sortBy" class="filter-select">
        <option value="updated">Sort: recently pushed</option>
        <option value="stars">Sort: stars</option>
        <option value="name">Sort: name</option>
        <option value="network">Sort: has graph</option>
      </select>
      <button
        v-if="selectedYear"
        type="button"
        class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2"
        @click="selectedYear = null"
      >
        clear {{ selectedYear }} filter
      </button>
      <span class="text-zinc-500 tabular-nums">
        {{ filteredRepos.length }} / {{ repos.length }}
      </span>
    </div>

    <!-- Listing -->
    <div class="space-y-0">
      <GithubRepoCard
        v-for="repo in filteredRepos"
        :key="repo.name"
        :name="repo.name"
        :description="repo.description"
        :language="repo.language"
        :stars="repo.stats.stars"
        :forks="repo.stats.forks"
        :has-network="repo.hasNetwork"
        :repo="repo"
      />
      <div
        v-if="filteredRepos.length === 0"
        class="py-12 text-center font-mono text-xs text-zinc-500"
      >
        No repositories match your filters.
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-ticker {
  @apply grid font-mono py-1;
  @apply border-t border-b border-zinc-200 dark:border-zinc-800;
  grid-template-columns: repeat(auto-fit, minmax(8ch, 1fr));
  @apply gap-x-2 gap-y-1;
}

.stats-ticker .stat {
  @apply flex flex-col min-w-0;
}

.stats-ticker dt {
  @apply text-3xs uppercase tracking-wider text-zinc-500;
}

.stats-ticker dd {
  @apply text-sm tabular-nums text-zinc-900 dark:text-zinc-100 truncate;
}

.filter-input {
  @apply px-2 py-1 bg-transparent;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply placeholder:text-zinc-400 dark:placeholder:text-zinc-600;
  @apply focus:outline-none focus:border-b-zinc-900;
  @apply dark:focus:border-b-zinc-100;
}

.filter-select {
  @apply px-2 py-1 bg-transparent;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply focus:outline-none focus:border-b-zinc-900;
  @apply dark:focus:border-b-zinc-100;
}
</style>
