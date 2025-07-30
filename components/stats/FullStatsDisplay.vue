<template>
  <div class="relative overflow-hidden">
    <!-- Stats Sidebar -->
    <StatsSidebar
      :stats="stats"
      :health-today="healthToday || { steps: 0, exerciseMinutes: 0 }"
      class="hidden 2xl:block"
    />

    <!-- Main Content -->
    <section class="space-y-12 2xl:pr-80 min-w-0 w-full pr-2">
      <!-- Header -->
      <header class="flex items-center justify-between py-6">
        <h1 class="text-mono-label">
          FOX_ANNUAL_REPORT :: {{ currentYear }}
        </h1>
        <div class="flex items-center gap-6">
          <div class="text-mono-label">
            DAY {{ formatNumber(dayOfYear) }}/{{ formatNumber(daysInYear) }} ·
            {{ progressPercentage }}
          </div>
          <div v-if="dataAge" class="flex items-center gap-2 text-xs font-mono">
            <div
              class="w-1.5 h-1.5 rounded-full animate-pulse"
              :class="dataFreshnessClass"
            ></div>
            <span class="text-muted uppercase tracking-wider">{{
              dataAge
            }}</span>
          </div>
        </div>
      </header>

      <!-- Top Stats -->
      <Suspense>
        <template #default>
          <ClientOnly>
            <Transition name="fade" appear>
              <div v-if="stats" id="top-stats" class="relative">
                <AsyncTopStats :stats="stats" :blog-stats="blogStats" />
              </div>
            </Transition>
          </ClientOnly>
        </template>
        <template #fallback>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <div
              v-for="i in 6"
              :key="i"
              class="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"
            ></div>
          </div>
        </template>
      </Suspense>

      <!-- Main Stats Grid -->
      <section class="grid gap-6 md:gap-16 auto-fit-columns overflow-hidden">
        <TransitionGroup name="fade-up" tag="div" class="contents" appear>
          <!-- Writing -->
          <StatsSection
            v-if="blogStats"
            id="writing"
            key="writing-section"
            title="WRITING"
            class="break-inside-avoid"
          >
            <AsyncBlogStats key="blog" :stats="blogStats" />
          </StatsSection>

          <!-- Typing -->
          <StatsSection
            v-if="stats.monkeyType?.typingStats"
            id="typing"
            key="typing-section"
            title="TYPING"
            class="break-inside-avoid"
          >
            <AsyncMonkeyTypeStats
              key="monkeytype"
              :stats="{ typingStats: stats.monkeyType.typingStats }"
            />
          </StatsSection>

          <!-- GitHub -->
          <StatsSection
            v-if="stats.github?.stats"
            id="github"
            key="github-section"
            title="GITHUB"
            class="break-inside-avoid"
          >
            <AsyncGitHubStats key="github" :stats="stats.github" />
          </StatsSection>

          <!-- Photography -->
          <StatsSection
            v-if="stats.photos?.stats"
            id="photography"
            key="photography-section"
            title="PHOTOGRAPHY"
            class="break-inside-avoid"
          >
            <AsyncPhotoStats key="photos" :stats="stats.photos" />
          </StatsSection>

          <!-- Chess -->
          <StatsSection
            v-if="stats.chess"
            id="chess"
            key="chess-section"
            title="CHESS"
            class="break-inside-avoid"
          >
            <AsyncChessStats key="chess" :stats="stats.chess" />
          </StatsSection>

          <!-- LeetCode -->
          <StatsSection
            v-if="stats.leetcode?.submissionStats"
            id="leetcode"
            key="leetcode-section"
            title="LEETCODE"
            class="break-inside-avoid"
          >
            <AsyncLeetCodeStats key="leetcode" :stats="stats.leetcode" />
          </StatsSection>

          <!-- Productivity -->
          <StatsSection
            v-if="stats.rescueTime"
            id="productivity"
            key="productivity-section"
            title="PRODUCTIVITY"
            class="break-inside-avoid"
          >
            <AsyncRescueTimeStats key="rescuetime" :stats="stats" />
          </StatsSection>

          <!-- Films -->
          <StatsSection
            v-if="letterboxdData?.stats"
            id="films"
            key="films-section"
            title="FILMS"
            class="break-inside-avoid"
          >
            <AsyncLetterboxdStats key="letterboxd" :data="letterboxdData" />
          </StatsSection>

          <!-- Gaming -->
          <StatsSection
            v-if="steamData?.stats"
            id="gaming"
            key="gaming-section"
            title="GAMING"
            class="break-inside-avoid"
          >
            <AsyncSteamStats key="steam" :data="steamData" />
          </StatsSection>

          <!-- Reading -->
          <StatsSection
            v-if="goodreadsData?.stats"
            id="reading"
            key="reading-section"
            title="READING"
            class="break-inside-avoid"
          >
            <AsyncGoodreadsStats key="goodreads" :data="goodreadsData" />
          </StatsSection>

          <!-- Last.fm -->
          <StatsSection
            v-if="stats.lastfm"
            id="music"
            key="music-section"
            title="MUSIC"
            class="break-inside-avoid"
          >
            <AsyncLastFmStats key="lastfm" :stats="stats.lastfm" />
          </StatsSection>
        </TransitionGroup>
      </section>

      <!-- Full Width Sections -->
      <section class="col-span-full space-y-12">
        <!-- Gear Stats -->
        <Transition name="fade-up" appear>
          <div id="gear" class="relative">
            <StatsSection title="GEAR">
              <AsyncGearStats />
            </StatsSection>
          </div>
        </Transition>

        <!-- Health Stats -->
        <Transition name="fade-up" appear>
          <div v-if="stats.health" id="health" class="relative">
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
import { formatNumber, formatPercent } from '~/composables/useNumberFormat'
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
const AsyncLetterboxdStats = defineAsyncComponent(
  () => import('~/components/stats/LetterboxdStats.vue')
)
const AsyncSteamStats = defineAsyncComponent(
  () => import('~/components/stats/SteamStats.vue')
)
const AsyncGoodreadsStats = defineAsyncComponent(
  () => import('~/components/stats/GoodreadsStats.vue')
)
const StatsSidebar = defineAsyncComponent(
  () => import('~/components/stats/StatsSidebar.vue')
)

const _props = defineProps({
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
  },
  letterboxdData: {
    type: Object,
    default: null
  }, 
  steamData: {
    type: Object,
    default: null
  },
  goodreadsData: {
    type: Object,
    default: null
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
const progressPercentage = formatPercent(dayOfYear / daysInYear, 0)

const dataAge = computed(() => {
  const lastUpdate = new Date()
  const minutesAgo = Math.floor(
    (new Date().getTime() - lastUpdate.getTime()) / 60000
  )

  if (minutesAgo < 1) return 'LIVE'
  if (minutesAgo < 60) return `${minutesAgo}M AGO`
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}H AGO`
  return `${Math.floor(minutesAgo / 1440)}D AGO`
})

const dataFreshnessClass = computed(() => {
  const lastUpdate = new Date()
  const minutesAgo = Math.floor(
    (new Date().getTime() - lastUpdate.getTime()) / 60000
  )

  if (minutesAgo < 5) return 'bg-green-500'
  if (minutesAgo < 60) return 'bg-zinc-500'
  if (minutesAgo < 1440) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>

<style scoped>
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

.fade-up-enter-active {
  transition-delay: calc(var(--el-transition-index, 0) * 100ms);
}

.auto-fit-columns {
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .auto-fit-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .auto-fit-columns {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1536px) {
  .auto-fit-columns {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
