<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '~/utils/date'
import type { ScrapPermalink } from '~/composables/useScrapPermalink'

// One scrap as a museum wall label: the back of its Scrapworld card, on the web.
// Used by /scraps/<id> (inside the site) and /scraps/embed/<id> (chromeless, rendered live
// on the inspected card in Scrapworld via Ultralight, 2026-10-29).
const props = defineProps<{ scrap: ScrapPermalink; embed?: boolean }>()

const domain = computed(() => {
  try {
    if (!props.scrap.url) return null
    return new URL(props.scrap.url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
})

const keptDay = computed(() => props.scrap.created_at?.slice(0, 10) || null)
const publishedDay = computed(() => {
  const p = props.scrap.published_at?.slice(0, 10)
  if (p && p !== keptDay.value) return p
  return null
})

const parts = computed(() => scrapLabelParts(props.scrap.summary))

const aboutLabel = computed(() => {
  if (parts.value.why) return 'About'
  return 'The scrap'
})

// Embedded on a card: fill the view, card padding, light ink on black
const rootClass = computed(() => {
  if (props.embed) return 'min-h-screen max-w-none bg-black text-zinc-100 p-8'
  return 'max-w-prose'
})
</script>

<template>
  <article class="font-mono text-xs space-y-4" :class="rootClass">
    <header class="space-y-1">
      <h1 class="text-xl leading-snug">
        {{ scrap.title || '(untitled)' }}
      </h1>
      <div v-if="scrap.source || domain" class="text-3xs text-zinc-500">
        <span v-if="scrap.source">{{ scrap.source }}</span>
        <span v-if="scrap.source && domain"> · </span>
        <span v-if="domain">{{ domain }}</span>
      </div>
    </header>

    <dl class="space-y-2">
      <div v-if="keptDay">
        <dt class="text-5xs uppercase tracking-wider text-zinc-500">Kept</dt>
        <dd>{{ formatDate(scrap.created_at) || keptDay }}</dd>
      </div>
      <div v-if="publishedDay">
        <dt class="text-5xs uppercase tracking-wider text-zinc-500">Published</dt>
        <dd>{{ publishedDay }}</dd>
      </div>
      <div v-if="scrap.to_read" class="text-5xs uppercase tracking-wider">To read</div>
    </dl>

    <section v-if="parts.why" class="space-y-1">
      <div class="text-5xs uppercase tracking-wider text-zinc-500">Why kept</div>
      <p class="font-serif text-base">{{ parts.why }}</p>
    </section>
    <section v-if="parts.about" class="space-y-1">
      <div class="text-5xs uppercase tracking-wider text-zinc-500">
        {{ aboutLabel }}
      </div>
      <p class="font-serif text-base">{{ parts.about }}</p>
    </section>

    <img
      v-if="scrap.screenshot_url"
      :src="scrap.screenshot_url"
      :alt="scrap.title || 'Screenshot'"
      class="w-full max-h-[60vh] object-cover object-top"
      loading="lazy"
    />

    <div v-if="scrap.tags.length || scrap.concept_tags.length" class="flex flex-wrap gap-x-2 text-3xs text-zinc-500">
      <NuxtLink
        v-for="t in scrap.tags"
        :key="t"
        :to="`/scraps/tag/${encodeURIComponent(t)}`"
        class="hover:underline"
      >
        {{ t }}
      </NuxtLink>
      <span v-for="t in scrap.concept_tags" :key="`c-${t}`" class="italic opacity-70">{{ t }}</span>
    </div>

    <footer class="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between text-3xs text-zinc-500">
      <a
        v-if="scrap.url"
        :href="scrap.url"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:underline truncate"
      >
        {{ scrap.url }}
      </a>
      <NuxtLink v-if="!embed" to="/scraps" class="hover:underline shrink-0 ml-4">all scraps</NuxtLink>
    </footer>
  </article>
</template>
