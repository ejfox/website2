<script setup>
import { ref, watch } from 'vue'
import { useVizHub } from '~/composables/useVizHub'

const contentRef = ref(null)
const vizContainers = ref([])
const { error, initializeViz } = useVizHub(contentRef)

// Watch for post content changes
watch(() => post.value?.content, (newContent) => {
  console.log('Post content changed')
  if (newContent) {
    nextTick(() => {
      // After content is updated, get refs to viz containers
      vizContainers.value = Array.from(contentRef.value?.getElementsByClassName('vizhub-viz') || [])

      // Initialize each visualization
      vizContainers.value.forEach(vizContainer => {
        const wrapper = vizContainer.closest('.vizhub-wrapper')
        if (wrapper && wrapper.dataset.vizhubCode) {
          initializeViz(vizContainer, wrapper.dataset.vizhubCode)
        }
      })
    })
  }
}, { immediate: true })
</script>

<template>
  <div>
    <article v-if="post && !post.redirect" class="scroll-container pt-4 md:pt-2">
      <article ref="contentRef" v-html="post.content"
        class="px-2 prose-lg md:prose-xl dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-8 prose-p:py-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-8 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 prose-img:rounded-lg prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:px-3 prose-td:py-2 prose-pre:bg-white dark:prose-pre:bg-zinc-800 prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:overflow-x-auto prose-code:max-w-full !max-w-none font-normal" />

      <!-- Show any errors -->
      <div v-if="error" class="p-4 mt-4 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded">
        {{ error }}
      </div>
    </article>
  </div>
</template>

<style lang="postcss">
.vizhub-wrapper {
  @apply my-8 rounded-lg overflow-hidden;
}

.vizhub-viz {
  @apply bg-white dark:bg-zinc-900 p-4 border dark:border-zinc-800 rounded-t-lg;
  min-height: 400px;
}

.vizhub-wrapper pre {
  @apply mt-0 rounded-t-none;
}
</style>