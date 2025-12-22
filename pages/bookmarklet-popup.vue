<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
    <div class="max-w-md mx-auto space-y-4">
      <!-- Header -->
      <header class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <span class="text-meta">PINBOARD</span>
        <button
          class="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          @click="saveToPinboard(false)"
        >
          skip &rarr;
        </button>
      </header>

      <!-- URL + Title -->
      <div class="space-y-1">
        <a
          :href="pageUrl"
          target="_blank"
          class="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 block truncate"
          :title="pageUrl"
        >
          {{ truncateUrl(pageUrl, 50) }}
        </a>
        <h1 class="font-serif text-lg text-zinc-900 dark:text-zinc-100 leading-snug">
          {{ pageTitle }}
        </h1>
        <p
          v-if="selectedText"
          class="text-sm text-zinc-500 dark:text-zinc-400 italic line-clamp-2"
        >
          "{{ selectedText }}"
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-8 text-center">
        <div class="inline-block w-4 h-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin"></div>
        <p class="text-xs font-mono text-zinc-400 mt-2">analyzing...</p>
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions" class="space-y-4">
        <!-- Suggested Tags -->
        <section v-if="suggestions.suggested_tags?.length">
          <div class="flex items-center justify-between mb-2">
            <span class="text-meta">SUGGESTED</span>
            <div class="flex gap-2">
              <button
                class="text-xs font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                @click="selectAllSuggested"
              >
                +all
              </button>
              <button
                class="text-xs font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                @click="clearAllTags"
              >
                clear
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tagObj in suggestions.suggested_tags.slice(0, 8)"
              :key="typeof tagObj === 'string' ? tagObj : tagObj.tag"
              :class="[
                'px-2 py-1 text-xs font-mono rounded transition-all',
                isTagSelected(tagObj)
                  ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              ]"
              @click="toggleTag(typeof tagObj === 'string' ? tagObj : tagObj.tag)"
            >
              {{ typeof tagObj === 'string' ? tagObj : tagObj.tag }}
              <span
                v-if="isOfficialTag(typeof tagObj === 'string' ? tagObj : tagObj.tag)"
                class="opacity-50"
              >*</span>
            </button>
          </div>
        </section>

        <!-- Custom Tags -->
        <section>
          <label class="text-meta block mb-2">CUSTOM</label>
          <input
            v-model="customTagInput"
            type="text"
            placeholder="add tags..."
            class="w-full px-3 py-2 text-sm font-mono
                   bg-white dark:bg-zinc-900
                   border border-zinc-200 dark:border-zinc-700
                   rounded
                   text-zinc-900 dark:text-zinc-100
                   placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                   focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500
                   transition-shadow"
            @keydown.enter.prevent="addCustomTag"
            @keydown.space.prevent="addCustomTag"
          />
        </section>

        <!-- Selected Tags -->
        <section v-if="selectedTags.length">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-meta">SELECTED</span>
            <span class="text-xs font-mono text-zinc-400">{{ selectedTags.length }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono
                     bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
                     rounded"
            >
              {{ tag }}
              <button
                class="opacity-60 hover:opacity-100 transition-opacity"
                @click="removeTag(tag)"
              >
                &times;
              </button>
            </span>
          </div>
        </section>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <button
            class="flex-1 px-4 py-2.5 text-sm font-mono
                   bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
                   rounded
                   hover:bg-zinc-700 dark:hover:bg-zinc-300
                   active:scale-[0.98]
                   transition-all"
            @click="saveToPinboard(true)"
          >
            Save{{ selectedTags.length ? ` (${selectedTags.length})` : '' }}
          </button>
          <button
            class="px-4 py-2.5 text-sm font-mono
                   text-zinc-600 dark:text-zinc-400
                   border border-zinc-200 dark:border-zinc-700
                   rounded
                   hover:border-zinc-400 dark:hover:border-zinc-500
                   active:scale-[0.98]
                   transition-all"
            @click="saveToPinboard(false)"
          >
            Basic
          </button>
        </div>

        <!-- Similar Items (collapsed by default) -->
        <details v-if="suggestions.similar_scraps?.length" class="group">
          <summary class="text-xs font-mono text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            Similar ({{ suggestions.similar_scraps.length }})
          </summary>
          <div class="mt-2 space-y-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <button
              v-for="scrap in suggestions.similar_scraps.slice(0, 4)"
              :key="scrap.id"
              class="block w-full text-left text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors truncate"
              @click="copyTagsFromScrap(scrap)"
            >
              {{ scrap.title }}
              <span v-if="scrap.tags?.length" class="text-zinc-400">
                [{{ scrap.tags.slice(0, 3).join(' ') }}]
              </span>
            </button>
          </div>
        </details>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-6 text-center space-y-3">
        <p class="text-xs font-mono text-red-500 dark:text-red-400">{{ error }}</p>
        <button
          class="px-4 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded hover:border-zinc-500 transition-colors"
          @click="saveToPinboard(false)"
        >
          Continue to Pinboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const loading = ref(true)
const suggestions = ref(null)
const error = ref('')
const selectedTags = ref([])
const customTagInput = ref('')
const officialTags = ref([])

const pageUrl = route.query.url || ''
const pageTitle = route.query.title || 'Untitled'
const pageText = route.query.text || ''
const selectedText = route.query.description || ''
const auth = route.query.auth || ''

const truncateUrl = (url, max) => {
  if (!url || url.length <= max) return url
  try {
    const parsed = new URL(url)
    const path = parsed.pathname + parsed.search
    const domain = parsed.hostname.replace('www.', '')
    if (domain.length + path.length <= max) return domain + path
    return domain + path.substring(0, max - domain.length - 3) + '...'
  } catch {
    return url.substring(0, max) + '...'
  }
}

const isOfficialTag = (tag) => officialTags.value.includes(tag)

const isTagSelected = (tagObj) => {
  const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag
  return selectedTags.value.includes(tag)
}

onMounted(async () => {
  if (!pageUrl || !auth) {
    error.value = 'Missing required parameters'
    loading.value = false
    return
  }

  try {
    const [tags, response] = await Promise.all([
      $fetch('/tags.json').catch(() => []),
      $fetch('/api/suggest', {
        query: { url: pageUrl, title: pageTitle, text: pageText, auth },
      }),
    ])

    officialTags.value = tags || []
    suggestions.value = response

    if (response.suggested_tags?.length) {
      selectedTags.value = response.suggested_tags
        .slice(0, 3)
        .map((t) => (typeof t === 'string' ? t : t.tag))
    }
  } catch (err) {
    error.value = err.data?.message || 'Failed to load suggestions'
  } finally {
    loading.value = false
  }
})

const toggleTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
}

const removeTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx > -1) selectedTags.value.splice(idx, 1)
}

const addCustomTag = () => {
  const tags = customTagInput.value.trim().split(/\s+/).filter(Boolean)
  tags.forEach((tag) => {
    if (!selectedTags.value.includes(tag)) selectedTags.value.push(tag)
  })
  customTagInput.value = ''
}

const selectAllSuggested = () => {
  suggestions.value?.suggested_tags?.forEach((tagObj) => {
    const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag
    if (!selectedTags.value.includes(tag)) selectedTags.value.push(tag)
  })
}

const clearAllTags = () => {
  selectedTags.value = []
}

const copyTagsFromScrap = (scrap) => {
  const tags = scrap.allTags || scrap.tags || []
  tags.forEach((tag) => {
    if (!selectedTags.value.includes(tag)) selectedTags.value.push(tag)
  })
}

const saveToPinboard = (useEnhancedTags = false) => {
  const params = new URLSearchParams({ url: pageUrl, title: pageTitle })
  if (selectedText) params.append('description', selectedText)
  if (useEnhancedTags && selectedTags.value.length) {
    params.append('tags', selectedTags.value.join(' '))
  }
  window.location.href = `https://pinboard.in/add?${params.toString()}`
}

definePageMeta({ layout: 'bookmarklet' })

usePageSeo({
  title: 'Pinboard enhancement popup',
  description: 'Lightweight popup for smart tagging before saving to Pinboard.',
  type: 'website',
  section: 'Tools',
  tags: ['Pinboard', 'Bookmarklet', 'Tags'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
