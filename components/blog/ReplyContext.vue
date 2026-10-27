<!--
  @file ReplyContext.vue
  @description "In reply to" box(es) above a post that replies to other URLs
    (frontmatter replyTo or in-reply-to). Normalises one URL or a list, then renders a
    BlogReplyContextItem per URL; only the first shows the label.
    Used by pages/blog/[...slug].vue.
  @props replyTo?: string | string[] - URL(s) being replied to; falsy entries dropped
-->
<script setup lang="ts">
const props = defineProps<{
  replyTo?: string | string[]
}>()

const urls = computed(() => {
  if (!props.replyTo) return []
  if (Array.isArray(props.replyTo)) {
    return props.replyTo.filter(Boolean)
  }
  return [props.replyTo]
})
</script>

<template>
  <div v-if="urls.length > 0" class="reply-context-container space-y-3 mb-6">
    <div
      v-for="(url, index) in urls"
      :key="url"
      class="reply-context p-4 rounded-lg border bg-zinc-50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800"
    >
      <BlogReplyContextItem :url="url" :show-label="index === 0" />
    </div>
  </div>
</template>
