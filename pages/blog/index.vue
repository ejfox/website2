<script setup>
import { format, formatDistanceToNow } from 'date-fns'
import { computed } from 'vue'
import { startOfWeek } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'
import { subMonths } from 'date-fns'


const processedMarkdown = useProcessedMarkdown()

const { data: blogPosts } = await useAsyncData('blog-posts', async () => {
  // Get all posts including shared drafts, but excluding week notes and special sections
  const posts = await processedMarkdown.getAllPosts(true, false)
  console.log('All posts before filtering:', posts.length, posts)
  return posts
})

const { data: weekNotes } = await useAsyncData('week-notes', () => processedMarkdown.getWeekNotes())

const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd')

const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

useHead({
  title: 'Blog',
})

// Sort week notes and convert week slug to actual dates
const sortedWeekNotes = computed(() => {
  return weekNotes.value
    .map(note => {
      const weekMatch = note.slug.match(/(\d{4})-(\d{2})/)
      if (weekMatch) {
        const year = parseInt(weekMatch[1], 10)
        const week = parseInt(weekMatch[2], 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
        const actualDate = new Date(date.setDate(date.getDate() + (week - 1) * 7))
        return { ...note, actualDate }
      }
      return note
    })
    // filter out weeks without deks
    .filter(note => note.actualDate && note.dek)
    // filter out weeks with `hidden` frontmatter
    .filter(note => note.hidden !== true)
    .sort((a, b) => b.actualDate - a.actualDate)
    .slice(0, 5)
})

// Updated groupByYear function to filter out hidden posts
function groupByYear(posts) {
  if (!posts) return {}

  console.log('Starting groupByYear with', posts.length, 'posts')

  const sortedPosts = [...posts]
    .filter(post => {
      const isHidden = post.hidden === true || post.hidden === 'true'
      console.log(`Post ${post.slug}: hidden=${isHidden}`)
      return !isHidden
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      console.log(`Comparing dates: ${a.slug} ${dateA} vs ${dateB}`)
      return dateB - dateA
    })

  console.log('After filtering and sorting:', sortedPosts.length, 'posts')

  const grouped = sortedPosts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    console.log(`Grouped ${post.slug} into year ${year}`)
    return acc
  }, {})

  // Log final grouping results
  Object.entries(grouped).forEach(([year, posts]) => {
    console.log(`Year ${year}: ${posts.length} posts`)
    posts.forEach(p => console.log(`  - ${p.slug} (${p.date})`))
  })

  return grouped
}

const blogPostsByYear = computed(() => groupByYear(blogPosts.value))

// Get an array of years sorted in descending order
const sortedYears = computed(() =>
  Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
)

const blogPostElements = ref([])
const weekNoteElements = ref([])

const animDuration = 900
const animStagger = 25
onMounted(() => {
  // Animate blog posts
  animate(blogPostElements.value, {
    opacity: [0, 1],
    translateY: [20, 0],
    // scale: [0.98, 1.02, 1],
    duration: animDuration,
    ease: 'easeOutQuad',
    delay: stagger(animStagger)
  })

  // animate the metadata sliding in from the left

  animate(blogPostElements.value.map((el,) => el.querySelector('.post-metadata')), {
    opacity: [0, 1],
    translateX: [-8, 0],
    duration: animDuration * 2,
    ease: 'easeOutQuad',
    delay: animDuration * 0.82
  })

  // Animate week notes
  animate(weekNoteElements.value, {
    opacity: [0, 1],
    translateX: [20, 0],
    duration: animDuration,
    ease: 'easeInOutQuad',
    delay: stagger(animStagger, { start: 600 }) // Start after blog posts animation
  })



})

// Updated computed property for recently updated posts
const recentlyUpdatedPosts = computed(() => {
  if (!blogPosts.value) return []
  const oneMonthAgo = subMonths(new Date(), 1)
  return [...blogPosts.value]
    .filter(post => post.hidden !== true)
    .filter(post => {
      const updateDate = new Date(post.lastUpdated || post.date)
      return updateDate > oneMonthAgo
    })
    .sort((a, b) => new Date(b.lastUpdated || b.date) - new Date(a.lastUpdated || a.date))
    .slice(0, 5)
})
</script>

<template>
  <div class="container mx-auto px-2 py-12 lg:flex lg:gap-4">
    <!-- Blog Posts -->
    <section class="lg:w-2/3 mb-16">
      <h2 class="text-3xl font-bold mb-8">Blog Posts</h2>



      <!-- Existing yearly blog posts list -->
      <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-10">
        <h3 class="text-4xl font-semibold text-zinc-500 dark:text-zinc-400 mb-6 tracking-tight">
          {{ year }}
        </h3>
        <ul class="">
          <li v-for="post in blogPostsByYear[year]" :key="post.slug" ref="blogPostElements"
            class="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">

            <NuxtLink :to="`/blog/${post.slug}`"
              class="post-title no-underline hover:underline text-xl lg:text-3xl font-medium mb-2 pr-2 font-fjalla"
              :style="{ viewTransitionName: `title-${post.slug}` }">
              {{ post.title }}
            </NuxtLink>

            <div class="font-mono text-xs text-zinc-600 dark:text-zinc-400">
              {{ post?.dek }}
            </div>

            <!-- <PostMetadata :doc="post" class="post-metadata text-xs text-zinc-600 dark:text-zinc-400" /> -->


          </li>
        </ul>
      </div>
    </section>

    <!-- Week Notes -->
    <section class="lg:w-1/3">
      <h2 class="text-3xl font-bold mb-8">Week Notes</h2>
      <div v-for="weekNote in sortedWeekNotes" :key="weekNote.slug" ref="weekNoteElements"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4">
        <NuxtLink :to="`/blog/${weekNote.slug}`" class=" text-sm font-mono block py-1 rounded">
          <span class="hover:underline">
            {{ weekNote.slug.split('/')[1] }}
          </span>

          <p v-if="weekNote.dek" class="text-xs text-zinc-500 mt-2">
            {{ weekNote.dek }}
          </p>
        </NuxtLink>
      </div>

      <!-- <NuxtLink to="/blog/week-notes" class="px-2 py-2 text-sm bg-zinc-950 rounded my-3 inline-block">
        <span class="hover:underline">All Week Notes</span>
        <UIcon name="i-ei-arrow-right" class="inline-block" />
      </NuxtLink> -->

      <UButton :to="`/blog/week-notes`" color="black" class="mt-4" icon="i-ei-arrow-right" trailing variant="outline">
        All Week Notes
      </UButton>

      <div v-if="recentlyUpdatedPosts.length" class="my-12">
        <h3 class="text-2xl font-semibold text-zinc-600 dark:text-zinc-300 mb-4">Recently Updated</h3>
        <ul>
          <li v-for="post in recentlyUpdatedPosts" :key="`recent-${post.slug}`"
            class="mb-3 border-l-4 border-zinc-300 dark:border-zinc-600 pl-4">
            <NuxtLink :to="`/blog/${post.slug}`" class="text-lg font-medium hover:underline">
              {{ post.title }}
            </NuxtLink>
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Updated {{ formatRelativeTime(post.lastUpdated || post.date) }}
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
<style scoped>
/* .post-title:active {
  view-transition-name: title;
  contain: layout;
} */
</style>
