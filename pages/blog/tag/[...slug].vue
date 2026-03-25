<!-- Blog Tag Page -->

<template>
  <div>
    <!-- Header with tag info -->
    <header class="mb-4 relative pt-8">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-4xl mx-auto">
        <!-- Tag title -->
        <div class="px-4 md:px-8 xl:px-16 mb-4">
          <h1 :class="tagPageTitleClass">Posts tagged "{{ tag }}"</h1>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm">
            {{ filteredPosts.length }}
            {{ filteredPosts.length === 1 ? 'post' : 'posts' }} found
          </p>
        </div>

        <!-- Compact metadata bar matching blog posts -->
        <div class="border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex flex-wrap items-center gap-1 px-4 py-2 font-mono text-3xs text-zinc-500 uppercase tracking-wider">
            <span class="flex items-center gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">ENTRIES</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ filteredPosts?.length || 0 }}
              </span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">WORDS</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{
                  Math.floor(
                    (filteredPosts?.reduce(
                      (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                      0
                    ) || 0) / 1000
                  )
                }}K
              </span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">READ</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{
                  Math.floor(
                    (filteredPosts?.reduce(
                      (acc, p) => acc + (p?.metadata?.words || p?.words || 0),
                      0
                    ) || 0) /
                      200 /
                      60
                  )
                }}hr
              </span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span v-if="tagScraps?.length" class="flex items-center gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">SCRAPS</span>
              <span class="text-zinc-600 dark:text-zinc-300">
                {{ tagScraps.length }}
              </span>
            </span>
            <template v-if="tagScraps?.length">
              <span class="mx-1 text-zinc-300 dark:text-zinc-700">&middot;</span>
            </template>
            <span class="flex items-center gap-0.5 whitespace-nowrap">
              <span class="text-zinc-400">TAG</span>
              <span class="text-zinc-600 dark:text-zinc-300 lowercase">
                {{ tag }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main class="max-w-4xl mx-auto px-4 md:px-6">
      <!-- Posts listing -->
      <div v-if="filteredPosts && filteredPosts.length > 0" class="space-y-8">
        <template v-for="(post, index) in filteredPosts" :key="post.slug">
          <div
            v-if="shouldShowYearHeader(post, index)"
            class="section-header-mono"
            style="line-height: 16px"
          >
            {{ getPostYear(post) }}
          </div>

          <article class="group mb-8 h-entry">
            <!-- Main content -->
            <div>
              <h3>
                <NuxtLink
                  :to="`/blog/${post?.slug}`"
                  class="title-link"
                  style="line-height: 1.3"
                >
                  {{ post?.title || formatTitle(post?.slug) }}
                </NuxtLink>
              </h3>

              <!-- Horizontal metadata line -->
              <div class="post-metadata">
                <span>
                  {{ formatShortDate(post?.metadata?.date || post?.date) }}
                </span>
                <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
                <span>
                  {{
                    calculateReadingTime(post?.metadata?.words || post?.words)
                  }}min
                </span>

                <!-- Word count -->
                <span
                  v-if="post?.metadata?.words || post?.words"
                  class="flex items-center gap-0.5"
                >
                  <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    {{
                      (
                        post?.metadata?.words ||
                        post?.words ||
                        0
                      ).toLocaleString()
                    }}
                    words
                  </span>
                </span>
              </div>

              <!-- Summary if available -->
              <div
                v-if="post?.metadata?.summary || post?.summary"
                :class="postSummaryClass"
              >
                {{ post?.metadata?.summary || post?.summary }}
              </div>

              <!-- Tags -->
              <div
                v-if="(post?.tags || post?.metadata?.tags)?.length"
                class="flex flex-wrap gap-2 mt-4"
              >
                <a
                  v-for="postTag in post?.tags || post?.metadata?.tags"
                  :key="postTag"
                  :href="`/blog/tag/${postTag}`"
                  class="tag-small"
                  :class="postTag === tag ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
                >
                  {{ postTag }}
                </a>
              </div>
            </div>
          </article>
        </template>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <p class="text-zinc-600 dark:text-zinc-400 mb-4">
          No posts found with the tag "{{ tag }}"
        </p>
        <NuxtLink to="/blog" class="link-blue">← Back to all posts</NuxtLink>
      </div>

      <!-- Scraps matching this tag -->
      <div v-if="tagScraps?.length" class="mt-8 pt-6">
        <div
          class="section-header-mono mb-3"
          style="line-height: 16px"
        >
          Scraps <span class="text-zinc-400 dark:text-zinc-600 tabular-nums">{{ tagScraps.length }}</span>
        </div>
        <div class="space-y-2">
          <a
            v-for="(scrap, i) in tagScraps"
            :key="i"
            :href="scrap.url || undefined"
            :target="scrap.url ? '_blank' : undefined"
            rel="noopener noreferrer"
            class="block"
          >
            <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1" style="line-height: 1.3">
              {{ scrap.title }}
            </div>
            <div v-if="scrap.hostname" class="post-metadata">
              <span>{{ scrap.hostname }}</span>
              <template v-if="scrap.created_at">
                <span class="mx-1 text-zinc-300 dark:text-zinc-700">&middot;</span>
                <span>{{ formatScrapDate(scrap.created_at) }}</span>
              </template>
            </div>
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns'

const { formatShortDate } = useDateFormat()
const route = useRoute()
const processedMarkdown = useProcessedMarkdown()

// Get tag from URL
const tag = computed(() => {
  const slugArray = route.params.slug
  return Array.isArray(slugArray) ? slugArray.join('/') : slugArray
})

// Set page title
const pageTitle = computed(() => `Posts tagged "${tag.value}" | EJ Fox`)
const pageDescription = computed(
  () => `All blog posts tagged with "${tag.value}"`
)

// Helper functions (copied from blog index)
const formatTitle = (slug) => {
  if (!slug) return ''
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const isValidPost = (post) => {
  const isDraft = post?.draft || post?.metadata?.draft
  const isHidden = post?.hidden || post?.metadata?.hidden
  return post && post.slug && !isDraft && !isHidden
}

const processPost = (post) => {
  const title = post.title || post?.metadata?.title || formatTitle(post.slug)
  return { ...post, title, metadata: { ...post.metadata, title } }
}

// Fetch all posts and filter by tag
const { data: allPosts } = useAsyncData('all-posts-for-tag', async () => {
  try {
    const result = await processedMarkdown.getAllPosts(false, false)
    return result.filter((post) => isValidPost(post)).map(processPost)
  } catch (err) {
    console.error('Error fetching posts for tag:', err)
    return []
  }
})

// Fetch scraps matching this tag
const { data: tagScraps } = useFetch('/api/scraps/by-tags', {
  query: { tags: tag, limit: 12 },
  watch: [tag],
  lazy: true,
  server: false,
})

const formatScrapDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

// Filter posts by tag
const filteredPosts = computed(() => {
  if (!allPosts.value || !tag.value) return []

  return allPosts.value
    .filter((post) => {
      const postTags = post?.tags || post?.metadata?.tags || []
      return postTags.includes(tag.value)
    })
    .sort((a, b) => {
      // Sort by date, newest first
      const dateA = new Date(a?.metadata?.date || a?.date || 0)
      const dateB = new Date(b?.metadata?.date || b?.date || 0)
      return dateB - dateA
    })
})

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  type: 'article',
  section: 'Writing',
  tags: computed(() => [tag.value]),
  label1: 'Posts',
  data1: computed(() => `${filteredPosts.value.length} tagged`),
  label2: 'Topic',
  data2: computed(() => tag.value),
})

// Helper functions for display
const calculateReadingTime = (words) => {
  if (!words) return 0
  return Math.max(1, Math.round(words / 200))
}

const getPostYear = (post) => {
  const date = new Date(post?.metadata?.date || post?.date || 0)
  return date.getFullYear()
}

const shouldShowYearHeader = (post, index) => {
  if (index === 0) return true
  const currentYear = getPostYear(post)
  const previousYear = getPostYear(filteredPosts.value[index - 1])
  return currentYear !== previousYear
}

// Tag page title styling
const tagPageTitleClass =
  'font-serif text-3xl font-normal text-zinc-900 dark:text-zinc-100 mb-2'

// Post summary styling
const postSummaryClass =
  'mt-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed'
</script>
