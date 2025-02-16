<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
    <section class="space-y-16 sm:space-y-24">
      <!-- Header -->
      <header>
        <h1 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
          FOX ANNUAL REPORT · {{ currentYear }}
        </h1>
      </header>

      <!-- Top Stats -->
      <Suspense>
        <template #default>
          <ClientOnly>
            <Transition name="fade" appear>
              <div v-if="stats" class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-1/2 -translate-y-1/2 w-4 sm:w-8 border-t border-gray-500/10">
                </div>
                <AsyncTopStats :stats="stats" :blog-stats="validBlogStats" />
              </div>
            </Transition>
          </ClientOnly>
        </template>
        <template #fallback>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div v-for="i in 4" :key="i" class="animate-pulse bg-gray-800/50 rounded-lg h-24"></div>
          </div>
        </template>
      </Suspense>

      <!-- Main Stats Grid -->
      <ClientOnly>
        <section v-if="!isLoading && stats">
          <TransitionGroup name="fade-up" tag="div" class="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24" appear>
            <!-- Left Column: Productivity -->
            <div class="space-y-16 sm:space-y-24 ">
              <div class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-gray-500/0 via-gray-500/10 to-gray-500/0">
                </div>
                <div class="space-y-16">
                  <!-- Writing -->
                  <section v-if="blogStats" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      WRITING
                    </h2>
                    <AsyncBlogStats :stats="blogStats" key="blog" />
                  </section>

                  <!-- Typing -->
                  <section v-if="hasMonkeyTypeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      TYPING</h2>
                    <AsyncMonkeyTypeStats :stats="{ typingStats: stats.monkeyType?.typingStats }" key="monkeytype" />
                  </section>

                  <!-- GitHub -->
                  <section v-if="hasGithubData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      GITHUB</h2>
                    <AsyncGitHubStats :stats="stats.github!" key="github" />
                  </section>

                  <!-- LeetCode -->
                  <section v-if="hasLeetCodeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      LEETCODE
                    </h2>
                    <AsyncLeetCodeStats :stats="stats.leetcode!" key="leetcode" />
                  </section>
                </div>
              </div>
            </div>

            <!-- Right Column: Creative & Lifestyle -->
            <div class="space-y-16 sm:space-y-24">
              <div class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-gray-500/0 via-gray-500/10 to-gray-500/0">
                </div>
                <div class="space-y-16">
                  <!-- Photography -->
                  <section v-if="hasPhotoData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      PHOTOGRAPHY
                    </h2>
                    <AsyncPhotoStats :stats="stats.photos!" key="photos" />
                  </section>

                  <!-- Chess -->
                  <section v-if="hasChessData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">CHESS
                    </h2>
                    <AsyncChessStats :stats="stats.chess!" key="chess" />
                  </section>

                  <!-- Productivity -->
                  <section v-if="hasRescueTimeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">
                      PRODUCTIVITY</h2>
                    <AsyncRescueTimeStats :stats="stats" key="rescuetime" />
                  </section>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </section>
        <section v-else class="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-gray-800/50 rounded-lg h-32"></div>
        </section>
      </ClientOnly>

      <!-- Health Stats -->
      <ClientOnly>
        <Transition name="fade-up" appear>
          <section v-if="hasHealthData && stats?.health" class="relative">
            <div class="absolute -left-8 sm:-left-16 top-0 w-4 sm:w-8 border-t border-gray-500/10"></div>
            <div class="border-t border-gray-500/10 pt-16 sm:pt-24">
              <div class="space-y-6">
                <h2 class="text-xs tracking-[0.2em] text-gray-500 font-light pb-2 border-b border-gray-500/10">HEALTH
                </h2>
                <AsyncHealthStats :stats="stats.health" />
              </div>
            </div>
          </section>
        </Transition>
      </ClientOnly>
    </section>

    <!-- Status Indicator -->
    <Transition name="fade">
      <div v-if="hasStaleData"
        class="fixed bottom-4 right-4 p-2 bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-500/5 shadow-lg">
        <div class="flex items-center gap-2 text-gray-400/40 text-xs tracking-wider">
          <UIcon name="i-heroicons-clock" class="w-3 h-3" />
          <span>Cached data</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, onMounted, defineAsyncComponent } from 'vue'
import { useStats } from '~/composables/useStats'
import type { StatsResponse } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

// Component imports with prefetch hints and loading optimization
const AsyncMonkeyTypeStats = defineAsyncComponent(() => import('~/components/stats/MonkeyTypeStats.vue' /* webpackPrefetch: true */))
const AsyncGitHubStats = defineAsyncComponent(() => import('~/components/stats/GitHubStats.vue' /* webpackPrefetch: true */))
const AsyncPhotoStats = defineAsyncComponent(() => import('~/components/stats/PhotoStats.vue' /* webpackPrefetch: true */))
const AsyncHealthStats = defineAsyncComponent(() => import('~/components/stats/HealthStats.vue' /* webpackPrefetch: true */))
const AsyncLeetCodeStats = defineAsyncComponent(() => import('~/components/stats/LeetCodeStats.vue' /* webpackPrefetch: true */))
const AsyncBlogStats = defineAsyncComponent(() => import('~/components/stats/BlogStats.vue' /* webpackPrefetch: true */))
const AsyncTopStats = defineAsyncComponent(() => import('~/components/stats/TopStats.vue' /* webpackPrefetch: true */))
const AsyncChessStats = defineAsyncComponent(() => import('~/components/stats/ChessStats.vue' /* webpackPrefetch: true */))
const AsyncRescueTimeStats = defineAsyncComponent(() => import('~/components/stats/RescueTimeStats.vue' /* webpackPrefetch: true */))

interface BlogPost {
  wordCount?: number
  date?: string | Date
}

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
}

const { stats: rawStats, isLoading, hasStaleData } = useStats()
const stats = computed<StatsResponse>(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()

// Current year for title
const currentYear = new Date().getFullYear()

// Data availability checks
const hasMonkeyTypeData = computed(() => {
  return !!(stats.monkeyType?.typingStats?.bestWPM)
})
const hasGithubData = computed(() => !!(stats.value?.github?.stats))
const hasPhotoData = computed(() => !!(stats.value?.photos?.stats))
const hasHealthData = computed(() => !!(stats.value?.health))
const hasLeetCodeData = computed(() => !!(stats.value?.leetcode?.submissionStats))
const hasChessData = computed(() => !!(stats.value?.chess))
const hasRescueTimeData = computed(() => !!(stats.value?.rescueTime))

// Blog stats
const blogStats = ref<BlogStats | null>(null)

// Cache the blog posts data
const cachedPosts = shallowRef<BlogPost[] | null>(null)

// Optimize blog stats calculation
onMounted(async () => {
  try {
    if (!cachedPosts.value) {
      cachedPosts.value = await getAllPosts(false, false)
    }

    const posts = cachedPosts.value
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

    // Use a single reduce for better performance
    const { totalWords, wordCount } = posts.reduce((acc: { totalWords: number, wordCount: number }, post: BlogPost) => ({
      totalWords: acc.totalWords + (post?.wordCount || 0),
      wordCount: acc.wordCount + 1
    }), { totalWords: 0, wordCount: 0 })

    blogStats.value = {
      totalPosts: posts.length,
      totalWords,
      averageWords: Math.round(totalWords / wordCount),
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
/* Base transitions */
.fade-enter-active,
.fade-leave-active,
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

/* Section spacing */
section>*+* {
  margin-top: theme('spacing.16');
}

@screen sm {
  section>*+* {
    margin-top: theme('spacing.24');
  }
}

/* Typography refinements */
h1,
h2 {
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