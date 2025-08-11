<template>
  <div v-if="hasData" class="space-y-8 font-mono">
    <!-- Primary Metric -->
    <div class="individual-stat-large">
      <div class="stat-value">
        <AnimatedNumber :value="stats.totalGists" format="default" :duration="timing.slow" priority="primary" />
      </div>
      <div class="stat-label">
        CODE SNIPPETS
      </div>
      <div class="stat-details">
        <AnimatedNumber :value="stats.totalFiles" format="default" :duration="timing.normal" priority="secondary" /> FILES · 
        <AnimatedNumber :value="stats.averageFilesPerGist" format="decimal" :decimals="1" :duration="timing.normal" priority="tertiary" /> AVG
      </div>
    </div>

    <!-- Language Distribution - Tufte Style -->
    <div class="space-y-4">
      <div class="text-xs tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        LANGUAGES
      </div>
      <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div 
          v-for="lang in stats.topLanguages.slice(0, 6)"
          :key="lang.language"
          class="flex justify-between items-baseline"
        >
          <span class="text-zinc-700 dark:text-zinc-400">{{ lang.language }}</span>
          <span class="tabular-nums text-zinc-500 font-medium">
            <AnimatedNumber :value="lang.count" format="default" :duration="timing.normal" priority="tertiary" />
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Activity - Minimal -->
    <div v-if="recentGists.length" class="space-y-4">
      <div class="text-xs tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        RECENT
      </div>
      <div class="space-y-2">
        <div 
          v-for="gist in recentGists.slice(0, 3)"
          :key="gist.id"
          class="flex justify-between items-start text-xs gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="truncate text-zinc-700 dark:text-zinc-300">
              {{ gist.description || 'Untitled' }}
            </div>
            <div class="text-zinc-500 text-2xs">
              {{ formatDate(gist.created_at) }} · {{ gist.files }} file{{ gist.files !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-6">
    <div class="text-xl font-mono text-zinc-700 dark:text-zinc-500">
      NO GIST DATA
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import AnimatedNumber from '../AnimatedNumber.vue'
import { useAnimations } from '~/composables/useAnimations'

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
    description: string
    created_at: string
    files: number
    languages: string[]
    html_url: string
  }>
  lastUpdated: string
  error?: string
}

const props = defineProps<{
  gistStats?: GistStats | null
}>()

const { timing } = useAnimations()

const hasData = computed(() => {
  return !!props.gistStats?.stats && props.gistStats.stats.totalGists > 0
})

const stats = computed(() => props.gistStats?.stats || {
  totalGists: 0,
  totalFiles: 0,
  totalSize: 0,
  averageFilesPerGist: 0,
  topLanguages: [],
  yearStats: {}
})

const recentGists = computed(() => props.gistStats?.recentGists || [])

const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM yyyy').toUpperCase()
}
</script>