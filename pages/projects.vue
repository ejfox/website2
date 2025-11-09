<script setup>
// Simplified: list-only view, remove grid/toggle/tooltip logic
import FeaturedProjectCard from '~/components/projects/FeaturedProjectCard.vue'
import ProjectCard from '~/components/projects/ProjectCard.vue'

const projectsDescription = computed(() => {
  const total = projects.value?.length || 0
  const featured = featuredProjects.value?.length || 0

  if (total === 0) return 'Interactive data visualization work and journalism projects.'

  // Get up to 3 recent project names
  const recentProjects = projects.value
    ?.slice(0, 3)
    .map(p => p.title || p.metadata?.title)
    .filter(Boolean)
    .join(', ') || ''

  const stats = `${total} projects${featured > 0 ? ` • ${featured} featured` : ''}`

  return recentProjects ? `${stats} • Latest: ${recentProjects}` : stats
})

useHead(() => ({
  title: 'Projects - EJ Fox',
  meta: [
    {
      name: 'description',
      content: projectsDescription.value
    },
    { property: 'og:title', content: 'Projects - EJ Fox' },
    {
      property: 'og:description',
      content: projectsDescription.value
    },
    { property: 'og:url', content: 'https://ejfox.com/projects' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://ejfox.com/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Projects - EJ Fox' },
    {
      name: 'twitter:description',
      content: projectsDescription.value
    },
    { name: 'twitter:image', content: 'https://ejfox.com/og-image.png' }
  ]
}))

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

// Calculate project activity data for sparklines
const projectActivity = computed(() => {
  if (!projects.value) return []
  // Create mock activity data based on project count
  // In a real app, this could be commit counts, update frequency, etc.
  const activity = []
  const months = 12
  for (let i = 0; i < months; i++) {
    activity.push(Math.floor((Math.random() * projects.value.length) / 3) + 1)
  }
  return activity
})

useHead({
  title: 'Projects'
})
</script>

<template>
  <div>
    <header class="mb-8 px-4 md:px-8">
      <div style="max-width: 65ch">
        <!-- Data header with better spacing -->
        <div
          class="font-mono text-xs text-zinc-500 mb-3 uppercase tracking-[0.15em] tabular-nums flex items-center gap-3"
        >
          <span class="flex items-center gap-2">
            {{ projects?.length || 0 }} PROJECTS
            <RhythmicSparklines
              v-if="projects?.length"
              :data="projectActivity"
              variant="inline"
              :baseline="6"
            />
          </span>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <span>{{ featuredProjects?.length || 0 }} FEATURED</span>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <span>{{ regularProjects?.length || 0 }} ARCHIVE</span>
        </div>
        <h1
          class="font-serif text-4xl md:text-5xl font-light mb-3"
          style="letter-spacing: -0.025em; line-height: 1.1"
        >
          Projects
        </h1>
        <p
          class="font-serif text-lg text-zinc-600 dark:text-zinc-400"
          style="line-height: 1.6"
        >
          Code and art experiments, data visualization, and digital tools.
        </p>
      </div>
    </header>

    <div class="px-4 md:px-8" style="max-width: 65ch">
      <section class="mt-16 md:mt-0">
        <div v-if="!projects || !projects.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">No projects found.</p>
        </div>

        <!-- Featured Projects -->
        <div v-if="featuredProjects.length" class="mb-16">
          <h2
            id="featured-work"
            class="font-mono text-xs uppercase tracking-[0.15em] text-zinc-500 mb-6"
          >
            FEATURED WORK
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
          <h2 v-if="featuredProjects.length" id="all-projects" class="sr-only">
            All Projects
          </h2>
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
          <h3
            class="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4"
          >
            Projects
          </h3>
          <ul class="space-y-2 text-sm">
            <li
              v-for="item in projectToc"
              :key="item.id"
              :class="item.level === 'h2' ? 'font-medium' : 'ml-4'"
            >
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
