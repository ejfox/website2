<script setup>
import { format, isValid, parseISO } from 'date-fns'
import DonationSection from '~/components/blog/DonationSection.vue'
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

const isMobile = computed(() => {
  if (process.client) {
    return window.innerWidth < 768
  }
  return false
})

// Simple setup for title and TOC
onMounted(() => {
  if (process.server) return
  
  if (postTitle.value) {
    titleWidth.value = postTitle.value.offsetWidth
  }

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
  if (!process.client) return null
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
  if (process.server || animationState.hasAnimated) return
  
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

function getBaseUrl() {
  if (config.public && config.public.baseURL) return config.public.baseURL
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ejfox.com'
}

const baseURL = getBaseUrl()
const shareImageUrl = computed(
  () => new URL(`/images/share/${params.slug.join('/')}.png`, baseURL).href
)
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
    { property: 'og:image', content: shareImageUrl.value },
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
    },
    { name: 'twitter:image', content: shareImageUrl.value }
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
  <div>
    <Head>
      <Meta
        name="robots"
        :content="
          post?.metadata?.robotsMeta || post?.robotsMeta || 'index, follow'
        "
      />
    </Head>
    <article
      v-if="post && !post.redirect"
      class="scroll-container pt-4 md:pt-0 pl-2 md:pl-4"
    >
      <div ref="postMetadata" class="w-full">
        <PostMetadata
          v-if="processedMetadata"
          ref="postMetadataComponent"
          :doc="processedMetadata"
          :colors="null"
          :is-dark="isDark"
        />
      </div>

      <div class="lg:h-[62vh] flex items-center">
        <h1
          v-if="post?.metadata?.title || post?.title"
          ref="postTitle"
          class="post-title text-3xl lg:text-7xl xl:text-8xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0 tracking-tight leading-tight"
        >
          <div class="typing-container" v-html="renderedTitle"></div>
        </h1>
      </div>

      <!-- Back to Blog link - only visible on mobile -->
      <div v-if="isBlogPost && isMobile" class="paddings mb-8">
        <NuxtLink
          to="/blog/"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
        >
          ←
          Back to Blog
        </NuxtLink>
      </div>

      <div ref="articleContent">
        <article
          v-if="post?.html"
          class="blog-post-content px-2 prose-lg md:prose-xl dark:prose-invert prose-img:my-8 prose-img:rounded-lg prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words prose-code:whitespace-pre-wrap prose-h2:border-none prose-h3:border-none prose-h4:border-none prose-hr:border-t prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-hr:border-solid prose-hr:my-12 prose-hr:mx-0 prose-hr:w-full font-normal opacity-100"
          v-html="post.html"
        ></article>
        <div
          v-else-if="post?.content"
          class="blog-post-content px-2 prose-lg md:prose-xl dark:prose-invert prose-img:my-8 prose-img:rounded-lg prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words prose-code:whitespace-pre-wrap prose-h2:border-none prose-h3:border-none prose-h4:border-none prose-hr:border-t prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-hr:border-solid prose-hr:my-12 prose-hr:mx-0 prose-hr:w-full font-normal opacity-100"
          v-html="post.content"
        ></div>
        <div v-else class="p-4 text-center text-red-500">
          No content available for this post
        </div>
      </div>

      <div v-if="post.tags" class="mt-4">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="inline-block mr-2 mb-2"
        >
          <span
            class="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
          >{{ tag }}</span>
        </span>
      </div>

      <div
        v-if="nextPrevPosts"
        ref="navigationLinks"
        class="flex justify-between items-center mt-8 w-full p-4 md:p-8"
      >
        <div class="w-1/3 pr-2">
          <NuxtLink
            v-if="nextPrevPosts.prev"
            :to="`/blog/${nextPrevPosts.prev.slug}`"
            class="block text-left no-underline hover:underline"
          >
            <span class="block text-sm text-gray-500">Previous</span>
            <span class="block text-sm text-gray-400">{{
              formatDate(nextPrevPosts.prev.date)
            }}</span>
            <span class="text-current block">
              {{ nextPrevPosts.prev?.title }}</span>
          </NuxtLink>
        </div>

        <div class="w-1/3"></div>

        <div class="w-1/3 pl-2 text-right">
          <NuxtLink
            v-if="nextPrevPosts.next"
            :to="`/blog/${nextPrevPosts.next.slug}`"
            class="block text-right no-underline hover:underline"
          >
            <span class="block text-sm text-gray-500">Next</span>
            <span class="block text-sm text-gray-400">{{
              formatDate(nextPrevPosts.next.date)
            }}</span>
            <span class="text-current block">{{ nextPrevPosts.next?.title }} →</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Add donation section only if not explicitly disabled -->
      <DonationSection v-if="showDonations" />
    </article>
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center min-h-[50vh] bg-zinc-100 dark:bg-zinc-800 px-4 rounded-lg shadow-md"
    >
      <h2 class="text-4xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
        Blog post not found...
      </h2>
      <p class="text-xl text-zinc-600 dark:text-zinc-400 mb-6 text-center">
        Error loading post: {{ error.message }}
      </p>
      <NuxtLink
        to="/blog"
        class="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-300"
      >
        Return to Blog
      </NuxtLink>
    </div>
    <div v-else class="p-4 text-center">
      <p class="text-xl text-zinc-600 dark:text-zinc-400">
        Loading...
      </p>
    </div>

    <!-- Desktop TOC -->
    <teleport v-if="tocTarget" to="#nav-toc-container">
      <div
        v-if="
          post?.toc?.[0]?.children?.length ||
            post?.metadata?.toc?.[0]?.children?.length
        "
        class="toc"
      >
        <div class="pl-2">
          <h3
            class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-6"
          >
            Table of Contents
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
                class="block pr-3 pl-4 -ml-4 text-sm leading-relaxed transition-all duration-200 rounded-lg"
                :class="[
                  activeSection === child.slug
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
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
.paddings {
  @apply p-4 md:p-8 lg:px-16 xl:px-32;
}

.paddings-y {
  @apply py-4 md:py-8 lg:py-16 xl:py-32;
}

.back-to-blog-link {
  @apply mt-4 mb-4 md:mt-16;
}

.internal-link {
  @apply tracking-wide text-zinc-700 dark:text-zinc-300 border-b-2 hover:border-b-4 transition-all duration-200;
  @apply border-zinc-400 hover:border-zinc-600 dark:border-zinc-500 dark:hover:border-zinc-400;
}

/* Blog post content styling */
.blog-post-content {
  /* Links */
  a {
    @apply text-zinc-700 dark:text-zinc-300 underline underline-offset-2;
    @apply hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200;
  }

  /* Blockquotes */
  blockquote {
    @apply border-l-zinc-300 dark:border-l-zinc-600;
    @apply bg-zinc-50 dark:bg-zinc-800/50;
  }

  /* Code blocks */
  pre {
    @apply border border-zinc-200 dark:border-zinc-700;
  }

  /* Headings subtle accent */
  h2,
  h3,
  h4 {
    @apply border-b border-zinc-200 dark:border-zinc-700 pb-2;
  }
}

.header-star {
  @apply fill-black dark:fill-white;
}

.text-balance {
  text-wrap: balance;
}

/* Transition styles */
/* Removed view transition styles */

.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-300 ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

/* Hide scrollbar for mobile TOC */
.overflow-x-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* Smooth scrolling for the TOC */
.flex {
  scroll-behavior: smooth;
}

/* Hide scrollbar but keep functionality */
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Content handling */
.post-content {
  max-width: 100%;
  overflow-x: hidden;
}

.post-content blockquote {
  max-width: 100%;
  overflow-x: hidden;
}

.post-content a {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* Add styles for code blocks to prevent layout breaking */
.blog-post-content pre,
.blog-post-content code {
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  word-wrap: break-word;
  box-sizing: border-box;
}

/* Ensure code blocks don't push the layout */
.blog-post-content pre {
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Inline code */
.blog-post-content :not(pre) > code {
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
  font-size: 0.875em;
  word-break: break-word;
}

/* Full-width images while keeping text constrained */
.blog-post-content {
  /* Constrain paragraphs and most content to prose width */
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  ul,
  ol,
  blockquote {
    max-width: 65ch;
  }

  /* Break images out to full width */
  img {
    @apply w-screen max-w-none mx-auto;
    /* Break out of container padding */
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    /* Spacing */
    @apply py-2 md:py-4 lg:py-6;
    /* Add back some side padding on smaller screens */
    @apply px-2 md:px-0;
  }
}

.toc {
  @apply py-4 px-4;
}

.toc h3 {
  @apply text-zinc-800 dark:text-zinc-200 font-medium mb-4;
}

.toc ul {
  @apply pl-0 space-y-4;
}
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

a {
  word-break: break-word;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .prose img,
  .prose blockquote {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
    animation: none !important;
  }
}

/* Title typing animation */
.typing-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
  line-height: 1.2;
}

.word {
  display: flex;
}

.letter {
  display: inline-block;
  opacity: 1; /* Default visible */
  transform: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.letter.hidden {
  opacity: 0;
  transform: translateY(5px);
}

.letter.visible {
  opacity: 1;
  transform: none;
}

.cursor {
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: currentColor;
  animation: blink 1s step-end infinite;
  height: 100%;
}

@keyframes blink {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0; }
}

/* Remove any conflicting styles */
.post-title {
  line-height: 1.1;
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
  max-width: 100%;
  hyphens: auto;
}
/* Enhanced image animations */
.blog-post-content img {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* Additional styles for images in blog posts */
.blog-post-content figure {
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.blog-post-content figure img {
  width: 100% !important;
  max-width: 100% !important;
}

@media (prefers-reduced-motion: reduce) {
  .blog-post-content img {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
    animation: none !important;
  }
}
</style>
