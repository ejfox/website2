<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
    <div class="max-w-4xl">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="font-serif text-2xl mb-2">Following</h1>
        <p class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
          {{ data?.meta.stats.total }} feeds · {{ data?.meta.stats.categories }} categories
        </p>
      </header>

      <!-- Stats -->
      <section v-if="data" class="mb-8 font-mono text-xs">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="(count, category) in sortedCategories" :key="category"
               class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-2">
            <div class="text-zinc-900 dark:text-zinc-100 font-bold">{{ count }}</div>
            <div class="text-zinc-500 dark:text-zinc-500">{{ category }}</div>
          </div>
        </div>
      </section>

      <!-- Feeds by Category -->
      <section v-if="data">
        <div v-for="(feeds, category) in data.byCategory" :key="category" class="mb-6">
          <h2 class="font-mono text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
            {{ category }} ({{ feeds.length }})
          </h2>

          <div class="space-y-1">
            <div v-for="feed in feeds" :key="feed.url"
                 class="group flex items-baseline gap-2 text-sm">
              <a :href="feed.url"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="font-serif hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
                {{ feed.name }}
              </a>
              <span class="font-mono text-xs text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {{ feed.domain }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- OPML Export -->
      <footer class="mt-12 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p class="font-mono text-xs text-zinc-500 dark:text-zinc-500">
          Source: <code>~/.newsboat/urls</code> ·
          <a href="/api/blogroll" class="hover:text-zinc-900 dark:hover:text-zinc-100">JSON</a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/blogroll')

const sortedCategories = computed(() => {
  if (!data.value?.meta.stats.byCategoryCount) return {}
  return Object.entries(data.value.meta.stats.byCategoryCount)
    .sort(([, a]: any, [, b]: any) => b - a)
    .reduce((acc: any, [cat, count]) => {
      acc[cat] = count
      return acc
    }, {})
})

useHead({
  title: 'Following · EJ Fox',
  meta: [
    {
      name: 'description',
      content: 'RSS feeds I follow. Blogs, infographics, photography, and more.'
    }
  ]
})
</script>
