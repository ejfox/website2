<!--
  @file PostNav.vue
  @description Previous/Next post navigation for blog posts
  @props prevPost, nextPost - post objects with slug, title, date
-->
<template>
  <div v-if="prevPost || nextPost" class="grid-post-nav">
    <div v-if="prevPost" class="order-2 sm:order-1">
      <NuxtLink :to="`/blog/${prevPost.slug}`" class="post-nav-link">
        <span class="post-nav-label">← Previous</span>
        <span class="post-nav-title">{{ prevPost.title }}</span>
        <span class="nav-date">{{ formatLongDate(prevPost.date) }}</span>
      </NuxtLink>
    </div>
    <div v-else class="order-2 sm:order-1"></div>

    <div v-if="nextPost" class="order-1 sm:order-2 sm:text-right">
      <NuxtLink :to="`/blog/${nextPost.slug}`" class="post-nav-link">
        <span class="post-nav-label">Next →</span>
        <span class="post-nav-title">{{ nextPost.title }}</span>
        <span class="nav-date">{{ formatLongDate(nextPost.date) }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { formatLongDate } = useDateFormat()

defineProps<{
  prevPost?: { slug: string; title: string; date: string } | null
  nextPost?: { slug: string; title: string; date: string } | null
}>()
</script>

<style scoped>
.nav-date {
  @apply block text-sm sm:text-xs font-mono text-zinc-400 leading-5 sm:leading-4 mt-2;
}
</style>
