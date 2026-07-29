<script setup lang="ts">
defineProps<{
  error?: { statusCode: number }
}>()

const route = useRoute()

const suggestions = ref<Array<{ title: string; path: string }>>([])

const cleanPath = computed(() => {
  return route.path?.replace(/^\//, '').replace(/\/$/, '') || 'unknown'
})

interface ManifestItem {
  title: string
  slug: string
  hidden?: boolean
  draft?: boolean
}

onMounted(async () => {
  try {
    const manifest = await $fetch<ManifestItem[]>('/api/manifest')
    const items = manifest?.filter((item) => !item.hidden && !item.draft) || []

    const search = cleanPath.value.toLowerCase()
    if (!search || search.length > 80) return

    // Suggest posts whose slug shares words with the mistyped path
    const words = search.split(/[/-]/).filter((w) => w.length > 2)
    if (!words.length) return

    suggestions.value = items
      .map((item) => {
        const slug = (item.slug || '').toLowerCase()
        const hits = words.filter((w) => slug.includes(w)).length
        return { title: item.title, path: `/blog/${item.slug}`, hits }
      })
      .filter((m) => m.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 3)
      .map(({ title, path }) => ({ title, path }))
  } catch {
    // Silently fail
  }
})
</script>

<template>
  <NuxtLayout>
    <div class="space-y-8">
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
