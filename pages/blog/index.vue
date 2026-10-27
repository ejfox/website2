<!--
  @file blog/index.vue
  @description /blog: every published post, grouped by year, with a year
    archive + totals teleported into the layout sidebar. Data:
    useProcessedMarkdown().getAllPosts() → /api/manifest, then isValidPost()
    (utils/postFilters.ts) keeps only YYYY/slug posts that aren't hidden or
    scheduled.
  SSR per request, not prerendered (LIVE_LISTINGS in nuxt.config.ts), so a
  scheduled post appears the moment its publishAt passes.
-->
<script setup>
import { formatNumber } from '~/utils/numberFormat'
import { isValidPost } from '~/utils/postFilters'

const processedMarkdown = useProcessedMarkdown()
const { tocTarget } = useTOC()
const { revealContainer: postsReveal } = useScrollReveal({
  selector: 'article, .year-marker',
  staggerDelay: 15,
  translateY: 4,
  duration: 180,
})

const activeYear = ref('')

const scrollToYear = (year) => {
  const el = document.querySelector(`[data-year="${year}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const postDate = (post) => post?.metadata?.date || post?.date
const postWords = (post) => post?.metadata?.words || post?.words || 0
const postImages = (post) => post?.metadata?.images || post?.images || 0
const postLinks = (post) => post?.metadata?.links || post?.links || 0
// 200 wpm, same rate as totalReadHours below.
const readingTime = (words) => (words ? Math.ceil(words / 200) : 0)

const formatTitle = (slug) => {
  if (!slug) return 'Untitled'
  const lastPart = slug.split('/').pop()

  const dateMatch = lastPart.match(/^(\d{4}-\d{2}-\d{2})(-.*)?$/)
  if (dateMatch) {
    const suffix = dateMatch[2]
    if (suffix) {
      return `${dateMatch[1]} ${suffix
        .slice(1)
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')}`
    }
    return dateMatch[1]
  }

  return lastPart.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Data loading ────────────────────────────────────────────
// getManifestLite() catches fetch errors and returns [], so postsError rarely
// fires; an outage shows as "No blog posts found."
const { data: posts, error: postsError } = useAsyncData(
  'blog-posts',
  async () => {
    const result = await processedMarkdown.getAllPosts(false, false)
    return result
      .filter((post) => isValidPost(post))
      .map((post) => ({
        ...post,
        title: post.title || post?.metadata?.title || formatTitle(post.slug),
      }))
  }
)

const blogStats = computed(() => {
  const all = posts.value || []
  const totalWords = all.reduce((sum, p) => sum + postWords(p), 0)
  return {
    postsCount: all.length,
    totalWordsK: Math.floor(totalWords / 1000),
    totalReadHours: Math.floor(totalWords / 200 / 60),
    avgWords: all.length ? Math.floor(totalWords / all.length) : 0,
  }
})

const blogPostsByYear = computed(() => {
  if (!posts.value?.length) return {}

  const grouped = {}
  posts.value.forEach((post) => {
    const d = postDate(post)
    if (!d) return
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return
    const year = date.getFullYear()
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(post)
  })

  Object.values(grouped).forEach((yearPosts) => {
    yearPosts.sort((a, b) => new Date(postDate(b)) - new Date(postDate(a)))
  })

  return grouped
})

const sortedYears = computed(() =>
  Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
)

// ── Sidebar year tracking (client only) ─────────────────────
// Same -10%/-80% band as the post TOC: the year marker in the top 10–20% of
// the viewport is "active". The watch re-observes when the year list changes.
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeYear.value = entry.target.getAttribute('data-year') || ''
        }
      })
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  )

  watch(
    sortedYears,
    () => {
      nextTick(() => {
        document
          .querySelectorAll('[data-year]')
          .forEach((el) => observer.observe(el))
      })
    },
    { immediate: true }
  )

  onBeforeUnmount(() => observer.disconnect())
})

// ── SEO ─────────────────────────────────────────────────────
usePageSeo({
  // This page renders its own JSON-LD below; don't add a second one.
  schema: false,
  title: 'Blog - EJ Fox',
  description: "Things I'm thinking about — data, code, journalism, the web",
  type: 'article',
  section: 'Writing',
  tags: ['Blog', 'Data visualization', 'Investigations', 'Notes'],
  label1: 'Posts',
  data1: computed(() => `${posts.value?.length || 0} published`),
  label2: 'Latest topic',
  data2: computed(() => posts.value?.[0]?.tags?.[0] || 'Mixed topics'),
})

// JSON-LD Blog schema (structured data for search engines)
const blogSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'EJ Fox Blog',
  url: 'https://ejfox.com/blog',
  description: "Things I'm thinking about — data, code, journalism, the web",
  inLanguage: 'en-US',
  dateModified: postDate(posts.value?.[0]) || new Date().toISOString(),
  isPartOf: {
    '@type': 'WebSite',
    name: 'EJ Fox',
    url: 'https://ejfox.com',
  },
  blogPost: (posts.value || []).slice(0, 10).map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title || post.metadata?.title,
    datePublished: postDate(post),
    url: `https://ejfox.com/blog/${post.slug}`,
  })),
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(blogSchema.value),
    },
  ],
}))
</script>

<template>
  <div>
    <header class="mb-6 relative pt-2">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-8 xl:px-16">
        <div class="px-4 sm:px-6 pt-4 pb-3">
          <h1 class="blog-title">Blog</h1>
          <p class="blog-description">
            Things I'm thinking about — data, code, journalism, the web
          </p>
        </div>

        <!-- h-feed microformat -->
        <div class="blog-grid h-feed">
          <a class="u-url hidden" href="https://ejfox.com/blog">Blog</a>
          <span class="p-name hidden">EJ Fox's Blog</span>
          <span class="p-author h-card hidden">
            <span class="p-name">EJ Fox</span>
            <a class="u-url" href="https://ejfox.com">ejfox.com</a>
          </span>

          <section ref="postsReveal" class="max-w-3xl">
            <div v-if="postsError" class="error-box">
              <h2 class="font-bold">Failed to Load Blog Posts</h2>
              <p class="text-sm">
                {{
                  postsError.message ||
                  'An error occurred while loading blog posts.'
                }}
              </p>
              <a
                href="/"
                class="mt-2 inline-block text-red-600 dark:text-red-400 underline"
              >
                Return Home
              </a>
            </div>

            <div v-else-if="!sortedYears.length" class="text-center py-8">
              <p class="text-zinc-600 dark:text-zinc-400 text-sm">
                No blog posts found.
              </p>
            </div>

            <!-- ── Posts by year ─────────── -->
            <div v-for="year in sortedYears" :key="`blog-${year}`">
              <template
                v-for="(post, index) in blogPostsByYear[year]"
                :key="post?.slug"
              >
                <div
                  v-if="index === 0"
                  :data-year="year"
                  class="year-marker rule-dotted-leader leading-3 mb-2 scroll-mt-4"
                >
                  {{ year }}
                </div>

                <article class="group mb-6 h-entry">
                  <!-- h2 under the page h1 (h3 skipped a level). The tracking
                       keeps the old h3 letter-spacing from global.css. -->
                  <h2 class="p-name tracking-[-0.015em]">
                    <NuxtLink
                      :to="`/blog/${post?.slug}`"
                      class="u-url title-link leading-tight"
                    >
                      {{ post.title }}
                    </NuxtLink>
                  </h2>

                  <div class="post-metadata">
                    <time class="dt-published" :datetime="postDate(post)">
                      {{ formatShortDate(postDate(post)) }}
                    </time>
                    <span>{{ readingTime(postWords(post)) }}min</span>

                    <span
                      v-if="postWords(post)"
                      class="inline-flex gap-1 items-center"
                    >
                      <ClientOnly>
                        <BlogSparkline
                          :value="postWords(post)"
                          metric="words"
                          type="bars"
                        />
                      </ClientOnly>
                      <span>
                        {{ formatNumber(postWords(post)) }}
                        words
                      </span>
                    </span>

                    <span
                      v-if="postImages(post) > 0"
                      class="inline-flex gap-1 items-center"
                    >
                      <ClientOnly>
                        <BlogSparkline
                          :value="postImages(post)"
                          metric="images"
                          type="dots"
                        />
                      </ClientOnly>
                      <span>{{ postImages(post) }} images</span>
                    </span>

                    <span
                      v-if="postLinks(post) > 0"
                      class="inline-flex gap-1 items-center"
                    >
                      <ClientOnly>
                        <BlogSparkline
                          :value="postLinks(post)"
                          metric="links"
                          type="bars"
                        />
                      </ClientOnly>
                      <span>{{ postLinks(post) }} links</span>
                    </span>
                  </div>

                  <p
                    v-if="post?.metadata?.dek || post?.dek"
                    class="post-dek p-summary"
                  >
                    {{ post?.metadata?.dek || post?.dek }}
                  </p>
                </article>
              </template>
            </div>
          </section>
        </div>
      </div>
    </header>

    <!-- ── Sidebar ─────────── -->
    <!-- Sidebar: year archive -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="space-y-4">
          <div
            class="font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            Archive
          </div>

          <div class="space-y-0.5">
            <a
              v-for="year in sortedYears"
              :key="`nav-${year}`"
              href="#"
              class="flex justify-between font-mono text-3xs tabular-nums transition-colors"
              :class="
                activeYear === String(year)
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              "
              @click.prevent="scrollToYear(year)"
            >
              <span>{{ year }}</span>
              <span class="text-zinc-600">
                {{ blogPostsByYear[year]?.length }}
              </span>
            </a>
          </div>

          <div
            class="space-y-1 pt-2 border-t border-zinc-800 font-mono text-3xs tabular-nums"
          >
            <div class="flex justify-between">
              <span class="text-zinc-500">Posts</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ blogStats.postsCount }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Words</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ blogStats.totalWordsK }}K
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Read time</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ blogStats.totalReadHours }}hr
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Avg post</span>
              <span class="text-zinc-700 dark:text-zinc-300">
                {{ blogStats.avgWords }} words
              </span>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.blog-title {
  @apply font-light mb-1 tracking-tight text-balance;
  @apply leading-[1.1];
  @apply text-3xl md:text-4xl lg:text-5xl;
  font-family:
    'Vault Alarm',
    system-ui,
    -apple-system,
    sans-serif;
}

.blog-description {
  @apply font-serif text-base md:text-lg leading-relaxed;
  @apply text-zinc-600 dark:text-zinc-400 mb-4;
}

.blog-grid {
  @apply relative px-4 sm:px-6;
}

.post-dek {
  @apply font-serif text-sm leading-6 mt-0.5;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply line-clamp-2 hyphens-auto;
}

.error-box {
  @apply rounded-lg border p-4;
  @apply border-red-300 bg-red-50 text-red-800;
  @apply dark:bg-red-950 dark:border-red-800 dark:text-red-200;
}
</style>
