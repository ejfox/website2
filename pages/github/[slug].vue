<script setup>
import { useLanguageColors } from '~/composables/useLanguageColors'

const { formatLongDate, formatRelativeTime, formatShortDate } = useDateFormat()
const route = useRoute()
const slug = route.params.slug

const { getColor: getLanguageColor } = useLanguageColors()

// Conventional-commit palette — deliberately curated, not the language ramp
const TYPE_COLORS = {
  feat: '#22c55e', // green
  fix: '#ef4444', // red
  refactor: '#8b5cf6', // purple
  docs: '#3b82f6', // blue
  chore: '#a1a1aa', // zinc
  style: '#ec4899', // pink
  test: '#14b8a6', // teal
  build: '#f59e0b', // amber
  ci: '#06b6d4', // cyan
  perf: '#84cc16', // lime
  revert: '#dc2626', // dark red
  other: '#71717a', // mid-zinc
}
const typeColor = (type) => TYPE_COLORS[type] || TYPE_COLORS.other

const truncateMessage = (msg, max = 96) => {
  if (!msg) return ''
  const firstLine = msg.split('\n')[0]
  return firstLine.length > max ? firstLine.slice(0, max - 1) + '…' : firstLine
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    units.length - 1
  )
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const formatCount = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n ?? 0)
}

// Fetch repository data - await is needed for SSR
const { data: repo, error } = await useAsyncData(`repo-${slug}`, async () => {
  const response = await $fetch(`/api/repos/${slug}`)
  return response
})

// Fetch all repos for related repos feature
const { data: allReposData } = await useFetch('/api/github-repos-list')
const allRepos = computed(() => allReposData.value || [])

// Related repos: same topics/language, excluding current repo
const relatedRepos = computed(() => {
  if (!repo.value) return []

  const currentTopics = repo.value.topics || []
  const currentLanguage = repo.value.language

  return allRepos.value
    .filter((r) => r.name !== repo.value.name)
    .filter((r) => !r.fork)
    .map((r) => {
      const topicMatches = (r.topics || []).filter((t) =>
        currentTopics.includes(t)
      ).length
      const languageMatch = r.language === currentLanguage ? 1 : 0
      return { ...r, relevance: topicMatches + languageMatch }
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8)
})

const maxWeekCount = computed(() => {
  const weeks = repo.value?.commits?.byWeek || []
  return Math.max(...weeks.map((w) => w.count), 1)
})

const barHeight = (count) => {
  if (count === 0) return 2
  return Math.max(2, (count / maxWeekCount.value) * 36)
}

const weekTooltip = (week) =>
  `Week of ${formatShortDate(week.weekStart)}: ${week.count} commits`

const conventionalRatioLabel = computed(() => {
  const types = repo.value?.commits?.byType || []
  const total = repo.value?.commits?.totalCommits || 0
  if (!total) return ''
  const conventional = types
    .filter((t) => t.type !== 'other')
    .reduce((sum, t) => sum + t.count, 0)
  const pct = Math.round((conventional / total) * 100)
  return `${pct}% conventional`
})

// If error, show 404
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Repository not found',
    fatal: true,
  })
}

// SEO metadata
const title = computed(() => repo.value?.name || 'Repository')
const description = computed(
  () =>
    repo.value?.description ||
    repo.value?.readme?.excerpt ||
    'GitHub repository'
)

const repoLanguage = computed(() => repo.value?.language || 'Code')
const repoTags = computed(() => {
  const topics = repo.value?.topics || []
  return topics.length ? topics : [repoLanguage.value]
})

usePageSeo({
  title: computed(() => `${title.value} - EJ Fox`),
  description: computed(() => description.value),
  type: 'article',
  section: 'Code',
  tags: repoTags,
  label1: 'Stars',
  data1: computed(() => `${repo.value?.stats?.stars || 0} stars`),
  label2: 'Language',
  data2: repoLanguage,
})

const repoSchema = computed(() => {
  if (!repo.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: repo.value.name,
    description: description.value,
    programmingLanguage: repoLanguage.value,
    codeRepository: repo.value.html_url || repo.value.url,
    url: `https://ejfox.com/github/${slug}`,
    author: {
      '@type': 'Person',
      name: 'EJ Fox',
      url: 'https://github.com/ejfox',
    },
    about: repoTags.value.map((tag) => ({ '@type': 'Thing', name: tag })),
    license: repo.value.license?.name,
  }
})

useHead(() => ({
  script: repoSchema.value
    ? [
        {
          type: 'application/ld+json',
          children: JSON.stringify(repoSchema.value),
        },
      ]
    : [],
}))
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16">
    <article v-if="repo" class="pt-6 pb-12 space-y-6">
      <!-- Header strip: title + description + dense meta -->
      <header
        class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
      >
        <div class="space-y-1">
          <div
            class="flex items-center gap-1 font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            <span
              v-if="repo.language"
              class="inline-block w-1 h-1"
              :style="{ backgroundColor: getLanguageColor(repo.language) }"
            ></span>
            <span>{{ repo.language }}</span>
          </div>
          <h1
            class="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {{ repo.name }}
          </h1>
          <p
            v-if="repo.description"
            class="font-serif text-sm leading-6 text-zinc-600 dark:text-zinc-400 max-w-prose"
          >
            {{ repo.description }}
          </p>
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs">
          <a
            :href="repo.url"
            target="_blank"
            class="text-zinc-900 dark:text-zinc-100 underline underline-offset-2"
          >
            View on GitHub ↗
          </a>
          <a
            v-if="repo.homepage"
            :href="repo.homepage"
            target="_blank"
            class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Website ↗
          </a>
          <NuxtLink
            to="/github"
            class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            All repos ←
          </NuxtLink>
        </div>
      </header>

      <!-- Stats ticker — dense, full-width -->
      <dl class="stats-ticker">
        <div v-if="repo.commits?.totalCommits" class="stat">
          <dt>Commits</dt>
          <dd>{{ formatCount(repo.commits.totalCommits) }}</dd>
        </div>
        <div v-if="repo.fileTree?.totalFiles" class="stat">
          <dt>Files</dt>
          <dd>{{ formatCount(repo.fileTree.totalFiles) }}</dd>
        </div>
        <div v-if="repo.fileTree?.totalSize" class="stat">
          <dt>Size</dt>
          <dd>{{ formatBytes(repo.fileTree.totalSize) }}</dd>
        </div>
        <div v-if="repo.languages" class="stat">
          <dt>Langs</dt>
          <dd>{{ Object.keys(repo.languages).length }}</dd>
        </div>
        <div v-if="repo.stats?.stars" class="stat">
          <dt>Stars</dt>
          <dd>{{ formatCount(repo.stats.stars) }}</dd>
        </div>
        <div v-if="repo.stats?.forks" class="stat">
          <dt>Forks</dt>
          <dd>{{ formatCount(repo.stats.forks) }}</dd>
        </div>
        <div v-if="repo.stats?.openIssues" class="stat">
          <dt>Issues</dt>
          <dd>{{ formatCount(repo.stats.openIssues) }}</dd>
        </div>
        <div class="stat">
          <dt>Created</dt>
          <dd>{{ formatShortDate(repo.createdAt) }}</dd>
        </div>
        <div class="stat">
          <dt>Last push</dt>
          <dd>{{ formatRelativeTime(repo.pushedAt) }}</dd>
        </div>
        <div v-if="repo.license?.spdxId" class="stat">
          <dt>License</dt>
          <dd>{{ repo.license.spdxId }}</dd>
        </div>
        <div v-if="repo.defaultBranch" class="stat">
          <dt>Branch</dt>
          <dd>{{ repo.defaultBranch }}</dd>
        </div>
        <div v-if="repo.latestRelease?.tagName" class="stat">
          <dt>Release</dt>
          <dd>
            <a :href="repo.latestRelease.url" target="_blank" rel="noopener">
              {{ repo.latestRelease.tagName }}
            </a>
          </dd>
        </div>
      </dl>

      <!-- Two-column body: README left, data rail right -->
      <div class="repo-body">
        <!-- README — primary content -->
        <section v-if="repo.readme?.html" class="readme-col">
          <div
            class="mb-1 font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            README.md
          </div>
          <div
            class="prose prose-zinc dark:prose-invert prose-sm"
            v-html="repo.readme.html"
          ></div>
        </section>
        <section v-else class="readme-col">
          <div
            class="mb-1 font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            README.md
          </div>
          <p class="font-mono text-xs text-zinc-500">No README available.</p>
        </section>

        <!-- Data rail -->
        <aside class="data-rail">
          <!-- Commit activity sparkline -->
          <section
            v-if="repo.commits?.byWeek?.some((w) => w.count > 0)"
            class="rail-section"
          >
            <div class="rail-header">
              <span class="rail-label">Commit activity</span>
              <span class="rail-meta">52 wk</span>
            </div>
            <div class="activity-bars">
              <div
                v-for="(week, i) in repo.commits.byWeek"
                :key="i"
                class="activity-bar"
                :style="{
                  height: barHeight(week.count) + 'px',
                  opacity: week.count === 0 ? 0.2 : 1,
                }"
                :title="weekTooltip(week)"
              />
            </div>
          </section>

          <!-- Languages -->
          <section
            v-if="repo.languages && Object.keys(repo.languages).length > 0"
            class="rail-section"
          >
            <div class="rail-header">
              <span class="rail-label">Languages</span>
              <span class="rail-meta">
                {{ Object.keys(repo.languages).length }}
              </span>
            </div>
            <GithubLanguageBar
              :languages="repo.languages"
              :height="4"
              show-labels
            />
          </section>

          <!-- Conventional commit type breakdown — Feltron-style -->
          <section v-if="repo.commits?.byType?.length" class="rail-section">
            <div class="rail-header">
              <span class="rail-label">Commit types</span>
              <span class="rail-meta">
                {{ conventionalRatioLabel }}
              </span>
            </div>
            <!-- Stacked bar -->
            <div
              class="flex w-full h-1 overflow-hidden bg-raised"
            >
              <div
                v-for="t in repo.commits.byType"
                :key="`bar-${t.type}`"
                :style="{
                  width: (t.count / repo.commits.totalCommits) * 100 + '%',
                  backgroundColor: typeColor(t.type),
                }"
                :title="`${t.type}: ${t.count}`"
              />
            </div>
            <!-- Two-column dense list -->
            <dl class="commit-types-grid">
              <div
                v-for="t in repo.commits.byType"
                :key="`row-${t.type}`"
                class="ctype-row"
              >
                <span
                  class="ctype-dot"
                  :style="{ backgroundColor: typeColor(t.type) }"
                ></span>
                <dt class="ctype-name">{{ t.type }}</dt>
                <dd class="ctype-count">{{ t.count }}</dd>
                <dd class="ctype-pct">
                  {{
                    ((t.count / repo.commits.totalCommits) * 100).toFixed(0)
                  }}%
                </dd>
              </div>
            </dl>
          </section>

          <!-- Topics -->
          <section v-if="repo.topics?.length" class="rail-section">
            <div class="rail-header">
              <span class="rail-label">Topics</span>
              <span class="rail-meta">{{ repo.topics.length }}</span>
            </div>
            <div class="topics-display">
              <span v-for="topic in repo.topics" :key="topic" class="topic-tag">
                {{ topic }}
              </span>
            </div>
          </section>

          <!-- Recent commits -->
          <section v-if="repo.commits?.recent?.length" class="rail-section">
            <div class="rail-header">
              <span class="rail-label">Recent commits</span>
              <span class="rail-meta">
                {{ repo.commits.recent.length }}/{{
                  formatCount(repo.commits.totalCommits)
                }}
              </span>
            </div>
            <ol class="commits-list">
              <li
                v-for="commit in repo.commits.recent"
                :key="commit.sha"
                class="commit-row"
              >
                <a
                  :href="commit.url"
                  target="_blank"
                  rel="noopener"
                  class="commit-sha"
                >
                  {{ commit.sha.slice(0, 7) }}
                </a>
                <span class="commit-message">
                  {{ truncateMessage(commit.message) }}
                </span>
                <time
                  class="commit-date"
                  :title="formatLongDate(commit.date)"
                  :datetime="commit.date"
                >
                  {{ formatRelativeTime(commit.date) }}
                </time>
              </li>
            </ol>
          </section>

          <!-- Related repos -->
          <section v-if="relatedRepos.length > 0" class="rail-section">
            <div class="rail-header">
              <span class="rail-label">Related</span>
              <span class="rail-meta">{{ relatedRepos.length }}</span>
            </div>
            <ul class="related-list">
              <li
                v-for="related in relatedRepos"
                :key="related.name"
                class="related-row"
              >
                <NuxtLink :to="`/github/${related.name}`" class="related-link">
                  {{ related.name }}
                </NuxtLink>
                <span class="related-language">{{ related.language }}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <!-- Code network — full-width centerpiece -->
      <section v-if="repo.network?.nodes?.length" class="pt-4 space-y-2">
        <ClientOnly>
          <GithubCodeNetwork
            :nodes="repo.network.nodes"
            :edges="repo.network.edges"
          />
        </ClientOnly>
      </section>
    </article>
  </div>
</template>

<style scoped>
/* Stats ticker — dense, full-width band */
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

.stats-ticker dd a {
  @apply text-zinc-900 dark:text-zinc-100 hover:underline;
}

/* Two-column body */
.repo-body {
  @apply grid gap-6 lg:gap-8;
  grid-template-columns: 1fr;
}

@media (min-width: theme('screens.lg')) {
  .repo-body {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }
}

@media (min-width: theme('screens.xl')) {
  .repo-body {
    grid-template-columns: minmax(0, 1fr) 22rem;
  }
}

.readme-col {
  @apply min-w-0;
}

.readme-col .prose {
  max-width: 72ch;
}

.data-rail {
  @apply space-y-4 min-w-0;
}

@media (min-width: theme('screens.lg')) {
  .data-rail {
    @apply sticky top-3 self-start overflow-y-auto;
    max-height: calc(100vh - theme('spacing.3'));
    scrollbar-width: thin;
  }
}

.rail-section {
  @apply space-y-1;
}

.rail-header {
  @apply flex items-baseline justify-between;
}

.rail-label {
  @apply font-mono text-3xs uppercase tracking-wider text-zinc-500;
}

.rail-meta {
  @apply font-mono text-3xs tabular-nums text-zinc-500;
}

/* Activity sparkline */
.activity-bars {
  @apply flex items-end gap-px h-4;
}

.activity-bar {
  @apply flex-1 bg-zinc-900 dark:bg-zinc-100;
  min-width: 2px;
}

.topics-display {
  @apply flex flex-wrap gap-x-1 gap-y-0.5;
}

/* Conventional-commit breakdown — Feltron-style dense list */
.commit-types-grid {
  @apply mt-1 grid font-mono;
  grid-template-columns: auto 1fr auto auto;
  @apply gap-x-2 gap-y-0;
}

.ctype-row {
  @apply contents;
}

.ctype-dot {
  @apply self-center w-1 h-1;
}

.ctype-name {
  @apply text-2xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300;
}

.ctype-count {
  @apply text-2xs tabular-nums text-zinc-900 dark:text-zinc-100 text-right;
}

.ctype-pct {
  @apply text-3xs tabular-nums text-zinc-500 text-right;
  min-width: 3ch;
}

.topic-tag {
  @apply font-mono text-3xs text-zinc-500;
}

.topic-tag:not(:last-child)::after {
  content: ' ·';
  @apply text-zinc-700;
}

/* Recent commits list */
.commits-list {
  @apply border-l border-zinc-200 dark:border-zinc-800;
}

.commit-row {
  @apply flex items-baseline gap-1 pl-1 py-0.5 font-mono text-3xs;
}

.commit-sha {
  @apply tabular-nums text-zinc-500;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  flex: 0 0 7ch;
}

.commit-message {
  @apply text-zinc-800 dark:text-zinc-200 truncate;
  flex: 1 1 auto;
  min-width: 0;
}

.commit-date {
  @apply tabular-nums text-zinc-500 whitespace-nowrap;
}

/* Related list */
.related-list {
  @apply border-l border-zinc-200 dark:border-zinc-800;
}

.related-row {
  @apply flex items-baseline justify-between gap-1 pl-1 py-0.5;
  @apply font-mono text-2xs;
}

.related-link {
  @apply text-zinc-700 dark:text-zinc-300 hover:underline truncate min-w-0;
}

.related-language {
  @apply text-3xs text-zinc-500 tabular-nums whitespace-nowrap;
}

/* README prose */
.prose {
  @apply font-serif leading-relaxed;
}

.prose :where(p):not(:where([class~='not-prose'] *)) {
  @apply my-2;
}

.prose :where(h2):not(:where([class~='not-prose'] *)) {
  @apply text-lg font-semibold mt-4 mb-1;
}

.prose :where(h3):not(:where([class~='not-prose'] *)) {
  @apply text-base font-semibold mt-3 mb-1;
}

.prose :where(h4):not(:where([class~='not-prose'] *)) {
  @apply text-sm font-semibold mt-2 mb-0.5;
}
</style>
