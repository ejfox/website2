<!--
  @file PostRelated.vue
  @description Related posts section based on overlapping tags
  @props relatedPosts - array of { post, overlappingTags }
-->
<template>
  <div
    v-if="relatedPosts.length > 0"
    class="px-4 md:px-6 py-8 border-t border-zinc-200 dark:border-zinc-800"
  >
    <h2 class="font-mono text-xs uppercase tracking-[0.15em] text-zinc-500 mb-4">
      Related Posts
    </h2>
    <div class="stack-4">
      <div
        v-for="{ post, overlappingTags } in relatedPosts"
        :key="post.slug"
      >
        <NuxtLink :to="`/blog/${post.slug}`" class="block no-underline">
          <div class="font-serif text-base text-zinc-900 dark:text-zinc-100 mb-2">
            {{ post.title || post.metadata?.title }}
          </div>
          <div class="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span>{{ formatLongDate(post.date || post.metadata?.date) }}</span>
            <span>·</span>
            <span class="text-zinc-400">{{ overlappingTags.join(', ') }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { formatLongDate } = useDateFormat()

defineProps<{
  relatedPosts: Array<{
    post: { slug: string; title?: string; date?: string; metadata?: any }
    overlappingTags: string[]
  }>
}>()
</script>
