<template>
  <article
    :id="projectSlug"
    class="group featured-project featured-card-hover"
    :class="layoutClass"
    :style="{ '--stagger-delay': `${index * 100}ms` }"
  >
    <!-- Hero Layout: Full width with large image -->
    <template v-if="layoutMode === 'hero'">
      <div v-if="featuredImage" class="featured-hero-image">
        <img :src="featuredImage" :alt="projectTitle" class="w-full h-auto" />
      </div>
      <div class="featured-hero-content">
        <div class="project-description" v-html="project.html" />
      </div>
      <div class="featured-hero-meta">
        <div class="flex items-center gap-3">
          <time class="project-date">{{
            formatDate(project.metadata?.date || project.date)
          }}</time>
          <ClientOnly>
            <RhythmicSparklines
              v-if="projectActivity.length > 0"
              :data="projectActivity"
              variant="margin"
              :baseline="5"
              class="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            />
          </ClientOnly>
        </div>
        <div v-if="project.metadata?.tech?.length" class="tech-tags text-xs">
          <span v-for="(tech, techIndex) in project.metadata.tech" :key="tech">
            <span
              v-if="techIndex > 0"
              class="mx-1 text-zinc-300 dark:text-zinc-700"
              >·</span
            >
            <span>{{ tech }}</span>
          </span>
        </div>
        <div v-if="project.metadata?.github">
          <a
            :href="project.metadata.github"
            target="_blank"
            class="project-github-link text-xs"
            >GitHub ↗</a
          >
        </div>
      </div>
    </template>

    <!-- Asymmetric Grid Layout: 5/7 or 7/5 columns -->
    <template v-else>
      <div class="featured-grid-content">
        <div class="project-description" v-html="project.html" />
      </div>
      <div class="featured-grid-visual">
        <img
          v-if="featuredImage"
          :src="featuredImage"
          :alt="projectTitle"
          class="w-full h-auto"
        />
        <div class="featured-grid-meta">
          <div class="flex items-center gap-3">
            <time class="project-date">{{
              formatDate(project.metadata?.date || project.date)
            }}</time>
            <ClientOnly>
              <RhythmicSparklines
                v-if="projectActivity.length > 0"
                :data="projectActivity"
                variant="margin"
                :baseline="5"
                class="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
              />
            </ClientOnly>
          </div>
          <div v-if="project.metadata?.tech?.length" class="tech-tags text-xs">
            <span
              v-for="(tech, techIndex) in project.metadata.tech"
              :key="tech"
            >
              <span
                v-if="techIndex > 0"
                class="mx-1 text-zinc-300 dark:text-zinc-700"
                >·</span
              >
              <span>{{ tech }}</span>
            </span>
          </div>
          <div v-if="project.metadata?.github">
            <a
              :href="project.metadata.github"
              target="_blank"
              class="project-github-link text-xs"
              >GitHub ↗</a
            >
          </div>
        </div>
      </div>
    </template>
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

const _projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)

// Generate more substantial activity data for featured projects
const projectActivity = computed(() => {
  if (!props.project.metadata?.date) return []

  // Featured projects get 12 months of data (more detail)
  const months = 12
  const activity = []
  for (let i = 0; i < months; i++) {
    // Higher activity levels for featured projects
    const recentBoost = i < 3 ? 3 : 1.5
    activity.push(Math.floor(Math.random() * 10 * recentBoost) + 2)
  }
  return activity
})
</script>

<style scoped>
/* More pronounced hover effects for featured projects - *ZOOM* */
.featured-card-hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Desktop hover effects - slightly more dramatic */
@media (min-width: 768px) {
  .featured-card-hover:hover {
    transform: translateX(8px);
  }

  .featured-card-hover:hover .project-description {
    opacity: 0.95;
  }

  /* Subtle glow effect on hover for featured projects */
  .featured-card-hover::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 0.5rem;
    opacity: 0;
    transition: opacity 0.4s ease;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.05),
      transparent 50%
    );
  }

  .featured-card-hover:hover::after {
    opacity: 1;
  }
}

/* Mobile active state (already defined in global.css) */
</style>
