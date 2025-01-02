<template>
  <div>
    <IndividualStat :value="stats.totalPosts" size="large" label="BLOG POSTS"
      :details="`${formatNumber(stats.totalWords)} WORDS · ${formatNumber(stats.averageWords)} AVG`" />

    <!-- Blog Timeline -->
    <div v-if="stats.firstPost" class="mt-12">
      <h4 class="text-sm tracking-wider text-gray-500 mb-6">BLOG TIMELINE</h4>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">First Post</span>
          <span class="text-gray-500">{{ formatDate(stats.firstPost) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Latest Post</span>
          <span class="text-gray-500">{{ formatDate(stats.lastPost) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import IndividualStat from './IndividualStat.vue'

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

const props = defineProps<{
  stats: BlogStats
}>()

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'MMMM d, yyyy')
}
</script>