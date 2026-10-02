<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import show from '~/data/the-hour.json'

// Hidden until EJ signs off: noindex, not in nav or sitemap
useHead({
  title: 'The Hour',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content: 'A weekly live show from the Hudson Valley, Sundays at 11am',
    },
  ],
})

const HOUR_MS = 60 * 60 * 1000
const episodes = show.episodes.map((e) => ({
  ...e,
  startMs: new Date(e.start).getTime(),
}))

// Re-render once a minute so the countdown and "live now" state stay fresh
const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 60 * 1000)

const next = computed(() =>
  episodes.find((e) => e.startMs + HOUR_MS > now.value)
)
const isLive = computed(
  () =>
    !!next.value &&
    now.value >= next.value.startMs &&
    now.value < next.value.startMs + HOUR_MS
)
const countdown = computed(() => {
  if (!next.value || isLive.value) return ''
  const mins = Math.max(0, Math.round((next.value.startMs - now.value) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(' ')
})
const when = (ms: number) =>
  new Date(ms).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
const upcoming = computed(() =>
  episodes.filter((e) => e.startMs + HOUR_MS > now.value)
)
</script>

<template>
  <main class="px-4 md:px-8 xl:px-16 pt-8 pb-16 max-w-2xl">
    <header class="mb-10">
      <div
        class="font-mono text-xs text-zinc-400 mb-2 uppercase tracking-wider"
      >
        Live · {{ show.slot }}
      </div>
      <h1 class="text-display text-5xl mb-3">The Hour</h1>
      <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
        One hour a week from the Hudson Valley: half radio net, half cooking
        show. Something gets made on air every episode
      </p>
    </header>

    <section
      v-if="next"
      class="mb-10 border-t border-zinc-300 dark:border-zinc-700 pt-4"
    >
      <div class="font-mono text-xs uppercase tracking-wider mb-2">
        <span v-if="isLive" class="text-rose-600 dark:text-rose-400">
          ● Live now
        </span>
        <span v-else class="text-zinc-500">
          Next · {{ when(next.startMs) }} · in {{ countdown }}
        </span>
      </div>
      <h2 class="font-serif text-2xl mb-2">
        <span class="font-mono text-sm text-zinc-500 mr-2">#{{ next.n }}</span>
        {{ next.title }}
      </h2>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        {{ next.goal }}
      </p>
      <a
        :href="show.watch"
        class="font-mono text-sm underline underline-offset-4 decoration-rose-500"
      >
        {{ isLive ? 'Watch now' : 'Watch on YouTube' }} →
      </a>
    </section>
    <p v-else class="font-serif text-zinc-600 dark:text-zinc-400 mb-10">
      The next episode isn't on the schedule yet
    </p>

    <section class="mb-10">
      <h3 class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-3">
        Each episode
      </h3>
      <dl class="font-serif grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2">
        <dt class="font-mono text-xs text-zinc-500 pt-1">0–5</dt>
        <dd>
          Net check-in: the date, the weather, the countdowns, chat by town
        </dd>
        <dt class="font-mono text-xs text-zinc-500 pt-1">5–45</dt>
        <dd>The make: one project, one goal, shipped or not on air</dd>
        <dt class="font-mono text-xs text-zinc-500 pt-1">45–55</dt>
        <dd>
          The record: a records request, a document, something from the archive
        </dd>
        <dt class="font-mono text-xs text-zinc-500 pt-1">55–60</dt>
        <dd>Sign-off: what ships before next week</dd>
      </dl>
    </section>

    <section v-if="upcoming.length > 1">
      <h3 class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-3">
        Coming up
      </h3>
      <ol class="font-serif space-y-2">
        <li v-for="e in upcoming.slice(1)" :key="e.n">
          <span class="font-mono text-xs text-zinc-500 mr-2">
            {{ when(e.startMs) }}
          </span>
          {{ e.title }}
        </li>
      </ol>
    </section>
  </main>
</template>
