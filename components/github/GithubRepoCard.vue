<!--
  @file GithubRepoCard.vue
  @description GitHub repository card with title, description, language bar, and stats
  @props name: string - Repository name
  @props description: string - Repository description (optional)
  @props language: string - Primary language (default: 'Unknown')
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
        <svg
          v-if="hasNetwork"
          class="network-glyph"
          viewBox="0 0 12 12"
          aria-label="Function-call graph available"
        >
          <title>Function-call graph available</title>
          <circle cx="2.5" cy="2.5" r="1.4" />
          <circle cx="9.5" cy="3" r="1.4" />
          <circle cx="6" cy="9" r="1.4" />
          <line x1="2.5" y1="2.5" x2="9.5" y2="3" stroke-width="0.7" />
          <line x1="2.5" y1="2.5" x2="6" y2="9" stroke-width="0.7" />
          <line x1="9.5" y1="3" x2="6" y2="9" stroke-width="0.7" />
        </svg>
      </div>

      <!-- Description -->
      <p v-if="description" class="repo-description">
        {{ description }}
      </p>

      <!-- Language bar - Tuftian micro-viz -->
      <GithubLanguageBar
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
  stars?: number
  forks?: number
  hasNetwork?: boolean
  repo?: Repo
}

withDefaults(defineProps<Props>(), {
  description: '',
  language: 'Unknown',
  stars: 0,
  forks: 0,
  hasNetwork: false,
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

.network-glyph {
  @apply w-3 h-3 text-zinc-400 dark:text-zinc-500;
  fill: currentColor;
  stroke: currentColor;
  stroke-opacity: 0.6;
}

.repo-card:hover .network-glyph {
  @apply text-zinc-900 dark:text-zinc-100;
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
