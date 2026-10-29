<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '~/utils/date'

// One scrap, laid out like the back of its Scrapworld card (a museum wall label).
// Scrapworld prints a small QR to this page on every shared card (2026-10-29).
interface Scrap {
  id: string
  title: string | null
  summary: string | null
  url: string | null
  created_at: string
  published_at: string | null
  tags: string[]
  concept_tags: string[]
  type: string | null
  source: string | null
  content_type: string | null
  location: string | null
  screenshot_url: string | null
  relationships: number
  to_read: boolean
}

const route = useRoute()
const id = computed(() => String((route.params as { id?: string }).id || ''))

const { data: scrap, error } = await useFetch<Scrap>(
  () => `/api/scraps/${encodeURIComponent(id.value)}`,
  { key: `scrap-${id.value}` }
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such scrap', fatal: true })
}

const domain = computed(() => {
  try {
    return scrap.value?.url ? new URL(scrap.value.url).hostname.replace(/^www\./, '') : null
  } catch {
    return null
  }
})

const keptDay = computed(() => scrap.value?.created_at?.slice(0, 10) || null)
const publishedDay = computed(() => {
  const p = scrap.value?.published_at?.slice(0, 10)
  if (p && p !== keptDay.value) return p
  return null
})

// Some vision-model summaries are runaway (raw **markdown**, "Group Group Group..." loops).
// Same budget as the card copy: strip markdown emphasis, collapse whitespace, cap ~700 chars.
const EXCERPT_MAX = 700
function excerpt(text: string | null) {
  if (!text) return null
  const clean = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length <= EXCERPT_MAX) return clean || null
  const cut = clean.slice(0, EXCERPT_MAX)
  const space = cut.lastIndexOf(' ')
  if (space > EXCERPT_MAX * 0.8) return `${cut.slice(0, space)}…`
  return `${cut}…`
}

// The card splits "WHY KEPT — … ABOUT — …" out of the summary; do the same here
const rawParts = computed(() => {
  const s = scrap.value?.summary?.trim() || ''
  if (!s.toUpperCase().startsWith('WHY KEPT')) return { why: null, about: s || null }
  const body = s.slice('WHY KEPT'.length).replace(/^[\s—-]+/, '')
  const at = body.toUpperCase().indexOf('\nABOUT')
  if (at < 0) return { why: body.trim(), about: null }
  const about = body.slice(at + '\nABOUT'.length).replace(/^[\s—-]+/, '').trim()
  return { why: body.slice(0, at).trim(), about: about || null }
})

const parts = computed(() => ({
  why: excerpt(rawParts.value.why),
  about: excerpt(rawParts.value.about),
}))

const aboutLabel = computed(() => {
  if (parts.value.why) return 'About'
  return 'The scrap'
})

usePageSeo({
  title: scrap.value?.title || 'Scrap',
  description: parts.value.why || parts.value.about || `A scrap kept ${keptDay.value || ''}`,
  type: 'article',
  section: 'Scraps',
})
</script>

<template>
  <article v-if="scrap" class="font-mono text-xs max-w-prose space-y-4">
    <header class="space-y-1">
      <h1 class="text-base font-bold leading-snug font-sans">
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
      <p class="leading-relaxed">{{ parts.why }}</p>
    </section>
    <section v-if="parts.about" class="space-y-1">
      <div class="text-5xs uppercase tracking-wider text-zinc-500">
        {{ aboutLabel }}
      </div>
      <p class="leading-relaxed">{{ parts.about }}</p>
    </section>

    <img
      v-if="scrap.screenshot_url"
      :src="scrap.screenshot_url"
      :alt="scrap.title || 'Screenshot'"
      class="w-full max-w-prose max-h-[60vh] object-cover object-top"
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
      <NuxtLink to="/scraps" class="hover:underline shrink-0 ml-4">all scraps</NuxtLink>
    </footer>
  </article>
</template>
