<template>
  <Teleport to="body">
    <transition name="command-palette-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center px-4 pb-12 pt-6 sm:pt-12"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        @keydown.capture="onKeydown"
      >
        <button
          class="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          type="button"
          aria-label="Close command palette"
          @click="closePalette"
        ></button>
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white font-sans shadow-2xl shadow-zinc-900/20 dark:border-zinc-800/80 dark:bg-zinc-900"
        >
          <div
            class="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800"
          >
            <span
              class="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400"
            >
              Command
            </span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search posts, pages, or actions..."
              class="flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            <span
              class="rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-mono text-zinc-400 dark:border-zinc-700"
            >
              ⌘K
            </span>
          </div>

          <div class="max-h-[60vh] overflow-y-auto px-2 py-3 sm:max-h-[65vh]">
            <div
              v-if="sections.length === 0"
              class="px-4 py-10 text-center text-sm text-zinc-500"
            >
              Start typing to search the site.
            </div>

            <div
              v-for="section in sections"
              :key="section.title"
              class="mb-4 last:mb-0"
            >
              <div
                class="px-3 pb-2 text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400"
              >
                {{ section.title }}
              </div>
              <ul class="space-y-1">
                <li v-for="item in section.items" :key="item.id">
                  <button
                    type="button"
                    class="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors"
                    :class="[
                      item.id === activeItemId
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                      item.id === activeItemId
                        ? 'dark:text-zinc-100'
                        : 'dark:text-zinc-300 dark:hover:bg-zinc-800/70',
                    ]"
                    @mouseenter="setActiveItem(item.id)"
                    @click="selectItem(item)"
                  >
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">
                          {{ item.label }}
                        </span>
                        <span
                          v-if="item.meta"
                          class="text-[11px] font-mono text-zinc-400"
                        >
                          {{ item.meta }}
                        </span>
                      </div>
                      <BlogPostMetadata
                        v-if="item.doc"
                        :doc="item.doc"
                        compact
                        class="mt-1"
                      />
                      <p
                        v-if="item.description"
                        class="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                        v-html="item.description"
                      ></p>
                      <div
                        v-if="item.tags?.length"
                        class="mt-2 flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="tag in item.tags"
                          :key="tag"
                          class="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                        >
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                    <span
                      v-if="item.hint"
                      class="text-[11px] font-mono text-zinc-400"
                    >
                      {{ item.hint }}
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            <div v-if="isLoading" class="px-4 py-4 text-xs text-zinc-400">
              Searching with BM25...
            </div>
            <div v-if="errorMessage" class="px-4 py-4 text-xs text-red-500">
              {{ errorMessage }}
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800"
          >
            <span class="font-mono">Enter to open · Esc to close</span>
            <span class="font-mono">↑ ↓ to navigate</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllNav } from '~/composables/useNavigation'
import { useCommandPalette } from '~/composables/useCommandPalette'

const router = useRouter()
const { isOpen, closePalette, togglePalette } = useCommandPalette()

const inputRef = ref(null)
const query = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const searchResults = ref([])
const activeItemId = ref('')

const staticActions = computed(() => {
  const navItems = getAllNav()
  const extraActions = [
    { label: 'Stats Dashboard', href: '/stats', meta: 'Page' },
    { label: 'Gists', href: '/gists', meta: 'Page' },
    { label: 'Gear', href: '/gear', meta: 'Page' },
    { label: 'Predictions', href: '/predictions', meta: 'Page' },
    { label: 'Now', href: '/now', meta: 'Page' },
    { label: 'On This Day', href: '/on-this-day', meta: 'Page' },
    { label: 'Sitemap', href: '/sitemap', meta: 'Page' },
    { label: 'Threads', href: '/threads', meta: 'Page' },
    { label: 'RSS Feed', href: 'https://ejfox.com/rss.xml', external: true },
    { label: 'GitHub', href: 'https://github.com/ejfox', external: true },
    {
      label: 'Twitter / X',
      href: 'https://twitter.com/mrejfox',
      external: true,
    },
    {
      label: 'Mastodon',
      href: 'https://mastodon.social/@ejfox',
      external: true,
    },
    { label: 'Email', href: 'mailto:ejfox@ejfox.com', external: true },
  ]

  return [
    ...navItems.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      href: item.href,
      external: item.external,
      meta: 'Page',
    })),
    ...extraActions.map((item) => ({
      id: `action-${item.href}`,
      ...item,
    })),
  ]
})

const filteredActions = computed(() => {
  if (!query.value.trim()) return staticActions.value
  const q = query.value.toLowerCase()
  return staticActions.value.filter((action) =>
    action.label.toLowerCase().includes(q)
  )
})

const formattedResults = computed(() =>
  searchResults.value.map((result) => ({
    id: `search-${result.slug}`,
    label: result.title,
    href: result.url,
    meta: result.type,
    description: formatSnippet(result.snippet),
    tags: result.tags,
    doc: result.url?.startsWith('/blog/')
      ? {
          metadata: {
            date: result.date,
            words: result.words,
            slug: result.slug,
          },
        }
      : null,
  }))
)

const sections = computed(() => {
  const items = []
  if (filteredActions.value.length > 0) {
    items.push({ title: 'Actions', items: filteredActions.value })
  }
  if (formattedResults.value.length > 0) {
    items.push({ title: 'Results', items: formattedResults.value })
  }
  return items
})

const flatItems = computed(() =>
  sections.value.flatMap((section) => section.items)
)

function setActiveItem(id) {
  activeItemId.value = id
}

function selectItem(item) {
  closePalette()
  if (item.external) {
    window.open(item.href, '_blank', 'noopener')
    return
  }
  router.push(item.href)
}

function onKeydown(event) {
  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const items = flatItems.value
    if (items.length === 0) return
    const currentIndex = items.findIndex(
      (item) => item.id === activeItemId.value
    )
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
    activeItemId.value = items[nextIndex].id
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const items = flatItems.value
    if (items.length === 0) return
    const currentIndex = items.findIndex(
      (item) => item.id === activeItemId.value
    )
    const nextIndex =
      currentIndex <= 0 ? items.length - 1 : (currentIndex - 1) % items.length
    activeItemId.value = items[nextIndex].id
    return
  }

  if (event.key === 'Enter') {
    const active = flatItems.value.find(
      (item) => item.id === activeItemId.value
    )
    if (!active) return
    event.preventDefault()
    selectItem(active)
  }
}

function onGlobalKeydown(event) {
  if (!(event.metaKey || event.ctrlKey)) return
  if (event.key.toLowerCase() !== 'k') return

  const target = event.target
  const isFormField =
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)

  if (isFormField && !isOpen.value) return

  event.preventDefault()
  togglePalette()
}

function resetState() {
  query.value = ''
  searchResults.value = []
  errorMessage.value = ''
  activeItemId.value = filteredActions.value[0]?.id || ''
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatSnippet(value) {
  if (!value) return ''
  const safe = escapeHtml(value)
  return safe.replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>')
}

let searchTimeout
let searchToken = 0

watch(
  query,
  (value) => {
    clearTimeout(searchTimeout)
    errorMessage.value = ''

    if (!value.trim() || value.trim().length < 2) {
      searchResults.value = []
      isLoading.value = false
      activeItemId.value = filteredActions.value[0]?.id || ''
      return
    }

    isLoading.value = true
    const token = ++searchToken

    searchTimeout = setTimeout(async () => {
      try {
        const response = await $fetch('/api/search', {
          query: { q: value.trim(), limit: 8 },
        })

        if (token !== searchToken) return
        searchResults.value = response.results || []
        isLoading.value = false
        const firstItem = flatItems.value[0]?.id
        activeItemId.value = firstItem || ''
      } catch (_error) {
        if (token !== searchToken) return
        isLoading.value = false
        errorMessage.value = 'Search failed. Try again.'
      }
    }, 200)
  },
  { immediate: true }
)

watch(isOpen, async (value) => {
  if (value) {
    resetState()
    await nextTick()
    inputRef.value?.focus()
  } else {
    resetState()
  }
})

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.command-palette-fade-enter-active,
.command-palette-fade-leave-active {
  transition: opacity 0.2s ease;
}

.command-palette-fade-enter-from,
.command-palette-fade-leave-to {
  opacity: 0;
}

mark {
  background: transparent;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 2px;
}
</style>
