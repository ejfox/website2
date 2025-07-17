<template>
  <div class="space-y-8">
    <!-- Channel Stats -->
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card">
          <div class="text-2xl font-mono">
            {{ stats.stats.totalVideos }}
          </div>
          <div class="text-xs text-zinc-500 tracking-wider">
            TOTAL VIDEOS
          </div>
        </div>
        <div class="stat-card">
          <div class="text-2xl font-mono">
            {{ stats.stats.videosThisMonth }}
          </div>
          <div class="text-xs text-zinc-500 tracking-wider">
            VIDEOS THIS MONTH
          </div>
        </div>
        <div class="stat-card">
          <div class="text-2xl font-mono">
            {{ formatNumber(stats.stats.totalViews) }}
          </div>
          <div class="text-xs text-zinc-500 tracking-wider">
            TOTAL VIEWS
          </div>
        </div>
        <div class="stat-card">
          <div class="text-2xl font-mono">
            {{ formatNumber(stats.stats.subscriberCount) }}
          </div>
          <div class="text-xs text-zinc-500 tracking-wider">
            SUBSCRIBERS
          </div>
        </div>
      </div>
    </div>

    <!-- Latest Videos -->
    <div class="space-y-4">
      <StatsSectionHeader title="LATEST VIDEOS" />
      <div class="space-y-4">
        <div
          v-for="video in stats.latestVideos" :key="video.id" 
          class="group relative overflow-hidden border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
        >
          <a
            :href="video.url" target="_blank" rel="noopener" 
            class="block relative aspect-video overflow-hidden"
          >
            <img
              :src="video.thumbnails.medium" 
              :alt="video.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <h4 class="text-sm font-medium line-clamp-2">{{ video.title }}</h4>
              <div class="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <div class="flex items-center gap-1">
                  <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  {{ formatNumber(video.views) }}
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-heroicons-heart" class="w-4 h-4" />
                  {{ formatNumber(video.likes) }}
                </div>
                <div>{{ formatDate(video.publishedAt) }}</div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatsSectionHeader from './StatsSectionHeader.vue'
import { useNumberFormat } from '~/composables/useNumberFormat'
interface YouTubeStats {
  stats: {
    totalVideos: number
    videosThisMonth: number
    totalViews: number
    subscriberCount: number
  }
  latestVideos: Array<{
    id: string
    title: string
    description: string
    publishedAt: string
    thumbnails: {
      default: string
      medium: string
      high: string
    }
    url: string
    views: number
    likes: number
  }>
  lastUpdated: string
}

const props = defineProps<{
  stats: YouTubeStats
}>()

const { formatNumber } = useNumberFormat()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date)
}
</script>

<style scoped>
.stat-card {
  @apply p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors;
}
</style> 