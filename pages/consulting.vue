<script setup lang="ts">
import { useDark, useWindowScroll, useWindowSize } from '@vueuse/core'

// ============================================
// VIDEO BACKGROUND CONFIG - TWEAK THESE
// ============================================
const VIDEO_CONFIG = {
  // Video source - Cloudinary optimized (f_auto=WebM/MP4, q_auto, vc_auto codec)
  src: 'https://res.cloudinary.com/ejf/video/upload/f_auto,q_auto,vc_auto/v1730768430/Connectology_Demo01',

  // Scroll-driven playback
  scrollDriven: true, // true = NYT-style scroll scrub, false = autoplay loop
  scrollStart: 15, // px: start scrubbing video at this scroll position
  scrollEnd: 3000, // px: video reaches end at this scroll position
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
// ============================================

const isDark = useDark()

// Scroll-powered video background
const { y: scrollY } = useWindowScroll()
const { height: _windowHeight } = useWindowSize()

// Video element ref and scroll-driven playback
const videoRef = ref<HTMLVideoElement | null>(null)
const scrollDriven = ref(VIDEO_CONFIG.scrollDriven)

// Smooth inertia for video scrubbing using anime.js v4
const videoState = reactive({ time: 0 })
let currentAnimation: { pause: () => void } | null = null

watch(scrollY, async (scroll) => {
  if (!scrollDriven.value || !videoRef.value) return

  const video = videoRef.value
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
    const { animate } = await import('animejs')

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

// Consulting availability (hand-edited JSON)
const { data: availability } = await useFetch('/api/consulting-availability', {
  default: () => ({
    currentQuarter: {
      name: 'Q1 2025',
      status: 'unknown',
      message: 'Loading...',
    },
    nextQuarter: { name: 'Q2 2025', status: 'unknown', message: 'Loading...' },
    allQuarters: [],
    activeClientCount: 0,
    maxClients: 3,
  }),
})

// Next available Cal.com slots for intro calls (lazy - not critical for SSR)
const { data: calSlots } = useLazyFetch('/api/cal/available-slots', {
  query: { duration: '1hr', days: 21 },
  default: () => ({ slots: [] }),
  server: false,
})

// GitHub stats for live repo count (lazy - not critical for SSR)
const { data: stats } = useLazyFetch('/api/stats', {
  default: () => ({ github: { stats: { totalRepos: 0 } } }),
  server: false,
})

const githubRepos = computed(() => stats.value?.github?.stats?.totalRepos || 0)

// Sidebar teleport target
const tocTarget = ref<Element | null>(null)

// Cal.com embed initialization + sidebar setup
onMounted(() => {
  initCalEmbed()
  nextTick(() => {
    tocTarget.value = document.querySelector('#nav-toc-container')
  })
})

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
          C as Window & {
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
    calLink: 'ejfox/30min?duration=60',
    layout: 'month_view',
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

// ============================================
// CLIENT LOGOS - Clean professional grid
// ============================================
const CLIENT_LOGOS = [
  { name: 'NBC News', logo: '/logos/nbc-news.svg' },
  { name: 'MSNBC', logo: '/logos/msnbc.svg' },
  { name: 'CBS', logo: '/logos/cbs.svg' },
  { name: 'Washington Post', logo: '/logos/wapo.svg' },
  { name: 'Associated Press', logo: '/logos/ap.svg' },
  { name: 'Consumer Reports', logo: '/logos/consumer-reports.svg' },
  { name: 'GitHub', logo: '/logos/github.svg' },
  { name: 'Gothamist', logo: '/logos/gothamist.svg' },
  { name: 'WNYC', logo: '/logos/wnyc.svg' },
  { name: 'Knight Foundation', logo: '/logos/knight.svg' },
  { name: 'Climate TRACE', logo: '/logos/climate-trace.svg' },
  { name: 'Stamen', logo: '/logos/stamen.svg' },
]

const specialties = [
  {
    title: 'Rapid Prototyping',
    description:
      'Napkin sketch to working demo. That moment when it first works? Never gets old.',
    proof: 'NBC Big Board: weekend prototype → 19M viewers.',
  },
  {
    title: 'Newsroom Tools',
    description:
      'Small teams doing important work deserve better tools. Systems that make hard things easier.',
    proof: 'Vocativ, Gothamist, Dataproofer, ASU Newswell.',
  },
  {
    title: 'AI Integration',
    description:
      'Not the hype-y kind. Wired into actual workflows, actually helping people.',
    proof: 'ASU Lenfest Fellow. Shipping in newsrooms now.',
  },
  {
    title: 'Live Systems',
    description:
      'When millions are watching and it has to work. I stay until it does.',
    proof: 'CMU COVIDcast, NBC elections, investigations.',
  },
]

usePageSeo({
  title: 'Consulting · EJ Fox',
  description:
    "The person you call when there's no margin for error. Mission-critical software for election nights, breaking news, and live television. 19M viewers, zero crashes.",
  type: 'website',
  section: 'Consulting',
  tags: ['Consulting', 'Data Visualization', 'Elections', 'Journalism'],
})
</script>

<template>
  <div class="bg-transparent">
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

    <main class="container-main pt-8 max-w-2xl relative z-10">
      <!-- Hero -->
      <header class="section">
        <p class="hero-label">Let's build something</p>
        <h1 class="hero-title">
          I love making computers do things no one's seen before.
        </h1>
        <p class="body-lg mb-4">
          Biotech prototypes, journalism tools, climate dashboards, transit
          sims, police accountability trackers, AI experiments. Zero to one.
          Making ideas exist that didn't before.
        </p>
        <p class="caption">
          The world is editable. Let's see what we can make.
        </p>
      </header>

      <!-- Photo -->
      <section class="section">
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="EJ Fox presenting election visualization on NBC's Big Board"
          class="w-full"
        />
        <p class="caption mt-2">
          Early Big Board Web prototype at 30 Rock, circa 2018 ·
          <NuxtLink to="/projects" class="link-underline">
            See more work
          </NuxtLink>
        </p>
      </section>

      <!-- Testimonial -->
      <section class="section">
        <blockquote class="testimonial">
          "First election night where Chuck wasn't frustrated with the app."
        </blockquote>
        <p class="testimonial-cite">
          — Producer, Meet the Press · NBC News, 2018
        </p>
      </section>

      <!-- Credentials -->
      <section class="section">
        <p class="body-lg mb-6">
          I believe the world is editable&mdash;that most systems can be
          improved by someone willing to look closely and prototype quickly.
          That belief has led me to work across newsrooms
          <span class="aside">(NBC News, Washington Post, Gothamist)</span>,
          design studios <span class="aside">(Stamen)</span>, research labs
          <span class="aside">(CMU, ASU's AI fellowship)</span>, climate orgs
          <span class="aside">(Climate TRACE, Earth Genome)</span>, foundations
          <span class="aside">(Knight)</span>, and companies I can't name. The
          common thread: people with a hunch something could be better.
        </p>
        <div class="grid grid-cols-3 gap-6 text-center py-6 divider-y">
          <div>
            <p class="stat-value">10+</p>
            <p class="stat-label">industries</p>
          </div>
          <div>
            <p class="stat-value">13</p>
            <p class="stat-label">years shipping</p>
          </div>
          <div>
            <p class="stat-value">{{ githubRepos }}</p>
            <p class="stat-label">public repos</p>
          </div>
        </div>
      </section>

      <!-- Clients - Clean Logo Grid -->
      <section class="section-lg">
        <p class="section-label-lg">People I've worked with</p>
        <div class="client-logo-grid">
          <div
            v-for="client in CLIENT_LOGOS"
            :key="client.name"
            class="client-logo-item"
          >
            <img
              :src="client.logo"
              :alt="client.name"
              class="client-logo-img"
            />
          </div>
        </div>
      </section>

      <!-- Quick CTA for hot leads -->
      <section v-if="calSlots?.slots?.length" class="section py-6 divider-y">
        <p class="body-md mb-4">Want to chat? Open times:</p>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="slot in calSlots.slots"
            :key="slot.datetime"
            :href="slot.bookingUrl"
            target="_blank"
            rel="noopener"
            class="slot-btn"
          >
            <span class="slot-btn-text">{{ slot.time }}</span>
            <span class="slot-btn-day">{{ slot.day }}</span>
            <span class="slot-btn-date">{{ slot.date }}</span>
          </a>
        </div>
      </section>

      <!-- Testimonial lift -->
      <section class="section">
        <blockquote class="blockquote">
          <p class="blockquote-text">
            "Instant solutions to tough problems, under intense time pressure"
          </p>
          <cite class="blockquote-cite">Michael Small, NBC News</cite>
        </blockquote>
      </section>

      <!-- Specialties -->
      <section class="section">
        <h2 class="section-label">Things I'm good at</h2>
        <div class="space-y-6">
          <article
            v-for="s in specialties"
            :key="s.title"
            class="specialty-card"
          >
            <h3 class="specialty-title">{{ s.title }}</h3>
            <p class="specialty-desc">{{ s.description }}</p>
            <p class="specialty-proof">{{ s.proof }}</p>
          </article>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="section">
        <h2 class="section-label">Kind words</h2>
        <div class="space-y-10">
          <div class="testimonial-card">
            <blockquote class="blockquote">
              <p class="blockquote-text">
                "Gets things done quickly with an astonishing level of detail"
              </p>
              <cite class="blockquote-cite">Erik Hazzard, fmr Meta</cite>
            </blockquote>
          </div>
          <div class="testimonial-card">
            <blockquote class="blockquote">
              <p class="blockquote-text">
                "Build things that would last... not just produce, but take
                ownership of long-term initiatives"
              </p>
              <cite class="blockquote-cite">Markham Nolan, Vocativ</cite>
            </blockquote>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section">
        <h2 class="section-label-lg">How it goes</h2>
        <div class="space-y-8">
          <div class="process-step">
            <div class="process-number">01</div>
            <div>
              <p class="process-title">We talk</p>
              <p class="process-desc">
                You tell me what you're trying to do. I ask questions. We figure
                out if I'm the right fit.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-number">02</div>
            <div>
              <p class="process-title">Proposal</p>
              <p class="process-desc">
                I write up what I understood, what I'd build, and what it costs.
                Fixed scope, fixed price&mdash;no surprises.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-number">03</div>
            <div>
              <p class="process-title">Handshake</p>
              <p class="process-desc">
                You review it, we sign, 50% deposit gets us rolling.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-number">04</div>
            <div>
              <p class="process-title">Build</p>
              <p class="process-desc">
                Weekly calls, async demo videos, early prototypes. Slack or
                Discord over email. I'll be with you the entire way until it ships.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section class="section">
        <h2 class="section-label">Engagements</h2>

        <div class="space-y-4 mb-8">
          <div class="pricing-row">
            <div>
              <p class="pricing-title">Validate</p>
              <p class="pricing-desc">Prototype you can demo · ~1 week</p>
            </div>
            <p class="price">$6,250</p>
          </div>
          <div class="pricing-row">
            <div>
              <p class="pricing-title">Build</p>
              <p class="pricing-desc">Production-ready · ~2 weeks</p>
            </div>
            <p class="price">$12,500</p>
          </div>
          <div class="pricing-row">
            <div>
              <p class="pricing-title">Transform</p>
              <p class="pricing-desc">End-to-end system · ~4 weeks</p>
            </div>
            <p class="price">$25,000</p>
          </div>
          <div class="pricing-row">
            <div>
              <p class="pricing-title">Retained</p>
              <p class="pricing-desc">Ongoing access · 10&ndash;30 hrs/week</p>
            </div>
            <p class="price-muted">Inquire</p>
          </div>
        </div>

        <p class="caption">50% upfront, 50% on delivery · $175/hr</p>
      </section>

      <!-- FAQ -->
      <section class="section">
        <h2 class="section-label">Questions</h2>
        <div class="space-y-6">
          <div>
            <p class="faq-question">What if we're not sure about scope?</p>
            <p class="faq-answer">
              That's most projects. Come with the problem, not a requirements
              doc.
            </p>
          </div>
          <div>
            <p class="faq-question">Tech stack?</p>
            <p class="faq-answer">
              TypeScript, Vue/Nuxt, D3.js, Node, MapLibre. Heavy AI tooling.
            </p>
          </div>
          <div>
            <p class="faq-question">Communication?</p>
            <p class="faq-answer">
              Async default. Loom videos, written updates, calls when needed.
            </p>
          </div>
          <div>
            <p class="faq-question">What do I own when we're done?</p>
            <p class="faq-answer">
              Everything. Source, docs, handoff. You can maintain it without me.
            </p>
          </div>
          <div>
            <p class="faq-question">Can you start sooner?</p>
            <p class="faq-answer">
              Probably not. Small client load = real attention. But let's talk.
            </p>
          </div>
        </div>
      </section>

      <!-- Book a Call -->
      <section id="book" class="section scroll-mt-24">
        <p class="section-label-lg">Let's talk</p>
        <p class="caption mb-6">
          60 min · No pitch · Figuring out if I can help
        </p>
        <div id="cal-inline-embed" class="cal-inline-embed" />
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
    </main>

    <!-- Sidebar: Availability + CTA -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="sidebar-availability">
          <!-- Status -->
          <p class="sidebar-label">Availability</p>

          <!-- Capacity row: dots + count -->
          <div class="sidebar-capacity-row">
            <div class="capacity-dots">
              <template v-for="i in availability?.maxClients || 3" :key="i">
                <div
                  v-tooltip="
                    i <= (availability?.activeClientCount || 0)
                      ? 'Spot filled'
                      : 'Open'
                  "
                  class="capacity-dot-sm"
                  :class="
                    i <= (availability?.activeClientCount || 0)
                      ? 'capacity-filled'
                      : 'capacity-open'
                  "
                />
              </template>
            </div>
            <span
              v-tooltip="'Max 3 clients so everyone gets real attention'"
              class="sidebar-capacity-text"
            >
              {{ availability?.activeClientCount || 0 }}/{{
                availability?.maxClients || 3
              }}
            </span>
          </div>

          <!-- Status message -->
          <p class="sidebar-status-line">
            <template v-if="availability?.nextAvailable">
              Opens
              {{
                new Date(availability.nextAvailable).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                )
              }}
            </template>
            <template
              v-else-if="
                (availability?.maxClients || 3) -
                  (availability?.activeClientCount || 0) >
                0
              "
            >
              {{
                (availability?.maxClients || 3) -
                (availability?.activeClientCount || 0)
              }}
              {{
                (availability?.maxClients || 3) -
                  (availability?.activeClientCount || 0) ===
                1
                  ? 'spot'
                  : 'spots'
              }}
              open
            </template>
            <template v-else>Fully booked</template>
          </p>

          <!-- CTA -->
          <a href="#cal-inline-embed" class="sidebar-cta">Book a Call</a>
          <p class="sidebar-cta-note">60 min · Free</p>
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
  @apply mb-12;
}

.section-lg {
  @apply mb-16;
}

.divider-y {
  @apply border-y border-zinc-100 dark:border-zinc-800;
}

.divider-b {
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.divider-t {
  @apply border-t border-zinc-200 dark:border-zinc-800;
}

/* ============================================
   TYPOGRAPHY - Labels & Headings
   ============================================ */
.section-label {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-6;
}

.section-label-lg {
  @apply font-mono text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8;
}

.section-label-sm {
  @apply font-mono text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4;
}

.hero-label {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4;
}

.hero-title {
  @apply font-serif text-3xl md:text-4xl font-normal mb-6 text-zinc-900 dark:text-zinc-100;
  letter-spacing: -0.02em;
}

.headline-lg {
  @apply font-serif text-2xl text-zinc-900 dark:text-zinc-100;
  letter-spacing: -0.01em;
}

.headline-md {
  @apply font-serif text-lg text-zinc-900 dark:text-zinc-100;
}

/* ============================================
   TYPOGRAPHY - Body Text
   ============================================ */
.body-lg {
  @apply font-serif text-lg text-zinc-600 dark:text-zinc-400;
}

.body-md {
  @apply font-serif text-zinc-600 dark:text-zinc-400;
}

.body-sm {
  @apply font-serif text-sm text-zinc-600 dark:text-zinc-400;
}

.body-sm-muted {
  @apply font-serif text-sm text-zinc-500 dark:text-zinc-400;
}

.caption {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400;
}

.aside {
  @apply font-mono text-sm text-zinc-400 dark:text-zinc-500;
}

.caption-success {
  @apply font-mono text-xs text-emerald-600 dark:text-emerald-400;
}

/* ============================================
   STATS & NUMBERS
   ============================================ */
.stat-value {
  @apply font-mono text-2xl text-zinc-900 dark:text-zinc-100;
}

.stat-label {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400;
}

.price {
  @apply font-mono text-lg text-zinc-900 dark:text-zinc-100;
}

.price-muted {
  @apply font-mono text-zinc-500 dark:text-zinc-400;
}

/* ============================================
   INTERACTIVE ELEMENTS
   ============================================ */
.link-underline {
  @apply underline hover:text-zinc-700 dark:hover:text-zinc-300;
}

.slot-btn {
  @apply px-5 py-3 font-serif text-sm border border-zinc-200 dark:border-zinc-700
         hover:border-zinc-900 dark:hover:border-zinc-100 transition-all duration-300
         flex flex-col items-start gap-0.5 rounded-sm
         bg-zinc-50/50 dark:bg-zinc-800/30 backdrop-blur-sm;
}

.slot-btn-text {
  @apply text-zinc-900 dark:text-zinc-100 text-base font-medium;
}

.slot-btn-day {
  @apply text-zinc-600 dark:text-zinc-400 text-sm;
}

.slot-btn-date {
  @apply text-zinc-400 dark:text-zinc-500 text-xs font-mono;
}

.sidebar-cta {
  @apply block w-full py-2.5 px-3 text-center font-mono text-xs
         border border-zinc-300 dark:border-zinc-700
         hover:border-zinc-900 dark:hover:border-zinc-100
         hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all;
}

/* ============================================
   CLIENT LOGOS
   ============================================ */
.client-logo-grid {
  @apply grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 items-center;
}

.client-logo-item {
  @apply flex items-center justify-center h-6 sm:h-10 grayscale opacity-60
         hover:grayscale-0 hover:opacity-100 transition-all duration-300;
}

.client-logo-img {
  @apply max-h-full max-w-full object-contain dark:invert;
}

/* ============================================
   PROCESS STEPS
   ============================================ */
.process-step {
  @apply flex gap-6;
}

.process-number {
  @apply font-mono text-sm text-zinc-300 dark:text-zinc-600 w-6 shrink-0;
}

.process-title {
  @apply font-serif text-zinc-900 dark:text-zinc-100 mb-1;
}

.process-desc {
  @apply font-serif text-sm text-zinc-500 dark:text-zinc-400;
}

/* ============================================
   PRICING ROWS
   ============================================ */
.pricing-row {
  @apply flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4;
}

.pricing-title {
  @apply font-serif text-zinc-900 dark:text-zinc-100;
}

.pricing-desc {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-1;
}

/* ============================================
   FAQ ITEMS
   ============================================ */
.faq-question {
  @apply font-serif text-zinc-900 dark:text-zinc-100 mb-1;
}

.faq-answer {
  @apply font-serif text-sm text-zinc-600 dark:text-zinc-400;
}

/* ============================================
   SPECIALTY CARDS
   ============================================ */
.specialty-card {
  @apply border border-zinc-100 dark:border-zinc-800 p-5 rounded-sm
         bg-zinc-50/30 dark:bg-zinc-800/20 backdrop-blur-sm;
}

.specialty-title {
  @apply font-serif text-lg text-zinc-900 dark:text-zinc-100 mb-2;
}

.specialty-desc {
  @apply font-serif text-zinc-600 dark:text-zinc-400 mb-2;
}

.specialty-proof {
  @apply font-mono text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide;
}

.testimonial-card {
  @apply py-5 px-4 rounded-sm bg-zinc-50/30 dark:bg-zinc-800/20 backdrop-blur-sm;
}

/* ============================================
   PRESS / BLOCKQUOTES
   ============================================ */
.blockquote {
  @apply border-l border-zinc-300 dark:border-zinc-700 pl-4;
}

.blockquote-text {
  @apply font-serif text-zinc-600 dark:text-zinc-400 italic;
}

.blockquote-cite {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 not-italic;
}

.testimonial {
  @apply font-serif text-2xl text-zinc-700 dark:text-zinc-300;
  letter-spacing: -0.01em;
}

.testimonial-cite {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-4;
}

/* ============================================
   AVAILABILITY / CAPACITY
   ============================================ */
.capacity-dots {
  @apply flex gap-1.5;
}

.capacity-dot {
  @apply w-3 h-3 rounded-full transition-colors;
}

.capacity-dot-sm {
  @apply w-2.5 h-2.5 rounded-full;
}

.capacity-filled {
  @apply bg-zinc-400 dark:bg-zinc-500;
}

.capacity-open {
  @apply bg-emerald-400 dark:bg-emerald-500;
}

.availability-callout {
  @apply mb-6 py-3 px-4 bg-emerald-50 dark:bg-emerald-950/30
         border border-emerald-200 dark:border-emerald-800 rounded;
}

.availability-callout-text {
  @apply font-serif text-sm text-emerald-800 dark:text-emerald-200;
}

/* ============================================
   VIDEO BACKGROUND
   ============================================ */
.video-container {
  @apply fixed inset-0 overflow-hidden transition-opacity duration-300 pointer-events-none z-0;
}

.video-element {
  @apply absolute inset-0 w-full h-full object-cover;
}

.video-overlay {
  @apply absolute inset-0 bg-zinc-950;
}

/* ============================================
   SIDEBAR
   ============================================ */
.sidebar-availability {
  @apply pt-6 space-y-3;
}

.sidebar-label {
  @apply font-mono text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide;
}

.sidebar-capacity-row {
  @apply flex items-center gap-2;
}

.sidebar-capacity-text {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400;
}

.sidebar-status-line {
  @apply font-mono text-xs text-emerald-600 dark:text-emerald-400;
}

.sidebar-cta-note {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 text-center;
}

/* ============================================
   CAL.COM EMBED
   ============================================ */
.cal-inline-embed {
  @apply min-h-[500px] w-full border border-zinc-200 dark:border-zinc-800;
}

@media (min-width: 640px) {
  .cal-inline-embed {
    @apply min-h-[600px];
  }
}
</style>
