<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 font-mono">
    <section class="space-y-16 sm:space-y-24">
      <!-- Header -->
      <header>
        <h1 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
          FOX_ANNUAL_REPORT :: {{ currentYear }}
        </h1>
      </header>

      <!-- Top Stats -->
      <Suspense>
        <template #default>
          <ClientOnly>
            <Transition name="fade" appear>
              <div v-if="stats" class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-1/2 -translate-y-1/2 w-4 sm:w-8 border-t border-zinc-800/50">
                </div>
                <AsyncTopStats :stats="stats" :blog-stats="validBlogStats" />
              </div>
            </Transition>
          </ClientOnly>
        </template>
        <template #fallback>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div v-for="i in 4" :key="i"
              class="animate-pulse bg-zinc-900/50 rounded-none h-24 border border-zinc-800/50"></div>
          </div>
        </template>
      </Suspense>

      <!-- Main Stats Grid -->
      <ClientOnly>
        <section v-if="!isLoading && stats">
          <TransitionGroup name="fade-up" tag="div" class="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24" appear>
            <!-- Left Column: Productivity -->
            <div class="space-y-16 sm:space-y-24">
              <div class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-zinc-800/0 via-zinc-800/50 to-zinc-800/0">
                </div>
                <div class="space-y-16">
                  <!-- Writing -->
                  <section v-if="blogStats" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      WRITING
                    </h2>
                    <AsyncBlogStats :stats="blogStats" key="blog" />
                  </section>

                  <!-- Typing -->
                  <section v-if="hasMonkeyTypeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      TYPING</h2>
                    <AsyncMonkeyTypeStats v-if="stats.monkeyType?.typingStats"
                      :stats="{ typingStats: stats.monkeyType.typingStats }" key="monkeytype" />
                    <div v-else class="text-sm text-zinc-400 font-mono">
                      TYPING_DATA_UNAVAILABLE
                    </div>
                  </section>

                  <!-- GitHub -->
                  <section v-if="hasGithubData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      GITHUB</h2>
                    <AsyncGitHubStats v-if="stats.github" :stats="stats.github" key="github" />
                    <div v-else class="text-sm text-zinc-400 font-mono">
                      GITHUB_DATA_UNAVAILABLE
                    </div>
                  </section>

                  <!-- LeetCode -->
                  <section v-if="hasLeetCodeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      LEETCODE
                    </h2>
                    <AsyncLeetCodeStats v-if="stats.leetcode" :stats="stats.leetcode" key="leetcode" />
                    <div v-else class="text-sm text-zinc-400 font-mono">
                      LEETCODE_DATA_UNAVAILABLE
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <!-- Right Column: Creative & Lifestyle -->
            <div class="space-y-16 sm:space-y-24">
              <div class="relative">
                <div
                  class="absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-zinc-800/0 via-zinc-800/50 to-zinc-800/0">
                </div>
                <div class="space-y-16">
                  <!-- Photography -->
                  <section v-if="hasPhotoData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      PHOTOGRAPHY
                    </h2>
                    <AsyncPhotoStats v-if="stats.photos" :stats="stats.photos" key="photos" />
                    <div v-else class="text-sm text-zinc-400 font-mono">
                      PHOTO_DATA_UNAVAILABLE
                    </div>
                  </section>

                  <!-- Chess -->
                  <section v-if="hasChessData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">CHESS
                    </h2>
                    <AsyncChessStats v-if="stats.chess" :stats="stats.chess" key="chess" />
                    <div v-else class="text-sm text-zinc-400 font-mono">
                      CHESS_DATA_UNAVAILABLE
                    </div>
                  </section>

                  <!-- Productivity -->
                  <section v-if="hasRescueTimeData" class="space-y-6">
                    <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">
                      PRODUCTIVITY</h2>
                    <AsyncRescueTimeStats :stats="stats" key="rescuetime" />
                  </section>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </section>
        <section v-else class="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-zinc-900/50 rounded-none h-32 border border-zinc-800/50">
          </div>
        </section>
      </ClientOnly>

      <!-- Health Stats -->
      <ClientOnly>
        <Transition name="fade-up" appear>
          <section v-if="hasHealthData && stats.health" class="relative">
            <div class="absolute -left-8 sm:-left-16 top-0 w-4 sm:w-8 border-t border-zinc-800/50"></div>
            <div class="border-t border-zinc-800/50 pt-16 sm:pt-24">
              <div class="space-y-6">
                <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">HEALTH
                </h2>
                <AsyncHealthStats :stats="stats.health" />
              </div>
            </div>
          </section>
          <section v-else-if="hasHealthData" class="relative">
            <div class="absolute -left-8 sm:-left-16 top-0 w-4 sm:w-8 border-t border-zinc-800/50"></div>
            <div class="border-t border-zinc-800/50 pt-16 sm:pt-24">
              <div class="space-y-6">
                <h2 class="text-xs tracking-[0.2em] font-mono text-zinc-500 pb-2 border-b border-zinc-800/50">HEALTH
                </h2>
                <div class="text-sm text-zinc-400 font-mono">
                  HEALTH_DATA_UNAVAILABLE
                </div>
              </div>
            </div>
          </section>
        </Transition>
      </ClientOnly>
    </section>

    <!-- Status Indicator -->
    <Transition name="fade">
      <div v-if="hasStaleData"
        class="fixed bottom-4 right-4 p-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 font-mono">
        <div class="flex items-center gap-2 text-zinc-500 text-xs tracking-wider">
          <UIcon name="i-heroicons-clock" class="w-3 h-3" />
          <span>CACHED_DATA</span>
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
  return !!(stats.value?.monkeyType?.typingStats?.bestWPM)
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
  background: linear-gradient(to bottom, transparent, rgb(39 39 42 / 0.5), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
</style>