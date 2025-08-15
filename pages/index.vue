<script setup>
import NextAvailableSlot from '~/components/NextAvailableSlot.vue'

const { getPostBySlug, getAllPosts: _getAllPosts } = useProcessedMarkdown()

const { data: indexContent, pending: _indexPending } = await useAsyncData(
  'index-content',
  () => getPostBySlug('index')
)

// Mount dynamic calendar component into placeholder
const calendarSlotMounted = ref(false)

onMounted(() => {
  nextTick(() => {
    const placeholder = document.querySelector('#next-available-spot')
    if (placeholder) {
      calendarSlotMounted.value = true
    }
  })
})

// SEO and performance optimization
useHead({
  title: 'EJ Fox - Hacker, Journalist, Data Visualization Specialist',
  meta: [
    { name: 'description', content: 'EJ Fox: Using code + art to uncover hidden patterns. Data visualization, journalism, and technology for good.' }
  ]
})
</script>

<template>
  <main class="p-4 md:p-8">
    <!-- Content -->
    <div class="max-w-3xl space-y-8">
      <template v-if="indexContent">
        <h1>{{ indexContent.title }}</h1>
        <div
          id="index-content"
          class="prose prose-lg dark:prose-invert"
          v-html="indexContent.html"
        ></div>
      </template>
    </div>
    
    <!-- Teleport dynamic calendar slot into markdown placeholder -->
    <teleport v-if="calendarSlotMounted" to="#next-available-spot">
      <NextAvailableSlot />
    </teleport>
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
