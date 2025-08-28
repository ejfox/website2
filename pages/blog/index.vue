<!-- Blog Index - Swiss minimal design with optimized Vue 3 + anime.js -->

<template>
  <div>
    <!-- Header -->
    <header class="header">
      <h1 class="text-display mb-8">Blog</h1>
      <p class="text-body">
        Thoughts, projects, and explorations in technology, design, and making.
      </p>
    </header>

    <div class="max-w-screen-lg">
      <!-- Main Blog Posts -->
      <section class="mt-16 md:mt-0">
        <div v-if="!sortedYears.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">No blog posts found.</p>
        </div>

        <!-- Yearly blog posts -->
        <div v-for="year in sortedYears" :key="`blog-${year}`" class="mb-24">
          <h2 class="year-header">
            {{ year }}
          </h2>
          <div class="space-y-12">
            <article
              v-for="post in blogPostsByYear[year]"
              :key="post?.slug"
              class="group grid grid-cols-12 gap-4"
            >
              <div class="col-span-1 md:col-span-2 pl-2 md:pl-0">
                <PostMetadata
                  v-if="post"
                  :doc="createPostMetadata(post)"
                  :compact="true"
                  class="post-metadata text-xs"
                />
              </div>
              <div class="col-span-11 md:col-span-10">
                <h3 class="mb-2">
                  <NuxtLink :to="`/blog/${post?.slug}`" class="post-link">
                    {{ post?.title || formatTitle(post?.slug) }}
                  </NuxtLink>
                </h3>
                <p v-if="post?.metadata?.dek || post?.dek" class="post-dek">
                  {{ post?.metadata?.dek || post?.dek }}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Sidebar sections -->
      <aside class="sidebar">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- Week Notes -->
          <section>
            <h2 class="section-header">Week Notes</h2>
            <div v-if="!sortedWeekNotes.length" class="text-center py-8">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">
                No week notes found.
              </p>
            </div>
            <template v-else>
              <div class="space-y-6">
                <article
                  v-for="weekNote in sortedWeekNotes"
                  :key="weekNote.slug"
                >
                  <NuxtLink
                    :to="`/blog/${weekNote.slug}`"
                    class="block group week-note-link"
                  >
                    <div class="mb-1">
                      <span class="week-note-title">
                        Week {{ weekNote.slug.split('/')[1] }}
                      </span>
                    </div>
                    <p class="week-note-dek">
                      {{ weekNote.metadata?.dek || weekNote.dek }}
                    </p>
                  </NuxtLink>
                </article>
              </div>
              <div class="mt-8">
                <NuxtLink to="/blog/week-notes" class="view-all-link">
                  View all →
                </NuxtLink>
              </div>
            </template>
          </section>

          <!-- Recently Updated -->
          <section v-if="recentlyUpdatedPosts.length">
            <h2 class="section-header">Recently Updated</h2>
            <div class="space-y-6">
              <article
                v-for="post in recentlyUpdatedPosts"
                :key="`recent-${post.slug}`"
              >
                <NuxtLink :to="`/blog/${post.slug}`" class="block group">
                  <h3 class="recent-post-title">
                    {{ post?.metadata?.title || post?.title }}
                  </h3>
                  <div class="recent-post-date">
                    {{
                      formatRelativeTime(
                        post?.metadata?.lastUpdated ||
                          post?.metadata?.date ||
                          post?.lastUpdated ||
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
</template>

<script setup>
import { formatDistanceToNow, startOfWeek, subMonths } from 'date-fns'
import { computed, ref, onMounted } from 'vue'
// DELETED: All animation imports removed
import PostMetadata from '~/components/PostMetadata.vue'

const processedMarkdown = useProcessedMarkdown()
const now = new Date()

// Week note detection helper
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

// Post validation helper
const isValidPost = (post, includeWeekNotes = false) => {
  const isHidden = post?.hidden === true || post?.metadata?.hidden === true
  const isDraft = post?.draft === true || post?.metadata?.draft === true
  const postDate = post?.date || post?.metadata?.date
  const isFuturePost = postDate && new Date(postDate) > now
  const weekNote = isWeekNote(post)

  if (includeWeekNotes)
    return weekNote && !isHidden && !isDraft && !isFuturePost

  const isRegularBlogPost = /^\d{4}\/[^/]+$/.test(post?.slug || '')
  return (
    !weekNote && isRegularBlogPost && !isHidden && !isDraft && !isFuturePost
  )
}

// Process post with title fallback
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

const formatRelativeTime = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true })

useHead({
  title: 'Blog',
  meta: [{ name: 'description', content: 'Blog posts and week notes' }]
})

// Sort week notes with date conversion
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

  // Sort posts within each year (newest first)
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

// DELETED: All animation code removed for better performance

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

// Helper functions
const formatTitle = (slug) => {
  const baseName = slug.split('/').pop() || slug
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const createPostMetadata = (post) => {
  if (!post) return null
  const metadata = post?.metadata || {}
  return {
    slug: post?.slug || metadata?.slug,
    title: post?.title || metadata?.title,
    date: post?.date || metadata?.date,
    draft: post?.draft || metadata?.draft,
    wordCount: post?.wordCount || metadata?.words,
    imageCount: post?.imageCount || metadata?.images,
    linkCount: post?.linkCount || metadata?.links,
    dek: post?.dek || metadata?.dek,
    metadata
  }
}
</script>

<style scoped>
.header {
  @apply my-20 md:mt-6 pl-4 md:pl-0;
}

.year-header {
  @apply text-xs font-normal uppercase pl-2 md:pl-0 text-zinc-500 dark:text-zinc-500 mb-8;
  will-change: transform, opacity;
}

.post-metadata {
  @apply text-xs text-zinc-500 dark:text-zinc-500;
}

.post-link {
  @apply text-lg text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors;
  position: relative;
}

.post-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: var(--link-width, 8px);
  height: 1px;
  background: currentColor;
  opacity: 0.1;
  transition: width 0.3s ease;
}

.post-dek {
  @apply text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pr-4 md:pr-8 xl:pr-16;
}

.sidebar {
  @apply mt-24 pt-12 border-t border-zinc-200 dark:border-zinc-800;
}

.section-header {
  @apply text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-8;
}

.week-note-link {
  position: relative;
}

.week-note-link::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 40%;
  background: currentColor;
  opacity: 0.15;
}

.week-note-title {
  @apply text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors;
}

.week-note-dek {
  @apply text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed;
}

.view-all-link {
  @apply text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors;
}

.recent-post-title {
  @apply text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors mb-1;
}

.recent-post-date {
  @apply text-sm text-zinc-500 dark:text-zinc-500;
}
</style>
