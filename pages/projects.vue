<script setup>
// Simplified: list-only view, remove grid/toggle/tooltip logic
import FeaturedProjectCard from '~/components/projects/FeaturedProjectCard.vue'
import ProjectCard from '~/components/projects/ProjectCard.vue'

// Static description for SSR-safety
const defaultDescription =
  'Code and art experiments, data visualization, and digital tools.'

useHead({
  title: 'Projects - EJ Fox',
  link: [{ rel: 'canonical', href: 'https://ejfox.com/projects' }]
})

useSeoMeta({
  description: defaultDescription,
  ogTitle: 'Projects - EJ Fox',
  ogDescription: defaultDescription,
  ogUrl: 'https://ejfox.com/projects',
  ogType: 'website',
  ogImage: 'https://ejfox.com/og-image.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Projects - EJ Fox',
  twitterDescription: defaultDescription,
  twitterImage: 'https://ejfox.com/og-image.png'
})

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
const { tocTarget } = useTOC()

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
</script>

<template>
  <div>
    <header class="section-spacing-lg container-main">
      <div style="max-width: 65ch">
        <!-- Data header with better spacing -->
        <div
          class="mono-xs text-muted mb-3 uppercase tracking-[0.15em] tabular flex-gap-3"
        >
          <span class="flex-gap-2">
            {{ projects?.length || 0 }} PROJECTS
            <ClientOnly>
              <RhythmicSparklines
                v-if="projects?.length"
                :data="projectActivity"
                variant="inline"
                :baseline="6"
                class="hidden sm:inline-block"
              />
            </ClientOnly>
          </span>
          <span class="text-divider">·</span>
          <span>{{ featuredProjects?.length || 0 }} FEATURED</span>
          <span class="text-divider">·</span>
          <span>{{ regularProjects?.length || 0 }} ARCHIVE</span>
        </div>
        <h1
          class="font-serif text-4xl md:text-5xl font-light mb-3"
          style="letter-spacing: -0.025em; line-height: 1.1"
        >
          Projects
        </h1>
        <p class="font-serif text-lg text-secondary" style="line-height: 1.6">
          Code and art experiments, data visualization, and digital tools.
        </p>
      </div>
    </header>

    <div class="container-main" style="max-width: 65ch">
      <section class="mt-16 md:mt-0">
        <div v-if="!projects || !projects.length" class="center-empty">
          <p class="text-secondary">No projects found.</p>
        </div>

        <!-- Featured Projects -->
        <div v-if="featuredProjects.length" class="mb-16">
          <h2
            id="featured-work"
            class="label-uppercase-mono mb-6"
            style="letter-spacing: 0.15em"
          >
            FEATURED WORK
          </h2>
          <div class="space-y-8 md:space-y-32 transition-all duration-500 ease-out">
            <FeaturedProjectCard
              v-for="(project, index) in featuredProjects"
              :id="getProjectId(project)"
              :key="project.slug"
              :project="project"
              :index="index"
              class="featured-project"
            />
          </div>
        </div>

        <!-- Regular Projects -->
        <div v-if="regularProjects.length">
          <h2 v-if="featuredProjects.length" id="all-projects" class="sr-only">
            All Projects
          </h2>
          <div class="space-y-6 md:space-y-24 transition-all duration-500 ease-out">
            <ProjectCard
              v-for="(project, index) in regularProjects"
              :id="getProjectId(project)"
              :key="project.slug"
              :project="project"
              :index="index"
              class="regular-project"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Projects TOC for sidebar -->
    <ClientOnly>
      <teleport v-if="tocTarget && projectToc.length" to="#nav-toc-container">
        <div class="toc">
          <h3 class="label-uppercase-mono mb-3 text-xs">Projects</h3>
          <ul class="space-y-1 text-sm">
            <li
              v-for="item in projectToc"
              :key="item.id"
              :class="item.level === 'h2' ? 'font-medium mt-2' : ''"
            >
              <a
                :href="`#${item.id}`"
                class="text-secondary link-hover block py-0.5"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </div>
      </teleport>
    </ClientOnly>
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
