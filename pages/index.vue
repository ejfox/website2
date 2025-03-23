<script setup>
import { animate, stagger } from '~/anime.esm.js'
const { getPostBySlug, getAllPosts } = useProcessedMarkdown()

const { data: indexContent, pending: indexPending } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

const { data: posts, pending: postsPending } = await useAsyncData('posts', () => getAllPosts())

// Combine the pending states
const pending = computed(() => indexPending.value || postsPending.value)

const indexContentContainer = ref(null)

onMounted(async () => {
  // Wait for the next tick to ensure content is rendered
  await nextTick()

  if (indexContentContainer.value) {
    // First make content visible
    const content = indexContentContainer.value.querySelectorAll('.animate-on-scroll')
    if (content.length > 0) {
      animate(content, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        ease: 'outQuad',
        delay: stagger(100)
      })
    }

    // Then animate links
    const links = indexContentContainer.value.querySelectorAll('a')
    if (links.length > 0) {
      animate(links, {
        opacity: [0.82, 1],
        borderColor: ['rgba(0,0,0,0)', '#CCC', '#FFF'],
        ease: 'easeOutQuad',
        duration: 5500,
        delay: stagger(1200),
      })
    }
  }
})
</script>

<template>
  <main class="p-4 md:p-8">
    <!-- Loading State -->
    <div v-if="pending" class="max-w-3xl space-y-8">
      <!-- Skeleton for featured post -->
      <div class="relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900/50 animate-pulse">
        <div class="aspect-[2/1] bg-zinc-200 dark:bg-zinc-800"></div>
        <div class="p-6 space-y-4">
          <div class="h-8 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div class="space-y-2">
            <div class="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div class="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Skeleton for post list -->
      <div class="space-y-12">
        <div v-for="i in 3" :key="i" class="flex gap-6 animate-pulse">
          <!-- Date column -->
          <div class="w-24 shrink-0">
            <div class="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <!-- Content column -->
          <div class="flex-1 space-y-3">
            <div class="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div class="space-y-2">
              <div class="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div class="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content State -->
    <div v-else>
      <!-- Existing content here -->
      <div v-if="posts?.length" class="max-w-3xl space-y-8">
        <template v-if="indexContent">
          <h1>{{ indexContent.title }}</h1>
          <div ref="indexContentContainer" id="index-content" class="prose prose-lg dark:prose-invert" v-html="indexContent.html"></div>
        </template>
        <div v-else class="text-center py-12">Loading...</div>
      </div>
      <div v-else class="text-center text-zinc-500 dark:text-zinc-400">
        No posts found
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

:deep(#index-content a) {
  @apply border-b border-zinc-400 dark:border-zinc-600 
         hover:border-zinc-700 dark:hover:border-zinc-300
         transition-colors duration-300 
         px-0.5 py-0.5 
         text-zinc-900 dark:text-zinc-100
         no-underline;
}

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
