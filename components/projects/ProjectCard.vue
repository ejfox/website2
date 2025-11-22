<template>
  <article
    :id="projectSlug"
    class="group project-grid project-card-hover"
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
        <!-- GitHub link - Top on mobile for thumb zone, bottom on desktop -->
        <div v-if="project.metadata?.github" class="md:order-last">
          <a
            :href="project.metadata.github"
            target="_blank"
            class="project-github-link"
            >GitHub ↗</a
          >
        </div>

        <!-- Date with optional sparkline -->
        <div class="flex items-center gap-2">
          <time class="project-date">{{
            formatDate(project.metadata?.date || project.date)
          }}</time>
          <ClientOnly>
            <RhythmicSparklines
              v-if="projectActivity.length > 0"
              :data="projectActivity"
              variant="inline"
              :baseline="3"
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </ClientOnly>
        </div>

        <!-- Tech tags - Remove hover state for mobile -->
        <div v-if="project.metadata?.tech?.length" class="tech-tags">
          <span v-for="(tech, techIndex) in project.metadata.tech" :key="tech">
            <span
              v-if="techIndex > 0"
              class="mx-2 text-zinc-300 dark:text-zinc-700"
              >·</span
            >
            <span>{{ tech }}</span>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
const { formatYearOnly } = useDateFormat()
const { getSlug } = useProjectSlug()

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

const formatDate = formatYearOnly

const projectSlug = computed(() => getSlug(props.project))

const _projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)

// Generate mock activity data based on project metadata
// In a real app, this could come from GitHub API (commits, stars, etc.)
const projectActivity = computed(() => {
  if (!props.project.metadata?.date) return []

  // Generate 6 months of mock activity data
  const months = 6
  const activity = []
  for (let i = 0; i < months; i++) {
    // Simulate activity with randomness,
    // weighted toward recent activity
    const recentBoost = i < 2 ? 2 : 1
    activity.push(Math.floor(Math.random() * 8 * recentBoost) + 1)
  }
  return activity
})
</script>

<style scoped>
/* Subtle hover effects - *whoosh* but not too much! */
.project-card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Desktop hover effects */
@media (min-width: 768px) {
  .project-card-hover:hover {
    transform: translateX(4px);
  }

  .project-card-hover:hover .project-description {
    opacity: 0.9;
  }
}

/* Mobile active state (already defined in global.css) */
</style>
