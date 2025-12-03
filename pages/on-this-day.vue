<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <!-- Header -->
    <header class="mb-12">
      <h1 class="font-serif text-3xl mb-2">On This Day</h1>
      <p class="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
        {{ formattedDate }}
      </p>

      <!-- Date navigation -->
      <div class="flex gap-2 mt-4">
        <button class="nav-button" @click="changeDay(-1)">Previous</button>
        <button class="nav-button" @click="goToToday">Today</button>
        <button class="nav-button" @click="changeDay(1)">Next</button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="pending" class="text-zinc-500">Loading...</div>

    <!-- Empty state -->
    <div
      v-else-if="!data?.years?.length"
      class="text-zinc-500 dark:text-zinc-400"
    >
      Nothing happened on this day. Yet.
    </div>

    <!-- Timeline by year -->
    <div v-else class="space-y-8">
      <section v-for="yearData in data.years" :key="yearData.year">
        <!-- Year header -->
        <div class="year-header">
          <span class="font-mono text-lg font-bold">{{ yearData.year }}</span>
          <div class="h-px flex-grow bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-400">
            {{ yearsAgo(yearData.year) }}
          </span>
        </div>

        <!-- Dynamic rendering of all source types -->
        <div class="space-y-4">
          <!-- Posts -->
          <template v-if="yearData.posts?.length">
            <NuxtLink
              v-for="post in yearData.posts"
              :key="post.slug"
              :to="`/blog/${post.slug}`"
              class="card card-interactive"
            >
              <div class="flex items-start gap-3">
                <span class="text-zinc-400">{{ sourceIcons.posts }}</span>
                <div>
                  <h3 class="font-serif text-lg">{{ post.title }}</h3>
                  <p
                    v-if="post.dek"
                    class="text-sm text-zinc-600 dark:text-zinc-400 mt-1"
                  >
                    {{ post.dek }}
                  </p>
                </div>
              </div>
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

    <!-- Summary -->
    <footer v-if="summaryText" class="summary-footer">
      {{ summaryText }}
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Source type icons (easily extensible)
const sourceIcons: Record<string, string> = {
  posts: 'P',
  tweets: 'X',
  scrobbles: 'M',
  commits: 'G',
}

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
const { data, pending } = await useFetch('/api/on-this-day', {
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

// Navigation
const changeDay = (delta: number) => {
  const date = new Date(2024, currentMonth.value - 1, currentDay.value)
  date.setDate(date.getDate() + delta)
  currentMonth.value = date.getMonth() + 1
  currentDay.value = date.getDate()
  router.push({
    query: { month: currentMonth.value, day: currentDay.value },
  })
}

const goToToday = () => {
  const today = new Date()
  currentMonth.value = today.getMonth() + 1
  currentDay.value = today.getDate()
  router.push({ query: {} })
}

// SEO
usePageSeo({
  title: computed(() => `On This Day · ${formattedDate.value}`),
  description: computed(
    () =>
      summaryText.value ||
      `What happened on ${formattedDate.value} across blog posts, notes, and feeds.`
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
  url: `https://ejfox.com/on-this-day?month=${currentMonth.value}&day=${currentDay.value}`,
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
.nav-button {
  @apply px-3 py-1 text-sm rounded;
  @apply bg-zinc-100 dark:bg-zinc-800;
  @apply hover:bg-zinc-200 dark:hover:bg-zinc-700;
}

.year-header {
  @apply flex items-center gap-3 mb-4 py-2 z-10;
  @apply sticky top-0 bg-white dark:bg-zinc-950;
}

.card-interactive {
  @apply block p-4 rounded-lg border transition-colors;
  @apply bg-zinc-50 dark:bg-zinc-900;
  @apply border-zinc-200 dark:border-zinc-800;
  @apply hover:border-zinc-400 dark:hover:border-zinc-600;
}

.summary-footer {
  @apply mt-12 pt-6 border-t text-sm;
  @apply text-zinc-500;
  @apply border-zinc-200 dark:border-zinc-800;
}
</style>
