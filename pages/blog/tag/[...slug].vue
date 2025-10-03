<!-- Blog Tag Page -->

<template>
  <div>
    <!-- Header with tag info -->
    <header class="mb-4 relative">
      <!-- Swiss Grid Container matching blog posts -->
      <div class="max-w-4xl mx-auto">
        <!-- Tag title -->
        <div class="px-4 md:px-6 mb-4">
          <h1 class="font-serif text-3xl font-normal text-zinc-900 dark:text-zinc-100 mb-2">
            Posts tagged "{{ tag }}"
          </h1>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm">
            {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'post' : 'posts' }} found
          </p>
        </div>

        <!-- Compact metadata bar matching blog posts -->
        <div class="border-b border-zinc-200 dark:border-zinc-800">
          <div
            class="font-mono text-xs text-zinc-500 px-4 md:px-6 py-1 uppercase tabular-nums flex items-center gap-2 overflow-x-auto tracking-wider"
          >
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">ENTRIES</span>
              <span class="text-zinc-600 dark:text-zinc-300">{{
                filteredPosts?.length || 0
              }}</span>
            </span>
            <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
            <span class="flex items-center gap-1 whitespace-nowrap">
              <span class="text-zinc-400">WORDS</span>
              <span class="text-zinc-600 dark:text-zinc-300"
                >{{
                  Math.floor(
                    (filteredPosts?.reduce(
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
                    (filteredPosts?.reduce(
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
              <span class="text-zinc-400">TAG</span>
              <span class="text-zinc-600 dark:text-zinc-300 lowercase">{{ tag }}</span>
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
            class="font-mono text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-wider font-semibold mt-8 mb-4 first:mt-0"
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
                  class="font-serif text-xl md:text-2xl font-normal text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 p-name u-url transition-colors duration-200 tracking-tight"
                  style="line-height: 1.3"
                >
                  {{ post?.title || formatTitle(post?.slug) }}
                </NuxtLink>
              </h3>

              <!-- Horizontal metadata line -->
              <div
                class="font-mono text-xs text-zinc-400 dark:text-zinc-600 mt-1 uppercase tracking-wider tabular-nums flex items-center gap-1"
              >
                <span>{{
                  formatShortDate(post?.metadata?.date || post?.date)
                }}</span>
                <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
                <span
                  >{{
                    calculateReadingTime(
                      post?.metadata?.words || post?.words
                    )
                  }}min</span
                >

                <!-- Word count -->
                <span
                  v-if="post?.metadata?.words || post?.words"
                  class="flex items-center gap-1"
                >
                  <span class="mx-1 text-zinc-300 dark:text-zinc-700">·</span>
                  <span
                    >{{ (post?.metadata?.words || post?.words || 0).toLocaleString() }} words</span
                  >
                </span>
              </div>

              <!-- Summary if available -->
              <div
                v-if="post?.metadata?.summary || post?.summary"
                class="mt-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed"
              >
                {{ post?.metadata?.summary || post?.summary }}
              </div>

              <!-- Tags -->
              <div
                v-if="(post?.tags || post?.metadata?.tags)?.length"
                class="flex flex-wrap gap-2 mt-3"
              >
                <a
                  v-for="postTag in post?.tags || post?.metadata?.tags"
                  :key="postTag"
                  :href="`/blog/tag/${postTag}`"
                  class="px-2 py-1 text-xs font-mono uppercase tracking-[0.2em] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors no-underline"
                  :class="postTag === tag ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
                  >{{ postTag }}</a
                >
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
        <NuxtLink
          to="/blog"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          ← Back to all posts
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
const route = useRoute()
const processedMarkdown = useProcessedMarkdown()

// Get tag from URL
const tag = computed(() => {
  const slugArray = route.params.slug
  return Array.isArray(slugArray) ? slugArray.join('/') : slugArray
})

// Set page title
useHead({
  title: computed(() => `Posts tagged "${tag.value}" | EJ Fox`),
  meta: [
    {
      name: 'description',
      content: computed(() => `All blog posts tagged with "${tag.value}"`),
    },
  ],
})

// Helper functions (copied from blog index)
const formatTitle = (slug) => {
  if (!slug) return ''
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const isValidPost = (post) => {
  return post && post.slug && !post.draft
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

// Filter posts by tag
const filteredPosts = computed(() => {
  if (!allPosts.value || !tag.value) return []

  return allPosts.value.filter((post) => {
    const postTags = post?.tags || post?.metadata?.tags || []
    return postTags.includes(tag.value)
  }).sort((a, b) => {
    // Sort by date, newest first
    const dateA = new Date(a?.metadata?.date || a?.date || 0)
    const dateB = new Date(b?.metadata?.date || b?.date || 0)
    return dateB - dateA
  })
})

// Helper functions for date formatting and display
const formatShortDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

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
</script>