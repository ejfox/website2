<script setup>
const processedMarkdown = useProcessedMarkdown()

const { data: indexContent } = await useAsyncData('index-content', () =>
  processedMarkdown.getPostBySlug('index') // or '!index' if that's how it's stored
)
</script>

<template>
  <div class="container mx-auto px-4 py-4 text-3xl leading-loose dark:prose-invert">
    <div v-if="indexContent">
      <h1>{{ indexContent.title }}</h1>
      <div v-html="indexContent.content"></div>
    </div>
  </div>
</template>
<style scoped>
h1 {
  /* visibility: hidden; */
  display: none;
}
</style>