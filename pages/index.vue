<script setup>
// Lazy load calendar component for faster FCP
const NextAvailableSlot = defineAsyncComponent(
  () => import('~/components/NextAvailableSlot.vue')
)

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
    {
      name: 'description',
      content:
        'EJ Fox: Using code + art to uncover hidden patterns. Data visualization, journalism, and technology for good.'
    }
  ]
})
</script>

<template>
  <main class="px-4 md:px-8 h-card">
    <!-- Content -->
    <div style="max-width: 65ch">
      <template v-if="indexContent">
        <!-- Data overlay -->
        <div
          class="font-mono text-xs text-zinc-400 mb-4 mt-8"
          style="font-variant-numeric: tabular-nums"
        >
          <span>INDEX</span>
          <span class="mx-2">·</span>
          <span>{{ new Date().toISOString().split('T')[0] }}</span>
          <span class="mx-2">·</span>
          <span>{{
            indexContent?.html?.length
              ? (indexContent.html.length / 1024).toFixed(1) + 'KB'
              : '0KB'
          }}</span>
        </div>
        <h1 class="font-serif text-4xl md:text-6xl font-light mb-8">
          {{ indexContent.title }}
        </h1>
        <div
          id="index-content"
          class="font-serif prose prose-zinc dark:prose-invert max-w-none"
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
  @apply mb-4;
}

:deep(#index-content h2) {
  @apply font-serif text-2xl font-normal mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
}

:deep(#index-content ul) {
  @apply list-disc pl-8 my-4;
}

:deep(#index-content li) {
  @apply mb-2;
}

:deep(#index-content strong) {
  @apply font-medium text-zinc-900 dark:text-zinc-100;
}

:deep(#index-content code) {
  @apply font-mono text-sm;
}
</style>
