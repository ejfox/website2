<template>
  <div class="max-w-xl mx-auto px-4 pt-12 pb-24 font-serif">
    <!-- Header -->
    <header class="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <h1 class="text-2xl tracking-tight">{{ formattedDate }}</h1>
      <p v-if="summaryText" class="mt-1 text-sm text-zinc-500">
        {{ summaryText }}
      </p>
    </header>

    <!-- Loading -->
    <p v-if="pending" class="text-zinc-400 text-sm font-mono">loading...</p>

    <!-- Error state -->
    <p v-else-if="error" class="text-sm">Error loading data for this day.</p>

    <!-- Empty state -->
    <p v-else-if="!data?.years?.length" class="text-zinc-500 text-sm italic">
      Nothing recorded on this day.
    </p>

    <!-- Timeline by year -->
    <div v-else>
      <section v-for="yearData in data.years" :key="yearData.year" class="mb-8">
        <!-- Year header -->
        <h2
          class="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4"
        >
          {{ yearData.year }}
          <span class="text-zinc-300 dark:text-zinc-600">/</span>
          {{ yearsAgo(yearData.year) }}
        </h2>

        <!-- Entries -->
        <dl class="space-y-4">
          <!-- Posts -->
          <template v-if="yearData.posts?.length">
            <div v-for="post in yearData.posts" :key="post.slug">
              <dt class="text-xs font-mono text-zinc-400 mb-0.5">post</dt>
              <dd>
                <NuxtLink
                  :to="`/blog/${post.slug}`"
                  class="underline decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-500 underline-offset-2"
                >
                  {{ post.title }}
                </NuxtLink>
                <span
                  v-if="post.dek"
                  class="text-zinc-500 text-sm block mt-0.5"
                >
                  {{ post.dek }}
                </span>
              </dd>
            </div>
          </template>

          <!-- Commits -->
          <template v-if="yearData.commits?.length">
            <div v-for="commit in yearData.commits" :key="commit.sha">
              <dt class="text-xs font-mono text-zinc-400 mb-0.5">
                commit
                <span class="text-zinc-300 dark:text-zinc-600">/</span>
                {{ commit.repo }}
              </dt>
              <dd class="font-mono text-sm">
                <code class="text-zinc-400 text-xs">{{ commit.sha }}</code>
                {{ commit.message }}
              </dd>
            </div>
          </template>

          <!-- Tweets -->
          <template v-if="yearData.tweets?.length">
            <div v-for="tweet in yearData.tweets" :key="tweet.id">
              <dt class="text-xs font-mono text-zinc-400 mb-0.5">
                tweet
                <template v-if="tweet.replyTo">
                  <span class="text-zinc-300 dark:text-zinc-600">/</span>
                  re: @{{ tweet.replyTo }}
                </template>
              </dt>
              <dd class="text-sm leading-relaxed whitespace-pre-wrap">
                {{ tweet.text }}
              </dd>
              <dd
                v-if="tweet.favorites > 0 || tweet.retweets > 0"
                class="text-xs font-mono text-zinc-400 mt-1"
              >
                <span v-if="tweet.retweets > 0">{{ tweet.retweets }} rt</span>
                <span v-if="tweet.retweets > 0 && tweet.favorites > 0">/</span>
                <span v-if="tweet.favorites > 0">
                  {{ tweet.favorites }} fav
                </span>
              </dd>
            </div>
          </template>

          <!-- Scrobbles -->
          <template v-if="yearData.scrobbles?.length">
            <div v-for="scrobble in yearData.scrobbles" :key="scrobble.date">
              <dt class="text-xs font-mono text-zinc-400 mb-0.5">
                music
                <span class="text-zinc-300 dark:text-zinc-600">/</span>
                {{ scrobble.count }} scrobbles
              </dt>
              <dd class="text-sm">
                <span v-if="scrobble.topArtists?.length" class="text-zinc-500">
                  {{ scrobble.topArtists.slice(0, 3).join(', ') }}
                </span>
              </dd>
              <dd
                v-if="scrobble.topTracks?.length"
                class="text-xs text-zinc-400 mt-1 font-mono"
              >
                <span
                  v-for="(track, i) in scrobble.topTracks.slice(0, 3)"
                  :key="track"
                >
                  {{ i + 1 }}. {{ track }}
                  <template
                    v-if="i < Math.min(scrobble.topTracks.length, 3) - 1"
                  >
                    ,
                  </template>
                </span>
              </dd>
            </div>
          </template>
        </dl>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  slug: string
  title: string
  dek?: string
}

interface Commit {
  sha: string
  repo: string
  message: string
}

interface Tweet {
  id: string
  text: string
  replyTo?: string
  favorites: number
  retweets: number
}

interface Scrobble {
  date: string
  count: number
  topArtists?: string[]
  topTracks?: string[]
}

interface YearData {
  year: number
  posts?: Post[]
  commits?: Commit[]
  tweets?: Tweet[]
  scrobbles?: Scrobble[]
}

interface OnThisDayResponse {
  month: number
  day: number
  key: string
  years: YearData[]
  [key: string]: unknown // For total_* dynamic keys
}

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
const { data, pending, error } = await useFetch<OnThisDayResponse>(
  '/api/on-this-day',
  {
    query: computed(() => ({
      month: currentMonth.value,
      day: currentDay.value,
    })),
  }
)

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
