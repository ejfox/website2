<script setup>
import { format } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'
import { useWindowSize } from '@vueuse/core'
import { useAnimations } from '~/composables/useAnimations'

const route = useRoute()
const processedMarkdown = useProcessedMarkdown()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const activeSection = ref('')
const { timing, easing, staggers } = useAnimations()

const { data: note } = await useAsyncData(
  `robot-${route.params.slug.join('/')}`,
  () => processedMarkdown.getPostBySlug(`robots/${route.params.slug.join('/')}`)
)

// Redirect if note doesn't exist or isn't shared
if (!note.value || !note.value.metadata?.share) {
  throw createError({
    statusCode: 404,
    message: 'Robot note not found'
  })
}

// Update the trimmedToc computed to handle our TOC structure correctly
const trimmedToc = computed(() => {
  if (!note.value?.metadata?.toc) return []

  return note.value.metadata.toc
    .filter((item) => item.depth === 2 || item.depth === 3)
    .map((item) => ({
      text: item.text.length > 40 ? item.text.slice(0, 37) + '...' : item.text,
      slug: generateSlug(item.text),
      level: `h${item.depth}`
    }))
})

// Add the generateSlug helper function
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Update the word count logic to work with our structure
const sectionWordCounts = computed(() => {
  if (process.server || !note.value?.content) return {}

  const counts = {}
  const sections = note.value.metadata?.toc || []

  sections.forEach((section) => {
    if (section.depth <= 3) {
      const slug = generateSlug(section.text)
      counts[slug] = getSectionWordCount(note.value.content, slug)
    }
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

  while (
    currentElement &&
    (!currentElement.tagName.startsWith('H') ||
      parseInt(currentElement.tagName[1]) > parseInt(header.tagName[1]))
  ) {
    wordCount += currentElement.textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    currentElement = currentElement.nextElementSibling
  }

  return wordCount
}

// Helper to check if a string looks like a date
const _isDateString = (str) => {
  if (typeof str !== 'string') return false
  const date = new Date(str)
  return date instanceof Date && !isNaN(date)
}

// Computed property to get all metadata fields
const metadataFields = computed(() => {
  if (!note.value?.metadata) return {}

  const fields = {
    // Only include relevant fields in a specific order
    type: note.value.metadata.type,
    date: note.value.metadata.date,
    modified: note.value.metadata.modified,
    words: note.value.metadata.words,
    stats: {
      images: note.value.metadata.images,
      links: note.value.metadata.links,
      codeBlocks: note.value.metadata.codeBlocks,
      headers: note.value.metadata.headers
    }
  }

  return fields
})

// Format numbers with commas
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

// Update the formatDate function to be more concise
const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), "MMM d, yyyy 'at' h:mma")
}

// Add scroll progress tracking
const scrollProgress = ref(0)

// Add these computed properties and refs for the animation
const titleChars = computed(() => note.value?.title.split(''))
const titleRefs = ref([])

// Add this to process the content and add IDs to headings
const processedContent = computed(() => {
  if (!note.value?.content) return ''

  // Simple regex-based approach that works on both client and server
  return note.value.content.replace(
    /<(h[23])[^>]*>(.*?)<\/\1>/g,
    (match, tag, content) => {
      const slug = generateSlug(content.replace(/<[^>]+>/g, ''))
      return `<${tag} id="${slug}">${content}</${tag}>`
    }
  )
})

onMounted(() => {
  // Set up intersection observers for each section
  const sections = document.querySelectorAll('h2, h3')
  sections.forEach((section) => {
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

  // Update scroll progress
  const updateProgress = () => {
    const winScroll = window.scrollY
    const height = document.documentElement.scrollHeight - window.innerHeight
    scrollProgress.value = (winScroll / height) * 100
  }

  window.addEventListener('scroll', updateProgress)
  onUnmounted(() => window.removeEventListener('scroll', updateProgress))

  // Add title animation
  nextTick(() => {
    animateTitle()
  })
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
    <div
      class="lg:grid lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,350px] gap-8"
    >
      <article v-if="note">
        <!-- Metadata Display -->
        <div
          class="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg mb-8"
        >
          <div class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
            <!-- Type -->
            <div class="text-zinc-500 dark:text-zinc-400">type:</div>
            <div class="text-zinc-700 dark:text-zinc-300 capitalize">
              {{ metadataFields.type }}
            </div>

            <!-- Date -->
            <div class="text-zinc-500 dark:text-zinc-400">published:</div>
            <div class="text-zinc-700 dark:text-zinc-300">
              {{ formatDate(metadataFields.date) }}
            </div>

            <!-- Modified -->
            <div class="text-zinc-500 dark:text-zinc-400">updated:</div>
            <div class="text-zinc-700 dark:text-zinc-300">
              {{ formatDate(metadataFields.modified) }}
            </div>

            <!-- Word count -->
            <div class="text-zinc-500 dark:text-zinc-400">words:</div>
            <div class="text-zinc-700 dark:text-zinc-300">
              {{ formatNumber(metadataFields.words) }}
            </div>

            <!-- Stats -->
            <div class="text-zinc-500 dark:text-zinc-400">stats:</div>
            <div class="text-zinc-700 dark:text-zinc-300 grid gap-1">
              <template v-if="metadataFields.stats">
                <div v-if="metadataFields.stats.images">
                  {{ metadataFields.stats.images }} images
                </div>
                <div v-if="metadataFields.stats.links">
                  {{ metadataFields.stats.links }} links
                </div>
                <div v-if="metadataFields.stats.codeBlocks">
                  {{ metadataFields.stats.codeBlocks }} code blocks
                </div>
                <div v-if="metadataFields.stats.headers" class="flex gap-2">
                  <span
                    v-for="(count, level) in metadataFields.stats.headers"
                    :key="level"
                  >
                    {{ count }} {{ level }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <UAlert
          icon="i-majesticons-robot"
          color="orange"
          variant="solid"
          title="LLM-Generated / Augmented Content"
          description="This note was written by or with the assistance of AI. While I've reviewed and edited the content, you might notice some quirks in the writing style or reasoning, and it may not all be factually accurate."
          class="mb-8"
        />

        <header class="mb-8">
          <!-- Hero title with animation -->
          <h1 class="text-4xl md:text-6xl font-bold mb-4 flex flex-wrap">
            <span
              v-for="(char, i) in titleChars"
              :key="i"
              ref="titleRefs"
              class="inline-block opacity-0"
              :class="{ 'mr-[0.2em]': char === ' ' }"
              >{{ char }}</span
            >
          </h1>
          <p
            v-if="note.description"
            class="text-xl text-zinc-600 dark:text-zinc-400"
          >
            {{ note.description }}
          </p>
        </header>

        <!-- Content with adjusted max-width -->
        <div
          class="prose prose-sm font-mono dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-8 prose-p:py-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-8 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 prose-img:rounded-lg prose-hr:border-gray-300 dark:prose-hr:border-gray-700 !max-w-none"
          v-html="processedContent"
        />

        <footer
          class="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800"
        >
          <NuxtLink
            to="/blog/robots"
            class="text-blue-500 dark:text-blue-400 hover:underline"
          >
            ← Back to Robot Notes
          </NuxtLink>
        </footer>
      </article>

      <!-- Right Sidebar with TOC -->
      <aside
        v-if="!isMobile"
        class="hidden lg:block h-screen sticky top-0 pt-12"
      >
        <div class="space-y-8 max-h-[calc(100vh-6rem)] flex flex-col">
          <!-- Progress Bar -->
          <div class="dark:bg-zinc-900 p-4 rounded-lg flex-1 overflow-y-auto">
            <div
              class="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden flex-shrink-0 mb-4"
            >
              <div
                class="bg-blue-500 h-full transition-all duration-200"
                :style="{ width: `${scrollProgress}%` }"
              />
            </div>

            <h3
              class="text-lg font-semibold mb-4 sticky top-0 bg-inherit pb-2 border-b border-zinc-200 dark:border-zinc-700"
            >
              Table of Contents
            </h3>

            <!-- Add a target div for the TOC -->
            <div id="toc-target"></div>
          </div>
        </div>
      </aside>
    </div>
    <UAlert
      icon="i-majesticons-robot"
      color="orange"
      variant="solid"
      title="LLM-Generated / Augmented Content"
      description="This note was written by or with the assistance of AI."
      class="mb-8"
    />
  </div>

  <!-- Teleport the TOC into the sidebar -->
  <Teleport to="#toc-target">
    <nav v-if="trimmedToc.length" class="space-y-2">
      <template v-for="section in trimmedToc" :key="section.slug">
        <NuxtLink
          :to="`#${section.slug}`"
          class="block py-1.5 transition-colors duration-200 text-sm"
          :class="[
            section.level === 'h3' ? 'pl-4' : '',
            activeSection === section.slug
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400'
          ]"
        >
          <div class="flex justify-between items-center group">
            <span>{{ section.text }}</span>
            <span
              v-if="sectionWordCounts[section.slug]"
              class="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
            >
              {{ sectionWordCounts[section.slug] }} words
            </span>
          </div>
        </NuxtLink>
      </template>
    </nav>
  </Teleport>
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
  font-family:
    'Monaspace Radon', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace !important;
}

.font-monaspace {
  font-family:
    'Monaspace Radon', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace !important;
}
</style>
