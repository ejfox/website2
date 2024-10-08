<script setup>
import { animate, stagger, svg } from '~/anime.esm.js'
const processedMarkdown = useProcessedMarkdown()

const { data: indexContent } = await useAsyncData('index-content', () =>
  processedMarkdown.getPostBySlug('index') // or '!index' if that's how it's stored
)

const indexContentContainer = ref(null)
onMounted(() => {
  animate(indexContentContainer.value.querySelectorAll('a'), {
    opacity: [0.82, 1],
    borderColor: ['rgba(0,0,0,0)', '#CCC', '#FFF'],
    // loop: true,
    ease: 'easeOutQuad',
    duration: 5500,
    delay: stagger(1200),
  })
})
</script>

<template>
  <div id="index"
    class="container mx-auto px-4 py-8 text-3xl leading-loose prose dark:prose-invert prose-a:no-underline">
    <h1>{{ indexContent.title }}</h1>
    <div ref="indexContentContainer" id="index-content" v-html="indexContent.content"></div>
  </div>
</template>
<style>
#index h1 {
  /* visibility: hidden; */
  display: none;
}

#index-content a {
  /* text-decoration: wavy underline !important; */
  @apply border-b-2 border-dashed border-gray-500 hover:border-gray-400 dark:border-gray-400 dark:hover:border-gray-300;
}
</style>