<!--
  @file GistStats.vue
  @description GitHub Gist statistics
  @props stats: Object - Gist statistics from GitHub API
-->
<template>
  <div v-if="hasData" class="space-y-8 font-mono">
    <!-- Primary Stats -->
    <div class="text-center py-2">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="stats.totalGists"
          format="default"
          :duration="800"
          priority="primary"
        />
      </div>
      <div class="text-xs text-zinc-500 uppercase tracking-widest mt-2">
        CODE SNIPPETS
      </div>
      <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
        <AnimatedNumber
          :value="stats.totalFiles"
          format="default"
          :duration="400"
          priority="secondary"
        />
        FILES ·
        <AnimatedNumber
          :value="stats.averageFilesPerGist"
          format="decimal"
          :decimals="1"
          :duration="400"
          priority="tertiary"
        />
        AVG
      </div>
    </div>

    <!-- Language Distribution -->
    <div class="space-y-2">
      <StatsSectionHeader title="LANGUAGES" />
      <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
        <div
          v-for="lang in stats.topLanguages.slice(0, 6)"
          :key="lang.language"
          class="flex justify-between items-baseline"
        >
          <span class="text-zinc-700 dark:text-zinc-400">
            {{ lang.language }}
          </span>
          <span class="tabular-nums text-zinc-500 font-medium">
            <AnimatedNumber
              :value="lang.count"
              format="default"
              :duration="400"
              priority="tertiary"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Gists -->
    <div v-if="recentGists.length" class="space-y-2">
      <StatsSectionHeader title="RECENT GISTS" />
      <div class="space-y-2">
        <div
          v-for="gist in recentGists.slice(0, 5)"
          :key="gist.id"
          class="flex items-baseline justify-between text-xs"
        >
          <div class="flex items-baseline gap-2 min-w-0 flex-1">
            <a
              :href="gist.html_url"
              target="_blank"
              rel="noopener"
              class="text-xs transition-colors"
              :class="[
                'text-zinc-700 dark:text-zinc-300',
                'hover:text-black dark:hover:text-white',
              ]"
            >
              {{ getGistTitle(gist) }}
            </a>
            <span v-if="gist.languages?.length" class="text-zinc-500 text-xs">
              {{ gist.languages[0] }}
            </span>
          </div>
          <span class="text-zinc-500 flex-shrink-0 ml-2 tabular-nums text-xs">
            {{ formatDate(gist.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState v-else message="Gist data unavailable" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns/format'
import AnimatedNumber from '../AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'

interface GistStats {
  stats: {
    totalGists: number
    totalFiles: number
    totalSize: number
    averageFilesPerGist: number
    topLanguages: Array<{
      language: string
      count: number
    }>
    yearStats: Record<string, number>
  }
  recentGists: Array<{
    id: string
    description: string | null
    created_at: string
    files: number
    firstFileName?: string
    totalLines?: number
    languages: string[]
    html_url: string
  }>
  lastUpdated: string
  error?: string
}

const props = defineProps<{
  gistStats?: GistStats | null
}>()

const hasData = computed(() => {
  return !!props.gistStats?.stats && props.gistStats.stats.totalGists > 0
})

const stats = computed(
  () =>
    props.gistStats?.stats || {
      totalGists: 0,
      totalFiles: 0,
      totalSize: 0,
      averageFilesPerGist: 0,
      topLanguages: [],
      yearStats: {},
    }
)

const recentGists = computed(() => props.gistStats?.recentGists || [])

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM yyyy').toUpperCase()
}

const getGistTitle = (gist: GistStats['recentGists'][number]): string => {
  // If there's a description (and it's not 'No description'), use it
  if (
    gist.description &&
    gist.description.trim() &&
    gist.description !== 'No description'
  ) {
    return gist.description
  }

  // Otherwise, use the first filename if available
  if (gist.firstFileName) {
    return gist.firstFileName
  }

  // Fallback to ID if nothing else works
  return `gist:${gist.id.slice(0, 8)}`
}
</script>
