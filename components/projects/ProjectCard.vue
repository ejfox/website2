<template>
  <!-- List-only item -->
  <article :class="['group grid grid-cols-12 gap-4 transition-all duration-300 ease-out']"
           :style="{ '--stagger-delay': `${index * 80}ms` }">
    <div class="col-span-10">
      <h2 class="text-2xl md:text-3xl font-light text-zinc-700 dark:text-zinc-300 mb-3">
        <NuxtLink :to="getProjectSlug(project)" class="hover:underline">
          {{ projectTitle }}
        </NuxtLink>
      </h2>
      <div
        class="prose prose-zinc dark:prose-invert max-w-none text-zinc-500 dark:text-zinc-500 leading-relaxed prose-sm"
        v-html="project.html" />
    </div>
    <div class="col-span-2 pl-2 md:pl-0">
      <div class="flex items-center gap-3 mb-2">
        <time class="text-xs text-zinc-400">
          {{ formatDate(project.metadata?.date || project.date) }}
        </time>
      </div>
      <div v-if="project.metadata?.tech?.length" class="pt-3">
        <div class="flex flex-col gap-1">
          <span v-for="tech in project.metadata.tech" :key="tech"
            class="text-xs px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 rounded-md w-fit">
            {{ tech }}
          </span>
        </div>
      </div>
      <div v-if="project.metadata?.github" class="pt-6">
        <a :href="project.metadata.github" target="_blank"
          class="text-sm text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          GitHub ↗
        </a>
      </div>
    </div>
  </article>
</template>

<script setup>
import { format } from 'date-fns'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const formatDate = (date) => {
  if (!date) return ''
  try { return format(new Date(date), 'MMM yyyy') } catch { return '' }
}

const getProjectSlug = (project) => {
  // API returns slug already prefixed with 'projects/', e.g. 'projects/website2'
  // So we need to add '/blog/' to get '/blog/projects/website2'
  return `/blog/${project.slug}`
}

const projectTitle = computed(() => props.project.title || props.project.metadata?.title || '')
// list-only: no image/tooltip logic
</script>

<style scoped>
/* CSS Custom Properties for Stagger Animations */
.group {
  --stagger-delay: 0ms;
  animation-delay: var(--stagger-delay);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>