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
.grid-post-nav {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4 py-6;
  @apply border-t border-zinc-200 dark:border-zinc-800;
}

.post-nav-link {
  @apply block p-4 rounded transition-colors;
  @apply hover:bg-zinc-100 dark:hover:bg-zinc-800;
}

.post-nav-label {
  @apply block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1;
}

.post-nav-title {
  @apply block font-serif text-base text-zinc-800 dark:text-zinc-200;
}

.nav-date {
  @apply block text-xs font-mono text-zinc-400 mt-1;
}
</style>
