<template>
  <div class="flex items-start gap-3">
    <!-- Favicon -->
    <div class="flex-shrink-0 mt-0.5">
      <img
        v-if="ogData?.favicon"
        :src="ogData.favicon"
        :alt="ogData.siteName || domain"
        class="w-5 h-5 rounded"
        @error="handleFaviconError"
      />
      <div
        v-else
        class="w-5 h-5 rounded flex items-center justify-center bg-zinc-300 dark:bg-zinc-700 text-xs font-mono"
      >
        {{ domain?.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-grow min-w-0">
      <!-- Header: "In reply to" + site name -->
      <div class="flex items-baseline gap-2 flex-wrap mb-2">
        <span
          v-if="showLabel"
          class="text-xs font-mono uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          In reply to
        </span>
        <span class="text-xs text-zinc-600 dark:text-zinc-300">
          {{ ogData?.author || ogData?.siteName || domain }}
        </span>
        <span v-if="ogData?.published" class="text-xs text-zinc-400">
          · {{ formatDate(ogData.published) }}
        </span>
      </div>

      <!-- Title (linked) -->
      <a
        :href="url"
        target="_blank"
        rel="noopener"
        class="u-in-reply-to h-cite block group"
      >
        <span
          v-if="ogData?.title"
          class="text-base font-serif transition-colors duration-150 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        >
          {{ ogData.title }}
        </span>
        <span
          v-else
          class="text-sm font-mono break-all text-blue-600 dark:text-blue-400"
        >
          {{ url }}
        </span>
      </a>

      <!-- Description -->
      <p
        v-if="ogData?.description"
        class="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2"
      >
        {{ truncate(ogData.description, 160) }}
      </p>

      <!-- OG Image (small, optional) -->
      <img
        v-if="ogData?.image && showImage"
        :src="ogData.image"
        :alt="ogData.title || 'Preview'"
        class="mt-4 rounded max-h-32 object-cover"
        @error="showImage = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'

interface OGData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
  author?: string
  published?: string
  type?: string
}

const props = defineProps<{
  url: string
  showLabel?: boolean
}>()

const showImage = ref(true)

// Extract domain from URL
const domain = computed(() => {
  if (!props.url) return null
  try {
    return new URL(props.url).hostname.replace('www.', '')
  } catch {
    return null
  }
})

// Fetch OG data
const { data: ogData } = await useFetch<OGData>('/api/og', {
  query: { url: props.url },
  immediate: !!props.url,
  default: () => null,
})

const handleFaviconError = (e: Event) => {
  const img = e.target as HTMLImageElement
  // Fallback to Google's favicon service
  if (domain.value && !img.src.includes('google.com/s2/favicons')) {
    img.src = `https://www.google.com/s2/favicons?domain=${domain.value}&sz=64`
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

const truncate = (str: string, len: number) => {
  if (!str || str.length <= len) return str
  return str.slice(0, len).trim() + '…'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
