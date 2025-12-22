<template>
  <div
    class="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4"
    @keydown.meta.enter="saveToPinboard(true)"
    @keydown.ctrl.enter="saveToPinboard(true)"
    @keydown.escape="saveToPinboard(false)"
    tabindex="0"
    ref="container"
  >
    <div class="max-w-md mx-auto space-y-4">
      <!-- Header -->
      <header class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-2">
          <img
            v-if="favicon"
            :src="favicon"
            class="w-4 h-4 rounded"
            @error="favicon = ''"
          />
          <span class="text-meta">PINBOARD</span>
        </div>
        <div class="flex items-center gap-3">
          <kbd class="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 px-1 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded">esc</kbd>
          <button
            class="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            @click="saveToPinboard(false)"
          >
            skip &rarr;
          </button>
        </div>
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
      <div v-if="loading" class="py-6 space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                loadingStep >= 1 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
              ]"
            ></div>
            <span
              :class="[
                'text-xs font-mono transition-colors duration-300',
                loadingStep >= 1 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
              ]"
            >
              {{ loadingStep === 1 ? 'fetching tags...' : 'tags loaded' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                loadingStep >= 2 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
              ]"
            ></div>
            <span
              :class="[
                'text-xs font-mono transition-colors duration-300',
                loadingStep >= 2 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
              ]"
            >
              {{ loadingStep === 2 ? 'analyzing content...' : loadingStep > 2 ? 'content analyzed' : 'analyze content' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                loadingStep >= 3 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
              ]"
            ></div>
            <span
              :class="[
                'text-xs font-mono transition-colors duration-300',
                loadingStep >= 3 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
              ]"
            >
              {{ loadingStep >= 3 ? 'generating suggestions...' : 'generate suggestions' }}
            </span>
          </div>
        </div>
        <div class="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out"
            :style="{ width: `${(loadingStep / 3) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions" class="space-y-4">
        <!-- AI Summary -->
        <p
          v-if="suggestions.summary && suggestions.summary !== 'Content added to your digital scrapbook.'"
          class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-zinc-200 dark:border-zinc-700 pl-3"
        >
          {{ suggestions.summary }}
        </p>

        <!-- Step 1: Choose Tags -->
        <section v-if="suggestions.suggested_tags?.length" class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-mono">1</span>
            <span class="text-meta">CHOOSE TAGS</span>
            <div class="flex-1"></div>
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
          <div class="flex flex-wrap gap-1.5 pl-7">
            <button
              v-for="tagObj in suggestions.suggested_tags.slice(0, 8)"
              :key="typeof tagObj === 'string' ? tagObj : tagObj.tag"
              :class="[
                'px-2 py-1 text-xs font-mono rounded transition-all duration-150',
                isTagSelected(tagObj)
                  ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 scale-105'
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

        <!-- Step 2: Add Custom -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono">2</span>
            <span class="text-meta">ADD CUSTOM</span>
            <span class="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">optional</span>
          </div>
          <div class="pl-7">
            <input
              ref="customInput"
              v-model="customTagInput"
              type="text"
              placeholder="type and press space..."
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
          </div>
        </section>

        <!-- Selected Tags Preview -->
        <section v-if="selectedTags.length" class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-mono">{{ selectedTags.length }}</span>
            <span class="text-meta">READY TO SAVE</span>
          </div>
          <div class="flex flex-wrap gap-1.5 pl-7">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono
                     bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
                     rounded animate-in"
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

        <!-- Options -->
        <div class="flex items-center gap-4 pl-7">
          <label class="flex items-center gap-2 cursor-pointer group">
            <input
              v-model="readLater"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600
                     text-zinc-900 dark:text-zinc-100
                     focus:ring-zinc-400 dark:focus:ring-zinc-500
                     bg-white dark:bg-zinc-800"
            />
            <span class="text-xs font-mono text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
              read later
            </span>
          </label>
        </div>

        <!-- Step 3: Save -->
        <section class="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2 mb-3">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono">3</span>
            <span class="text-meta">SAVE</span>
          </div>
          <div class="flex gap-2 pl-7">
            <button
              class="flex-1 px-4 py-2.5 text-sm font-mono
                     bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900
                     rounded
                     hover:bg-zinc-700 dark:hover:bg-zinc-300
                     active:scale-[0.98]
                     transition-all
                     flex items-center justify-center gap-2"
              @click="saveToPinboard(true)"
            >
              <span>Save{{ selectedTags.length ? ` with ${selectedTags.length} tags` : '' }}</span>
              <kbd class="text-[10px] opacity-50 hidden sm:inline px-1 py-0.5 bg-zinc-800 dark:bg-zinc-200 rounded">⌘↵</kbd>
            </button>
            <button
              class="px-4 py-2.5 text-sm font-mono
                     text-zinc-500
                     border border-zinc-200 dark:border-zinc-700
                     rounded
                     hover:border-zinc-400 dark:hover:border-zinc-500
                     hover:text-zinc-700 dark:hover:text-zinc-300
                     active:scale-[0.98]
                     transition-all"
              @click="saveToPinboard(false)"
              title="Save without AI tags"
            >
              Basic
            </button>
          </div>
        </section>

        <!-- Footer info -->
        <div class="flex items-center justify-between text-[10px] font-mono text-zinc-300 dark:text-zinc-700 pl-7">
          <span v-if="suggestions.processing_time_ms">
            analyzed in {{ suggestions.processing_time_ms }}ms
          </span>
          <span v-if="suggestions.cache_hit" class="opacity-50">cached</span>
        </div>

        <!-- Similar Items (collapsed by default) -->
        <details v-if="suggestions.similar_scraps?.length" class="group pl-7">
          <summary class="text-xs font-mono text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            {{ suggestions.similar_scraps.length }} similar items in your archive
          </summary>
          <div class="mt-2 space-y-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <button
              v-for="scrap in suggestions.similar_scraps.slice(0, 4)"
              :key="scrap.id"
              class="block w-full text-left text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors truncate"
              @click="copyTagsFromScrap(scrap)"
              :title="`Click to copy tags: ${(scrap.tags || []).join(', ')}`"
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
        <div class="w-10 h-10 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <span class="text-red-500 text-lg">!</span>
        </div>
        <p class="text-xs font-mono text-red-500 dark:text-red-400">{{ error }}</p>
        <button
          class="px-4 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded hover:border-zinc-500 transition-colors"
          @click="saveToPinboard(false)"
        >
          Continue to Pinboard anyway
        </button>
      </div>

      <!-- Toast -->
      <Transition name="toast">
        <div
          v-if="toast"
          class="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5
                 bg-zinc-900 dark:bg-zinc-100
                 text-zinc-100 dark:text-zinc-900
                 text-xs font-mono rounded shadow-lg"
        >
          {{ toast }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const container = ref(null)
const customInput = ref(null)
const loading = ref(true)
const loadingStep = ref(0)
const suggestions = ref(null)
const error = ref('')
const selectedTags = ref([])
const customTagInput = ref('')
const officialTags = ref([])
const readLater = ref(false)
const toast = ref('')
const favicon = ref('')

const pageUrl = route.query.url || ''
const pageTitle = route.query.title || 'Untitled'
const pageText = route.query.text || ''
const selectedText = route.query.description || ''
const auth = route.query.auth || ''

// Get favicon from URL
if (pageUrl) {
  try {
    const domain = new URL(pageUrl).hostname
    favicon.value = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {}
}

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

const showToast = (msg) => {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 1500)
}

const isOfficialTag = (tag) => officialTags.value.includes(tag)

const isTagSelected = (tagObj) => {
  const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag
  return selectedTags.value.includes(tag)
}

onMounted(async () => {
  // Focus container for keyboard shortcuts
  container.value?.focus()

  if (!pageUrl || !auth) {
    error.value = 'Missing required parameters'
    loading.value = false
    return
  }

  // Step 1: Start loading
  loadingStep.value = 1

  try {
    // Fetch tags first
    const tags = await $fetch('/tags.json').catch(() => [])
    officialTags.value = tags || []
    loadingStep.value = 2

    // Then fetch suggestions
    const response = await $fetch('/api/suggest', {
      query: { url: pageUrl, title: pageTitle, text: pageText, auth },
    })
    loadingStep.value = 3

    // Small delay to show completion
    await new Promise(r => setTimeout(r, 300))

    suggestions.value = response

    // Select ALL suggested tags by default so user can just hit save
    if (response.suggested_tags?.length) {
      selectedTags.value = response.suggested_tags
        .map((t) => (typeof t === 'string' ? t : t.tag))
    }

    // Auto-focus custom input after load
    await nextTick()
    customInput.value?.focus()
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
  let added = 0
  tags.forEach((tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
      added++
    }
  })
  customTagInput.value = ''
  if (added) showToast(`+${added} tag${added > 1 ? 's' : ''}`)
}

const selectAllSuggested = () => {
  let added = 0
  suggestions.value?.suggested_tags?.forEach((tagObj) => {
    const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
      added++
    }
  })
  if (added) showToast(`+${added} tags`)
}

const clearAllTags = () => {
  const count = selectedTags.value.length
  selectedTags.value = []
  if (count) showToast('cleared')
}

const copyTagsFromScrap = (scrap) => {
  const tags = scrap.allTags || scrap.tags || []
  let added = 0
  tags.forEach((tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
      added++
    }
  })
  if (added) showToast(`+${added} from "${scrap.title?.substring(0, 20)}..."`)
}

const saveToPinboard = (useEnhancedTags = false) => {
  const params = new URLSearchParams({ url: pageUrl, title: pageTitle })
  if (selectedText) params.append('description', selectedText)
  if (useEnhancedTags && selectedTags.value.length) {
    params.append('tags', selectedTags.value.join(' '))
  }
  if (readLater.value) params.append('toread', 'yes')
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

<style scoped>
.animate-in {
  animation: pop-in 0.15s ease-out;
}

@keyframes pop-in {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
