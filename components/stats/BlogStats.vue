<template>
  <div v-if="stats" class="space-y-3 font-mono">
    <!-- Writing Status -->
    <StatsSectionHeader title="WRITING STATUS" />
    <div class="flex justify-around items-start gap-8 py-4">
      <div class="text-center">
        <div class="text-2xl font-bold">{{ stats.posts.total || 'N/A' }}</div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider mt-1">TOTAL POSTS</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">{{ stats.posts.thisMonth }}</div>
        <div class="text-xs text-zinc-500 uppercase tracking-wider mt-1">THIS MONTH</div>
      </div>
    </div>

    <!-- Simple Stats -->
    <StatsSectionHeader title="STATISTICS" />
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-wider" style="font-size: 10px">WORDS THIS MONTH</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">{{ formatNumber(stats.words.thisMonth) }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-wider" style="font-size: 10px">AVG WORDS/POST</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">{{ stats.words.avgPerPost }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-500 uppercase tracking-wider" style="font-size: 10px">CURRENT MONTH</span>
        <span class="text-zinc-700 dark:text-zinc-300 tabular-nums text-sm">{{ stats.month }} {{ stats.year }}</span>
      </div>
    </div>

    <!-- Recent Posts -->
    <StatsSectionHeader title="RECENT POSTS" />
    <div class="space-y-1.5">
      <div 
        v-for="post in stats.recentPosts.slice(0, 5)" 
        :key="post.slug"
        class="flex items-start justify-between gap-2"
      >
        <div class="flex-1 min-w-0">
          <div class="text-zinc-700 dark:text-zinc-300 truncate" style="font-size: 10px; line-height: 12px">
            {{ post.title }}
          </div>
          <div class="text-zinc-500" style="font-size: 9px; line-height: 10px">
            {{ new Date(post.date).toLocaleDateString() }}
          </div>
        </div>
        <div class="text-zinc-500 tabular-nums flex-shrink-0" style="font-size: 10px">
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

const props = defineProps<{
  stats: BlogStats
}>()
</script>