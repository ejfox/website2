<script setup>
import { format } from 'date-fns'

const processedMarkdown = useProcessedMarkdown()

function formatTitle(slug = '') {
  const baseName = slug.split('/').pop() || slug
  return baseName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  console.log('Fetching project posts...')
  try {
    const projects = await processedMarkdown.getProjectPosts()
    console.log('Found projects:', {
      count: projects?.length,
      slugs: projects?.map(p => p.slug)
    })
    return projects || []
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
})

function formatDate(date) {
  return format(new Date(date), 'MMMM yyyy')
}

const sortedProjectPosts = computed(() => {
  return projectPosts.value?.sort((a, b) => 
    new Date(b.metadata?.date || b.date) - new Date(a.metadata?.date || a.date)
  ) || []
})

const projectCount = computed(() => sortedProjectPosts.value?.length || 0)

useHead({
  title: `Projects (${projectCount.value})`,
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold mb-8">Projects ({{ projectCount }})</h1>

    <div v-if="!sortedProjectPosts.length" class="text-center py-8">
      <p class="text-lg text-zinc-600 dark:text-zinc-400">No projects found.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <article 
        v-for="project in sortedProjectPosts" 
        :key="project.slug || project.title"
        class="p-6 rounded-lg"
      >
        <NuxtLink :to="project.slug ? `/blog/${project.slug}` : '#'">
          <div v-if="project.metadata?.image" class="aspect-video mb-4 rounded-md overflow-hidden">
            <img 
              :src="project.metadata.image" 
              :alt="project.title || project.metadata?.title || 'Project Image'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <h2 class="text-xl font-bold mb-2">
            {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
          </h2>
        </NuxtLink>
        
        <div v-if="project.metadata?.date" class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{{ formatDate(project.metadata.date) }}</span>
        </div>

        <div 
          v-if="project.html" 
          class="prose dark:prose-invert prose-zinc max-w-none"
          v-html="project.html.replace(/opacity-0|animate-on-scroll|slide-from-left/g, '')"
        ></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose) {
  max-width: none;
}

:deep(.prose a) {
  @apply text-blue-600 dark:text-blue-400 no-underline hover:underline;
}

:deep(.prose h1, .prose h2, .prose h3) {
  @apply text-zinc-800 dark:text-zinc-200;
}

:deep(.prose p) {
  @apply text-zinc-700 dark:text-zinc-300;
}

:deep(.prose ol) {
  @apply list-decimal list-outside ml-6;
}

:deep(.prose li) {
  @apply text-zinc-700 dark:text-zinc-300;
}
</style>
