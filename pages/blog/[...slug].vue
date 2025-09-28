<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { useDark, useIntersectionObserver } from '@vueuse/core'

const config = useRuntimeConfig()
const isDark = useDark()
const processedMarkdown = useProcessedMarkdown()

const route = useRoute()

// Handle redirection and post fetching
const { data: post, error } = await useAsyncData(
  `post-${route.params.slug.join('-')}`,
  async () => {
    const slugParts = route.params.slug

    try {
      // Fetch the post data, including potential redirection info
      const response = await $fetch(`/api/posts/${slugParts.join('/')}`)

      if (response.redirect) {
        // Check if we're already on the correct URL
        if (route.path !== response.redirect) {
          return { redirect: response.redirect }
        }
      }

      if (response.error) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  }
)

// Perform redirection if necessary
if (post.value && post.value.redirect) {
  if (route.path !== post.value.redirect) {
    navigateTo(post.value.redirect, { replace: true })
  }
}

const { params } = useRoute()
const { data: nextPrevPosts } = await useAsyncData(
  `next-prev-${route.params.slug.join('-')}`,
  async () => {
    try {
      return await processedMarkdown.getNextPrevPosts(
        route.params.slug.join('/')
      )
    } catch (error) {
      console.error('Error getting next/prev posts:', error)
      return { next: null, prev: null }
    }
  }
)
// New refs for animation targets
const postTitle = ref(null)
const postMetadata = ref(null)
const postMetadataComponent = ref(null)
const navigationLinks = ref(null)
const articleContent = ref(null)
const headings = ref([])
const activeSection = ref('')
const titleWidth = ref(0)

// Scroll progress tracking (just the percentage)
const scrollProgress = ref(0)

// Debug grid toggle
const showDebugGrid = ref(false) // Dev only - toggle with Cmd+G

// Calculate reading stats
const readingStats = computed(() => {
  const words = post.value?.metadata?.words || post.value?.words || 0
  const images = post.value?.metadata?.images || post.value?.images || 0
  const links = post.value?.metadata?.links || post.value?.links || 0
  const readingTime = Math.ceil(words / 200)
  const characters =
    post.value?.html?.length || post.value?.content?.length || 0
  const linkDensity = words > 0 ? (links / (words / 100)).toFixed(1) : '0'
  const paragraphs = post.value?.html
    ? (post.value.html.match(/<p[^>]*>/g) || []).length
    : 0
  const headings = post.value?.html
    ? (post.value.html.match(/<h[1-6][^>]*>/g) || []).length
    : 0

  return {
    words,
    images,
    links,
    readingTime,
    characters,
    linkDensity,
    paragraphs,
    headings,
    fileSize: (characters / 1024).toFixed(1) + 'KB',
    compression: (((characters - words) / characters) * 100).toFixed(0) + '%',
    avgWordLength: words > 0 ? (characters / words).toFixed(1) : '0'
  }
})

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

// Simple setup for title and TOC
onMounted(() => {
  if (postTitle.value) {
    titleWidth.value = postTitle.value.offsetWidth
  }

  // Track scroll progress
  const handleScroll = () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight
    const currentScroll = window.scrollY
    scrollProgress.value = Math.min((currentScroll / scrollHeight) * 100, 100)
  }

  // Toggle debug grid with Cmd+G or Ctrl+G
  const handleKeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
      e.preventDefault()
      showDebugGrid.value = !showDebugGrid.value
    }
  }

  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('keydown', handleKeydown)
  })

  // Simple TOC intersection observer
  nextTick(() => {
    if (!articleContent.value) return
    headings.value = Array.from(
      articleContent.value.querySelectorAll('h2, h3, h4')
    )

    headings.value.forEach((heading) => {
      const { stop } = useIntersectionObserver(
        heading,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            activeSection.value = heading.id
          }
        },
        { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
      )
      heading._stopObserver = stop
    })
  })

  onUnmounted(() => {
    headings.value.forEach((heading) => {
      if (heading._stopObserver) {
        heading._stopObserver()
      }
    })
  })
})

// TOC target for teleport
const tocTarget = computed(() => {
  if (typeof document === 'undefined') return null
  return document.getElementById('nav-toc-container')
})

// Title typing animation
const letters = computed(() => {
  const title = post.value?.metadata?.title || post.value?.title
  if (!title) return []

  // Split the title into individual letters, preserving spaces
  return title.split('').map((char, index) => ({
    char,
    id: index,
    isSpace: char === ' '
  }))
})

// Track animation state
const animationState = reactive({
  currentIndex: 0,
  isAnimating: false,
  visibleLetters: new Set(),
  cursorPosition: 0,
  hasAnimated: false // Track if we've animated this title already
})

// Update the rendered title to wrap words properly
const renderedTitle = computed(() => {
  // If we haven't started animating yet, show all letters
  if (!animationState.hasAnimated) {
    const spans = letters.value.map(({ char, isSpace }) => {
      if (isSpace) {
        return `</span><span class="word">`
      }
      return `<span class="letter visible">${char}</span>`
    })
    return `<span class="word">${spans.join('')}</span>`
  }

  // During animation
  const spans = letters.value.map(({ char, id, isSpace }, index) => {
    const isVisible = animationState.visibleLetters.has(id)
    const isCursorHere =
      !isSpace &&
      index === animationState.cursorPosition &&
      animationState.isAnimating

    if (isSpace) {
      return `</span><span class="word">`
    }

    return `<span class="letter ${isVisible ? 'visible' : 'hidden'}">${char}${isCursorHere ? '<span class="cursor"></span>' : ''}</span>`
  })
  return `<span class="word">${spans.join('')}</span>`
})

// Typing animation - only runs on client after mount
async function typeText() {
  if (animationState.hasAnimated) return

  // Mark that we're starting animation
  animationState.hasAnimated = true
  animationState.isAnimating = true
  animationState.visibleLetters.clear()
  animationState.cursorPosition = 0

  const LETTER_DELAY = 50 // Faster typing
  const PAUSE_DELAY = 200 // Shorter pauses

  for (let i = 0; i < letters.value.length; i++) {
    const letter = letters.value[i]
    const delay =
      letter.isSpace || /[.,!?;:]/.test(letter.char)
        ? PAUSE_DELAY
        : LETTER_DELAY
    await new Promise((resolve) => setTimeout(resolve, delay))
    animationState.visibleLetters.add(letter.id)
    animationState.cursorPosition = i
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
  animationState.isAnimating = false
}

// Only animate after component is mounted and stable
onMounted(() => {
  // Wait a bit for everything to settle
  setTimeout(() => {
    typeText()
  }, 100)
})

function formatDate(date) {
  if (!date) return 'No date'
  let parsedDate =
    typeof date === 'string'
      ? parseISO(date)
      : date instanceof Date
        ? date
        : null
  return !parsedDate || !isValid(parsedDate)
    ? 'Invalid date'
    : format(parsedDate, 'MMMM d, yyyy')
}

function formatShortDate(date) {
  if (!date) return 'N/A'
  let parsedDate =
    typeof date === 'string'
      ? parseISO(date)
      : date instanceof Date
        ? date
        : null
  return !parsedDate || !isValid(parsedDate)
    ? 'N/A'
    : format(parsedDate, 'MMM dd, yyyy').toUpperCase()
}

function formatCompactNumber(num) {
  if (!num) return '0'
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'K'
  return Math.floor(num / 1000) + 'K'
}

function getBaseUrl() {
  if (config.public && config.public.baseURL) return config.public.baseURL
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ejfox.com'
}

const baseURL = getBaseUrl()
const postUrl = computed(
  () => new URL(`/blog/${params.slug.join('/')}`, baseURL).href
)

useHead(() => ({
  title: post.value?.metadata?.title || post.value?.title,
  meta: [
    {
      name: 'description',
      content: post.value?.metadata?.dek || post.value?.dek
    },
    {
      property: 'og:title',
      content: post.value?.metadata?.title || post.value?.title
    },
    {
      property: 'og:description',
      content: post.value?.metadata?.dek || post.value?.dek
    },
    { property: 'og:url', content: postUrl.value },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:title',
      content: post.value?.metadata?.title || post.value?.title
    },
    {
      name: 'twitter:description',
      content: post.value?.metadata?.dek || post.value?.dek
    }
  ],
  link: [{ rel: 'canonical', href: postUrl.value }],
  htmlAttrs: { lang: 'en' }
}))

// Add this new computed property
const isBlogPost = computed(() => {
  return route.path.startsWith('/blog/') && route.path !== '/blog/'
})
// Add computed property to check if donations should be shown
const showDonations = computed(() => {
  // Show donations by default unless explicitly disabled in frontmatter
  // return post.value?.donation !== false
  // actually lets hide by default
  return false
})

const smartSuggestions = ref([])

const distance = (a, b) => {
  if (!a || !b) return 999
  const [len1, len2] = [a.length, b.length]
  if (len1 === 0) return len2
  if (len2 === 0) return len1

  let prev = Array(len2 + 1)
    .fill(0)
    .map((_, i) => i)

  for (let i = 1; i <= len1; i++) {
    const curr = [i]
    for (let j = 1; j <= len2; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : Math.min(prev[j - 1], prev[j], curr[j - 1]) + 1
    }
    prev = curr
  }
  return prev[len2]
}

watch(
  error,
  async (err) => {
    if (!err) return

    try {
      const posts = await $fetch('/api/manifest')
      const path = route.path.replace(/^\/blog\//, '').toLowerCase()

      const matches =
        posts
          ?.filter((p) => !p.hidden && !p.draft)
          .map((p) => ({
            title: p.title,
            path: `/blog/${p.slug}`,
            score: Math.max(
              50 - distance(p.slug?.replace(/^\d{4}\//, ''), path),
              30 - distance(p.title?.toLowerCase().replace(/\s+/g, '-'), path)
            )
          }))
          .filter((p) => p.score > 10)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3) || []

      smartSuggestions.value = matches.length
        ? matches
        : [{ title: 'Blog Archive', path: '/blog' }]
    } catch {
      smartSuggestions.value = [{ title: 'Blog Archive', path: '/blog' }]
    }
  },
  { immediate: true }
)

// DELETE: Removed 369KB OpenPGP.js signature verification for performance

/**
 * Post Metadata Structure
 * ======================
 * All post metadata MUST be inside the metadata object:
 *
 * {
 *   content: "<article>...</article>",
 *   html: "<article>...</article>",
 *   title: "Post Title",
 *   metadata: {
 *     // Required
 *     date: "2024-01-01T00:00:00.000Z",
 *     modified: "2024-01-02T00:00:00.000Z",
 *     dek: "Post description",
 *     type: "post",
 *
 *     // Stats (auto-calculated)
 *     words: 2077,
 *     images: 3,
 *     links: 6,
 *
 *     // Optional
 *     tags: ["tag1", "tag2"],
 *     draft: false,
 *     hidden: false
 *   }
 * }
 */

// Prepare metadata for PostMetadata component
const processedMetadata = computed(() => {
  if (!post.value) return null

  const metadata = post.value.metadata
  if (!metadata) {
    console.warn('Post is missing metadata object:', post.value)
    return null
  }

  return {
    // Basic metadata
    slug: metadata.slug || route.params.slug.join('/'),
    title: post.value.title || metadata.title, // Use top-level title first
    date: metadata.date,
    draft: metadata.draft,

    // Stats
    readingTime: Math.ceil(metadata.words / 200),
    wordCount: metadata.words,
    imageCount: metadata.images,
    linkCount: metadata.links,

    // Additional metadata
    type: metadata.type,
    dek: metadata.dek,
    metadata // Pass through full metadata object
  }
})
</script>

<template>
  <div class="relative">
    <Head>
      <Meta
        name="robots"
        :content="
          post?.metadata?.robotsMeta || post?.robotsMeta || 'index, follow'
        "
      />
    </Head>

    <!-- Debug Grid Overlay (8px baseline) - Dev only, toggle with Cmd+G -->
    <div
      v-show="showDebugGrid"
      class="pointer-events-none"
      style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        background-image:
          repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 7px,
            rgba(59, 130, 246, 0.1) 7px,
            rgba(59, 130, 246, 0.1) 8px
          ),
          repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 31px,
            rgba(59, 130, 246, 0.2) 31px,
            rgba(59, 130, 246, 0.2) 32px
          );
        background-size:
          100% 8px,
          100% 32px;
      "
    >
      <!-- Column grid -->
      <div class="max-w-4xl mx-auto h-full" style="position: relative">
        <div class="grid grid-cols-12 h-full">
          <div
            v-for="i in 12"
            :key="i"
            style="border-right: 1px solid rgba(34, 197, 94, 0.1)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Reading progress bar at top of page -->
    <div
      v-if="post && !post.redirect"
      class="fixed top-0 left-0 right-0 h-[1px] bg-zinc-200 dark:bg-zinc-800 z-50"
    >
      <div
        class="h-full bg-zinc-600 dark:bg-zinc-400 transition-all duration-100 ease-out"
        :style="`width: ${scrollProgress}%`"
      ></div>
    </div>

    <article v-if="post && !post.redirect" class="h-entry">
      <!-- Swiss Grid Container -->
      <div class="max-w-4xl mx-auto">
        <!-- Top metadata bar with microvisualizations -->
        <div
          ref="postMetadata"
          class="border-b border-zinc-200 dark:border-zinc-800"
        >
          <!-- Ultra-compact single line metadata -->
          <div
            class="font-mono text-xs text-zinc-500 px-4 md:px-6 py-1 uppercase tabular-nums flex items-center gap-2 overflow-x-auto tracking-wider"
          >
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">DATE</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                formatShortDate(post?.metadata?.date || post?.date)
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">TIME</span>
              <span class="text-zinc-600 dark:text-zinc-300"
                >{{ readingStats.readingTime }}MIN</span
              >
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">WORDS</span>
              <svg
                :width="Math.min(readingStats.words / 100, 30)"
                height="8"
                class="inline-block"
              >
                <rect
                  v-for="i in Math.min(Math.ceil(readingStats.words / 500), 30)"
                  :key="i"
                  :x="(i - 1) * 2"
                  y="3"
                  width="1"
                  height="2"
                  fill="currentColor"
                  opacity="0.4"
                />
              </svg>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                formatCompactNumber(readingStats.words)
              }}</span>
            </span>
            <span
              v-if="readingStats.images > 0"
              class="text-zinc-300 dark:text-zinc-700"
              >·</span
            >
            <span
              v-if="readingStats.images > 0"
              class="flex items-center gap-1.5 whitespace-nowrap"
            >
              <span class="text-zinc-400">IMG</span>
              <svg
                :width="Math.min(readingStats.images * 2, 20)"
                height="8"
                class="inline-block"
              >
                <rect
                  v-for="i in Math.min(readingStats.images, 10)"
                  :key="i"
                  :x="(i - 1) * 2"
                  y="3"
                  width="1"
                  height="2"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                readingStats.images
              }}</span>
            </span>
            <span
              v-if="readingStats.links > 0"
              class="text-zinc-300 dark:text-zinc-700"
              >·</span
            >
            <span
              v-if="readingStats.links > 0"
              class="flex items-center gap-1.5 whitespace-nowrap"
            >
              <span class="text-zinc-400">LINKS</span>
              <svg
                :width="Math.min(readingStats.links, 20)"
                height="8"
                class="inline-block"
              >
                <rect
                  v-for="i in Math.min(readingStats.links, 20)"
                  :key="i"
                  :x="i - 1"
                  y="3"
                  width="1"
                  height="2"
                  fill="currentColor"
                  opacity="0.5"
                />
              </svg>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                readingStats.links
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">SIZE</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                readingStats.fileSize
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">DENS</span>
              <span class="text-zinc-600 dark:text-zinc-300"
                >{{ readingStats.linkDensity }}/100W</span
              >
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">CHARS</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                formatCompactNumber(readingStats.characters)
              }}</span>
            </span>
          </div>
        </div>

        <!-- Title section - properly aligned to 8px grid -->
        <div
          class="px-4 md:px-6"
          style="padding-top: 24px; padding-bottom: 16px"
        >
          <h1
            v-if="post?.metadata?.title || post?.title"
            ref="postTitle"
            class="font-serif font-light p-name mb-2 text-4xl md:text-5xl lg:text-6xl"
            style="line-height: 1.15; letter-spacing: -0.025em"
          >
            {{ post?.metadata?.title || post?.title }}
          </h1>
          <p
            v-if="post?.metadata?.dek || post?.dek"
            class="font-serif text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mb-4"
            style="line-height: 1.6"
          >
            {{ post?.metadata?.dek || post?.dek }}
          </p>
        </div>

        <!-- Published time for microformats -->
        <time
          v-if="post?.metadata?.date"
          :datetime="post.metadata.date"
          class="dt-published hidden"
        >
          {{ formatDate(post.metadata.date) }}
        </time>

        <!-- Author info for microformats -->
        <div class="p-author h-card hidden">
          <span class="p-name">EJ Fox</span>
          <a class="u-url" href="https://ejfox.com">ejfox.com</a>
        </div>

        <!-- Permalink for microformats -->
        <a :href="postUrl" class="u-url hidden">{{ postUrl }}</a>

        <!-- Article Content aligned to 8px grid -->
        <div
          ref="articleContent"
          class="px-4 md:px-6"
          style="padding-top: 16px; padding-bottom: 32px"
        >
          <article
            v-if="post?.html"
            class="blog-post-content e-content font-serif"
            v-html="post.html"
          ></article>
          <div
            v-else-if="post?.content"
            class="blog-post-content e-content font-serif"
            v-html="post.content"
          ></div>
          <div v-else class="text-center text-red-500">
            No content available for this post
          </div>
        </div>

        <!-- Tags Section - Swiss grid aligned -->
        <div
          v-if="post.tags || post.metadata?.tags"
          class="px-4 md:px-6 py-3 border-t border-zinc-200 dark:border-zinc-800"
        >
          <div class="flex flex-wrap gap-2">
            <a
              v-for="tag in post.tags || post.metadata?.tags"
              :key="tag"
              :href="`/blog/tag/${tag}`"
              class="px-4 py-1 text-xs font-mono uppercase tracking-[0.2em] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors no-underline p-category"
              >{{ tag }}</a
            >
          </div>
        </div>

        <!-- Navigation Links - Swiss grid with 2-4-8 rhythm -->
        <div
          v-if="nextPrevPosts"
          ref="navigationLinks"
          class="grid grid-cols-2 gap-4 px-4 md:px-6 py-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <div v-if="nextPrevPosts.prev">
            <NuxtLink
              :to="`/blog/${nextPrevPosts.prev.slug}`"
              class="block no-underline group"
            >
              <span
                class="block text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 mb-1"
              >
                PREVIOUS
              </span>
              <span
                class="block text-base font-serif leading-5 text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors"
              >
                {{ nextPrevPosts.prev?.title }}
              </span>
              <span class="block text-xs font-mono text-zinc-400 leading-4">
                {{ formatDate(nextPrevPosts.prev.date) }}
              </span>
            </NuxtLink>
          </div>
          <div v-else></div>

          <div v-if="nextPrevPosts.next" class="text-right">
            <NuxtLink
              :to="`/blog/${nextPrevPosts.next.slug}`"
              class="block no-underline group"
            >
              <span
                class="block text-xs font-mono uppercase tracking-[0.1em] text-zinc-500 mb-1"
              >
                NEXT
              </span>
              <span
                class="block text-base font-serif leading-5 text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors"
              >
                {{ nextPrevPosts.next?.title }}
              </span>
              <span class="block text-xs font-mono text-zinc-400 leading-4">
                {{ formatDate(nextPrevPosts.next.date) }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
      <!-- End Swiss Grid Container -->

      <!-- Tip jar - minimal CTA -->
      <BlogTipJar v-if="!post.metadata?.noTips" />
    </article>
    <ErrorPage
      v-else-if="error"
      :path="route?.path || 'unknown'"
      :suggestions="smartSuggestions.filter((s) => s.title !== 'Blog Archive')"
      :primary-link="{ href: '/blog', text: 'browse all posts' }"
    />
    <div v-else class="p-4 text-center">
      <p class="text-xl text-zinc-600 dark:text-zinc-400">Loading...</p>
    </div>

    <!-- Desktop TOC with scroll progress -->
    <teleport v-if="tocTarget" to="#nav-toc-container">
      <div
        v-if="
          post?.toc?.[0]?.children?.length ||
          post?.metadata?.toc?.[0]?.children?.length
        "
        class="toc"
      >
        <div class="py-4">
          <h3
            class="text-xs font-mono uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 mb-4"
          >
            CONTENTS
          </h3>
          <ul class="space-y-1">
            <li
              v-for="child in post?.toc?.[0]?.children ||
              post?.metadata?.toc?.[0]?.children"
              :key="child.slug"
              class="group relative"
            >
              <a
                :href="`#${child.slug}`"
                class="block text-sm transition-colors duration-200 no-underline py-1"
                :class="[
                  activeSection === child.slug
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                ]"
              >
                <span class="block truncate">{{ child.text }}</span>
              </a>
              <!-- Active indicator -->
              <div
                v-if="activeSection === child.slug"
                class="absolute left-0 top-2 bottom-2 w-[2px] bg-zinc-900 dark:bg-zinc-100 rounded-full"
              ></div>
            </li>
          </ul>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style lang="postcss">
.blog-post-content {
  @apply font-serif opacity-100;
}

/* Body text aligned to 8px grid */
.blog-post-content p {
  @apply max-w-prose;
  font-size: 1.125rem; /* 18px for better readability */
  line-height: 28px; /* 3.5x8px for comfortable reading */
  margin-bottom: 16px; /* 2x8px */
}

/* Headings with natural typographic rhythm */
.blog-post-content h1 {
  @apply font-serif font-light max-w-prose;
  font-size: 2rem; /* 32px mobile */
  line-height: 40px; /* 5x8px */
  margin-top: 48px; /* 6x8px */
  margin-bottom: 24px; /* 3x8px */
  letter-spacing: -0.02em;
}

@media (min-width: 768px) {
  .blog-post-content h1 {
    font-size: 2.5rem; /* 40px desktop */
    line-height: 48px; /* 6x8px */
    margin-top: 64px; /* 8x8px */
  }
}

.blog-post-content h2 {
  @apply font-serif font-normal max-w-prose;
  font-size: 1.75rem; /* 28px mobile */
  line-height: 32px; /* 4x8px */
  margin-top: 56px; /* 7x8px */
  margin-bottom: 16px; /* 2x8px */
  letter-spacing: -0.01em;
}

@media (min-width: 768px) {
  .blog-post-content h2 {
    font-size: 2rem; /* 32px desktop */
    line-height: 40px; /* 5x8px */
    margin-top: 64px; /* 8x8px */
  }
}

.blog-post-content h3 {
  @apply font-serif font-normal max-w-prose;
  font-size: 1.5rem; /* 24px */
  line-height: 32px; /* 4x8px */
  margin-top: 48px; /* 6x8px */
  margin-bottom: 8px; /* 1x8px */
}

.blog-post-content h4 {
  @apply font-serif font-medium max-w-prose;
  font-size: 1.25rem; /* 20px */
  line-height: 24px; /* 3x8px */
  margin-top: 32px; /* 4x8px */
  margin-bottom: 8px; /* 1x8px */
}

.blog-post-content h5,
.blog-post-content h6 {
  @apply font-serif font-medium max-w-prose;
  font-size: 1.125rem; /* 18px */
  line-height: 24px; /* 3x8px */
  margin-top: 16px; /* 2x8px */
  margin-bottom: 8px; /* 1x8px */
}

/* Lists aligned to grid */
.blog-post-content ul,
.blog-post-content ol {
  @apply max-w-prose pl-8;
  font-size: 1.125rem; /* 18px to match body */
  line-height: 28px; /* 3.5x8px */
  margin-bottom: 16px; /* 2x8px */
}

.blog-post-content li {
  line-height: 28px; /* 3.5x8px to match body */
  margin-bottom: 8px; /* 1x8px */
}

/* Blockquotes aligned */
.blog-post-content blockquote {
  @apply max-w-prose italic border-l-4 border-zinc-300 dark:border-zinc-700;
  font-size: 1.125rem; /* 18px to match body */
  line-height: 28px; /* 3.5x8px */
  margin-top: 16px; /* 2x8px */
  margin-bottom: 16px; /* 2x8px */
  padding: 16px 0 16px 24px; /* 2x8px, 3x8px */
}

/* Code blocks */
.blog-post-content code {
  @apply font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded;
  font-size: 0.875rem; /* 14px */
  padding-top: 2px;
  padding-bottom: 2px;
}

.blog-post-content pre {
  @apply font-mono overflow-x-auto bg-zinc-50 dark:bg-zinc-900 rounded-lg;
  font-size: 0.875rem; /* 14px */
  line-height: 20px; /* 2.5x8px */
  margin-top: 24px; /* 3x8px */
  margin-bottom: 24px; /* 3x8px */
  padding: 16px; /* 2x8px */
}

.blog-post-content pre code {
  @apply bg-transparent p-0;
  font-size: inherit;
}

/* Images */
.blog-post-content img {
  @apply w-full max-w-none rounded-lg;
  margin-top: 24px; /* 3x8px */
  margin-bottom: 24px; /* 3x8px */
}

/* Horizontal rules */
.blog-post-content hr {
  @apply border-t border-zinc-200 dark:border-zinc-800 border-solid w-full max-w-prose;
  margin-top: 32px; /* 4x8px */
  margin-bottom: 32px; /* 4x8px */
}

/* Links */
.blog-post-content a {
  @apply text-blue-600 dark:text-blue-400 underline underline-offset-2;
}

.blog-post-content a:hover {
  @apply text-blue-700 dark:text-blue-300;
}

/* External link icons - smaller and grid-aligned */
.blog-post-content .external-link {
  display: inline;
}

.blog-post-content .external-link svg {
  display: inline-block;
  width: 8px; /* 1x8px */
  height: 8px; /* 1x8px */
  vertical-align: super;
  margin-left: 2px;
  opacity: 0.5;
}

.blog-post-content a {
  @apply text-zinc-700 dark:text-zinc-300;
  text-underline-offset: 2px;
}

.blog-post-content a:hover .external-link svg {
  opacity: 0.8;
}
</style>
