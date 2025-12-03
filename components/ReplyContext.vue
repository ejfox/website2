<template>
  <div v-if="urls.length > 0" class="reply-context-container space-y-3 mb-6">
    <div
      v-for="(url, index) in urls"
      :key="url"
      class="reply-context p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
    >
      <ReplyContextItem :url="url" :show-label="index === 0" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  replyTo?: string | string[]
}>()

// Normalize to array
const urls = computed(() => {
  if (!props.replyTo) return []
  if (Array.isArray(props.replyTo)) {
    return props.replyTo.filter(Boolean)
  }
  return [props.replyTo]
})
</script>
