<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8">
    <div class="max-w-4xl">
      <!-- Header -->
      <header class="mb-12">
        <h1 class="font-serif text-2xl mb-2">What's New</h1>
        <p class="font-serif text-zinc-600 dark:text-zinc-400">
          Notable updates and new features on this site.
        </p>
      </header>

      <!-- Updates Timeline -->
      <section class="space-y-12">
        <article v-for="update in updates" :key="update.date + update.title">
          <div class="flex items-center gap-2">
            <time
              class="font-mono text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wide"
            >
              {{ formatDate(update.date) }}
            </time>
            <span
              v-if="update.era"
              class="font-mono text-xs px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            >
              {{ update.era }}
            </span>
          </div>
          <h2 class="font-serif text-xl mt-1 mb-2">
            <NuxtLink
              v-if="update.link"
              :to="update.link"
              class="hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {{ update.title }}
            </NuxtLink>
            <span v-else>{{ update.title }}</span>
          </h2>
          <p class="font-serif text-zinc-700 dark:text-zinc-300">
            {{ update.description }}
          </p>
        </article>
      </section>

      <!-- Footer -->
      <footer
        class="mt-16 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-500"
      >
        <p>
          For the commit-by-commit view, see the
          <NuxtLink
            to="/changelog"
            class="underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            git changelog
          </NuxtLink>
          .
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import updatesData from '~/data/updates.json'

interface Update {
  date: string
  title: string
  description: string
  link?: string
  era?: string
}

const updates: Update[] = updatesData

function formatDate(dateStr: string) {
  // Handle year-only: "2018"
  if (/^\d{4}$/.test(dateStr)) {
    return dateStr
  }
  // Handle quarters: "2024-Q2"
  if (dateStr.includes('Q')) {
    const [year, quarter] = dateStr.split('-')
    return `${quarter} ${year}`
  }
  // Handle month: "2025-12"
  const [year, month] = dateStr.split('-')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[Number.parseInt(month) - 1]} ${year}`
}

usePageSeo({
  title: "What's New · EJ Fox",
  description: 'Notable updates, new features, and changes on ejfox.com.',
  type: 'article',
  section: 'Meta',
  tags: ['Updates', 'Changelog', 'Site News', 'Features'],
})
</script>
