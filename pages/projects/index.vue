<script setup>
import * as d3 from 'd3'
import ProjectRow from '~/components/projects/ProjectRow.vue'

const { data: projects } = await useAsyncData(
  'projects-page-data',
  async () => {
    try {
      return await $fetch('/api/projects')
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return []
    }
  }
)

const featuredProjects = computed(
  () => projects.value?.filter((p) => p.metadata?.featured) || []
)

const regularProjects = computed(
  () => projects.value?.filter((p) => !p.metadata?.featured) || []
)

const { tocTarget } = useTOC()

const getProjectSlug = (project) =>
  project.slug?.replace(/^projects\//, '') || ''

const tocLinkClass = 'block text-zinc-600 dark:text-zinc-400 truncate'

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

const lastUpdated = computed(() => {
  if (!projects.value?.length) return ''
  const dates = projects.value
    .map((p) => p.metadata?.lastUpdated || p.metadata?.date || p.date)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
  if (!dates.length) return ''
  return new Date(Math.max(...dates)).toISOString().split('T')[0]
})

// === Tufte data layer ===

// Helper: project slug (mirrors getProjectSlug)
const slugOf = (p) => p?.slug?.replace(/^projects\//, '') || ''

// Helper: word count from html
const wordCountOf = (p) => {
  if (!p?.html) return 0
  const text = p.html.replace(/<[^>]*>/g, '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

// Most-recently-updated project (uses lastUpdated || date)
const mostRecentProject = computed(() => {
  if (!projects.value?.length) return null
  let best = null
  let bestTs = -Infinity
  for (const p of projects.value) {
    const raw = p.metadata?.lastUpdated || p.metadata?.date || p.date
    if (!raw) continue
    const ts = new Date(raw).getTime()
    if (Number.isNaN(ts)) continue
    if (ts > bestTs) {
      bestTs = ts
      best = p
    }
  }
  return best
})

const mostRecentTitle = computed(
  () =>
    mostRecentProject.value?.title ||
    mostRecentProject.value?.metadata?.title ||
    ''
)

const mostRecentSlug = computed(() => slugOf(mostRecentProject.value))

// --- Stem plot data ---
// Each project = one stem. Height = sqrt(wordCount) for outlier control.
// Stems are ordered chronologically (oldest → newest, left → right).
const stemPlot = computed(() => {
  if (!projects.value?.length) {
    return { stems: [], width: 0, height: 8 }
  }
  const stemWidth = 1
  const gap = 1
  const height = 8 // 8px baseline
  const items = projects.value
    .map((p) => ({
      slug: slugOf(p),
      title: p.title || p.metadata?.title || 'Untitled',
      words: wordCountOf(p),
      ts: new Date(p.metadata?.date || p.date || 0).getTime() || 0,
    }))
    .sort((a, b) => a.ts - b.ts)

  const maxWords = Math.max(1, ...items.map((s) => s.words))
  const y = d3.scaleSqrt().domain([0, maxWords]).range([0, height])

  const stems = items.map((s, i) => {
    const h = Math.max(0.5, y(s.words))
    return {
      ...s,
      x: i * (stemWidth + gap),
      width: stemWidth,
      h,
      yTop: height - h,
    }
  })
  const width = items.length * (stemWidth + gap) - gap
  return { stems, width, height }
})

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

usePageSeo({
  title: 'Projects · EJ Fox',
  description:
    'Selected work: data visualizations, newsroom tooling, and investigative dashboards shipped via room302.studio and EJ Fox.',
  type: 'article',
  section: 'Projects',
  tags: [
    'Data visualization',
    'Newsroom tooling',
    'Investigations',
    'Dashboards',
  ],
  label1: 'Projects',
  data1: computed(() => `${projects.value?.length || 0} total`),
  label2: 'Featured span',
  data2: computed(() => `${earliestYear.value}–${latestYear.value}`),
})

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
  <div class="px-4 sm:px-6 xl:px-8 pt-8">
    <header class="mb-8">
      <div
        class="font-mono text-xs text-zinc-500 mb-4 uppercase tracking-wider"
      >
        INDEX / PROJECTS / {{ earliestYear }}–{{ latestYear }}
      </div>

      <h1
        class="text-5xl md:text-6xl font-serif font-light tracking-tighter leading-none mb-4"
      >
        Selected Work
      </h1>

      <!-- Real diff: most recently updated project, with anchor -->
      <div class="font-mono text-3xs text-zinc-500 dark:text-zinc-500 mb-2">
        <template v-if="lastUpdated && mostRecentProject">
          Last updated {{ lastUpdated }} ·
          <a
            :href="`#${mostRecentSlug}`"
            class="underline decoration-zinc-700/30 dark:decoration-zinc-400/30 underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {{ mostRecentTitle }}
          </a>
        </template>
        <template v-else>
          Updated live · sources: project frontmatter + API
        </template>
      </div>

      <div
        class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 tabular-nums"
      >
        <span class="text-zinc-900 dark:text-zinc-100">
          {{ projects?.length || 0 }} projects
        </span>
        <span>{{ featuredProjects.length }} featured</span>
        <span>{{ totalWords.toLocaleString() }} words</span>
        <span>{{ totalImages }} images</span>
        <span>{{ totalLinks }} links</span>
        <span>{{ totalTech }} technologies</span>
        <span>{{ Math.ceil(totalWords / 200) }}min read</span>
      </div>

      <!-- Word-count stem plot: HTML/CSS bars, never stretched. -->
      <div
        v-if="stemPlot.stems.length"
        class="hidden sm:flex mt-2 stem-plot items-end gap-px h-2 max-w-prose"
        aria-label="Word count per project, oldest to newest"
      >
        <a
          v-for="stem in stemPlot.stems"
          :key="`stem-${stem.slug}`"
          :href="`#${stem.slug}`"
          class="stem block w-px relative h-full"
          :title="`${stem.title} · ${stem.words.toLocaleString()} words`"
        >
          <span
            class="block absolute bottom-0 left-0 right-0 bg-zinc-400 dark:bg-zinc-600 transition-colors"
            :style="{ height: (stem.h / stemPlot.height) * 100 + '%' }"
          />
        </a>
      </div>
    </header>

    <div v-if="!projects?.length" class="text-center py-8">
      <p class="text-zinc-500">No projects found.</p>
    </div>

    <!-- Featured Projects - image-forward rows. Sit flush in the content column
         (same left edge as the header and the regular rows below); bigger type
         and imagery are the "Featured" cue, no extra inset. -->
    <div v-if="featuredProjects.length" class="mb-16 space-y-16">
      <template v-for="(project, i) in featuredProjects" :key="project.slug">
        <ProjectRow
          :id="getProjectSlug(project)"
          :project="project"
          featured
          :eager="i === 0"
        />
      </template>
    </div>

    <!-- Everything else - compact image-forward rows, constrained. -->
    <div v-if="regularProjects.length" class="space-y-14">
      <template v-for="project in regularProjects" :key="project.slug">
        <ProjectRow :id="getProjectSlug(project)" :project="project" />
      </template>
    </div>

    <!-- TOC -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div>
          <ul class="space-y-0.5 font-mono text-3xs list-none pl-0">
            <li v-for="project in projects" :key="project.slug">
              <a :href="`#${getProjectSlug(project)}`" :class="tocLinkClass">
                {{ project.title || project.metadata?.title }}
              </a>
            </li>
          </ul>
        </div>
      </teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Stem plot: darken stem on hover */
.stem-plot a.stem:hover span,
.stem-plot a.stem:focus-visible span {
  background-color: rgb(24 24 27); /* zinc-900 */
}
:global(.dark) .stem-plot a.stem:hover span,
:global(.dark) .stem-plot a.stem:focus-visible span {
  background-color: rgb(244 244 245); /* zinc-100 */
}
</style>
