<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { animate, stagger, onScroll, utils } from '~/anime.esm.js'
import { useWindowSize } from '@vueuse/core'

const config = useRuntimeConfig()
const isDark = useDark()
const processedMarkdown = useProcessedMarkdown()

const route = useRoute()
const router = useRouter()

// Handle redirection and post fetching
const { data: post, error } = await useAsyncData(`post-${route.params.slug.join('-')}`, async () => {
  const slugParts = route.params.slug

  // Fetch the post data, including potential redirection info
  const response = await $fetch(`/api/posts/${slugParts.join('/')}`)

  if (response.redirect) {
    // If we get a redirect response, use navigateTo for proper redirection
    return { redirect: response.redirect }
  }

  return response
})

// Perform redirection if necessary
if (post.value && post.value.redirect) {
  navigateTo(post.value.redirect, { replace: true })
}

const { params } = useRoute()
const { data: nextPrevPosts } = await useAsyncData(
  `next-prev-${route.params.slug.join('-')}`,
  () => processedMarkdown.getNextPrevPosts(route.params.slug.join('/'))
)

// New refs for animation targets
const postTitle = ref(null)
const postMetadata = ref(null)
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
      text: child.text.length > 20 ? child.text.slice(0, 17) + '...' : child.text
    })) || []
  )
})

// New ref for scroll position
const tocScrollPosition = ref(0)

// Update these constants
const TOC_ITEM_WIDTH = 80 // Width of each TOC item in pixels
const VIEWPORT_WIDTH = 300 // Approximate width of the visible area

// Updated function to center the active TOC item
const updateTocScroll = () => {
  const activeIndex = trimmedToc.value.findIndex(item => item.slug === activeSection.value)
  if (activeIndex !== -1) {
    const totalWidth = trimmedToc.value.length * TOC_ITEM_WIDTH
    const halfViewport = VIEWPORT_WIDTH / 2
    let newScrollPosition = activeIndex * TOC_ITEM_WIDTH - halfViewport + TOC_ITEM_WIDTH / 2

    // Ensure we don't scroll past the start or end
    newScrollPosition = Math.max(0, Math.min(newScrollPosition, totalWidth - VIEWPORT_WIDTH))

    tocScrollPosition.value = newScrollPosition
  }
}

// Watch for changes in activeSection
watch(activeSection, updateTocScroll)

onMounted(() => {
  if (post.value && !post.value.redirect) {
    nextTick(() => {
      // Animate metadata
      if (postMetadata.value) {
        animate(postMetadata.value, {
          opacity: [0, 1],
          translateY: ['-10vh', 0],
          duration: 1200,
          delay: 200,
          easing: 'easeOutQuad'
        })
      }

      // Animate internal links
      if (postContent.value) {
        const internalLinks = postContent.value.querySelectorAll('.internal-link')
        if (internalLinks.length > 0) {
          animate(internalLinks, {
            borderColor: ['#67e8f9', '#c2410c', '#facc15', '#be185d'],
            duration: 65000,
            loop: true,
            alternate: true,
            delay: stagger(4500)
          })
        }
      }

      // Set up intersection observers for each section
      const sections = document.querySelectorAll('h2, h3')
      sections.forEach(section => {
        const { stop } = useIntersectionObserver(
          section,
          ([{ isIntersecting }]) => {
            if (isIntersecting) {
              console.log('section', section.id)
              activeSection.value = section.id
            }
          },
          { threshold: 0.5 } // Adjust this value as needed
        )
      })
    })
  }
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
</script>

<template>
  <div>
    <article v-if="post" class="scroll-container pt-4 md:pt-2">
      <div ref="postMetadata">
        <PostMetadata :doc="post" class="paddings" />
      </div>

      <div class="lg:h-[62vh] flex items-center">
        <h1 ref="postTitle" v-if="post?.title"
          class="post-title text-4xl lg:text-8xl xl:text-10xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0 text-balance">
          {{ post?.title }}
        </h1>
      </div>

      <!-- Back to Blog link - only visible on mobile -->
      <div v-if="isBlogPost && isMobile" class="paddings mb-8">
        <UButton to="/blog/" size="sm" icon="i-heroicons-arrow-left" :color="isDark ? 'white' : 'black'">
          Back to Blog
        </UButton>
      </div>

      <div ref="postContent">
        <article v-html="post.content"
          class="px-2 prose-lg md:prose-xl dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-8 prose-p:py-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-8 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 prose-img:rounded-lg prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:px-3 prose-td:py-2 prose-pre:bg-white dark:prose-pre:bg-zinc-800 prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:overflow-x-auto prose-code:max-w-full !max-w-none font-normal">
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
            <span class="text-current">← {{ nextPrevPosts.prev?.title }}</span>
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
    </article>
    <div v-else-if="error" class="p-4 text-red-600">
      <p>Error loading post: {{ error.message }}</p>
    </div>
    <div v-else class="p-4">
      <p>Loading...</p>
    </div>

    <!-- Mobile TOC component -->
    <Transition name="fade">
      <div v-if="isMobile && trimmedToc.length"
        class="fixed bottom-0 left-0 w-full bg-black/70 backdrop-blur-sm text-white overflow-x-auto py-2 z-50">
        <div class="flex transition-transform duration-300 ease-in-out"
          :style="{ transform: `translateX(-${tocScrollPosition}px)` }">
          <div v-for="item in trimmedToc" :key="item.slug" class="flex-shrink-0 w-20 px-2 text-center">
            <a :href="`#${item.slug}`"
              class="text-xs leading-tight block hover:text-blue-400 transition-colors truncate"
              :class="{ 'text-blue-400 font-bold': activeSection === item.slug }">
              {{ item.text }}
            </a>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop TOC -->
    <teleport to="#toc-container" v-if="!isMobile && post?.toc?.length">
      <div v-if="post?.toc?.length" class="p-2">
        <div
          class="toc dark:bg-zinc-900 p-1 pl-4 rounded-lg text-xs my-4 md:my-8 font-sans text-zinc-400 dark:text-zinc-600">
          <h3 class="text-lg mb-2">Table of Contents</h3>
          <ul class="space-y-2">
            <div v-for="item in post.toc" :key="item.slug">
              <ul v-if="item.children?.length" class="mt-2 space-y-2">
                <li v-for="child in item.children" :key="child.slug"
                  :class="{ 'text-zinc-700 dark:text-zinc-300': activeSection === child.slug }">
                  <a :href="`#${child.slug}`" class="hover:text-blue-500 transition-colors">
                    {{ child.text }}
                  </a>
                </li>
              </ul>
            </div>
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
</style>