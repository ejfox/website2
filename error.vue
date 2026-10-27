<!--
  @file error.vue
  @description Nuxt's error page (every 404/500), inside the default layout.
    Client-side, it fetches /api/manifest and shows up to three "Maybe you
    meant" links from utils/notFoundSuggestions.ts.
    Gotcha: `data-not-found` is what umami-plus keys its `not-found` event on
    (plugins/umami.client.js); keep the attribute. The page shows the same
    404 text whatever the status code.
-->
<script setup lang="ts">
import {
  suggestForPath,
  type SuggestableItem,
} from '~/utils/notFoundSuggestions'

defineProps<{
  error?: { statusCode: number }
}>()

const route = useRoute()

const suggestions = ref<Array<{ title: string; path: string }>>([])

const cleanPath = computed(() => {
  return route.path?.replace(/^\//, '').replace(/\/$/, '') || 'unknown'
})

onMounted(async () => {
  try {
    // /api/manifest already drops drafts, hidden, unlisted and scheduled posts
    const manifest = await $fetch<SuggestableItem[]>('/api/manifest')
    suggestions.value = suggestForPath(route.path || '', manifest || [])
  } catch {
    // Silently fail
  }
})
</script>

<template>
  <NuxtLayout>
    <div class="space-y-8" data-not-found>
      <div class="space-y-2">
        <h1 class="text-xl font-mono tracking-wide">404</h1>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          "{{ cleanPath }}" not found
        </p>
      </div>

      <!-- Suggestions -->
      <div v-if="suggestions.length" class="space-y-3">
        <p
          class="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500"
        >
          Maybe you meant
        </p>
        <div class="space-y-1">
          <a
            v-for="s in suggestions"
            :key="s.path"
            :href="s.path"
            class="block text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {{ s.title }}
          </a>
        </div>
      </div>

      <!-- Navigation -->
      <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <a
          href="/"
          class="block text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          ← home
        </a>
        <a
          href="/blog"
          class="block text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          ← all posts
        </a>
      </div>
    </div>
  </NuxtLayout>
</template>
