<script setup>
import { animate, stagger } from '~/anime.esm.js'
const { getPostBySlug } = useProcessedMarkdown()

const { data: indexContent, error } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

if (error.value) {
  // Consider replacing this with a more appropriate error handling method
  // console.error('Error fetching index content:', error.value)
}

const indexContentContainer = ref(null)

onMounted(async () => {
  // Wait for the next tick to ensure content is rendered
  await nextTick()

  if (indexContentContainer.value) {
    const links = indexContentContainer.value.querySelectorAll('a')
    if (links.length > 0) {
      animate(links, {
        opacity: [0.82, 1],
        borderColor: ['rgba(0,0,0,0)', '#CCC', '#FFF'],
        ease: 'easeOutQuad',
        duration: 5500,
        delay: stagger(1200),
      })
    }
  }
})
</script>

<template>
  <div id="index"
    class="container mx-auto px-4 py-8 text-3xl leading-loose prose dark:prose-invert prose-a:no-underline">
    <template v-if="indexContent">
      <h1>{{ indexContent.title }}</h1>
      <div ref="indexContentContainer" id="index-content" v-html="indexContent.content"></div>
    </template>
    <div v-else-if="error">Error loading content: {{ error.message }}</div>
    <div v-else>Loading...</div>
  </div>
</template>

<style scoped>
#index h1 {
  display: none;
}

:deep(#index-content a) {
  @apply border-b-2 border-dashed border-gray-500 hover:border-gray-400 dark:border-gray-400 dark:hover:border-gray-300;
}
</style>
