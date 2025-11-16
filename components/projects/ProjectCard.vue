<template>
  <article
    :id="projectSlug"
    class="group project-grid"
    :style="{ '--stagger-delay': `${index * 80}ms` }"
  >
    <div class="project-content">
      <div
        class="project-description project-description-regular"
        v-html="project.html"
      />
    </div>
    <div class="project-meta">
      <div class="flex flex-col items-end gap-2">
        <time class="project-date">{{
          formatDate(project.metadata?.date || project.date)
        }}</time>
        <div v-if="project.metadata?.tech?.length" class="tech-tags">
          <span v-for="(tech, index) in project.metadata.tech" :key="tech">
            <span v-if="index > 0" class="mx-2 text-zinc-300 dark:text-zinc-700"
              >·</span
            >
            <span
              class="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >{{ tech }}</span
            >
          </span>
        </div>
        <div v-if="project.metadata?.github">
          <a
            :href="project.metadata.github"
            target="_blank"
            class="project-github-link"
            >GitHub ↗</a
          >
        </div>
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
  try {
    return format(new Date(date), 'yyyy')
  } catch {
    return ''
  }
}

const projectSlug = computed(() => {
  // Create a clean anchor slug from the project title
  const title = props.project.title || props.project.metadata?.title || ''
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)
// list-only: no image/tooltip logic
</script>
