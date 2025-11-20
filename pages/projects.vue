<script setup>
import FeaturedProjectCard from '~/components/projects/FeaturedProjectCard.vue'
import BentoProjectCard from '~/components/projects/BentoProjectCard.vue'

useHead({
  title: 'Projects - EJ Fox',
  link: [{ rel: 'canonical', href: 'https://ejfox.com/projects' }]
})

const { data: projects } = await useAsyncData('projects-page-data', () =>
  $fetch('/api/projects')
)

const featuredProjects = computed(
  () => projects.value?.filter((p) => p.metadata?.featured) || []
)

const regularProjects = computed(
  () => projects.value?.filter((p) => !p.metadata?.featured) || []
)

const { tocTarget } = useTOC()
const { getSlug } = useProjectSlug()

const getProjectId = (project) => getSlug(project)

const tocHeadingClass =
  'text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3'
const tocLinkClass =
  'block py-0.5 text-zinc-600 dark:text-zinc-400 ' +
  'hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors'
</script>

<template>
  <div class="px-4 md:px-8 max-w-4xl">
    <header class="mb-12">
      <h1 class="text-4xl md:text-5xl font-serif font-light mb-3">Projects</h1>
      <p class="text-lg text-zinc-600 dark:text-zinc-400">
        {{ projects?.length || 0 }} projects
      </p>
    </header>

    <div v-if="!projects?.length" class="text-center py-8">
      <p class="text-zinc-500">No projects found.</p>
    </div>

    <!-- Featured Projects -->
    <div v-if="featuredProjects.length" class="mb-16">
      <div class="space-y-16">
        <FeaturedProjectCard
          v-for="(project, index) in featuredProjects"
          :id="getProjectId(project)"
          :key="project.slug"
          :project="project"
          :index="index"
        />
      </div>
    </div>

    <!-- Regular Projects - Simple Grid -->
    <div v-if="regularProjects.length">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BentoProjectCard
          v-for="project in regularProjects"
          :id="getProjectId(project)"
          :key="project.slug"
          :project="project"
        />
      </div>
    </div>

    <!-- TOC -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="-mx-8">
          <h3 :class="tocHeadingClass">Projects</h3>
          <ul class="space-y-1 text-sm">
            <li v-for="project in projects" :key="project.slug">
              <a :href="`#${getProjectId(project)}`" :class="tocLinkClass">
                {{ project.title || project.metadata?.title }}
              </a>
            </li>
          </ul>
        </div>
      </teleport>
    </ClientOnly>
  </div>
</template>
