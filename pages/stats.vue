<template>
  <div class="max-w-6xl mx-auto px-8 py-32">
    <!-- Error States -->
    <AsyncDataStatus :errors="errors" :show-errors="showErrors" :has-stale-data="hasStaleData"
      @hide-errors="showErrors = false" />

    <!-- All-time Stats Section -->
    <section class="space-y-64">
      <!-- Section Title -->
      <div>
        <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-4 border-b border-gray-500/10">
          ANNUAL REPORT · {{ currentYear }}
        </h2>
      </div>

      <!-- Top Stats -->
      <Suspense>
        <template #default>
          <ClientOnly>
            <Transition name="fade" appear>
              <div v-if="stats" class="relative">
                <div class="absolute -left-16 top-1/2 -translate-y-1/2 w-8 border-t border-gray-500/10"></div>
                <AsyncTopStats :stats="stats" :blog-stats="validBlogStats" />
              </div>
            </Transition>
          </ClientOnly>
        </template>
        <template #fallback>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div v-for="i in 4" :key="i" class="animate-pulse bg-gray-800/50 rounded-lg h-32"></div>
          </div>
        </template>
      </Suspense>

      <!-- Primary Metrics -->
      <ClientOnly>
        <section>
          <template v-if="!isLoading && stats">
            <TransitionGroup name="fade-up" tag="div" class="grid grid-cols-1 lg:grid-cols-2 gap-64" appear>
              <!-- Productivity Stats: Typing, GitHub, RescueTime -->
              <div class="space-y-64 relative">
                <div
                  class="absolute -left-16 top-0 h-full w-px bg-gradient-to-b from-gray-500/0 via-gray-500/10 to-gray-500/0">
                </div>
                <AsyncMonkeyTypeStats v-if="hasMonkeyTypeData" :stats="{ typingStats: stats.monkeyType!.typingStats! }"
                  key="monkeytype" />
                <AsyncGitHubStats v-if="hasGithubData" :stats="stats.github!" key="github" />
                <AsyncRescueTimeStats v-if="hasRescueTimeData" :stats="stats" key="rescuetime" />
                <AsyncLeetCodeStats v-if="hasLeetCodeData" :stats="stats.leetcode!" key="leetcode" />
              </div>

              <!-- Creative & Gaming Stats: Photos, Chess, Blog -->
              <div class="space-y-64 relative">
                <div
                  class="absolute -left-16 top-0 h-full w-px bg-gradient-to-b from-gray-500/0 via-gray-500/10 to-gray-500/0">
                </div>
                <AsyncPhotoStats v-if="hasPhotoData" :stats="stats.photos!" key="photos" />
                <AsyncChessStats v-if="hasChessData" :stats="stats.chess!" key="chess" />
                <AsyncBlogStats v-if="blogStats" :stats="blogStats" key="blog" />
              </div>
            </TransitionGroup>
          </template>
          <template v-else>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-64">
              <div v-for="i in 6" :key="i" class="animate-pulse bg-gray-800/50 rounded-lg h-48"></div>
            </div>
          </template>
        </section>
      </ClientOnly>

      <!-- Health Stats Section -->
      <ClientOnly>
        <Transition name="fade-up" appear>
          <section v-if="hasHealthData && stats?.health" class="pt-32 relative">
            <div class="absolute -left-16 top-0 w-8 border-t border-gray-500/10"></div>
            <div class="border-t border-gray-500/10 pt-32">
              <h4 class="text-xs tracking-[0.2em] text-gray-500 font-light mb-32">HEALTH METRICS</h4>
              <AsyncHealthStats :stats="stats.health" />
            </div>
          </section>
        </Transition>
      </ClientOnly>
    </section>

    <!-- Stale Data Warning -->
    <div v-if="hasStaleData" class="fixed bottom-8 right-8">
      <div class="p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-500/10 shadow-xl">
        <div class="flex items-center space-x-3 text-gray-400/75">
          <UIcon name="i-heroicons-clock" class="w-4 h-4" />
          <span class="text-xs tracking-wider">Using cached data</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, defineAsyncComponent } from 'vue'
import { useStats } from '~/composables/useStats'
import type { StatsResponse } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

// Component imports
const AsyncMonkeyTypeStats = defineAsyncComponent(() => import('~/components/stats/MonkeyTypeStats.vue'))
const AsyncGitHubStats = defineAsyncComponent(() => import('~/components/stats/GitHubStats.vue'))
const AsyncPhotoStats = defineAsyncComponent(() => import('~/components/stats/PhotoStats.vue'))
const AsyncHealthStats = defineAsyncComponent(() => import('~/components/stats/HealthStats.vue'))
const AsyncDataStatus = defineAsyncComponent(() => import('~/components/stats/DataStatus.vue'))
const AsyncLeetCodeStats = defineAsyncComponent(() => import('~/components/stats/LeetCodeStats.vue'))
const AsyncBlogStats = defineAsyncComponent(() => import('~/components/stats/BlogStats.vue'))
const AsyncTopStats = defineAsyncComponent(() => import('~/components/stats/TopStats.vue'))
const AsyncChessStats = defineAsyncComponent(() => import('~/components/stats/ChessStats.vue'))
const AsyncRescueTimeStats = defineAsyncComponent(() => import('~/components/stats/RescueTimeStats.vue'))

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

const { stats, isLoading, errors: statsErrors, hasStaleData } = useStats()
const { getAllPosts } = useProcessedMarkdown()

// Current year for title
const currentYear = new Date().getFullYear()

// Error handling
const showErrors = ref(true)
const errors = computed(() => {
  return {
    github: !hasGithubData.value,
    photos: !hasPhotoData.value,
    leetcode: !hasLeetCodeData.value,
    monkeytype: !hasMonkeyTypeData.value,
    health: !hasHealthData.value,
    chess: !hasChessData.value,
    rescuetime: !hasRescueTimeData.value
  }
})

// Data availability checks
const hasMonkeyTypeData = computed(() => {
  return !!(stats.value?.monkeyType?.typingStats)
})

const hasGithubData = computed(() => {
  return !!(stats.value?.github?.stats)
})

const hasPhotoData = computed(() => {
  return !!(stats.value?.photos?.stats)
})

const hasHealthData = computed(() => {
  return !!(stats.value?.health)
})

const hasLeetCodeData = computed(() => {
  return !!(stats.value?.leetcode?.submissionStats)
})

const hasChessData = computed(() => {
  return !!(stats.value?.chess)
})

const hasRescueTimeData = computed(() => {
  return !!(stats.value?.rescueTime)
})

// Blog stats
const blogStats = ref<BlogStats | null>(null)
onMounted(async () => {
  try {
    const posts = await getAllPosts(false, false)
    if (!posts?.length) {
      blogStats.value = {
        totalPosts: 0,
        totalWords: 0,
        averageWords: 0,
        firstPost: null,
        lastPost: null
      }
      return
    }

    blogStats.value = {
      totalPosts: posts.length,
      totalWords: posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0),
      averageWords: Math.round(posts.reduce((sum, post) => sum + (post?.wordCount || 0), 0) / posts.length),
      firstPost: posts[posts.length - 1]?.date?.toString() || null,
      lastPost: posts[0]?.date?.toString() || null
    }
  } catch (error) {
    console.error('Error calculating blog stats:', error)
    blogStats.value = {
      totalPosts: 0,
      totalWords: 0,
      averageWords: 0,
      firstPost: null,
      lastPost: null
    }
  }
})

const validBlogStats = computed(() => blogStats.value || undefined)
</script>

<style scoped>
input[type="date"] {
  color-scheme: light dark;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Stagger children in transition group */
.fade-up-enter-active {
  transition-delay: calc(var(--el-transition-index, 0) * 100ms);
}

/* Smooth transition for data updates */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

/* Consistent rhythm for sections */
section>*+* {
  margin-top: theme('spacing.64');
}

/* Refined typography */
h2,
h3,
h4 {
  font-feature-settings: "tnum", "zero";
}

/* Gradient borders */
.border-gradient {
  position: relative;
}

.border-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  background: linear-gradient(to bottom, transparent, rgb(107 114 128 / 0.1), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
</style>