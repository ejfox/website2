<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { useDark, useIntersectionObserver } from '@vueuse/core'
import DOMPurify from 'dompurify'

// Browser-compatible HTML stripper using DOMPurify
const stripHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
    .replace(/\s+/g, ' ')
    .trim()
}

// CSS Classes
const progressBarClass =
  'fixed top-0 left-0 right-0 h-[2px] sm:h-[1px] bg-zinc-200 ' +
  'dark:bg-zinc-800 z-50'
const progressInnerClass =
  'h-full bg-zinc-600 dark:bg-zinc-400 transition-all duration-200 ' +
  'ease-out'
const tagsContainerClass =
  'px-4 md:px-6 py-4 md:py-3 border-t border-zinc-200 ' + 'dark:border-zinc-800'
const navDateClass =
  'block text-sm sm:text-xs font-mono text-zinc-400 ' +
  'leading-5 sm:leading-4 mt-2'
const relatedPostsContainerClass =
  'px-4 md:px-6 py-8 border-t border-zinc-200 dark:border-zinc-800'
const relatedPostsTitleClass =
  'font-mono text-xs uppercase tracking-[0.15em] text-zinc-500 mb-4'
const relatedPostItemClass =
  'font-serif text-base text-zinc-900 dark:text-zinc-100 mb-2'
const relatedPostMetaClass =
  'flex items-center gap-2 text-xs font-mono text-zinc-500'
const tocLinkClass =
  'flex items-baseline text-sm transition-all duration-200 ' +
  'no-underline py-2 gap-2'
const tocNumberClass =
  'font-mono text-xs tabular-nums opacity-50 w-4 text-right ' + 'flex-shrink-0'
const tocInactiveClass =
  'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 ' +
  'dark:hover:text-zinc-100 hover:translate-x-1'

const config = useRuntimeConfig()
const _isDark = useDark()
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
        console.error('Post returned error:', response.error)
        return null
      }

      return response
    } catch (error) {
      console.error('Error fetching post:', error)
      return null
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

// Related posts by tag
const { data: allPosts } = await useAsyncData(
  'all-posts-for-related',
  async () => {
    try {
      return await processedMarkdown.getAllPosts(false, false)
    } catch (error) {
      console.error('Error fetching all posts for related:', error)
      return []
    }
  }
)

const relatedPosts = computed(() => {
  if (!allPosts.value || !post.value) return []

  const currentTags = post.value.metadata?.tags || post.value.tags || []
  const currentSlug = route.params.slug.join('/')

  if (currentTags.length === 0) return []

  // Find posts with overlapping tags
  const postsWithScores = allPosts.value
    .filter((p) => {
      const slug = p.slug || p.metadata?.slug
      return slug !== currentSlug && !p.draft && !p.metadata?.draft
    })
    .map((p) => {
      const tags = p.metadata?.tags || p.tags || []
      const overlappingTags = tags.filter((t) => currentTags.includes(t))
      return {
        post: p,
        score: overlappingTags.length,
        overlappingTags,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return postsWithScores
})
// Refs for animation targets and DOM tracking
const postTitle = ref(null)
const postMetadata = ref(null)
const navigationLinks = ref(null)
const articleContent = ref(null)
const headings = ref([])
const activeSection = ref('')

// Scroll progress tracking
const scrollProgress = ref(0)

// Debug grid toggle (Cmd+G)
const showDebugGrid = ref(false)

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
    avgWordLength: words > 0 ? (characters / words).toFixed(1) : '0',
  }
})

// Setup scroll tracking and keyboard shortcuts
onMounted(() => {
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
const { tocTarget } = useTOC()

// Title typing animation
const letters = computed(() => {
  const title = post.value?.metadata?.title || post.value?.title
  if (!title) return []

  // Split the title into individual letters, preserving spaces
  return title.split('').map((char, index) => ({
    char,
    id: index,
    isSpace: char === ' ',
  }))
})

// Track animation state
const animationState = reactive({
  currentIndex: 0,
  isAnimating: false,
  visibleLetters: new Set(),
  cursorPosition: 0,
  hasAnimated: false, // Track if we've animated this title already
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

    const visibility = isVisible ? 'visible' : 'hidden'
    const cursor = isCursorHere ? '<span class="cursor"></span>' : ''
    return `<span class="letter ${visibility}">${char}${cursor}</span>`
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
  const parsedDate =
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
  const parsedDate =
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

// Extract description from content if no dek provided
const postDescription = computed(() => {
  const dek = post.value?.metadata?.dek || post.value?.dek
  if (dek) return dek

  // Fallback: extract first paragraph from HTML
  const html = post.value?.html || post.value?.content || ''
  const text = stripHtml(html)

  // Take first 160 characters
  return text.length > 160 ? text.substring(0, 157) + '...' : text
})

const heroImage = computed(() => {
  const custom =
    post.value?.metadata?.image ||
    post.value?.metadata?.ogImage ||
    post.value?.coverImage
  return custom || new URL('/og-image.png', baseURL).href
})

const articleTags = computed(
  () => post.value?.metadata?.tags || post.value?.tags || []
)

const articleSection = computed(
  () => post.value?.metadata?.section || articleTags.value[0] || 'Writing'
)

// Format dates as ISO 8601 strings for SEO meta tags
const publishedDateISO = computed(() => {
  const dateStr = post.value?.metadata?.date || post.value?.date
  if (!dateStr) return undefined
  try {
    const parsed = parseISO(dateStr)
    return isValid(parsed) ? parsed.toISOString() : undefined
  } catch {
    return undefined
  }
})

const modifiedDateISO = computed(() => {
  const dateStr =
    post.value?.metadata?.lastUpdated ||
    post.value?.metadata?.date ||
    post.value?.date
  if (!dateStr) return undefined
  try {
    const parsed = parseISO(dateStr)
    return isValid(parsed) ? parsed.toISOString() : undefined
  } catch {
    return undefined
  }
})

// Display-friendly formatted dates for UI
const publishedDate = computed(() => {
  const iso = publishedDateISO.value
  return iso ? parseISO(iso) : undefined
})

const modifiedDate = computed(() => {
  const iso = modifiedDateISO.value
  return iso ? parseISO(iso) : undefined
})

const timeRequired = computed(
  () => `PT${Math.max(1, readingStats.value.readingTime)}M`
)

const articleSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  mainEntityOfPage: postUrl.value,
  headline: post.value?.metadata?.title || post.value?.title,
  description: postDescription.value,
  articleSection: articleSection.value,
  keywords: articleTags.value,
  datePublished: publishedDate.value,
  dateModified: modifiedDate.value,
  wordCount: readingStats.value.words,
  timeRequired: timeRequired.value,
  image: heroImage.value,
  inLanguage: 'en-US',
  author: {
    '@type': 'Person',
    name: 'EJ Fox',
    url: 'https://ejfox.com',
    jobTitle: 'Data Visualization Specialist & Journalist',
    knowsAbout: [
      'Data Visualization',
      'Interactive Journalism',
      'D3.js',
      'Investigations',
      'Newsroom Tooling',
    ],
  },
  publisher: {
    '@type': 'Person',
    name: 'EJ Fox',
    url: 'https://ejfox.com',
  },
  about: articleTags.value.map((tag) => ({
    '@type': 'Thing',
    name: tag,
  })),
}))

usePageSeo({
  title: computed(() => post.value?.metadata?.title || post.value?.title),
  description: postDescription,
  type: 'article',
  section: articleSection,
  tags: articleTags,
  image: heroImage,
  imageAlt: computed(
    () =>
      post.value?.metadata?.imageAlt ||
      `${post.value?.metadata?.title || post.value?.title} — EJ Fox`
  ),
  publishedTime: publishedDateISO,
  modifiedTime: modifiedDateISO,
  label1: 'Reading time',
  data1: computed(() => `${readingStats.value.readingTime} min`),
  label2: 'Word count',
  data2: computed(
    () => `${readingStats.value.words?.toLocaleString() || 0} words`
  ),
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(articleSchema.value),
    },
  ],
  htmlAttrs: { lang: 'en' },
}))
const smartSuggestions = ref([])

// Table of Contents computed property
const tocChildren = computed(() => {
  return (
    post.value?.toc?.[0]?.children ||
    post.value?.metadata?.toc?.[0]?.children ||
    []
  )
})

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
              50 - distance(p.slug || '', path),
              30 - distance(p.title?.toLowerCase().replace(/\s+/g, '-'), path)
            ),
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

// Metadata: {content, html, title, metadata:{date, modified, dek,
// type, words, images, links, tags, draft, hidden}}
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
      class="pointer-events-none fixed inset-0 z-[999]"
      style="
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
      <!-- Sidebar column indicator -->
      <div class="debug-grid-sidebar"></div>
      <!-- Main content area indicator -->
      <div class="max-w-screen-xl mx-auto h-full relative">
        <div class="grid grid-cols-12 h-full">
          <div
            v-for="i in 12"
            :key="i"
            style="border-right: 1px solid rgba(34, 197, 94, 0.1)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Reading progress bar - mobile optimized -->
    <div v-if="post && !post.redirect" :class="progressBarClass">
      <div
        :class="progressInnerClass"
        :style="`width: ${scrollProgress}%`"
      ></div>
    </div>

    <article
      v-if="post && !post.redirect"
      class="h-entry w-full px-4 md:px-8 xl:px-16"
    >
      <!-- Swiss Grid Container -->
      <div>
        <!-- Top metadata bar with microvisualizations -->
        <div ref="postMetadata">
          <!-- Mobile-optimized metadata with better layout -->
          <div class="px-4 md:px-8 xl:px-16 py-3 sm:py-2">
            <!-- Mobile: Stack date and main stats -->
            <div class="block sm:hidden stack-2">
              <div class="mono-xs text-secondary">
                {{ formatShortDate(post?.metadata?.date || post?.date) }}
              </div>
              <div class="flex-gap-3 mono-xs text-muted">
                <span class="text-secondary">
                  {{ readingStats.readingTime }}min read
                </span>
                <span class="text-secondary">
                  {{ formatCompactNumber(readingStats.words) }} words
                </span>
                <span v-if="readingStats.images > 0" class="text-secondary">
                  {{ readingStats.images }} images
                </span>
              </div>
            </div>

            <!-- Desktop: Single line as before -->
            <div class="metadata-bar-scrollable">
              <span class="whitespace-nowrap text-secondary">
                {{ formatShortDate(post?.metadata?.date || post?.date) }}
              </span>
              <span class="text-divider">·</span>
              <span class="whitespace-nowrap text-secondary">
                {{ readingStats.readingTime }}min
              </span>
              <span class="text-divider">·</span>
              <span class="whitespace-nowrap text-secondary">
                {{ formatCompactNumber(readingStats.words) }} words
              </span>
              <span v-if="readingStats.images > 0" class="text-divider">·</span>
              <span
                v-if="readingStats.images > 0"
                class="whitespace-nowrap text-secondary"
              >
                {{ readingStats.images }} images
              </span>
              <span v-if="readingStats.links > 0" class="text-divider">·</span>
              <span
                v-if="readingStats.links > 0"
                class="whitespace-nowrap text-secondary"
              >
                {{ readingStats.links }} links
              </span>
            </div>
          </div>
        </div>

        <!-- Title section - mobile optimized -->
        <div class="px-4 md:px-8 xl:px-16 pt-3 pb-2">
          <h1
            v-if="post?.metadata?.title || post?.title"
            ref="postTitle"
            class="post-title-hero"
            style="line-height: 1.2; letter-spacing: -0.025em"
            v-html="renderedTitle"
          ></h1>
          <p v-if="post?.metadata?.dek || post?.dek" class="post-dek">
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

        <!-- Reply Context (IndieWeb reply posts) -->
        <div
          v-if="post?.metadata?.replyTo || post?.metadata?.['in-reply-to']"
          class="px-4 md:px-8 xl:px-16"
        >
          <ReplyContext
            :reply-to="
              post?.metadata?.replyTo || post?.metadata?.['in-reply-to']
            "
          />
        </div>

        <!-- Article Content - mobile optimized spacing -->
        <div ref="articleContent" class="px-4 md:px-8 xl:px-16 pt-3 pb-6">
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

        <!-- Tags Section - mobile optimized touch targets -->
        <div
          v-if="post.tags || post.metadata?.tags"
          :class="tagsContainerClass"
        >
          <div class="flex flex-wrap gap-3 sm:gap-2">
            <a
              v-for="tag in post.tags || post.metadata?.tags"
              :key="tag"
              :href="`/blog/tag/${tag}`"
              class="post-tag"
            >
              {{ tag }}
            </a>
          </div>
        </div>

        <!-- Navigation Links - mobile optimized touch targets -->
        <div v-if="nextPrevPosts" ref="navigationLinks" class="grid-post-nav">
          <div v-if="nextPrevPosts.prev" class="order-2 sm:order-1">
            <NuxtLink
              :to="`/blog/${nextPrevPosts.prev.slug}`"
              class="post-nav-link"
            >
              <span class="post-nav-label">← Previous</span>
              <span class="post-nav-title">
                {{ nextPrevPosts.prev?.title }}
              </span>
              <span :class="navDateClass">
                {{ formatDate(nextPrevPosts.prev.date) }}
              </span>
            </NuxtLink>
          </div>
          <div v-else class="order-2 sm:order-1"></div>

          <div
            v-if="nextPrevPosts.next"
            class="order-1 sm:order-2 sm:text-right"
          >
            <NuxtLink
              :to="`/blog/${nextPrevPosts.next.slug}`"
              class="post-nav-link"
            >
              <span class="post-nav-label">Next →</span>
              <span class="post-nav-title">
                {{ nextPrevPosts.next?.title }}
              </span>
              <span :class="navDateClass">
                {{ formatDate(nextPrevPosts.next.date) }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <!-- Related Posts by Tag -->
        <div v-if="relatedPosts.length > 0" :class="relatedPostsContainerClass">
          <h2 :class="relatedPostsTitleClass">Related Posts</h2>
          <div class="stack-4">
            <div
              v-for="{ post: relatedPost, overlappingTags } in relatedPosts"
              :key="relatedPost.slug"
            >
              <NuxtLink
                :to="`/blog/${relatedPost.slug}`"
                class="block no-underline"
              >
                <div :class="relatedPostItemClass">
                  {{ relatedPost.title || relatedPost.metadata?.title }}
                </div>
                <div :class="relatedPostMetaClass">
                  <span>
                    {{
                      formatDate(relatedPost.date || relatedPost.metadata?.date)
                    }}
                  </span>
                  <span>·</span>
                  <span class="text-zinc-400">
                    {{ overlappingTags.join(', ') }}
                  </span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <!-- End Swiss Grid Container -->

      <!-- Tip jar - minimal CTA -->
      <BlogTipJar v-if="!post.metadata?.noTips" />

      <!-- Webmentions -->
      <Webmentions :url="postUrl" />
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
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div v-if="tocChildren.length > 0" class="toc">
          <div class="py-4 pl-0 relative">
            <!-- Clean TOC list without header -->
            <ul class="space-y-0">
              <li
                v-for="(child, index) in tocChildren"
                :key="child.slug"
                class="group relative"
              >
                <a
                  :href="`#${child.slug}`"
                  :class="[
                    tocLinkClass,
                    activeSection === child.slug
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                      : tocInactiveClass,
                  ]"
                >
                  <!-- Section number aligned on same baseline -->
                  <span
                    :class="[
                      tocNumberClass,
                      activeSection === child.slug
                        ? 'opacity-70'
                        : 'opacity-40',
                    ]"
                  >
                    {{ String(index + 1).padStart(2, '0') }}
                  </span>

                  <!-- Main text aligned on same baseline -->
                  <span
                    class="font-serif leading-relaxed"
                    :class="
                      activeSection === child.slug
                        ? 'font-medium'
                        : 'font-normal'
                    "
                  >
                    {{ child.text }}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </teleport>
    </ClientOnly>
  </div>
</template>

<style lang="postcss">
.blog-post-content {
  @apply font-serif opacity-100;
}

/* Body text - mobile optimized */
.blog-post-content p {
  @apply max-w-prose;
  font-size: 1rem; /* 16px on mobile for easier reading */
  line-height: 24px; /* 3x8px for comfortable mobile reading */
  margin-bottom: 20px; /* Extra spacing for mobile */
}

@media (min-width: 640px) {
  .blog-post-content p {
    font-size: 1.125rem; /* 18px for larger screens */
    line-height: 28px; /* 3.5x8px for comfortable reading */
    margin-bottom: 16px; /* 2x8px */
  }
}

/* Headings with mobile-optimized spacing */
.blog-post-content h1 {
  @apply font-serif font-light max-w-prose;
  font-size: 1.75rem; /* 28px mobile - more reasonable */
  line-height: 32px; /* 4x8px */
  margin-top: 32px; /* Reduced for mobile */
  margin-bottom: 20px; /* More space for mobile */
  letter-spacing: -0.02em;
}

@media (min-width: 640px) {
  .blog-post-content h1 {
    font-size: 2rem; /* 32px tablet */
    line-height: 40px; /* 5x8px */
    margin-top: 48px; /* 6x8px */
    margin-bottom: 24px; /* 3x8px */
  }
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
  font-size: 1.5rem; /* 24px mobile - more reasonable */
  line-height: 28px; /* 3.5x8px */
  margin-top: 40px; /* Reduced for mobile */
  margin-bottom: 16px; /* 2x8px */
  letter-spacing: -0.01em;
}

@media (min-width: 640px) {
  .blog-post-content h2 {
    font-size: 1.75rem; /* 28px tablet */
    line-height: 32px; /* 4x8px */
    margin-top: 56px; /* 7x8px */
  }
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

/* Lists - mobile optimized */
.blog-post-content ul,
.blog-post-content ol {
  @apply max-w-prose;
  padding-left: 1.5rem; /* Reduced for mobile */
  font-size: 1rem; /* 16px on mobile to match body */
  line-height: 24px; /* 3x8px for mobile */
  margin-bottom: 20px; /* Extra spacing for mobile */
}

.blog-post-content li {
  line-height: 24px; /* 3x8px for mobile */
  margin-bottom: 8px; /* 1x8px */
}

@media (min-width: 640px) {
  .blog-post-content ul,
  .blog-post-content ol {
    padding-left: 2rem; /* pl-8 */
    font-size: 1.125rem; /* 18px to match body */
    line-height: 28px; /* 3.5x8px */
    margin-bottom: 16px; /* 2x8px */
  }

  .blog-post-content li {
    line-height: 28px; /* 3.5x8px to match body */
  }
}

/* Blockquotes aligned */
.blog-post-content blockquote {
  @apply italic border-l-4 border-zinc-300 dark:border-zinc-700 max-w-prose;
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
  @apply border-t border-zinc-200 dark:border-zinc-800 border-solid w-full;
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

/* Title typing animation */
.post-title-hero .letter {
  transition: opacity 0.1s ease-out;
}

.post-title-hero .letter.hidden {
  opacity: 0;
}

.post-title-hero .letter.visible {
  opacity: 1;
}

.post-title-hero .cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin: 0 2px;
  background-color: currentColor;
  animation: blink 0.6s infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
</style>
