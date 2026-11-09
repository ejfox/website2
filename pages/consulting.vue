<!-- eslint-disable max-len, vue/max-len -->
<!--
  @file consulting.vue
  @description /consulting: the hire-me page. EJ's words, client logos
    (public/logos/), quotes and an inline Cal.com booking embed. Data:
    /api/availability (SSR, reads data/availability.json) and
    /api/cal/available-slots (client-only lazy fetch). SSR, no special routeRule.
  @gotchas Sidebar status is teleported into #nav-toc-container, which lives in
    layouts/default.vue. Booking links carry first-touch UTM params
    (utils/firstTouch.ts); CTAs fire the `consulting-book` Umami event.
    Copy comes from index.md and EJ's 2026-11-04 interview, not from robots:
    don't add lines, and don't cut quotes, credits or client names without asking.
-->
<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { calParams, readFirstTouch } from '~/utils/firstTouch'
import resume from '~/public/resume.json'

const isDark = useDark()

// ── Availability data ───────────────────────────────────────
// data/availability.json, the one source for /projects, /now and this page.
// Fails closed: a failed fetch or { known: false } renders no capacity claim.
const { data: availability } = await useFetch('/api/availability')

// Next available Cal.com slots for intro calls (lazy - not critical for SSR)
const { data: calSlots } = useLazyFetch('/api/cal/available-slots', {
  query: { duration: '30min', days: 21 },
  default: () => ({ slots: [] }),
  server: false,
})

// Sidebar status: client capacity from the hand-edited JSON. Like the
// homepage, it's dropped once asOf is over 60 days old, not left to go wrong.
const availabilityLine = computed(() => {
  const a = availability.value
  if (!a?.known || !a.asOf) return ''
  if ((Date.now() - new Date(a.asOf).getTime()) / 86400000 > 60) return ''
  return a.openSlots > 0
    ? `${a.openSlots} of ${a.capacity} client slots open`
    : 'Fully booked'
})

// The soonest open slot, for the hero's booking button.
const heroSlot = computed(() => calSlots.value?.slots?.[0] || null)

// Next intro call, live from Cal.com: a separate fact from client capacity.
const nextCallLine = computed(() => {
  const next = calSlots.value?.slots?.[0]
  return next
    ? `Next call ${next.time} ET ${next.day.slice(0, 3)}, ${next.date}`
    : ''
})

// ── Cal.com embed + sidebar ─────────────────────────────────
// Sidebar teleport target
const tocTarget = ref<Element | null>(null)

// Cal.com embed initialization + sidebar setup
onMounted(() => {
  initCalEmbed()
  // The sidebar Teleport renders only once this finds the layout's target
  // (v-if="tocTarget"); teleporting to a missing selector would warn.
  nextTick(() => {
    tocTarget.value = document.querySelector('#nav-toc-container')
  })
})

// The IIFE below is Cal.com's official embed loader snippet, typed just
// enough to compile. It stubs window.Cal to queue calls until embed.js loads.
function initCalEmbed() {
  if (!import.meta.client)
    return /* eslint-disable prefer-rest-params, @typescript-eslint/no-unused-expressions */
  ;(function (C, A, L) {
    const p = function (a: { q: unknown[] }, ar: unknown) {
      a.q.push(ar)
    }
    const d = C.document
    ;(C as Window & { Cal?: unknown }).Cal =
      (C as Window & { Cal?: unknown }).Cal ||
      function () {
        const cal = (
          C as unknown as Window & {
            Cal: { loaded?: boolean; ns: Record<string, unknown>; q: unknown[] }
          }
        ).Cal
        const ar = arguments
        if (!cal.loaded) {
          cal.ns = {}
          cal.q = cal.q || []
          d.head.appendChild(d.createElement('script')).src = A
          cal.loaded = true
        }
        if (ar[0] === L) {
          const api = function () {
            p(api as unknown as { q: unknown[] }, arguments)
          } as unknown as { q: unknown[] }
          const namespace = ar[1]
          api.q = api.q || []
          typeof namespace === 'string'
            ? (cal.ns[namespace] = api) && p(api, ar)
            : p(cal, ar)
          return
        }
        p(cal, ar)
      }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')
  /* eslint-enable prefer-rest-params, @typescript-eslint/no-unused-expressions */

  const win = window as Window & {
    Cal?: (action: string, config?: unknown) => void
  }
  win.Cal?.('init', { origin: 'https://cal.com' })

  win.Cal?.('inline', {
    elementOrSelector: '#cal-inline-embed',
    calLink: 'ejfox/30min?duration=20',
    layout: 'month_view',
    // First-touch utm_* + metadata[*] → booking + webhook (utils/firstTouch.ts)
    config: calParams(readFirstTouch()),
  })

  setTimeout(() => {
    updateCalTheme()
  }, 100)

  watch(isDark, () => updateCalTheme())
}

function updateCalTheme() {
  const win = window as Window & {
    Cal?: (action: string, config?: unknown) => void
  }
  if (!win.Cal) return
  win.Cal('ui', {
    theme: isDark.value ? 'dark' : 'light',
    hideEventTypeDetails: false,
    layout: 'month_view',
    styles: { branding: { brandColor: isDark.value ? '#a1a1aa' : '#3f3f46' } },
  })
}

// ── Work history ────────────────────────────────────────────
// Every job in resume.json, newest first as the resume lists them, with EJ's
// own highlight lines. Same source as resume.pdf, so the two can't drift.
const yearOf = (d) => String(d || '').slice(0, 4)
const workRows = resume.work.map((w) => {
  const start = yearOf(w.startDate)
  const end = w.endDate ? yearOf(w.endDate) : 'now'
  return { ...w, years: start === end ? start : `${start}–${end}` }
})

// ── Resume rows ─────────────────────────────────────────────
// Skips the three projects already shown with their own line above, and personal
// projects, which the homepage index covers, and any with no public link (they
// stay on the resume PDF; the work history above names those clients). Newest first: by end year, then
// start year, whatever order resume.json is in.
const SHOWN_ABOVE = [
  'Global Energy Ownership Tracker',
  'Paramilitary Leaks',
  'NYPD misconduct network',
]
const resumeProjects = computed(() =>
  resume.projects
    .filter(
      (p) => p.type !== 'personal' && p.url && !SHOWN_ABOVE.includes(p.name)
    )
    .map((p) => ({
      ...p,
      years:
        p.endDate && p.endDate !== p.startDate
          ? `${p.startDate}–${p.endDate}`
          : p.startDate,
    }))
    .sort(
      (a, b) =>
        (b.endDate || b.startDate) - (a.endDate || a.startDate) ||
        b.startDate - a.startDate
    )
)

// The core skill rows plus Methods ("joy-driven development" matters to EJ);
// Design & Motion stays on the resume PDF only.
const pageSkills = resume.skills.filter((s) =>
  ['Code', 'Graphics', 'AI/ML', 'Methods'].includes(s.name)
)

// ── Page content: logos, SEO ───────────────────
// Logo files live in public/logos/. Never add NDA clients here (see the
// "companies I can't name" line in the template).
// crop: the logo files carry very different amounts of empty canvas (NBC's ink
// fills 12% of its square), so each is cropped to its inked area and sized so
// every mark has about the same ink area (~1100px²). Numbers measured from the
// files with a canvas scan; re-measure if a file changes.
const CLIENT_LOGOS = [
  {
    name: 'NBC News',
    logo: '/logos/nbc-news.svg',
    crop: { w: 92, h: 12, imgW: 99.2, imgH: 99.2, left: -4.5, top: -43.6 },
  },
  {
    name: 'MSNBC',
    logo: '/logos/msnbc.svg',
    crop: { w: 71, h: 15, imgW: 75.6, imgH: 37.8, left: -2.8, top: -11.2 },
  },
  {
    name: 'CBS',
    logo: '/logos/cbs.svg',
    crop: { w: 33, h: 33, imgW: 33.3, imgH: 33.3, left: -0.1, top: 0 },
  },
  {
    name: 'Washington Post',
    logo: '/logos/wapo.svg',
    crop: { w: 36, h: 31, imgW: 35.9, imgH: 35.9, left: 0, top: -2.7 },
  },
  {
    name: 'Associated Press',
    logo: '/logos/ap.svg',
    crop: { w: 35, h: 31, imgW: 35, imgH: 40.5, left: 0, top: -9.5 },
  },
  {
    name: 'Consumer Reports',
    logo: '/logos/consumer-reports.svg',
    crop: { w: 66, h: 17, imgW: 86.6, imgH: 57.8, left: -10, top: -20.4 },
  },
  {
    name: 'GitHub',
    logo: '/logos/github.svg',
    crop: { w: 34, h: 33, imgW: 33.7, imgH: 33.7, left: 0, top: -0.4 },
  },
  {
    name: 'Gothamist',
    logo: '/logos/gothamist.svg',
    crop: { w: 86, h: 13, imgW: 91.1, imgH: 19.7, left: -0.5, top: -3.2 },
  },
  {
    name: 'WNYC',
    logo: '/logos/wnyc.svg',
    crop: { w: 70, h: 16, imgW: 78.9, imgH: 25.2, left: -0.1, top: -4.6 },
  },
  {
    name: 'Climate TRACE',
    logo: '/logos/climate-trace.svg',
    crop: { w: 109, h: 10, imgW: 134.8, imgH: 22.9, left: -0.7, top: -7.4 },
  },
  {
    name: 'Stamen',
    logo: '/logos/stamen.svg',
    crop: { w: 74, h: 15, imgW: 138.3, imgH: 27.7, left: -0.8, top: -6.2 },
  },
]

// Exact words and credits: don't edit, and don't cut one without asking EJ.
// Quotes about EJ first; the Subway Builder review (about the game) goes last.
const QUOTES = [
  {
    text: 'Gets things done quickly with an astonishing level of detail',
    name: 'Erik Hazzard',
    outlet: 'fmr Meta',
  },
  {
    text: 'Build things that would last… not just produce, but take ownership of long-term initiatives',
    name: 'Markham Nolan',
    outlet: 'Vocativ',
  },
  {
    text: 'Instant solutions to tough problems, under intense time pressure',
    name: 'Michael Small',
    outlet: 'NBC News',
  },
  {
    text: 'First election night where Chuck wasn’t frustrated with the app.',
    name: 'Producer, Meet the Press',
    outlet: 'NBC News, 2018',
  },
  {
    text: 'Subway Builder takes a minimalist visual approach that it knocks out of the park. Its real-life map contains every street and building you could see in person…',
    name: 'The Punished Backlog',
    outlet: 'on',
    to: '/projects/subway-builder',
    toLabel: 'Subway Builder',
    note: 'My corner of it: code contributions, Steam release infrastructure.',
    wide: true,
  },
]

usePageSeo({
  title: 'Consulting · EJ Fox',
  description: "I'm a hacker-journalist available for contract work.",
  type: 'website',
  section: 'Consulting',
  tags: ['Consulting', 'Data Visualization', 'Elections', 'Journalism'],
})
</script>

<template>
  <div class="bg-transparent">
    <!-- Every line is EJ's: index.md (2019 homepage wording) or his 2026-11-04
         interview. Don't add copy he didn't say. -->
    <div data-page-main class="container-main pt-8 max-w-2xl">
      <header class="intro">
        <h1 class="hero-title">
          I love making computers do things no one's seen before.
        </h1>
        <!-- A person talking, not a landing page: one paragraph with the
             booking link inline. The homepage's "(11am Monday?)" link in this
             same shape drew most booking clicks. The time is client-only. -->
        <div class="stack-24">
          <!-- Who first (EJ, 2026-11-09). Both sentences are his, from the
               Independent entry and its Select Clients line in resume.json. -->
          <p class="lead">
            I work between design and engineering, in whatever stack the client
            already has, from brand-new startups to big companies with their own
            process: GitHub, NBC News, CBS News, the Washington Post, the New
            York Times.
          </p>
          <p class="lead">
            I take the tight-deadline projects that need short sprints and real
            user testing, especially things no one has built before.
          </p>
          <p class="lead">
            You can
            <a
              href="#cal-inline-embed"
              class="link"
              data-umami-event="consulting-book"
              data-umami-event-location="consulting-hero"
              >grab 20 minutes on my calendar</a
            ><template v-if="heroSlot">
              (<a
                :href="heroSlot.bookingUrl"
                target="_blank"
                rel="noopener"
                class="link"
                data-umami-event="consulting-book"
                data-umami-event-location="consulting-hero-slot"
                >{{ heroSlot.time }} ET {{ heroSlot.day }}?</a
              >)</template
            >
            or email me at
            <a href="mailto:ejfox@ejfox.com" class="link">ejfox@ejfox.com</a>.
          </p>
        </div>
      </header>

      <section class="section">
        <p class="section-label">How I work</p>
        <div class="stack-24">
          <p class="body">
            If you hand me a dataset, I'll perform some lightweight
            meta-analysis: how much, what type, top entities, any
            graphs/hierarchies, any timelines or maps to be made. Then I'll
            bring them to the group to figure out how and where to dive in
            further, and turn it into a piece of narrative journalism with
            dataviz-first thinking.
          </p>
          <p class="body">
            By the end of the first day you'll have a map of what is in the
            pile, a sort of survey of the land in terms of data and resources,
            and probably a few custom built tools to let a non technical person
            do deep analysis and joy-based exploration on their own, without
            needing me to "be their hands".
          </p>
        </div>
      </section>

      <section class="section">
        <p class="section-label">Selected work</p>
        <div class="stack-32">
          <div class="stack-0">
            <p class="item-title">
              <NuxtLink to="/projects/gem-viz" class="link"
                >Global Energy Ownership Tracker</NuxtLink
              >
            </p>
            <p class="meta">Global Energy Monitor · 2025–2026</p>
            <p class="body mt-8">
              You can trace the full ownership chain behind a single project,
              down to the stakes held by the likes of BlackRock and EDF. The
              ownership chain is where a lot of the truth is.
            </p>
          </div>
          <div class="stack-0">
            <p class="item-title">
              <NuxtLink to="/projects/paramilitary-leaks" class="link"
                >Paramilitary Leaks</NuxtLink
              >
            </p>
            <p class="meta">with Micah Lee · 2025</p>
            <p class="body mt-8">
              We took a 200GB leak and turned it into something a reporter can
              explore in the browser.
            </p>
          </div>
          <div class="stack-0">
            <p class="item-title">
              <NuxtLink to="/projects/ccrb-clusters" class="link"
                >Clusters of NYPD Misconduct</NuxtLink
              >
            </p>
            <p class="meta">Gothamist · 2021</p>
            <p class="body mt-8">
              29,915 officer nodes, 159,671 relationships. When Gothamist
              reporter George Joseph took the names to the street and
              interviewed victims, the graph held up.
            </p>
          </div>
          <p class="body">
            You can send me an email at
            <a href="mailto:ejfox@ejfox.com" class="link"> ejfox@ejfox.com </a>
            (<a href="/pgp.txt" class="link">PGP</a>) or
            <a
              href="#cal-inline-embed"
              class="link"
              data-umami-event="consulting-book"
              data-umami-event-location="consulting-body"
            >
              grab some time on my calendar</a
            ><template v-if="heroSlot">
              (<a
                :href="heroSlot.bookingUrl"
                target="_blank"
                rel="noopener"
                class="link"
                data-umami-event="consulting-book"
                data-umami-event-location="consulting-body-slot"
                >{{ heroSlot.time }} ET {{ heroSlot.day }}?</a
              >)</template
            >.
          </p>
        </div>
      </section>

      <!-- Straight from public/resume.json: edit the resume, not this page -->
      <section class="section">
        <p class="section-label">Experience</p>
        <div class="stack-32">
          <div v-for="w in workRows" :key="w.name + w.position" class="row">
            <p class="meta">{{ w.years }}</p>
            <div>
              <p class="item-title">{{ w.position }}</p>
              <p class="meta">
                <a
                  v-if="w.url && !w.url.endsWith('/consulting')"
                  :href="w.url"
                  class="link"
                  >{{ w.name }}</a
                >
                <template v-else>{{ w.name }}</template>
              </p>
              <p v-if="w.summary" class="meta">{{ w.summary }}</p>
              <div v-if="w.highlights?.length" class="stack-8 mt-8">
                <p v-for="h in w.highlights" :key="h" class="body-sm">
                  {{ h }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <p class="section-label">Projects</p>
        <div>
          <div v-for="p in resumeProjects" :key="p.name" class="row">
            <p class="meta">{{ p.years }}</p>
            <p class="meta meta-strong">
              <a :href="p.url" class="link">{{ p.name }}</a
              ><template v-if="p.entity"> · {{ p.entity }}</template>
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <p class="section-label">Skills</p>
        <div>
          <div v-for="s in pageSkills" :key="s.name" class="row">
            <p class="meta">{{ s.name }}</p>
            <p class="meta meta-strong">{{ s.keywords.join(', ') }}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <p class="section-label">Clients</p>
        <div class="client-logos">
          <span
            v-for="client in CLIENT_LOGOS"
            :key="client.name"
            class="client-logo"
            :style="{
              width: `${client.crop.w}px`,
              height: `${client.crop.h}px`,
            }"
          >
            <img
              :src="client.logo"
              :alt="client.name"
              :style="{
                width: `${client.crop.imgW}px`,
                height: `${client.crop.imgH}px`,
                marginLeft: `${client.crop.left}px`,
                marginTop: `${client.crop.top}px`,
              }"
            />
          </span>
        </div>
      </section>

      <section class="section">
        <p class="section-label">Kind words</p>
        <div class="quotes">
          <figure
            v-for="q in QUOTES"
            :key="q.name"
            class="quote"
            :class="{ 'quote-wide': q.wide }"
          >
            <p class="quote-text">&ldquo;{{ q.text }}&rdquo;</p>
            <figcaption class="meta mt-8">
              <span class="meta-strong">{{ q.name }}</span
              >, {{ q.outlet }}
              <NuxtLink v-if="q.to" :to="q.to" class="link">
                {{ q.toLabel }}</NuxtLink
              ><template v-if="q.note">. {{ q.note }}</template>
            </figcaption>
          </figure>
        </div>
      </section>

      <figure class="section section-plain">
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="EJ Fox presenting election visualization on NBC's Big Board"
          class="w-full"
        />
        <figcaption class="meta mt-8">
          Early Big Board Web prototype at 30 Rock, circa 2018 ·
          <NuxtLink to="/projects" class="link">See more work</NuxtLink>
        </figcaption>
      </figure>

      <!-- #cal-inline-embed is filled by initCalEmbed(); the id is load-bearing -->
      <section id="book" class="section scroll-mt-24">
        <p class="section-label">Book a call</p>
        <p class="meta mb-24">20 minutes · free · times in Eastern</p>
        <div id="cal-inline-embed" class="cal-inline-embed" />
      </section>
    </div>

    <!-- Sidebar: Availability + CTA -->
    <!-- ClientOnly: the teleport target is looked up in onMounted, so SSR has none -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="sidebar-availability">
          <p v-if="availabilityLine" class="sidebar-status-line">
            {{ availabilityLine }}
          </p>
          <p v-if="nextCallLine" class="sidebar-status-line">
            {{ nextCallLine }}
          </p>

          <!-- CTA -->
          <a
            href="#cal-inline-embed"
            class="cta-button whitespace-nowrap"
            data-umami-event="consulting-book"
            data-umami-event-location="consulting-sidebar"
          >
            Book a Call
          </a>
          <p class="sidebar-cta-note">20 min · free</p>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* ============================================
   TYPE SYSTEM (EJ, 2026-11-09: "really professional, well-thought-out info
   hierarchy, the ENTIRE page, consistent and elegant").
   Two families: serif for prose, mono for metadata. Four sizes:
     display  h1                          serif 36/44
     lead     intro paragraphs            serif 20 (text-lg)
     body     prose, quotes, item titles  serif 18/28 (text-base)
     small    work highlights             serif 16/24 (text-sm)
     meta     years, orgs, labels, notes  mono 14/24 (text-xs + leading-6)
   Three tones (dark values all pass AA on #000):
     primary  zinc-900 / zinc-100   titles, quotes
     body     zinc-700 / zinc-300   prose
     meta     zinc-500 / zinc-400   metadata, labels
   Three gaps on an 8px grid: 8 inside an item, 24 between items (32 between
   larger items), 64 between sections. Each section opens with a hairline and
   a label; no boxes, no color.
   The !important resets beat global.css p/figure margins, which otherwise
   stack on top of these.
   ============================================ */
.intro {
  margin-bottom: 64px;
}

.section {
  margin: 64px 0 0;
  padding-top: 24px;
  @apply border-t border-zinc-200 dark:border-zinc-800;
}

/* The photo continues the quotes above it: no rule, no label. */
.section-plain {
  border-top: 0;
  padding-top: 0;
}

.intro p,
.section p,
.section figure,
.section figcaption {
  margin: 0 !important;
}

.section-label {
  @apply font-mono text-xs leading-6 text-zinc-500 dark:text-zinc-400;
  margin-bottom: 24px !important;
}

.intro .stack-24 > * + *,
.section .stack-24 > * + * {
  margin-top: 24px !important;
}

.section .stack-32 > * + * {
  margin-top: 32px !important;
}

.section .stack-8 > * + * {
  margin-top: 8px !important;
}

.section .mt-8 {
  margin-top: 8px !important;
}

.section .mb-24 {
  margin-bottom: 24px !important;
}

.hero-title {
  @apply font-serif text-3xl md:text-4xl font-normal text-zinc-900 dark:text-zinc-100;
  margin-bottom: 24px !important;
  letter-spacing: -0.02em;
}

.lead {
  @apply font-serif text-lg text-zinc-700 dark:text-zinc-300;
}

.body {
  @apply font-serif text-base leading-7 text-zinc-700 dark:text-zinc-300;
}

.body-sm {
  @apply font-serif text-sm leading-6 text-zinc-700 dark:text-zinc-300;
}

.item-title {
  @apply font-serif text-base leading-7 text-zinc-900 dark:text-zinc-100;
}

.meta {
  @apply font-mono text-xs leading-6 text-zinc-500 dark:text-zinc-400;
}

.meta-strong {
  @apply text-zinc-700 dark:text-zinc-300;
}

/* Label column + content: years or skill name on the left, aligned to the
   first line of the content. Stacks on phones. */
.row {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  column-gap: 24px;
}

@media (max-width: 639px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
  }
}

.link {
  @apply underline decoration-zinc-400 dark:decoration-zinc-600 underline-offset-4
         hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors;
}

/* ============================================
   CLIENT LOGOS
   ============================================ */
.client-logos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 32px 40px;
}

.client-logo {
  display: block;
  overflow: hidden;
  flex: none;
  opacity: 0.7;
}

.client-logo img {
  display: block;
  max-width: none;
  filter: grayscale(1);
}

.dark .client-logo img {
  filter: grayscale(1) invert(1);
}

@media (prefers-color-scheme: dark) {
  .client-logo img {
    filter: grayscale(1) invert(1);
  }
}

/* ============================================
   QUOTES
   ============================================ */
/* figure, not blockquote: global.css styles every blockquote with a wall of
   !important (ghost mark, italics, uppercase credits). */
.quotes {
  display: grid;
  gap: 32px;
}

@media (min-width: 640px) {
  .quotes {
    grid-template-columns: 1fr 1fr;
  }
}

/* Spacing separates the quotes; the section's hairline is the only rule. */
.quote {
  margin: 0;
}

.quote-wide {
  grid-column: 1 / -1;
}

.quote-text {
  @apply font-serif text-base leading-7 text-zinc-900 dark:text-zinc-100;
  text-indent: -0.42em; /* hang the opening mark so the text edge stays flush */
}

/* ============================================
   SIDEBAR
   ============================================ */
.sidebar-availability {
  /* px-2 matches the nav links above, so everything shares one left edge. */
  @apply px-2 font-mono text-xs text-zinc-600 dark:text-zinc-400;
}

.sidebar-status-line {
  @apply leading-5;
}

.sidebar-availability .cta-button {
  @apply mt-4;
}

.sidebar-cta-note {
  @apply mt-2;
}

/* ============================================
   CAL.COM EMBED
   ============================================ */
.cal-inline-embed {
  @apply min-h-[500px] w-full;
  /* Match Cal's light iframe document, or a scheme mismatch backs it with
     opaque white that shows at its rounded corners (see calendar.vue). */
  color-scheme: light;
  clip-path: inset(1px round 12px);
}

@media (min-width: 640px) {
  .cal-inline-embed {
    @apply min-h-[600px];
  }
}
</style>
