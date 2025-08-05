<script setup>
import { format } from 'date-fns'

// Get projects data with consistent server/client behavior
const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  const processedMarkdown = useProcessedMarkdown()
  const projects = await processedMarkdown.getProjectPosts()
  
  // Sort on server BEFORE returning to avoid client hydration mismatch
  return (projects || []).sort((a, b) => {
    const dateA = new Date(a.metadata?.date || a.date).getTime()
    const dateB = new Date(b.metadata?.date || b.date).getTime()
    return dateB - dateA
  })
}, {
  default: () => []
})

function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM yyyy')
}

useHead({
  title: `Projects (${projectPosts.value?.length || 0})`
})
</script>

<template>
  <div class="mt-24 md:mt-0">
    <header class="my-6">
      <h1 class="text-display mb-8">
        Projects
      </h1>
      <p class="text-body">
        A collection of experiments, tools, and creative explorations.
      </p>
    </header>

    <div class="content-grid space-y-24">
      <article
        v-for="project in projectPosts"
        :key="project.slug"
        class="group"
      >
        <!-- Project header -->
        <div class="grid grid-cols-12 gap-4 mb-8">
          <!-- Date column -->
          <div class="col-span-2 pl-2 md:pl-0">
            <time class="md:text-xs text-zinc-500">
              {{ formatDate(project.metadata?.date || project.date) }}
            </time>
            <div v-if="project.metadata?.github" class="pt-6">
              <a
                :href="project.metadata.github"
                target="_blank"
                class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                GitHub ↗
              </a>
            </div>
          </div>

          <!-- Content column -->
          <div class="col-span-10">
            <h2 class="text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-4">
              {{ project.title || project.metadata?.title }}
            </h2>

            <div
              class="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed content"
              v-html="project.html"
            ></div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

