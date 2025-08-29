<script setup>
// Simplified: list-only view, remove grid/toggle/tooltip logic
import FeaturedProjectCard from '~/components/projects/FeaturedProjectCard.vue'
import ProjectCard from '~/components/projects/ProjectCard.vue'

const { data: projects } = await useAsyncData('projects-page-data', () =>
  $fetch('/api/projects')
)
// No grid mode, no tooltip, no image extraction

const featuredProjects = computed(
  () => projects.value?.filter((p) => p.metadata?.featured) || []
)

const regularProjects = computed(
  () => projects.value?.filter((p) => !p.metadata?.featured) || []
)

// TOC for sidebar
const tocTarget = computed(() => {
  if (!process.client) return null
  return document.getElementById('nav-toc-container')
})

// Helper to generate clean IDs from project slugs
const getProjectId = (project) => {
  const slug = project.slug || ''
  const parts = slug.split('/')
  return parts[parts.length - 1] || 'unknown-project'
}

// Create TOC from all projects
const projectToc = computed(() => {
  if (!projects.value) return []
  
  const items = []
  
  // Featured projects with their own section
  if (featuredProjects.value.length > 0) {
    items.push({
      text: 'Featured Work',
      id: 'featured-work',
      level: 'h2'
    })
    
    featuredProjects.value.forEach((project) => {
      items.push({
        text: project.title || project.metadata?.title,
        id: getProjectId(project),
        level: 'h3'
      })
    })
  }
  
  // Regular projects with their own section (only if there are also featured projects)
  if (regularProjects.value.length > 0 && featuredProjects.value.length > 0) {
    items.push({
      text: 'All Projects',
      id: 'all-projects',
      level: 'h2'
    })
  }
  
  // Add regular projects
  regularProjects.value.forEach((project) => {
    items.push({
      text: project.title || project.metadata?.title,
      id: getProjectId(project),
      level: 'h3'
    })
  })
  
  return items
})

useHead({
  title: 'Projects'
})
</script>

<template>
  <div>
    <header class="header">
      <h1 class="text-display mb-8">
        Projects
      </h1>
      <p class="text-body">
        I build tools that sit at the intersection of engineering and
        design—where technical depth meets human intuition. My projects
        explore how we can make complex systems more approachable, whether
        that's turning high-dimensional data into navigable visual spaces,
        designing interfaces that respond to natural human gestures, or
        creating developer tools that prioritize delight alongside
        functionality. Each experiment represents a belief that technology
        should amplify human creativity, not constrain it.
      </p>
    </header>

    <div class="max-w-screen-lg pr-8">
      <section class="mt-16 md:mt-0">
        <div v-if="!projects || !projects.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">
            No projects found.
          </p>
        </div>

        <!-- Featured Projects -->
        <div v-if="featuredProjects.length" class="mb-16">
          <h2 id="featured-work" class="section-header">
            Featured Work
          </h2>
          <div class="space-y-32 transition-all duration-500 ease-out">
            <FeaturedProjectCard
              v-for="(project, index) in featuredProjects"
              :key="project.slug"
              :project="project"
              :index="index"
              :id="getProjectId(project)"
              class="featured-project"
            />
          </div>
        </div>

        <!-- Regular Projects -->
        <div v-if="regularProjects.length">
          <h2 v-if="featuredProjects.length" id="all-projects" class="sr-only">All Projects</h2>
          <div class="space-y-24 transition-all duration-500 ease-out">
            <ProjectCard
              v-for="(project, index) in regularProjects"
              :key="project.slug"
              :project="project"
              :index="index"
              :id="getProjectId(project)"
              class="regular-project"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Projects TOC for sidebar -->
    <teleport v-if="tocTarget && projectToc.length" to="#nav-toc-container">
      <div class="toc">
        <div class="py-4">
          <h3 class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-4">
            Projects
          </h3>
          <ul class="space-y-2 text-sm">
            <li v-for="item in projectToc" :key="item.id" :class="item.level === 'h2' ? 'font-medium' : 'ml-3'">
              <a 
                :href="`#${item.id}`"
                class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors block py-1"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
/* CSS Custom Properties for Stagger Animations */
.featured-project,
.regular-project {
  --stagger-delay: 0ms;
  animation-delay: var(--stagger-delay);
  opacity: 1 !important;
  transform: none !important;
  transition: transform 0.2s ease;
}
</style>
