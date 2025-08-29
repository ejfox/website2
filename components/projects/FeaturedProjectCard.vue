<template>
  <article :id="projectSlug" class="group featured-project project-grid" :style="{ '--stagger-delay': `${index * 100}ms` }">
    <div class="project-content">
      <h2 class="project-title project-title-featured">
        <a :href="`#${projectSlug}`" class="project-link">{{ projectTitle }}</a>
      </h2>
      <div class="project-description" v-html="project.html" />
    </div>
    <div class="project-meta">
      <div class="flex items-center justify-end gap-3 mb-2">
        <time class="project-date">{{ formatDate(project.metadata?.date || project.date) }}</time>
      </div>
      <div v-if="project.metadata?.tech?.length" class="project-tech-container">
        <div class="project-tech-list">
          <span v-for="tech in project.metadata.tech" :key="tech" class="project-tech-tag">{{ tech }}</span>
        </div>
      </div>
      <div v-if="project.metadata?.github" class="project-github">
        <a :href="project.metadata.github" target="_blank" class="project-github-link">GitHub ↗</a>
      </div>
    </div>
  </article>
</template>

<script setup>
import { format } from 'date-fns/format'

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

const projectSlug = computed(() => {
  // Create a clean anchor slug from the project title
  const title = props.project.title || props.project.metadata?.title || ''
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
})

const projectTitle = computed(() => props.project.title || props.project.metadata?.title || '')
// list-only: no image/tooltip logic
</script>