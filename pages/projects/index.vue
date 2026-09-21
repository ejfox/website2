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
  'subway-builder',
  'paperclip',
  'gem-viz',
  'pixel-canvas',
  'ccrb-clusters',
  'nbc-big-board',
  'connectology',
  'paramilitary-leaks',
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

// The archive: everything not a flagship, grouped by YEAR (the spine) and then
// by theme within each year. Time is the primary axis — it tells the story of
// what got made when — with category as the secondary sort so each year still
// reads by kind of work. Category order below is that within-year importance.
const CATEGORY_ORDER = [
  'Journalism',
  'Dataviz',
  'Art',
  'Games',
  'Hardware',
  'Activism',
  'Apps',
  'Tools',
]
const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const projectYear = (p) => {
  const raw = p.metadata?.date || p.date
  const y = raw ? new Date(raw).getFullYear() : Number.NaN
  return Number.isNaN(y) ? null : y
}

// Recent years stand alone as the spine; the thin early years (1–2 projects
// each) collapse into one "Earlier" bucket so the page isn't a wall of tiny
// single-item year headers. The window rolls forward on its own.
const EARLIER_BEFORE = new Date().getFullYear() - 2
const yearBucketLabel = (p) => {
  const y = projectYear(p)
  if (!y) return 'Earlier'
  return y >= EARLIER_BEFORE ? String(y) : 'Earlier'
}

const archiveGroups = computed(() => {
  // First split into year buckets, then theme-within-year.
  const byYear = {}
  for (const p of regularProjects.value) {
    const yb = yearBucketLabel(p)
    ;(byYear[yb] ||= []).push(p)
  }
  const yearKeys = Object.keys(byYear).sort((a, b) => {
    if (a === 'Earlier') return 1
    if (b === 'Earlier') return -1
    return Number(b) - Number(a)
  })
  return yearKeys.map((yk) => {
    const cats = {}
    for (const p of byYear[yk]) {
      const c = p.metadata?.category || 'Other'
      ;(cats[c] ||= []).push(p)
    }
    // Within a category: newest first (regularProjects arrives date-desc).
    const orderedCats = [...CATEGORY_ORDER, 'Other'].filter(
      (c) => cats[c]?.length
    )
    const yearSlug = 'yr-' + slugify(yk)
    // Adaptive density: only break a year into theme sub-headers when it holds
    // enough work to warrant it. A thin year (a handful of cards) reads far
    // better as one clean grid than as three one-card sections with headers.
    const count = byYear[yk].length
    const dense = count >= 8 && orderedCats.length >= 3
    return {
      year: yk,
      slug: yearSlug,
      count,
      dense,
      // one flat, category-ordered grid for the sparse case
      flat: orderedCats.flatMap((c) => cats[c]),
      categories: orderedCats.map((c) => ({
        category: c,
        slug: `${yearSlug}-${slugify(c)}`,
        projects: cats[c],
      })),
    }
  })
})

// Flip data/availability.json when a slot fills. Fails CLOSED: if we don't
// know, render nothing rather than claiming an opening.
const { data: availability } = await useAsyncData('availability', () =>
  $fetch('/api/availability').catch(() => ({ known: false }))
)
const availabilityLine = computed(() => {
  const a = availability.value
  if (!a?.known) return null
  if (a.openSlots > 0) {
    const slots =
      a.openSlots === 1 ? '1 slot is open' : `${a.openSlots} slots are open`
    return {
      text: `I take on ${a.capacity} projects at a time, and ${slots}`,
      cta: '→ grab a slot',
    }
  }
  return {
    text: a.bookedUntil
      ? `I take on ${a.capacity} projects at a time — full through ${a.bookedUntil}`
      : `I take on ${a.capacity} projects at a time, and I’m full right now`,
    cta: '→ say hi for the next one',
  }
})

const { tocTarget } = useTOC()

// Checkable facts — each is corroborated by a write-up in content/blog/projects.
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

// --- Projects-per-year activity sparkline ---
// One stem per calendar year, height ∝ number of projects shipped that year.
// Ordered oldest → newest (left → right). sqrt scaling so a big year doesn't
// dwarf the thin ones.
const stemPlot = computed(() => {
  if (!projects.value?.length) {
    return { stems: [], width: 0, height: 8 }
  }
  const stemWidth = 1
  const gap = 1
  const height = 8 // 8px baseline

  // Count projects per year (metadata.date || date → getFullYear).
  const counts = new Map()
  for (const p of projects.value) {
    const raw = p.metadata?.date || p.date
    const y = raw ? new Date(raw).getFullYear() : Number.NaN
    if (Number.isNaN(y)) continue
    counts.set(y, (counts.get(y) || 0) + 1)
  }
  const years = [...counts.keys()].sort((a, b) => a - b)

  const maxCount = Math.max(1, ...counts.values())
  const y = scaleSqrt().domain([0, maxCount]).range([0, height])

  const stems = years.map((year, i) => {
    const count = counts.get(year)
    const h = Math.max(0.5, y(count))
    return {
      year,
      count,
      x: i * (stemWidth + gap),
      width: stemWidth,
      h,
      yTop: height - h,
    }
  })
  const width = years.length * (stemWidth + gap) - gap
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

      <!-- EJ's line, verbatim. Also the /consulting hero. Don't reword. -->
      <p
        class="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl leading-snug mb-3"
      >
        I love making computers do things no one's seen before. For people I
        think are trying to make the world a better place. My freelance work
        pays for my journalism habit.
        <template v-if="availabilityLine">
          <span class="text-zinc-500 dark:text-zinc-400">
            {{ availabilityLine.text }}
          </span>
          <NuxtLink
            to="/calendar"
            class="whitespace-nowrap underline decoration-1 underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {{ availabilityLine.cta }}
          </NuxtLink>
        </template>
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

      <!-- Where the work ran, then its range and pace. Replaced a
           words/images/read-time row, which measured the page rather than
           the work. -->
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

      <!-- Projects-per-year sparkline: HTML/CSS bars, never stretched. Exposed
           to AT as one summarized image; the 1px stems stay mouse-hoverable but
           are out of the tab order (one-pixel tab stops helped no one). -->
      <div
        v-if="stemPlot.stems.length"
        role="img"
        class="hidden sm:flex print:hidden mt-2 stem-plot items-end gap-px h-2 max-w-prose"
        aria-label="Projects shipped per year"
      >
        <span
          v-for="stem in stemPlot.stems"
          :key="`stem-${stem.year}`"
          tabindex="-1"
          aria-hidden="true"
          class="stem block w-px relative h-full"
          :title="`${stem.year} · ${stem.count} project${
            stem.count === 1 ? '' : 's'
          }`"
        >
          <span
            class="block absolute bottom-0 left-0 right-0 bg-zinc-400 dark:bg-zinc-600 transition-colors"
            :style="{ height: (stem.h / stemPlot.height) * 100 + '%' }"
          />
        </span>
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

    <!-- Archive - everything past the flagships, on a YEAR spine. Image-first
         (a thumbnail each), dense: the whole body of work as a timeline without
         a firehose of full-bleed rows. Thin years render as one clean grid;
         full years break into themes (see `dense`). -->
    <div
      v-if="archiveGroups.length"
      class="rule-dotted-b pb-2 mb-8 flex items-baseline justify-between gap-4"
    >
      <h2
        class="font-mono text-2xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600"
      >
        Archive · by year
      </h2>
      <span
        class="font-mono text-3xs text-zinc-400 dark:text-zinc-600 tabular-nums"
      >
        {{ regularProjects.length }}
      </span>
    </div>

    <section
      v-for="yr in archiveGroups"
      :id="yr.slug"
      :key="yr.year"
      class="mb-16 scroll-mt-24"
    >
      <!-- Year: the spine header -->
      <div
        class="flex items-baseline justify-between gap-4 border-b border-zinc-300 dark:border-zinc-700 pb-2 mb-6"
      >
        <h2
          class="font-mono text-lg tracking-tight text-zinc-800 dark:text-zinc-200 tabular-nums"
        >
          {{ yr.year }}
        </h2>
        <span
          class="font-mono text-3xs text-zinc-400 dark:text-zinc-600 tabular-nums"
        >
          {{ yr.count }} project{{ yr.count === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Full year → theme sub-headers -->
      <template v-if="yr.dense">
        <div
          v-for="cat in yr.categories"
          :id="cat.slug"
          :key="cat.slug"
          class="mb-8 scroll-mt-24"
        >
          <div class="flex items-baseline gap-2 mb-4">
            <h3
              class="font-mono text-2xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500"
            >
              {{ cat.category }}
            </h3>
            <span
              class="font-mono text-3xs text-zinc-400 dark:text-zinc-600 tabular-nums"
            >
              {{ cat.projects.length }}
            </span>
          </div>

          <div
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10"
          >
            <ProjectArchiveCard
              v-for="project in cat.projects"
              :key="project.slug"
              :project="project"
            />
          </div>
        </div>
      </template>

      <!-- Thin year → one clean grid, category-ordered, no sub-headers -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10"
      >
        <ProjectArchiveCard
          v-for="project in yr.flat"
          :key="project.slug"
          :project="project"
        />
      </div>
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
            <li v-for="yr in archiveGroups" :key="yr.slug">
              <a
                :href="`#${yr.slug}`"
                class="flex items-baseline justify-between gap-2 text-zinc-600 dark:text-zinc-400"
              >
                <span class="truncate tabular-nums">{{ yr.year }}</span>
                <span class="text-zinc-400 dark:text-zinc-600 tabular-nums">
                  {{ yr.count }}
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
.stem-plot .stem:hover span,
.stem-plot .stem:focus-visible span {
  background-color: rgb(24 24 27); /* zinc-900 */
}
:global(.dark) .stem-plot .stem:hover span,
:global(.dark) .stem-plot .stem:focus-visible span {
  background-color: rgb(244 244 245); /* zinc-100 */
}
</style>
