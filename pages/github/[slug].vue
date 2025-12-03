<script setup>
const { formatLongDate, formatRelativeDate } = useDateFormat()
const route = useRoute()
const slug = route.params.slug
const { tocTarget } = useTOC()

// Fetch repository data
const { data: repo, error, pending } = await useAsyncData(`repo-${slug}`, async () => {
  try {
    const response = await $fetch(`/api/repos/${slug}`)
    return response
  } catch (error) {
    console.error('Error fetching repository:', error)
    throw error
  }
})

// If error, show 404
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Repository not found',
    fatal: true,
  })
}

// Loading state
const isLoading = computed(() => pending.value && !repo.value)

// SEO metadata
const title = computed(() => repo.value?.name || 'Repository')
const description = computed(() =>
  repo.value?.description || repo.value?.readme?.excerpt || 'GitHub repository'
)

useHead({
  title: `${title.value} - EJ Fox`,
  meta: [
    { name: 'description', content: description.value },
    { property: 'og:title', content: `${title.value} - EJ Fox` },
    { property: 'og:description', content: description.value },
    { property: 'og:type', content: 'website' },
  ],
})
</script>

<template>
  <div class="container-main" style="max-width: 65ch">
    <article v-if="repo" class="py-8 md:py-16">
      <!-- Header -->
      <header class="repo-header">
        <h1 class="repo-title">{{ repo.name }}</h1>
        <p class="repo-description">
          {{ repo.description }}
        </p>

        <!-- Stats Row -->
        <div class="repo-stats">
          <span class="repo-stat">
            <span>⭐</span>
            {{ repo.stats.stars }}
          </span>
          <span class="repo-stat">
            <span>🔀</span>
            {{ repo.stats.forks }}
          </span>
          <span v-if="repo.language" class="repo-stat">
            <span
              class="language-indicator"
              :style="{ backgroundColor: repo.languageColor }"
            ></span>
            {{ repo.language }}
          </span>
        </div>
      </header>

      <!-- README Content -->
      <div
        v-if="repo.readme?.html"
        class="prose prose-zinc dark:prose-invert max-w-none"
        v-html="repo.readme.html"
      ></div>

      <!-- Back link -->
      <div class="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <NuxtLink to="/github" class="interactive-link back-link">
          ← Back to Repositories
        </NuxtLink>
      </div>
    </article>

    <!-- Sidebar Metadata -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="sidebar-container">
          <!-- Repository Info -->
          <div class="sidebar-section">
            <h3 class="label-uppercase-mono text-xs mb-3">Repository</h3>

            <!-- Language -->
            <div v-if="repo.language" class="sidebar-item">
              <div class="metadata-label">Language</div>
              <div class="language-display">
                <span
                  class="language-indicator"
                  :style="{ backgroundColor: repo.languageColor }"
                ></span>
                <span class="sidebar-value">
                  {{ repo.language }}
                </span>
              </div>
            </div>

            <!-- Stats -->
            <div class="sidebar-item">
              <div class="metadata-label">Stats</div>
              <div class="stats-display">
                <span>⭐ {{ repo.stats.stars }}</span>
                <span>🔀 {{ repo.stats.forks }}</span>
                <span>👁 {{ repo.stats.watchers }}</span>
              </div>
            </div>

            <!-- Topics -->
            <div v-if="repo.topics?.length" class="sidebar-item">
              <div class="metadata-label">Topics</div>
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

            <!-- Dates -->
            <div class="sidebar-item">
              <div class="metadata-label">Created</div>
              <time class="sidebar-time">
                {{ formatLongDate(repo.createdAt) }}
              </time>
            </div>

            <div class="sidebar-item">
              <div class="metadata-label">Last Updated</div>
              <time class="sidebar-time">
                {{ formatRelativeDate(repo.pushedAt) }}
              </time>
            </div>

            <!-- Links -->
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
.repo-header {
  @apply mb-8;
}

.repo-title {
  @apply font-serif text-3xl mb-2;
}

.repo-description {
  @apply text-zinc-600 dark:text-zinc-400 mb-4;
}

.repo-stats {
  @apply flex items-center gap-4 text-sm font-mono;
  @apply text-zinc-500 dark:text-zinc-500;
}

.repo-stat {
  @apply flex items-center gap-1;
}

.language-indicator {
  @apply inline-block w-3 h-3 rounded-full;
}

.sidebar-container {
  @apply space-y-6;
}

.sidebar-section {
  @apply space-y-3 pb-6;
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.sidebar-item {
  @apply text-sm;
}

.language-display {
  @apply flex items-center gap-2;
}

.sidebar-value {
  @apply text-zinc-900 dark:text-zinc-100;
}

.stats-display {
  @apply flex gap-3 text-zinc-700 dark:text-zinc-300;
}

.topics-display {
  @apply flex flex-wrap gap-1;
}

.sidebar-time {
  @apply tabular-nums text-zinc-900 dark:text-zinc-100;
}

.sidebar-links {
  @apply flex flex-col gap-2 pt-2;
}

.back-link {
  @apply text-sm text-zinc-600 dark:text-zinc-400;
}

.metadata-label {
  @apply text-zinc-500 dark:text-zinc-500 text-xs uppercase tracking-wider mb-1;
}

.tech-badge {
  @apply font-mono text-xs px-2 py-1 rounded;
  @apply bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300;
}

.github-link {
  @apply text-sm text-zinc-900 dark:text-zinc-100;
  @apply hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors;
}
</style>
