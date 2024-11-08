<script setup>
import { format } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'
import { useWindowSize } from '@vueuse/core'

const route = useRoute()
const processedMarkdown = useProcessedMarkdown()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const activeSection = ref('')

const { data: note } = await useAsyncData(`robot-${route.params.slug.join('/')}`, () =>
  processedMarkdown.getPostBySlug(`robots/${route.params.slug.join('/')}`)
)

// Redirect if note doesn't exist or isn't shared
if (!note.value || !note.value.share) {
  throw createError({
    statusCode: 404,
    message: 'Robot note not found'
  })
}

// New computed property to trim TOC items
const trimmedToc = computed(() => {
  if (!note.value?.toc) return []
  return note.value.toc.flatMap(item =>
    item.children?.map(child => ({
      ...child,
      text: child.text.length > 20 ? child.text.slice(0, 17) + '...' : child.text
    })) || []
  )
})

// Move word count logic into a client-only computed property
const sectionWordCounts = computed(() => {
  // Only run in client
  if (process.server || !note.value?.content) return {}

  const counts = {}
  note.value.toc?.forEach(item => {
    item.children?.forEach(child => {
      counts[child.slug] = getSectionWordCount(note.value.content, child.slug)
    })
  })

  return counts
})

// Helper function to count words in a section
const getSectionWordCount = (content, sectionId) => {
  // Only run in client
  if (process.server) return 0

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')

  const header = doc.getElementById(sectionId)
  if (!header) return 0

  let wordCount = 0
  let currentElement = header.nextElementSibling

  while (currentElement &&
    (!currentElement.tagName.startsWith('H') ||
      parseInt(currentElement.tagName[1]) > parseInt(header.tagName[1]))) {
    wordCount += currentElement.textContent
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length

    currentElement = currentElement.nextElementSibling
  }

  return wordCount
}

// Helper to check if a string looks like a date
const isDateString = (str) => {
  if (typeof str !== 'string') return false
  const date = new Date(str)
  return date instanceof Date && !isNaN(date)
}

// Computed property to get all metadata fields
const metadataFields = computed(() => {
  if (!note.value) return {}

  // Get all fields except content and toc
  const fields = { ...note.value }
  delete fields.content
  delete fields.toc

  // Sort fields by key
  return Object.keys(fields)
    .sort()
    .reduce((obj, key) => {
      obj[key] = fields[key]
      return obj
    }, {})
})

// Update the formatDate function to be more verbose
const formatDate = (date) => {
  if (!date) return ''
  return format(
    new Date(date),
    "MMMM do, yyyy 'at' h:mm:ss aaaa zzz"
  )
}

// Add scroll progress tracking
const scrollProgress = ref(0)

onMounted(() => {
  // Set up intersection observers for each section
  const sections = document.querySelectorAll('h2, h3')
  sections.forEach(section => {
    const { stop } = useIntersectionObserver(
      section,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          activeSection.value = section.id
        }
      },
      { threshold: 0.5 }
    )
  })

  // Update scroll progress
  const updateProgress = () => {
    const winScroll = window.scrollY
    const height = document.documentElement.scrollHeight - window.innerHeight
    scrollProgress.value = (winScroll / height) * 100
  }

  window.addEventListener('scroll', updateProgress)
  onUnmounted(() => window.removeEventListener('scroll', updateProgress))
})

// Add useHead for robot-specific styling
useHead({
  title: note.value?.title,
  link: [
    {
      rel: 'preload',
      href: 'https://cdn.jsdelivr.net/gh/githubnext/monaspace@v1.000/fonts/webfonts/MonaspaceRadon-Regular.woff',
      as: 'font',
      type: 'font/woff',
      crossorigin: 'anonymous'
    }
  ],
  style: [
    {
      innerHTML: `
        @font-face {
          font-family: 'Monaspace Radon';
          src: url('https://cdn.jsdelivr.net/gh/githubnext/monaspace@v1.000/fonts/webfonts/MonaspaceRadon-Regular.woff') format('woff');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `
    }
  ]
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Main Content with Adjusted Layout -->
    <div class="lg:grid lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,350px] gap-8">
      <article v-if="note">
        <!-- Metadata Display -->
        <div class="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg mb-8 overflow-x-auto">
          <div class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
            <template v-for="(value, key) in metadataFields" :key="key">
              <!-- Skip content and internal fields -->
              <template v-if="!['content', '_id', '_path', 'body'].includes(key)">
                <div class="text-zinc-500 dark:text-zinc-400">{{ key }}:</div>
                <div class="text-zinc-700 dark:text-zinc-300">
                  <!-- Format arrays nicely -->
                  <template v-if="Array.isArray(value)">
                    [{{ value.join(', ') }}]
                  </template>
                  <!-- Format dates nicely -->
                  <template v-else-if="isDateString(value)">
                    {{ formatDate(value) }}
                  </template>
                  <!-- Format booleans -->
                  <template v-else-if="typeof value === 'boolean'">
                    {{ value ? 'true' : 'false' }}
                  </template>
                  <!-- Default display -->
                  <template v-else>
                    {{ value }}
                  </template>
                </div>
              </template>
            </template>
          </div>
        </div>

        <UAlert icon="i-majesticons-robot" color="orange" variant="solid" title="LLM-Generated / Augmented Content"
          description="This note was written by or with the assistance of AI. While I've reviewed and edited the content, you might notice some quirks in the writing style or reasoning, and it may not all be factually accurate."
          class="mb-8" />

        <header class="mb-8">
          <h1 class="text-4xl font-bold mb-4">{{ note.title }}</h1>
          <p v-if="note.description" class="text-xl text-zinc-600 dark:text-zinc-400">
            {{ note.description }}
          </p>
        </header>

        <!-- Content with adjusted max-width -->
        <div class="prose prose-sm font-mono dark:prose-invert 
             prose-headings:font-bold prose-headings:tracking-tight 
             prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl 
             prose-p:leading-8 prose-p:py-2 
             prose-a:text-blue-600 hover:prose-a:text-blue-500 
             dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 
             prose-a:underline transition-all duration-100 ease-in-out 
             prose-strong:font-semibold prose-blockquote:border-l-4 
             prose-blockquote:border-blue-500 prose-blockquote:pl-4 
             prose-blockquote:italic prose-blockquote:my-8 
             prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 
             prose-img:rounded-lg prose-hr:border-gray-300 
             dark:prose-hr:border-gray-700
             !max-w-none" v-html="note.content" />

        <footer class="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <NuxtLink to="/blog/robots" class="text-blue-500 dark:text-blue-400 hover:underline">
            ← Back to Robot Notes
          </NuxtLink>
        </footer>
      </article>

      <!-- Right Sidebar with TOC -->
      <aside v-if="!isMobile && note?.toc?.length" class="hidden lg:block h-screen sticky top-0 pt-12">
        <div class="space-y-8 max-h-[calc(100vh-6rem)] flex flex-col">
          <!-- Progress Bar - moved inside the dark background -->
          <div class="dark:bg-zinc-900 p-4 rounded-lg flex-1 overflow-y-auto">
            <div class="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden flex-shrink-0 mb-4">
              <div class="bg-blue-500 h-full transition-all duration-200" :style="{ width: `${scrollProgress}%` }" />
            </div>

            <h3
              class="text-lg font-semibold mb-4 sticky top-0 bg-inherit pb-2 border-b border-zinc-200 dark:border-zinc-700">
              Table of Contents
            </h3>

            <nav :class="{
              'columns-1': note.toc.reduce((acc, item) => acc + (item.children?.length || 0), 0) < 10,
              'columns-2 gap-8': note.toc.reduce((acc, item) => acc + (item.children?.length || 0), 0) >= 10
            }">
              <div v-for="item in note.toc" :key="item.slug">
                <div v-if="item.children?.length" class="break-inside-avoid-column mb-4">
                  <div class="space-y-1">
                    <a v-for="child in item.children" :key="child.slug" :href="`#${child.slug}`"
                      class="block py-1 px-2 text-sm rounded transition-colors" :class="[
                        activeSection === child.slug
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      ]">
                      {{ child.text }}
                      <ClientOnly>
                        <div v-if="sectionWordCounts[child.slug] && sectionWordCounts[child.slug] > 100"
                          class="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                          {{ sectionWordCounts[child.slug] }} words
                        </div>
                      </ClientOnly>
                    </a>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </div>
    <UAlert icon="i-majesticons-robot" color="orange" variant="solid" title="LLM-Generated / Augmented Content"
      description="This note was written by or with the assistance of AI." class="mb-8" />
  </div>
</template>

<style scoped>
.sticky {
  position: sticky;
  top: 2rem;
}

/* Add smooth transitions for the chip opacity */
.group:hover .opacity-50 {
  opacity: 1;
}

/* Add some styling for the metadata display */
.grid {
  font-family: 'Courier New', Courier, monospace;
}

/* Make the metadata section scrollable on mobile */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

/* Prevent column breaks inside items */
.break-inside-avoid-column {
  break-inside: avoid-column;
}

/* Update the font-mono utility class just for robot pages */
.font-mono {
  font-family: 'Monaspace Radon', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}

.font-monaspace {
  font-family: 'Monaspace Radon', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}
</style>