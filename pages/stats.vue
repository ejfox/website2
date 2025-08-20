<template>
  <div class="font-mono overflow-hidden">
    <!-- Stats TOC - ClientOnly to fix SSR hydration -->
    <ClientOnly>
      <teleport v-if="tocTarget && !isSimpleMode" to="#nav-toc-container">
      <div class="py-4">
        <h3 class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-4">
          Stats Index
        </h3>
        <ul class="space-y-1">
          <li v-for="section in statsSections" :key="section.id">
            <a
              :href="`#${section.id}`"
              class="block py-1 text-sm font-mono uppercase tracking-wider transition-colors"
              :class="[
                activeSection === section.id
                  ? 'text-primary'
                  : 'text-muted hover-text'
              ]"
            >
              {{ section.text }}
            </a>
          </li>
        </ul>
      </div>
      </teleport>
    </ClientOnly>

    <!-- Simple Mode -->
    <section v-if="isSimpleMode" ref="sectionRef" class="space-y-2 text-xs">
      <!-- Minimal header -->
      <div
        ref="headerRef"
        class="flex justify-between items-center text-[10px] tracking-[0.2em] text-zinc-500 p-4"
      >
        <div>FOX_STATS</div>
        <div ref="progressRef">
          {{ displayDayOfYear }}/{{ daysInYear }}
        </div>
      </div>

      <!-- Dense stats layout -->
      <div class="space-y-4 p-4">
        <!-- Writing Stats -->
        <div v-if="validBlogStats" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            WRITING
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Posts</span>
              <span class="tabular-nums">{{ formatNumber(validBlogStats.totalPosts) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Words</span>
              <span class="tabular-nums">{{ formatNumber(validBlogStats.totalWords) }}</span>
            </div>
            <div class="flex justify-between">
              <span>This Month</span>
              <span class="tabular-nums">{{ formatNumber(validBlogStats.postsThisMonth) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Avg Words</span>
              <span class="tabular-nums">{{ formatNumber(validBlogStats.averageWords) }}</span>
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
              <span class="tabular-nums">{{ formatNumber(stats.monkeyType.typingStats.bestWPM) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tests</span>
              <span class="tabular-nums">{{ formatNumber(stats.monkeyType.typingStats.testsCompleted) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Accuracy</span>
              <span class="tabular-nums">{{ formatPercentage(stats.monkeyType.typingStats.bestAccuracy) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Consistency</span>
              <span class="tabular-nums">{{ formatPercentage(stats.monkeyType.typingStats.bestConsistency) }}</span>
            </div>
          </div>
        </div>

        <!-- GitHub Stats -->
        <div v-if="stats.github?.stats" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            GITHUB
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Contributions</span>
              <span class="tabular-nums">{{ formatNumber(stats.github.stats?.totalContributions || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Repos</span>
              <span class="tabular-nums">{{ formatNumber(stats.github.stats?.totalRepos || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Followers</span>
              <span class="tabular-nums">{{ formatNumber(stats.github.stats?.followers || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Following</span>
              <span class="tabular-nums">{{ formatNumber(stats.github.stats?.following || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- LeetCode Stats -->
        <div v-if="stats.leetcode?.submissionStats" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            LEETCODE
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Easy</span>
              <span class="tabular-nums">{{ formatNumber(stats.leetcode.submissionStats.easy.count) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Medium</span>
              <span class="tabular-nums">{{ formatNumber(stats.leetcode.submissionStats.medium.count) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Hard</span>
              <span class="tabular-nums">{{ formatNumber(stats.leetcode.submissionStats.hard.count) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total</span>
              <span class="tabular-nums">{{ formatNumber(stats.leetcode.submissionStats.easy.count + stats.leetcode.submissionStats.medium.count + stats.leetcode.submissionStats.hard.count) }}</span>
            </div>
          </div>
        </div>

        <!-- Chess Stats -->
        <div v-if="stats.chess" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            CHESS
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Blitz</span>
              <span class="tabular-nums">{{ formatNumber(stats.chess.currentRating.blitz) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Rapid</span>
              <span class="tabular-nums">{{ formatNumber(stats.chess.currentRating.rapid) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Bullet</span>
              <span class="tabular-nums">{{ formatNumber(stats.chess.currentRating.bullet) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Puzzles</span>
              <span class="tabular-nums">{{ formatNumber(stats.chess.puzzleStats.rating) }}</span>
            </div>
          </div>
        </div>

        <!-- Health Stats -->
        <div v-if="stats.health" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            HEALTH
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Steps Today</span>
              <span class="tabular-nums">{{ formatNumber(healthToday.steps) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Exercise</span>
              <span class="tabular-nums">{{ formatNumber(healthToday.exerciseMinutes) }}m</span>
            </div>
            <div class="flex justify-between">
              <span>Avg Steps</span>
              <span class="tabular-nums">{{ formatNumber(stats.health.averages?.dailySteps || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Heart Rate</span>
              <span class="tabular-nums">{{ formatNumber(stats.health.heartRate?.resting || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Photography Stats -->
        <div v-if="stats.photos?.stats" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            PHOTOGRAPHY
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Total</span>
              <span class="tabular-nums">{{ formatNumber(stats.photos.stats.totalPhotos) }}</span>
            </div>
            <div class="flex justify-between">
              <span>This Month</span>
              <span class="tabular-nums">{{ formatNumber(stats.photos.stats.photosThisMonth) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Avg/Month</span>
              <span class="tabular-nums">{{ formatDecimal(1)(stats.photos.stats.averagePerMonth) }}</span>
            </div>
          </div>
        </div>

        <!-- Productivity Stats -->
        <div v-if="stats.rescueTime?.week" class="space-y-1">
          <div class="text-[10px] tracking-[0.2em] text-zinc-500">
            PRODUCTIVITY
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Weekly</span>
              <span class="tabular-nums">{{ formatNumber(stats.rescueTime.week.summary.total.hours) }}h</span>
            </div>
            <div class="flex justify-between">
              <span>Productive</span>
              <span class="tabular-nums">{{ formatPercentage(stats.rescueTime.week.summary.productive.percentage) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Distracting</span>
              <span class="tabular-nums">{{ formatPercentage(stats.rescueTime.week.summary.distracting.percentage) }}</span>
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
              <span class="tabular-nums">{{ formatNumber(stats.lastfm.stats?.totalScrobbles || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Artists</span>
              <span class="tabular-nums">{{ formatNumber(stats.lastfm.stats?.uniqueArtists || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Daily Avg</span>
              <span class="tabular-nums">{{ formatDecimal(1)(stats.lastfm.stats?.averagePerDay || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tracks</span>
              <span class="tabular-nums">{{ formatNumber(stats.lastfm.stats?.uniqueTracks || 0) }}</span>
            </div>
          </div>
          <!-- Now Playing / Recent -->
          <div
            v-if="stats.lastfm.recentTracks?.tracks?.[0]"
            class="mt-2 text-[10px]"
          >
            <div class="flex items-baseline gap-2">
              <div class="text-zinc-500">
                NOW
              </div>
              <div class="truncate">
                {{ stats.lastfm.recentTracks.tracks[0].name }} -
                {{ stats.lastfm.recentTracks.tracks[0].artist?.name }}
              </div>
            </div>
          </div>

          <!-- Top Artists -->
          <div v-if="stats.lastfm.topArtists?.artists" class="mt-3">
            <div class="text-[10px] text-zinc-500 mb-1">
              TOP_ARTISTS
            </div>
            <div class="space-y-0.5">
              <div
                v-for="(artist, index) in stats.lastfm.topArtists.artists.slice(
                  0,
                  3
                )"
                :key="artist.name"
                class="flex items-baseline justify-between text-[10px]"
              >
                <div class="truncate">
                  {{ index + 1 }}. {{ artist.name }}
                </div>
                <div class="text-zinc-500 tabular-nums">
                  {{ formatNumber(artist.playcount) }}x
                </div>
              </div>
            </div>
          </div>

          <!-- Top Tracks -->
          <div v-if="stats.lastfm.topTracks?.tracks" class="mt-3">
            <div class="text-[10px] text-zinc-500 mb-1">
              TOP_TRACKS
            </div>
            <div class="space-y-0.5">
              <div
                v-for="(track, index) in stats.lastfm.topTracks.tracks.slice(
                  0,
                  3
                )"
                :key="track.name"
                class="flex items-baseline justify-between text-[10px]"
              >
                <div class="truncate">
                  {{ index + 1 }}. {{ track.name }}
                </div>
                <div class="text-zinc-500 tabular-nums">
                  {{ formatNumber(track.playcount) }}x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Full Mode (default) -->
    <div v-else class="relative overflow-hidden">
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
                  <AsyncTopStats :stats="stats" :blog-stats="validBlogStats" />
                </div>
              </Transition>
            </ClientOnly>
          </template>
        </Suspense>

        <!-- Main Stats Grid -->
        <section class="grid md:gap-4 lg:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 overflow-hidden pr-4 md:pr-8">
          <TransitionGroup name="fade-up" tag="div" class="contents" appear>
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

            <!-- Writing -->
            <StatsSection
              v-if="stats.blog"
              id="writing"
              key="writing-section"
              title="WRITING"
              class="break-inside-avoid"
            >
              <AsyncBlogStats key="blog" :stats="stats.blog" />
            </StatsSection>

            <!-- Reading -->
            <StatsSection
              v-if="stats.goodreads?.stats"
              id="reading"
              key="reading-section"
              title="READING"
              class="break-inside-avoid"
            >
              <AsyncGoodreadsStats key="goodreads" :data="stats.goodreads" />
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

            <!-- LeetCode -->
            <StatsSection
              v-if="stats.leetcode?.submissionStats && (stats.leetcode.submissionStats.easy.count > 0 || stats.leetcode.submissionStats.medium.count > 0 || stats.leetcode.submissionStats.hard.count > 0)"
              id="leetcode"
              key="leetcode-section"
              title="LEETCODE"
              class="break-inside-avoid"
            >
              <AsyncLeetCodeStats key="leetcode" :stats="stats.leetcode" />
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

            <!-- Typing -->
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

            <!-- Music -->
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
              <AsyncLetterboxdStats key="letterboxd" :letterboxd-stats="stats.letterboxd" />
            </StatsSection>

            <!-- Analytics -->
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
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  shallowRef,
  onMounted,
  nextTick,
  defineAsyncComponent
} from 'vue'
import { useRoute } from 'vue-router'
import { useStats } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { useNumberFormat } from '~/composables/useNumberFormat'

// Component imports
const StatsSection = defineAsyncComponent(
  () => import('~/components/stats/StatsSection.vue')
)
const AsyncTopStats = defineAsyncComponent(
  () => import('~/components/stats/TopStats.vue')
)
const AsyncGitHubStats = defineAsyncComponent(
  () => import('~/components/stats/GitHubStats.vue')
)
const AsyncBlogStats = defineAsyncComponent(
  () => import('~/components/stats/BlogStats.vue')
)
const AsyncGoodreadsStats = defineAsyncComponent(
  () => import('~/components/stats/GoodreadsStats.vue')
)
const AsyncRescueTimeStats = defineAsyncComponent(
  () => import('~/components/stats/RescueTimeStats.vue')
)
const AsyncLeetCodeStats = defineAsyncComponent(
  () => import('~/components/stats/LeetCodeStats.vue')
)
const AsyncChessStats = defineAsyncComponent(
  () => import('~/components/stats/ChessStats.vue')
)
const AsyncMonkeyTypeStats = defineAsyncComponent(
  () => import('~/components/stats/MonkeyTypeStats.vue')
)
const AsyncGistStats = defineAsyncComponent(
  () => import('~/components/stats/GistStats.vue')
)
const AsyncLastFmStats = defineAsyncComponent(
  () => import('~/components/stats/LastFmStats.vue')
)
const AsyncLetterboxdStats = defineAsyncComponent(
  () => import('~/components/stats/LetterboxdStats.vue')
)
const AsyncUmamiStats = defineAsyncComponent(
  () => import('~/components/stats/UmamiStats.vue')
)
const AsyncGearStats = defineAsyncComponent(
  () => import('~/components/stats/GearStats.vue')
)

const { stats: rawStats, isLoading, hasStaleData: _hasStaleData } = useStats()
const stats = computed(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()
const { formatNumber, formatDecimal, formatPercentage } = useNumberFormat()

// Simple mode refs
const sectionRef = ref(null)
const headerRef = ref(null)
const progressRef = ref(null)
const displayDayOfYear = ref(0)

// Calculate the day of year and year progress
const now = new Date()
const currentYear = now.getFullYear()
const startOfYear = new Date(currentYear, 0, 0)
const diff = now.getTime() - startOfYear.getTime()
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
const daysInYear = isLeapYear ? 366 : 365

// Blog stats calculation
const blogStats = ref<any>(null)
const cachedPosts = shallowRef<any[] | null>(null)

// DELETED: Heavy external service data - components load on-demand

onMounted(async () => {
  try {
    if (!cachedPosts.value) {
      const allPosts = await getAllPosts(false, false)
      cachedPosts.value = allPosts.filter((post) => {
        const slug = post?.slug || ''
        const type = post?.type || post?.metadata?.type
        const slugParts = slug.split('/')
        const lastPart = slugParts[slugParts.length - 1]

        const isWeekNote =
          type === 'weekNote' ||
          slug.startsWith('week-notes/') ||
          /^\d{4}-\d{2}$/.test(lastPart)
        const isRegularBlogPost = /^\d{4}\/[^/]+$/.test(slug)
        const isHidden =
          post?.hidden === true || post?.metadata?.hidden === true
        const isDraft = post?.draft === true || post?.metadata?.draft === true
        const postDate = post?.date || post?.metadata?.date
        const isFuturePost = postDate && new Date(postDate) > new Date()

        return (
          isRegularBlogPost &&
          !isWeekNote &&
          !isHidden &&
          !isDraft &&
          !isFuturePost
        )
      })
    }

    const posts = cachedPosts.value
    if (!posts?.length) {
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

    // Calculate blog statistics
    const allTags = new Set<string>()
    const tagCounts: Record<string, number> = {}
    const postsByMonth: Record<string, number> = {}
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { totalWords, wordCount, firstDate, lastDate } = posts.reduce(
      (acc: any, post: any) => {
        const postWordCount = post?.wordCount || post?.metadata?.words || 0
        const postDate = new Date(
          post?.date || post?.metadata?.date || new Date()
        )
        const month = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`

        if (!acc.firstDate || postDate < acc.firstDate) acc.firstDate = postDate
        if (!acc.lastDate || postDate > acc.lastDate) acc.lastDate = postDate

        postsByMonth[month] = (postsByMonth[month] || 0) + 1

        if (post?.metadata?.tags) {
          post.metadata.tags.forEach((tag: string) => {
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

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    blogStats.value = {
      totalPosts: posts.length,
      totalWords,
      averageWords: wordCount > 0 ? Math.round(totalWords / wordCount) : 0,
      firstPost: firstDate?.toISOString() || null,
      lastPost: lastDate?.toISOString() || null,
      postsThisMonth: postsByMonth[currentMonth] || 0,
      wordsThisMonth: 0,
      topTags,
      uniqueTags: allTags.size,
      averageReadingTime:
        wordCount > 0
          ? Math.round((totalWords / wordCount / 200) * 10) / 10
          : 0,
      postsByMonth
    }
  } catch (error) {
    console.error('Error calculating blog stats:', error)
  }

  // DELETED: Heavy external API calls that block performance
  // External data will be loaded on-demand by individual components
})

const validBlogStats = computed(() => blogStats.value || undefined)

// Health data transformation
const transformedHealthStats = computed(() => {
  if (!stats.value?.health) return null
  const healthData = JSON.parse(JSON.stringify(stats.value.health))

  if (healthData.dailyActivity && Array.isArray(healthData.dailyActivity)) {
    const weekMap = new Map()
    const sortedActivities = [...healthData.dailyActivity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    sortedActivities.forEach((day) => {
      if (!day.date) return
      const date = new Date(day.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          steps: 0,
          activeMinutes: 0,
          days: 0
        })
      }

      const weekData = weekMap.get(weekKey)
      weekData.steps += day.steps || 0
      weekData.activeMinutes += day.activeMinutes || 0
      weekData.days++
    })

    healthData.weeklyActivity = Array.from(weekMap.values())
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      .slice(0, 10)
  }

  return healthData
})

// TOC and navigation
const tocTarget = ref<Element | null>(null)
const activeSection = ref('overview')
const route = useRoute()
const isSimpleMode = computed(() => route.query.simple !== undefined)

const statsSections = [
  { id: 'overview', text: 'Overview' },
  { id: 'github', text: 'GitHub' },
  { id: 'writing', text: 'Writing' },
  { id: 'reading', text: 'Reading' },
  { id: 'productivity', text: 'Productivity' },
  { id: 'leetcode', text: 'LeetCode' },
  { id: 'chess', text: 'Chess' },
  { id: 'typing', text: 'Typing' },
  { id: 'gists', text: 'Code' },
  { id: 'music', text: 'Music' },
  { id: 'films', text: 'Films' },
  { id: 'website', text: 'Analytics' },
  { id: 'gear', text: 'Gear' }
]

onMounted(() => {
  // Initialize simple mode day progress
  displayDayOfYear.value = dayOfYear
  
  nextTick(() => {
    tocTarget.value = document.querySelector('#nav-toc-container')

    const headingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId =
              entry.target.id || entry.target.parentElement?.id || ''
            if (sectionId) activeSection.value = sectionId
          }
        })
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )

    statsSections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        headingObserver.observe(element)
        const heading = element.querySelector('h2')
        if (heading) headingObserver.observe(heading)
      }
    })
  })
})

// Health today calculation
const getEasternDateString = () => {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York'
  })
}
const todayLocal = getEasternDateString()

const healthToday = computed(() => {
  if (!stats.value?.health) return { steps: 0, exerciseMinutes: 0 }
  if (stats.value.health.trends?.daily?.dates) {
    const idx = stats.value.health.trends.daily.dates.indexOf(todayLocal)
    if (idx !== -1) {
      return {
        steps: stats.value.health.trends.daily.steps[idx] || 0,
        exerciseMinutes: stats.value.health.trends.daily.exercise[idx] || 0
      }
    }
  }
  return stats.value.health.today || { steps: 0, exerciseMinutes: 0 }
})

// Page meta
definePageMeta({
  layout: 'default'
})

// SEO
useHead({
  title: 'Stats - EJ Fox',
  meta: [
    {
      name: 'description',
      content: 'Stats'
    },
    {
      property: 'og:title',
      content: 'Stats'
    },
    {
      property: 'og:description',
      content: 'Stats'
    },
    {
      name: 'twitter:title',
      content: 'Stats'
    },
    {
      name: 'twitter:description',
      content: 'Stats'
    }
  ]
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Dense mode specific styles */
.tabular-nums {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
