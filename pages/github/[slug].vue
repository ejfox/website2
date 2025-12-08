<script setup>
const { formatLongDate, formatRelativeTime } = useDateFormat()
const route = useRoute()
const slug = route.params.slug
const { tocTarget } = useTOC()

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
    .filter((r) => r.name !== repo.value.name) // Exclude current repo
    .filter((r) => !r.fork) // Exclude forks
    .map((r) => {
      // Calculate relevance score
      const topicMatches = (r.topics || []).filter((t) =>
        currentTopics.includes(t)
      ).length
      const languageMatch = r.language === currentLanguage ? 1 : 0
      return {
        ...r,
        relevance: topicMatches + languageMatch,
      }
    })
    .filter((r) => r.relevance > 0) // Must have at least one match
    .sort((a, b) => b.relevance - a.relevance) // Sort by relevance
    .slice(0, 5) // Top 5
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
  <div class="container-main">
    <article v-if="repo" class="pt-8 pb-8 space-y-8">
      <!-- Title + Description -->
      <header class="space-y-3">
        <h1
          class="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100"
        >
          {{ repo.name }}
        </h1>
        <p
          v-if="repo.description"
          class="text-sm text-zinc-600 dark:text-zinc-400 max-w-prose leading-relaxed"
        >
          {{ repo.description }}
        </p>
      </header>

      <!-- File size distribution (small multiple) -->
      <div v-if="repo.fileTree?.files" class="max-w-md">
        <div class="font-mono text-[9px] text-zinc-500 mb-2">File sizes</div>
        <FileSizeDistribution :files="repo.fileTree.files" :buckets="10" />
      </div>

      <!-- Related repos -->
      <div v-if="relatedRepos.length > 0" class="space-y-2">
        <div class="font-mono text-[9px] text-zinc-500 uppercase tracking-wide">
          Related repositories
        </div>
        <div class="space-y-0 border-l border-zinc-800 pl-3">
          <NuxtLink
            v-for="related in relatedRepos"
            :key="related.name"
            :to="`/github/${related.name}`"
            class="block font-mono text-xs text-zinc-400 hover:text-zinc-100 py-1"
          >
            {{ related.name }}
            <span class="text-zinc-600 text-[10px] ml-2">
              {{ related.language }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- README -->
      <div v-if="repo.readme?.html" class="pt-6 border-t border-zinc-800">
        <div
          class="prose prose-zinc dark:prose-invert prose-sm max-w-prose"
          v-html="repo.readme.html"
        ></div>
      </div>

      <!-- Navigation -->
      <div class="pt-6 border-t border-zinc-800">
        <NuxtLink
          to="/github"
          class="font-mono text-xs text-zinc-500 hover:text-zinc-100"
        >
          ← Repositories
        </NuxtLink>
      </div>
    </article>

    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="sidebar-container pt-8">
          <div class="sidebar-section">
            <div v-if="repo.language" class="sidebar-item">
              <div class="language-display">
                <span
                  class="language-indicator"
                  :style="{ backgroundColor: repo.languageColor }"
                ></span>
                <span class="sidebar-value text-[10px]">
                  {{ repo.language }}
                </span>
              </div>
            </div>

            <div class="sidebar-item">
              <RepoMetrics :repo="repo" compact />
            </div>

            <div
              v-if="repo.languages && Object.keys(repo.languages).length > 0"
              class="sidebar-item"
            >
              <LanguageBar
                :languages="repo.languages"
                :height="4"
                show-labels
              />
            </div>

            <div v-if="repo.topics?.length" class="sidebar-item">
              <div class="topics-display">
                <span
                  v-for="topic in repo.topics"
                  :key="topic"
                  class="tech-badge"
                >
                  {{ topic }}
                </span>
              </div>
            </div>

            <div class="sidebar-item">
              <time class="sidebar-time">
                {{ formatLongDate(repo.createdAt) }}
              </time>
            </div>

            <div class="sidebar-item">
              <time class="sidebar-time">
                {{ formatRelativeTime(repo.pushedAt) }}
              </time>
            </div>

            <div class="sidebar-links">
              <a :href="repo.url" target="_blank" class="github-link">
                View on GitHub ↗
              </a>
              <a
                v-if="repo.homepage"
                :href="repo.homepage"
                target="_blank"
                class="github-link"
              >
                Website ↗
              </a>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Prose content - README */
.prose {
  @apply leading-relaxed font-serif;
  line-height: 1.75rem; /* 28px = 3.5 * 8px */
}

.prose :where(p):not(:where([class~='not-prose'] *)) {
  margin-top: 16px;
  margin-bottom: 16px;
}

.prose :where(h2):not(:where([class~='not-prose'] *)) {
  font-size: 1.125rem;
  margin-top: 24px;
  margin-bottom: 8px;
  font-weight: 600;
}

.prose :where(h3):not(:where([class~='not-prose'] *)) {
  font-size: 1rem;
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.prose :where(h4):not(:where([class~='not-prose'] *)) {
  font-size: 0.875rem;
  margin-top: 16px;
  margin-bottom: 4px;
  font-weight: 600;
}

/* Sidebar - brutalist minimal */
.sidebar-container {
  @apply space-y-2;
}

.sidebar-section {
  @apply space-y-1 pb-3;
  @apply border-b border-zinc-800;
}

.sidebar-item {
  @apply text-[10px] font-mono;
}

.language-display {
  @apply flex items-center gap-0.5;
}

.sidebar-value {
  @apply text-zinc-100;
}

.topics-display {
  @apply flex flex-wrap gap-0.5;
}

.sidebar-time {
  @apply tabular-nums text-zinc-500;
}

.sidebar-links {
  @apply flex flex-col gap-0.5 pt-2;
}

.tech-badge {
  @apply font-mono text-[9px] text-zinc-500;
}

.tech-badge:not(:last-child)::after {
  content: ' · ';
  @apply text-zinc-600;
}

.github-link {
  @apply text-[10px] font-mono text-zinc-500;
  @apply hover:text-zinc-100;
}

.language-indicator {
  @apply inline-block w-1.5 h-1.5;
}
</style>
