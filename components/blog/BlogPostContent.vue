<!--
  @file BlogPostContent.vue
  @description Simple wrapper component for rendering blog post HTML content with prose styling
  @props content: string - HTML content to render
-->
<script setup lang="ts">
interface Props {
  content: string
}

defineProps<Props>()
</script>

<template>
  <article
    class="prose prose-zinc dark:prose-invert max-w-none"
    v-html="content"
  />
</template>
