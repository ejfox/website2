<script setup>
import { scaleSqrt } from 'd3-scale'
import ProjectRow from '~/components/projects/ProjectRow.vue'
import ProjectArchiveCard from '~/components/projects/ProjectArchiveCard.vue'

// slim=1: card fields only (images/heroVideo/excerpt/counts precomputed
// server-side) — the full-html array was ~470KB of payload this page never
// rendered. Agents wanting full html use /projects.json (json-twin).
const { data: projects } = await useAsyncData(
  'projects-page-data-slim',
  async () => {
    try {
      return await $fetch('/api/projects?slim=1')
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return []
    }
  }
)

// Flagships open the page. A deliberate order (not date) so the FIRST screen
// spans the range — investigative journalism, a marquee client, data viz, a
// signature tool, a creative-coding piece — instead of just "newest first".
const FLAGSHIP_ORDER = [
  'ccrb-clusters',
  'nbc-big-board',
  'gem-viz',
  'scrapbook-core',
  'motorcycle-viz',
  'connectology',
  'paramilitary-leaks',
  'pixel-canvas',
  'dataproofer',
  'flipper-generative-art',
  'hexagram-motion-graphics',
]
const flagshipRank = (p) => {
  const s = p.slug?.replace(/^projects\//, '') || ''
  const i = FLAGSHIP_ORDER.indexOf(s)
  return i === -1 ? 999 : i
}

const featuredProjects = computed(() =>
  (projects.value?.filter((p) => p.metadata?.featured) || [])
    .slice()
    .sort((a, b) => flagshipRank(a) - flagshipRank(b))
)

const regularProjects = computed(
  () => projects.value?.filter((p) => !p.metadata?.featured) || []
)

const getProjectSlug = (project) =>
  project.slug?.replace(/^projects\//, '') || ''

// The archive: everything not a flagship, grouped into categories. Leading with
// Client & Newsroom makes the professional/journalism range legible up front;
// Tools & Terminal (the biggest bucket) sits last so it doesn't drown the rest.
const CATEGORY_ORDER = [
  'Journalism',
  'Dataviz',
  'Art',
  'Hardware',
  'Activism',
  'Apps',
  'Tools',
]
const categorySlug = (c) =>
  'cat-' +
  c
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const archiveGroups = computed(() => {
  const groups = {}
  for (const p of regularProjects.value) {
    const c = p.metadata?.category || 'Other'
    ;(groups[c] ||= []).push(p)
  }
  // Within a group: newest first (regularProjects already arrives date-desc).
  const ordered = [...CATEGORY_ORDER, 'Other'].filter((c) => groups[c]?.length)
  return ordered.map((c) => ({
    category: c,
    slug: categorySlug(c),
    projects: groups[c],
  }))
})

// Oversized archive groups (the 40-item Tools wall) collapse to a few rows
// with an in-place expander — the volume is a real velocity signal, so keep
// it a click away rather than deleting it, but stop it from burying the
// journalism. VISIBLE fills exactly three sm:grid-cols-3 rows.
const COLLAPSE_THRESHOLD = 12
const VISIBLE_WHEN_COLLAPSED = 9
const expandedGroups = ref(new Set())

const isCollapsible = (group) => group.projects.length > COLLAPSE_THRESHOLD
const isExpanded = (group) => expandedGroups.value.has(group.slug)
const visibleProjects = (group) =>
  !isCollapsible(group) || isExpanded(group)
    ? group.projects
    : group.projects.slice(0, VISIBLE_WHEN_COLLAPSED)
const hiddenInGroup = (group) =>
  isCollapsible(group) && !isExpanded(group)
    ? group.projects.length - VISIBLE_WHEN_COLLAPSED
    : 0
const toggleGroup = (slug) => {
  const next = new Set(expandedGroups.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  expandedGroups.value = next
}

// A deep link (#some-tool-slug) into a collapsed group must still resolve —
// expand the group that owns the hash target, then let the browser scroll.
onMounted(() => {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  if (!hash) return
  const owner = archiveGroups.value.find(
    (g) =>
      isCollapsible(g) && g.projects.some((p) => getProjectSlug(p) === hash)
  )
  if (
    owner &&
    !visibleProjects(owner).some((p) => getProjectSlug(p) === hash)
  ) {
    expandedGroups.value = new Set(expandedGroups.value).add(owner.slug)
    nextTick(() => document.getElementById(hash)?.scrollIntoView())
  }
})

const { tocTarget } = useTOC()

// Buyer-facing proof for the header bar. Names buyers scan for beat
// word-counts — these are the checkable credentials, kept as plain facts.
const CREDENTIALS = [
  'NBC News',
  'Gothamist / WNYC',
  'Knight Foundation',
  'Global Energy Monitor',
]

// Velocity signal that also earns the tool archive its keep: how many
// projects shipped in the current era (2024+).
const recentCount = computed(
  () =>
    projects.value?.filter((p) => {
      const d = p.metadata?.date || p.date
      return d && new Date(d).getFullYear() >= 2024
    }).length || 0
)

const tocLinkClass = 'block text-zinc-600 dark:text-zinc-400 truncate'

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

// Helper: word count (precomputed server-side)
const wordCountOf = (p) => p?.wordCount || 0

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
  const y = scaleSqrt().domain([0, maxWords]).range([0, height])

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

// numberOfItems must match the emitted elements (parsers flag the mismatch),
// and the list follows page order: flagships first, then the rest.
const projectsSchema = computed(() => {
  const listed = [...featuredProjects.value, ...regularProjects.value].slice(
    0,
    20
  )
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Projects',
    numberOfItems: listed.length,
    itemListElement: listed.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://ejfox.com/projects/${getProjectSlug(p)}`,
      name: p.metadata?.title || p.title,
    })),
  }
})

usePageSeo({
  title: 'Projects · EJ Fox',
  description:
    'Selected work: data visualizations, newsroom tooling, and investigative dashboards shipped via room302.studio and EJ Fox.',
  type: 'website',
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
      // innerHTML, NOT children: unhead serializes `children` into a literal
      // HTML attribute, leaving the script element EMPTY — parsers read text
      // content, so the schema was invisible to Google.
      innerHTML: JSON.stringify(projectsSchema.value),
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

      <!-- Buyer-facing pitch: /projects is the conversion surface, so say what
           I do and that I'm available before the work scrolls. Kept to the
           editorial serif so it reads as a lede, not a banner ad. -->
      <p
        class="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl leading-snug mb-3"
      >
        I build data visualization and investigative data tools for newsrooms
        and startups — from broadcast election graphics to 200&nbsp;GB leak
        explorers.
        <span class="text-zinc-500 dark:text-zinc-400">
          Currently taking one client.
        </span>
        <NuxtLink
          to="/calendar"
          class="whitespace-nowrap underline decoration-1 underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Book a call →
        </NuxtLink>
      </p>

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

      <!-- Buyer facts, not self-measurement: credentials buyers can check
           lead, then range + velocity. (Was words/images/read-time — the
           page counting itself told busy buyers to leave.) -->
      <div
        class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 tabular-nums"
      >
        <span
          v-for="cred in CREDENTIALS"
          :key="cred"
          class="text-zinc-900 dark:text-zinc-100"
        >
          {{ cred }}
        </span>
        <span>
          {{ projects?.length || 0 }} projects · {{ earliestYear }}–{{
            latestYear
          }}
        </span>
        <span>{{ recentCount }} shipped since 2024</span>
        <span>{{ totalTech }} technologies</span>
      </div>

      <!-- Word-count stem plot: HTML/CSS bars, never stretched. Exposed to AT
           as one summarized image; the 1px stems stay mouse-hoverable but are
           out of the tab order (100 one-pixel tab stops helped no one). -->
      <div
        v-if="stemPlot.stems.length"
        role="img"
        class="hidden sm:flex print:hidden mt-2 stem-plot items-end gap-px h-2 max-w-prose"
        aria-label="Word count per project, oldest to newest"
      >
        <a
          v-for="stem in stemPlot.stems"
          :key="`stem-${stem.slug}`"
          :href="`#${stem.slug}`"
          tabindex="-1"
          aria-hidden="true"
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

    <!-- Flagships - image-forward rows, deliberately ordered to span the range
         on the first screen. Bigger type + imagery are the "flagship" cue. -->
    <div v-if="featuredProjects.length" class="mb-20 space-y-16">
      <template v-for="(project, i) in featuredProjects" :key="project.slug">
        <ProjectRow
          :id="getProjectSlug(project)"
          :project="project"
          featured
          :eager="i === 0"
        />
      </template>
    </div>

    <!-- Archive - the other ~90, grouped by category into a compact grid.
         Still image-first (a thumbnail each), just dense: browse the whole
         body of work without a firehose of full-bleed rows. -->
    <section
      v-for="group in archiveGroups"
      :id="group.slug"
      :key="group.category"
      class="mb-14 scroll-mt-24"
    >
      <div
        class="flex items-baseline justify-between gap-4 rule-dotted-b pb-2 mb-5"
      >
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
        >
          {{ group.category }}
        </h2>
        <span
          class="font-mono text-3xs text-zinc-400 dark:text-zinc-600 tabular-nums"
        >
          {{ group.projects.length }}
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10">
        <ProjectArchiveCard
          v-for="project in visibleProjects(group)"
          :key="project.slug"
          :project="project"
        />
      </div>

      <!-- Collapse expander for oversized groups: velocity signal preserved,
           one click away, without a separate page to maintain. -->
      <button
        v-if="hiddenInGroup(group) > 0"
        type="button"
        class="mt-5 font-mono text-2xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        :aria-expanded="isExpanded(group)"
        @click="toggleGroup(group.slug)"
      >
        + {{ hiddenInGroup(group) }} more experiments →
      </button>
      <button
        v-else-if="isCollapsible(group) && isExpanded(group)"
        type="button"
        class="mt-5 font-mono text-2xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        :aria-expanded="true"
        @click="toggleGroup(group.slug)"
      >
        − collapse
      </button>
    </section>

    <!-- TOC - flagships, then category jump-links. Mirrors the page structure
         instead of listing all 100 projects flat. -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="font-mono text-3xs">
          <div
            class="uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-1"
          >
            Flagships
          </div>
          <ul class="space-y-0.5 list-none pl-0 mb-4">
            <li v-for="project in featuredProjects" :key="project.slug">
              <a :href="`#${getProjectSlug(project)}`" :class="tocLinkClass">
                {{ project.title || project.metadata?.title }}
              </a>
            </li>
          </ul>
          <div
            class="uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-1"
          >
            Archive
          </div>
          <ul class="space-y-0.5 list-none pl-0">
            <li v-for="group in archiveGroups" :key="group.slug">
              <a
                :href="`#${group.slug}`"
                class="flex items-baseline justify-between gap-2 text-zinc-600 dark:text-zinc-400"
              >
                <span class="truncate">{{ group.category }}</span>
                <span class="text-zinc-400 dark:text-zinc-600 tabular-nums">
                  {{ group.projects.length }}
                </span>
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
