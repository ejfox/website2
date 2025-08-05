<script setup>
import { format } from 'date-fns'

// Use dedicated projects API endpoint that includes HTML content
// This fixes the hydration issue by loading all content server-side
const projects = await $fetch('/api/projects').catch(() => [])

function formatDate(date) {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM yyyy')
  } catch {
    return ''
  }
}

useHead({
  title: `Projects (${projects?.length || 0})`
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

    <!-- Show empty state -->
    <div v-if="!projects || projects.length === 0" class="text-center py-16">
      <p class="text-body">
        No projects found.
      </p>
    </div>

    <!-- Show projects -->
    <div v-else class="content-grid space-y-24">
      <article
        v-for="project in projects"
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