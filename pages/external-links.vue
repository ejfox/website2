<script setup>
const { data: links } = await useAsyncData('external-links', async () => {
  try {
    return await $fetch('/api/external-links')
  } catch (error) {
    console.error('Failed to fetch external links:', error)
    return []
  }
})

const search = ref('')
const selectedTld = ref('all')

const totalLinks = computed(() => links.value?.length || 0)
const totalDomains = computed(() =>
  links.value
    ? Object.keys(
        links.value.reduce((acc, link) => {
          acc[link.domain] = true
          return acc
        }, {})
      ).length
    : 0
)

const filteredLinks = computed(() => {
  if (!links.value) return []

  return links.value.filter((link) => {
    const matchesSearch =
      !search.value ||
      link.url.toLowerCase().includes(search.value.toLowerCase()) ||
      link.domain.toLowerCase().includes(search.value.toLowerCase())

    const matchesTld =
      selectedTld.value === 'all' || link.tld === selectedTld.value

    return matchesSearch && matchesTld
  })
})

const groupedByDomain = computed(() => {
  if (!filteredLinks.value) return {}

  return filteredLinks.value.reduce((groups, link) => {
    if (!groups[link.domain]) {
      groups[link.domain] = []
    }
    groups[link.domain].push(link)
    return groups
  }, {})
})

const tlds = computed(() => {
  if (!links.value) return []

  const tldCounts = links.value.reduce((counts, link) => {
    counts[link.tld] = (counts[link.tld] || 0) + 1
    return counts
  }, {})

  return Object.entries(tldCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tld, count]) => ({ tld, count }))
})

const sortedDomains = computed(() => {
  if (!filteredLinks.value) return []

  const domainCounts = filteredLinks.value.reduce((counts, link) => {
    counts[link.domain] = (counts[link.domain] || 0) + 1
    return counts
  }, {})

  return Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([domain]) => domain)
})

// Table body styling
const tableBodyClass =
  'bg-white dark:bg-zinc-900 divide-y divide-zinc-200 ' + 'dark:divide-zinc-700'

usePageSeo({
  title: 'External links across ejfox.com',
  description:
    'Outbound link index for ejfox.com: every external URL cited in posts and projects, grouped by domain and TLD.',
  type: 'website',
  section: 'Meta',
  tags: ['External links', 'Outbound links', 'Domains', 'Citations'],
  label1: 'Links indexed',
  data1: computed(() => `${totalLinks.value} URLs`),
  label2: 'Domains covered',
  data2: computed(() => `${totalDomains.value} domains`),
})
</script>

<template>
  <div>
    <header class="pt-8 mb-8 pl-4 pr-4 md:pl-0">
      <h1 class="text-display mb-8">External Links</h1>
      <p class="text-body mb-8">
        {{ links?.length || 0 }} unique external links from across the site
      </p>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-8">
        <label for="search-links" class="sr-only">Search URLs or domains</label>
        <input
          id="search-links"
          v-model="search"
          type="text"
          placeholder="Search URLs or domains..."
          class="input-base"
        />

        <label for="filter-tld" class="sr-only">Filter by TLD</label>
        <select id="filter-tld" v-model="selectedTld" class="input-base">
          <option value="all">All TLDs ({{ links?.length || 0 }})</option>
          <option v-for="{ tld, count } in tlds" :key="tld" :value="tld">
            .{{ tld }} ({{ count }})
          </option>
        </select>
      </div>
    </header>

    <div class="max-w-screen-xl pr-8">
      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ filteredLinks.length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">Links</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ Object.keys(groupedByDomain).length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">Domains</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ new Set(filteredLinks.map((l) => l.tld)).size }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">TLDs</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ filteredLinks.length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">Filtered</div>
          </div>
        </div>
      </div>

      <!-- Links table by TLD -->
      <div v-if="filteredLinks.length === 0" class="text-center py-16">
        <p class="text-secondary">No links found matching your filters.</p>
      </div>

      <div v-else class="space-y-8">
        <section v-for="domain in sortedDomains" :key="domain">
          <h2 class="domain-header">
            {{ domain }}
            <span class="domain-count">
              ({{ groupedByDomain[domain]?.length || 0 }} links)
            </span>
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full border border-zinc-200 dark:border-zinc-700">
              <thead class="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th class="table-header-sm">URL</th>
                  <th class="table-header-sm">Source Pages</th>
                </tr>
              </thead>
              <tbody :class="tableBodyClass">
                <tr
                  v-for="link in groupedByDomain[domain]"
                  :key="link.url"
                  class="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td class="px-4 py-4 text-sm">
                    <a
                      :href="link.url"
                      target="_blank"
                      class="link-blue-simple"
                    >
                      {{ link.url }}
                      <span class="ml-1">↗</span>
                    </a>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    <div
                      v-if="link.sources && link.sources.length > 0"
                      class="stack-1"
                    >
                      <div
                        v-for="source in link.sources.slice(0, 5)"
                        :key="source"
                        class="text-xs"
                      >
                        <NuxtLink
                          :to="`/blog/${source}`"
                          class="link-secondary-block"
                        >
                          {{ source.split('/').pop() || source }}
                        </NuxtLink>
                      </div>
                      <div
                        v-if="link.sources.length > 5"
                        class="text-xs text-zinc-500"
                      >
                        +{{ link.sources.length - 5 }} more pages
                      </div>
                    </div>
                    <div v-else class="text-xs text-zinc-400">
                      No source data yet
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-bar {
  @apply mb-8 p-4 rounded;
  @apply bg-zinc-100 dark:bg-zinc-800;
}

.domain-header {
  @apply text-2xl font-light mb-8;
  @apply text-zinc-900 dark:text-zinc-100;
}

.domain-count {
  @apply text-base font-normal;
  @apply text-zinc-600 dark:text-zinc-400;
}
</style>
