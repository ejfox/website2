<template>
  <div class="font-mono text-xs space-y-2">
    <!-- Header -->
    <div>
      <div class="font-bold tracking-wider uppercase">Scraps</div>
      <div class="text-[10px] text-zinc-500 dark:text-zinc-500 space-y-1">
        <div>{{ scraps.length }} items · {{ uniqueTags }} tags · {{ uniqueSources }}</div>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div v-if="isLoading" class="text-zinc-500 dark:text-zinc-500 text-center py-8">
      Loading scraps...
    </div>

    <div v-else-if="error" class="text-red-600 dark:text-red-400 text-center py-8">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="!scraps.length" class="text-zinc-500 dark:text-zinc-500 text-center py-8">
      No scraps yet
    </div>

    <!-- Scraps List -->
    <div v-else class="space-y-2">
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
          class="text-blue-600 hover:underline dark:text-blue-400 block text-xs line-clamp-2"
        >
          {{ scrap.title || scrap.url }}
        </a>
        <div v-else class="text-zinc-900 dark:text-zinc-100 text-xs line-clamp-2">
          {{ scrap.title || '(untitled)' }}
        </div>

        <!-- Summary -->
        <div
          v-if="scrap.summary"
          class="text-[9px] text-zinc-600 dark:text-zinc-400 line-clamp-3"
        >
          {{ scrap.summary }}
        </div>

        <!-- Metadata Grid -->
        <div class="text-[8px] text-zinc-500 dark:text-zinc-500 space-y-0.5">
          <!-- Row 1: Core info -->
          <div class="flex flex-wrap gap-2 opacity-70">
            <span v-if="scrap.source">{{ scrap.source }}</span>
            <span v-if="scrap.type">{{ scrap.type }}</span>
            <span v-if="scrap.content_type">{{ scrap.content_type }}</span>
            <span class="opacity-50">{{ formatDate(scrap.created_at) }}</span>
          </div>

          <!-- Row 2: Tags + Concept tags -->
          <div v-if="scrap.tags?.length || scrap.concept_tags?.length" class="flex flex-wrap gap-1">
            <span
              v-for="tag in scrap.tags"
              :key="tag"
              class="px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 opacity-60"
            >
              {{ tag }}
            </span>
            <span
              v-for="tag in scrap.concept_tags"
              :key="tag"
              class="px-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 opacity-50 italic"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Row 3: Additional metadata -->
          <div v-if="scrap.location || scrap.screenshot_url || scrap.shared || scrap.relationships?.length" class="flex flex-wrap gap-2 opacity-60">
            <span v-if="scrap.location">📍 {{ scrap.location }}</span>
            <span v-if="scrap.screenshot_url">🖼️</span>
            <span v-if="scrap.shared">🔗 shared</span>
            <span v-if="scrap.relationships?.length">↔️ {{ scrap.relationships.length }}</span>
          </div>

          <!-- Row 4: Confidence scores -->
          <div v-if="scrap.extraction_confidence" class="opacity-50">
            Conf:
            <span v-if="scrap.extraction_confidence.tags">tags {{ Math.round(scrap.extraction_confidence.tags * 100) }}%</span>
            <span v-if="scrap.extraction_confidence.summary">summary {{ Math.round(scrap.extraction_confidence.summary * 100) }}%</span>
          </div>

          <!-- Row 5: Financial data -->
          <div v-if="scrap.financial_analysis" class="opacity-50">
            💰 financial data present
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'

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
  relationships: any[] | null
  extraction_confidence: any | null
  financial_analysis: any | null
  metadata: any | null
}

const { data: scraps, pending: isLoading, error } = await useFetch<Scrap[]>('/api/scraps')

const stats = computed(() => {
  if (!scraps.value.length) return null
  return {
    total: scraps.value.length,
  }
})

const uniqueTags = computed(() => {
  const tags = new Set<string>()
  scraps.value.forEach((s) => {
    s.tags?.forEach((t) => tags.add(t))
  })
  return tags.size
})

const uniqueSources = computed(() => {
  const sources = new Set<string>()
  scraps.value.forEach((s) => {
    if (s.source) sources.add(s.source)
  })
  return Array.from(sources).join(', ') || 'unknown'
})

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return 'unknown'
  }
}

usePageSeo({
  title: 'Scraps',
  description: 'A collection of interesting things found around the web',
  type: 'website',
  section: 'Content',
})
</script>
