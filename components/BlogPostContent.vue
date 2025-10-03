<template>
  <article
    class="prose prose-zinc dark:prose-invert max-w-none"
    v-html="content"
  />
</template>

<script setup lang="ts">
interface Props {
  content: string
}

defineProps<Props>()
</script>