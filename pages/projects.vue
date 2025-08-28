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

useHead({
  title: 'Projects'
})
</script>

<template>
  <div>
    <header class="my-20 md:mt-6 pl-4 pr-4 md:pl-0">
      <div>
        <h1 class="text-display mb-8">
          Projects
        </h1>
        <p class="text-lg leading-relaxed font-serif">
          I build tools that sit at the intersection of engineering and
          design—where technical depth meets human intuition. My projects
          explore how we can make complex systems more approachable, whether
          that's turning high-dimensional data into navigable visual spaces,
          designing interfaces that respond to natural human gestures, or
          creating developer tools that prioritize delight alongside
          functionality. Each experiment represents a belief that technology
          should amplify human creativity, not constrain it.
        </p>
      </div>
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
          <h2 class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-8">
            Featured Work
          </h2>
          <div class="space-y-32 transition-all duration-500 ease-out">
            <FeaturedProjectCard
              v-for="(project, index) in featuredProjects"
              :key="project.slug"
              :project="project"
              :index="index"
              class="featured-project"
            />
          </div>
        </div>

        <!-- Regular Projects -->
        <div v-if="regularProjects.length">
          <h2
            v-if="featuredProjects.length"
            class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-8"
          >
            All Projects
          </h2>
          <div class="space-y-24 transition-all duration-500 ease-out">
            <ProjectCard
              v-for="(project, index) in regularProjects"
              :key="project.slug"
              :project="project"
              :index="index"
              class="regular-project"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.project-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.project-leave-active {
  transition: all 0.4s cubic-bezier(0.5, 0, 0.75, 0);
  position: absolute;
}

.project-move {
  transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.project-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  filter: blur(2px);
}

.project-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(1.02);
  filter: blur(1px);
}

/* Layout transition improvements */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* CSS Custom Properties for Stagger Animations */
.featured-project,
.regular-project {
  --stagger-delay: 0ms;
  animation-delay: var(--stagger-delay);
}

/* Static content display - no animations */
.featured-project,
.regular-project {
  opacity: 1 !important;
  transform: none !important;
}

/* Clean hover transitions only */
.featured-project {
  transition: transform 0.2s ease;
}

.regular-project {
  transition: transform 0.2s ease;
}

/* Trim grid/tooltip specific CSS */
</style>
