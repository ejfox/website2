<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 pt-8">
    <div class="max-w-4xl">
      <!-- Header -->
      <header class="section-spacing-lg">
        <h1 class="font-serif text-2xl mb-2">Following</h1>
        <p class="label-xs">
          {{ data?.meta.stats.total }} feeds ·
          {{ data?.meta.stats.categories }} categories
        </p>
      </header>

      <!-- Error State -->
      <div v-if="error" class="text-center py-8 text-red-600 dark:text-red-400">
        Failed to load data
      </div>

      <!-- Stats -->
      <section v-else-if="data" class="section-spacing-lg mono-xs">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(count, category) in sortedCategories"
            :key="category"
            class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-2"
          >
            <div class="text-primary font-bold">{{ count }}</div>
            <div class="text-muted">{{ category }}</div>
          </div>
        </div>
      </section>

      <!-- Feeds by Category -->
      <section v-if="data">
        <div
          v-for="(feeds, category) in data.byCategory"
          :key="category"
          class="section-spacing-sm"
        >
          <h2 class="heading-2 mb-2">{{ category }} ({{ feeds.length }})</h2>

          <div class="stack-1">
            <div
              v-for="feed in feeds"
              :key="feed.url"
              class="group flex items-baseline gap-2 text-sm"
            >
              <a
                :href="feed.url"
                target="_blank"
                rel="noopener noreferrer"
                class="interactive-link font-serif"
              >
                {{ feed.name }}
              </a>
              <span class="link-arrow-hover">
                {{ feed.domain }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- OPML Export -->
      <footer class="mt-12 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p class="label-xs">
          Source:
          <code>~/.newsboat/urls</code>
          ·
          <a href="/api/blogroll" class="interactive-link">JSON</a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data, error } = await useFetch('/api/blogroll')

const totalFeeds = computed(() => data.value?.meta.stats.total || 0)
const totalCategories = computed(() => data.value?.meta.stats.categories || 0)

const sortedCategories = computed(() => {
  if (!data.value?.meta.stats.byCategoryCount) return {}
  return Object.entries(data.value.meta.stats.byCategoryCount)
    .sort(([, a]: any, [, b]: any) => b - a)
    .reduce((acc: any, [cat, count]) => {
      acc[cat] = count
      return acc
    }, {})
})

usePageSeo({
  title: 'Following · EJ Fox',
  description:
    'My RSS subscriptions: feeds across data visualization, investigative journalism, photography, and weird web.',
  type: 'article',
  section: 'Meta',
  tags: ['RSS', 'Blogroll', 'Data Visualization', 'Journalism'],
  label1: 'Feeds tracked',
  data1: computed(() => `${totalFeeds.value} feeds`),
  label2: 'Categories',
  data2: computed(() => `${totalCategories.value} categories`),
})
</script>
