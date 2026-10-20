<script setup>
// The apps, from data/apps.json via /api/apps (which adds the live App Store
// version and icon). One row per app; the button says exactly where you can
// get it, and nothing pretends an unreleased app is out.
const { data: apps } = await useFetch('/api/apps', { default: () => [] })

const STATUS = {
  'app-store': 'In the App Store',
  unreleased: 'Not released yet',
  'open-source': 'Open source',
}

const monthYear = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'America/New_York',
      })
    : ''

usePageSeo({
  title: 'Apps · EJ Fox',
  description:
    'Small, single-purpose apps EJ Fox has made for iPhone, Apple Watch and Android, with where to get each one.',
  type: 'website',
  section: 'Projects',
  tags: ['iOS', 'Apps', 'Android'],
})
</script>

<template>
  <div data-page-main class="px-4 md:px-8 xl:px-16 pt-8 pb-16 max-w-3xl">
    <header class="mb-10">
      <h1 class="text-3xl mb-2">Apps</h1>
      <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
        Small, single-purpose apps I've made, mostly for my own phone
      </p>
    </header>

    <ul class="space-y-8">
      <li
        v-for="app in apps"
        :id="app.slug"
        :key="app.slug"
        class="flex gap-4 items-start"
      >
        <img
          v-if="app.store?.icon"
          :src="app.store.icon"
          :alt="`${app.name} app icon`"
          width="64"
          height="64"
          loading="lazy"
          class="app-icon"
        />
        <div v-else class="app-icon app-icon--blank" aria-hidden="true">
          {{ app.name.charAt(0).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/projects/${app.slug}`"
            class="font-serif text-xl text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-2"
          >
            {{ app.name }}
          </NuxtLink>
          <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
            {{ app.line }}
          </p>
          <p class="font-mono text-2xs text-zinc-500 mt-1">
            {{ app.platforms.join(' · ') }} ·
            {{ STATUS[app.status] }}
            <template v-if="app.store?.version">
              · v{{ app.store.version }}, {{ monthYear(app.store.updated) }}
            </template>
          </p>
          <p v-if="app.note" class="font-mono text-2xs text-zinc-500">
            {{ app.note }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <a
              v-if="app.store?.url"
              :href="app.store.url"
              target="_blank"
              rel="noopener noreferrer"
              class="app-btn app-btn--primary"
              data-umami-event="app-store-click"
              :data-umami-event-app="app.slug"
            >
              Get {{ app.name }} on the App Store ↗
            </a>
            <a
              v-if="app.github"
              :href="app.github"
              target="_blank"
              rel="noopener noreferrer"
              class="app-btn"
            >
              Source on GitHub ↗
            </a>
            <NuxtLink :to="`/projects/${app.slug}`" class="app-btn">
              Read about it
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.app-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 22%;
  object-fit: cover;
}

.app-icon--blank {
  @apply flex items-center justify-center font-mono text-2xl border border-zinc-300 dark:border-zinc-700 text-zinc-500;
}

.app-btn {
  @apply font-mono text-2xs px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors;
}

.app-btn--primary {
  @apply bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-black dark:border-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300;
}
</style>
