<script setup>
import { format } from 'date-fns/format'
// Animation handled via global anime.js from CDN
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
  robotNotes.value.forEach((note) => {
    note.tags?.forEach((tag) => {
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
  const headers =
    note.toc?.flatMap(
      (item) =>
        item.children?.map((child) => ({
          text: child.text,
          slug: child.slug
        })) || []
    ) || []

  // Calculate total word count
  const wordCount = note.content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .split(/\s+/).length

  return { headers, wordCount }
}
</script>

<template>
  <div class="container mx-auto px-2 py-8 lg:flex lg:gap-8 font-mono">
    <!-- Main Content -->
    <section class="lg:w-2/3">
      <div class="mb-8">
        <h1 class="text-3xl font-light">Robot Notes</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          <a
            href="https://www.are.na/ej-fox/conversations-with-robots"
            target="_blank"
            class="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Conversations with Robots </a
          >, notes from various AI models, projects, and experiments.
        </p>
      </div>

      <div
        v-for="note in robotNotes"
        :id="note.slug.replace('robots/', '')"
        :key="note.slug"
        ref="robotElements"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4 my-8 xl:my-16"
      >
        <!-- Metadata row -->
        <div class="flex items-center justify-between mb-2">
          <div
            class="post-metadata text-sm text-zinc-500 dark:text-zinc-400 font-mono"
          >
            {{ formatDate(note.date) }}
          </div>
          <div
            v-if="getNoteSummary(note).wordCount"
            class="text-xs text-zinc-400 dark:text-zinc-600 font-mono"
          >
            {{ getNoteSummary(note).wordCount }} words
          </div>
        </div>

        <NuxtLink
          :to="`/blog/robots/${note.slug.replace('robots/', '')}`"
          class="group"
        >
          <h2
            class="text-xl font-light font-mono group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors"
          >
            {{ note.title }}
          </h2>
        </NuxtLink>

        <p
          v-if="note.description"
          class="text-zinc-600 dark:text-zinc-400 mt-2"
        >
          {{ note.description }}
        </p>

        <!-- TOC Preview -->
        <div v-if="note.toc?.length" class="mt-8 space-y-2">
          <div
            class="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-mono"
          >
            Sections:
          </div>
          <div class="flex flex-wrap gap-4">
            <template v-for="section in note.toc" :key="section.slug">
              <template v-if="section.children?.length">
                <NuxtLink
                  v-for="child in section.children"
                  :key="child.slug"
                  :to="`/blog/robots/${note.slug.replace('robots/', '')}#${child.slug}`"
                  class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors bg-zinc-200 dark:bg-zinc-800 rounded-md px-2 py-1"
                >
                  {{ child.text }}
                </NuxtLink>
              </template>
            </template>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="note.tags" class="mt-4 flex gap-2 flex-wrap">
          <span
            v-for="tag in note.tags"
            :key="tag"
            class="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div v-if="!robotNotes?.length" class="text-center py-8 text-zinc-500">
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
