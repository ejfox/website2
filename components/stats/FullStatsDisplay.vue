<template>
  <div class="relative overflow-hidden">
    <!-- Stats Sidebar -->
    <StatsSidebar 
      :stats="stats" 
      :health-today="healthToday || { steps: 0, exerciseMinutes: 0 }"
      class="hidden 2xl:block"
    />
    
    <!-- Main Content -->
    <section class="space-y-6 sm:space-y-8 md:space-y-12 2xl:pr-80 min-w-0">
    <!-- Header - compact -->
    <header class="flex items-center justify-between py-2">
      <h1 class="text-xs font-mono tracking-[0.2em] text-zinc-500">
        FOX_ANNUAL_REPORT :: {{ currentYear }}
      </h1>
      <div class="flex items-center gap-4">
        <div class="text-xs font-mono tracking-[0.2em] text-zinc-500">
          DAY {{ dayOfYear }}/{{ daysInYear }} · {{ progressPercentage }}%
        </div>
        <!-- Data freshness indicator -->
        <div class="flex items-center gap-1.5 text-xs font-mono" v-if="dataAge">
          <div 
            class="w-1.5 h-1.5 rounded-full animate-pulse"
            :class="dataFreshnessClass"
          ></div>
          <span class="text-zinc-500 tracking-wider">{{ dataAge }}</span>
        </div>
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
        <div class="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="i in 6"
            :key="i"
            class="pulse-placeholder-sm"
          ></div>
        </div>
      </template>
    </Suspense>

    <!-- Main Stats Grid - infinitely stackable robot sauce -->
    <section class="grid gap-3 sm:gap-4 md:gap-6 auto-fit-columns overflow-hidden">
      <!-- Modular stat sections - flow freely like robot sauce -->
      <TransitionGroup name="fade-up" tag="div" class="contents" appear>
        <!-- Writing -->
        <StatsSection
          v-if="blogStats"
          id="writing"
          title="WRITING"
          key="writing-section"
          class="break-inside-avoid"
        >
          <AsyncBlogStats :stats="blogStats" key="blog" />
        </StatsSection>

        <!-- Typing -->
        <StatsSection
          v-if="stats.monkeyType?.typingStats"
          id="typing"
          title="TYPING"
          key="typing-section"
          class="break-inside-avoid"
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
          class="break-inside-avoid"
        >
          <AsyncGitHubStats :stats="stats.github" key="github" />
        </StatsSection>

        <!-- Photography -->
        <StatsSection
          v-if="stats.photos?.stats"
          id="photography"
          title="PHOTOGRAPHY"
          key="photography-section"
          class="break-inside-avoid"
        >
          <AsyncPhotoStats :stats="stats.photos" key="photos" />
        </StatsSection>

        <!-- Chess -->
        <StatsSection
          v-if="stats.chess"
          id="chess"
          title="CHESS"
          key="chess-section"
          class="break-inside-avoid"
        >
          <AsyncChessStats :stats="stats.chess" key="chess" />
        </StatsSection>

        <!-- LeetCode -->
        <StatsSection
          v-if="stats.leetcode?.submissionStats"
          id="leetcode"
          title="LEETCODE"
          key="leetcode-section"
          class="break-inside-avoid"
        >
          <AsyncLeetCodeStats :stats="stats.leetcode" key="leetcode" />
        </StatsSection>

        <!-- Productivity -->
        <StatsSection
          v-if="stats.rescueTime"
          id="productivity"
          title="PRODUCTIVITY"
          key="productivity-section"
          class="break-inside-avoid"
        >
          <AsyncRescueTimeStats :stats="stats" key="rescuetime" />
        </StatsSection>

        <!-- Last.fm -->
        <StatsSection
          v-if="stats.lastfm"
          id="lastfm"
          title="MUSIC"
          key="lastfm-section"
          class="break-inside-avoid"
        >
          <AsyncLastFmStats :stats="stats.lastfm" key="lastfm" />
        </StatsSection>
      </TransitionGroup>
    </section>

    <!-- Full Width Sections -->
    <section class="col-span-full space-y-6">
      <!-- Gear Stats -->
      <Transition name="fade-up" appear>
        <div class="relative" id="gear">
          <StatsSection title="GEAR">
            <AsyncGearStats />
          </StatsSection>
        </div>
      </Transition>

      <!-- Health Stats -->
      <Transition name="fade-up" appear>
        <div v-if="stats.health" class="relative" id="health">
          <StatsSection title="HEALTH">
            <AsyncHealthStats :stats="transformedHealthStats" />
          </StatsSection>
        </div>
      </Transition>
    </section>
    </section>
  </div>
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
const StatsSidebar = defineAsyncComponent(
  () => import('~/components/stats/StatsSidebar.vue')
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
  },
  healthToday: {
    type: Object,
    default: () => ({ steps: 0, exerciseMinutes: 0 })
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

// Data freshness indicator
const dataAge = computed(() => {
  // This would ideally come from your stats API
  // For now, we'll use a simple time-based calculation
  const lastUpdate = new Date() // Replace with actual last update time from stats
  const minutesAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000)
  
  if (minutesAgo < 1) return 'LIVE'
  if (minutesAgo < 60) return `${minutesAgo}M AGO`
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}H AGO`
  return `${Math.floor(minutesAgo / 1440)}D AGO`
})

const dataFreshnessClass = computed(() => {
  const lastUpdate = new Date() // Replace with actual last update time
  const minutesAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000)
  
  if (minutesAgo < 5) return 'bg-green-500'
  if (minutesAgo < 60) return 'bg-zinc-500'
  if (minutesAgo < 1440) return 'bg-yellow-500'
  return 'bg-red-500'
})
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

/* Responsive column grid - predictable column counts */
.auto-fit-columns {
  /* Small screens: 1 column */
  grid-template-columns: 1fr;
}

/* Medium screens (sm): 2 columns */
@media (min-width: 640px) {
  .auto-fit-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large screens (lg): 2 columns */
@media (min-width: 1024px) {
  .auto-fit-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Extra-large screens (xl): 3 columns */
@media (min-width: 1280px) {
  .auto-fit-columns {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* When sidebar is active (2xl), keep 3 columns but account for sidebar space */
@media (min-width: 1536px) {
  .auto-fit-columns {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
