<script setup>
import { format } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'
import { useWindowSize } from '@vueuse/core'

const processedMarkdown = useProcessedMarkdown()
const { data: robotNotes } = await useAsyncData('robot-notes', () =>
  processedMarkdown.getRobotNotesWithContent()
)

const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd')

const robotElements = ref([])
const activeSection = ref('')
const { width } = useWindowSize()
const _isMobile = computed(() => width.value < 768)

// Group notes by tag for the TOC
const _notesByTag = computed(() => {
  if (!robotNotes.value) return {}

  const grouped = {}
  robotNotes.value.forEach(note => {
    note.tags?.forEach(tag => {
      if (!grouped[tag]) grouped[tag] = []
      grouped[tag].push(note)
    })
  })
  return grouped
})

// Get all TOC headers for a note and calculate total word count
const getNoteSummary = (note) => {
  if (!note.content) return { headers: [], wordCount: 0 }

  // Get all headers from TOC
  const headers = note.toc?.flatMap(item =>
    item.children?.map(child => ({
      text: child.text,
      slug: child.slug
    })) || []
  ) || []

  // Calculate total word count
  const wordCount = note.content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .split(/\s+/)
    .length

  return { headers, wordCount }
}

const animDuration = 900
const animStagger = 25

onMounted(() => {
  // Animate robot notes
  animate(robotElements.value, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: animDuration,
    ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad in anime.js format
    delay: stagger(animStagger)
  })

  // Animate metadata
  animate(robotElements.value.map(el => el.querySelector('.post-metadata')), {
    opacity: [0, 1],
    translateX: [-8, 0],
    duration: animDuration * 2,
    ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad in anime.js format
    delay: animDuration * 0.82
  })

  // Set up intersection observers for each note
  robotElements.value?.forEach(section => {
    const { stop: _stop } = useIntersectionObserver(
      section,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          activeSection.value = section.id
        }
      },
      { threshold: 0.5 }
    )
  })
})
</script>

<template>
  <div class="container mx-auto px-2 py-12 lg:flex lg:gap-8 font-mono">
    <!-- Main Content -->
    <section class="lg:w-2/3">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">
          Robot Notes
        </h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          <a
            href="https://www.are.na/ej-fox/conversations-with-robots" target="_blank"
            class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            Conversations with Robots
          </a>, notes from various AI models, projects, and experiments.
        </p>
      </div>

      <div
        v-for="note in robotNotes" :id="note.slug.replace('robots/', '')" :key="note.slug" ref="robotElements"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4 my-8 xl:my-16"
      >
        <!-- Metadata row -->
        <div class="flex items-center justify-between mb-2">
          <div class="post-metadata text-sm text-zinc-500 dark:text-zinc-400 font-mono">
            {{ formatDate(note.date) }}
          </div>
          <div v-if="getNoteSummary(note).wordCount" class="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
            {{ getNoteSummary(note).wordCount }} words
          </div>
        </div>

        <NuxtLink :to="`/blog/robots/${note.slug.replace('robots/', '')}`" class="group">
          <h2
            class="text-xl font-semibold font-mono group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
          >
            {{ note.title }}
          </h2>
        </NuxtLink>

        <p v-if="note.description" class="text-zinc-600 dark:text-zinc-400 mt-2">
          {{ note.description }}
        </p>

        <!-- TOC Preview -->
        <div v-if="note.toc?.length" class="mt-6 space-y-2">
          <div class="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-mono">
            Sections:
          </div>
          <div class="flex flex-wrap gap-3">
            <template v-for="section in note.toc" :key="section.slug">
              <template v-if="section.children?.length">
                <NuxtLink
                  v-for="child in section.children" :key="child.slug"
                  :to="`/blog/robots/${note.slug.replace('robots/', '')}#${child.slug}`"
                  class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-zinc-200 dark:bg-zinc-800 rounded-md px-2 py-1"
                >
                  {{ child.text }}
                </NuxtLink>
              </template>
            </template>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="note.tags" class="mt-4 flex gap-2 flex-wrap">
          <span v-for="tag in note.tags" :key="tag" class="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
            {{ tag }}
          </span>
        </div>
      </div>

      <div v-if="!robotNotes?.length" class="text-center py-12 text-zinc-500">
        No shared robot notes yet.
      </div>
    </section>
  </div>
</template>

<style scoped>
.sticky {
  position: sticky;
  top: 2rem;
}
</style>