<!-- eslint-disable max-len, vue/max-len -->
<!--
  @file consulting.vue
  @description /consulting: the hire-me sales page. Scroll-scrubbed Cloudinary
    video behind a compact offer, proof, capabilities, engagements and booking
    CTAs. Data: /api/consulting-availability (SSR, reads
    data/consulting-availability.json) and /api/cal/available-slots (client-only
    lazy fetch). SSR, no special routeRule.
  @gotchas Sidebar status is teleported into #nav-toc-container, which lives in
    layouts/default.vue. Booking links carry first-touch UTM params
    (utils/firstTouch.ts); CTAs fire the `consulting-book` Umami event.
    Copy is EJ's voice: don't cut quotes, credits or client names without asking.
-->
<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

// ── Video background config (tweak these) ───────────────────
const VIDEO_CONFIG = {
  // Video source - Cloudinary optimized (f_auto=WebM/MP4, q_auto, vc_auto codec)
  src: 'https://res.cloudinary.com/ejf/video/upload/f_auto,q_auto,vc_auto/v1730768430/Connectology_Demo01',

  // Scroll-driven playback
  scrollDriven: true, // true = NYT-style scroll scrub, false = autoplay loop
  scrollStart: 15, // px: start scrubbing video at this scroll position
  scrollEnd: 3000, // px: scrub progress hits 100% at this scroll position
  // Fraction of the clip the full scroll range covers: at 0.2 the video only
  // ever plays its first 20%, reached at scrollEnd.
  speedMultiplier: 0.2, // lower = slower video relative to scroll (0.4 = 40% speed)

  // Inertia easing (anime.js)
  inertiaDuration: 200, // ms: how long the smooth catch-up takes
  inertiaEase: 'outQuad', // easing function for smooth scrubbing

  // Opacity fade
  fadeInStart: 74, // px: start fading in
  fadeInEnd: 250, // px: fully visible
  fadeOutStart: 2000, // px: start fading out
  fadeOutEnd: 2500, // px: fully invisible

  // Overlay
  overlayOpacity: 70, // percent: darkness of overlay (0-100)
}

// ── Scroll-scrubbed video ───────────────────────────────────
// Scroll-powered video background
const { y: scrollY } = useWindowScroll()

// Video element ref and scroll-driven playback
const videoRef = ref<HTMLVideoElement | null>(null)
const scrollDriven = ref(VIDEO_CONFIG.scrollDriven)

// Smooth inertia for video scrubbing using anime.js v4
const videoState = reactive({ time: 0 })
let currentAnimation: { pause: () => void } | null = null

watch(scrollY, async (scroll) => {
  if (!scrollDriven.value || !videoRef.value) return

  const video = videoRef.value
  // duration is NaN until metadata loads; scrolling before that is a no-op
  if (!video.duration) return

  // Calculate target time
  const scrollProgress = Math.max(
    0,
    Math.min(
      1,
      (scroll - VIDEO_CONFIG.scrollStart) /
        (VIDEO_CONFIG.scrollEnd - VIDEO_CONFIG.scrollStart)
    )
  )
  const targetTime =
    scrollProgress * video.duration * VIDEO_CONFIG.speedMultiplier

  // Use anime.js v4 for smooth inertia
  if (import.meta.client) {
    // Runs per scroll event; after the first call the import is a cached module
    const { animate } = await import('animejs')

    // Retarget instead of queueing: kill the in-flight tween, start from here
    if (currentAnimation) currentAnimation.pause()

    currentAnimation = animate(videoState, {
      time: targetTime,
      duration: VIDEO_CONFIG.inertiaDuration,
      ease: VIDEO_CONFIG.inertiaEase,
      onUpdate: () => {
        if (video) video.currentTime = videoState.time
      },
    })
  }
})

// Opacity controls visibility
const videoOpacity = computed(() => {
  const { fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd } = VIDEO_CONFIG

  if (scrollY.value < fadeInStart) return 0
  if (scrollY.value < fadeInEnd) {
    return (scrollY.value - fadeInStart) / (fadeInEnd - fadeInStart)
  }
  if (scrollY.value < fadeOutStart) return 1
  if (scrollY.value < fadeOutEnd) {
    return 1 - (scrollY.value - fadeOutStart) / (fadeOutEnd - fadeOutStart)
  }
  return 0
})

// ── Availability data ───────────────────────────────────────
// Consulting availability (hand-edited JSON)
interface ConsultingAvailability {
  currentQuarter: { name: string; status: string; message: string }
  nextQuarter: { name: string; status: string; message: string }
  allQuarters: any[]
  activeClientCount: number
  maxClients: number
  nextAvailable?: string | null
  error?: string
  [key: string]: unknown
}
const { data: availability } = await useFetch<ConsultingAvailability>(
  '/api/consulting-availability',
  {
    // Placeholder shape, used only when the fetch fails; the quarter names
    // are not kept current
    default: () => ({
      currentQuarter: {
        name: 'Q1 2025',
        status: 'unknown',
        message: 'Loading...',
      },
      nextQuarter: {
        name: 'Q2 2025',
        status: 'unknown',
        message: 'Loading...',
      },
      allQuarters: [],
      activeClientCount: 0,
      maxClients: 3,
      nextAvailable: null,
    }),
  }
)

// Next available Cal.com slots for intro calls (lazy - not critical for SSR)
const { data: calSlots, pending: calPending } = useLazyFetch(
  '/api/cal/available-slots',
  {
    query: { duration: '30min', days: 21, spread: 'day' },
    default: () => ({ slots: [] }),
    server: false,
  }
)

// Sidebar status. Cal.com is the source of truth, so this can't go stale; the
// JSON's nextAvailable is only a fallback (and the API drops it once past).
// No "N/3" capacity: nothing live knows how many engagements are running.
const availabilityLine = computed(() => {
  if (calPending.value) return ''
  const next = calSlots.value?.slots?.[0]
  if (next) return `Next call ${next.day.slice(0, 3)} ${next.date}`
  const opens = availability.value?.nextAvailable
  if (opens) {
    // Date-only string = UTC midnight; format in UTC so Mar 1 stays Mar 1
    const label = new Date(opens).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    return `Opens ${label}`
  }
  return 'Taking new clients'
})

// ── Booking + sidebar ───────────────────────────────────────
const CAL_LINK = 'https://cal.com/ejfox/30min?duration=20'

// Sidebar teleport target
const tocTarget = ref<Element | null>(null)

// Sidebar setup
onMounted(() => {
  // The sidebar Teleport renders only once this finds the layout's target
  // (v-if="tocTarget"); teleporting to a missing selector would warn.
  nextTick(() => {
    tocTarget.value = document.querySelector('#nav-toc-container')
  })
})

// ── Page content ────────────────────────────────────────────
const CLIENTS = [
  'NBC News',
  'MSNBC',
  'CBS',
  'The Washington Post',
  'Associated Press',
  'Consumer Reports',
  'GitHub',
  'Gothamist',
  'WNYC',
  'Climate TRACE',
  'Stamen',
]

const specialties = [
  {
    title: 'Rapid prototypes',
    description:
      'Napkin sketch Monday, working demo Friday—before a big commitment.',
  },
  {
    title: 'Live data systems',
    description:
      'Newsroom tools, maps, dashboards, and interfaces that hold up under pressure.',
  },
  {
    title: 'Useful AI workflows',
    description:
      'Models wired into real editorial, research, and product work—not demos for their own sake.',
  },
]

usePageSeo({
  title: 'Consulting · EJ Fox',
  description:
    'I design and ship ambitious data tools, newsroom systems, and prototypes for teams with a hard problem and not enough time.',
  type: 'website',
  section: 'Consulting',
  tags: ['Consulting', 'Data Visualization', 'Elections', 'Journalism'],
})
</script>

<template>
  <div class="bg-transparent">
    <!-- ── Video background ─────────── -->
    <!-- Fixed behind the content; hidden below md (see .video-container) -->
    <!-- Video Background -->
    <div class="video-container" :style="{ opacity: videoOpacity }">
      <video
        ref="videoRef"
        :autoplay="!scrollDriven"
        :loop="!scrollDriven"
        muted
        playsinline
        preload="auto"
        class="video-element"
      >
        <source :src="VIDEO_CONFIG.src" type="video/mp4" />
      </video>
      <div
        class="video-overlay"
        :style="{ opacity: VIDEO_CONFIG.overlayOpacity / 100 }"
      />
    </div>

    <!-- ── Main column ─────────── -->
    <div data-page-main class="container-main pt-8 max-w-2xl relative z-10">
      <!-- Hero -->
      <header class="section hero">
        <p class="hero-label">Independent product &amp; data consultant</p>
        <h1 class="hero-title">I design and ship ambitious data tools—fast.</h1>
        <p class="body-lg mb-4">
          I help newsrooms, public-interest teams, and ambitious founders turn a
          hard problem into a working prototype or production system. The thing
          that didn't exist Tuesday is demoing Friday.
        </p>
        <p class="hero-flourish">
          I love making computers do things no one's seen before. The world is
          editable.
        </p>

        <div class="hero-actions">
          <a
            :href="CAL_LINK"
            target="_blank"
            rel="noopener"
            class="hero-cta-primary"
            data-umami-event="consulting-book"
            data-umami-event-location="consulting-hero"
          >
            Book a 20-minute fit check
          </a>
          <a
            href="mailto:ejfox@ejfox.com?subject=Project%20inquiry"
            class="hero-cta-secondary"
            data-umami-event="contact-email"
            data-umami-event-location="consulting-hero"
          >
            Email me about a project
          </a>
        </div>
        <p class="hero-cta-note">Free · no pitch</p>

        <div v-if="calSlots?.slots?.length" class="next-slot">
          <p class="next-slot-time">
            Next open: {{ calSlots.slots[0].time }} {{ calSlots.slots[0].day }},
            {{ calSlots.slots[0].date }}
          </p>
          <a
            :href="calSlots.slots[0].bookingUrl"
            target="_blank"
            rel="noopener"
            class="next-slot-link"
            data-umami-event="consulting-book"
            data-umami-event-location="consulting-hero-slot"
          >
            Grab this time
          </a>
          <NuxtLink to="/calendar" class="next-slot-link">
            More times
          </NuxtLink>
        </div>

        <NuxtLink to="/projects/nbc-big-board" class="hero-proof">
          <span class="hero-proof-label">Proof under pressure</span>
          <span class="hero-proof-copy">
            I built NBC News' Big Board for an election night watched by
            millions of people.
          </span>
          <span class="hero-proof-link">Read the case study →</span>
        </NuxtLink>
      </header>

      <!-- Specialties -->
      <section class="section">
        <h2 class="section-label">What I can help with</h2>
        <div class="capability-grid">
          <article
            v-for="s in specialties"
            :key="s.title"
            class="specialty-card"
          >
            <h3 class="specialty-title">{{ s.title }}</h3>
            <p class="specialty-desc">{{ s.description }}</p>
          </article>
        </div>
      </section>

      <!-- Clients + one useful quote -->
      <section class="section clients-panel">
        <h2 class="section-label">People I've worked with</h2>
        <ul class="client-list" aria-label="Selected clients">
          <li v-for="client in CLIENTS" :key="client" class="client-name">
            {{ client }}
          </li>
        </ul>
        <figure class="editorial-quote">
          <blockquote class="editorial-quote-body">
            <p class="editorial-quote-text">
              Instant solutions to tough problems, under intense time pressure.
            </p>
          </blockquote>
          <figcaption class="editorial-quote-cite">
            <span class="editorial-quote-name">Michael Small</span>
            <span class="editorial-quote-role">NBC News</span>
          </figcaption>
        </figure>
      </section>

      <!-- Engagements -->
      <section class="section">
        <h2 class="section-label">Engagements</h2>
        <div class="engagement-grid">
          <article class="engagement-card">
            <p class="pricing-title">Validate</p>
            <p class="pricing-desc">Demoable prototype · ~1 week</p>
          </article>
          <article class="engagement-card">
            <p class="pricing-title">Build</p>
            <p class="pricing-desc">Production-ready · ~2 weeks</p>
          </article>
          <article class="engagement-card">
            <p class="pricing-title">Transform</p>
            <p class="pricing-desc">End-to-end system · ~4 weeks</p>
          </article>
          <article class="engagement-card">
            <p class="pricing-title">Retained</p>
            <p class="pricing-desc">Ongoing access · 10&ndash;30 hrs/week</p>
          </article>
        </div>
        <p class="pricing-note">
          Fixed scope, fixed price, working demos along the way. Source, docs,
          and handoff are yours.
        </p>
        <p class="workflow">
          20-minute fit check → short proposal → prototypes and async demos →
          launch and handoff
        </p>
      </section>

      <!-- Close -->
      <section id="book" class="section closing-cta">
        <h2 class="closing-title">Have something difficult to ship?</h2>
        <p class="body-md">
          Twenty minutes is usually enough to tell whether I can help.
        </p>
        <div class="hero-actions">
          <a
            :href="CAL_LINK"
            target="_blank"
            rel="noopener"
            class="hero-cta-primary"
            data-umami-event="consulting-book"
            data-umami-event-location="consulting-close"
          >
            Book a fit check
          </a>
          <a
            href="mailto:ejfox@ejfox.com?subject=Project%20inquiry"
            class="hero-cta-secondary"
            data-umami-event="contact-email"
            data-umami-event-location="consulting-close"
          >
            Email me
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="pt-6 divider-t">
        <p class="caption">
          Questions? Just want to say hi? I'm at
          <a href="mailto:ejfox@ejfox.com" class="link-underline">
            ejfox@ejfox.com
          </a>
        </p>
      </footer>
    </div>

    <!-- ── Floating CTA + sidebar ─────────── -->
    <!-- Floating CTA - visible between hero and booking section -->
    <Transition name="cta-fade">
      <a
        v-if="scrollY > 600"
        :href="CAL_LINK"
        target="_blank"
        rel="noopener"
        class="floating-cta"
        data-umami-event="consulting-book"
        data-umami-event-location="consulting-floating"
      >
        <span class="floating-cta-text">Book a call</span>
        <span class="floating-cta-sub">20 min &middot; Free</span>
      </a>
    </Transition>

    <!-- Sidebar: Availability + CTA -->
    <!-- ClientOnly: the teleport target is looked up in onMounted, so SSR has none -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="sidebar-availability">
          <!-- Status -->
          <p class="sidebar-label">Availability</p>

          <!-- Live from Cal.com; the hand-edited JSON only if that fails -->
          <p v-if="availabilityLine" class="sidebar-status-line">
            {{ availabilityLine }}
          </p>

          <!-- CTA -->
          <a
            :href="CAL_LINK"
            target="_blank"
            rel="noopener"
            class="sidebar-cta"
            data-umami-event="consulting-book"
            data-umami-event-location="consulting-sidebar"
          >
            Book a 20-min Call
          </a>
          <p class="sidebar-cta-note">Free · No pitch</p>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* ============================================
   LAYOUT & SECTIONS
   ============================================ */
.section {
  @apply mb-10;
}

.divider-t {
  @apply border-t border-zinc-300 dark:border-zinc-700;
}

/* ============================================
   TYPOGRAPHY - Labels & Headings
   ============================================ */
.section-label {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-6;
}

.hero-label {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-4;
}

.hero-title {
  @apply font-serif text-3xl md:text-4xl font-normal mb-6 text-zinc-900 dark:text-zinc-100;
  letter-spacing: -0.02em;
}

/* ============================================
   TYPOGRAPHY - Body Text
   ============================================ */
.body-lg {
  @apply font-serif text-lg text-zinc-700 dark:text-zinc-300;
}

.body-md {
  @apply font-serif text-zinc-700 dark:text-zinc-300;
}

.caption {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-300;
}

.hero-flourish {
  @apply font-mono text-sm leading-relaxed text-zinc-600 dark:text-zinc-300;
}

.hero-actions {
  @apply mt-7 flex flex-col sm:flex-row gap-3;
}

.hero-cta-primary,
.hero-cta-secondary {
  @apply inline-flex min-h-11 items-center justify-center px-5 py-3
         font-mono text-xs tracking-wide transition-colors
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
         focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black;
  text-decoration: none;
}

.hero-cta-primary {
  @apply border border-zinc-900 bg-zinc-900 text-white
         hover:bg-zinc-700 hover:border-zinc-700
         dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950
         dark:hover:bg-white dark:hover:border-white;
}

.hero-cta-secondary {
  @apply border border-zinc-400 bg-white/80 text-zinc-900
         hover:border-zinc-900 hover:bg-white
         dark:border-zinc-500 dark:bg-zinc-950/80 dark:text-zinc-100
         dark:hover:border-zinc-100 dark:hover:bg-black;
}

.hero-cta-note {
  @apply mt-3 font-mono text-xs text-zinc-600 dark:text-zinc-300;
}

.next-slot {
  @apply mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y
         border-zinc-300 py-3 dark:border-zinc-700;
}

.next-slot-time {
  @apply font-mono text-xs text-zinc-800 dark:text-zinc-200;
}

.next-slot-link {
  @apply font-mono text-xs text-zinc-700 underline decoration-zinc-400
         underline-offset-4 hover:text-black dark:text-zinc-300
         dark:decoration-zinc-600 dark:hover:text-white;
}

.hero-proof {
  @apply mt-7 flex flex-col gap-2 border-l-2 border-emerald-600 py-1 pl-4
         text-zinc-900 transition-colors hover:border-emerald-800
         dark:border-emerald-400 dark:text-zinc-100 dark:hover:border-emerald-300;
  text-decoration: none;
}

.hero-proof-label {
  @apply font-mono text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400;
}

.hero-proof-copy {
  @apply font-serif text-base leading-relaxed text-zinc-800 dark:text-zinc-200;
}

.hero-proof-link {
  @apply font-mono text-xs text-zinc-700 underline decoration-zinc-400 underline-offset-4
         dark:text-zinc-300 dark:decoration-zinc-600;
}

/* ============================================
   INTERACTIVE ELEMENTS
   ============================================ */
.link-underline {
  @apply underline decoration-zinc-400 underline-offset-2
         hover:text-zinc-900 hover:decoration-zinc-700
         dark:decoration-zinc-600 dark:hover:text-white dark:hover:decoration-zinc-300;
}

.sidebar-cta {
  @apply block w-full py-2 px-3 text-center font-mono text-xs
         border border-zinc-900 bg-zinc-900 text-white
         hover:border-zinc-700 hover:bg-zinc-700
         dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950
         dark:hover:border-white dark:hover:bg-white transition-all;
  text-decoration: none;
}

/* ============================================
   CAPABILITIES, CLIENTS & ENGAGEMENTS
   ============================================ */
.capability-grid {
  @apply grid gap-x-8 border-y border-zinc-300 dark:border-zinc-700 sm:grid-cols-3;
}

.clients-panel {
  @apply border-y border-zinc-300 py-6 dark:border-zinc-700;
}

.client-list {
  @apply flex flex-wrap gap-x-5 gap-y-2;
}

.client-name {
  @apply font-mono text-sm font-medium text-zinc-800 dark:text-zinc-100;
}

.engagement-grid {
  @apply mb-6 grid grid-cols-2 gap-x-8 border-y border-zinc-300
         dark:border-zinc-700;
}

.engagement-card {
  @apply border-b border-zinc-200 py-4 last:border-b-0 dark:border-zinc-800;
}

.pricing-title {
  @apply font-serif text-zinc-900 dark:text-zinc-100;
}

.pricing-desc {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-300 mt-1;
}

.pricing-note {
  @apply border-l-2 border-emerald-600 pl-4 font-mono text-xs leading-relaxed
         text-zinc-700 dark:border-emerald-400 dark:text-zinc-300;
}

.workflow {
  @apply mt-5 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300;
}

.specialty-card {
  @apply py-4;
}

.specialty-title {
  @apply font-serif text-lg text-zinc-900 dark:text-zinc-100 mb-2;
}

.specialty-desc {
  @apply font-serif text-sm leading-relaxed text-zinc-700 dark:text-zinc-300;
}

/* ============================================
   EDITORIAL QUOTE
   ============================================ */
.editorial-quote {
  @apply mt-7 border-t border-zinc-300 pt-6 dark:border-zinc-700;
}

.editorial-quote-body {
  @apply relative pl-10;
}

.editorial-quote-body::before {
  content: '“';
  @apply absolute left-0 -top-2 font-serif text-4xl leading-none
         text-emerald-700 dark:text-emerald-400;
}

.editorial-quote-text {
  @apply max-w-lg font-serif text-xl leading-relaxed text-zinc-800 dark:text-zinc-200;
  letter-spacing: -0.01em;
}

.editorial-quote-cite {
  @apply mt-4 flex items-baseline gap-2 pl-10 font-mono text-xs not-italic;
}

.editorial-quote-name {
  @apply font-semibold text-zinc-800 dark:text-zinc-200;
}

.editorial-quote-role {
  @apply text-zinc-600 before:mr-2 before:content-['/'] dark:text-zinc-400;
}

.closing-cta {
  @apply border-t border-zinc-300 py-7 dark:border-zinc-700;
}

.closing-title {
  @apply mb-2 font-serif text-2xl text-zinc-900 dark:text-zinc-100;
}

/* ============================================
   VIDEO BACKGROUND
   ============================================ */
.video-container {
  @apply fixed inset-0 overflow-hidden transition-opacity duration-300 pointer-events-none z-0;
  @apply hidden md:block; /* Hide on mobile - video + text inversion looks broken on small screens */
}

.video-element {
  @apply absolute inset-0 w-full h-full object-cover;
}

.video-overlay {
  @apply absolute inset-0 bg-white dark:bg-zinc-950;
}

/* ============================================
   SIDEBAR
   ============================================ */
.sidebar-availability {
  @apply space-y-3;
}

.sidebar-label {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wider;
}

.sidebar-status-line {
  @apply font-mono text-xs text-emerald-700 dark:text-emerald-400;
}

.sidebar-cta-note {
  @apply font-mono text-xs text-zinc-600 dark:text-zinc-300 text-center;
}

/* ============================================
   FLOATING CTA
   ============================================ */
.floating-cta {
  @apply fixed bottom-6 right-6 z-50
         flex flex-col items-end gap-0.5
         px-4 py-1
         bg-zinc-900 dark:bg-zinc-100 backdrop-blur-sm
         border border-zinc-900 dark:border-zinc-100
         font-mono text-xs
         shadow-sm
         transition-all duration-300 ease-out
         hover:bg-zinc-700 hover:border-zinc-700
         dark:hover:bg-white dark:hover:border-white
         hover:shadow-md;
  text-decoration: none;
}

.floating-cta-text {
  @apply text-white dark:text-zinc-950 tracking-wider uppercase;
}

.floating-cta-sub {
  @apply text-zinc-300 dark:text-zinc-600 text-3xs tracking-normal;
}

/* Transition */
.cta-fade-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.cta-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.cta-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.cta-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
