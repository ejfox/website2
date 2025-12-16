<!--
  @file BlogStats.vue
  @description Blog statistics showing post counts, word counts, and writing metrics
  @props stats: Object - Blog statistics data from API
-->
<template>
  <div v-if="stats" class="space-y-2 font-mono">
    <!-- Writing Status -->
    <div class="flex justify-around items-start gap-2 py-2">
      <div class="text-center">
        <div class="text-2xl font-bold">{{ stats.posts.total || 'N/A' }}</div>
        <div class="text-xs text-zinc-500 uppercase tracking-widest mt-2">
          TOTAL POSTS
        </div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">{{ stats.posts.thisMonth }}</div>
        <div class="text-xs text-zinc-500 uppercase tracking-widest mt-2">
          THIS MONTH
        </div>
      </div>
    </div>

    <!-- Simple Stats -->
    <StatsSectionHeader title="STATISTICS" />
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-widest text-xs">
          WORDS THIS MONTH
        </span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">
          {{ formatNumber(stats.words.thisMonth) }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-widest text-xs">
          AVG WORDS/POST
        </span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">
          {{ stats.words.avgPerPost }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-widest text-xs">
          CURRENT MONTH
        </span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">
          {{ stats.month }} {{ stats.year }}
        </span>
      </div>
    </div>

    <!-- Recent Posts -->
    <StatsSectionHeader title="RECENT POSTS" />
    <div class="space-y-2">
      <div
        v-for="post in stats.recentPosts.slice(0, 5)"
        :key="post.slug"
        class="flex items-start justify-between gap-2"
      >
        <div class="flex-1 min-w-0">
          <div
            class="truncate text-xs leading-[12px]"
            :class="['text-zinc-700 dark:text-zinc-300']"
          >
            {{ post.title }}
          </div>
          <div class="text-zinc-500 text-xs leading-[10px]">
            {{ new Date(post.date).toLocaleDateString() }}
          </div>
        </div>
        <div class="text-zinc-500 tabular-nums flex-shrink-0 text-xs">
          {{ post.words }}w
        </div>
      </div>
    </div>
  </div>
  <StatsDataState v-else message="Blog data unavailable" />
</template>

<script setup lang="ts">
import { useNumberFormat } from '../../composables/useNumberFormat'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'

const { formatNumber } = useNumberFormat()

interface BlogStats {
  posts: {
    thisMonth: number
    total: number
  }
  words: {
    thisMonth: number
    avgPerPost: number
  }
  recentPosts: Array<{
    title: string
    slug: string
    date: string
    words: number
  }>
  month: string
  year: number
}

defineProps<{
  stats: BlogStats
}>()
</script>
