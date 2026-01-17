<!--
  @file GithubRepoCard.vue
  @description GitHub repository card with title, description, language bar, and stats
  @props name: string - Repository name
  @props description: string - Repository description (optional)
  @props language: string - Primary language (default: 'Unknown')
  @props languageColor: string - Primary language color (optional)
  @props stars: number - Star count (default: 0)
  @props forks: number - Fork count (default: 0)
  @props repo: Repo - Full repository object with languages, stats (optional)
-->
<template>
  <NuxtLink :to="`/github/${name}`" class="repo-card group block">
    <article>
      <!-- Title and language inline -->
      <div class="title-row">
        <h3 class="repo-title">{{ name }}</h3>
        <span v-if="language" class="language-label">{{ language }}</span>
      </div>

      <!-- Description -->
      <p v-if="description" class="repo-description">
        {{ description }}
      </p>

      <!-- Language bar - Tuftian micro-viz -->
      <LanguageBar
        v-if="repo?.languages && Object.keys(repo.languages).length > 0"
        :languages="repo.languages"
        :height="3"
        class="language-bar"
      />

      <!-- Stats row - pure typography, no backgrounds -->
      <div class="repo-stats">
        <span v-if="stars > 0" class="stat">{{ stars }} stars</span>
        <span v-if="forks > 0" class="stat">{{ forks }} forks</span>
        <span v-if="repo?.stats.watchers > 0" class="stat">
          {{ repo.stats.watchers }} watching
        </span>
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
/* Magazine-style stacked list - pure typography, no backgrounds */
.repo-card {
  @apply py-4 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply transition-opacity duration-200;
}

.repo-card:hover {
  @apply opacity-70;
}

.repo-card:last-child {
  @apply border-b-0;
}

.title-row {
  @apply flex items-baseline gap-3 mb-2;
}

.repo-title {
  @apply font-serif text-2xl font-medium;
  @apply text-zinc-900 dark:text-zinc-100;
}

.language-label {
  @apply font-mono text-xs uppercase tracking-wider;
  @apply text-zinc-500 dark:text-zinc-500;
  letter-spacing: 0.1em;
}

.repo-description {
  @apply text-base text-zinc-700 dark:text-zinc-300;
  @apply line-clamp-2 leading-relaxed mb-4;
  @apply max-w-3xl;
}

.language-bar {
  @apply mb-4;
}

.repo-stats {
  @apply flex items-center gap-4 font-mono text-xs;
  @apply text-zinc-500 dark:text-zinc-500;
}

.stat {
  @apply tabular-nums;
}

/* Separator between stats */
.stat:not(:last-child)::after {
  content: '·';
  @apply ml-4 text-zinc-400 dark:text-zinc-600;
}
</style>
