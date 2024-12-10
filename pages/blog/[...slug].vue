<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { animate, stagger, onScroll, utils, engine } from '~/anime.esm.js'
import { useWindowSize, useElementVisibility, useMutationObserver } from '@vueuse/core'
import { TransitionPresets, useTransition } from '@vueuse/core'
import DonationSection from '~/components/blog/DonationSection.vue'
import BlogSignatureInfo from '~/components/blog/SignatureInfo.vue'
import { useScrollAnimation } from '~/composables/useScrollAnimation'

const config = useRuntimeConfig()
const isDark = useDark()
const processedMarkdown = useProcessedMarkdown()

const route = useRoute()
const router = useRouter()

// Handle redirection and post fetching
const { data: post, error } = await useAsyncData(`post-${route.params.slug.join('-')}`, async () => {
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
})

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
const postContent = ref(null)
const navigationLinks = ref(null)

const activeSection = ref('')

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

// New computed property to trim TOC items
const trimmedToc = computed(() => {
  if (!post.value?.toc) return []
  return post.value.toc.flatMap(item =>
    item.children?.map(child => ({
      ...child,
      text: child.text.length > 35 ? child.text.slice(0, 32) + '...' : child.text
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
  const activeIndex = trimmedToc.value.findIndex(item => item.slug === activeSection.value)
  if (activeIndex === -1) return

  const totalWidth = trimmedToc.value.length * TOC_CONSTANTS.ITEM_WIDTH
  const halfViewport = TOC_CONSTANTS.VIEWPORT_WIDTH / 2
  const newScrollPosition = Math.max(
    0,
    Math.min(
      activeIndex * TOC_CONSTANTS.ITEM_WIDTH - halfViewport + TOC_CONSTANTS.ITEM_WIDTH / 2,
      totalWidth - TOC_CONSTANTS.VIEWPORT_WIDTH
    )
  )

  tocScrollPosition.value = newScrollPosition
}, 100)

// Watch for changes in activeSection
watch(activeSection, updateTocScroll)

// Create scroll animation instance
const { setupAnimation, slideUp, slideLeft, fadeIn, expandLine } = useScrollAnimation({
  debug: false,
  threshold: 0.1,
  rootMargin: '0px 0px -10% 0px',
})

// Set up global animation defaults
engine.defaults = {
  duration: 1600,
  ease: 'inOutQuad',
  autoplay: true
}

// Add a ref to control the typed text
const typedTitle = ref('')

// Function to animate text typing
function typeText(text) {
  if (process.server) return

  let currentIndex = 0
  const totalChars = text.length
  const typeSpeed = 50

  // Clear any existing text
  typedTitle.value = ''

  // Start typing
  const typeInterval = setInterval(() => {
    if (currentIndex < totalChars) {
      typedTitle.value = text.slice(0, currentIndex + 1)
      currentIndex++
    } else {
      clearInterval(typeInterval)
    }
  }, typeSpeed)
}

// Start typing when post title is available
watch(() => post.value?.title, (newTitle) => {
  if (process.server) return
  if (newTitle) typeText(newTitle)
}, { immediate: true })

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
const shareImageUrl = computed(() => new URL(
  `/images/share/${params.slug.join('/')}.png`,
  baseURL
).href)
const postUrl = computed(() => new URL(`/blog/${params.slug.join('/')}`, baseURL).href)

useHead(() => ({
  title: post.value?.title,
  meta: [
    { name: 'description', content: post.value?.dek },
    { property: 'og:title', content: post.value?.title },
    { property: 'og:description', content: post.value?.dek },
    { property: 'og:image', content: shareImageUrl.value },
    { property: 'og:url', content: postUrl.value },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: post.value?.title },
    { name: 'twitter:description', content: post.value?.dek },
    { name: 'twitter:image', content: shareImageUrl.value },
  ],
  link: [{ rel: 'canonical', href: postUrl.value }],
  htmlAttrs: { lang: 'en' },
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
      const publicKey = await fetch('/pgp.txt').then(r => r.text())
      const openpgp = await import('openpgp')

      // Create message from post content
      const message = [
        post.value.title,
        post.value.date,
        post.value.content
      ].join('\n')

      const verified = await openpgp.verify({
        message: await openpgp.createMessage({ text: message }),
        signature: await openpgp.readSignature({ armoredSignature: post.value.signature }),
        verificationKeys: await openpgp.readKey({ armoredKey: publicKey })
      })

      verificationStatus.value = verified.signatures[0].valid
    } catch (err) {
      console.error('Verification failed:', err)
      verificationStatus.value = false
    }
  }
})

const articleContent = ref(null)

// Watch for content changes
watch(() => post.value?.content, async () => {
  if (post.value?.content) {
    await nextTick()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    // Make sure component is mounted before animating
    if (postMetadataComponent.value) {
      setupImageAnimations()
      if (postMetadataComponent.value?.animateItems) {
        postMetadataComponent.value.animateItems()
      }
    }
  }
}, { immediate: true })

// Set up mutation observer
let stopMutationObserver = null

function setupImageAnimations() {
  if (!articleContent.value) return

  // Images slide up from bottom
  const images = articleContent.value.querySelectorAll('img')
  images.forEach(img => slideUp(img))

  // Blockquotes slide in from left
  const blockquotes = articleContent.value.querySelectorAll('blockquote')
  blockquotes.forEach(quote => slideLeft(quote))

  // Horizontal rules expand from center
  const horizontalRules = articleContent.value.querySelectorAll('hr')
  horizontalRules.forEach(rule => expandLine(rule))

  // Animate headings
  const headingLevels = ['h2', 'h3', 'h4']
  for (const level of headingLevels) {
    const headings = articleContent.value.querySelectorAll(level)
    if (headings.length > 0) {
      headings.forEach(heading => slideLeft(heading))
    }
  }

  const { stop } = useMutationObserver(
    articleContent.value,
    (mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
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
          const nestedImages = node.querySelectorAll?.('img') || []
          nestedImages.forEach(img => slideUp(img))
          const nestedQuotes = node.querySelectorAll?.('blockquote') || []
          nestedQuotes.forEach(quote => slideLeft(quote))
          // Handle nested headings
          headingLevels.forEach(level => {
            const headings = node.querySelectorAll?.(level) || []
            if (headings.length > 0) {
              headings.forEach(heading => {
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
</script>

<template>
  <div>

    <Head>
      <Meta name="robots" :content="post.robotsMeta || 'index, follow'" />
    </Head>
    <article v-if="post && !post.redirect" class="scroll-container pt-4 md:pt-2">
      <div ref="postMetadata">
        <PostMetadata :doc="post" class="paddings" ref="postMetadataComponent" />
      </div>

      <div class="lg:h-[62vh] flex items-center">
        <h1 ref="postTitle" v-if="post?.title"
          class="post-title text-4xl lg:text-8xl xl:text-10xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0 text-balance">
          {{ typedTitle }}<span class="cursor">|</span>
        </h1>
      </div>

      <!-- Back to Blog link - only visible on mobile -->
      <div v-if="isBlogPost && isMobile" class="paddings mb-8">
        <UButton to="/blog/" size="sm" icon="i-heroicons-arrow-left" :color="isDark ? 'white' : 'black'">
          Back to Blog
        </UButton>
      </div>

      <div ref="articleContent">
        <article v-html="post.content" ref="articleContent"
          class="blog-post-content px-2 prose-lg md:prose-xl dark:prose-invert prose-img:my-8 prose-img:rounded-lg font-normal">
        </article>
      </div>

      <div v-if="post.tags" class="mt-4">
        <span v-for="tag in post.tags" :key="tag" class="inline-block mr-2 mb-2">
          <UBadge :color="isDark ? 'zinc-700' : 'zinc-300'" :text="tag" />
        </span>
      </div>

      <div ref="navigationLinks" class="flex justify-between items-center mt-8 w-full p-4 md:p-8" v-if="nextPrevPosts">
        <div class="w-1/3 pr-2">
          <NuxtLink v-if="nextPrevPosts.prev" :to="`/blog/${nextPrevPosts.prev.slug}`"
            class="block text-left no-underline hover:underline">
            <span class="block text-sm text-gray-500">Previous</span>
            <span class="block text-sm text-gray-400">{{ formatDate(nextPrevPosts.prev.date) }}</span>
            <span class="text-current"> {{ nextPrevPosts.prev?.title }}</span>
          </NuxtLink>
        </div>

        <div class="w-1/3"></div>

        <div class="w-1/3 pl-2 text-right">
          <NuxtLink v-if="nextPrevPosts.next" :to="`/blog/${nextPrevPosts.next.slug}`"
            class="block text-right no-underline hover:underline">
            <span class="block text-sm text-gray-500">Next</span>
            <span class="block text-sm text-gray-400">{{ formatDate(nextPrevPosts.next.date) }}</span>
            <span class="text-current">{{ nextPrevPosts.next?.title }} →</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Add donation section only if not explicitly disabled -->
      <DonationSection v-if="showDonations" />

      <!-- Add this near the end of the post if it has a signature -->
      <div v-if="post.content.includes('PGP SIGNATURE')" class="mt-8 border-t pt-4">
        <BlogSignatureInfo :path="route.params.slug.join('/')" />
      </div>
    </article>
    <div v-else-if="error"
      class="flex flex-col items-center justify-center min-h-[50vh] bg-gray-100 dark:bg-gray-900 px-4 rounded-lg shadow-md">
      <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Blog post not found...</h2>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-6 text-center">
        Error loading post: {{ error.message }}
      </p>
      <NuxtLink to="/blog"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300">
        Return to Blog
      </NuxtLink>
    </div>
    <div v-else class="p-4 text-center">
      <p class="text-xl text-gray-600 dark:text-gray-400">Loading...</p>
    </div>

    <!-- Mobile TOC component -->
    <Transition name="slide-up">
      <div v-if="isMobile && trimmedToc.length > 2" class="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-sm 
               text-zinc-900 dark:text-white z-50 pb-safe">
        <div class="w-[94%] mx-auto">
          <div class="overflow-x-auto no-scrollbar py-3">
            <div class="flex gap-8 transition-transform duration-300 ease-out"
              :style="{ transform: `translateX(-${tocScrollPosition}px)` }">
              <a v-for="item in trimmedToc" :key="item.slug" :href="`#${item.slug}`"
                class="py-1.5 transition-colors whitespace-nowrap text-sm flex-shrink-0 min-w-fit" :class="[
                  activeSection === item.slug
                    ? 'text-zinc-900 dark:text-white font-medium'
                    : 'text-zinc-500 dark:text-zinc-400'
                ]">
                {{ item.text }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop TOC -->
    <teleport to="#toc-container" v-if="!isMobile && post?.toc?.length">
      <div class="p-2 max-w-[250px]">
        <div
          class="toc bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm p-4 rounded-lg text-sm font-sans text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50">
          <h3 class="text-base font-medium mb-3">Table of Contents</h3>
          <ul class="space-y-2">
            <div v-for="item in post.toc" :key="item.slug">
              <ul v-if="item.children?.length" class="space-y-2">
                <li v-for="child in item.children" :key="child.slug"
                  class="transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded">
                  <a :href="`#${child.slug}`" class="block px-2 py-1 rounded transition-colors" :class="[
                    activeSection === child.slug
                      ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-700/50'
                      : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                  ]">
                    {{ child.text }}
                  </a>
                </li>
              </ul>
            </div>
          </ul>
        </div>
      </div>
    </teleport>

    <!-- Add subtle verification badge -->
    <div v-if="verificationStatus !== null"
      class="fixed bottom-4 right-4 flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full" :class="{
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': verificationStatus,
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300': !verificationStatus
      }">
      <span class="font-mono">
        {{ verificationStatus ? '✓ Verified' : '⚠ Unverified' }}
      </span>
      <UIcon :name="verificationStatus ? 'i-heroicons-shield-check' : 'i-heroicons-shield-exclamation'"
        class="w-4 h-4" />
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
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 1;
}

::view-transition-new(root) {
  z-index: 2147483646;
}

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

/* Optimize CSS by combining similar rules */
.toc-common {
  @apply transition-colors duration-200;
}

.toc-hover {
  @apply hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded;
}

/* Hero animation setup */
.post-title {
  will-change: contents;
}

/* Scrollytelling animations */
.blog-post-content {

  img,
  blockquote,
  h2,
  h3,
  h4 {
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    perspective: 1000px;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {

  .post-title,
  .blog-post-content {

    img,
    blockquote,
    h2,
    h3,
    h4 {
      transition: none !important;
      transform: none !important;
      opacity: 1 !important;
    }
  }
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.cursor {
  display: inline-block;
  width: 2px;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  opacity: 1;
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
</style>