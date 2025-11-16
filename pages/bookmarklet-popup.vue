<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-2">
    <div class="max-w-lg mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-sm font-mono text-zinc-900 dark:text-zinc-100">
            Enhanced Pinboard Save
          </h1>
          <button class="link-text-hover" @click="saveToPinboard(false)">
            skip →
          </button>
        </div>

        <!-- URL Display -->
        <div
          class="text-lg font-mono text-zinc-900 dark:text-zinc-100 mb-2 break-all leading-tight"
        >
          {{ pageUrl }}
        </div>

        <!-- Page Info -->
        <div class="text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1">
          {{ pageTitle }}
        </div>

        <!-- Description -->
        <div
          v-if="selectedText"
          class="text-xs text-zinc-500 dark:text-zinc-500 italic"
        >
          "{{ selectedText.substring(0, 120)
          }}{{ selectedText.length > 120 ? '...' : '' }}"
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          analyzing...
        </div>
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions" class="stack-4">
        <!-- Suggested Tags -->
        <div v-if="suggestions.suggested_tags?.length">
          <div class="text-xs font-mono text-zinc-900 dark:text-zinc-100 mb-2">
            suggested:
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <button
              v-for="tagObj in suggestions.suggested_tags.slice(0, 8)"
              :key="typeof tagObj === 'string' ? tagObj : tagObj.tag"
              class="px-2 py-1 text-xs border transition-colors relative group font-mono"
              :class="
                selectedTags.includes(
                  typeof tagObj === 'string' ? tagObj : tagObj.tag
                )
                  ? 'bg-zinc-900 border-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900'
                  : 'bg-transparent border-zinc-300 text-zinc-700 hover:border-zinc-900 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-100'
              "
              :title="typeof tagObj === 'object' ? tagObj.details : ''"
              @click="
                toggleTag(typeof tagObj === 'string' ? tagObj : tagObj.tag)
              "
            >
              <span class="flex items-center gap-1 font-mono">
                {{ typeof tagObj === 'string' ? tagObj : tagObj.tag }}
                <span
                  v-if="typeof tagObj === 'object' && tagObj.frequency > 0"
                  class="text-xs opacity-40 -ml-1"
                >
                  <sup>{{ tagObj.frequency }}</sup>
                </span>
                <span
                  v-if="
                    isOfficialTag(
                      typeof tagObj === 'string' ? tagObj : tagObj.tag
                    )
                  "
                  class="text-xs opacity-50"
                >
                  *
                </span>
              </span>

              <!-- Tooltip -->
              <div v-if="typeof tagObj === 'object'" class="tooltip-label">
                {{ tagObj.details }}
              </div>
            </button>
          </div>
          <div class="flex gap-2">
            <button class="link-mono-xs" @click="selectAllSuggested">
              all
            </button>
            <button class="link-mono-xs" @click="clearAllTags">clear</button>
          </div>
        </div>

        <!-- Custom Tags Input -->
        <div>
          <div class="text-xs font-mono text-zinc-900 dark:text-zinc-100 mb-2">
            custom:
          </div>
          <input
            v-model="customTagInput"
            placeholder="space separated tags..."
            class="input-sm"
            @keydown.enter="addCustomTag"
            @keydown.space="addCustomTag"
          />
          <div v-if="selectedTags.length" class="mt-2">
            <div
              class="text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-1"
            >
              selected:
            </div>
            <div class="flex flex-wrap gap-1">
              <span v-for="tag in selectedTags" :key="tag" class="tag-btn">
                {{ tag }}
                <button
                  class="hover:opacity-70 text-xs"
                  @click="removeTag(tag)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 mt-4">
          <button class="btn-action" @click="saveToPinboard(true)">
            save {{ selectedTags.length ? `(${selectedTags.length})` : '' }}
          </button>
          <button class="btn-secondary" @click="saveToPinboard(false)">
            basic
          </button>
        </div>

        <!-- Similar Items -->
        <div v-if="suggestions.similar_scraps?.length" class="mt-4 opacity-50">
          <div class="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">
            similar
            <span class="opacity-60"
              >({{ suggestions.similar_scraps.length }})</span
            >:
          </div>
          <div class="stack-1">
            <div
              v-for="scrap in suggestions.similar_scraps.slice(0, 6)"
              :key="scrap.id"
              class="scrap-link"
              @click="copyTagsFromScrap(scrap)"
            >
              {{ scrap.title?.substring(0, 240)
              }}{{ scrap.title?.length > 240 ? '...' : '' }}
              <span v-if="scrap.tags?.length" class="opacity-60">
                [{{ scrap.tags.join(' ') }}]
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-4">
        <div class="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
          error: {{ error }}
        </div>
        <button class="btn-secondary" @click="saveToPinboard(false)">
          continue to pinboard
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

// Get URL parameters
const pageUrl = route.query.url || ''
const pageTitle = route.query.title || 'Untitled'
const pageText = route.query.text || ''
const selectedText = route.query.description || ''
const auth = route.query.auth || ''

// Helper function to check if tag is in official list
const isOfficialTag = (tag) => {
  return officialTags.value.includes(tag)
}

// Fetch suggestions on mount
onMounted(async () => {
  // Load official tags
  try {
    const tags = await $fetch('/tags.json')
    officialTags.value = tags || []
  } catch (err) {
    console.warn('Failed to load official tags:', err)
  }
  if (!pageUrl || !auth) {
    error.value = 'Missing required parameters'
    loading.value = false
    return
  }

  try {
    const response = await $fetch('/api/suggest', {
      query: {
        url: pageUrl,
        title: pageTitle,
        text: pageText,
        auth: auth
      }
    })

    suggestions.value = response

    // Pre-select top 3 suggested tags
    if (response.suggested_tags?.length) {
      const tagsToSelect = response.suggested_tags
        .slice(0, 3)
        .map((tagObj) => (typeof tagObj === 'string' ? tagObj : tagObj.tag))
      selectedTags.value = tagsToSelect
    }
  } catch (err) {
    error.value = err.data?.message || 'Failed to load suggestions'
  } finally {
    loading.value = false
  }
})

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const removeTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const addCustomTag = () => {
  const tags = customTagInput.value
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.length > 0)
  tags.forEach((tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  })
  customTagInput.value = ''
}

const selectAllSuggested = () => {
  if (suggestions.value?.suggested_tags) {
    suggestions.value.suggested_tags.forEach((tagObj) => {
      const tag = typeof tagObj === 'string' ? tagObj : tagObj.tag
      if (!selectedTags.value.includes(tag)) {
        selectedTags.value.push(tag)
      }
    })
  }
}

const clearAllTags = () => {
  selectedTags.value = []
}

const copyTagsFromScrap = (scrap) => {
  // Use allTags if available (contains all original tags), fallback to tags (shared tags only)
  const tagsToAdd = scrap.allTags || scrap.tags
  if (tagsToAdd && Array.isArray(tagsToAdd)) {
    tagsToAdd.forEach((tag) => {
      if (!selectedTags.value.includes(tag)) {
        selectedTags.value.push(tag)
      }
    })
  }
}

const saveToPinboard = (useEnhancedTags = false) => {
  const url = 'https://pinboard.in/add'
  const params = new URLSearchParams({
    url: pageUrl,
    title: pageTitle
  })

  if (selectedText) {
    params.append('description', selectedText)
  }

  if (useEnhancedTags && selectedTags.value.length > 0) {
    params.append('tags', selectedTags.value.join(' '))
  }

  // Open Pinboard in the same window to replace this popup
  window.location.href = `${url}?${params.toString()}`
}

// Use simple layout without sidebar
definePageMeta({
  layout: 'simple'
})

useSeoMeta({
  title: 'Pinboard Enhancement',
  robots: 'noindex, nofollow'
})
</script>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.5);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 0.7);
  }
}
</style>
