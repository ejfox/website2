<template>
  <div
    :class="[
      isSimpleMode ? 'p-0' : 'max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16',
      'font-mono'
    ]"
  >
    <!-- Stats TOC -->
    <teleport to="#nav-toc-container" v-if="tocTarget && !isSimpleMode">
      <div class="toc py-2 text-sm font-mono px-4">
        <h3 class="text-xs tracking-[0.2em] font-mono text-zinc-500 mb-3">
          STATS INDEX
        </h3>
        <ul class="space-y-2">
          <li
            v-for="section in statsSections"
            :key="section.id"
            class="transition-colors duration-200"
          >
            <a
              :href="`#${section.id}`"
              class="block py-0.5 transition-colors text-xs tracking-wider"
              :class="[
                activeSection === section.id
                  ? 'text-zinc-100 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 dark:hover:text-zinc-300'
              ]"
            >
              {{ section.text }}
            </a>
          </li>
        </ul>
      </div>
    </teleport>

    <section :class="[isSimpleMode ? 'space-y-4' : 'space-y-16 sm:space-y-24']">
      <!-- Header -->
      <header v-if="!isSimpleMode" class="flex justify-between items-center">
        <h1 class="text-xs tracking-[0.2em] font-mono text-zinc-500">
          FOX_ANNUAL_REPORT :: {{ currentYear }}
          {{ isSimpleMode ? ':: SIMPLE' : '' }}
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
                <AsyncTopStats :stats="stats" :blog-stats="validBlogStats" />
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

      <!-- Main Stats Grid - Only show if not in simple mode -->
      <ClientOnly>
        <section v-if="!isLoading && stats && !isSimpleMode">
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
                  <StatsSection id="typing" title="TYPING" key="typing-section">
                    <AsyncMonkeyTypeStats
                      v-if="stats.monkeyType?.typingStats"
                      :stats="{ typingStats: stats.monkeyType.typingStats }"
                      key="monkeytype"
                    />
                    <div v-else class="data-unavailable">
                      TYPING_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>

                  <!-- GitHub -->
                  <StatsSection
                    v-if="hasGithubData"
                    id="github"
                    title="GITHUB"
                    key="github-section"
                  >
                    <AsyncGitHubStats
                      v-if="stats.github"
                      :stats="stats.github"
                      key="github"
                    />
                    <div v-else class="data-unavailable">
                      GITHUB_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>

                  <!-- LeetCode -->
                  <StatsSection
                    v-if="hasLeetCodeData"
                    id="leetcode"
                    title="LEETCODE"
                    key="leetcode-section"
                  >
                    <AsyncLeetCodeStats
                      v-if="stats.leetcode"
                      :stats="stats.leetcode"
                      key="leetcode"
                    />
                    <div v-else class="data-unavailable">
                      LEETCODE_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>
                </div>
              </div>
            </div>

            <!-- Right Column: Creative & Lifestyle -->
            <div class="stats-column" key="creative-column">
              <div class="relative">
                <div class="stats-vertical-divider"></div>
                <div class="space-y-16">
                  <!-- Photography -->
                  <StatsSection
                    v-if="hasPhotoData"
                    id="photography"
                    title="PHOTOGRAPHY"
                    key="photography-section"
                  >
                    <AsyncPhotoStats
                      v-if="stats.photos"
                      :stats="stats.photos"
                      key="photos"
                    />
                    <div v-else class="data-unavailable">
                      PHOTO_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>

                  <!-- Chess -->
                  <StatsSection
                    v-if="hasChessData"
                    id="chess"
                    title="CHESS"
                    key="chess-section"
                  >
                    <AsyncChessStats
                      v-if="stats.chess"
                      :stats="stats.chess"
                      key="chess"
                    />
                    <div v-else class="data-unavailable">
                      CHESS_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>

                  <!-- Productivity -->
                  <StatsSection
                    v-if="hasRescueTimeData"
                    id="productivity"
                    title="PRODUCTIVITY"
                    key="productivity-section"
                  >
                    <AsyncRescueTimeStats :stats="stats" key="rescuetime" />
                  </StatsSection>

                  <!-- Last.fm -->
                  <StatsSection
                    v-if="hasLastFmData"
                    id="lastfm"
                    title="MUSIC"
                    key="lastfm-section"
                  >
                    <AsyncLastFmStats
                      v-if="stats.lastfm"
                      :stats="stats.lastfm"
                      key="lastfm"
                    />
                    <div v-else class="data-unavailable">
                      LASTFM_DATA_UNAVAILABLE
                    </div>
                  </StatsSection>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </section>
        <section
          v-else-if="!isLoading && stats && isSimpleMode"
          class="space-y-2 text-xs"
        >
          <!-- Minimal header -->
          <div
            class="flex justify-between items-center text-[10px] tracking-[0.2em] text-zinc-500 mb-4"
          >
            <div>FOX_STATS</div>
            <div>{{ dayOfYear }}/{{ daysInYear }}</div>
          </div>

          <!-- Dense stats layout -->
          <div class="space-y-4">
            <!-- Writing Stats -->
            <div v-if="blogStats" class="space-y-1">
              <div class="text-[10px] tracking-[0.2em] text-zinc-500">
                WRITING
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div class="flex justify-between">
                  <span>Posts</span>
                  <span class="tabular-nums">{{ blogStats.totalPosts }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Words</span>
                  <span class="tabular-nums">{{
                    blogStats.totalWords.toLocaleString()
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>This Month</span>
                  <span class="tabular-nums">{{
                    blogStats.postsThisMonth
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Avg Words</span>
                  <span class="tabular-nums">{{ blogStats.averageWords }}</span>
                </div>
              </div>
            </div>

            <!-- Typing Stats -->
            <div v-if="stats.monkeyType?.typingStats" class="space-y-1">
              <div class="text-[10px] tracking-[0.2em] text-zinc-500">
                TYPING
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div class="flex justify-between">
                  <span>Best WPM</span>
                  <span class="tabular-nums">{{
                    stats.monkeyType.typingStats.bestWPM
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Tests</span>
                  <span class="tabular-nums">{{
                    stats.monkeyType.typingStats.testsCompleted
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Accuracy</span>
                  <span class="tabular-nums"
                    >{{ stats.monkeyType.typingStats.bestAccuracy }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span>Consistency</span>
                  <span class="tabular-nums"
                    >{{ stats.monkeyType.typingStats.bestConsistency }}%</span
                  >
                </div>
              </div>
            </div>

            <!-- GitHub Stats -->
            <div v-if="stats.github" class="space-y-1">
              <div class="text-[10px] tracking-[0.2em] text-zinc-500">
                GITHUB
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div class="flex justify-between">
                  <span>Contributions</span>
                  <span class="tabular-nums">{{
                    stats.github.stats?.totalContributions || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Repos</span>
                  <span class="tabular-nums">{{
                    stats.github.stats?.totalRepos || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Followers</span>
                  <span class="tabular-nums">{{
                    stats.github.stats?.followers || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Following</span>
                  <span class="tabular-nums">{{
                    stats.github.stats?.following || 0
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Last.fm Stats -->
            <div v-if="stats.lastfm" class="space-y-1">
              <div class="text-[10px] tracking-[0.2em] text-zinc-500">
                MUSIC
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div class="flex justify-between">
                  <span>Scrobbles</span>
                  <span class="tabular-nums">{{
                    stats.lastfm.stats?.totalScrobbles || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Artists</span>
                  <span class="tabular-nums">{{
                    stats.lastfm.stats?.uniqueArtists || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Daily Avg</span>
                  <span class="tabular-nums">{{
                    stats.lastfm.stats?.averagePerDay?.toFixed(1) || 0
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Tracks</span>
                  <span class="tabular-nums">{{
                    stats.lastfm.stats?.uniqueTracks || 0
                  }}</span>
                </div>
              </div>
              <!-- Now Playing / Recent -->
              <div
                v-if="stats.lastfm.recentTracks?.tracks?.[0]"
                class="mt-2 text-[10px]"
              >
                <div class="flex items-baseline gap-2">
                  <div class="text-zinc-500">NOW</div>
                  <div class="truncate">
                    {{ stats.lastfm.recentTracks.tracks[0].name }} -
                    {{ stats.lastfm.recentTracks.tracks[0].artist?.name }}
                  </div>
                </div>
              </div>

              <!-- Top Artists -->
              <div v-if="stats.lastfm.topArtists?.artists" class="mt-3">
                <div class="text-[10px] text-zinc-500 mb-1">TOP_ARTISTS</div>
                <div class="space-y-0.5">
                  <div
                    v-for="(
                      artist, index
                    ) in stats.lastfm.topArtists.artists.slice(0, 3)"
                    :key="artist.name"
                    class="flex items-baseline justify-between text-[10px]"
                  >
                    <div class="truncate">
                      {{ index + 1 }}. {{ artist.name }}
                    </div>
                    <div class="text-zinc-500 tabular-nums">
                      {{ artist.playcount }}x
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Tracks -->
              <div v-if="stats.lastfm.topTracks?.tracks" class="mt-3">
                <div class="text-[10px] text-zinc-500 mb-1">TOP_TRACKS</div>
                <div class="space-y-0.5">
                  <div
                    v-for="(
                      track, index
                    ) in stats.lastfm.topTracks.tracks.slice(0, 3)"
                    :key="track.name"
                    class="flex items-baseline justify-between text-[10px]"
                  >
                    <div class="truncate">
                      {{ index + 1 }}. {{ track.name }}
                    </div>
                    <div class="text-zinc-500 tabular-nums">
                      {{ track.playcount }}x
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section v-else class="stats-grid">
          <div class="stats-column">
            <div v-for="i in 3" :key="i" class="space-y-4">
              <div class="pulse-placeholder pulse-placeholder-text"></div>
              <div class="pulse-placeholder pulse-placeholder-md"></div>
            </div>
          </div>
          <div class="stats-column">
            <div v-for="i in 3" :key="i" class="space-y-4">
              <div class="pulse-placeholder pulse-placeholder-text"></div>
              <div class="pulse-placeholder pulse-placeholder-md"></div>
            </div>
          </div>
        </section>
      </ClientOnly>

      <!-- Gear Stats - Only show in full mode -->
      <ClientOnly>
        <Transition name="fade-up" appear>
          <section v-if="true && !isSimpleMode" class="relative" id="gear">
            <div class="pt-16 sm:pt-24">
              <StatsSection title="GEAR">
                <AsyncGearStats />
              </StatsSection>
            </div>
          </section>
        </Transition>
      </ClientOnly>

      <!-- Health Stats - Only show in full mode -->
      <ClientOnly>
        <Transition name="fade-up" appear>
          <section
            v-if="hasHealthData && stats.health && !isSimpleMode"
            class="relative"
            id="health"
          >
            <div class="pt-16 sm:pt-24">
              <StatsSection title="HEALTH">
                <AsyncHealthStats :stats="transformedHealthStats" />
              </StatsSection>
            </div>
          </section>
          <section
            v-else-if="hasHealthData && !isSimpleMode"
            class="relative"
            id="health"
          >
            <div class="pt-16 sm:pt-24">
              <StatsSection title="HEALTH">
                <div class="data-unavailable">HEALTH_DATA_UNAVAILABLE</div>
              </StatsSection>
            </div>
          </section>
        </Transition>
      </ClientOnly>
    </section>

    <!-- Status Indicator -->
    <Transition name="fade">
      <div
        v-if="hasStaleData && !isSimpleMode"
        class="fixed bottom-4 right-4 p-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 font-mono"
      >
        <div
          class="flex items-center gap-2 text-zinc-500 text-xs tracking-wider"
        >
          <UIcon name="i-heroicons-clock" class="w-3 h-3" />
          <span>CACHED_DATA</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  shallowRef,
  onMounted,
  defineAsyncComponent,
  nextTick
} from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useStats } from '~/composables/useStats'
import type { StatsResponse } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

// Component imports with prefetch hints and loading optimization
const AsyncMonkeyTypeStats = defineAsyncComponent(
  () =>
    import('~/components/stats/MonkeyTypeStats.vue' /* webpackPrefetch: true */)
)
const AsyncGitHubStats = defineAsyncComponent(
  () => import('~/components/stats/GitHubStats.vue' /* webpackPrefetch: true */)
)
const AsyncPhotoStats = defineAsyncComponent(
  () => import('~/components/stats/PhotoStats.vue' /* webpackPrefetch: true */)
)
const AsyncHealthStats = defineAsyncComponent(
  () => import('~/components/stats/HealthStats.vue' /* webpackPrefetch: true */)
)
const AsyncLeetCodeStats = defineAsyncComponent(
  () =>
    import('~/components/stats/LeetCodeStats.vue' /* webpackPrefetch: true */)
)
const AsyncBlogStats = defineAsyncComponent(
  () => import('~/components/stats/BlogStats.vue' /* webpackPrefetch: true */)
)
const AsyncTopStats = defineAsyncComponent(
  () => import('~/components/stats/TopStats.vue' /* webpackPrefetch: true */)
)
const AsyncChessStats = defineAsyncComponent(
  () => import('~/components/stats/ChessStats.vue' /* webpackPrefetch: true */)
)
const AsyncRescueTimeStats = defineAsyncComponent(
  () =>
    import('~/components/stats/RescueTimeStats.vue' /* webpackPrefetch: true */)
)
const AsyncGearStats = defineAsyncComponent(
  () => import('~/components/stats/GearStats.vue' /* webpackPrefetch: true */)
)
const AsyncLastFmStats = defineAsyncComponent(
  () => import('~/components/stats/LastFmStats.vue' /* webpackPrefetch: true */)
)

interface BlogPost {
  wordCount?: number
  date?: string | Date
  slug?: string
  metadata?: {
    words?: number
    title?: string
    date?: string | Date
    tags?: string[]
    reading_time?: number
  }
}

interface BlogStats {
  totalPosts: number
  totalWords: number
  averageWords: number
  firstPost: string | null
  lastPost: string | null
  postsThisMonth: number
  wordsThisMonth: number
  topTags: string[]
  uniqueTags: number
  averageReadingTime: number
  postsByMonth: Record<string, number>
}

const { stats: rawStats, isLoading, hasStaleData } = useStats()
const stats = computed<StatsResponse>(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()

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

// Data availability checks
const hasMonkeyTypeData = computed(() => {
  // Always show the typing section in the UI
  return true
})
const hasGithubData = computed(() => !!stats.value?.github?.stats)
const hasPhotoData = computed(() => !!stats.value?.photos?.stats)
const hasHealthData = computed(() => !!stats.value?.health)
const hasLeetCodeData = computed(() => !!stats.value?.leetcode?.submissionStats)
const hasChessData = computed(() => !!stats.value?.chess)
const hasRescueTimeData = computed(() => !!stats.value?.rescueTime)
const hasLastFmData = computed(() => !!stats.value?.lastfm)

// Blog stats
const blogStats = ref<BlogStats | null>(null)

// Health data transformation for weekly views
const transformedHealthStats = computed(() => {
  if (!stats.value?.health) return null

  // Create a deep copy of health data to avoid mutating the original
  const healthData = JSON.parse(JSON.stringify(stats.value.health))

  // Calculate weekly step totals if daily steps exist
  if (healthData.dailyActivity && Array.isArray(healthData.dailyActivity)) {
    const weekMap = new Map()
    const monthMap = new Map()

    // Sort activities by date
    const sortedActivities = [...healthData.dailyActivity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Group steps by week
    sortedActivities.forEach((day) => {
      if (!day.date) return

      const date = new Date(day.date)

      // Get the start of the week (Sunday)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      // Get the month
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      // Initialize week data if needed
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          steps: 0,
          activeMinutes: 0,
          days: 0,
          caloriesBurned: 0,
          distance: 0
        })
      }

      // Initialize month data if needed
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthKey,
          steps: 0,
          activeMinutes: 0,
          days: 0
        })
      }

      // Add data to weekly aggregation
      const weekData = weekMap.get(weekKey)
      weekData.steps += day.steps || 0
      weekData.activeMinutes += day.activeMinutes || 0
      weekData.caloriesBurned += day.caloriesBurned || 0
      weekData.distance += day.distance || 0
      weekData.days++

      // Add data to monthly aggregation
      const monthData = monthMap.get(monthKey)
      monthData.steps += day.steps || 0
      monthData.activeMinutes += day.activeMinutes || 0
      monthData.days++
    })

    // Convert maps to arrays and sort by date (most recent first)
    healthData.weeklyActivity = Array.from(weekMap.values()).sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )

    healthData.monthlyActivity = Array.from(monthMap.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    )

    // Keep only the most recent 10 weeks/4 months for display
    healthData.weeklyActivity = healthData.weeklyActivity.slice(0, 10)
    healthData.monthlyActivity = healthData.monthlyActivity.slice(0, 4)

    // Calculate stats for current week
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisWeekKey = thisWeekStart.toISOString().split('T')[0]

    // If we have current week data, make it easily accessible
    if (weekMap.has(thisWeekKey)) {
      healthData.thisWeek = weekMap.get(thisWeekKey)
    }
  }

  return healthData
})

// Cache the blog posts data
const cachedPosts = shallowRef<BlogPost[] | null>(null)

// Debug flag to enable console logs
const DEBUG_BLOG_STATS = false

// Optimize blog stats calculation
onMounted(async () => {
  try {
    console.log('Starting blog stats calculation')

    if (!cachedPosts.value) {
      console.log('Fetching blog posts')
      // Get all posts including drafts for a complete word count
      cachedPosts.value = await getAllPosts(true, true)
      if (DEBUG_BLOG_STATS) {
        console.log(
          `Fetched ${cachedPosts.value?.length || 0} posts`,
          cachedPosts.value?.[0]
            ? {
                sampleSlug: cachedPosts.value[0].slug,
                wordCount: cachedPosts.value[0].wordCount,
                words: cachedPosts.value[0].metadata?.words
              }
            : 'No posts found'
        )
      }
    }

    const posts = cachedPosts.value
    if (!posts?.length) {
      console.warn('No blog posts found')
      blogStats.value = {
        totalPosts: 0,
        totalWords: 0,
        averageWords: 0,
        firstPost: null,
        lastPost: null,
        postsThisMonth: 0,
        wordsThisMonth: 0,
        topTags: [],
        uniqueTags: 0,
        averageReadingTime: 0,
        postsByMonth: {}
      }
      return
    }

    // Extract tags, months, and calculate word counts
    const allTags = new Set<string>()
    const tagCounts: Record<string, number> = {}
    const postsByMonth: Record<string, number> = {}
    const wordsByMonth: Record<string, number> = {}

    // Get current month in YYYY-MM format
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Use a single reduce operation to extract all metrics
    const { totalWords, wordCount, firstDate, lastDate } = posts.reduce(
      (
        acc: {
          totalWords: number
          wordCount: number
          firstDate: Date | null
          lastDate: Date | null
        },
        post
      ) => {
        // Get word count from either post.wordCount or post.metadata.words
        const postWordCount = post?.wordCount || post?.metadata?.words || 0

        // Extract date information
        const postDate = new Date(
          post?.date || post?.metadata?.date || new Date()
        )
        const month = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`

        // Update first/last post dates
        if (!acc.firstDate || postDate < acc.firstDate) {
          acc.firstDate = postDate
        }
        if (!acc.lastDate || postDate > acc.lastDate) {
          acc.lastDate = postDate
        }

        // Track posts and words by month
        postsByMonth[month] = (postsByMonth[month] || 0) + 1
        wordsByMonth[month] = (wordsByMonth[month] || 0) + postWordCount

        // Extract and count tags
        if (post?.metadata?.tags) {
          post.metadata.tags.forEach((tag) => {
            allTags.add(tag)
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }

        return {
          totalWords: acc.totalWords + postWordCount,
          wordCount: acc.wordCount + (postWordCount > 0 ? 1 : 0),
          firstDate: acc.firstDate,
          lastDate: acc.lastDate
        }
      },
      { totalWords: 0, wordCount: 0, firstDate: null, lastDate: null }
    )

    // Calculate average reading time (assuming 200 words per minute)
    const averageReadingTime =
      wordCount > 0 ? Math.round((totalWords / wordCount / 200) * 10) / 10 : 0

    // Get the top tags sorted by frequency
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    if (DEBUG_BLOG_STATS) {
      console.log('Blog stats calculation complete:', {
        totalPosts: posts.length,
        totalWords,
        wordCount,
        topTags,
        postsByMonth: Object.keys(postsByMonth).length,
        uniqueTags: allTags.size
      })
    }

    blogStats.value = {
      totalPosts: posts.length,
      totalWords,
      averageWords: wordCount > 0 ? Math.round(totalWords / wordCount) : 0,
      firstPost: firstDate?.toISOString() || null,
      lastPost: lastDate?.toISOString() || null,
      postsThisMonth: postsByMonth[currentMonth] || 0,
      wordsThisMonth: wordsByMonth[currentMonth] || 0,
      topTags,
      uniqueTags: allTags.size,
      averageReadingTime,
      postsByMonth
    }
  } catch (error) {
    console.error('Error calculating blog stats:', error)
    blogStats.value = {
      totalPosts: 0,
      totalWords: 0,
      averageWords: 0,
      firstPost: null,
      lastPost: null,
      postsThisMonth: 0,
      wordsThisMonth: 0,
      topTags: [],
      uniqueTags: 0,
      averageReadingTime: 0,
      postsByMonth: {}
    }
  }
})

const validBlogStats = computed(() => blogStats.value || undefined)

// Table of Contents for Stats page
const tocTarget = ref<Element | null>(null)
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 1024) // Match the lg breakpoint

onMounted(() => {
  tocTarget.value = document.querySelector('#nav-toc-container')
})

// Define the sections for the TOC
const statsSections = [
  { id: 'top-stats', text: 'OVERVIEW' },
  { id: 'writing', text: 'WRITING' },
  { id: 'typing', text: 'TYPING' },
  { id: 'github', text: 'GITHUB' },
  { id: 'leetcode', text: 'LEETCODE' },
  { id: 'photography', text: 'PHOTOGRAPHY' },
  { id: 'chess', text: 'CHESS' },
  { id: 'productivity', text: 'PRODUCTIVITY' },
  { id: 'gear', text: 'GEAR' },
  { id: 'health', text: 'HEALTH' },
  { id: 'lastfm', text: 'MUSIC' }
]

// Track active section
const activeSection = ref('top-stats')

// Observer for section headings
onMounted(() => {
  nextTick(() => {
    // First, make sure we have the TOC target
    tocTarget.value = document.querySelector('#nav-toc-container')

    // Then set up the observer
    const headingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Extract section ID from the heading or its parent
            const sectionId =
              entry.target.id || entry.target.parentElement?.id || ''
            if (sectionId) {
              activeSection.value = sectionId
              console.log('Active section:', sectionId)
            }
          }
        })
      },
      { rootMargin: '-5% 0px -80% 0px', threshold: 0 }
    )

    // Observe all section headings and their containers
    statsSections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        headingObserver.observe(element)

        // Also observe the heading inside the section if it exists
        const heading = element.querySelector('h2')
        if (heading) {
          headingObserver.observe(heading)
        }
      }
    })

    return () => {
      headingObserver.disconnect()
    }
  })
})

// Add route with proper typing
const route = useRoute()

// Add simple mode computed property with proper typing
const isSimpleMode = computed<boolean>(() => route.query.simple !== undefined)
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
section > * + * {
  margin-top: theme('spacing.16');
}

@screen sm {
  section > * + * {
    margin-top: theme('spacing.24');
  }
}

/* Typography refinements */
h1,
h2 {
  font-feature-settings: 'tnum', 'zero';
}

/* Common styles using @apply */
.pulse-placeholder {
  @apply animate-pulse bg-zinc-900/50 rounded-none border border-zinc-800/50;
}

.pulse-placeholder-lg {
  @apply h-32;
}

.pulse-placeholder-md {
  @apply h-24;
}

.pulse-placeholder-sm {
  @apply h-16;
}

.pulse-placeholder-text {
  @apply h-4 max-w-[80%];
}

.stats-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24;
}

.stats-column {
  @apply space-y-16 sm:space-y-24;
}

.stats-vertical-divider {
  @apply absolute -left-8 sm:-left-16 top-0 h-full w-px bg-gradient-to-b from-zinc-800/0 via-zinc-800/50 to-zinc-800/0;
}

.data-unavailable {
  @apply text-sm text-zinc-400 font-mono;
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
  background: linear-gradient(
    to bottom,
    transparent,
    rgb(39 39 42 / 0.5),
    transparent
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

/* Dense mode specific styles */
.tabular-nums {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
