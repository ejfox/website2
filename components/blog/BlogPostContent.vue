<!--
  @file BlogPostContent.vue
  @description <article> that v-html's pre-rendered post HTML with Tailwind
    prose styling. Used by pages/projects/[slug].vue (blog posts render their
    own article markup). The HTML comes from our own build pipeline
    (scripts/build/processMarkdown.mjs), which is why v-html is acceptable.
  @props content: string - HTML to render
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
