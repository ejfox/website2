<template>
  <section class="space-y-16 sm:space-y-24">
    <!-- Header -->
    <header class="flex justify-between items-center">
      <h1 class="text-xs tracking-[0.2em] font-mono text-zinc-500">
        FOX_ANNUAL_REPORT :: {{ currentYear }}
      </h1>
      <div class="text-xs tracking-[0.2em] font-mono text-zinc-500">
        DAY {{ dayOfYear }}/{{ daysInYear }} · {{ progressPercentage }}%
      </div>
    </header>

    <!-- Top Stats -->
    <Suspense>
      <template #default>
        <ClientOnly>
          <Transition name="fade" appear>
            <div v-if="stats" class="relative" id="top-stats">
              <AsyncTopStats :stats="stats" :blog-stats="blogStats" />
            </div>
          </Transition>
        </ClientOnly>
      </template>
      <template #fallback>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="i in 4"
            :key="i"
            class="pulse-placeholder pulse-placeholder-lg"
          ></div>
        </div>
      </template>
    </Suspense>

    <!-- Main Stats Grid -->
    <section class="stats-grid">
      <TransitionGroup name="fade-up" tag="div" class="stats-grid" appear>
        <!-- Left Column: Productivity -->
        <div class="stats-column" key="productivity-column">
          <div class="relative">
            <div class="stats-vertical-divider"></div>
            <div class="space-y-16">
              <!-- Writing -->
              <StatsSection
                v-if="blogStats"
                id="writing"
                title="WRITING"
                key="writing-section"
              >
                <AsyncBlogStats :stats="blogStats" key="blog" />
              </StatsSection>

              <!-- Typing -->
              <StatsSection
                v-if="stats.monkeyType?.typingStats"
                id="typing"
                title="TYPING"
                key="typing-section"
              >
                <AsyncMonkeyTypeStats
                  :stats="{ typingStats: stats.monkeyType.typingStats }"
                  key="monkeytype"
                />
              </StatsSection>

              <!-- GitHub -->
              <StatsSection
                v-if="stats.github?.stats"
                id="github"
                title="GITHUB"
                key="github-section"
              >
                <AsyncGitHubStats :stats="stats.github" key="github" />
              </StatsSection>
            </div>
          </div>

          <div class="relative">
            <div class="stats-vertical-divider"></div>
            <div class="space-y-16">
              <!-- Photography -->
              <StatsSection
                v-if="stats.photos?.stats"
                id="photography"
                title="PHOTOGRAPHY"
                key="photography-section"
              >
                <AsyncPhotoStats :stats="stats.photos" key="photos" />
              </StatsSection>

              <!-- Chess -->
              <StatsSection
                v-if="stats.chess"
                id="chess"
                title="CHESS"
                key="chess-section"
              >
                <AsyncChessStats :stats="stats.chess" key="chess" />
              </StatsSection>

              <!-- Productivity -->
              <StatsSection
                v-if="stats.rescueTime"
                id="productivity"
                title="PRODUCTIVITY"
                key="productivity-section"
              >
                <AsyncRescueTimeStats :stats="stats" key="rescuetime" />
              </StatsSection>
              <!-- LeetCode -->
              <StatsSection
                v-if="stats.leetcode?.submissionStats"
                id="leetcode"
                title="LEETCODE"
                key="leetcode-section"
              >
                <AsyncLeetCodeStats :stats="stats.leetcode" key="leetcode" />
              </StatsSection>
              <!-- Last.fm -->
              <StatsSection
                v-if="stats.lastfm"
                id="lastfm"
                title="MUSIC"
                key="lastfm-section"
              >
                <AsyncLastFmStats :stats="stats.lastfm" key="lastfm" />
              </StatsSection>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </section>

    <!-- Gear Stats -->
    <Transition name="fade-up" appear>
      <section class="relative" id="gear">
        <div class="pt-16 sm:pt-24">
          <StatsSection title="GEAR">
            <AsyncGearStats />
          </StatsSection>
        </div>
      </section>
    </Transition>

    <!-- Health Stats -->
    <Transition name="fade-up" appear>
      <section v-if="stats.health" class="relative" id="health">
        <div class="pt-16 sm:pt-24">
          <StatsSection title="HEALTH">
            <AsyncHealthStats :stats="transformedHealthStats" />
          </StatsSection>
        </div>
      </section>
    </Transition>
  </section>
</template>

<script setup>
import { computed, defineProps, defineAsyncComponent } from 'vue'

// Component imports with prefetch hints
const AsyncMonkeyTypeStats = defineAsyncComponent(
  () => import('~/components/stats/MonkeyTypeStats.vue')
)
const AsyncGitHubStats = defineAsyncComponent(
  () => import('~/components/stats/GitHubStats.vue')
)
const AsyncPhotoStats = defineAsyncComponent(
  () => import('~/components/stats/PhotoStats.vue')
)
const AsyncHealthStats = defineAsyncComponent(
  () => import('~/components/stats/HealthStats.vue')
)
const AsyncLeetCodeStats = defineAsyncComponent(
  () => import('~/components/stats/LeetCodeStats.vue')
)
const AsyncBlogStats = defineAsyncComponent(
  () => import('~/components/stats/BlogStats.vue')
)
const AsyncTopStats = defineAsyncComponent(
  () => import('~/components/stats/TopStats.vue')
)
const AsyncChessStats = defineAsyncComponent(
  () => import('~/components/stats/ChessStats.vue')
)
const AsyncRescueTimeStats = defineAsyncComponent(
  () => import('~/components/stats/RescueTimeStats.vue')
)
const AsyncGearStats = defineAsyncComponent(
  () => import('~/components/stats/GearStats.vue')
)
const AsyncLastFmStats = defineAsyncComponent(
  () => import('~/components/stats/LastFmStats.vue')
)

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  blogStats: {
    type: Object,
    default: null
  },
  transformedHealthStats: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Current year for title
const currentYear = new Date().getFullYear()

// Calculate the day of year and year progress
const now = new Date()
const startOfYear = new Date(currentYear, 0, 0)
const diff = now.getTime() - startOfYear.getTime()
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
const isLeapYear =
  (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
const daysInYear = isLeapYear ? 366 : 365
const progressPercentage = Math.floor((dayOfYear / daysInYear) * 100)
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

/* Common styles using @apply */
.pulse-placeholder {
  @apply animate-pulse bg-zinc-900/50 rounded-none border border-zinc-800/50;
}

.pulse-placeholder-lg {
  @apply h-32;
}

.stats-grid {
  @apply p-2;
}

.stats-column {
  @apply space-y-16 sm:space-y-24;
}

.stats-vertical-divider {
  @apply absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-zinc-800/0 via-zinc-800/50 to-zinc-800/0;
}
</style>
