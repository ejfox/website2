<!--
  @file PostMetadataBar.vue
  @description Top ticker bar with reading stats for blog posts
  @props date, stats - post date and reading statistics
-->
<script setup lang="ts">
const props = defineProps<{
  date: string | null | undefined
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
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6 px-4 py-2 font-mono text-3xs sm:text-2xs text-zinc-800 dark:text-white uppercase tracking-wider"
  >
    <span class="whitespace-nowrap">{{ formattedDate }}</span>
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
