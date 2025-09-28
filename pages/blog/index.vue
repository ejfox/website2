<!-- Blog Index - Tufte Style -->

<template>
  <div>
    <!-- Header with consistent metadata styling -->
    <header class="mb-4 relative">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-4xl mx-auto">
        <!-- Compact metadata bar matching blog posts -->
        <div class="border-b border-zinc-200 dark:border-zinc-800">
          <div
            class="font-mono text-xs text-zinc-500 px-4 md:px-6 py-1 uppercase tabular-nums flex items-center gap-2 overflow-x-auto tracking-wider"
          >
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">ENTRIES</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.length || 0
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
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
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
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
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">LINKS</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.reduce(
                  (acc, p) => acc + (p?.metadata?.links || p?.links || 0),
                  0
                ) || 0
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">IMAGES</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                posts?.reduce(
                  (acc, p) => acc + (p?.metadata?.images || p?.images || 0),
                  0
                ) || 0
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">YEARS</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                sortedYears?.length || 0
              }}</span>
            </span>
          </div>
        </div>

        <!-- Title section matching blog posts -->
        <div
          class="px-4 md:px-6"
          style="padding-top: 24px; padding-bottom: 16px"
        >
          <h1
            class="font-serif font-light text-4xl md:text-5xl lg:text-6xl mb-2"
            style="line-height: 1.15; letter-spacing: -0.025em"
          >
            Blog
          </h1>
          <p
            class="font-serif text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-4"
            style="line-height: 1.6"
          >
            Thoughts, projects, and explorations in technology, design, and
            making.
          </p>
        </div>

        <!-- Main content -->
        <div class="relative px-4 md:px-6 h-feed">
          <!-- Main column -->
          <section style="max-width: 65ch">
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
                <div
                  v-if="index === 0"
                  class="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mt-12 first:mt-0 mb-6"
                  style="line-height: 16px"
                >
                  {{ year }}
                </div>

                <article class="group mb-8 h-entry">
                  <!-- Main content -->
                  <div>
                    <h3>
                      <NuxtLink
                        :to="`/blog/${post?.slug}`"
                        class="font-serif text-xl md:text-2xl font-normal text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 p-name u-url transition-colors duration-200 tracking-tight"
                        style="line-height: 1.3"
                      >
                        {{ post?.title || formatTitle(post?.slug) }}
                      </NuxtLink>
                    </h3>

                    <!-- Horizontal metadata line with microvis -->
                    <div
                      class="font-mono text-xs text-zinc-400 dark:text-zinc-600 mt-1 uppercase tracking-wider tabular-nums flex items-center gap-1"
                    >
                      <span>{{
                        formatShortDate(post?.metadata?.date || post?.date)
                      }}</span>
                      <span class="mx-1 text-zinc-300 dark:text-zinc-700"
                        >·</span
                      >
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
                        class="flex items-center gap-1"
                      >
                        <span class="mx-1 text-zinc-300 dark:text-zinc-700"
                          >·</span
                        >
                        <BlogSparkline
                          :value="post?.metadata?.words || post?.words || 0"
                          metric="words"
                          type="bars"
                        />
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
                        class="flex items-center gap-1"
                      >
                        <span class="mx-1 text-zinc-300 dark:text-zinc-700"
                          >·</span
                        >
                        <BlogSparkline
                          :value="post?.metadata?.images || post?.images || 0"
                          metric="images"
                          type="dots"
                        />
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
                        class="flex items-center gap-1"
                      >
                        <span class="mx-1 text-zinc-300 dark:text-zinc-700"
                          >·</span
                        >
                        <BlogSparkline
                          :value="post?.metadata?.links || post?.links || 0"
                          metric="links"
                          type="bars"
                        />
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
                      class="font-serif text-sm text-zinc-600 dark:text-zinc-400 mt-1 p-summary leading-5"
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
            class="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800"
            style="max-width: 65ch"
          >
            <!-- Data stats footer -->
            <div
              class="font-mono text-xs text-zinc-400 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 tabular-nums"
            >
              <div>
                <span class="text-zinc-500">TTL_READ</span>
                <br />
                <span
                  >{{
                    Math.ceil(
                      (posts?.reduce(
                        (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                        0
                      ) || 0) / 200
                    )
                  }}min</span
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Week Notes -->
              <section v-if="sortedWeekNotes.length">
                <h2
                  class="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Week Notes
                  <span
                    class="font-mono text-xs text-zinc-400 normal-case tracking-normal"
                    >[{{ sortedWeekNotes.length }}]</span
                  >
                </h2>
                <div class="space-y-2">
                  <article
                    v-for="weekNote in sortedWeekNotes"
                    :key="weekNote.slug"
                    class="group"
                  >
                    <NuxtLink :to="`/blog/${weekNote.slug}`" class="block">
                      <div
                        class="font-serif text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                      >
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
                <h2
                  class="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Recently Updated
                  <span
                    class="font-mono text-xs text-zinc-400 normal-case tracking-normal"
                    >[{{ recentlyUpdatedPosts.length }}]</span
                  >
                </h2>
                <div class="space-y-2">
                  <article
                    v-for="post in recentlyUpdatedPosts"
                    :key="post.slug"
                    class="group"
                  >
                    <NuxtLink :to="`/blog/${post.slug}`" class="block">
                      <div
                        class="font-serif text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                      >
                        {{ post.title }}
                      </div>
                      <div class="font-mono text-xs text-zinc-500">
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
import { formatDistanceToNow, subMonths, startOfWeek } from 'date-fns'

const processedMarkdown = useProcessedMarkdown()
const now = new Date()

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
const formatFileSize = (chars) => {
  if (!chars) return '0KB'
  const kb = chars / 1024
  return kb < 1 ? '<1KB' : `${kb.toFixed(1)}KB`
}

const formatShortDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getPostYear = (post) => {
  const postDate = post?.date || post?.metadata?.date
  if (!postDate) return 'Unknown'
  return new Date(postDate).getFullYear()
}

const isWeekNote = (post) => {
  const slug = post?.slug || ''
  const type = post?.type || post?.metadata?.type
  const lastPart = slug.split('/').pop()
  return (
    type === 'weekNote' ||
    slug.startsWith('week-notes/') ||
    /^\d{4}-\d{2}$/.test(lastPart)
  )
}

const isValidPost = (post, includeWeekNotes = false) => {
  const isHidden = post?.hidden === true || post?.metadata?.hidden === true
  const isDraft = post?.draft === true || post?.metadata?.draft === true
  const postDate = post?.date || post?.metadata?.date
  const isFuturePost = postDate && new Date(postDate) > now
  const weekNote = isWeekNote(post)

  if (includeWeekNotes)
    return weekNote && !isHidden && !isDraft && !isFuturePost

  const isRegularBlogPost = /^(blog\/)?\d{4}\/[^/]+$/.test(post?.slug || '')
  return (
    !weekNote && isRegularBlogPost && !isHidden && !isDraft && !isFuturePost
  )
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

useHead({
  title: 'Blog',
  meta: [{ name: 'description', content: 'Blog posts and week notes' }]
})

// Computed data for sparklines
const postCountByYear = computed(() => {
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
        note?.slug &&
        (note?.dek || note?.metadata?.dek) &&
        !note?.hidden &&
        !note?.metadata?.hidden
    )
    .sort((a, b) => b.actualDate - a.actualDate)
    .slice(0, 5)
})

const blogPostsByYear = computed(() => {
  if (!posts.value?.length) return {}

  const grouped = {}
  posts.value.forEach((post) => {
    const postDate = post?.date || post?.metadata?.date
    if (!postDate) return
    const date = new Date(postDate)
    if (isNaN(date.getTime())) return
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

const sortedYears = computed(() =>
  Object.keys(blogPostsByYear.value).sort((a, b) => b - a)
)

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

const blogPosts = computed(() => posts.value || [])

const createPostMetadata = (post) => {
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
</script>

<style scoped>
/* Pure Tufte - minimal CSS */
</style>
