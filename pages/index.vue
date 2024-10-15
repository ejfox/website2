<script setup>
import { animate, stagger } from '~/anime.esm.js'
const { getPostBySlug } = useProcessedMarkdown()

const { data: indexContent, error } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

console.log('Index content:', indexContent.value)
if (error.value) {
  console.error('Error fetching index content:', error.value)
}

// Add this logging
watch(indexContent, (newValue) => {
  console.log('indexContent changed:', newValue)
}, { immediate: true })

const indexContentContainer = ref(null)

onMounted(() => {
  console.log('Component mounted, indexContent:', indexContent.value)
  if (indexContentContainer.value) {
    animate(indexContentContainer.value.querySelectorAll('a'), {
      opacity: [0.82, 1],
      borderColor: ['rgba(0,0,0,0)', '#CCC', '#FFF'],
      easing: 'easeOutQuad',
      duration: 5500,
      delay: stagger(1200),
    })
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
