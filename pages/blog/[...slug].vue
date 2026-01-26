<script setup>
import { useIntersectionObserver } from '@vueuse/core'
import striptags from 'striptags'
import PostMetadataBar from '~/components/blog/post/PostMetadataBar.vue'
import PostNav from '~/components/blog/post/PostNav.vue'
import PostRelated from '~/components/blog/post/PostRelated.vue'
import PostTOC from '~/components/blog/post/PostTOC.vue'
import Webmentions from '~/components/blog/Webmentions.vue'
import ReplyContext from '~/components/blog/ReplyContext.vue'
import { useReadingStats } from '~/composables/useReadingStats'
import { useTypingAnimation } from '~/composables/useTypingAnimation'

// Composables
const { formatLongDate } = useDateFormat()
const config = useRuntimeConfig()
const route = useRoute()
const processedMarkdown = useProcessedMarkdown()
const { tocTarget } = useTOC()

// --- Data Fetching ---
const { data: post, error } = await useAsyncData(
  `post-${route.params.slug.join('-')}`,
  async () => {
    try {
      const response = await $fetch(`/api/posts/${route.params.slug.join('/')}`)
      if (response.redirect && route.path !== response.redirect) {
        return { redirect: response.redirect }
      }
      return response.error ? null : response
    } catch (e) {
      console.error('Error fetching post:', e)
      return null
    }
  }
)

// Handle redirect
if (post.value?.redirect && route.path !== post.value.redirect) {
  navigateTo(post.value.redirect, { replace: true })
}

const { data: nextPrevPosts } = await useAsyncData(
  `next-prev-${route.params.slug.join('-')}`,
  () =>
    processedMarkdown
      .getNextPrevPosts(route.params.slug.join('/'))
      .catch(() => ({ next: null, prev: null }))
)

const { data: allPosts } = await useAsyncData('all-posts-for-related', () =>
  processedMarkdown.getAllPosts(false, false).catch(() => [])
)

// --- Computed Values ---
const { stats: readingStats } = useReadingStats(post)

const postTitle = computed(
  () => post.value?.metadata?.title || post.value?.title || ''
)
const { renderedHtml: renderedTitle, startAnimation } =
  useTypingAnimation(postTitle)

const relatedPosts = computed(() => {
  if (!allPosts.value || !post.value) return []
  const currentTags = post.value.metadata?.tags || post.value.tags || []
  const currentSlug = route.params.slug.join('/')
  if (!currentTags.length) return []

  return allPosts.value
    .filter((p) => {
      const slug = p.slug || p.metadata?.slug
      return (
        slug !== currentSlug &&
        !p.draft &&
        !p.metadata?.draft &&
        !p.hidden &&
        !p.metadata?.hidden
      )
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
})

const tocChildren = computed(
  () =>
    post.value?.toc?.[0]?.children ||
    post.value?.metadata?.toc?.[0]?.children ||
    []
)

// --- Refs & State ---
const articleContent = ref(null)
const activeSection = ref('')
const scrollProgress = ref(0)
const showDebugGrid = ref(false)

// --- URL & SEO ---
const baseURL = config.public?.baseURL || 'https://ejfox.com'
const postUrl = computed(
  () => new URL(`/blog/${route.params.slug.join('/')}`, baseURL).href
)

const postDescription = computed(() => {
  const dek = post.value?.metadata?.dek || post.value?.dek
  if (dek) return dek
  const text = striptags(post.value?.html || '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 160 ? text.substring(0, 157) + '...' : text
})

const heroImage = computed(
  () =>
    post.value?.metadata?.image ||
    post.value?.metadata?.ogImage ||
    post.value?.coverImage ||
    `${baseURL}/og-image.png`
)

const articleTags = computed(
  () => post.value?.metadata?.tags || post.value?.tags || []
)
const articleSection = computed(
  () => post.value?.metadata?.section || articleTags.value[0] || 'Writing'
)

// Draft detection
const isDraft = computed(() => post.value?.metadata?.draft || post.value?.draft)

const publishedDateISO = computed(() => {
  const d = post.value?.metadata?.date || post.value?.date
  if (!d) return undefined
  try {
    return new Date(d).toISOString()
  } catch {
    return undefined
  }
})

const modifiedDateISO = computed(() => {
  const d =
    post.value?.metadata?.lastUpdated ||
    post.value?.metadata?.date ||
    post.value?.date
  if (!d) return undefined
  try {
    return new Date(d).toISOString()
  } catch {
    return undefined
  }
})

const articleSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  mainEntityOfPage: postUrl.value,
  headline: postTitle.value,
  description: postDescription.value,
  articleSection: articleSection.value,
  keywords: articleTags.value,
  datePublished: publishedDateISO.value,
  dateModified: modifiedDateISO.value,
  wordCount: readingStats.value.words,
  timeRequired: `PT${Math.max(1, readingStats.value.readingTime)}M`,
  image: heroImage.value,
  inLanguage: 'en-US',
  author: { '@type': 'Person', name: 'EJ Fox', url: 'https://ejfox.com' },
  publisher: { '@type': 'Person', name: 'EJ Fox', url: 'https://ejfox.com' },
}))

usePageSeo({
  title: postTitle,
  description: postDescription,
  type: 'article',
  section: articleSection,
  tags: articleTags,
  image: heroImage,
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

// --- Smart 404 Suggestions ---
const smartSuggestions = ref([])

watch(
  error,
  async (err) => {
    if (!err) return
    try {
      const posts = await $fetch('/api/manifest')
      const path = route.path.replace(/^\/blog\//, '').toLowerCase()
      const distance = (a, b) => {
        if (!a || !b) return 999
        const [l1, l2] = [a.length, b.length]
        if (!l1) return l2
        if (!l2) return l1
        let prev = Array.from({ length: l2 + 1 }, (_, i) => i)
        for (let i = 1; i <= l1; i++) {
          const curr = [i]
          for (let j = 1; j <= l2; j++) {
            curr[j] =
              a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : Math.min(prev[j - 1], prev[j], curr[j - 1]) + 1
          }
          prev = curr
        }
        return prev[l2]
      }
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

// --- Lifecycle ---
onMounted(() => {
  startAnimation()

  // Scroll progress
  const handleScroll = () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight
    if (scrollHeight <= 0 || window.scrollY <= 0) {
      scrollProgress.value = 0
      return
    }
    scrollProgress.value = Math.min((window.scrollY / scrollHeight) * 100, 100)
  }

  // Debug grid toggle (Cmd+G)
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

  // TOC intersection observer
  nextTick(() => {
    if (!articleContent.value) return
    const headings = Array.from(
      articleContent.value.querySelectorAll('h2, h3, h4')
    )
    headings.forEach((heading) => {
      const { stop } = useIntersectionObserver(
        heading,
        ([{ isIntersecting }]) => {
          if (isIntersecting) activeSection.value = heading.id
        },
        { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
      )
      heading._stopObserver = stop
    })
    onUnmounted(() => headings.forEach((h) => h._stopObserver?.()))
  })
})
</script>

<template>
  <div class="relative">
    <Head>
      <Meta
        name="robots"
        :content="
          post?.metadata?.draft || post?.draft
            ? 'noindex, nofollow'
            : 'index, follow'
        "
      />
    </Head>

    <!-- Debug Grid Overlay -->
    <div
      v-show="showDebugGrid"
      class="pointer-events-none fixed inset-0 z-[999] debug-grid"
    ></div>

    <!-- Top metadata bar - above everything -->
    <div
      v-if="post && !post.redirect"
      class="fixed top-0 left-0 right-0 z-[100] bg-zinc-900"
    >
      <PostMetadataBar
        :date="post?.metadata?.date || post?.date"
        :stats="readingStats"
      />
      <!-- Draft banner - inside same container, stacks below metadata -->
      <div v-if="isDraft" class="draft-banner">
        <span class="draft-banner-text">DRAFT</span>
        <span class="draft-banner-subtext">
          Work in progress · Not for distribution
        </span>
      </div>
    </div>

    <!-- Reading progress bar -->
    <div v-if="post && !post.redirect" class="progress-bar">
      <div class="progress-inner" :style="`width: ${scrollProgress}%`"></div>
    </div>

    <article
      v-if="post && !post.redirect"
      :class="['h-entry w-full px-4 md:px-8 xl:px-16', { 'is-draft': isDraft }]"
    >
      <!-- Title -->
      <div class="pt-3 pb-2">
        <h1
          v-if="postTitle"
          class="post-title-hero text-3xl sm:text-5xl lg:text-7xl xl:text-8xl font-black"
          style="line-height: 1.1; letter-spacing: -0.03em"
          v-html="renderedTitle"
        ></h1>
        <p v-if="post?.metadata?.dek || post?.dek" class="post-dek">
          {{ post?.metadata?.dek || post?.dek }}
        </p>
      </div>

      <!-- Microformats (hidden) -->
      <time
        v-if="post?.metadata?.date"
        :datetime="post.metadata.date"
        class="dt-published hidden"
      >
        {{ formatLongDate(post.metadata.date) }}
      </time>
      <div class="p-author h-card hidden">
        <span class="p-name">EJ Fox</span>
        <a class="u-url" href="https://ejfox.com">ejfox.com</a>
      </div>
      <a :href="postUrl" class="u-url hidden">{{ postUrl }}</a>

      <!-- Reply Context -->
      <div v-if="post?.metadata?.replyTo || post?.metadata?.['in-reply-to']">
        <ReplyContext
          :reply-to="post?.metadata?.replyTo || post?.metadata?.['in-reply-to']"
        />
      </div>

      <!-- Article Content -->
      <div ref="articleContent" class="pt-3 pb-6">
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
        <div v-else class="text-center text-red-500">No content available</div>
      </div>

      <!-- Tags -->
      <div v-if="post.tags || post.metadata?.tags" class="tags-container">
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

      <!-- Navigation -->
      <PostNav
        :prev-post="nextPrevPosts?.prev"
        :next-post="nextPrevPosts?.next"
      />

      <!-- Related Posts -->
      <PostRelated :related-posts="relatedPosts" />

      <!-- Tip jar -->
      <BlogTipJar v-if="!post.metadata?.noTips" />

      <!-- Webmentions -->
      <Webmentions :url="postUrl" />
    </article>

    <div v-else-if="error" class="p-8 text-center">
      <p class="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
        Post not found
      </p>
      <NuxtLink to="/blog" class="text-zinc-500 hover:text-zinc-700 underline">
        browse all posts
      </NuxtLink>
    </div>

    <div v-else class="p-4 text-center">
      <p class="text-xl text-zinc-600 dark:text-zinc-400">Loading...</p>
    </div>

    <!-- Sidebar TOC -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <PostTOC :toc-children="tocChildren" :active-section="activeSection" />
      </teleport>
    </ClientOnly>
  </div>
</template>

<style lang="postcss">
/* Progress bar - just below metadata */
.progress-bar {
  @apply fixed top-0 left-0 right-0 h-px z-[101];
}
.progress-inner {
  @apply h-full bg-white/60;
}

/* Tags */
.tags-container {
  @apply px-4 md:px-6 py-4 md:py-3;
  @apply border-t border-zinc-200 dark:border-zinc-800;
}

/* Debug grid */
.debug-grid {
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
}

/* ===========================================
   BLOG POST TYPOGRAPHY
   Scale: 2px font increments, 8px spacing grid
   =========================================== */

.blog-post-content {
  --body-size: 1rem;
  --body-line: 1.5rem;
  --body-margin: 1.5rem;
  --h1-size: 1.75rem;
  --h1-line: 2rem;
  --h1-margin-top: 2rem;
  --h2-size: 1.5rem;
  --h2-line: 1.75rem;
  --h2-margin-top: 2.5rem;
  --h3-size: 1.5rem;
  --h3-line: 2rem;
  --h4-size: 1.25rem;
  --h4-line: 1.5rem;
  --code-size: 1rem;
  --code-line: 1.5rem;
  @apply font-serif;
}

@media (min-width: 640px) {
  .blog-post-content {
    --body-size: 1.125rem;
    --body-line: 1.75rem;
    --body-margin: 1.25rem;
    --h1-size: 2rem;
    --h1-line: 2.5rem;
    --h1-margin-top: 3rem;
    --h2-size: 1.75rem;
    --h2-line: 2rem;
    --h2-margin-top: 3.5rem;
  }
}

@media (min-width: 768px) {
  .blog-post-content {
    --h1-size: 2.5rem;
    --h1-line: 3rem;
    --h1-margin-top: 4rem;
    --h2-size: 2rem;
    --h2-line: 2.5rem;
    --h2-margin-top: 4rem;
  }
}

.blog-post-content p,
.blog-post-content ul,
.blog-post-content ol {
  @apply max-w-prose;
  font-size: var(--body-size);
  line-height: var(--body-line);
  margin-bottom: var(--body-margin);
}

.blog-post-content li {
  line-height: var(--body-line);
  margin-bottom: 0.5rem;
}

.blog-post-content ul,
.blog-post-content ol {
  padding-left: 1.5rem;
}

@media (min-width: 640px) {
  .blog-post-content ul,
  .blog-post-content ol {
    padding-left: 2rem;
  }
}

/* Hide first H1 - we have hero title */
.blog-post-content > h1:first-child {
  @apply hidden;
}

.blog-post-content h1 {
  @apply font-serif font-light max-w-prose;
  font-size: var(--h1-size);
  line-height: var(--h1-line);
  margin-top: var(--h1-margin-top);
  margin-bottom: 1.25rem;
  letter-spacing: -0.02em;
}

.blog-post-content h2 {
  @apply font-serif font-normal max-w-prose;
  font-size: var(--h2-size);
  line-height: var(--h2-line);
  margin-top: var(--h2-margin-top);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.blog-post-content h3 {
  @apply font-serif font-normal max-w-prose;
  font-size: var(--h3-size);
  line-height: var(--h3-line);
  margin-top: 3rem;
  margin-bottom: 0.5rem;
}

.blog-post-content h4 {
  @apply font-serif font-medium max-w-prose;
  font-size: var(--h4-size);
  line-height: var(--h4-line);
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

.blog-post-content h5,
.blog-post-content h6 {
  @apply font-serif font-medium max-w-prose;
  font-size: var(--body-size);
  line-height: var(--body-line);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.blog-post-content blockquote {
  @apply italic border-l-4 border-zinc-300 dark:border-zinc-700 max-w-prose;
  font-size: var(--body-size);
  line-height: var(--body-line);
  margin: 1rem 0;
  padding: 1rem 0 1rem 1.5rem;
}

.blog-post-content code {
  @apply font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded;
  font-size: var(--code-size);
  padding-top: 2px;
  padding-bottom: 2px;
}

.blog-post-content pre {
  @apply font-mono overflow-x-auto bg-zinc-50 dark:bg-zinc-900 rounded-lg;
  font-size: var(--code-size);
  line-height: var(--code-line);
  margin: 1.5rem 0;
  padding: 1rem;
}

.blog-post-content pre code {
  @apply bg-transparent p-0;
  font-size: inherit;
}

.blog-post-content img {
  @apply w-full rounded-lg;
  max-width: none !important;
  margin: 2rem 0;
}

/* Images in figures should also be full width */
.blog-post-content figure {
  @apply w-full;
  max-width: none !important;
  margin: 2rem 0;
}

.blog-post-content figure img {
  @apply w-full rounded-lg;
  margin: 0;
}

.blog-post-content hr {
  @apply border-t border-zinc-200 dark:border-zinc-800 border-solid w-full;
  margin: 2rem 0;
}

.blog-post-content a {
  @apply text-zinc-700 dark:text-zinc-300 underline;
  text-underline-offset: 2px;
}

.blog-post-content a:hover {
  @apply text-zinc-900 dark:text-zinc-100;
}

.blog-post-content .external-link {
  display: inline;
}

.blog-post-content .external-link svg {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  vertical-align: super;
  margin-left: 2px;
  opacity: 0.5;
}

.blog-post-content a:hover .external-link svg {
  opacity: 0.8;
}

/* Title typing animation - opacity-based, no layout shift */
.post-title-hero {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* Each character holds its space; opacity reveals it */
.post-title-hero .typing-char {
  display: inline;
  opacity: 0;
  transition: opacity 0.06s ease-out;
}

.post-title-hero .typing-char.typed {
  opacity: 1;
}

.post-title-hero .cursor {
  display: inline-block;
  width: 3px;
  height: 0.85em;
  margin-left: 1px;
  background-color: currentColor;
  animation: blink 0.5s ease-in-out infinite;
  vertical-align: baseline;
  opacity: 0.85;
}

@keyframes blink {
  0%,
  40% {
    opacity: 0.85;
  }
  50%,
  90% {
    opacity: 0;
  }
  100% {
    opacity: 0.85;
  }
}

/* ===========================================
   DRAFT MODE - The Orchestra Effect
   Banner + Watermark + Typography shift
   =========================================== */

/* High-contrast minimalist banner */
.draft-banner {
  @apply flex items-center justify-center gap-4 py-1.5;
  background: #fafafa;
}

@media (prefers-color-scheme: dark) {
  .draft-banner {
    background: #18181b;
    border-bottom-color: #27272a;
  }
}

.draft-banner-text {
  @apply font-mono text-sm font-bold tracking-[0.3em] uppercase;
  color: #09090b;
}

@media (prefers-color-scheme: dark) {
  .draft-banner-text {
    color: #fafafa;
  }
}

.draft-banner-subtext {
  @apply font-mono text-xs opacity-50;
  color: #09090b;
}

@media (prefers-color-scheme: dark) {
  .draft-banner-subtext {
    color: #fafafa;
  }
}

/* Draft article wrapper - watermark + shifted styles */
article.is-draft {
  position: relative;
  padding-top: 3rem; /* Account for banner */
}

/* Watermark effect */
article.is-draft::before {
  content: 'DRAFT';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: clamp(4rem, 15vw, 12rem);
  font-weight: 900;
  letter-spacing: 0.2em;
  color: rgba(0, 0, 0, 0.03);
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
  user-select: none;
}

@media (prefers-color-scheme: dark) {
  article.is-draft::before {
    color: rgba(255, 255, 255, 0.03);
  }
}

/* Typography shift: serif → monospace for drafts */
article.is-draft .blog-post-content {
  /* stylelint-disable-next-line max-line-length */
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
}

article.is-draft .blog-post-content p,
article.is-draft .blog-post-content li {
  font-family: inherit;
  letter-spacing: -0.01em;
}

article.is-draft .blog-post-content h1,
article.is-draft .blog-post-content h2,
article.is-draft .blog-post-content h3,
article.is-draft .blog-post-content h4,
article.is-draft .blog-post-content h5,
article.is-draft .blog-post-content h6 {
  font-family: inherit;
}

/* Draft title also gets monospace treatment */
article.is-draft .post-title-hero {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
}

/* Subtle desaturation on draft content */
article.is-draft .blog-post-content {
  filter: saturate(0.85);
}
</style>
