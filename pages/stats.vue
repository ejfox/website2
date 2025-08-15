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

    <!-- Main Content -->
    <!-- Stats display -->
    <component
      :is="isSimpleMode ? SimpleStatsDisplay : FullStatsDisplay"
      :stats="stats"
      :blog-stats="validBlogStats"
      :transformed-health-stats="transformedHealthStats"
      :is-loading="isLoading"
      :health-today="healthToday"
    />
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

const { stats: rawStats, isLoading, hasStaleData: _hasStaleData } = useStats()
const stats = computed(() => rawStats.value || {})
const { getAllPosts } = useProcessedMarkdown()

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
</style>
