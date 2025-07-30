<script setup>
import { format } from 'date-fns'
import { computed } from 'vue'
import { startOfWeek } from 'date-fns'
import { animate, stagger as _stagger } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'


const processedMarkdown = useProcessedMarkdown()

const { data: blogPosts } = await useAsyncData('blog-posts', () => processedMarkdown.getAllPosts())
const { data: weekNotes } = await useAsyncData('week-notes', () => processedMarkdown.getWeekNotes())

const _formatDate = (date) => format(new Date(date), 'yyyy-MM-dd')

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
    .filter(note => !note.hidden)
    .sort((a, b) => b.actualDate - a.actualDate)
})

function groupByYear(posts) {
  if (!posts) return {}
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
  return sortedPosts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
}

const blogPostsByYear = computed(() => groupByYear(blogPosts.value))

// Get an array of years sorted in descending order
const _sortedYears = computed(() =>
  Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
)

const blogPostElements = ref([])
const weekNoteElements = ref([])
const { timing, staggers, easing } = useAnimations()

onMounted(() => {
  // console.log(blogPostElements.value)
  // Animate blog posts
  animate(blogPostElements.value, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: timing.slow,
    ease: easing.standard,
    delay: _stagger(staggers.tight)
  })

  // animate the metadata sliding in from the left

  animate(blogPostElements.value.map((el,) => el.querySelector('.post-metadata')), {
    opacity: [0, 1],
    translateX: [-8, 0],
    duration: timing.expressive,
    ease: easing.standard,
    delay: timing.slow
  })

  // Animate week notes
  animate(weekNoteElements.value, {
    opacity: [0, 1],
    translateX: [20, 0],
    duration: timing.slow,
    ease: easing.productive,
    delay: _stagger(staggers.tight, { start: timing.expressive })
  })



})
</script>

<template>
  <div class="container mx-auto px-2 py-12 lg:flex lg:gap-4 max-w-prose">
    <!-- Week Notes -->
    <section class="">
      <h2 class="text-3xl font-bold mb-8">
        Week Notes
      </h2>
      <div
        v-for="weekNote in sortedWeekNotes" :key="weekNote.slug" ref="weekNoteElements"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4 my-8 xl:my-16"
      >
        <NuxtLink
          :to="`/blog/${weekNote.slug}`"
          class="hover:underline text-sm bg-zinc-50 dark:bg-transparent font-mono block px-2 py-1 rounded"
        >
          {{ weekNote.slug.split('/')[1] }}
        </NuxtLink>
        <p v-if="weekNote.dek" class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          {{ weekNote.dek }}
        </p>
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