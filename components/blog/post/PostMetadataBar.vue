<!--
  @file PostMetadataBar.vue
  @description Top ticker bar with reading stats for blog posts
  @props date, stats - post date and reading statistics
  @props modified - frontmatter `modified`; shows "edited · history" when it
    falls on a later day than `date`. History = the public git log for the file.
-->
<script setup lang="ts">
const props = defineProps<{
  date: string | null | undefined
  modified?: string | null
  stats: {
    readingTime: number
    words: number
    images: number
    links: number
  }
  slug?: string
  /** Link to this post's AT-Proto record, or null when it has none. */
  atprotoUrl?: string | null
}>()

const sourceUrl = computed(() => {
  if (!props.slug) return null
  return `https://github.com/ejfox/website2/blob/main/content/blog/${props.slug}.md`
})

// Every published edit is a commit to the public repo, so the file's git log
// IS the post's change history: no extra infrastructure, nothing to fake.
const historyUrl = computed(() => {
  if (!props.slug) return null
  return `https://github.com/ejfox/website2/commits/main/content/blog/${props.slug}.md`
})

// Only call it "edited" when the edit landed on a later day than publication;
// same-day saves are just the writing process.
const editedDate = computed(() => {
  if (!props.modified || !props.date) return null
  const m = new Date(props.modified)
  const d = new Date(props.date)
  if (Number.isNaN(m.getTime()) || Number.isNaN(d.getTime())) return null
  if (m.toISOString().slice(0, 10) <= d.toISOString().slice(0, 10)) return null
  return formatShortDate(props.modified)?.toUpperCase() || null
})

const formattedDate = computed(() => {
  const d = formatShortDate(props.date)
  return d ? d.toUpperCase() : 'N/A'
})

function formatCompact(num: number): string {
  if (!num) return '0'
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'K'
  return Math.floor(num / 1000) + 'K'
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 font-mono text-3xs sm:text-2xs text-zinc-800 dark:text-white uppercase tracking-wider"
  >
    <span class="whitespace-nowrap">{{ formattedDate }}</span>
    <template v-if="editedDate && historyUrl">
      <span class="text-zinc-400 dark:text-zinc-600">·</span>
      <a
        :href="historyUrl"
        target="_blank"
        rel="noopener noreferrer"
        title="Every published edit is a commit in the public repo"
        class="whitespace-nowrap text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        edited {{ editedDate }} · history ↗
      </a>
    </template>
    <span class="text-zinc-400 dark:text-zinc-600">·</span>
    <span class="whitespace-nowrap">{{ stats.readingTime }}min read</span>
    <span class="text-zinc-400 dark:text-zinc-600">·</span>
    <span class="whitespace-nowrap">
      {{ formatCompact(stats.words) }} words
    </span>
    <template v-if="stats.images > 0">
      <span class="text-zinc-400 dark:text-zinc-600 hidden sm:inline">·</span>
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.images }} img
      </span>
    </template>
    <template v-if="stats.links > 0">
      <span class="text-zinc-400 dark:text-zinc-600 hidden sm:inline">·</span>
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.links }} links
      </span>
    </template>
    <template v-if="sourceUrl">
      <span class="text-zinc-400 dark:text-zinc-600">·</span>
      <a
        :href="sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="whitespace-nowrap hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors hidden sm:inline"
      >
        view source
      </a>
    </template>
    <template v-if="atprotoUrl">
      <span class="text-zinc-400 dark:text-zinc-600">·</span>
      <a
        :href="atprotoUrl"
        target="_blank"
        rel="noopener noreferrer"
        title="This post mirrored as an AT-Proto record"
        class="whitespace-nowrap hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors hidden sm:inline"
      >
        atproto
      </a>
    </template>
  </div>
</template>
