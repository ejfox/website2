<template>
  <div class="max-w-2xl mx-auto px-4 pt-16 pb-24">
    <!-- Header -->
    <header class="mb-12">
      <h1 class="font-serif text-4xl">{{ formattedDate }}</h1>
      <p
        v-if="summaryText"
        class="mt-3 text-zinc-600 dark:text-zinc-400"
      >
        {{ summaryText }}
      </p>
    </header>

    <!-- Loading -->
    <div v-if="pending" class="text-zinc-400 text-sm">Loading...</div>

    <!-- Error state -->
    <div v-else-if="error" class="text-red-600 dark:text-red-400 text-sm">
      Error loading data for this day.
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!data?.years?.length"
      class="text-zinc-500 dark:text-zinc-400"
    >
      Nothing happened on this day. Yet.
    </div>

    <!-- Timeline by year -->
    <div v-else class="space-y-12">
      <section v-for="yearData in data.years" :key="yearData.year">
        <!-- Year header -->
        <div class="flex items-baseline gap-3 mb-6">
          <span class="font-mono text-sm text-zinc-400">{{ yearData.year }}</span>
          <span class="text-xs text-zinc-400">{{ yearsAgo(yearData.year) }}</span>
        </div>

        <!-- Entries -->
        <div class="space-y-6">
          <!-- Posts -->
          <template v-if="yearData.posts?.length">
            <NuxtLink
              v-for="post in yearData.posts"
              :key="post.slug"
              :to="`/blog/${post.slug}`"
              class="block group"
            >
              <h3 class="font-serif text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ post.title }}
              </h3>
              <p
                v-if="post.dek"
                class="text-sm text-zinc-500 dark:text-zinc-500 mt-1"
              >
                {{ post.dek }}
              </p>
            </NuxtLink>
          </template>

          <!-- Commits -->
          <template v-if="yearData.commits?.length">
            <CommitCard
              v-for="commit in yearData.commits"
              :key="commit.sha"
              :sha="commit.sha"
              :message="commit.message"
              :repo="commit.repo"
              :date="commit.date"
            />
          </template>

          <!-- Tweets -->
          <template v-if="yearData.tweets?.length">
            <TweetCard
              v-for="tweet in yearData.tweets"
              :id="tweet.id"
              :key="tweet.id"
              :text="tweet.text"
              :date="tweet.date"
              :reply-to="tweet.replyTo"
              :favorites="tweet.favorites"
              :retweets="tweet.retweets"
            />
          </template>

          <!-- Scrobbles -->
          <template v-if="yearData.scrobbles?.length">
            <ScrobbleCard
              v-for="scrobble in yearData.scrobbles"
              :key="scrobble.date"
              :count="scrobble.count"
              :top-tracks="scrobble.topTracks"
              :top-artists="scrobble.topArtists"
              :date="scrobble.date"
            />
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - API response types don't match page expectations
const route = useRoute()

// Source type labels for summary
const sourceLabels: Record<string, [string, string]> = {
  total_posts: ['post', 'posts'],
  total_tweets: ['tweet', 'tweets'],
  total_scrobbles: ['year of music', 'years of music'],
  total_commits: ['commit', 'commits'],
}

// Get month/day from query or use today
const now = new Date()
const currentMonth = ref(
  route.query.month ? Number(route.query.month) : now.getMonth() + 1
)
const currentDay = ref(
  route.query.day ? Number(route.query.day) : now.getDate()
)

// Fetch data
const { data, pending, error } = await useFetch('/api/on-this-day', {
  query: computed(() => ({
    month: currentMonth.value,
    day: currentDay.value,
  })),
})

// Formatted date display
const formattedDate = computed(() => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${months[currentMonth.value - 1]} ${currentDay.value}`
})

// Auto-generate summary from totals
const summaryText = computed(() => {
  if (!data.value) return ''
  const parts: string[] = []

  for (const [key, value] of Object.entries(data.value)) {
    const isTotal = key.startsWith('total_')
    const isNumber = typeof value === 'number'
    if (isTotal && isNumber && value > 0) {
      const labels = sourceLabels[key]
      if (labels) {
        parts.push(`${value} ${value === 1 ? labels[0] : labels[1]}`)
      }
    }
  }

  return parts.length ? `${parts.join(', ')} on this day` : ''
})

// Calculate years ago
const yearsAgo = (year: number) => {
  const diff = new Date().getFullYear() - year
  if (diff === 0) return 'this year'
  if (diff === 1) return '1 year ago'
  return `${diff} years ago`
}

// SEO
usePageSeo({
  title: computed(() => `On This Day · ${formattedDate.value}`),
  description: computed(
    () =>
      summaryText.value ||
      'What happened on ' +
        formattedDate.value +
        ' across blog posts, notes, and feeds.'
  ),
  type: 'website',
  section: 'Meta',
  tags: ['History', 'On this day', 'Journal', 'Archive'],
  label1: 'Date',
  data1: computed(() => formattedDate.value),
  label2: 'Highlights',
  data2: computed(() => summaryText.value || 'Loading entries...'),
})

const onThisDaySchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `On This Day · ${formattedDate.value}`,
  description:
    summaryText.value ||
    `Entries from ${formattedDate.value} across blog posts, notes, and feeds.`,
  url:
    'https://ejfox.com/on-this-day?month=' +
    currentMonth.value +
    '&day=' +
    currentDay.value,
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(onThisDaySchema.value),
    },
  ],
}))
</script>

<style scoped>
/* Minimal styles */
</style>
