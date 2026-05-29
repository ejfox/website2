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

// Helper: get a project's primary year (from metadata.date)
const projectYear = (p) => {
  const date = p?.metadata?.date || p?.date
  if (!date) return null
  const y = new Date(date).getFullYear()
  return Number.isNaN(y) ? null : y
}

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

// --- Sparkbar timeline data ---
// Bucket projects by year between earliestYear..latestYear.
// For each year: total count, featured count, draft count, first project (for anchor).
const yearBuckets = computed(() => {
  if (!projects.value?.length) return []
  const first = earliestYear.value
  const last = latestYear.value
  if (!Number.isFinite(first) || !Number.isFinite(last)) return []

  // index by year
  const byYear = new Map()
  for (let y = first; y <= last; y += 1) {
    byYear.set(y, { year: y, total: 0, featured: 0, drafts: 0, firstSlug: '' })
  }
  // Sort projects by date asc so firstSlug is the chronologically first project of that year
  const sorted = [...projects.value]
    .map((p) => ({
      p,
      y: projectYear(p),
      ts: new Date(p.metadata?.date || p.date || 0).getTime(),
    }))
    .filter((x) => x.y != null && byYear.has(x.y))
    .sort((a, b) => a.ts - b.ts)

  for (const { p, y } of sorted) {
    const b = byYear.get(y)
    b.total += 1
    if (p.metadata?.featured) b.featured += 1
    if (p.metadata?.draft) b.drafts += 1
    if (!b.firstSlug) b.firstSlug = slugOf(p)
  }
  return Array.from(byYear.values())
})

// Sparkbar SVG geometry (uses viewBox — responsive without measuring DOM)
const sparkbar = computed(() => {
  const buckets = yearBuckets.value
  if (!buckets.length) {
    return {
      buckets: [],
      width: 0,
      height: 32,
      barWidth: 0,
      gap: 2,
      maxCount: 0,
      tickY: 32,
    }
  }
  // viewBox units: 4px per bucket gap, bar widths fill the rest
  const gap = 2
  const barWidth = 10
  const height = 28 // bar area
  const labelArea = 10 // numerals row
  const totalHeight = height + labelArea
  const width = buckets.length * (barWidth + gap) - gap
  const maxCount = Math.max(1, ...buckets.map((b) => b.total))
  return {
    buckets,
    width,
    height,
    totalHeight,
    barWidth,
    gap,
    maxCount,
    tickY: height + 8,
  }
})

// Compute per-bar segments (total/featured/draft heights) using d3 scale
const sparkbarBars = computed(() => {
  const { buckets, height, barWidth, gap, maxCount } = sparkbar.value
  if (!buckets.length) return []
  const y = d3.scaleLinear().domain([0, maxCount]).range([0, height])
  return buckets.map((b, i) => {
    const x = i * (barWidth + gap)
    const totalH = y(b.total)
    const featH = y(b.featured)
    const draftH = y(b.drafts)
    return {
      ...b,
      x,
      barWidth,
      totalH,
      totalY: height - totalH,
      featH,
      featY: height - featH,
      draftH,
      draftY: height - totalH, // draft outline sits at top of stack
      labelX: x + barWidth / 2,
    }
  })
})

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

      <!-- Word-count stem plot: one stem per project, sqrt-scaled, chronological -->
      <div v-if="stemPlot.stems.length" class="hidden sm:block mt-2 stem-plot">
        <svg
          :viewBox="`0 0 ${stemPlot.width} ${stemPlot.height}`"
          preserveAspectRatio="none"
          class="w-full block"
          :style="{ height: '8px' }"
          role="img"
          aria-label="Word count per project, oldest to newest"
        >
          <g>
            <a
              v-for="stem in stemPlot.stems"
              :key="`stem-${stem.slug}`"
              :href="`#${stem.slug}`"
              class="stem-link"
            >
              <!-- invisible full-height hit target so tiny stems are still clickable -->
              <rect
                :x="stem.x"
                :y="0"
                :width="stem.width + 1"
                :height="stemPlot.height"
                fill="transparent"
              />
              <rect
                :x="stem.x"
                :y="stem.yTop"
                :width="stem.width"
                :height="stem.h"
                class="fill-zinc-400 dark:fill-zinc-600"
              >
                <title>
                  {{ stem.title }} · {{ stem.words.toLocaleString() }} words
                </title>
              </rect>
            </a>
          </g>
        </svg>
      </div>

      <!-- Sparkbar timeline: one bar per year, featured overlay darker, draft outline -->
      <div v-if="sparkbar.buckets.length" class="mt-4 sparkbar-timeline">
        <svg
          :viewBox="`0 0 ${sparkbar.width} ${sparkbar.totalHeight}`"
          preserveAspectRatio="none"
          class="w-full block"
          :style="{ height: `${sparkbar.totalHeight}px` }"
          role="img"
          :aria-label="`Projects per year from ${earliestYear} to ${latestYear}`"
        >
          <g>
            <a
              v-for="bar in sparkbarBars"
              :key="`bar-${bar.year}`"
              :href="bar.firstSlug ? `#${bar.firstSlug}` : null"
              class="sparkbar-link"
            >
              <!-- invisible hit target spanning full column -->
              <rect
                :x="bar.x"
                :y="0"
                :width="bar.barWidth"
                :height="sparkbar.height"
                fill="transparent"
              />
              <!-- total count bar (base layer) -->
              <rect
                v-if="bar.totalH > 0"
                :x="bar.x"
                :y="bar.totalY"
                :width="bar.barWidth"
                :height="bar.totalH"
                class="fill-zinc-300 dark:fill-zinc-700"
              />
              <!-- featured overlay (darker segment at bottom of bar) -->
              <rect
                v-if="bar.featH > 0"
                :x="bar.x"
                :y="sparkbar.height - bar.featH"
                :width="bar.barWidth"
                :height="bar.featH"
                class="fill-zinc-900 dark:fill-zinc-100"
              />
              <!-- draft segment: hollow outline at top of stack -->
              <rect
                v-if="bar.draftH > 0"
                :x="bar.x + 0.5"
                :y="bar.draftY + 0.5"
                :width="bar.barWidth - 1"
                :height="Math.max(0, bar.draftH - 1)"
                fill="none"
                stroke="currentColor"
                stroke-width="0.5"
                class="text-zinc-500"
              />
              <title>
                {{ bar.year }} · {{ bar.total }} project{{
                  bar.total === 1 ? '' : 's'
                }}<template v-if="bar.featured"> ·
                {{ bar.featured }} featured</template><template
                v-if="bar.drafts"> · {{ bar.drafts }} draft{{
                  bar.drafts === 1 ? '' : 's'
                }}</template>
              </title>
            </a>
            <!-- Every 5th year tick label -->
            <text
              v-for="bar in sparkbarBars.filter((b) => b.year % 5 === 0)"
              :key="`tick-${bar.year}`"
              :x="bar.labelX"
              :y="sparkbar.tickY"
              text-anchor="middle"
              class="fill-zinc-500"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
              font-size="6"
            >
              {{ bar.year }}
            </text>
          </g>
        </svg>
      </div>
    </header>

    <div v-if="!projects?.length" class="text-center py-8">
      <p class="text-zinc-500">No projects found.</p>
    </div>

    <!-- Featured Projects - full-bleed image-forward rows. -->
    <!-- mx-[calc(50%-50vw)] escapes the page padding so featured rows go
         viewport-wide. Inner padding restores comfortable side gutters.
         The visual jump (no max-width, bigger inset) is the "Featured" cue. -->
    <div
      v-if="featuredProjects.length"
      class="mb-12 mx-[calc(50%-50vw)] px-4 sm:px-8 xl:px-16 space-y-10 divide-y divide-zinc-200 dark:divide-zinc-800"
    >
      <template
        v-for="(project, index) in featuredProjects"
        :key="project.slug"
      >
        <!-- Year gutter marker: appears at year boundaries between rows.
             Sticky inline header on small screens, big numeral in the
             left margin on lg+. Pure inline computation — no script. -->
        <div
          v-if="
            (() => {
              const d = project.metadata?.date || project.date
              const y = d ? new Date(d).getFullYear() : null
              const pd =
                featuredProjects[index - 1]?.metadata?.date ||
                featuredProjects[index - 1]?.date
              const py = pd ? new Date(pd).getFullYear() : null
              return y && y !== py
            })()
          "
          class="year-marker relative font-serif font-light text-zinc-200 dark:text-zinc-800 tabular-nums select-none"
          :class="index > 0 ? 'pt-10' : ''"
        >
          <div
            class="sticky top-0 z-10 py-2 text-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm lg:hidden"
          >
            {{ new Date(project.metadata?.date || project.date).getFullYear() }}
          </div>
          <div
            class="hidden lg:block absolute left-[-5rem] xl:left-[-7rem] top-0 text-5xl xl:text-6xl leading-none"
            aria-hidden="true"
          >
            {{ new Date(project.metadata?.date || project.date).getFullYear() }}
          </div>
        </div>

        <ProjectRow
          :id="getProjectSlug(project)"
          :project="project"
          featured
          :class="index > 0 ? 'pt-10' : ''"
        />
      </template>
    </div>

    <!-- Everything else - compact image-forward rows, constrained. -->
    <div
      v-if="regularProjects.length"
      class="space-y-8 divide-y divide-zinc-200/60 dark:divide-zinc-800"
    >
      <template v-for="(project, index) in regularProjects" :key="project.slug">
        <div
          v-if="
            (() => {
              const d = project.metadata?.date || project.date
              const y = d ? new Date(d).getFullYear() : null
              const pd =
                regularProjects[index - 1]?.metadata?.date ||
                regularProjects[index - 1]?.date
              const py = pd ? new Date(pd).getFullYear() : null
              return y && y !== py
            })()
          "
          class="year-marker relative font-serif font-light text-zinc-200 dark:text-zinc-800 tabular-nums select-none"
          :class="index > 0 ? 'pt-8' : ''"
        >
          <div
            class="sticky top-0 z-10 py-2 text-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm lg:hidden"
          >
            {{ new Date(project.metadata?.date || project.date).getFullYear() }}
          </div>
          <div
            class="hidden lg:block absolute left-[-5rem] xl:left-[-7rem] top-0 text-5xl xl:text-6xl leading-none"
            aria-hidden="true"
          >
            {{ new Date(project.metadata?.date || project.date).getFullYear() }}
          </div>
        </div>

        <ProjectRow
          :id="getProjectSlug(project)"
          :project="project"
          :class="index > 0 ? 'pt-8' : ''"
        />
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
/* Stem plot: subtle zinc tint on hover */
.stem-plot a.stem-link {
  cursor: pointer;
  outline: none;
}
.stem-plot a.stem-link:hover rect:last-of-type,
.stem-plot a.stem-link:focus-visible rect:last-of-type {
  fill: rgb(24 24 27); /* zinc-900 */
}
:global(.dark) .stem-plot a.stem-link:hover rect:last-of-type,
:global(.dark) .stem-plot a.stem-link:focus-visible rect:last-of-type {
  fill: rgb(244 244 245); /* zinc-100 */
}

/* Sparkbar: bump opacity / darken on hover */
.sparkbar-timeline a.sparkbar-link {
  cursor: pointer;
  outline: none;
}
.sparkbar-timeline a.sparkbar-link:hover rect,
.sparkbar-timeline a.sparkbar-link:focus-visible rect {
  opacity: 0.85;
}
.sparkbar-timeline a.sparkbar-link:hover rect:nth-of-type(1) {
  /* invisible hit target — give it a faint tint to telegraph the column */
  fill: rgba(113, 113, 122, 0.08); /* zinc-500/8 */
}
</style>
