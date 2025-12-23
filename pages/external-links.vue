<script setup>
// Fetch data first
const { data } = await useAsyncData('external-links', async () => {
  try {
    return await $fetch('/api/external-links')
  } catch (error) {
    console.error('Failed to fetch external links:', error)
    return { links: [], stats: null }
  }
})

const links = computed(() => data.value?.links || [])
const stats = computed(() => data.value?.stats || null)

// UI state
const search = ref('')
const selectedTld = ref('all')
const sortBy = ref('citations')
const expandedDomains = ref(new Set())
const showAllDomains = ref(false)

// Computed filtered links
const filteredLinks = computed(() => {
  return links.value.filter((link) => {
    if (!link?.url || !link?.domain) return false
    const matchesSearch =
      !search.value ||
      link.url.toLowerCase().includes(search.value.toLowerCase()) ||
      link.domain.toLowerCase().includes(search.value.toLowerCase())
    const matchesTld =
      selectedTld.value === 'all' || link.tld === selectedTld.value
    return matchesSearch && matchesTld
  })
})

// Group by domain with stats
const domainGroups = computed(() => {
  const groups = {}
  filteredLinks.value.forEach((link) => {
    if (!link?.domain) return
    if (!groups[link.domain]) {
      groups[link.domain] = { links: [], totalCitations: 0 }
    }
    groups[link.domain].links.push(link)
    groups[link.domain].totalCitations += link.sources?.length || 0
  })
  return groups
})

// Sorted domain list
const sortedDomains = computed(() => {
  const domains = Object.entries(domainGroups.value).map(([domain, data]) => ({
    domain,
    linkCount: data.links.length,
    totalCitations: data.totalCitations,
  }))

  if (sortBy.value === 'citations') {
    return domains.sort((a, b) => b.totalCitations - a.totalCitations)
  } else if (sortBy.value === 'links') {
    return domains.sort((a, b) => b.linkCount - a.linkCount)
  }
  return domains.sort((a, b) => a.domain.localeCompare(b.domain))
})

// Visible domains (limited unless showAll)
const visibleDomains = computed(() => {
  if (showAllDomains.value || search.value) {
    return sortedDomains.value
  }
  return sortedDomains.value.slice(0, 25)
})

const expandAll = () => {
  sortedDomains.value.forEach((d) => expandedDomains.value.add(d.domain))
  expandedDomains.value = new Set(expandedDomains.value)
}

const collapseAll = () => {
  expandedDomains.value = new Set()
}

// Quick jump to domain
const jumpToDomain = (domain) => {
  expandedDomains.value.add(domain)
  expandedDomains.value = new Set(expandedDomains.value)
  nextTick(() => {
    document
      .getElementById(`domain-${domain}`)
      ?.scrollIntoView({ behavior: 'smooth' })
  })
}

// Extract year from source path
const getYear = (source) => {
  const match = source?.match(/^(\d{4})\//)
  return match ? match[1] : null
}

// Calculate TLD bar height
const tldHeight = (count) => {
  const max = stats.value?.tldBreakdown?.[0]?.count || 1
  return `${Math.max(20, (count / max) * 60)}px`
}

// Simple toggle without animation
const toggleDomain = (domain) => {
  if (expandedDomains.value.has(domain)) {
    expandedDomains.value.delete(domain)
  } else {
    expandedDomains.value.add(domain)
  }
  expandedDomains.value = new Set(expandedDomains.value)
}

usePageSeo({
  title: 'External Links - Citation Index',
  description:
    'Outbound link archaeology: every external URL cited across ejfox.com, with citation counts and source tracking.',
  type: 'website',
  section: 'Meta',
  tags: ['External links', 'Citations', 'Link graph', 'Content archaeology'],
})
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 py-8">
    <header class="mb-12">
      <h1 class="text-4xl font-light mb-2">External Links</h1>
      <p class="text-zinc-600 dark:text-zinc-400">
        Citation index across {{ stats?.oldestSource?.split('/')[0] || '?' }}–{{
          stats?.newestSource?.split('/')[0] || 'present'
        }}
      </p>
    </header>

    <!-- Top Stats Dashboard -->
    <section v-if="stats" class="mb-12 grid grid-cols-3 gap-4">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalLinks }}</div>
        <div class="stat-label">Links</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalDomains }}</div>
        <div class="stat-label">Domains</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">
          {{
            Math.round(
              (stats.httpsCount / (stats.httpsCount + stats.httpCount)) * 100
            )
          }}%
        </div>
        <div class="stat-label">HTTPS</div>
      </div>
    </section>

    <!-- Top Domains -->
    <section v-if="stats?.topDomains?.length" class="mb-12">
      <h2 class="text-lg font-medium mb-4 text-zinc-700 dark:text-zinc-300">
        Top Domains
      </h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="d in stats.topDomains.slice(0, 10)"
          :key="d.domain"
          class="domain-chip"
          @click="jumpToDomain(d.domain)"
        >
          <span class="font-medium">{{ d.domain }}</span>
          <span class="text-zinc-500 ml-1">{{ d.linkCount }}</span>
        </button>
      </div>
    </section>

    <!-- TLD Breakdown -->
    <section v-if="stats?.tldBreakdown?.length" class="mb-12">
      <h2 class="text-lg font-medium mb-4 text-zinc-700 dark:text-zinc-300">
        TLD Distribution
      </h2>
      <div class="flex flex-wrap gap-3 items-end">
        <div
          v-for="t in stats.tldBreakdown.slice(0, 8)"
          :key="t.tld"
          class="tld-bar"
          :style="{ height: tldHeight(t.count) }"
          @click="selectedTld = selectedTld === t.tld ? 'all' : t.tld"
        >
          <div class="text-xs font-mono">.{{ t.tld }}</div>
          <div class="text-xs text-zinc-500">{{ t.count }}</div>
        </div>
      </div>
    </section>

    <!-- Filters & Controls -->
    <section class="filters-section">
      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clip-rule="evenodd"
          />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search URLs or domains..."
          class="search-input"
        />
        <button v-if="search" class="clear-btn" @click="search = ''">×</button>
      </div>
      <div class="controls-row">
        <select v-model="sortBy" class="select-input">
          <option value="citations">Most Cited</option>
          <option value="links">Most Links</option>
          <option value="alpha">A–Z</option>
        </select>
        <select v-model="selectedTld" class="select-input">
          <option value="all">All TLDs</option>
          <option v-for="t in stats?.tldBreakdown" :key="t.tld" :value="t.tld">
            .{{ t.tld }} ({{ t.count }})
          </option>
        </select>
        <div class="btn-group">
          <button class="btn-subtle" @click="expandAll">Expand</button>
          <button class="btn-subtle" @click="collapseAll">Collapse</button>
        </div>
      </div>
    </section>

    <!-- Results count -->
    <div class="results-count">
      <span class="results-number">{{ filteredLinks.length }}</span>
      links across
      <span class="results-number">{{ sortedDomains.length }}</span>
      domains
      <span v-if="search || selectedTld !== 'all'" class="filtered-badge">
        filtered
      </span>
    </div>

    <!-- Domain List -->
    <div class="space-y-2">
      <div
        v-for="d in visibleDomains"
        :id="`domain-${d.domain}`"
        :key="d.domain"
        class="domain-section"
      >
        <!-- Single link: show inline -->
        <template v-if="d.linkCount === 1">
          <div class="single-link-row">
            <span class="domain-name">{{ d.domain }}</span>
            <a
              :href="domainGroups[d.domain].links[0].url"
              target="_blank"
              rel="noopener"
              class="link-url"
            >
              {{
                (domainGroups[d.domain].links[0].url || '')
                  .replace(/^https?:\/\//, '')
                  .replace(d.domain, '') || '/'
              }}
              <span class="text-zinc-400">↗</span>
            </a>
            <div
              v-if="domainGroups[d.domain].links[0].sources?.length"
              class="link-sources"
            >
              <NuxtLink
                v-for="source in domainGroups[d.domain].links[0].sources.slice(
                  0,
                  3
                )"
                :key="source"
                :to="`/blog/${source}`"
                class="source-tag"
              >
                {{ getYear(source) ? `${getYear(source)}/` : ''
                }}{{ (source || '').split('/').pop() }}
              </NuxtLink>
            </div>
          </div>
        </template>

        <!-- Multiple links: collapsible -->
        <template v-else>
          <button class="domain-header" @click="toggleDomain(d.domain)">
            <span class="expand-icon">
              {{ expandedDomains.has(d.domain) ? '−' : '+' }}
            </span>
            <span class="domain-name">{{ d.domain }}</span>
            <span class="domain-stats">{{ d.linkCount }}</span>
          </button>

          <div v-if="expandedDomains.has(d.domain)" class="domain-links">
            <div
              v-for="link in domainGroups[d.domain].links"
              :key="link.url"
              class="link-row"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="link-url"
              >
                {{
                  (link.url || '')
                    .replace(/^https?:\/\//, '')
                    .replace(d.domain, '') || '/'
                }}
                <span class="text-zinc-400">↗</span>
              </a>
              <div v-if="link.sources?.length" class="link-sources">
                <NuxtLink
                  v-for="source in link.sources.slice(0, 3)"
                  :key="source"
                  :to="`/blog/${source}`"
                  class="source-tag"
                >
                  {{ getYear(source) ? `${getYear(source)}/` : ''
                  }}{{ (source || '').split('/').pop() }}
                </NuxtLink>
                <span
                  v-if="link.sources.length > 3"
                  class="text-xs text-zinc-500"
                >
                  +{{ link.sources.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Show more -->
    <div
      v-if="!showAllDomains && !search && sortedDomains.length > 25"
      class="mt-8 text-center"
    >
      <button class="btn-ghost" @click="showAllDomains = true">
        Show all {{ sortedDomains.length }} domains
      </button>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  @apply py-2;
}

.stat-value {
  @apply text-4xl font-light text-zinc-900 dark:text-zinc-100;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  @apply text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500;
}

.domain-chip {
  @apply text-sm cursor-pointer;
  @apply text-zinc-700 dark:text-zinc-300;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  @apply underline decoration-zinc-300 dark:decoration-zinc-600;
  @apply hover:decoration-zinc-500 dark:hover:decoration-zinc-400;
  transition: all 0.15s ease;
}

.tld-bar {
  @apply px-2 py-1 cursor-pointer flex flex-col justify-end items-center;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  min-width: 40px;
  transition: all 0.15s ease;
}

.domain-section {
  @apply border-b border-zinc-100 dark:border-zinc-800;
}

.single-link-row {
  @apply flex items-center gap-3 py-2 flex-wrap;
}

.domain-header {
  @apply w-full flex items-center gap-3 py-2 text-left;
  transition: color 0.15s ease;
}

.expand-icon {
  @apply w-4 h-4 flex items-center justify-center;
  @apply text-zinc-400 font-mono text-sm;
}

.domain-header:hover .expand-icon {
  @apply text-zinc-600 dark:text-zinc-300;
}

.domain-name {
  @apply font-medium text-zinc-900 dark:text-zinc-100;
}

.domain-stats {
  @apply ml-auto text-sm text-zinc-600 dark:text-zinc-400;
  font-variant-numeric: tabular-nums;
}

.domain-links {
  @apply pl-6 pb-2;
}

.link-row {
  @apply py-1 flex flex-wrap items-center gap-2;
}

.link-url {
  @apply text-sm font-mono;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  @apply truncate max-w-md;
}

.link-sources {
  @apply flex flex-wrap gap-2 ml-auto;
}

.source-tag {
  @apply text-xs;
  @apply text-zinc-500 dark:text-zinc-500;
  @apply hover:text-zinc-700 dark:hover:text-zinc-300;
}

/* Filters Section */
.filters-section {
  @apply mb-8 space-y-3;
}

.search-wrapper {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4;
  @apply text-zinc-400 pointer-events-none;
}

.search-input {
  @apply w-full pl-10 pr-8 py-2;
  @apply bg-transparent;
  @apply border-b border-zinc-200 dark:border-zinc-700;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply placeholder-zinc-400 dark:placeholder-zinc-500;
  @apply focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500;
}

.clear-btn {
  @apply absolute right-2 top-1/2 -translate-y-1/2;
  @apply text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300;
  @apply text-sm;
}

.controls-row {
  @apply flex flex-wrap gap-4 items-center;
}

.select-input {
  @apply py-1 pr-2;
  @apply bg-transparent;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply text-sm;
  @apply focus:outline-none;
  @apply cursor-pointer;
}

.btn-group {
  @apply flex gap-3;
}

.btn-subtle {
  @apply text-sm;
  @apply text-zinc-500 dark:text-zinc-500;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
}

.results-count {
  @apply mb-4 text-sm text-zinc-500 dark:text-zinc-500;
}

.results-number {
  @apply text-zinc-700 dark:text-zinc-300;
}

.filtered-badge {
  @apply ml-1 text-xs text-zinc-400;
}

.btn-ghost {
  @apply text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100;
}
</style>
