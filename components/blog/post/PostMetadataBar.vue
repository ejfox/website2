<!--
  @file PostMetadataBar.vue
  @description One-line mono bar at the top of a blog post: date, "edited"
    link to the git history, reading time, words/images/links, and archive
    links (github source, AT-Proto record, Wayback). Used by
    pages/blog/[...slug].vue, which reserves a fixed height for it.
  @props date, modified?, stats { readingTime, words, images, links },
    slug? (blog path without /blog/, e.g. 2024/foo), atprotoUrl?
-->
<script setup lang="ts">
const props = defineProps<{
  date: string | null | undefined
  /** Frontmatter `modified`: shows "edited" when it's a later day than `date` */
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

// Duplicate copies of the post that outlive this site: the markdown in git,
// the AT-Proto record (only for posts the mirror job publishes), and the
// Internet Archive's latest capture
const archives = computed(() => {
  if (!props.slug) return []
  return [
    {
      label: 'github',
      title: 'The markdown source, with its edit history',
      href: `https://github.com/ejfox/website2/blob/main/content/blog/${props.slug}.md`,
    },
    props.atprotoUrl && {
      label: 'atproto',
      title: 'This post mirrored as an AT-Proto record',
      href: props.atprotoUrl,
    },
    {
      label: 'wayback',
      title: "The Internet Archive's latest capture",
      href: `https://web.archive.org/web/https://ejfox.com/blog/${props.slug}`,
    },
  ].filter(Boolean)
})

// Every published edit is a commit to the public repo, so the file's git log
// IS the post's change history: no extra infrastructure, nothing to fake.
const historyUrl = computed(() =>
  props.slug
    ? `https://github.com/ejfox/website2/commits/main/content/blog/${props.slug}.md`
    : null
)

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
    class="post-meta-bar flex flex-nowrap items-center gap-x-4 sm:gap-x-6 px-4 py-2 overflow-x-auto font-mono text-3xs sm:text-2xs text-zinc-800 dark:text-white uppercase tracking-wider"
  >
    <span class="whitespace-nowrap">{{ formattedDate }}</span>
    <a
      v-if="editedDate && historyUrl"
      :href="historyUrl"
      target="_blank"
      rel="noopener noreferrer"
      title="Every published edit is a commit in the public repo"
      class="whitespace-nowrap text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
    >
      edited {{ editedDate }} ↗
    </a>
    <span class="whitespace-nowrap">{{ stats.readingTime }}min read</span>
    <span class="whitespace-nowrap">
      {{ formatCompact(stats.words) }} words
    </span>
    <template v-if="stats.images > 0">
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.images }} img
      </span>
    </template>
    <template v-if="stats.links > 0">
      <span class="whitespace-nowrap hidden sm:inline">
        {{ stats.links }} links
      </span>
    </template>
    <span
      v-if="archives.length"
      class="hidden sm:inline-flex items-baseline gap-x-2 whitespace-nowrap"
    >
      <span class="text-zinc-500 dark:text-zinc-400">archive:</span>
      <a
        v-for="a in archives"
        :key="a.label"
        :href="a.href"
        :title="a.title"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        {{ a.label }}
      </a>
    </span>
  </div>
</template>

<style scoped>
/* One line, always: a wrapped bar was 73px instead of 49px, which broke the
   height reserved for it in the layout (layout-bar--post). On widths where
   it doesn't fit, it scrolls sideways. `safe center` stays centered when it
   fits and starts at the left edge when it overflows, so nothing is clipped. */
.post-meta-bar {
  justify-content: safe center;
  scrollbar-width: none;
}
.post-meta-bar::-webkit-scrollbar {
  display: none;
}
</style>
