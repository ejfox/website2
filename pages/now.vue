<script setup>
const { data: nowContent, pending } = await useFetch('/api/now')

useHead({
  title: 'Now',
  meta: [
    {
      name: 'description',
      content: 'What EJ Fox is working on and thinking about right now'
    }
  ]
})
</script>

<template>
  <main class="px-4 md:px-8 py-8" style="max-width: 65ch">
    <!-- Content -->
    <div v-if="nowContent">
      <div
        class="prose prose-zinc dark:prose-invert max-w-none"
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
  @apply text-zinc-600 dark:text-zinc-400 leading-8 mb-8;
}

:deep(.prose h1) {
  @apply font-serif text-3xl font-normal mt-0 mb-8 text-zinc-900 dark:text-zinc-100;
  letter-spacing: -0.02em;
}

:deep(.prose h2) {
  @apply font-serif text-xl font-normal mt-8 mb-4 text-zinc-800 dark:text-zinc-200;
  letter-spacing: -0.015em;
}

:deep(.prose strong) {
  @apply font-medium text-zinc-700 dark:text-zinc-300;
}

:deep(.prose a) {
  @apply text-zinc-900 dark:text-zinc-100 border-b border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors;
}

:deep(.prose hr) {
  @apply border-zinc-100 dark:border-zinc-800 my-8;
}

:deep(.prose em) {
  @apply text-zinc-500 dark:text-zinc-500 text-sm leading-7;
}
</style>
