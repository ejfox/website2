<script setup lang="ts">
// Server-only component - renders static HTML without client hydration
// This eliminates JS overhead for content that doesn't need interactivity

defineProps<{
  html: string
  class?: string
}>()
</script>

<template>
  <div :class="class" v-html="html"></div>
</template>
