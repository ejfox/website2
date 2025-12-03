<template>
  <NuxtLink :to="`/github/${name}`" class="repo-card group block">
    <article class="space-y-2">
      <!-- Title row with metrics -->
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="repo-title">{{ name }}</h3>
        <RepoMetrics v-if="repo" :repo="repo" compact class="flex-shrink-0" />
      </div>

      <!-- Language bar - Tuftian micro-viz -->
      <LanguageBar
        v-if="repo?.languages && Object.keys(repo.languages).length > 0"
        :languages="repo.languages"
        :height="3"
      />

      <!-- Description -->
      <p v-if="description" class="repo-description">
        {{ description }}
      </p>

      <!-- Stats row - minimal Feltron style -->
      <div class="repo-stats">
        <span v-if="stars > 0">⭐ {{ stars }}</span>
        <span v-if="forks > 0">🔀 {{ forks }}</span>
        <span v-if="language" class="language-tag">{{ language }}</span>
      </div>
    </article>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Repo {
  name: string
  description?: string
  language?: string
  languageColor?: string
  languages?: Record<string, number>
  diskUsage?: number
  stats: {
    stars: number
    forks: number
    watchers: number
    openIssues: number
  }
  pushedAt: string
}

interface Props {
  name: string
  description?: string
  language?: string
  languageColor?: string
  stars?: number
  forks?: number
  repo?: Repo
}

withDefaults(defineProps<Props>(), {
  description: '',
  language: 'Unknown',
  languageColor: '#666666',
  stars: 0,
  forks: 0,
  repo: undefined,
})
</script>

<style scoped>
.repo-card {
  @apply py-3 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.repo-title {
  @apply font-mono text-sm font-medium;
  @apply text-zinc-900 dark:text-zinc-100;
  @apply group-hover:text-zinc-600 dark:group-hover:text-zinc-400;
  @apply transition-colors duration-300;
}

.repo-description {
  @apply text-xs text-zinc-500 dark:text-zinc-400;
  @apply line-clamp-2;
}

.repo-stats {
  @apply flex items-center gap-3 text-xs font-mono;
  @apply text-zinc-400 dark:text-zinc-600;
}

.language-tag {
  @apply text-zinc-500 dark:text-zinc-500;
}
</style>
