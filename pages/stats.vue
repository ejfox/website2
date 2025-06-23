<template>
  <div class="font-mono overflow-hidden">
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

    <!-- Main Content -->
    <ClientOnly>
      <!-- Show loading state while data is being fetched -->
      <section v-if="isLoading" class="grid gap-3 sm:gap-4 md:gap-6 auto-fit-columns p-4">
        <div v-for="i in 8" :key="i" class="space-y-3">
          <div class="pulse-placeholder-sm"></div>
        </div>
      </section>

      <!-- Show appropriate display based on mode -->
      <component
        :is="isSimpleMode ? SimpleStatsDisplay : FullStatsDisplay"
        v-else
        :stats="stats"
        :blog-stats="validBlogStats"
        :transformed-health-stats="transformedHealthStats"
        :is-loading="isLoading"
        :health-today="healthToday"
      />
    </ClientOnly>

    <!-- Status Indicator -->
    <Transition name="fade">
      <div
        v-if="hasStaleData && !isSimpleMode"
        class="fixed bottom-4 right-4 border border-zinc-800/50 bg-zinc-900/80 p-2 font-mono backdrop-blur-sm"
      >
        <div
          class="flex items-center gap-2 text-xs tracking-wider text-zinc-500"
        >
          <UIcon name="i-heroicons-clock" class="h-3 w-3" />
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
  nextTick,
  defineAsyncComponent
} from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useStats } from '~/composables/useStats'
import type { StatsResponse } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

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

// Import the new component displays
const SimpleStatsDisplay = defineAsyncComponent(
  () => import('~/components/stats/SimpleStatsDisplay.vue')
)
const FullStatsDisplay = defineAsyncComponent(
  () => import('~/components/stats/FullStatsDisplay.vue')
)

const { stats: rawStats, isLoading, hasStaleData } = useStats()
const stats = computed<StatsResponse>(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()

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
      // Get all posts (no drafts, no week notes) to match blog index behavior
      const allPosts = await getAllPosts(false, false)
      
      // Use EXACT same filtering logic as blog index
      // Whitelist approach: only show posts that match year-based pattern
      cachedPosts.value = allPosts.filter((post) => {
        const slug = post?.slug || ''
        const type = post?.type || post?.metadata?.type
        const slugParts = slug.split('/')
        const lastPart = slugParts[slugParts.length - 1]

        // Check if it's a week note (exclude these)
        const isWeekNote =
          type === 'weekNote' ||
          slug.startsWith('week-notes/') ||
          /^\d{4}-\d{2}$/.test(lastPart)

        // Whitelist approach: only show posts that match year-based pattern
        const isRegularBlogPost = /^\d{4}\/[^/]+$/.test(slug)

        // Additional filtering like blog index
        const isHidden = post?.hidden === true || post?.metadata?.hidden === true
        const isDraft = post?.draft === true || post?.metadata?.draft === true
        const postDate = post?.date || post?.metadata?.date
        const isFuturePost = postDate && new Date(postDate) > new Date()
        
        return isRegularBlogPost && !isWeekNote && !isHidden && !isDraft && !isFuturePost
      })
      
      if (DEBUG_BLOG_STATS) {
        console.log(`Raw posts from getAllPosts: ${allPosts.length}`)
        console.log(`Filtered posts (blog stats): ${cachedPosts.value?.length || 0}`)
        
        // Show a few examples of what was filtered out
        const filtered = allPosts.filter(post => {
          const slug = post?.slug || ''
          const type = post?.type || post?.metadata?.type
          const slugParts = slug.split('/')
          const lastPart = slugParts[slugParts.length - 1]
          const isWeekNote = type === 'weekNote' || slug.startsWith('week-notes/') || /^\d{4}-\d{2}$/.test(lastPart)
          const isRegularBlogPost = /^\d{4}\/[^/]+$/.test(slug)
          const isHidden = post?.hidden === true || post?.metadata?.hidden === true
          const isDraft = post?.draft === true || post?.metadata?.draft === true
          const postDate = post?.date || post?.metadata?.date
          const isFuturePost = postDate && new Date(postDate) > new Date()
          return !(isRegularBlogPost && !isWeekNote && !isHidden && !isDraft && !isFuturePost)
        })
        
        console.log(`Filtered out ${filtered.length} posts:`, filtered.slice(0, 5).map(p => p.slug))
        
        console.log(
          'Sample blog post:',
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
    console.log('TOC Target found:', !!tocTarget.value, 'Simple mode:', isSimpleMode.value)

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

// Set the page layout
definePageMeta({
  layout: 'default'
})

// Use the appropriate layout
onMounted(() => {
  const layout = route.query.simple !== undefined ? 'simple' : 'default'
  useNuxtApp().$router.push({ query: { ...route.query }, hash: route.hash })
})

// Helper to get local (Eastern) date string in YYYY-MM-DD
const getEasternDateString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
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
</script>

<style scoped>
/* Base transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Typography refinements */
h1,
h2 {
  font-feature-settings: 'tnum', 'zero';
}

/* Auto-fit grid for loading placeholders */
.auto-fit-columns {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Responsive breakpoints */
@media (max-width: 640px) {
  .auto-fit-columns {
    grid-template-columns: 1fr;
  }
}
</style>
