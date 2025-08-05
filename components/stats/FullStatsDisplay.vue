<template>
  <div class="relative overflow-hidden">
    <!-- Main Content -->
    <section class="min-w-0 w-full mx-auto max-w-none">
      <!-- Header -->
      <header class="flex items-center justify-between py-6">
        <h1 class="text-mono-label">STATS</h1>
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
      <section
        class="grid md:gap-4 lg:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 overflow-hidden pr-4 md:pr-8"
      >
        <TransitionGroup name="fade-up" tag="div" class="contents" appear>
          <!-- GitHub - FIRST PRIORITY -->
          <StatsSection
            v-if="stats.github?.stats"
            id="github"
            key="github-section"
            title="GITHUB"
            class="break-inside-avoid"
          >
            <AsyncGitHubStats key="github" :stats="stats.github" />
          </StatsSection>

          <!-- Writing - SECOND PRIORITY -->
          <StatsSection
            v-if="blogStats"
            id="writing"
            key="writing-section"
            title="WRITING"
            class="break-inside-avoid"
          >
            <AsyncBlogStats key="blog" :stats="blogStats" />
          </StatsSection>

          <!-- Reading - THIRD PRIORITY -->
          <StatsSection
            v-if="goodreadsData?.stats"
            id="reading"
            key="reading-section"
            title="READING"
            class="break-inside-avoid"
          >
            <AsyncGoodreadsStats key="goodreads" :data="goodreadsData" />
          </StatsSection>

          <!-- Productivity - FIFTH PRIORITY -->
          <StatsSection
            v-if="stats.rescueTime"
            id="productivity"
            key="productivity-section"
            title="PRODUCTIVITY"
            class="break-inside-avoid"
          >
            <AsyncRescueTimeStats key="rescuetime" :stats="stats" />
          </StatsSection>

          <!-- LeetCode -->
          <StatsSection
            v-if="
              stats.leetcode?.submissionStats &&
              (stats.leetcode.submissionStats.easy.count > 0 ||
                stats.leetcode.submissionStats.medium.count > 0 ||
                stats.leetcode.submissionStats.hard.count > 0)
            "
            id="leetcode"
            key="leetcode-section"
            title="LEETCODE"
            class="break-inside-avoid"
          >
            <AsyncLeetCodeStats key="leetcode" :stats="stats.leetcode" />
          </StatsSection>
          <!-- Typing -->

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

          <StatsSection
            v-if="stats.monkeyType?.typingStats"
            id="typing"
            key="typing-section"
            title="TYPING"
            class="break-inside-avoid"
          >
            <AsyncMonkeyTypeStats key="monkeytype" :stats="stats.monkeyType" />
          </StatsSection>

          <!-- Code Snippets -->
          <StatsSection
            v-if="stats.gists?.stats"
            id="gists"
            key="gists-section"
            title="CODE"
            class="break-inside-avoid"
          >
            <AsyncGistStats key="gists" :gist-stats="stats.gists" />
          </StatsSection>

          <!-- Music - FOURTH PRIORITY -->
          <StatsSection
            v-if="stats.lastfm"
            id="music"
            key="music-section"
            title="MUSIC"
            class="break-inside-avoid"
          >
            <AsyncLastFmStats key="lastfm" :stats="stats.lastfm" />
          </StatsSection>

          <!-- Films -->
          <StatsSection
            v-if="stats.letterboxd?.stats"
            id="films"
            key="films-section"
            title="FILMS"
            class="break-inside-avoid"
          >
            <AsyncLetterboxdStats
              key="letterboxd"
              :letterboxd-stats="stats.letterboxd"
            />
          </StatsSection>

          <!-- Website Analytics -->
          <StatsSection
            v-if="stats.website?.stats"
            id="website"
            key="website-section"
            title="ANALYTICS"
            class="break-inside-avoid"
          >
            <AsyncUmamiStats key="umami" :umami-stats="stats.website" />
          </StatsSection>
        </TransitionGroup>
      </section>

      <!-- Full Width Sections -->
      <section class="col-span-full space-y-2 pt-12">
        <!-- Gear Stats -->
        <Transition name="fade-up" appear>
          <div id="gear" class="relative">
            <StatsSection title="GEAR">
              <AsyncGearStats :gear-stats="stats.gear" />
            </StatsSection>
          </div>
        </Transition>

        <!-- Health Stats - DISABLED: Network fetch failures -->
        <!-- <Transition name="fade-up" appear>
          <div v-if="stats.health" id="health" class="relative">
            <StatsSection title="HEALTH">
              <AsyncHealthStats :stats="transformedHealthStats" />
            </StatsSection>
          </div>
        </Transition> -->
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed as _computed, defineProps, defineAsyncComponent } from 'vue'
import {
  formatNumber as _formatNumber,
  formatPercent as _formatPercent
} from '~/composables/useNumberFormat'
const AsyncMonkeyTypeStats = defineAsyncComponent(
  () => import('~/components/stats/MonkeyTypeStats.vue')
)
const AsyncGitHubStats = defineAsyncComponent(
  () => import('~/components/stats/GitHubStats.vue')
)
const _AsyncPhotoStats = defineAsyncComponent(
  () => import('~/components/stats/PhotoStats.vue')
)
const _AsyncHealthStats = defineAsyncComponent(
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
const _AsyncSteamStats = defineAsyncComponent(
  () => import('~/components/stats/SteamStats.vue')
)
const AsyncGoodreadsStats = defineAsyncComponent(
  () => import('~/components/stats/GoodreadsStats.vue')
)
const AsyncGistStats = defineAsyncComponent(
  () => import('~/components/stats/GistStats.vue')
)
const AsyncUmamiStats = defineAsyncComponent(
  () => import('~/components/stats/UmamiStats.vue')
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
</style>
