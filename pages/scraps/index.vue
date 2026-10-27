<!--
  @file scraps/index.vue
  @description /scraps: dense list of the newest shared bookmarks/scraps with
    tags, source and extraction metadata. SSR, then edge-cached by the
    /scraps/** rule in nuxt.config.ts (not prerendered, despite that rule's
    comment). Data: /api/scraps (server/api/scraps.get.ts: Supabase,
    shared === true only, newest 500, cached 1h). Feed: /scraps-rss.xml.
  Gotchas:
    - The full ~3.4MB row set is fetched on SSR and rides along in the page
      payload. The 1h API cache exists because uncached pulls blew the
      Supabase egress quota (see the note in scraps.get.ts).
    - Only `tags` link to /scraps/tag/*; `concept_tags` are shown, not linked.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '~/utils/date'
import { scrapDisplayTitle } from '~/utils/scrapTitle'

interface Scrap {
  id: string
  title: string | null
  summary: string | null
  summaryHtml?: string
  url: string | null
  content: string | null
  created_at: string
  updated_at: string | null
  published_at: string | null
  tags: string[] | null
  concept_tags: string[] | null
  type: string | null
  source: string | null
  content_type: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  screenshot_url: string | null
  shared: boolean
  relationships: Array<{ id: string; type?: string }> | null
  extraction_confidence: { tags?: number; summary?: number } | null
  financial_analysis: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

// ── Data loading ────────────────────────────────────────────
const {
  data: scraps,
  pending: isLoading,
  error,
} = await useFetch<Scrap[]>('/api/scraps')

const { revealContainer: scrapsReveal } = useScrollReveal({
  selector: ':scope > div',
  staggerDelay: 8,
  translateY: 3,
  duration: 100,
})

// ── Header stats + SEO ──────────────────────────────────────
const uniqueTags = computed(() => {
  const tags = new Set<string>()
  scraps.value?.forEach((s) => {
    s.tags?.forEach((t) => tags.add(t))
  })
  return tags.size
})

const uniqueSources = computed(() => {
  const sources = new Set<string>()
  scraps.value?.forEach((s) => {
    if (s.source) sources.add(s.source)
  })
  return Array.from(sources).join(', ') || 'unknown'
})

usePageSeo({
  title: 'Scraps',
  description: 'Bookmarks, links, and scraps from around the web',
  type: 'website',
  section: 'Content',
})

useHead({
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'EJ Fox · Scraps',
      href: 'https://ejfox.com/scraps-rss.xml',
    },
  ],
})
</script>

<template>
  <div
    class="max-w-screen-xl mx-auto px-4 md:px-8 pt-8 pb-8 font-mono text-xs space-y-2"
  >
    <!-- Header -->
    <div>
      <div class="font-bold tracking-wider uppercase">Scraps</div>
      <div class="text-3xs text-zinc-500 dark:text-zinc-500 space-y-1">
        <div>
          {{ scraps?.length || 0 }} items · {{ uniqueTags }} tags ·
          {{ uniqueSources }} ·
          <a href="/scraps-rss.xml" class="hover:underline">rss</a>
        </div>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div
      v-if="isLoading"
      class="text-zinc-500 dark:text-zinc-500 text-center py-8"
    >
      Loading scraps...
    </div>

    <div
      v-else-if="error"
      class="text-red-600 dark:text-red-400 text-center py-8"
    >
      {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!scraps?.length"
      class="text-zinc-500 dark:text-zinc-500 text-center py-8"
    >
      No scraps yet
    </div>

    <!-- ── Scrap list ─────────── -->
    <!-- Scraps List -->
    <!-- Rows 3–5 are progressively hidden below lg/xl to keep phones terse. -->
    <div v-else ref="scrapsReveal" class="space-y-2">
      <div
        v-for="scrap in scraps"
        :key="scrap.id"
        class="space-y-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 last:border-0"
      >
        <!-- Title/URL -->
        <a
          v-if="scrap.url"
          :href="scrap.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:underline dark:text-blue-400 block text-xs line-clamp-1 xl:line-clamp-2 break-words"
        >
          {{ scrapDisplayTitle(scrap.title, scrap.url, scrap.url) }}
        </a>
        <div
          v-else
          class="text-zinc-900 dark:text-zinc-100 text-xs line-clamp-2"
        >
          {{ scrapDisplayTitle(scrap.title, null, '(untitled)') }}
        </div>

        <!-- Summary -->
        <div
          v-if="scrap.summary"
          class="text-3xs text-zinc-600 dark:text-zinc-400 line-clamp-2 xl:line-clamp-3 break-words"
        >
          {{ scrap.summary }}
        </div>

        <!-- Metadata Grid -->
        <div class="text-4xs text-zinc-600 dark:text-zinc-500 space-y-0.5">
          <!-- Row 1: Core info -->
          <div class="flex flex-wrap gap-2">
            <span v-if="scrap.source">{{ scrap.source }}</span>
            <span v-if="scrap.type">{{ scrap.type }}</span>
            <span v-if="scrap.content_type">{{ scrap.content_type }}</span>
            <span>{{ formatDate(scrap.created_at) || 'unknown' }}</span>
          </div>

          <!-- Row 2: Tags + Concept tags -->
          <div
            v-if="scrap.tags?.length || scrap.concept_tags?.length"
            class="flex flex-wrap gap-1"
          >
            <NuxtLink
              v-for="tag in scrap.tags"
              :key="tag"
              :to="`/scraps/tag/${encodeURIComponent(tag)}`"
              class="px-1 bg-raised text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline cursor-pointer"
            >
              {{ tag }}
            </NuxtLink>
            <span
              v-for="tag in scrap.concept_tags"
              :key="tag"
              class="hidden xl:inline px-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 opacity-50 italic"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Row 3: Additional metadata (lg+ only) -->
          <div
            v-if="
              scrap.location ||
              scrap.screenshot_url ||
              scrap.shared ||
              scrap.relationships?.length
            "
            class="hidden lg:flex flex-wrap gap-2"
          >
            <span v-if="scrap.location">{{ scrap.location }}</span>
            <a
              v-if="scrap.screenshot_url"
              :href="scrap.screenshot_url"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline cursor-pointer"
            >
              image
            </a>
            <span v-if="scrap.shared">shared</span>
            <span v-if="scrap.relationships?.length">
              ↔ {{ scrap.relationships.length }}
            </span>
          </div>

          <!-- Row 4: Confidence scores (xl+ only) -->
          <div v-if="scrap.extraction_confidence" class="hidden xl:block">
            Conf:
            <span v-if="scrap.extraction_confidence.tags">
              tags {{ Math.round(scrap.extraction_confidence.tags * 100) }}%
            </span>
            <span v-if="scrap.extraction_confidence.summary">
              summary
              {{ Math.round(scrap.extraction_confidence.summary * 100) }}%
            </span>
          </div>

          <!-- Row 5: Financial data (xl+ only) -->
          <div v-if="scrap.financial_analysis" class="hidden xl:block">
            financial data present
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
