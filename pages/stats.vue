<template>
  <div class="font-mono overflow-hidden">
    <!-- Stats TOC - ClientOnly to fix SSR hydration -->
    <ClientOnly>
      <teleport v-if="tocTarget && !isSimpleMode" to="#nav-toc-container">
        <div class="py-4">
          <h3
            class="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4"
          >
            Stats Index
          </h3>
          <ul class="space-y-1">
            <li v-for="section in statsSections" :key="section.id">
              <a
                :href="`#${section.id}`"
                class="block py-1 text-sm font-mono uppercase tracking-widest transition-colors"
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
        class="flex justify-between items-center font-mono text-xs text-zinc-500 uppercase tracking-widest tabular-nums px-4 py-4"
      >
        <div>FOX_STATS</div>
        <div ref="progressRef">{{ displayDayOfYear }}/{{ daysInYear }}</div>
      </div>

      <!-- Dense stats layout -->
      <div class="space-y-4 p-4">
        <!-- Writing Stats -->
        <div v-if="validBlogStats" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">WRITING</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Posts</span>
              <span class="tabular-nums">{{
                formatNumber(validBlogStats.totalPosts)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Words</span>
              <span class="tabular-nums">{{
                formatNumber(validBlogStats.totalWords)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>This Month</span>
              <span class="tabular-nums">{{
                formatNumber(validBlogStats.postsThisMonth)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Avg Words</span>
              <span class="tabular-nums">{{
                formatNumber(validBlogStats.averageWords)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Typing Stats -->
        <div v-if="stats.monkeyType?.typingStats" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">TYPING</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Best WPM</span>
              <span class="tabular-nums">{{
                formatNumber(stats.monkeyType.typingStats.bestWPM)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tests</span>
              <span class="tabular-nums">{{
                formatNumber(stats.monkeyType.typingStats.testsCompleted)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Accuracy</span>
              <span class="tabular-nums">{{
                formatPercentage(stats.monkeyType.typingStats.bestAccuracy)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Consistency</span>
              <span class="tabular-nums">{{
                formatPercentage(stats.monkeyType.typingStats.bestConsistency)
              }}</span>
            </div>
          </div>
        </div>

        <!-- GitHub Stats -->
        <div v-if="stats.github?.stats" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">GITHUB</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Contributions</span>
              <span class="tabular-nums">{{
                formatNumber(stats.github.stats?.totalContributions || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Repos</span>
              <span class="tabular-nums">{{
                formatNumber(stats.github.stats?.totalRepos || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Followers</span>
              <span class="tabular-nums">{{
                formatNumber(stats.github.stats?.followers || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Following</span>
              <span class="tabular-nums">{{
                formatNumber(stats.github.stats?.following || 0)
              }}</span>
            </div>
          </div>
        </div>

        <!-- LeetCode Stats -->
        <div v-if="stats.leetcode?.submissionStats" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">LEETCODE</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Easy</span>
              <span class="tabular-nums">{{
                formatNumber(stats.leetcode.submissionStats.easy.count)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Medium</span>
              <span class="tabular-nums">{{
                formatNumber(stats.leetcode.submissionStats.medium.count)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Hard</span>
              <span class="tabular-nums">{{
                formatNumber(stats.leetcode.submissionStats.hard.count)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total</span>
              <span class="tabular-nums">{{
                formatNumber(
                  stats.leetcode.submissionStats.easy.count +
                    stats.leetcode.submissionStats.medium.count +
                    stats.leetcode.submissionStats.hard.count
                )
              }}</span>
            </div>
          </div>
        </div>

        <!-- Chess Stats -->
        <div v-if="stats.chess" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">CHESS</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Blitz</span>
              <span class="tabular-nums">{{
                formatNumber(stats.chess.currentRating.blitz)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Rapid</span>
              <span class="tabular-nums">{{
                formatNumber(stats.chess.currentRating.rapid)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Bullet</span>
              <span class="tabular-nums">{{
                formatNumber(stats.chess.currentRating.bullet)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Puzzles</span>
              <span class="tabular-nums">{{
                formatNumber(stats.chess.puzzleStats.rating)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Health Stats -->
        <div v-if="stats.health" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">HEALTH</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Steps Today</span>
              <span class="tabular-nums">{{
                formatNumber(healthToday.steps)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Exercise</span>
              <span class="tabular-nums"
                >{{ formatNumber(healthToday.exerciseMinutes) }}m</span
              >
            </div>
            <div class="flex justify-between">
              <span>Avg Steps</span>
              <span class="tabular-nums">{{
                formatNumber(stats.health.averages?.dailySteps || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Heart Rate</span>
              <span class="tabular-nums">{{
                formatNumber(stats.health.heartRate?.resting || 0)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Photography Stats -->
        <div v-if="stats.photos?.stats" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">PHOTOGRAPHY</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Total</span>
              <span class="tabular-nums">{{
                formatNumber(stats.photos.stats.totalPhotos)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>This Month</span>
              <span class="tabular-nums">{{
                formatNumber(stats.photos.stats.photosThisMonth)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Avg/Month</span>
              <span class="tabular-nums">{{
                formatDecimal(1)(stats.photos.stats.averagePerMonth)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Productivity Stats -->
        <div v-if="stats.rescueTime?.week" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">PRODUCTIVITY</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Weekly</span>
              <span class="tabular-nums"
                >{{
                  formatNumber(stats.rescueTime.week.summary.total.hours)
                }}h</span
              >
            </div>
            <div class="flex justify-between">
              <span>Productive</span>
              <span class="tabular-nums">{{
                formatPercentage(
                  stats.rescueTime.week.summary.productive.percentage
                )
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Distracting</span>
              <span class="tabular-nums">{{
                formatPercentage(
                  stats.rescueTime.week.summary.distracting.percentage
                )
              }}</span>
            </div>
          </div>
        </div>

        <!-- Last.fm Stats -->
        <div v-if="stats.lastfm" class="space-y-1">
          <div class="text-xs tracking-widest text-zinc-500">MUSIC</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div class="flex justify-between">
              <span>Scrobbles</span>
              <span class="tabular-nums">{{
                formatNumber(stats.lastfm.stats?.totalScrobbles || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Artists</span>
              <span class="tabular-nums">{{
                formatNumber(stats.lastfm.stats?.uniqueArtists || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Daily Avg</span>
              <span class="tabular-nums">{{
                formatDecimal(1)(stats.lastfm.stats?.averagePerDay || 0)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tracks</span>
              <span class="tabular-nums">{{
                formatNumber(stats.lastfm.stats?.uniqueTracks || 0)
              }}</span>
            </div>
          </div>
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
            <div class="text-xs text-zinc-500 mb-1">TOP_ARTISTS</div>
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
                  {{ formatNumber(artist.playcount) }}x
                </div>
              </div>
            </div>
          </div>

          <!-- Top Tracks -->
          <div v-if="stats.lastfm.topTracks?.tracks" class="mt-4">
            <div class="text-xs text-zinc-500 mb-1">TOP_TRACKS</div>
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
        <header class="py-8 px-4 md:px-8">
          <div style="max-width: 65ch">
            <h1 class="font-serif text-3xl font-normal mb-2">Stats</h1>
            <!-- Data-driven gonzo summary -->
            <div
              v-if="summaryData.text"
              class="font-serif text-base text-zinc-600 dark:text-zinc-400"
              v-html="summaryData.text"
            ></div>
          </div>
        </header>

        <!-- Top Stats -->
        <Suspense>
          <template #default>
            <ClientOnly>
              <Transition name="fade" appear>
                <div
                  v-if="stats && Object.keys(stats).length > 0"
                  id="top-stats"
                  class="relative"
                >
                  <TopStats :stats="stats" :blog-stats="validBlogStats" />
                </div>
              </Transition>
            </ClientOnly>
          </template>
        </Suspense>

        <!-- Main Stats Grid -->
        <section
          class="grid md:gap-4 lg:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 overflow-hidden pr-4 md:pr-8"
        >
          <!-- Loading state -->
          <div
            v-if="isLoading"
            class="col-span-full text-center py-8 font-mono text-zinc-500"
          >
            Loading system metrics...
          </div>

          <TransitionGroup name="fade-up" tag="div" class="contents" appear>
            <!-- Only show sections when stats are actually loaded -->
            <template
              v-if="!isLoading && stats && Object.keys(stats).length > 0"
            >
              <!-- GitHub -->
              <StatsSection
                v-if="stats.github?.stats"
                id="github"
                key="github-section"
                title="GITHUB"
                class="break-inside-avoid"
              >
                <GitHubStats key="github" :stats="stats.github" />
              </StatsSection>

              <!-- Writing -->
              <StatsSection
                v-if="stats.blog"
                id="writing"
                key="writing-section"
                title="WRITING"
                class="break-inside-avoid"
              >
                <BlogStats key="blog" :stats="stats.blog" />
              </StatsSection>

              <!-- Reading -->
              <StatsSection
                v-if="stats.goodreads?.stats"
                id="reading"
                key="reading-section"
                title="READING"
                class="break-inside-avoid"
              >
                <GoodreadsStats key="goodreads" :data="stats.goodreads" />
              </StatsSection>

              <!-- Productivity -->
              <StatsSection
                v-if="stats.rescueTime"
                id="productivity"
                key="productivity-section"
                title="PRODUCTIVITY"
                class="break-inside-avoid"
              >
                <RescueTimeStats key="rescuetime" :stats="stats" />
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
                <LeetCodeStats key="leetcode" :stats="stats.leetcode" />
              </StatsSection>

              <!-- Chess -->
              <StatsSection
                v-if="stats.chess"
                id="chess"
                key="chess-section"
                title="CHESS"
                class="break-inside-avoid"
              >
                <ChessStats key="chess" :stats="stats.chess" />
              </StatsSection>

              <!-- Typing -->
              <StatsSection
                v-if="stats.monkeyType?.typingStats"
                id="typing"
                key="typing-section"
                title="TYPING"
                class="break-inside-avoid"
              >
                <MonkeyTypeStats key="monkeytype" :stats="stats.monkeyType" />
              </StatsSection>

              <!-- Code Snippets -->
              <StatsSection
                v-if="stats.gists?.stats"
                id="gists"
                key="gists-section"
                title="CODE"
                class="break-inside-avoid"
              >
                <GistStats key="gists" :gist-stats="stats.gists" />
              </StatsSection>

              <!-- Music -->
              <StatsSection
                v-if="stats.lastfm"
                id="music"
                key="music-section"
                title="MUSIC"
                class="break-inside-avoid"
              >
                <LastFmStats key="lastfm" :stats="stats.lastfm" />
              </StatsSection>

              <!-- Films -->
              <StatsSection
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
              </StatsSection>

              <!-- Analytics -->
              <StatsSection
                v-if="stats.website?.stats"
                id="website"
                key="website-section"
                title="ANALYTICS"
                class="break-inside-avoid"
              >
                <UmamiStats key="umami" :umami-stats="stats.website" />
              </StatsSection>
            </template>
          </TransitionGroup>
        </section>

        <!-- Full Width Sections -->
        <section class="col-span-full space-y-2 pt-8">
          <!-- Gear Stats -->
          <Transition name="fade-up" appear>
            <div id="gear" class="relative">
              <StatsSection title="GEAR">
                <GearStats :gear-stats="stats?.gear" />
              </StatsSection>
            </div>
          </Transition>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import stats components explicitly (Nuxt 4 auto-import issues)
import StatsSection from '~/components/stats/StatsSection.vue'
import TopStats from '~/components/stats/TopStats.vue'
import GitHubStats from '~/components/stats/GitHubStats.vue'
import BlogStats from '~/components/stats/BlogStats.vue'
import GoodreadsStats from '~/components/stats/GoodreadsStats.vue'
import RescueTimeStats from '~/components/stats/RescueTimeStats.vue'
import LeetCodeStats from '~/components/stats/LeetCodeStats.vue'
import ChessStats from '~/components/stats/ChessStats.vue'
import MonkeyTypeStats from '~/components/stats/MonkeyTypeStats.vue'
import GistStats from '~/components/stats/GistStats.vue'
import LastFmStats from '~/components/stats/LastFmStats.vue'
import LetterboxdStats from '~/components/stats/LetterboxdStats.vue'
import UmamiStats from '~/components/stats/UmamiStats.vue'
import GearStats from '~/components/stats/GearStats.vue'
import ActivityCalendar from '~/components/stats/ActivityCalendar.vue'

const statsDescription = computed(() => {
  const s = stats.value
  if (!s) return 'Real-time personal metrics dashboard: GitHub contributions, chess ratings, typing speed, music listening, coding problems solved, books read, and more.'

  const parts = []
  if (s.github?.totalCommits) parts.push(`${s.github.totalCommits} commits`)
  if (s.chess?.blitzRating) parts.push(`${s.chess.blitzRating} chess`)
  if (s.monkeytype?.avgWpm) parts.push(`${Math.round(s.monkeytype.avgWpm)}wpm typing`)
  if (s.leetcode?.solved) parts.push(`${s.leetcode.solved} problems`)
  if (s.blog?.totalPosts) parts.push(`${s.blog.totalPosts} posts`)

  return parts.length > 0 ? parts.join(' • ') : 'Real-time personal metrics dashboard'
})

useHead(() => ({
  title: 'Stats - EJ Fox',
  meta: [
    {
      name: 'description',
      content: statsDescription.value
    },
    { property: 'og:title', content: 'Stats - EJ Fox' },
    {
      property: 'og:description',
      content: statsDescription.value
    },
    { property: 'og:url', content: 'https://ejfox.com/stats' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://ejfox.com/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Stats - EJ Fox' },
    {
      name: 'twitter:description',
      content: statsDescription.value
    },
    { name: 'twitter:image', content: 'https://ejfox.com/og-image.png' }
  ]
}))

const route = useRoute()

const { stats: rawStats, isLoading } = useStats()
const stats = computed(() => rawStats.value)
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
const isLeapYear =
  (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
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

// Pluralization helper
const pluralize = (count: number, singular: string, plural?: string) => {
  if (count === 1) return `${count} ${singular}`
  return `${count} ${plural || singular + 's'}`
}

// Data-driven gonzo summary sentence generator
const summaryData = computed(() => {
  if (!stats.value) return { text: '' }

  const blog = stats.value.blog
  const github = stats.value.github?.detail?.commits
  const leetcode = stats.value.leetcode?.recentSubmissions
  const chess = stats.value.chess?.recentGames
  const monkeyType = stats.value.monkeyType?.typingStats
  const gear = stats.value.gear?.stats
  const gists = stats.value.gists?.recentGists
  const lastfm = stats.value.lastfm?.recentTracks?.tracks
  const letterboxd = stats.value.letterboxd?.films
  const rescueTime = stats.value.rescueTime?.week
  const website = stats.value.website?.stats

  let clauses = []

  // Writing activity - check recent posts (last 7 days)
  if (blog?.recentPosts?.length) {
    const recentPosts = blog.recentPosts.filter((post) => {
      const postDate = new Date(post.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return postDate >= weekAgo
    })
    if (recentPosts.length > 0) {
      const totalWords = recentPosts.reduce(
        (sum, post) => sum + (post.words || 0),
        0
      )
      const postsPlural = pluralize(recentPosts.length, 'post')
      clauses.push(
        `<a href="#writing" class="underline hover:no-underline">written</a> ${formatNumber(totalWords)} words across ${postsPlural}`
      )
    }
  }

  // Recent GitHub commits (last 7 days)
  if (github?.length) {
    const recentCommits = github.filter((commit) => {
      const commitDate = new Date(commit.occurredAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return commitDate >= weekAgo
    })
    if (recentCommits.length > 0) {
      clauses.push(
        `made ${recentCommits.length} <a href="#github" class="underline hover:no-underline">commits</a>`
      )
    }
  }

  // Recent LeetCode activity
  if (leetcode?.length) {
    const recent = leetcode.filter((sub) => {
      // Convert Unix timestamp to milliseconds if needed
      const timestamp =
        sub.timestamp.toString().length === 10
          ? parseInt(sub.timestamp) * 1000
          : parseInt(sub.timestamp)
      const subDate = new Date(timestamp)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      // Filter out future dates (bad data) and only get last week's activity
      return subDate >= weekAgo && subDate <= new Date()
    })
    if (recent.length > 0) {
      clauses.push(
        `<a href="#leetcode" class="underline hover:no-underline">solved</a> ${recent.length} coding problems`
      )
    }
  }

  // Recent chess games
  if (chess?.length) {
    const recentGames = chess.filter((game) => {
      const gameDate = new Date(game.timestamp * 1000)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return gameDate >= weekAgo
    })
    if (recentGames.length > 0) {
      const wins = recentGames.filter((g) => g.result === 'win').length
      const winText = wins === 1 ? 'win' : 'wins'
      clauses.push(
        `<a href="#chess" class="underline hover:no-underline">played</a> ${recentGames.length} chess games (${wins} ${winText})`
      )
    }
  }

  // Typing activity - check if we have recent tests
  if (monkeyType?.recentTests?.length) {
    const recent = monkeyType.recentTests.filter((test) => {
      const testDate = new Date(test.timestamp)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return testDate >= weekAgo
    })
    if (recent.length > 0) {
      const bestRecent = Math.max(...recent.map((t) => t.wpm))
      clauses.push(
        `<a href="#typing" class="underline hover:no-underline">typed</a> at ${bestRecent} WPM`
      )
    }
  }

  // Recent gists (last 7 days)
  if (gists?.length) {
    const recentGists = gists.filter((gist) => {
      const gistDate = new Date(gist.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return gistDate >= weekAgo
    })
    if (recentGists.length > 0) {
      clauses.push(
        `created ${recentGists.length} <a href="#gists" class="underline hover:no-underline">gists</a>`
      )
    }
  }

  // Recent music listening (last.fm recent tracks)
  if (lastfm?.length && lastfm[0]?.date) {
    const recentTracks = lastfm.filter((track) => {
      if (!track.date) return false
      const trackDate = new Date(parseInt(track.date.uts) * 1000)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return trackDate >= weekAgo
    })
    if (recentTracks.length > 0) {
      const topArtist = recentTracks[0]?.artist?.name
      clauses.push(
        `listened to ${recentTracks.length} <a href="#music" class="underline hover:no-underline">tracks</a>${topArtist ? ` (mostly ${topArtist})` : ''}`
      )
    }
  }

  // Recent movies (letterboxd films) - only if watched in last week
  if (letterboxd?.length) {
    const recentFilms = letterboxd.filter((film) => {
      // Skip films with invalid or default dates
      if (
        !film.watchedDate ||
        film.watchedDate === new Date().toISOString().split('T')[0]
      ) {
        return false
      }
      const filmDate = new Date(film.watchedDate)
      // Check if date is valid
      if (isNaN(filmDate.getTime())) {
        return false
      }
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return filmDate >= weekAgo && filmDate <= new Date() // Also ensure it's not in the future
    })
    if (recentFilms.length > 0) {
      clauses.push(
        `watched ${recentFilms.length} <a href="#movies" class="underline hover:no-underline">films</a>`
      )
    }
  }

  // RescueTime productive hours this week
  if (rescueTime?.summary?.productive?.time?.hours) {
    const productiveHours = Math.round(rescueTime.summary.productive.time.hours)
    if (productiveHours > 0) {
      clauses.push(
        `logged ${productiveHours} <a href="#productivity" class="underline hover:no-underline">productive hours</a>`
      )
    }
  }

  // Website stats (if we have comparison data)
  if (website?.pageviews?.value && website?.pageviews?.prev) {
    const current = website.pageviews.value
    const previous = website.pageviews.prev
    const change = current - previous
    if (Math.abs(change) > 0) {
      const direction = change > 0 ? 'gained' : 'lost'
      clauses.push(
        `${direction} ${Math.abs(change)} <a href="#website" class="underline hover:no-underline">pageviews</a>`
      )
    }
  }

  // Gear optimization - only if added items in past month (need lastUpdated field)
  // Skip for now - no temporal data available to determine recent additions

  if (clauses.length === 0) {
    return {
      text: 'Monitoring systems, collecting data, optimizing workflows.'
    }
  }

  // Join clauses into a flowing sentence
  let sentence = "This week I've "
  if (clauses.length === 1) {
    sentence += clauses[0] + '.'
  } else if (clauses.length === 2) {
    sentence += clauses[0] + ' and ' + clauses[1] + '.'
  } else {
    sentence +=
      clauses.slice(0, -1).join(', ') +
      ', and ' +
      clauses[clauses.length - 1] +
      '.'
  }

  return { text: sentence }
})

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
// route already defined above on line 492
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
