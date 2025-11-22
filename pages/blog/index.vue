<!-- Blog Index - Tufte Style -->

<template>
  <div>
    <!-- Header with consistent metadata styling -->
    <header class="mb-6 relative">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-screen-xl mx-auto px-4 md:px-8">
        <!-- Compact metadata bar matching blog posts -->
        <div>
          <div class="metadata-bar mb-3">
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">ENTRIES</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.length || 0
              }}</span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">WORDS</span>
              <span class="text-zinc-600 dark:text-zinc-300"
                >{{
                  Math.floor(
                    (posts?.reduce(
                      (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                      0
                    ) || 0) / 1000
                  )
                }}K</span
              >
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">READ</span>
              <span class="text-zinc-600 dark:text-zinc-300"
                >{{
                  Math.floor(
                    (posts?.reduce(
                      (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                      0
                    ) || 0) /
                      200 /
                      60
                  )
                }}hr</span
              >
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">LINKS</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.reduce(
                  (acc, p) => acc + (p?.metadata?.links || p?.links || 0),
                  0
                ) || 0
              }}</span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">IMAGES</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.reduce(
                  (acc, p) => acc + (p?.metadata?.images || p?.images || 0),
                  0
                ) || 0
              }}</span>
            </span>
            <span class="mx-1 text-divider">·</span>
            <span class="flex-gap-1 whitespace-nowrap">
              <span class="text-zinc-400">YEARS</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                sortedYears?.length || 0
              }}</span>
            </span>
          </div>
        </div>

        <!-- Title section matching blog posts -->
        <div class="px-4 md:px-6 pt-4 pb-3">
          <h1
            class="font-serif font-light text-3xl md:text-4xl lg:text-5xl mb-1.5 leading-[1.1] tracking-tight"
          >
            Blog
          </h1>
          <p :class="blogDescriptionClass">
            Thoughts, projects, and explorations in technology, design, and
            making.
          </p>
        </div>

        <!-- Main content -->
        <div
          class="relative px-4 md:px-6 h-feed lg:grid lg:grid-cols-12 lg:gap-16 xl:gap-20"
        >
          <!-- Main column -->
          <section
            class="max-w-3xl lg:max-w-none lg:col-span-8 lg:pr-14 xl:pr-20 lg:min-w-0 lg:pt-2"
          >
            <div v-if="!sortedYears.length" class="text-center py-8">
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
                    <h3>
                      <NuxtLink
                        :to="`/blog/${post?.slug}`"
                        class="title-link leading-[1.2]"
                      >
                        {{ post?.title || formatTitle(post?.slug) }}
                      </NuxtLink>
                    </h3>

                    <!-- Horizontal metadata line with microvis -->
                    <div class="post-metadata">
                      <span>{{
                        formatShortDate(post?.metadata?.date || post?.date)
                      }}</span>
                      <span class="mx-1 text-divider">·</span>
                      <span
                        >{{
                          calculateReadingTime(
                            post?.metadata?.words || post?.words
                          )
                        }}min</span
                      >

                      <!-- Word count with sparkline -->
                      <span
                        v-if="post?.metadata?.words || post?.words"
                        class="flex-gap-1"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.words || post?.words || 0"
                            metric="words"
                            type="bars"
                          />
                        </ClientOnly>
                        <span
                          >{{
                            formatNumber(
                              post?.metadata?.words || post?.words || 0
                            )
                          }}
                          words</span
                        >
                      </span>

                      <!-- Images sparkline -->
                      <span
                        v-if="(post?.metadata?.images || post?.images || 0) > 0"
                        class="flex-gap-1"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.images || post?.images || 0"
                            metric="images"
                            type="dots"
                          />
                        </ClientOnly>
                        <span
                          >{{
                            post?.metadata?.images || post?.images
                          }}
                          images</span
                        >
                      </span>

                      <!-- Links sparkline -->
                      <span
                        v-if="(post?.metadata?.links || post?.links || 0) > 0"
                        class="flex-gap-1"
                      >
                        <span class="mx-1 text-divider">·</span>
                        <ClientOnly>
                          <BlogSparkline
                            :value="post?.metadata?.links || post?.links || 0"
                            metric="links"
                            type="bars"
                          />
                        </ClientOnly>
                        <span
                          >{{
                            post?.metadata?.links || post?.links
                          }}
                          links</span
                        >
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
          <aside
            class="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 lg:mt-0 lg:pt-2 lg:border-t-0 lg:pl-12 xl:pl-16 lg:col-span-4 lg:min-w-[260px] lg:sticky lg:top-24"
          >
            <!-- Data stats footer -->
            <div class="data-footer">
              <div>
                <span class="text-zinc-500">TTL_WORDS</span>
                <br />
                <span
                  >{{
                    Math.floor(
                      (posts?.reduce(
                        (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                        0
                      ) || 0) / 1000
                    )
                  }}k</span
                >
              </div>
              <div>
                <span class="text-zinc-500">AVG_POST</span>
                <br />
                <span
                  >{{
                    posts?.length
                      ? Math.floor(
                          posts.reduce(
                            (acc, p) =>
                              acc + (p?.metadata?.words || p?.words || 0),
                            0
                          ) / posts.length
                        )
                      : 0
                  }}w</span
                >
              </div>
              <div>
                <span class="text-zinc-500">MEDIA</span>
                <br />
                <span
                  >{{
                    posts?.reduce(
                      (acc, p) => acc + (p?.metadata?.images || p?.images || 0),
                      0
                    ) || 0
                  }}img</span
                >
              </div>
            </div>
            <div class="mt-8 space-y-8">
              <!-- Week Notes -->
              <section v-if="sortedWeekNotes.length">
                <h2 class="section-header-xs">
                  Week Notes
                  <span
                    class="mono-xs text-zinc-400 normal-case tracking-normal"
                    >[{{ sortedWeekNotes.length }}]</span
                  >
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
                    >[{{ recentlyUpdatedPosts.length }}]</span
                  >
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

const { data: posts } = useAsyncData('blog-posts', async () => {
  try {
    const result = await processedMarkdown.getAllPosts(false, false)
    return result.filter((post) => isValidPost(post)).map(processPost)
  } catch (err) {
    console.error('Error in blog index:', err)
    return []
  }
})

const { data: notes } = useAsyncData('week-notes', async () => {
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
          type: note?.type || note?.metadata?.type || 'weekNote'
        })) || []
    )
  } catch (err) {
    console.error('Error fetching week notes:', err)
    return []
  }
})

// Static description for SSR-safety
const defaultDescription =
  'Thoughts, projects, and explorations in technology, design, and making.'

useHead({
  title: 'Blog - EJ Fox',
  link: [{ rel: 'canonical', href: 'https://ejfox.com/blog' }]
})

useSeoMeta({
  description: defaultDescription,
  ogTitle: 'Blog - EJ Fox',
  ogDescription: defaultDescription,
  ogUrl: 'https://ejfox.com/blog',
  ogType: 'website',
  ogImage: 'https://ejfox.com/og-image.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Blog - EJ Fox',
  twitterDescription: defaultDescription,
  twitterImage: 'https://ejfox.com/og-image.png'
})

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
  // Get last 12 months of activity
  const months = {}
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${month.getFullYear()}-${month.getMonth()}`
    months[key] = 0
  }

  posts.value.forEach((post) => {
    const date = new Date(post?.metadata?.date || post?.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (months[key] !== undefined) {
      months[key]++
    }
  })

  return Object.values(months).reverse()
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
    metadata
  }
}

// Blog description paragraph styling
const blogDescriptionClass =
  'font-serif text-base md:text-lg text-zinc-600 ' +
  'dark:text-zinc-400 mb-3 leading-[1.5]'

// Post dek paragraph styling
const postDekClass =
  'font-serif text-sm text-zinc-600 dark:text-zinc-400 ' +
  'mt-0.5 p-summary leading-[1.4]'
</script>

<style scoped>
/* Pure Tufte - minimal CSS */
</style>
