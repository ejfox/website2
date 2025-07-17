<script setup>
const { data: nowContent, pending } = await useFetch('/api/now')

useHead({
  title: 'Now',
  meta: [
    { name: 'description', content: 'What EJ Fox is working on and thinking about right now' }
  ]
})
</script>

<template>
  <main class="py-20 px-8 mx-auto max-w-lg">
    <!-- Loading State -->
    <div v-if="pending" class="space-y-4">
      <div class="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
      <div class="space-y-2">
        <div class="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        <div class="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        <div class="h-4 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
      </div>
    </div>

    <!-- Content State -->
    <div v-else-if="nowContent">
      <div 
        class="prose prose-lg dark:prose-invert"
        v-html="nowContent.html"
      ></div>
    </div>
    
    <!-- Error State -->
    <div v-else class="text-center text-zinc-500 dark:text-zinc-400">
      Content not found
    </div>
  </main>
</template>

<style scoped>
:deep(.prose) {
  @apply max-w-none;
}

:deep(.prose p) {
  @apply text-zinc-600 dark:text-zinc-400 leading-8 mb-6;
}

:deep(.prose h1) {
  @apply text-xl font-medium mt-0 mb-12 text-zinc-800 dark:text-zinc-200 tracking-wide;
}

:deep(.prose h2) {
  @apply text-base font-medium mt-12 mb-6 text-zinc-700 dark:text-zinc-300;
}

:deep(.prose strong) {
  @apply font-medium text-zinc-700 dark:text-zinc-300;
}

:deep(.prose a) {
  @apply text-zinc-800 dark:text-zinc-200 underline decoration-zinc-300 dark:decoration-zinc-700 decoration-1 underline-offset-4 hover:decoration-zinc-500 dark:hover:decoration-zinc-500 transition-all duration-300;
}

:deep(.prose hr) {
  @apply border-zinc-100 dark:border-zinc-800 my-12;
}

:deep(.prose em) {
  @apply text-zinc-500 dark:text-zinc-500 text-sm leading-7;
}
</style>