<script setup>
const { data: links } = await useAsyncData('external-links', () =>
  $fetch('/api/external-links')
)

const search = ref('')
const selectedTld = ref('all')

const filteredLinks = computed(() => {
  if (!links.value) return []
  
  return links.value.filter(link => {
    const matchesSearch = !search.value || 
      link.url.toLowerCase().includes(search.value.toLowerCase()) ||
      link.domain.toLowerCase().includes(search.value.toLowerCase())
    
    const matchesTld = selectedTld.value === 'all' || link.tld === selectedTld.value
    
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
    .sort(([,a], [,b]) => b - a)
    .map(([tld, count]) => ({ tld, count }))
})

const sortedDomains = computed(() => {
  if (!filteredLinks.value) return []
  
  const domainCounts = filteredLinks.value.reduce((counts, link) => {
    counts[link.domain] = (counts[link.domain] || 0) + 1
    return counts
  }, {})
  
  return Object.entries(domainCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([domain]) => domain)
})

useHead({
  title: 'External Links'
})
</script>

<template>
  <div>
    <header class="my-20 md:mt-6 pl-4 pr-4 md:pl-0">
      <h1 class="text-display mb-8">
        External Links
      </h1>
      <p class="text-body mb-8">
        {{ links?.length || 0 }} unique external links from across the site
      </p>
      
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          v-model="search"
          type="text"
          placeholder="Search URLs or domains..."
          class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
        
        <select
          v-model="selectedTld"
          class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="all">
            All TLDs ({{ links?.length || 0 }})
          </option>
          <option
            v-for="{ tld, count } in tlds"
            :key="tld"
            :value="tld"
          >
            .{{ tld }} ({{ count }})
          </option>
        </select>
      </div>
    </header>

    <div class="max-w-screen-xl pr-8">
      <!-- Stats bar -->
      <div class="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ filteredLinks.length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">
              Links
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ Object.keys(groupedByDomain).length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">
              Domains
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ new Set(filteredLinks.map(l => l.tld)).size }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">
              TLDs
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ filteredLinks.length }}
            </div>
            <div class="text-sm text-zinc-600 dark:text-zinc-400">
              Filtered
            </div>
          </div>
        </div>
      </div>

      <!-- Links table by TLD -->
      <div v-if="filteredLinks.length === 0" class="text-center py-16">
        <p class="text-zinc-600 dark:text-zinc-400">
          No links found matching your filters.
        </p>
      </div>

      <div v-else class="space-y-12">
        <section v-for="domain in sortedDomains" :key="domain">
          <h2 class="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            {{ domain }} 
            <span class="text-base font-normal text-zinc-600 dark:text-zinc-400">
              ({{ groupedByDomain[domain]?.length || 0 }} links)
            </span>
          </h2>
          
          <div class="overflow-x-auto">
            <table class="w-full border border-zinc-200 dark:border-zinc-700">
              <thead class="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    URL
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Source Pages
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                <tr 
                  v-for="link in groupedByDomain[domain]" 
                  :key="link.url"
                  class="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td class="px-4 py-3 text-sm">
                    <a 
                      :href="link.url" 
                      target="_blank" 
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 break-all"
                    >
                      {{ link.url }}
                      <span class="ml-1">↗</span>
                    </a>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div v-if="link.sources && link.sources.length > 0" class="space-y-1">
                      <div v-for="source in link.sources.slice(0, 5)" :key="source" class="text-xs">
                        <NuxtLink 
                          :to="`/blog/${source}`"
                          class="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 block"
                        >
                          {{ source.split('/').pop() || source }}
                        </NuxtLink>
                      </div>
                      <div v-if="link.sources.length > 5" class="text-xs text-zinc-500">
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