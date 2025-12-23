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

<script setup lang="ts">
const route = useRoute()

defineProps<{
  error?: { statusCode: number }
}>()

const suggestions = ref<Array<{ title: string; path: string }>>([])

const cleanPath = computed(() => {
  return route.path?.replace(/^\//, '').replace(/\/$/, '') || 'unknown'
})

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) +
            1
    }
  }
  return matrix[b.length][a.length]
}

interface ManifestItem {
  title: string
  slug: string
  hidden?: boolean
  draft?: boolean
}

interface ScoredMatch {
  title: string
  path: string
  score: number
}

onMounted(async () => {
  try {
    const manifest = await $fetch<ManifestItem[]>('/api/manifest')
    const items =
      manifest?.filter((item) => !item.hidden && !item.draft) || []

    const search = cleanPath.value.toLowerCase()
    if (!search || search.length > 80) return

    const matches: ScoredMatch[] = items
      .map((item) => ({
        title: item.title,
        path: `/blog/${item.slug}`,
        score: -levenshtein(item.slug || '', search),
      }))
      .filter((m) => m.score > -20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    suggestions.value = matches
  } catch {
    // Silently fail
  }
})
</script>
