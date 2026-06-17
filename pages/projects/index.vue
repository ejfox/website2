<script setup>
import FeaturedProjectCard from '~/components/projects/FeaturedProjectCard.vue'
import BentoProjectCard from '~/components/projects/BentoProjectCard.vue'

const { tocTarget } = useTOC()
const { revealContainer: featuredReveal } = useScrollReveal({
  selector: ':scope > *',
  staggerDelay: 50,
  translateY: 6,
  duration: 250,
})
const { revealContainer: gridReveal } = useScrollReveal({
  selector: ':scope > *',
  staggerDelay: 20,
  translateY: 4,
  duration: 150,
})

// Fetch projects
const { data: projects } = await useAsyncData('projects-page-data', () =>
  $fetch('/api/projects')
)

const featuredProjects = computed(
  () => projects.value?.filter((p) => p.metadata?.featured) || []
)
const regularProjects = computed(
  () => projects.value?.filter((p) => !p.metadata?.featured) || []
)

const getProjectSlug = (project) =>
  project.slug?.replace(/^projects\//, '') || ''

// Aggregate stats
const projectStats = computed(() => {
  const all = projects.value || []
  const techSet = new Set()
  let words = 0
  let images = 0

  all.forEach((p) => {
    if (p.html) {
      const text = p.html.replace(/<[^>]*>/g, '').trim()
      words += text.split(/\s+/).filter((w) => w).length
      images += (p.html.match(/<img/g) || []).length
    }
    p.metadata?.tech?.forEach((t) => techSet.add(t))
  })

  const years = all
    .map((p) => {
      const d = p.metadata?.date || p.date
      return d ? new Date(d).getFullYear() : null
    })
    .filter((y) => y && !Number.isNaN(y))

  return {
    count: all.length,
    featured: all.filter((p) => p.metadata?.featured).length,
    words,
    images,
    techCount: techSet.size,
    earliestYear: years.length ? Math.min(...years) : '',
    latestYear: years.length ? Math.max(...years) : '',
  }
})

// SEO
usePageSeo({
  title: 'Projects · EJ Fox',
  description:
    'Selected work: data visualizations, newsroom tooling, and investigative dashboards.',
  type: 'article',
  section: 'Projects',
  label1: 'Projects',
  data1: computed(() => `${projects.value?.length || 0} total`),
  label2: 'Span',
  data2: computed(
    () => `${projectStats.value.earliestYear}–${projectStats.value.latestYear}`
  ),
})

// JSON-LD ItemList schema (structured data for search engines)
const projectsSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Projects',
  numberOfItems: projects.value?.length || 0,
  itemListElement:
    projects.value?.slice(0, 20).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://ejfox.com/projects/${getProjectSlug(p)}`,
      name: p.metadata?.title || p.title,
    })) || [],
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(projectsSchema.value),
    },
  ],
}))
</script>

<template>
  <div class="px-4 sm:px-8 xl:px-16 max-w-4xl pt-8">
    <header class="mb-8">
      <div
        class="font-mono text-xs text-zinc-500 mb-4 uppercase tracking-wider"
      >
        INDEX / PROJECTS /
        {{ projectStats.earliestYear }}–{{ projectStats.latestYear }}
      </div>

      <h1
        class="text-5xl md:text-6xl font-serif font-light tracking-tighter leading-none mb-4"
      >
        Selected Work
      </h1>

      <div
        class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 tabular-nums"
      >
        <span class="text-zinc-900 dark:text-zinc-100">
          {{ projectStats.count }} projects
        </span>
        <span>{{ projectStats.featured }} featured</span>
        <span>{{ projectStats.words.toLocaleString() }} words</span>
        <span>{{ projectStats.images }} images</span>
        <span>{{ projectStats.techCount }} technologies</span>
      </div>
    </header>

    <div v-if="!projects?.length" class="text-center py-8">
      <p class="text-zinc-500">No projects found.</p>
    </div>

    <!-- Featured Projects -->
    <div
      v-if="featuredProjects.length"
      ref="featuredReveal"
      class="mb-12 space-y-8"
    >
      <FeaturedProjectCard
        v-for="(project, index) in featuredProjects"
        :id="getProjectSlug(project)"
        :key="project.slug"
        :project="project"
        :index="index"
      />
    </div>

    <!-- Regular Projects -->
    <div
      v-if="regularProjects.length"
      ref="gridReveal"
      class="grid gap-4"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"
    >
      <BentoProjectCard
        v-for="project in regularProjects"
        :id="getProjectSlug(project)"
        :key="project.slug"
        :project="project"
      />
    </div>

    <!-- Sidebar TOC -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <ul class="space-y-0.5 font-mono text-3xs list-none pl-0">
          <li v-for="project in projects" :key="project.slug">
            <a
              :href="`#${getProjectSlug(project)}`"
              class="block text-zinc-600 dark:text-zinc-400 truncate"
            >
              {{ project.title || project.metadata?.title }}
            </a>
          </li>
        </ul>
      </teleport>
    </ClientOnly>
  </div>
</template>
