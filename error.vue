<template>
  <NuxtLayout>
    <ErrorPage
      :path="route?.path || 'unknown'"
      :suggestions="smartSuggestions"
      :primary-link="{ href: '/blog', text: 'browse all posts' }"
    />
  </NuxtLayout>
</template>

<script setup>
const route = useRoute()

// Props passed by Nuxt error handling
const props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const smartSuggestions = ref([])

// Distance function for fuzzy matching
const distance = (a, b) => {
  if (!a || !b) return 999
  const [len1, len2] = [a.length, b.length]
  if (len1 === 0) return len2
  if (len2 === 0) return len1

  let prev = Array(len2 + 1)
    .fill(0)
    .map((_, i) => i)

  for (let i = 1; i <= len1; i++) {
    const curr = [i]
    for (let j = 1; j <= len2; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : Math.min(prev[j - 1], prev[j], curr[j - 1]) + 1
    }
    prev = curr
  }
  return prev[len2]
}

// Load suggestions when page loads
onMounted(async () => {
  const path = route?.path || ''

  try {
    const data = await $fetch('/api/manifest')
    const allContent = (data || []).filter(
      (item) => !item.hidden && !item.draft
    )

    if (path && path !== '/' && props.error.statusCode === 404) {
      const cleanPath = path.replace(/^\//, '').toLowerCase()

      if (cleanPath.length > 0 && cleanPath.length < 100) {
        const matches = allContent
          .map((item) => ({
            title: item.title,
            path: item.slug.startsWith('20')
              ? `/blog/${item.slug}`
              : `/blog/${item.slug}`,
            score: Math.max(
              50 - distance(item.slug?.replace(/^\d{4}\//, ''), cleanPath),
              30 -
                distance(
                  item.title?.toLowerCase().replace(/\s+/g, '-'),
                  cleanPath
                )
            )
          }))
          .filter((p) => p.score > 10)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        smartSuggestions.value = matches
      }
    }

    // DELETE: No fallback suggestions if nothing matches
  } catch (error) {
    console.error('Error loading suggestions:', error)
    // DELETE: No fallback suggestions on error either
  }
})
</script>
