<script setup>
const { getPostBySlug, getAllPosts: _getAllPosts } = useProcessedMarkdown()

const { data: indexContent, pending: _indexPending } = await useAsyncData(
  'index-content',
  () => getPostBySlug('index')
)

// const { data: posts, pending: postsPending } = await useAsyncData('posts', () =>
//   getAllPosts()
// )

// Combine the pending states
// const pending = computed(() => indexPending.value || postsPending.value)
</script>

<template>
  <main class="p-4 md:p-8">
    <!-- Loading State -->
    <div v-if="pending" class="max-w-3xl space-y-8"></div>

    <!-- Content State -->
    <div v-else class="max-w-3xl space-y-8">
      <template v-if="indexContent">
        <h1>{{ indexContent.title }}</h1>
        <div
          id="index-content"
          class="prose prose-lg dark:prose-invert"
          v-html="indexContent.html"
        ></div>
      </template>
      <div v-else class="text-center py-12">
        Loading...
      </div>
    </div>
  </main>
</template>

<style scoped>
#index h1 {
  display: none;
}

:deep(#index-content) {
  @apply text-lg leading-relaxed;
}

:deep(#index-content p) {
  @apply my-4;
}

/* :deep(#index-content a) { */
/*   @apply border-b border-zinc-400 dark:border-zinc-600 */
/*          hover:border-zinc-700 dark:hover:border-zinc-300 */
/*          transition-colors duration-300 */
/*          px-0.5 py-0.5 */
/*          text-zinc-900 dark:text-zinc-100 */
/*          no-underline; */
/* } */

:deep(#index-content h2) {
  @apply text-2xl font-bold mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply text-xl font-semibold mt-6 mb-3;
}

:deep(#index-content ul) {
  @apply list-disc pl-6 my-4;
}

:deep(#index-content li) {
  @apply mb-2;
}

:deep(#index-content strong) {
  @apply font-semibold text-zinc-900 dark:text-zinc-100;
}
</style>
