<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
    <div class="max-w-4xl">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="font-serif text-2xl mb-2">Changelog</h1>
        <p class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
          Living history of this site from git commits
        </p>
      </header>

      <!-- Stats -->
      <section
        v-if="data"
        class="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs"
      >
        <div
          v-for="(count, type) in data.stats.byType"
          :key="type"
          class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-2"
        >
          <div class="text-zinc-900 dark:text-zinc-100 font-bold">
            {{ count }}
          </div>
          <div class="text-muted">{{ type }}</div>
        </div>
      </section>

      <!-- Timeline -->
      <section v-if="data">
        <div
          v-for="(commits, date) in data.grouped.byDate"
          :key="date"
          class="mb-6"
        >
          <h2 class="sticky-label-header">
            {{ formatDate(date) }}
          </h2>

          <div class="stack-2">
            <div v-for="commit in commits" :key="commit.hash" class="group">
              <div class="flex items-baseline gap-2">
                <span
                  class="font-mono text-xs text-zinc-400 dark:text-zinc-600"
                >
                  {{ commit.hash }}
                </span>
                <span
                  :class="['font-mono text-xs px-1', getTypeColor(commit.type)]"
                >
                  {{ commit.type }}
                </span>
              </div>
              <p class="font-serif text-sm mt-1">
                {{ commit.message }}
              </p>
              <p
                class="font-mono text-xs text-zinc-400 dark:text-zinc-600 mt-1"
              >
                {{ commit.author }} · {{ formatTime(commit.date) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Load More -->
      <footer class="mt-8 text-center">
        <button v-if="canLoadMore" class="link-mono-hover" @click="loadMore">
          Load more commits
        </button>
      </footer>

      <!-- Error State -->
      <div v-if="error" class="text-center py-8 text-red-600 dark:text-red-400">
        Failed to load changelog
      </div>

      <!-- API Link -->
      <footer class="mt-12 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
          Source:
          <code>git log</code>
          ·
          <a
            href="/api/changelog"
            class="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            JSON
          </a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const limit = ref(50)
const { data, refresh, error } = await useFetch('/api/changelog', {
  query: { limit },
})

const canLoadMore = computed(
  () => data.value && data.value.commits.length >= limit.value
)

function loadMore() {
  limit.value += 50
  refresh()
}

function formatDate(dateString: string) {
  const d = new Date(dateString)
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

function formatTime(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getTypeColor(type: string) {
  const colors: any = {
    feat: 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100',
    fix: 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100',
    docs: 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100',
    style:
      'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100',
    refactor:
      'bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100',
    test: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-100',
    chore: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
    remove:
      'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100',
  }
  return (
    colors[type] ||
    'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
  )
}

useHead({
  title: 'Changelog · EJ Fox',
  meta: [
    {
      name: 'description',
      content: 'Living history of ejfox.com from git commits.',
    },
  ],
})
</script>
