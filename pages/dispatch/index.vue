<script setup lang="ts">
import { format } from 'date-fns'

interface DispatchListItem {
  slug: string
  title: string
  dek: string
  date: string | null
  image: string | null
  image_alt: string | null
  draft: boolean
  unlisted: boolean
  scheduled: boolean
}

const { data: pieces, error } =
  await useFetch<DispatchListItem[]>('/api/dispatch')

const formatDate = (d: string | null) => {
  if (!d) return ''
  try {
    return format(new Date(d), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

// Only reachable in dev (the API never returns these in production).
const flagOf = (p: DispatchListItem) =>
  p.draft ? 'draft' : p.scheduled ? 'scheduled' : p.unlisted ? 'unlisted' : ''

usePageSeo({
  title: 'Dispatch · EJ Fox',
  description: 'Short pieces of data journalism, with receipts.',
  type: 'website',
  section: 'Dispatch',
  tags: ['Dispatch', 'Data journalism'],
})

useHead({
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'EJ Fox · Dispatch',
      href: 'https://ejfox.com/dispatch-rss.xml',
    },
  ],
})
</script>

<template>
  <main class="container-main pt-8">
    <header class="section-spacing-lg">
      <h1 class="text-4xl md:text-5xl font-black mb-2">Dispatch</h1>
      <p class="font-serif text-base text-secondary">
        Short pieces of data journalism, with receipts.
      </p>
      <p class="font-mono text-3xs uppercase tracking-wider text-zinc-500 mt-2">
        <span class="tabular-nums">{{ pieces?.length || 0 }}</span>
        pieces ·
        <a href="/dispatch-rss.xml" class="hover:underline">rss</a>
      </p>
    </header>

    <div v-if="error" class="py-8 font-mono text-xs text-error">
      Failed to load dispatch
    </div>

    <p v-else-if="!pieces?.length" class="font-serif text-secondary">
      Nothing filed yet.
    </p>

    <ol v-else class="divide-y divide-zinc-200 dark:divide-zinc-800">
      <li v-for="piece in pieces" :key="piece.slug" class="h-entry">
        <NuxtLink
          :to="`/dispatch/${piece.slug}`"
          class="u-url group grid grid-cols-[1fr_auto] gap-x-4 py-4 no-underline"
        >
          <div class="min-w-0">
            <div
              class="font-mono text-3xs uppercase tracking-wider tabular-nums text-zinc-500 mb-1"
            >
              <time
                v-if="piece.date"
                :datetime="piece.date"
                class="dt-published"
              >
                {{ formatDate(piece.date) }}
              </time>
              <span v-if="flagOf(piece)" class="ml-2 text-amber-500">
                {{ flagOf(piece) }}
              </span>
            </div>
            <h2
              class="p-name text-xl leading-tight text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors text-balance"
            >
              {{ piece.title }}
            </h2>
            <p
              v-if="piece.dek"
              class="p-summary font-serif text-sm leading-6 text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 text-pretty"
            >
              {{ piece.dek }}
            </p>
          </div>
          <img
            v-if="piece.image"
            :src="piece.image"
            :alt="piece.image_alt || ''"
            loading="lazy"
            class="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-sm bg-raised self-center"
          />
        </NuxtLink>
      </li>
    </ol>
  </main>
</template>
