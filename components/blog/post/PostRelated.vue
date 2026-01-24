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
    <h2 class="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
      Related Posts
    </h2>
    <div class="space-y-4">
      <div
        v-for="{ post, overlappingTags } in relatedPosts"
        :key="post.slug"
      >
        <NuxtLink :to="`/blog/${post.slug}`" class="block no-underline">
          <div class="text-base text-zinc-900 dark:text-zinc-100 leading-snug">
            {{ post.title || post.metadata?.title }}
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{{ formatLongDate(post.date || post.metadata?.date) }}</span>
            <span>·</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in overlappingTags"
                :key="tag"
                class="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                {{ tag }}
              </span>
            </div>
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
