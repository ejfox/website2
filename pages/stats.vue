<template>
  <div class="font-mono overflow-hidden">
    <!-- Stats TOC -->
    <teleport v-if="tocTarget && !isSimpleMode" to="#nav-toc-container">
      <div class="py-6 px-4">
        <h3 class="text-mono-label mb-4">
          Stats Index
        </h3>
        <ul class="space-y-2">
          <li v-for="section in statsSections" :key="section.id">
            <a
              :href="`#${section.id}`"
              class="block py-1 text-xs font-mono uppercase tracking-wider transition-colors"
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

    <!-- Main Content -->
    <ClientOnly>
      <!-- Loading state -->
      <section
        v-if="isLoading"
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div v-for="i in 12" :key="i" class="animate-pulse">
            <div class="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      </section>

      <!-- Stats display -->
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

    <!-- Status indicator -->
    <Transition name="fade">
      <div
        v-if="hasStaleData && !isSimpleMode"
        class="fixed bottom-6 right-6 bg-zinc-900/90 dark:bg-zinc-100/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-3"
      >
        <div
          class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
        >
          <Icon name="i-heroicons-clock" class="w-3 h-3" />
          <span class="text-zinc-500 dark:text-zinc-400">Cached Data</span>
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
import { useRoute } from 'vue-router'
import { useStats } from '~/composables/useStats'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

// Component imports
const SimpleStatsDisplay = defineAsyncComponent(
  () => import('~/components/stats/SimpleStatsDisplay.vue')
)
const FullStatsDisplay = defineAsyncComponent(
  () => import('~/components/stats/FullStatsDisplay.vue')
)

const { stats: rawStats, isLoading, hasStaleData } = useStats()
const stats = computed(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()

// Blog stats calculation
const blogStats = ref(null)
const cachedPosts = shallowRef(null)

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
    const allTags = new Set()
    const tagCounts = {}
    const postsByMonth = {}
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { totalWords, wordCount, firstDate, lastDate } = posts.reduce(
      (acc, post) => {
        const postWordCount = post?.wordCount || post?.metadata?.words || 0
        const postDate = new Date(
          post?.date || post?.metadata?.date || new Date()
        )
        const month = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`

        if (!acc.firstDate || postDate < acc.firstDate) acc.firstDate = postDate
        if (!acc.lastDate || postDate > acc.lastDate) acc.lastDate = postDate

        postsByMonth[month] = (postsByMonth[month] || 0) + 1

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
const tocTarget = ref(null)
const activeSection = ref('overview')
const route = useRoute()
const isSimpleMode = computed(() => route.query.simple !== undefined)

const statsSections = [
  { id: 'overview', text: 'Overview' },
  { id: 'writing', text: 'Writing' },
  { id: 'typing', text: 'Typing' },
  { id: 'github', text: 'GitHub' },
  { id: 'photography', text: 'Photography' },
  { id: 'chess', text: 'Chess' },
  { id: 'productivity', text: 'Productivity' },
  { id: 'gear', text: 'Gear' },
  { id: 'health', text: 'Health' },
  { id: 'music', text: 'Music' }
]

onMounted(() => {
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
  title: 'Annual Report - EJ Fox',
  meta: [
    {
      name: 'description',
      content:
        'Comprehensive annual statistics and metrics across writing, coding, health, and productivity.'
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
</style>
