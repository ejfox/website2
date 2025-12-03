<script setup>
const { formatLongDate, formatRelativeDate } = useDateFormat()
const route = useRoute()
const slug = route.params.slug
const { tocTarget } = useTOC()

// Fetch repository data
const { data: repo, error } = await useAsyncData(`repo-${slug}`, async () => {
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
      <header class="mb-8">
        <h1 class="font-serif text-3xl mb-2">{{ repo.name }}</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mb-4">
          {{ repo.description }}
        </p>

        <!-- Stats Row -->
        <div
          class="flex items-center gap-4 text-sm font-mono text-zinc-500 dark:text-zinc-500"
        >
          <span class="flex items-center gap-1">
            <span>⭐</span>
            {{ repo.stats.stars }}
          </span>
          <span class="flex items-center gap-1">
            <span>🔀</span>
            {{ repo.stats.forks }}
          </span>
          <span
            v-if="repo.language"
            class="flex items-center gap-1"
          >
            <span
              class="inline-block w-3 h-3 rounded-full"
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
        <div class="space-y-6">
          <!-- Repository Info -->
          <div
            class="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800"
          >
            <h3 class="label-uppercase-mono text-xs mb-3">Repository</h3>

            <!-- Language -->
            <div v-if="repo.language" class="text-sm">
              <div class="metadata-label">Language</div>
              <div class="flex items-center gap-2">
                <span
                  class="inline-block w-3 h-3 rounded-full"
                  :style="{ backgroundColor: repo.languageColor }"
                ></span>
                <span class="text-zinc-900 dark:text-zinc-100">
                  {{ repo.language }}
                </span>
              </div>
            </div>

            <!-- Stats -->
            <div class="text-sm">
              <div class="metadata-label">Stats</div>
              <div class="flex gap-3 text-zinc-700 dark:text-zinc-300">
                <span>⭐ {{ repo.stats.stars }}</span>
                <span>🔀 {{ repo.stats.forks }}</span>
                <span>👁 {{ repo.stats.watchers }}</span>
              </div>
            </div>

            <!-- Topics -->
            <div v-if="repo.topics?.length" class="text-sm">
              <div class="metadata-label">Topics</div>
              <div class="flex flex-wrap gap-1">
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
            <div class="text-sm">
              <div class="metadata-label">Created</div>
              <time class="tabular-nums text-zinc-900 dark:text-zinc-100">
                {{ formatLongDate(repo.createdAt) }}
              </time>
            </div>

            <div class="text-sm">
              <div class="metadata-label">Last Updated</div>
              <time class="tabular-nums text-zinc-900 dark:text-zinc-100">
                {{ formatRelativeDate(repo.pushedAt) }}
              </time>
            </div>

            <!-- Links -->
            <div class="flex flex-col gap-2 pt-2">
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
