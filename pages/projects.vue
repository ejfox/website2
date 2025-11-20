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
  'interactive-link block py-1 text-zinc-600 dark:text-zinc-400'

// Aggregate metadata for brutalist header display
const totalWords = computed(() => {
  if (!projects.value) return 0
  return projects.value.reduce((sum, p) => {
    if (!p.html) return sum
    const text = p.html.replace(/<[^>]*>/g, '').trim()
    const words = text.split(/\s+/).filter((w) => w.length > 0).length
    return sum + words
  }, 0)
})

const totalImages = computed(() => {
  if (!projects.value) return 0
  return projects.value.reduce((sum, p) => {
    if (!p.html) return sum
    return sum + (p.html.match(/<img/g) || []).length
  }, 0)
})

const totalLinks = computed(() => {
  if (!projects.value) return 0
  return projects.value.reduce((sum, p) => {
    if (!p.html) return sum
    return sum + (p.html.match(/<a /g) || []).length
  }, 0)
})

const totalTech = computed(() => {
  if (!projects.value) return 0
  const techSet = new Set()
  projects.value.forEach((p) => {
    if (p.metadata?.tech) {
      p.metadata.tech.forEach((t) => techSet.add(t))
    }
  })
  return techSet.size
})

const earliestYear = computed(() => {
  if (!projects.value?.length) return new Date().getFullYear()
  const years = projects.value
    .map((p) => {
      const date = p.metadata?.date || p.date
      return date ? new Date(date).getFullYear() : new Date().getFullYear()
    })
    .filter((y) => !Number.isNaN(y))
  return Math.min(...years)
})

const latestYear = computed(() => {
  if (!projects.value?.length) return new Date().getFullYear()
  const years = projects.value
    .map((p) => {
      const date = p.metadata?.date || p.date
      return date ? new Date(date).getFullYear() : new Date().getFullYear()
    })
    .filter((y) => !Number.isNaN(y))
  return Math.max(...years)
})
</script>

<template>
  <div class="px-4 md:px-8 max-w-4xl">
    <header class="mb-12 pb-4">
      <div
        class="font-mono text-xs text-zinc-500 mb-3 uppercase tracking-wider"
      >
        INDEX / PROJECTS / {{ earliestYear }}–{{ latestYear }}
      </div>

      <h1
        class="text-5xl md:text-6xl font-serif font-light tracking-tighter leading-none mb-4"
      >
        Selected Work
      </h1>

      <div
        class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 tabular-nums"
      >
        <span class="text-zinc-900 dark:text-zinc-100"
          >{{ projects?.length || 0 }} projects</span
        >
        <span>{{ featuredProjects.length }} featured</span>
        <span>{{ totalWords.toLocaleString() }} words</span>
        <span>{{ totalImages }} images</span>
        <span>{{ totalLinks }} links</span>
        <span>{{ totalTech }} technologies</span>
        <span>{{ Math.ceil(totalWords / 200) }}min read</span>
      </div>
    </header>

    <div v-if="!projects?.length" class="text-center py-8">
      <p class="text-zinc-500">No projects found.</p>
    </div>

    <!-- Featured Projects -->
    <div v-if="featuredProjects.length" class="mb-16 space-y-16">
      <FeaturedProjectCard
        v-for="(project, index) in featuredProjects"
        :id="getProjectId(project)"
        :key="project.slug"
        :project="project"
        :index="index"
      />
    </div>

    <!-- Regular Projects - Simple Grid -->
    <div
      v-if="regularProjects.length"
      class="grid gap-6"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"
    >
      <BentoProjectCard
        v-for="project in regularProjects"
        :id="getProjectId(project)"
        :key="project.slug"
        :project="project"
      />
    </div>

    <!-- TOC -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <nav class="mt-8">
          <ul class="text-sm">
            <li v-for="project in projects" :key="project.slug">
              <a :href="`#${getProjectId(project)}`" :class="tocLinkClass">
                {{ project.title || project.metadata?.title }}
              </a>
            </li>
          </ul>
        </nav>
      </teleport>
    </ClientOnly>
  </div>
</template>
