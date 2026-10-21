<!-- eslint-disable max-len -->
<script setup lang="ts">
import { useIntersectionObserver, useNow } from '@vueuse/core'
// Import above-fold stats components eagerly
import StatSection from '~/components/stats/StatSection.vue'
import TopStats from '~/components/stats/TopStats.vue'
import StatsSectionSkeleton from '~/components/stats/StatsSectionSkeleton.vue'
import { postFilters } from '~/utils/postFilters'
import { buildStatsSummary } from '~/utils/statsSummary'

// Every stat section is server-rendered in full (no layout shift, readable
// with JS off), but its JavaScript only hydrates when it scrolls into view.
// Hydrating all 14 up front cost ~1s of main thread on mobile, for sections
// most visitors never reach. Plain displays, so nothing is lost meanwhile.
const GitHubStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/GitHubStats.vue')
)
const BlogStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/BlogStats.vue')
)
const GoodreadsStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/GoodreadsStats.vue')
)
const RescueTimeStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/RescueTimeStats.vue')
)
const ChessStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/ChessStats.vue')
)
const MonkeyTypeStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/MonkeyTypeStats.vue')
)
const DuolingoStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/DuolingoStats.vue')
)
const LeetCodeStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/LeetCodeStats.vue')
)
const GistStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/GistStats.vue')
)
const LastFmStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/LastFmStats.vue')
)
const LetterboxdStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/LetterboxdStats.vue')
)
const UmamiStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/UmamiStats.vue')
)
const GearStats = defineLazyHydrationComponent(
  'visible',
  () => import('~/components/stats/GearStats.vue')
)

const GithubCommitMatrix = defineAsyncComponent(
  () => import('~/components/github/CommitMatrix.client.vue')
)

// Define stats first - used by computed properties below
const {
  stats: rawStats,
  liteStats,
  isLoading,
  errors,
} = useStats({
  server: true,
})

// Live in place: refetch while visible; flash sections whose data changed.
const { flashing } = useLiveStats(rawStats)
provide('statsFlashing', flashing)
const clock = useNow({ interval: 30_000 })
// Client-only (rendered in <ClientOnly>): relative time would mismatch SSR.
const asOf = computed(() => {
  const g = rawStats.value?.generated
  if (!g) return ''
  const mins = Math.round(
    (clock.value.getTime() - new Date(g).getTime()) / 60000
  )
  return mins < 1 ? 'just now' : `${mins} min ago`
})

// Skeleton sections. liteKey/liteLabel pull a real top-line number from
// /api/stats-lite (lands in tens of ms) into the skeleton while the full
// aggregate loads — partial data over gray boxes.
const loadingSectionDefs = [
  {
    title: 'GITHUB',
    rows: 4,
    liteKey: 'githubContributionsAllTime',
    liteLabel: 'contributions',
  },
  { title: 'CODE', rows: 3 },
  { title: 'LEETCODE', rows: 3 },
  { title: 'TYPING', rows: 4 },
  {
    title: 'CHESS',
    rows: 3,
    liteKey: 'chessRatingBlitz',
    liteLabel: 'blitz rating',
  },
  {
    title: 'WRITING',
    rows: 4,
    liteKey: 'blogPostsAllTime',
    liteLabel: 'posts all time',
  },
  {
    title: 'PRODUCTIVITY',
    rows: 4,
    liteKey: 'rescueTimeLast7dHours',
    liteLabel: 'hours tracked · 7d',
  },
  { title: 'LANGUAGES', rows: 3 },
  {
    title: 'MUSIC',
    rows: 4,
    liteKey: 'musicScrobblesAllTime',
    liteLabel: 'scrobbles all time',
  },
  {
    title: 'FILMS',
    rows: 3,
    liteKey: 'letterboxdFilmsAllTime',
    liteLabel: 'films logged',
  },
  { title: 'BOOKS', rows: 4 },
  {
    title: 'ANALYTICS',
    rows: 3,
    liteKey: 'websitePageviewsCalMonth',
    liteLabel: 'pageviews this month',
  },
]
const loadingSections = computed(() =>
  loadingSectionDefs.map((s) => ({
    ...s,
    // Falsy lite values (0 = the upstream service had no token/data) fall
    // back to the plain skeleton — an untrue zero is worse than a shimmer.
    liteValue: s.liteKey ? liteStats.value?.[s.liteKey] || null : null,
  }))
)
const stats = computed(() => rawStats.value)

const statsDescription = computed(() => {
  const s = stats.value
  if (!s)
    return 'Live personal metrics from GitHub, Chess.com, Monkeytype, Last.fm, and writing output.'

  const parts = []
  if (s.github?.stats?.totalCommits)
    parts.push(`${s.github.stats.totalCommits} commits`)
  if (s.chess?.currentRating?.blitz)
    parts.push(`${s.chess.currentRating.blitz} chess`)
  if (s.monkeyType?.typingStats?.averageWpm)
    parts.push(`${Math.round(s.monkeyType.typingStats.averageWpm)}wpm typing`)
  const leetcodeSolved =
    (s.leetcode?.submissionStats?.easy?.count || 0) +
    (s.leetcode?.submissionStats?.medium?.count || 0) +
    (s.leetcode?.submissionStats?.hard?.count || 0)
  if (leetcodeSolved) parts.push(`${leetcodeSolved} problems`)
  if (s.blog?.posts?.total) parts.push(`${s.blog.posts.total} posts`)

  return parts.length > 0
    ? `${parts.join(' • ')} — GitHub, Chess.com, Monkeytype, Last.fm, RescueTime`
    : 'Live personal metrics from GitHub, Chess.com, Monkeytype, Last.fm, and writing output.'
})

const statsUpdated = computed(() => {
  const dates: number[] = []
  const s = stats.value
  if (!s) return ''
  const lastCommit = s.github?.detail?.commits?.[0]?.occurredAt
  if (lastCommit) dates.push(new Date(lastCommit).getTime())
  if (s.chess?.lastUpdated) dates.push(new Date(s.chess.lastUpdated).getTime())
  if (s.monkeyType?.lastUpdated)
    dates.push(new Date(s.monkeyType.lastUpdated).getTime())
  if (s.lastfm?.lastUpdated)
    dates.push(new Date(s.lastfm.lastUpdated).getTime())
  if (!dates.length) return ''
  return new Date(Math.max(...dates)).toISOString().split('T')[0]
})
usePageSeo({
  title: 'Stats · EJ Fox',
  description: computed(() => statsDescription.value),
  type: 'website',
  section: 'Meta',
  tags: ['Personal analytics', 'Writing stats', 'Typing speed', 'GitHub'],
  label1: 'Writing output',
  data1: computed(() => {
    const avgWords = stats.value?.blog?.words?.avgPerPost || 0
    const postCount = stats.value?.blog?.posts?.total || 0
    const words = avgWords * postCount
    const posts = postCount
    const wordsFormatted = new Intl.NumberFormat('en-US').format(words)
    return `${posts} posts · ${wordsFormatted} words`
  }),
  label2: 'Live signals',
  data2: computed(() => {
    const parts = []
    if (stats.value?.monkeyType?.typingStats?.averageWpm) {
      parts.push(
        `${Math.round(stats.value.monkeyType.typingStats.averageWpm)} wpm typing`
      )
    }
    if (stats.value?.github?.stats?.totalCommits) {
      parts.push(`${stats.value.github.stats.totalCommits} commits`)
    }
    return parts.join(' • ') || 'Updating in real time'
  }),
})

const route = useRoute()

const { getAllPosts } = useProcessedMarkdown()
const { formatNumber } = numberFormat()
const { isValidPost } = postFilters()

// Load all commits for the matrix visualization (below-the-fold, ~700KB).
// Client-only, and only once the art piece is ~1 screen away: most visitors
// never scroll that far, and every visit used to download and parse it.
const { data: allCommitsData, execute: loadCommits } = useFetch(
  '/api/github-commits',
  { lazy: true, server: false, immediate: false }
)
const commitsArt = ref<HTMLElement | null>(null)
const { stop: stopCommitsWatch } = useIntersectionObserver(
  commitsArt,
  ([entry]) => {
    if (!entry?.isIntersecting) return
    stopCommitsWatch()
    loadCommits()
  },
  { rootMargin: '800px 0px' }
)
const allCommits = computed(() => allCommitsData.value || [])

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
const isLeapYear =
  (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
const daysInYear = isLeapYear ? 366 : 365

// Blog stats calculation
interface BlogStatsData {
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
const blogStats = ref<BlogStatsData | null>(null)
const cachedPosts = shallowRef<any[] | null>(null)

// DELETED: Heavy external service data - components load on-demand

// Helper function to format date to YYYY-MM
const formatDateToMonth = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    if (!cachedPosts.value) {
      const allPosts = await getAllPosts(false)
      cachedPosts.value = allPosts.filter((post) => isValidPost(post))
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
        postsByMonth: {},
      }
      return
    }

    // Calculate blog statistics
    const allTags = new Set<string>()
    const tagCounts: Record<string, number> = {}
    const postsByMonth: Record<string, number> = {}
    const now = new Date()
    const currentMonth = formatDateToMonth(now)

    interface BlogPost {
      wordCount?: number
      date?: string
      metadata?: {
        words?: number
        date?: string
        tags?: string[]
      }
    }

    interface BlogAccumulator {
      totalWords: number
      wordCount: number
      firstDate: Date | null
      lastDate: Date | null
    }

    const { totalWords, wordCount, firstDate, lastDate } = posts.reduce(
      (acc: BlogAccumulator, post: BlogPost) => {
        const postWordCount = post?.wordCount || post?.metadata?.words || 0
        const postDate = new Date(
          post?.date || post?.metadata?.date || new Date()
        )
        const month = formatDateToMonth(postDate)

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
          lastDate: acc.lastDate,
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
      postsByMonth,
    }
  } catch (error) {
    console.error('Error calculating blog stats:', error)
  }

  // DELETED: Heavy external API calls that block performance
  // External data will be loaded on-demand by individual components
})

const validBlogStats = computed(() => blogStats.value || undefined)

// Data-driven gonzo summary sentence generator (pure logic in utils/statsSummary.ts)
const summaryData = computed(() => buildStatsSummary(stats.value))

// Health data transformation
const _transformedHealthStats = computed(() => {
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
          days: 0,
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
// route already defined above on line 492
const isSimpleMode = computed(() => route.query.simple !== undefined)

const statsSections = [
  { id: 'overview', text: 'Overview' },
  { id: 'github', text: 'GitHub' },
  { id: 'gists', text: 'Code' },
  { id: 'leetcode', text: 'LeetCode' },
  { id: 'typing', text: 'Typing' },
  { id: 'chess', text: 'Chess' },
  { id: 'writing', text: 'Writing' },
  { id: 'productivity', text: 'Productivity' },
  { id: 'languages', text: 'Languages' },
  { id: 'music', text: 'Music' },
  { id: 'films', text: 'Films' },
  { id: 'books', text: 'Books' },
  { id: 'website', text: 'Analytics' },
  { id: 'gear', text: 'Gear' },
]

// Helper function for TOC link classes
const getTocClass = (isActive: boolean) => {
  if (isActive) return 'text-zinc-900 dark:text-zinc-100'
  return 'text-zinc-500 dark:text-zinc-500'
}

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
    timeZone: 'America/New_York',
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
        exerciseMinutes: stats.value.health.trends.daily.exercise[idx] || 0,
      }
    }
  }
  return stats.value.health.today || { steps: 0, exerciseMinutes: 0 }
})

// Page meta
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="font-mono overflow-hidden">
    <!-- Stats TOC - ClientOnly to fix SSR hydration -->
    <ClientOnly>
      <teleport v-if="tocTarget && !isSimpleMode" to="#nav-toc-container">
        <div>
          <ul class="space-y-0.5 font-mono text-3xs list-none pl-0">
            <li v-for="section in statsSections" :key="section.id">
              <a
                :href="`#${section.id}`"
                class="block uppercase tracking-wider"
                :class="getTocClass(activeSection === section.id)"
              >
                {{ section.text }}
              </a>
            </li>
          </ul>
        </div>
      </teleport>
    </ClientOnly>

    <!-- Simple Mode -->
    <section
      v-if="isSimpleMode"
      ref="sectionRef"
      class="space-y-2 text-xs pt-8"
    >
      <!-- Minimal header -->
      <div ref="headerRef" class="simple-mode-header">
        <div>FOX_STATS</div>
        <div ref="progressRef">{{ displayDayOfYear }}/{{ daysInYear }}</div>
      </div>
      <div class="text-3xs text-zinc-500 dark:text-zinc-500 px-2">
        Updated {{ statsUpdated || 'live' }} · sources: GitHub, Chess.com,
        Monkeytype, Last.fm, RescueTime
      </div>

      <!-- Error state for simple mode -->
      <div
        v-if="errors.fetch"
        class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 m-4"
        :class="'dark:bg-red-950 dark:border-red-800 dark:text-red-200'"
      >
        <h2 class="font-bold">Failed to Load Stats</h2>
        <p class="text-sm">Unable to fetch stats data.</p>
        <a
          href="/"
          class="mt-2 inline-block text-red-600 dark:text-red-400 underline"
        >
          Return Home
        </a>
      </div>

      <!-- Dense stats layout -->
      <div v-else class="space-y-2 p-4">
        <!-- Writing Stats -->
        <StatsStatSection title="WRITING" :show="validBlogStats">
          <StatsStatRow label="Posts" :value="validBlogStats.totalPosts" />
          <StatsStatRow label="Words" :value="validBlogStats.totalWords" />
          <StatsStatRow
            label="This Month"
            :value="validBlogStats.postsThisMonth"
          />
          <StatsStatRow
            label="Avg Words"
            :value="validBlogStats.averageWords"
          />
        </StatsStatSection>

        <!-- Typing Stats -->
        <StatsStatSection title="TYPING" :show="stats.monkeyType?.typingStats">
          <StatsStatRow
            label="Best WPM"
            :value="stats.monkeyType.typingStats.bestWPM"
          />
          <StatsStatRow
            label="Tests"
            :value="stats.monkeyType.typingStats.testsCompleted"
          />
          <StatsStatRow
            label="Accuracy"
            :value="stats.monkeyType.typingStats.bestAccuracy"
            format="percentage"
          />
          <StatsStatRow
            label="Consistency"
            :value="stats.monkeyType.typingStats.bestConsistency"
            format="percentage"
          />
        </StatsStatSection>

        <!-- GitHub Stats -->
        <StatsStatSection title="GITHUB" :show="stats.github?.stats">
          <StatsStatRow
            label="Contributions"
            :value="stats.github.stats?.totalContributions || 0"
          />
          <StatsStatRow
            label="Repos"
            :value="stats.github.stats?.totalRepos || 0"
          />
          <StatsStatRow
            label="Followers"
            :value="stats.github.stats?.followers || 0"
          />
          <StatsStatRow
            label="Following"
            :value="stats.github.stats?.following || 0"
          />
        </StatsStatSection>

        <!-- LeetCode Stats -->
        <StatsStatSection
          title="LEETCODE"
          :show="stats.leetcode?.submissionStats"
        >
          <StatsStatRow
            label="Easy"
            :value="stats.leetcode.submissionStats.easy.count"
          />
          <StatsStatRow
            label="Medium"
            :value="stats.leetcode.submissionStats.medium.count"
          />
          <StatsStatRow
            label="Hard"
            :value="stats.leetcode.submissionStats.hard.count"
          />
          <StatsStatRow
            label="Total"
            :value="
              stats.leetcode.submissionStats.easy.count +
              stats.leetcode.submissionStats.medium.count +
              stats.leetcode.submissionStats.hard.count
            "
          />
        </StatsStatSection>
        <!-- Chess Stats -->
        <StatsStatSection title="CHESS" :show="stats.chess">
          <StatsStatRow
            label="Blitz"
            :value="stats.chess.currentRating.blitz"
          />
          <StatsStatRow
            label="Rapid"
            :value="stats.chess.currentRating.rapid"
          />
          <StatsStatRow
            label="Bullet"
            :value="stats.chess.currentRating.bullet"
          />
          <StatsStatRow
            label="Puzzles"
            :value="stats.chess.puzzleStats.rating"
          />
        </StatsStatSection>

        <!-- Health Stats -->
        <StatsStatSection title="HEALTH" :show="stats.health">
          <StatsStatRow label="Steps Today" :value="healthToday.steps" />
          <StatsStatRow label="Exercise">
            {{ healthToday.exerciseMinutes }}m
          </StatsStatRow>
          <StatsStatRow
            label="Avg Steps"
            :value="stats.health.averages?.dailySteps || 0"
          />
          <StatsStatRow
            label="Heart Rate"
            :value="stats.health.heartRate?.resting || 0"
          />
        </StatsStatSection>

        <!-- Photography Stats -->
        <StatsStatSection title="PHOTOGRAPHY" :show="stats.photos?.stats">
          <StatsStatRow label="Total" :value="stats.photos.stats.totalPhotos" />
          <StatsStatRow
            label="This Month"
            :value="stats.photos.stats.photosThisMonth"
          />
          <StatsStatRow
            label="Avg/Month"
            :value="stats.photos.stats.averagePerMonth"
            format="decimal"
            :decimals="1"
          />
        </StatsStatSection>

        <!-- Productivity Stats -->
        <StatsStatSection title="PRODUCTIVITY" :show="stats.rescueTime?.week">
          <StatsStatRow label="Weekly">
            {{ stats.rescueTime.week.summary.total.hours }}h
          </StatsStatRow>
          <StatsStatRow
            label="Productive"
            :value="stats.rescueTime.week.summary.productive.percentage"
            format="percentage"
          />
          <StatsStatRow
            label="Distracting"
            :value="stats.rescueTime.week.summary.distracting.percentage"
            format="percentage"
          />
        </StatsStatSection>

        <!-- Last.fm Stats -->
        <div v-if="stats.lastfm" class="stack-1">
          <StatsStatSection title="MUSIC" :show="true">
            <StatsStatRow
              label="Scrobbles"
              :value="stats.lastfm.stats?.totalScrobbles || 0"
            />
            <StatsStatRow
              label="Artists this month"
              :value="stats.lastfm.stats?.uniqueArtists || 0"
            />
            <StatsStatRow
              label="Daily Avg"
              :value="stats.lastfm.stats?.averagePerDay || 0"
              format="decimal"
              :decimals="1"
            />
            <StatsStatRow
              label="Tracks this month"
              :value="stats.lastfm.stats?.uniqueTracks || 0"
            />
          </StatsStatSection>
          <!-- Now Playing / Recent -->
          <div
            v-if="stats.lastfm.recentTracks?.tracks?.[0]"
            class="mt-2 text-xs"
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
          <div v-if="stats.lastfm.topArtists?.artists" class="mt-4">
            <div class="text-xs text-zinc-500 mb-2">TOP_ARTISTS</div>
            <div class="space-y-0.5">
              <div
                v-for="(artist, index) in stats.lastfm.topArtists.artists.slice(
                  0,
                  3
                )"
                :key="`artist-${index}`"
                class="flex items-baseline justify-between text-xs"
              >
                <div class="truncate">{{ index + 1 }}. {{ artist.name }}</div>
                <div class="text-zinc-500 tabular-nums">
                  {{ formatNumber(Number(artist.playcount)) }}x
                </div>
              </div>
            </div>
          </div>

          <!-- Top Tracks -->
          <div v-if="stats.lastfm.topTracks?.tracks" class="mt-4">
            <div class="text-xs text-zinc-500 mb-2">TOP_TRACKS</div>
            <div class="space-y-0.5">
              <div
                v-for="(track, index) in stats.lastfm.topTracks.tracks.slice(
                  0,
                  3
                )"
                :key="`track-${index}`"
                class="flex items-baseline justify-between text-xs"
              >
                <div class="truncate">{{ index + 1 }}. {{ track.name }}</div>
                <div class="text-zinc-500 tabular-nums">
                  {{ formatNumber(Number(track.playcount)) }}x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Full Mode (default) -->
    <div v-else class="">
      <!-- Main Content -->
      <section
        class="min-w-0 w-full mx-auto max-w-none px-4 pt-8 md:px-8 lg:pr-16"
      >
        <!-- Header -->
        <header class="pb-8">
          <div style="max-width: 65ch">
            <h1 class="font-serif text-3xl font-normal mb-2">Stats</h1>
            <!-- Data-driven gonzo summary -->
            <div
              v-if="summaryData.text"
              class="font-serif text-base text-zinc-600 dark:text-zinc-400"
              v-html="summaryData.text"
            ></div>
            <ClientOnly>
              <p v-if="asOf" class="stats-asof">
                as of {{ asOf }} ·
                <span class="stats-live-dot" aria-hidden="true"></span> live
              </p>
              <template #fallback>
                <p class="stats-asof">&nbsp;</p>
              </template>
            </ClientOnly>
          </div>
        </header>

        <!-- Top Stats -->
        <!-- Server-rendered (useStats({ server: true })), so it's in the first
             paint instead of popping in and shoving the grid down. -->
        <div
          v-if="stats && Object.keys(stats).length > 0"
          id="top-stats"
          class="relative"
          :class="{ 'stat-flash': flashing.has('top-stats') }"
        >
          <TopStats :stats="stats" :blog-stats="validBlogStats" />
        </div>

        <!-- Main Stats Grid -->
        <section class="stats-grid-responsive">
          <!-- Error state -->
          <div
            v-if="errors.fetch"
            class="col-span-full rounded-lg border border-red-300 bg-red-50 p-6 text-red-800"
            :class="'dark:bg-red-950 dark:border-red-800 dark:text-red-200'"
          >
            <h2 class="font-bold text-lg mb-2">Failed to Load Stats</h2>
            <p class="text-sm mb-4">
              Unable to fetch stats data. Some services may be temporarily
              unavailable.
            </p>
            <a
              href="/"
              class="inline-block text-red-600 dark:text-red-400 underline"
            >
              Return Home
            </a>
          </div>

          <!-- Loading state -->
          <template v-else-if="isLoading">
            <div
              v-for="section in loadingSections"
              :key="section.title"
              class="break-inside-avoid"
            >
              <StatsSectionSkeleton
                :title="section.title"
                :rows="section.rows"
                :value="section.liteValue"
                :label="section.liteLabel"
              />
            </div>
          </template>

          <!-- Stats sections (TransitionGroup removed - no CSS defined, -->
          <!-- just overhead) -->
          <template
            v-if="
              !isLoading &&
              !errors.fetch &&
              stats &&
              Object.keys(stats).length > 0
            "
          >
            <!-- GitHub -->
            <StatSection
              v-if="stats.github?.stats"
              id="github"
              key="github-section"
              title="GITHUB"
              class="break-inside-avoid"
            >
              <GitHubStats key="github" :stats="stats.github" />
            </StatSection>
            <!-- Stable slot when GitHub failed: keep the section (and the TOC
                 anchor) instead of letting the page reflow around a hole -->
            <StatSection
              v-else
              id="github"
              key="github-section-empty"
              title="GITHUB"
              class="break-inside-avoid"
            >
              <StatsDataState message="GitHub data unavailable right now" />
            </StatSection>

            <!-- Code Snippets -->
            <StatSection
              v-if="stats.gists?.stats"
              id="gists"
              key="gists-section"
              title="CODE"
              class="break-inside-avoid"
            >
              <GistStats key="gists" :gist-stats="stats.gists" />
            </StatSection>

            <!-- LeetCode -->
            <StatSection
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
              <LeetCodeStats key="leetcode" :stats="stats.leetcode" />
            </StatSection>

            <!-- Typing -->
            <StatSection
              v-if="stats.monkeyType?.typingStats"
              id="typing"
              key="typing-section"
              title="TYPING"
              class="break-inside-avoid"
            >
              <MonkeyTypeStats key="monkeytype" :stats="stats.monkeyType" />
            </StatSection>

            <!-- Chess -->
            <StatSection
              v-if="stats.chess"
              id="chess"
              key="chess-section"
              title="CHESS"
              class="break-inside-avoid"
            >
              <ChessStats key="chess" :stats="stats.chess" />
            </StatSection>

            <!-- Writing -->
            <StatSection
              v-if="stats.blog"
              id="writing"
              key="writing-section"
              title="WRITING"
              class="break-inside-avoid"
            >
              <BlogStats key="blog" :stats="stats.blog" />
            </StatSection>

            <!-- Productivity -->
            <StatSection
              v-if="stats.rescueTime"
              id="productivity"
              key="productivity-section"
              title="PRODUCTIVITY"
              class="break-inside-avoid"
            >
              <RescueTimeStats key="rescuetime" :stats="stats" />
            </StatSection>

            <!-- Language Learning -->
            <StatSection
              v-if="stats.duolingo"
              id="languages"
              key="languages-section"
              title="LANGUAGES"
              class="break-inside-avoid"
            >
              <DuolingoStats key="duolingo" :stats="stats" />
            </StatSection>

            <!-- Music -->
            <StatSection
              v-if="stats.lastfm"
              id="music"
              key="music-section"
              title="MUSIC"
              class="break-inside-avoid"
            >
              <LastFmStats key="lastfm" :stats="stats.lastfm" />
            </StatSection>

            <!-- Films -->
            <StatSection
              v-if="stats.letterboxd?.stats"
              id="films"
              key="films-section"
              title="FILMS"
              class="break-inside-avoid"
            >
              <LetterboxdStats
                key="letterboxd"
                :letterboxd-stats="stats.letterboxd"
              />
            </StatSection>

            <!-- Books -->
            <StatSection
              v-if="stats.goodreads?.stats"
              id="books"
              key="books-section"
              title="BOOKS"
              class="break-inside-avoid"
            >
              <GoodreadsStats
                key="goodreads"
                :goodreads-stats="stats.goodreads"
              />
            </StatSection>

            <!-- Analytics -->
            <StatSection
              v-if="stats.website?.stats"
              id="website"
              key="website-section"
              title="ANALYTICS"
              class="break-inside-avoid"
            >
              <UmamiStats key="umami" :umami-stats="stats.website" />
            </StatSection>
          </template>
        </section>

        <!-- Full Width Sections -->
        <section class="col-span-full space-y-2 pt-8">
          <!-- Gear Stats -->
          <div
            id="gear"
            class="relative"
            :class="{ 'stat-flash': flashing.has('gear') }"
          >
            <StatSection title="GEAR">
              <GearStats :gear-stats="stats?.gear" />
            </StatSection>
          </div>

          <!-- Commit Matrix Art Piece -->
          <ClientOnly>
            <div id="commits-art" ref="commitsArt" class="relative pt-16">
              <div class="text-center mb-8">
                <h2 class="text-sm font-mono uppercase tracking-wider">
                  Every commit I have ever made (publicly)
                </h2>
                <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  <HandDrawnMark>
                    {{ allCommits.length.toLocaleString() }}
                  </HandDrawnMark>
                  commits
                </p>
              </div>
              <GithubCommitMatrix
                v-if="allCommits.length"
                :commits="allCommits"
              />
            </div>
          </ClientOnly>
        </section>
      </section>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Section stack: was an undefined class, so sections butted together and
   on phone each inline label read as the tail of the section above. */
.stats-grid-responsive {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

@media (max-width: 640px) {
  .stats-grid-responsive {
    gap: 2.5rem;
  }
}

/* Dense mode specific styles */
.tabular-nums {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
