<!-- Blog Index - Tufte Style -->

<template>
  <div>
    <!-- Top metadata bar - fixed, matching blog posts -->
    <div class="fixed top-0 left-0 right-0 z-[100] bg-zinc-900/90 backdrop-blur-sm print:hidden">
      <div
        class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 font-mono text-3xs sm:text-2xs text-white uppercase tracking-wider"
      >
        <span class="whitespace-nowrap">
          {{ blogStats.postsCount }} entries
        </span>
        <span class="text-zinc-600">·</span>
        <span class="whitespace-nowrap">
          {{ blogStats.totalWordsK }}K words
        </span>
        <span class="text-zinc-600">·</span>
        <span class="whitespace-nowrap">
          {{ blogStats.totalReadHours }}hr read
        </span>
        <span class="text-zinc-600 hidden sm:inline">·</span>
        <span class="whitespace-nowrap hidden sm:inline">
          {{ blogStats.totalLinks }} links
        </span>
        <span class="text-zinc-600 hidden sm:inline">·</span>
        <span class="whitespace-nowrap hidden sm:inline">
          {{ blogStats.totalImages }} img
        </span>
        <span class="text-zinc-600 hidden sm:inline">·</span>
        <span class="whitespace-nowrap hidden sm:inline">
          {{ sortedYears?.length || 0 }} years
        </span>
      </div>
    </div>

    <!-- Header with consistent metadata styling -->
    <header class="mb-6 relative pt-2">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-screen-xl mx-auto px-4 sm:px-8 xl:px-16">
        <!-- Title section matching blog posts -->
        <div class="px-4 sm:px-6 pt-4 pb-3">
          <h1 class="blog-title">Blog</h1>
          <p :class="blogDescriptionClass">
            Thoughts, projects, and explorations in technology, design, and
            making.
          </p>
        </div>

        <!-- Main content - h-feed microformat for IndieWeb -->
        <div class="blog-grid h-feed">
          <!-- Hidden h-feed metadata for parsers -->
          <a class="u-url hidden" href="https://ejfox.com/blog">Blog</a>
          <span class="p-name hidden">EJ Fox's Blog</span>
          <span class="p-author h-card hidden">
            <span class="p-name">EJ Fox</span>
            <a class="u-url" href="https://ejfox.com">ejfox.com</a>
          </span>
          <!-- Main column -->
          <section class="blog-main-column">
            <!-- Error state -->
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

            <!-- Posts with inline years -->
            <div v-for="year in sortedYears" :key="`blog-${year}`">
              <template
                v-for="(post, index) in blogPostsByYear[year]"
                :key="post?.slug"
              >
                <!-- Year marker (inline, only for first post) -->
                <div v-if="index === 0" :data-year="year" class="year-marker leading-[12px] scroll-mt-4">
                  {{ year }}
                </div>

                <article class="group mb-6 h-entry">
                  <!-- Main content -->
                  <div>
                    <h3 class="p-name">
                      <NuxtLink
                        :to="`/blog/${post?.slug}`"
                        class="u-url title-link leading-[1.2]"
                      >
                        {{ post?.title || formatTitle(post?.slug) }}
                      </NuxtLink>
                    </h3>

                    <!-- Horizontal metadata line with microvis -->
                    <div class="post-metadata">
                      <time
                        class="dt-published"
                        :datetime="post?.metadata?.date || post?.date"
                      >
                        {{
                          formatShortDate(post?.metadata?.date || post?.date)
                        }}
                      </time>
                      <span class="mx-1 text-divider">·</span>
                      <span>
                        {{
                          calculateReadingTime(
                            post?.metadata?.words || post?.words
                          )
                        }}min
                      </span>

                      <!-- Word count with sparkline -->
                      <span
                        v-if="post?.metadata?.words || post?.words"
                        class="inline-flex gap-1 items-center"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.words || post?.words || 0"
                            metric="words"
                            type="bars"
                          />
                        </ClientOnly>
                        <span>
                          {{
                            formatNumber(
                              post?.metadata?.words || post?.words || 0
                            )
                          }}
                          words
                        </span>
                      </span>

                      <!-- Images sparkline -->
                      <span
                        v-if="(post?.metadata?.images || post?.images || 0) > 0"
                        class="inline-flex gap-1 items-center"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.images || post?.images || 0"
                            metric="images"
                            type="dots"
                          />
                        </ClientOnly>
                        <span>
                          {{ post?.metadata?.images || post?.images }} images
                        </span>
                      </span>

                      <!-- Links sparkline -->
                      <span
                        v-if="(post?.metadata?.links || post?.links || 0) > 0"
                        class="inline-flex gap-1 items-center"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.links || post?.links || 0"
                            metric="links"
                            type="bars"
                          />
                        </ClientOnly>
                        <span>
                          {{ post?.metadata?.links || post?.links }} links
                        </span>
                      </span>
                    </div>

                    <p
                      v-if="post?.metadata?.dek || post?.dek"
                      :class="postDekClass"
                    >
                      {{ post?.metadata?.dek || post?.dek }}
                    </p>
                  </div>

                  <!-- Hidden microformat data -->
                  <time
                    v-if="post?.metadata?.date || post?.date"
                    :datetime="post?.metadata?.date || post?.date"
                    class="dt-published hidden"
                  >
                    {{ post?.metadata?.date || post?.date }}
                  </time>
                </article>
              </template>
            </div>
          </section>

        </div>
      </div>
    </header>

    <!-- Sidebar teleport -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="pt-8 pb-4 space-y-4">
          <div class="font-mono text-3xs uppercase tracking-wider text-zinc-500">
            Archive
          </div>

          <!-- Year nav -->
          <div class="space-y-0.5">
            <a
              v-for="year in sortedYears"
              :key="`nav-${year}`"
              href="#"
              class="flex justify-between font-mono text-3xs tabular-nums transition-colors"
              :class="activeYear === String(year)
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'"
              @click.prevent="scrollToYear(year)"
            >
              <span>{{ year }}</span>
              <span class="text-zinc-600">{{ blogPostsByYear[year]?.length }}</span>
            </a>
          </div>

          <!-- Totals -->
          <div class="space-y-1 pt-2 border-t border-zinc-800 font-mono text-3xs tabular-nums">
            <div class="flex justify-between">
              <span class="text-zinc-500">Posts</span>
              <span class="text-zinc-300">{{ blogStats.postsCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Words</span>
              <span class="text-zinc-300">{{ blogStats.totalWordsK }}K</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Read time</span>
              <span class="text-zinc-300">{{ blogStats.totalReadHours }}hr</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Avg post</span>
              <span class="text-zinc-300">{{ blogStats.avgWords }} words</span>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { formatNumber } from '~/composables/useNumberFormat'
import { isValidPost } from '~/composables/usePostFilters'

const { formatShortDate } = useDateFormat()
const processedMarkdown = useProcessedMarkdown()
const { tocTarget } = useTOC()

const activeYear = ref('')

const scrollToYear = (year) => {
  const el = document.querySelector(`[data-year="${year}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Track which year is in view
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

  // Observe year markers after data loads
  watch(sortedYears, () => {
    nextTick(() => {
      document.querySelectorAll('[data-year]').forEach((el) => observer.observe(el))
    })
  }, { immediate: true })

  onBeforeUnmount(() => observer.disconnect())
})

// Helper functions
const formatTitle = (slug) => {
  if (!slug) return 'Untitled'
  const lastPart = slug.split('/').pop()

  // Detect date-based filenames (YYYY-MM-DD or YYYY-MM-DD-suffix)
  // Keep dashes for these - they're intentional
  const datePattern = /^(\d{4}-\d{2}-\d{2})(-.*)?$/
  const dateMatch = lastPart.match(datePattern)
  if (dateMatch) {
    const datePart = dateMatch[1]
    const suffix = dateMatch[2]
    if (suffix) {
      const suffixTitle = suffix
        .slice(1)
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return `${datePart} ${suffixTitle}`
    }
    return datePart
  }

  return lastPart
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// Calculate reading time (assumes 200 words per minute)
const calculateReadingTime = (words) => {
  if (!words) return 0
  return Math.ceil(words / 200)
}

// Format file size (characters to KB)
const _formatFileSize = (chars) => {
  if (!chars) return '0KB'
  const kb = chars / 1024
  return kb < 1 ? '<1KB' : `${kb.toFixed(1)}KB`
}

const getPostYear = (post) => {
  const postDate = post?.date || post?.metadata?.date
  if (!postDate) return 'Unknown'
  return new Date(postDate).getFullYear()
}

const processPost = (post) => {
  const title = post.title || post?.metadata?.title || formatTitle(post.slug)
  return { ...post, title, metadata: { ...post.metadata, title } }
}

const { data: posts, error: postsError } = useAsyncData(
  'blog-posts',
  async () => {
    try {
      const result = await processedMarkdown.getAllPosts(false, false)
      return result.filter((post) => isValidPost(post)).map(processPost)
    } catch (err) {
      console.error('Error in blog index:', err)
      return []
    }
  }
)

// ✅ Performance: Memoized stats computed once instead of per-render
const blogStats = computed(() => {
  const postsArray = posts.value || []
  const totalWords =
    postsArray.reduce(
      (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
      0
    ) || 0
  const totalLinks =
    postsArray.reduce(
      (acc, p) => acc + (p?.metadata?.links || p?.links || 0),
      0
    ) || 0
  const totalImages =
    postsArray.reduce(
      (acc, p) => acc + (p?.metadata?.images || p?.images || 0),
      0
    ) || 0

  return {
    postsCount: postsArray.length,
    totalWordsK: Math.floor(totalWords / 1000),
    totalReadHours: Math.floor(totalWords / 200 / 60),
    avgWords: postsArray.length
      ? Math.floor(totalWords / postsArray.length)
      : 0,
    totalLinks,
    totalImages,
  }
})

// Static description for SSR-safety
const defaultDescription =
  'Thoughts, projects, and explorations in technology, design, and making.'

const blogSchema = computed(() => {
  const lastUpdated =
    posts.value?.[0]?.metadata?.date ||
    posts.value?.[0]?.date ||
    new Date().toISOString()

  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'EJ Fox Blog',
    url: 'https://ejfox.com/blog',
    description: defaultDescription,
    inLanguage: 'en-US',
    dateModified: lastUpdated,
    isPartOf: {
      '@type': 'WebSite',
      name: 'EJ Fox',
      url: 'https://ejfox.com',
    },
    blogPost: (posts.value || []).slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title || post.metadata?.title,
      datePublished: post.metadata?.date || post.date,
      url: `https://ejfox.com/blog/${post.slug}`,
    })),
  }
})

usePageSeo({
  title: 'Blog - EJ Fox',
  description: defaultDescription,
  type: 'article',
  section: 'Writing',
  tags: ['Blog', 'Data visualization', 'Investigations', 'Notes'],
  label1: 'Posts',
  data1: computed(() => `${posts.value?.length || 0} published`),
  label2: 'Latest topic',
  data2: computed(() => posts.value?.[0]?.tags?.[0] || 'Mixed topics'),
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(blogSchema.value),
    },
  ],
}))

// Computed data for sparklines
const _postCountByYear = computed(() => {
  if (!posts.value) return []
  const years = posts.value.reduce((acc, post) => {
    const year = getPostYear(post)
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})
  return Object.values(years)
})

const _monthlyActivity = computed(() => {
  if (!posts.value) return []
  // Get last 12 months of activity with rich data
  const monthNames = [
    'J',
    'F',
    'M',
    'A',
    'M',
    'J',
    'J',
    'A',
    'S',
    'O',
    'N',
    'D',
  ]
  const now = new Date()
  const result = []

  for (let i = 11; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${month.getFullYear()}-${month.getMonth()}`
    result.push({
      key,
      month: monthNames[month.getMonth()],
      year: month.getFullYear(),
      count: 0,
      words: 0,
    })
  }

  posts.value.forEach((post) => {
    const date = new Date(post?.metadata?.date || post?.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const entry = result.find((m) => m.key === key)
    if (entry) {
      entry.count++
      entry.words += post?.metadata?.words || post?.words || 0
    }
  })

  const maxCount = Math.max(...result.map((m) => m.count), 1)
  result.forEach((m) => {
    m.height = Math.round((m.count / maxCount) * 100)
  })

  return result
})

const blogPostsByYear = computed(() => {
  if (!posts.value?.length) return {}

  const grouped = {}
  posts.value.forEach((post) => {
    const postDate = post?.date || post?.metadata?.date
    if (!postDate) return
    const date = new Date(postDate)
    if (Number.isNaN(date.getTime())) return
    const year = date.getFullYear()
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(post)
  })

  Object.values(grouped).forEach((yearPosts) => {
    yearPosts.sort(
      (a, b) =>
        new Date(b?.date || b?.metadata?.date) -
        new Date(a?.date || a?.metadata?.date)
    )
  })

  return grouped
})

const sortedYears = computed(() => {
  const years = blogPostsByYear.value
  if (!years || typeof years !== 'object') return []
  return Object.keys(years).sort((a, b) => b - a)
})

// Blog description paragraph styling
const blogDescriptionClass =
  'font-serif text-base md:text-lg text-zinc-600 ' +
  'dark:text-zinc-400 mb-4 leading-[1.5]'

// Post dek paragraph styling
const postDekClass =
  'font-serif text-sm text-zinc-600 dark:text-zinc-400 ' +
  'mt-0.5 p-summary leading-[1.4] line-clamp-2 hyphens-auto'
</script>

<style scoped>
.blog-title {
  @apply font-serif font-light mb-2.5 tracking-tight text-balance;
  @apply leading-[1.1];
  @apply text-3xl md:text-4xl lg:text-5xl;
}

.blog-grid {
  @apply relative px-4 sm:px-6;
}

.blog-main-column {
  @apply max-w-3xl;
}

.error-box {
  @apply rounded-lg border p-4;
  @apply border-red-300 bg-red-50 text-red-800;
  @apply dark:bg-red-950 dark:border-red-800 dark:text-red-200;
}
</style>
