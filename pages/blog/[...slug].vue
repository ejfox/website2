<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { animate, stagger, engine } from '~/anime.esm.js'
import { useWindowSize, useMutationObserver } from '@vueuse/core'
import DonationSection from '~/components/blog/DonationSection.vue'
import { useScrollAnimation } from '~/composables/useScrollAnimation'

const config = useRuntimeConfig()
const isDark = useDark()
const processedMarkdown = useProcessedMarkdown()

const route = useRoute()
const router = useRouter()

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
  () => processedMarkdown.getNextPrevPosts(route.params.slug.join('/'))
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
const titleFontSize = ref(24)

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// Compute font size based on viewport
watchEffect(() => {
  if (width.value >= 1280)
    titleFontSize.value = 72 // xl
  else if (width.value >= 1024)
    titleFontSize.value = 64 // lg
  else if (width.value >= 768)
    titleFontSize.value = 48 // md
  else titleFontSize.value = 24 // mobile
})

// First, let's fix the lifecycle hooks by moving them inside onMounted
onMounted(() => {
  if (process.server) return

  // Title resize observer
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      titleWidth.value = entry.contentRect.width
    }
  })

  if (postTitle.value) {
    resizeObserver.observe(postTitle.value)
    titleWidth.value = postTitle.value.offsetWidth
  }

  // Heading intersection observer
  const headingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  )

  nextTick(() => {
    if (!articleContent.value) return
    headings.value = Array.from(
      articleContent.value.querySelectorAll('h2, h3, h4')
    )
    headings.value.forEach((heading) => headingObserver.observe(heading))
  })

  // Clean up
  onUnmounted(() => {
    resizeObserver.disconnect()
    headingObserver.disconnect()
  })
})

// Then update the teleport to be conditional on both the target existing and not being mobile
const tocTarget = ref(null)

onMounted(() => {
  tocTarget.value = document.querySelector('#nav-toc-container')

  // Also check if the post has TOC data
})

// Add a watcher for route changes to reinitialize the TOC
watch(
  () => route.path,
  async () => {
    // Wait for DOM updates to complete
    await nextTick()
    await nextTick()

    // Add a small delay to ensure DOM is fully updated
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Re-initialize TOC target when route changes
    tocTarget.value = document.querySelector('#nav-toc-container')

    // If not found on first try, retry with increasing delays
    if (!tocTarget.value) {
      const retryFindTocContainer = async (attempts = 1, maxAttempts = 5) => {
        if (attempts > maxAttempts) return

        // Exponential backoff
        const delay = 100 * Math.pow(2, attempts - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))

        tocTarget.value = document.querySelector('#nav-toc-container')

        if (!tocTarget.value && attempts < maxAttempts) {
          await retryFindTocContainer(attempts + 1, maxAttempts)
        }
      }

      await retryFindTocContainer()
    }

    // Re-initialize headings and observers
    if (articleContent.value) {
      nextTick(() => {
        headings.value = Array.from(
          articleContent.value.querySelectorAll('h2, h3, h4')
        )

        // Re-observe headings with the intersection observer
        const headingObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                activeSection.value = entry.target.id
              }
            })
          },
          { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
        )

        headings.value.forEach((heading) => headingObserver.observe(heading))
      })
    }
  },
  { immediate: true }
)

// Remove the wrappedTitle computed property and replace with this simpler letter-based system
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
  cursorPosition: 0 // Track the current cursor position
})

// Update the rendered title to wrap words properly
const renderedTitle = computed(() => {
  const spans = letters.value.map(({ char, id, isSpace }, index) => {
    const isVisible = animationState.visibleLetters.has(id)
    const isCursorHere =
      !isSpace &&
      index === animationState.cursorPosition &&
      animationState.isAnimating

    // Start a new word wrapper if it's a space
    if (isSpace) {
      return `</span><span class="word">`
    }

    return `<span class="letter ${isVisible ? 'visible' : ''}">${char}${isCursorHere ? '<span class="cursor"></span>' : ''}</span>`
  })
  // Wrap everything in a word span
  return `<span class="word">${spans.join('')}</span>`
})

// Simpler typing animation
async function typeText() {
  if (process.server || animationState.isAnimating) return

  animationState.isAnimating = true
  animationState.visibleLetters.clear()
  animationState.cursorPosition = 0

  const LETTER_DELAY = 35
  const PAUSE_DELAY = 150

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

// Watch for title changes
watch(
  letters,
  async (newLetters) => {
    if (newLetters?.length) {
      await nextTick()
      typeText()
    }
  },
  { immediate: true }
)

// New computed property to trim TOC items
const trimmedToc = computed(() => {
  // Check both possible locations for TOC data
  const tocData = post.value?.toc || post.value?.metadata?.toc
  if (!tocData) return []

  return tocData.flatMap(
    (item) =>
      item.children?.map((child) => ({
        ...child,
        text:
          child.text.length > 35 ? child.text.slice(0, 32) + '...' : child.text
      })) || []
  )
})

// New ref for scroll position
const tocScrollPosition = ref(0)

// Update these constants
const TOC_CONSTANTS = {
  ITEM_WIDTH: 80,
  VIEWPORT_WIDTH: 300
}

// Updated function to center the active TOC item
const updateTocScroll = useDebounceFn(() => {
  const activeIndex = trimmedToc.value.findIndex(
    (item) => item.slug === activeSection.value
  )
  if (activeIndex === -1) return

  const totalWidth = trimmedToc.value.length * TOC_CONSTANTS.ITEM_WIDTH
  const halfViewport = TOC_CONSTANTS.VIEWPORT_WIDTH / 2
  const newScrollPosition = Math.max(
    0,
    Math.min(
      activeIndex * TOC_CONSTANTS.ITEM_WIDTH -
        halfViewport +
        TOC_CONSTANTS.ITEM_WIDTH / 2,
      totalWidth - TOC_CONSTANTS.VIEWPORT_WIDTH
    )
  )

  tocScrollPosition.value = newScrollPosition
}, 100)

// Watch for changes in activeSection
watch(activeSection, updateTocScroll)

// Create scroll animation instance
const { setupAnimation, slideUp, slideLeft, fadeIn, expandLine } =
  useScrollAnimation({
    debug: false,
    threshold: 0.1,
    rootMargin: '-5% 0px -5% 0px'
  })

// Set up global animation defaults
engine.defaults = {
  duration: 300,
  ease: 'spring(1, 80, 10, 0)',
  autoplay: true
}

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

const verificationStatus = ref(null)

// Only verify if there's a signature in the frontmatter
onMounted(async () => {
  if (post.value?.signature) {
    try {
      const publicKey = await fetch('/pgp.txt').then((r) => r.text())
      const openpgp = await import('openpgp')

      // Create message from post content
      const message = [
        post.value.title,
        post.value.date,
        post.value.content
      ].join('\n')

      const verified = await openpgp.verify({
        message: await openpgp.createMessage({ text: message }),
        signature: await openpgp.readSignature({
          armoredSignature: post.value.signature
        }),
        verificationKeys: await openpgp.readKey({ armoredKey: publicKey })
      })

      verificationStatus.value = verified.signatures[0].valid
    } catch (err) {
      console.error('Verification failed:', err)
      verificationStatus.value = false
    }
  }
})

// Watch for content changes
watch(
  () => post.value?.content,
  async () => {
    if (post.value?.content) {
      await nextTick()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Initial fade-in animation for everything EXCEPT images
      if (articleContent.value) {
        const content = articleContent.value.querySelectorAll(
          '.animate-on-scroll:not(img)'
        )
        if (content.length > 0) {
          animate(content, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300,
            ease: 'spring(1, 80, 10, 0)',
            delay: stagger(50)
          })
        }
      }

      // Set up scroll-triggered animations
      setupImageAnimations()
      if (postMetadataComponent.value?.animateItems) {
        postMetadataComponent.value.animateItems()
      }
    }
  },
  { immediate: true }
)

// Set up mutation observer
let stopMutationObserver = null

function setupImageAnimations() {
  if (!articleContent.value) return

  // Images slide up from bottom
  const images = articleContent.value.querySelectorAll('img')
  images.forEach((img) => slideUp(img))

  // Other animations remain the same
  const blockquotes = articleContent.value.querySelectorAll('blockquote')
  blockquotes.forEach((quote) => slideLeft(quote))

  const horizontalRules = articleContent.value.querySelectorAll('hr')
  horizontalRules.forEach((rule) => expandLine(rule))

  const headingLevels = ['h2', 'h3', 'h4']
  for (const level of headingLevels) {
    const headings = articleContent.value.querySelectorAll(level)
    if (headings.length > 0) {
      headings.forEach((heading) => slideLeft(heading))
    }
  }

  // Update mutation observer for dynamically added content
  const { stop } = useMutationObserver(
    articleContent.value,
    (mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            slideUp(node)
          }
          if (node.nodeName === 'BLOCKQUOTE') {
            slideLeft(node)
          }
          if (['H2', 'H3', 'H4'].includes(node.nodeName)) {
            const settings = ANIMATION_SETTINGS[node.nodeName.toLowerCase()]
            slideLeft(node, settings)
          }
          // Handle nested elements
          const nestedImages = node.querySelectorAll?.('img') || []
          nestedImages.forEach((img) => slideUp(img))
          const nestedQuotes = node.querySelectorAll?.('blockquote') || []
          nestedQuotes.forEach((quote) => slideLeft(quote))
          headingLevels.forEach((level) => {
            const headings = node.querySelectorAll?.(level) || []
            if (headings.length > 0) {
              headings.forEach((heading) => {
                const settings = ANIMATION_SETTINGS[level]
                slideLeft(heading, settings)
              })
            }
          })
        })
      })
    },
    { childList: true, subtree: true }
  )
  stopMutationObserver = stop
}

// Clean up mutation observer
onUnmounted(() => {
  if (stopMutationObserver) {
    stopMutationObserver()
  }
})

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
    title: metadata.title,
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
      class="scroll-container pt-4 md:pt-12 pl-0 md:pl-4"
    >
      <div ref="postMetadata" class="w-full">
        <PostMetadata
          v-if="processedMetadata"
          :doc="processedMetadata"
          ref="postMetadataComponent"
        />
      </div>

      <div class="lg:h-[62vh] flex items-center">
        <h1
          ref="postTitle"
          v-if="post?.metadata?.title || post?.title"
          class="post-title text-3xl lg:text-7xl xl:text-8xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0 tracking-tight leading-tight"
        >
          <div v-html="renderedTitle" class="typing-container"></div>
        </h1>
      </div>

      <!-- Back to Blog link - only visible on mobile -->
      <div v-if="isBlogPost && isMobile" class="paddings mb-8">
        <UButton
          to="/blog/"
          size="sm"
          icon="i-heroicons-arrow-left"
          :color="isDark ? 'white' : 'black'"
        >
          Back to Blog
        </UButton>
      </div>

      <div ref="articleContent">
        <article
          v-if="post?.html"
          v-html="post.html"
          class="blog-post-content px-2 prose-lg md:prose-xl dark:prose-invert prose-img:my-8 prose-img:rounded-lg prose-img:w-full prose-img:max-w-full prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words prose-code:whitespace-pre-wrap font-normal opacity-100"
        ></article>
        <div
          v-else-if="post?.content"
          v-html="post.content"
          class="blog-post-content px-2 prose-lg md:prose-xl dark:prose-invert prose-img:my-8 prose-img:rounded-lg prose-img:w-full prose-img:max-w-full prose-pre:overflow-x-auto prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:break-words prose-code:whitespace-pre-wrap font-normal opacity-100"
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
          <UBadge :color="isDark ? 'zinc-700' : 'zinc-300'" :text="tag" />
        </span>
      </div>

      <div
        ref="navigationLinks"
        class="flex justify-between items-center mt-8 w-full p-4 md:p-8"
        v-if="nextPrevPosts"
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
            <span class="text-current truncate block">
              {{ nextPrevPosts.prev?.title }}</span
            >
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
            <span class="text-current truncate block"
              >{{ nextPrevPosts.next?.title }} →</span
            >
          </NuxtLink>
        </div>
      </div>

      <!-- Add donation section only if not explicitly disabled -->
      <DonationSection v-if="showDonations" />
    </article>
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center min-h-[50vh] bg-gray-100 dark:bg-gray-900 px-4 rounded-lg shadow-md"
    >
      <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Blog post not found...
      </h2>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-6 text-center">
        Error loading post: {{ error.message }}
      </p>
      <NuxtLink
        to="/blog"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
      >
        Return to Blog
      </NuxtLink>
    </div>
    <div v-else class="p-4 text-center">
      <p class="text-xl text-gray-600 dark:text-gray-400">Loading...</p>
    </div>

    <!-- Desktop TOC -->
    <teleport to="#nav-toc-container" v-if="tocTarget">
      <div
        v-if="
          post?.toc?.[0]?.children?.length ||
          post?.metadata?.toc?.[0]?.children?.length
        "
        class="toc py-4 px-4 text-sm"
      >
        <h3 class="text-base font-medium mb-4 font-sans tracking-tight">
          Table of Contents
        </h3>
        <ul class="space-y-4">
          <li
            v-for="child in post.toc?.[0]?.children ||
            post.metadata?.toc?.[0]?.children"
            :key="child.slug"
            class="transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded line-clamp-1"
          >
            <a
              :href="`#${child.slug}`"
              class="block px-1 py-0.5 rounded transition-colors font-sans text-sm tracking-tight"
              :class="[
                activeSection === child.slug
                  ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-700/50 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-200'
              ]"
            >
              {{ child.text }}
            </a>
          </li>
        </ul>
      </div>
    </teleport>

    <!-- Add subtle verification badge -->
    <div
      v-if="verificationStatus !== null"
      class="fixed bottom-4 right-4 flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full"
      :class="{
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300':
          verificationStatus,
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300':
          !verificationStatus
      }"
    >
      <span class="font-mono">
        {{ verificationStatus ? '✓ Verified' : '⚠ Unverified' }}
      </span>
      <UIcon
        :name="
          verificationStatus
            ? 'i-heroicons-shield-check'
            : 'i-heroicons-shield-exclamation'
        "
        class="w-4 h-4"
      />
    </div>
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
  @apply tracking-wide text-black dark:text-white border-b-2 hover:border-b-4 border-blue-600 hover:border-blue-500 dark:border-blue-200 dark:hover:border-blue-400 transition-all duration-200;
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

.blog-post-content {
  img {
    @apply w-full max-w-full mx-auto;
    /* Spacing */
    @apply py-2 md:py-4 lg:py-6;
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
</style>

<style>
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

/* Add these new styles */
.typing-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
  /* This replaces our space width */
  line-height: 1.2;
}

.word {
  display: flex;
}

.letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
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
  width: 3px;
  background-color: currentColor;
  animation: blink 1s step-end infinite;
  height: 100%;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 0;
  }
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

@media (prefers-reduced-motion: reduce) {
  .letter,
  .space {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .cursor {
    animation: none !important;
    opacity: 0 !important;
  }
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

