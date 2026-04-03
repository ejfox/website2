<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8">
    <div class="max-w-4xl">
      <!-- Section A: Header -->
      <header class="mb-10">
        <h1 class="font-mono text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-2">
          Changelog
        </h1>
        <p class="font-serif text-zinc-500 dark:text-zinc-400 text-base italic">
          This site is a living thing. It grows, breaks, gets rebuilt, and occasionally surprises me.
        </p>
        <div
          v-if="commitData || manifestData"
          class="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-zinc-500 dark:text-zinc-500 tabular-nums"
        >
          <span v-if="commitData">
            {{ commitData.stats.totalCommits }}+ commits
          </span>
          <span>since 2013</span>
          <span v-if="manifestData">
            {{ manifestData.length }} posts
          </span>
          <span>{{ colophon.length }} releases</span>
        </div>
      </header>

      <!-- Section B: Curated Timeline -->
      <section class="mb-16">
        <div v-for="(entries, year) in groupedByYear" :key="year" class="mb-8">
          <h2 class="sticky-label-header">
            {{ year }}
          </h2>

          <div class="space-y-6 mt-2">
            <article
              v-for="entry in entries"
              :key="entry.version"
              class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                  v{{ entry.version }}
                </span>
                <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
                  {{ formatDate(entry.date) }}
                </span>
                <span
                  v-if="entry.era"
                  class="font-mono text-xs px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                >
                  {{ entry.era }}
                </span>
              </div>
              <h3 class="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1" style="font-family: Georgia, serif;">
                <NuxtLink
                  v-if="entry.link"
                  :to="entry.link"
                  class="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {{ entry.title }}
                </NuxtLink>
                <span v-else>{{ entry.title }}</span>
              </h3>
              <p class="font-serif text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm max-w-prose" style="font-family: Georgia, serif;">
                {{ entry.body }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  v-if="entry.stats"
                  class="font-mono text-xs text-zinc-500 dark:text-zinc-500 tabular-nums"
                >
                  {{ entry.stats.commits }} commits · {{ entry.stats.filesChanged }} files
                </span>
                <span
                  v-if="entry.tags && entry.tags.length"
                  class="font-mono text-xs text-zinc-400 dark:text-zinc-600"
                >
                  {{ entry.tags.join(', ') }}
                </span>
              </div>
              <div
                v-if="entry.stack && entry.stack.length"
                class="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-600"
              >
                {{ entry.stack.join(', ') }}
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Section C: Raw git log (collapsed) -->
      <section class="mb-12">
        <details>
          <summary class="font-mono text-xs text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors select-none">
            Raw git commits ({{ commitData?.stats.totalCommits || '...' }})
          </summary>

          <div v-if="commitData" class="mt-4">
            <!-- Stats -->
            <div class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div
                v-for="(count, type) in commitData.stats.byType"
                :key="type"
                class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-2"
              >
                <div class="text-zinc-900 dark:text-zinc-100 font-bold">
                  {{ count }}
                </div>
                <div class="text-muted">{{ type }}</div>
              </div>
            </div>

            <!-- Timeline -->
            <div
              v-for="(commits, date) in commitData.grouped.byDate"
              :key="date"
              class="mb-6"
            >
              <h3 class="sticky-label-header">
                {{ formatCommitDate(date) }}
              </h3>

              <div class="stack-2">
                <div v-for="commit in commits" :key="commit.hash" class="group">
                  <div class="flex items-baseline gap-2">
                    <span class="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                      {{ commit.hash }}
                    </span>
                    <span :class="['font-mono text-xs px-1', getTypeColor(commit.type)]">
                      {{ commit.type }}
                    </span>
                  </div>
                  <p class="font-serif text-sm mt-2">
                    {{ commit.message }}
                  </p>
                  <p class="font-mono text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                    {{ commit.author }} · {{ formatTime(commit.date) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Load More -->
            <div class="mt-8 text-center">
              <button v-if="canLoadMore" class="link-mono-hover font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" @click="loadMore">
                Load more commits
              </button>
            </div>
          </div>

          <div v-if="commitError" class="text-center py-8 text-red-600 dark:text-red-400">
            Failed to load git log
          </div>
        </details>
      </section>

      <!-- Footer -->
      <footer class="mt-12 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
          Source:
          <code>git log</code>
          +
          <code>colophon.json</code>
          ·
          <a
            href="/api/changelog"
            class="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            JSON
          </a>
          ·
          <NuxtLink
            to="/updates"
            class="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            What's New
          </NuxtLink>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import colophonData from '~/data/colophon.json'

interface ColophonEntry {
  version: string
  date: string
  title: string
  body: string
  stats?: { commits: number; filesChanged: number }
  tags?: string[]
  stack?: string[]
  link?: string
  era?: string
}

interface Commit {
  hash: string
  author: string
  email: string
  date: string
  message: string
  type: string
}

interface ChangelogResponse {
  meta: { endpoint: string; timestamp: string; count: number }
  commits: Commit[]
  grouped: {
    byDate: Record<string, Commit[]>
    byType: Record<string, Commit[]>
  }
  stats: {
    totalCommits: number
    dateRange: { earliest: string; latest: string }
    byType: Record<string, number>
  }
}

const colophon: ColophonEntry[] = colophonData as ColophonEntry[]

// Group colophon entries by year
const groupedByYear = computed(() => {
  const groups: Record<string, ColophonEntry[]> = {}
  for (const entry of colophon) {
    const year = extractYear(entry.date)
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(entry)
  }
  return groups
})

function extractYear(dateStr: string): string {
  if (/^\d{4}$/.test(dateStr)) return dateStr
  if (dateStr.includes('Q')) return dateStr.split('-')[0]
  return dateStr.split('-')[0]
}

function formatDate(dateStr: string) {
  if (/^\d{4}$/.test(dateStr)) return dateStr
  if (dateStr.includes('Q')) {
    const [year, quarter] = dateStr.split('-')
    return `${quarter} ${year}`
  }
  const [year, month] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number.parseInt(month) - 1]} ${year}`
}

// Fetch commit data and manifest in parallel
const limit = ref(50)
const { data: commitData, refresh, error: commitError } = await useFetch<ChangelogResponse>(
  '/api/changelog',
  { query: { limit } }
)

const { data: manifestData } = await useFetch<any[]>('/api/manifest')

const canLoadMore = computed(
  () => commitData.value && commitData.value.commits.length >= limit.value
)

function loadMore() {
  limit.value += 50
  refresh()
}

function formatCommitDate(dateString: string) {
  const d = new Date(dateString)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

function formatTime(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const typeColors: Record<string, string> = {
  feat: 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100',
  fix: 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100',
  docs: 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100',
  style: 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100',
  refactor: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100',
  test: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-100',
  chore: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
  remove: 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100',
}
const defaultTypeColor = 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'

function getTypeColor(type: string) {
  return typeColors[type] || defaultTypeColor
}

usePageSeo({
  title: 'Changelog · EJ Fox',
  description:
    'Curated changelog of ejfox.com: narrative release notes, stats, and the raw git log for the curious.',
  type: 'article',
  section: 'Meta',
  tags: ['Changelog', 'Site Updates', 'Releases', 'Colophon'],
  label1: 'Releases',
  data1: `${colophon.length} curated entries`,
})
</script>
