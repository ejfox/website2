<script setup>
// Fetch live "now" data from all APIs
const {
  data: stats,
  pending: statsPending,
  error: statsError,
} = await useFetch('/api/stats')
const { data: reading, error: readingError } = await useFetch('/api/reading')
const { data: predictions, error: predictionsError } =
  await useFetch('/api/predictions')

// Process data for "now" view
const now = computed(() => {
  // Guard against accessing data while still loading
  if (!stats.value) return null

  const result = {
    timestamp: new Date().toISOString(),
  }

  // Most recent track
  if (stats.value?.lastfm?.recentTracks?.[0]) {
    const track = stats.value.lastfm.recentTracks[0]
    result.music = {
      track: track.name,
      artist: track.artist?.['#text'] || track.artist,
      playedAt: track['@attr']?.nowplaying === 'true' ? 'now' : track.date?.uts,
      url: track.url,
      image: track.image?.find((i) => i.size === 'large')?.['#text'],
    }
  }

  // Most recent commit
  if (stats.value?.github?.detail?.commits?.[0]) {
    const commit = stats.value.github.detail.commits[0]
    result.code = {
      message: commit.message,
      repo: commit.repository?.name,
      timestamp: commit.occurredAt,
      url: commit.url,
    }
  }

  // Currently reading
  if (reading.value) {
    const currentlyReading = reading.value
      .filter((b) => b.metadata?.['kindle-sync']?.lastAnnotatedDate)
      .sort((a, b) => {
        const dateA = new Date(
          a.metadata?.['kindle-sync']?.lastAnnotatedDate || 0
        )
        const dateB = new Date(
          b.metadata?.['kindle-sync']?.lastAnnotatedDate || 0
        )
        return dateB - dateA
      })[0]

    if (currentlyReading?.metadata?.['kindle-sync']) {
      result.reading = {
        title: currentlyReading.metadata['kindle-sync'].title,
        author: currentlyReading.metadata['kindle-sync'].author,
        lastAnnotated:
          currentlyReading.metadata['kindle-sync'].lastAnnotatedDate,
        cover: currentlyReading.metadata['kindle-sync'].bookImageUrl,
        slug: currentlyReading.slug,
      }
    }
  }

  // Most recent prediction update
  if (predictions.value) {
    const recent = predictions.value
      .filter((p) => p.updates && p.updates.length > 0)
      .map((p) => ({
        statement: p.statement,
        confidence: p.confidence,
        lastUpdate: p.updates[p.updates.length - 1],
        slug: p.slug,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.lastUpdate.timestamp)
        const dateB = new Date(b.lastUpdate.timestamp)
        return dateB - dateA
      })[0]

    if (recent) {
      result.thinking = {
        statement: recent.statement,
        confidence: recent.confidence,
        reasoning: recent.lastUpdate.reasoning,
        timestamp: recent.lastUpdate.timestamp,
        slug: recent.slug,
      }
    }
  }

  // Chess rating
  if (stats.value?.chess?.currentRating) {
    result.chess = {
      blitz: stats.value.chess.currentRating.blitz,
    }
  }

  // Goodreads currently reading
  if (stats.value?.goodreads?.currentlyReading?.length) {
    const book = stats.value.goodreads.currentlyReading[0]
    result.goodreads = {
      title: book.title,
      author: book.author,
      cover: book.imageUrl,
      url: book.goodreadsUrl,
      numPages: book.numPages,
      totalReading: stats.value.goodreads.currentlyReading.length,
    }
  }

  // Duolingo streak
  if (stats.value?.duolingo?.streak > 0) {
    result.duolingo = {
      streak: stats.value.duolingo.streak,
      currentCourse: stats.value.duolingo.currentCourse?.title,
      totalXp: stats.value.duolingo.totalXp,
    }
  }

  // MonkeyType typing speed
  if (stats.value?.monkeyType?.typingStats) {
    const typing = stats.value.monkeyType.typingStats
    result.typing = {
      averageWpm: Math.round(typing.averageWpm),
      bestWpm: Math.round(typing.bestWPM),
      testsCompleted: typing.testsCompleted,
    }
  }

  // LeetCode recent problem
  if (stats.value?.leetcode?.recentSubmissions?.[0]) {
    const recent = stats.value.leetcode.recentSubmissions.find(
      (s) => s.statusDisplay === 'Accepted'
    )
    if (recent) {
      const submissionStats = stats.value.leetcode.submissionStats
      const totalSolved = submissionStats
        ? (submissionStats.easy?.count || 0) +
          (submissionStats.medium?.count || 0) +
          (submissionStats.hard?.count || 0)
        : null
      result.leetcode = {
        title: recent.title,
        slug: recent.titleSlug,
        timestamp: Number(recent.timestamp),
        lang: recent.lang,
        totalSolved,
      }
    }
  }

  return result
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(
    typeof timestamp === 'string' ? timestamp : timestamp * 1000
  )
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const nowUpdated = new Date().toISOString().split('T')[0]

usePageSeo({
  title: 'Now · EJ Fox',
  description:
    'Live now page: current GitHub commits, Last.fm listening, Kindle reading, and prediction updates in one feed.',
  type: 'website',
  section: 'Meta',
  tags: ['Now page', 'Now playing', 'Reading', 'Live stats'],
  label1: 'Listening',
  data1: computed(() =>
    now.value?.music
      ? `${now.value.music.track} — ${now.value.music.artist}`
      : 'Loading current track...'
  ),
  label2: 'Latest commit',
  data2: computed(() =>
    now.value?.code?.repo
      ? `${now.value.code.repo}: ${now.value.code.message}`
      : 'Fetching activity...'
  ),
})
</script>

<template>
  <main class="px-4 md:px-8 xl:px-16 pt-8 max-w-2xl">
    <!-- Header -->
    <header class="mb-8">
      <div
        class="font-mono text-xs text-zinc-400 mb-2 uppercase tracking-wider"
      >
        NOW ·
        {{
          new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        }}
      </div>
      <h1
        class="font-serif text-3xl font-normal mb-2"
        style="letter-spacing: -0.02em"
      >
        Right Now
      </h1>
      <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
        What I'm doing, listening to, reading, and thinking about this very
        moment.
      </p>
      <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2">
        Updated {{ nowUpdated }} · sources: GitHub, Last.fm, Kindle, Goodreads,
        predictions
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="statsPending" class="space-y-6">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 w-24"></div>
        <div class="h-8 bg-zinc-100 dark:bg-zinc-900 rounded"></div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="statsError || readingError || predictionsError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <!-- Now Data -->
    <div v-else-if="now" class="space-y-6">
      <!-- Listening -->
      <section
        v-if="now.music"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">
          {{ now.music.playedAt === 'now' ? 'Listening' : 'Last Played' }}
          <span class="text-zinc-400 dark:text-zinc-600">
            ·
            {{
              now.music.playedAt === 'now'
                ? 'now'
                : formatTime(now.music.playedAt)
            }}
          </span>
        </div>
        <a
          v-if="now.music.url"
          :href="now.music.url"
          target="_blank"
          class="flex items-start gap-4 group"
        >
          <img
            v-if="now.music.image"
            :src="now.music.image"
            :alt="`Album art for ${now.music.track} by ${now.music.artist}`"
            class="w-16 h-16 rounded-sm flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="activity-title-lg truncate">
              {{ now.music.track }}
            </div>
            <div class="artist-text truncate">
              {{ now.music.artist }}
            </div>
          </div>
        </a>
      </section>

      <!-- Coding -->
      <section
        v-if="now.code"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">
          Last Commit
          <span class="text-zinc-400 dark:text-zinc-600">
            · {{ formatTime(now.code.timestamp) }}
          </span>
        </div>
        <a
          v-if="now.code.url"
          :href="now.code.url"
          target="_blank"
          class="block group"
        >
          <div class="font-mono text-xs text-zinc-600 dark:text-zinc-400 mb-2">
            {{ now.code.repo }}
          </div>
          <div class="activity-title-base">
            {{ now.code.message }}
          </div>
        </a>
      </section>

      <!-- Reading (Kindle) -->
      <section
        v-if="now.reading"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">
          Currently Reading
          <span class="text-zinc-400 dark:text-zinc-600">
            · annotated {{ formatTime(now.reading.lastAnnotated) }}
          </span>
        </div>
        <NuxtLink
          :to="`/reading/${now.reading.slug}`"
          class="flex items-start gap-4 group"
        >
          <img
            v-if="now.reading.cover"
            :src="now.reading.cover"
            :alt="`Book cover for ${now.reading.title}`"
            class="w-12 h-16 rounded-sm flex-shrink-0 object-cover"
          />
          <div class="flex-1 min-w-0">
            <div class="activity-title-lg line-clamp-2">
              {{ now.reading.title }}
            </div>
            <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              {{ now.reading.author }}
            </div>
          </div>
        </NuxtLink>
      </section>

      <!-- Goodreads Currently Reading -->
      <section
        v-if="now.goodreads"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">
          On My Shelf
          <span
            v-if="now.goodreads.totalReading > 1"
            class="text-zinc-400 dark:text-zinc-600"
          >
            · {{ now.goodreads.totalReading }} books
          </span>
        </div>
        <a
          :href="now.goodreads.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-start gap-4 group"
        >
          <img
            v-if="now.goodreads.cover"
            :src="now.goodreads.cover"
            :alt="`Book cover for ${now.goodreads.title}`"
            class="w-12 h-16 rounded-sm flex-shrink-0 object-cover"
          />
          <div class="flex-1 min-w-0">
            <div class="activity-title-lg line-clamp-2 group-hover:underline">
              {{ now.goodreads.title }}
            </div>
            <div class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              {{ now.goodreads.author }}
            </div>
            <div
              v-if="now.goodreads.numPages"
              class="font-mono text-xs text-zinc-500 mt-1"
            >
              {{ now.goodreads.numPages }} pages
            </div>
          </div>
        </a>
      </section>

      <!-- Thinking -->
      <section
        v-if="now.thinking"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">
          Latest Prediction Update
          <span class="text-zinc-400 dark:text-zinc-600">
            · {{ formatTime(now.thinking.timestamp) }}
          </span>
        </div>
        <NuxtLink :to="`/predictions/${now.thinking.slug}`" class="block group">
          <div class="confidence-badge">
            {{ now.thinking.confidence }}% confidence
          </div>
          <div class="activity-title-base mb-2">
            {{ now.thinking.statement }}
          </div>
          <div
            class="font-serif text-sm text-zinc-600 dark:text-zinc-400 italic"
          >
            "{{ now.thinking.reasoning }}"
          </div>
        </NuxtLink>
      </section>

      <!-- Chess -->
      <section
        v-if="now.chess"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">Chess Rating</div>
        <div class="flex items-baseline gap-2">
          <span class="chess-rating">
            {{ now.chess.blitz }}
          </span>
          <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
            blitz
          </span>
        </div>
      </section>

      <!-- Duolingo -->
      <section
        v-if="now.duolingo"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">Language Learning</div>
        <div class="flex items-baseline gap-2">
          <span class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 tabular-nums">
            {{ now.duolingo.streak }}
          </span>
          <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
            day streak
          </span>
          <span
            v-if="now.duolingo.currentCourse"
            class="font-mono text-xs text-zinc-400 dark:text-zinc-600"
          >
            · {{ now.duolingo.currentCourse }}
          </span>
        </div>
      </section>

      <!-- MonkeyType -->
      <section
        v-if="now.typing"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <div class="activity-section-label">Typing Speed</div>
        <div class="flex items-baseline gap-3">
          <div class="flex items-baseline gap-1">
            <span class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 tabular-nums">
              {{ now.typing.averageWpm }}
            </span>
            <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
              avg wpm
            </span>
          </div>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <div class="flex items-baseline gap-1">
            <span class="font-mono text-lg text-zinc-600 dark:text-zinc-400 tabular-nums">
              {{ now.typing.bestWpm }}
            </span>
            <span class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
              best
            </span>
          </div>
        </div>
      </section>

      <!-- LeetCode -->
      <section v-if="now.leetcode" class="pb-6">
        <div class="activity-section-label">
          Last LeetCode
          <span class="text-zinc-400 dark:text-zinc-600">
            · {{ formatTime(now.leetcode.timestamp) }}
          </span>
        </div>
        <a
          :href="`https://leetcode.com/problems/${now.leetcode.slug}/`"
          target="_blank"
          class="block group"
        >
          <div class="activity-title-base group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            {{ now.leetcode.title }}
          </div>
          <div class="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            <span v-if="now.leetcode.lang">{{ now.leetcode.lang }}</span>
            <span v-if="now.leetcode.lang && now.leetcode.totalSolved"> · </span>
            <span v-if="now.leetcode.totalSolved">{{ now.leetcode.totalSolved }} solved</span>
          </div>
        </a>
      </section>
    </div>

    <!-- Footer note -->
    <footer class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <p class="font-serif text-sm text-zinc-500 dark:text-zinc-500 italic">
        This page shows my current activity across various platforms. For
        comprehensive stats and historical data, see
        <NuxtLink to="/stats" class="link-inline">/stats</NuxtLink>
        .
      </p>
    </footer>
  </main>
</template>

<style scoped>
:deep(.prose) {
  @apply max-w-none;
}

:deep(.prose p) {
  @apply text-zinc-600 dark:text-zinc-400 leading-8 mb-8;
}

:deep(.prose h1) {
  @apply font-serif text-3xl font-normal mt-0 mb-8;
  @apply text-zinc-900 dark:text-zinc-100;
  letter-spacing: -0.02em;
}

:deep(.prose h2) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
  @apply text-zinc-800 dark:text-zinc-200;
  letter-spacing: -0.01em;
}

:deep(.prose strong) {
  @apply font-medium text-zinc-700 dark:text-zinc-300;
}

:deep(.prose a) {
  @apply text-zinc-900 dark:text-zinc-100 border-b border-zinc-300;
  @apply dark:border-zinc-700 hover:border-zinc-900;
  @apply dark:hover:border-zinc-100 transition-colors;
}

:deep(.prose hr) {
  @apply border-zinc-100 dark:border-zinc-800 my-8;
}

:deep(.prose em) {
  @apply text-zinc-500 dark:text-zinc-500 text-sm leading-7;
}

.artist-text {
  @apply font-serif text-sm text-zinc-600 dark:text-zinc-400;
}

.confidence-badge {
  @apply font-mono text-xs text-zinc-900 dark:text-zinc-100 font-bold mb-2;
}

.chess-rating {
  @apply font-mono text-2xl text-zinc-900 dark:text-zinc-100 tabular-nums;
}
</style>
