<script setup>
// The rules for this page live in server/api/now.get.ts. In short: one font
// size, one line per thing, one thing per route, newest first. This file only
// renders the list it's given. Emphasis is color, never size.
const { data: now, error } = await useFetch('/api/now')

const TZ = 'America/New_York'
const STALE_DAYS = 90

const age = (iso) => {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 60) return `${days}d`
  if (days < 730) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

const isStale = (iso) =>
  !!iso && Date.now() - Date.parse(iso) > STALE_DAYS * 86_400_000

const isExternal = (href) => /^https?:\/\//.test(href)

const stamp = computed(() =>
  now.value?.generated
    ? new Date(now.value.generated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: TZ,
      })
    : ''
)

usePageSeo({
  title: 'Now · EJ Fox',
  description:
    'One line from every corner of ejfox.com, newest first: what EJ Fox is reading, building, shipping, saving and listening to right now.',
  type: 'website',
  section: 'Meta',
  tags: ['Now page', 'Reading', 'Live stats'],
  label1: 'Latest',
  data1: computed(() => now.value?.lines?.[0]?.text || 'Quiet'),
  label2: 'Lines',
  data2: computed(() => String(now.value?.lines?.length || 0)),
})
</script>

<template>
  <main class="now px-4 md:px-8 xl:px-16 pt-8 pb-16 max-w-3xl">
    <header class="mb-6">
      <h1 class="text-zinc-900 dark:text-zinc-100">
        Now
        <span v-if="stamp" class="text-zinc-500">· {{ stamp }} ET</span>
      </h1>
      <p class="text-zinc-500">One line per corner of the site</p>
    </header>

    <p v-if="error && !now" class="text-zinc-500">
      The live feeds didn't answer. Try again in a minute.
    </p>

    <ol v-else-if="now?.lines?.length">
      <li v-for="(line, i) in now.lines" :key="`${line.label}-${i}`">
        <a
          v-if="isExternal(line.href)"
          :href="line.href"
          target="_blank"
          rel="noopener noreferrer"
          class="row group"
          :class="isStale(line.at) ? 'stale' : 'fresh'"
        >
          <span class="age">{{ age(line.at) }}</span>
          <span class="where">{{ line.label }}</span>
          <span class="what">{{ line.text }}</span>
        </a>
        <NuxtLink
          v-else
          :to="line.href"
          class="row group"
          :class="isStale(line.at) ? 'stale' : 'fresh'"
        >
          <span class="age">{{ age(line.at) }}</span>
          <span class="where">{{ line.label }}</span>
          <span class="what">{{ line.text }}</span>
        </NuxtLink>
      </li>
    </ol>

    <footer class="mt-8 text-zinc-500">
      Assembled live. Dimmed lines are 90+ days old. The long view is
      <NuxtLink to="/stats" class="underline">/stats</NuxtLink>
      <br />
      What's this?
      <a href="https://nownownow.com/about" class="underline">A now page</a>
    </footer>
  </main>
</template>

<style scoped>
/* Rule 1: one font size, one font, everywhere on the page (h1 included). */
.now,
.now h1,
.now :deep(*) {
  @apply font-mono text-sm;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

/* Rule 2: one line per thing. age | where | what. On a phone the value
   column is too narrow for that ("14 repos tou…"), so there it wraps;
   from sm up it stays a single truncated line. */
.row {
  @apply grid gap-x-1 py-1;
  grid-template-columns: 2.5rem 5.5rem minmax(0, 1fr);
}

@media (min-width: 640px) {
  .row {
    @apply gap-x-3 whitespace-nowrap;
    grid-template-columns: 3rem 8.5rem minmax(0, 1fr);
  }
}

.age {
  @apply text-right text-zinc-500 tabular-nums whitespace-nowrap;
}

.where {
  @apply text-zinc-500 truncate;
}

.what {
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .what {
    @apply truncate;
  }
}

.fresh .what {
  @apply text-zinc-900 dark:text-zinc-100;
}

.stale .what {
  @apply text-zinc-500;
}

.row:hover .what {
  @apply underline;
}
</style>
