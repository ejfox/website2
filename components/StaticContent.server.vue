<script setup lang="ts">
// Server-only component - renders static HTML without client hydration
// This eliminates JS overhead for content that doesn't need interactivity
// Class is passed through automatically via Vue's attribute fallthrough

defineProps<{
  html: string
}>()
</script>

<template>
  <div v-html="html"></div>
</template>
