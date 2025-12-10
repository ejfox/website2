<!-- Blog Index - Tufte Style -->

<template>
  <div>
    <!-- Header with consistent metadata styling -->
    <header class="mb-6 relative pt-8">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16">
        <!-- Compact metadata bar matching blog posts -->
        <div>
          <div class="metadata-bar mb-4">
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">ENTRIES</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ blogStats.postsCount }}
              </span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">WORDS</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ blogStats.totalWordsK }}K
              </span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">READ</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ blogStats.totalReadHours }}hr
              </span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">LINKS</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ blogStats.totalLinks }}
              </span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">IMAGES</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ blogStats.totalImages }}
              </span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">YEARS</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ sortedYears?.length || 0 }}
              </span>
            </span>
          </div>
        </div>

        <!-- Title section matching blog posts -->
        <div class="px-4 md:px-6 pt-4 pb-3">
          <h1 class="blog-title">Blog</h1>
          <p :class="blogDescriptionClass">
            Thoughts, projects, and explorations in technology, design, and
            making.
          </p>
        </div>

        <!-- 12-Month Activity Small Multiples -->
        <div v-if="monthlyActivity.length" class="px-4 md:px-6 pb-6 pt-2">
          <div class="flex items-end gap-[2px] h-8">
            <div
              v-for="month in monthlyActivity"
              :key="month.key"
              class="flex-1 flex flex-col items-center group cursor-default"
              :title="
                `${month.month} ${month.year}: ` +
                `${month.count} posts, ${Math.round(month.words / 1000)}K words`
              "
            >
              <div
                class="w-full bg-zinc-300 dark:bg-zinc-600 transition-colors group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400"
                :style="{
                  height: `${Math.max(month.height, month.count > 0 ? 8 : 2)}%`,
                  opacity: month.count > 0 ? 1 : 0.3,
                }"
              ></div>
            </div>
          </div>
          <div class="flex gap-[2px] mt-1">
            <div
              v-for="month in monthlyActivity"
              :key="`label-${month.key}`"
              class="flex-1 text-center"
            >
              <span
                class="text-[8px] font-mono text-zinc-400 dark:text-zinc-500"
              >
                {{ month.month }}
              </span>
            </div>
          </div>
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
                <div v-if="index === 0" class="year-marker leading-[12px]">
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
                        class="flex-gap-0.5"
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
                        class="flex-gap-0.5"
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
                        class="flex-gap-0.5"
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

          <!-- Sidebar sections (simplified) -->
          <aside class="blog-sidebar">
            <!-- Data stats footer -->
            <div class="data-footer">
              <div>
                <span class="text-zinc-500">TTL_WORDS</span>
                <br />
                <span>{{ blogStats.totalWordsK }}k</span>
              </div>
              <div>
                <span class="text-zinc-500">AVG_POST</span>
                <br />
                <span>{{ blogStats.avgWords }}w</span>
              </div>
              <div>
                <span class="text-zinc-500">MEDIA</span>
                <br />
                <span>{{ blogStats.totalImages }}img</span>
              </div>
            </div>
            <div class="mt-8 space-y-8">
              <!-- Week Notes -->
              <section v-if="sortedWeekNotes.length">
                <h2 class="section-header-xs">
                  Week Notes
                  <span
                    class="mono-xs text-zinc-400 normal-case tracking-normal"
                  >
                    [{{ sortedWeekNotes.length }}]
                  </span>
                </h2>
                <div class="stack-2">
                  <article
                    v-for="weekNote in sortedWeekNotes"
                    :key="weekNote.slug"
                    class="group"
                  >
                    <NuxtLink :to="`/blog/${weekNote.slug}`" class="block">
                      <div class="card-title">
                        Week {{ weekNote.slug.split('/')[1] }}
                      </div>
                      <p class="font-serif text-xs text-zinc-500">
                        {{ weekNote.metadata?.dek || weekNote.dek }}
                      </p>
                    </NuxtLink>
                  </article>
                </div>
              </section>

              <!-- Recently Updated -->
              <section v-if="recentlyUpdatedPosts.length">
                <h2 class="section-header-xs">
                  Recently Updated
                  <span
                    class="mono-xs text-zinc-400 normal-case tracking-normal"
                  >
                    [{{ recentlyUpdatedPosts.length }}]
                  </span>
                </h2>
                <div class="stack-2">
                  <article
                    v-for="post in recentlyUpdatedPosts"
                    :key="post.slug"
                    class="group"
                  >
                    <NuxtLink :to="`/blog/${post.slug}`" class="block">
                      <div class="card-title">
                        {{ post.title }}
                      </div>
                      <div class="mono-xs text-zinc-500">
                        {{
                          formatShortDate(
                            post?.metadata?.lastUpdated ||
                              post?.metadata?.date ||
                              post?.date
                          )
                        }}
                      </div>
                    </NuxtLink>
                  </article>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { subMonths, startOfWeek } from '~/utils/dateUtils'
import { formatNumber } from '~/composables/useNumberFormat'
import { isValidPost } from '~/composables/blog/usePostFilters'

const { formatShortDate } = useDateFormat()
const processedMarkdown = useProcessedMarkdown()

// Helper functions
const formatTitle = (slug) => {
  if (!slug) return 'Untitled'
  const lastPart = slug.split('/').pop()
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

const { data: notes, error: _notesError } = useAsyncData(
  'week-notes',
  async () => {
    try {
      const result = await processedMarkdown.getAllPosts(false, true)
      return (
        result
          ?.filter((post) => isValidPost(post, true))
          .map((note) => ({
            ...note,
            metadata: note?.metadata || {},
            slug: note?.slug || note?.metadata?.slug,
            dek: note?.dek || note?.metadata?.dek,
            date: note?.date || note?.metadata?.date,
            type: note?.type || note?.metadata?.type || 'weekNote',
          })) || []
      )
    } catch (err) {
      console.error('Error fetching week notes:', err)
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

const monthlyActivity = computed(() => {
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

const sortedWeekNotes = computed(() => {
  if (!notes.value) return []

  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56) // 8 weeks

  return notes.value
    .map((note) => {
      const processedNote = { ...note }
      const weekMatch = note?.slug?.match(/(\d{4})-(\d{2})/)

      if (weekMatch) {
        const [, year, week] = weekMatch
        const date = startOfWeek(new Date(+year, 0, 1), { weekStartsOn: 1 })
        processedNote.actualDate = new Date(
          date.setDate(date.getDate() + (+week - 1) * 7)
        )
      } else {
        const noteDate = note?.date || note?.metadata?.date
        if (noteDate) processedNote.actualDate = new Date(noteDate)
      }
      return processedNote
    })
    .filter(
      (note) =>
        note?.actualDate &&
        note?.actualDate > eightWeeksAgo &&
        note?.slug &&
        (note?.dek || note?.metadata?.dek) &&
        !note?.hidden &&
        !note?.metadata?.hidden
    )
    .sort((a, b) => b.actualDate - a.actualDate)
    .slice(0, 4)
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

const recentlyUpdatedPosts = computed(() => {
  if (!posts.value) return []
  const oneMonthAgo = subMonths(new Date(), 1)
  return [...posts.value]
    .filter((post) => {
      const metadata = post?.metadata || post
      return (
        !metadata?.hidden &&
        !metadata?.draft &&
        new Date(metadata?.lastUpdated || metadata?.date) > oneMonthAgo
      )
    })
    .sort((a, b) => {
      const metaA = a?.metadata || a
      const metaB = b?.metadata || b
      return (
        new Date(metaB?.lastUpdated || metaB?.date) -
        new Date(metaA?.lastUpdated || metaA?.date)
      )
    })
    .slice(0, 5)
})

const _blogPosts = computed(() => posts.value || [])

const _createPostMetadata = (post) => {
  const metadata = post?.metadata || {}
  return {
    title: post?.title || metadata?.title,
    slug: post?.slug || metadata?.slug,
    date: post?.date || metadata?.date,
    tags: post?.tags || metadata?.tags,
    draft: post?.draft || metadata?.draft,
    words: post?.words || metadata?.words,
    images: post?.images || metadata?.images,
    links: post?.links || metadata?.links,
    dek: post?.dek || metadata?.dek,
    metadata,
  }
}

// Blog description paragraph styling
const blogDescriptionClass =
  'font-serif text-base md:text-lg text-zinc-600 ' +
  'dark:text-zinc-400 mb-4 leading-[1.5]'

// Post dek paragraph styling
const postDekClass =
  'font-serif text-sm text-zinc-600 dark:text-zinc-400 ' +
  'mt-0.5 p-summary leading-[1.4]'
</script>

<style scoped>
.blog-title {
  @apply font-serif font-light mb-2.5 tracking-tight;
  @apply leading-[1.1];
  @apply text-3xl md:text-4xl lg:text-5xl;
}

.blog-grid {
  @apply relative px-4 md:px-6;
  @apply lg:grid lg:grid-cols-12 lg:gap-16 xl:gap-20;
}

.blog-main-column {
  @apply max-w-3xl;
  @apply lg:max-w-none lg:col-span-8 lg:min-w-0;
  @apply lg:pt-2 lg:pr-14 xl:pr-20;
}

.blog-sidebar {
  @apply mt-8 pt-4 border-t;
  @apply border-zinc-200 dark:border-zinc-800;
  @apply lg:mt-0 lg:pt-2 lg:border-t-0 lg:col-span-4;
  @apply lg:sticky lg:top-24 lg:min-w-[260px];
  @apply lg:pl-12 xl:pl-16;
}

.error-box {
  @apply rounded-lg border p-4;
  @apply border-red-300 bg-red-50 text-red-800;
  @apply dark:bg-red-950 dark:border-red-800 dark:text-red-200;
}
</style>
