<script setup lang="ts">
import { useDark, useWindowScroll, useWindowSize } from '@vueuse/core'
import Chance from 'chance'

// ============================================
// VIDEO BACKGROUND CONFIG - TWEAK THESE
// ============================================
const VIDEO_CONFIG = {
  // Video source
  src: 'https://res.cloudinary.com/ejf/video/upload/v1730768430/Connectology_Demo01.mp4',

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

// Next available Cal.com slots for intro calls
const { data: calSlots } = await useFetch('/api/cal/available-slots', {
  query: { duration: '1hr', days: 21 },
  default: () => ({ slots: [] }),
})

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
// STICKER WALL - Client logos with Voronoi spacing
// ============================================
const chance = new Chance()

const CLIENT_LOGOS = [
  { name: 'NBC News', logo: '/logos/nbc-news.svg' },
  { name: 'MSNBC', logo: '/logos/msnbc.svg' },
  { name: 'CBS', logo: '/logos/cbs.svg' },
  { name: 'Washington Post', logo: '/logos/wapo.svg' },
  { name: 'The New York Times', logo: '/logos/nytimes.svg' },
  { name: 'Associated Press', logo: '/logos/ap.svg' },
  { name: 'Consumer Reports', logo: '/logos/consumer-reports.svg' },
  { name: 'GitHub', logo: '/logos/github.svg' },
  { name: 'Gothamist', logo: '/logos/gothamist.svg' },
  { name: 'WNYC', logo: '/logos/wnyc.svg' },
  { name: 'Carnegie Mellon', logo: '/logos/cmu.svg' },
  { name: 'Knight Foundation', logo: '/logos/knight.svg' },
  { name: 'Climate TRACE', logo: '/logos/climate-trace.svg' },
]

const SIZES = ['h-5', 'h-5', 'h-6', 'h-6'] // tighter range, mostly medium-small

interface Sticker {
  name: string
  logo: string
  size: string
  x: number
  y: number
  rotation: number
  z: number
}

const stickerContainer = ref<HTMLElement | null>(null)
const stickerRefs = ref<(HTMLElement | null)[]>([])

// Lloyd's relaxation for even spacing (poor man's Voronoi)
function lloydRelax(
  points: [number, number][],
  width: number,
  height: number,
  iterations = 3
): [number, number][] {
  let pts = [...points]

  for (let iter = 0; iter < iterations; iter++) {
    // For each point, push away from neighbors
    const newPts: [number, number][] = pts.map((p, i) => {
      let fx = 0,
        fy = 0
      // Much larger minimum distance - 1.5x what's needed for even grid
      const minDist = Math.min(width, height) / Math.sqrt(pts.length) * 1.5

      pts.forEach((other, j) => {
        if (i === j) return
        const dx = p[0] - other[0]
        const dy = p[1] - other[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDist && dist > 0) {
          // Stronger repulsion force
          const force = (minDist - dist) / dist * 0.6
          fx += dx * force
          fy += dy * force
        }
      })

      // Also push away from edges
      const margin = 5
      if (p[0] < margin) fx += (margin - p[0]) * 0.8
      if (p[0] > width - margin) fx -= (p[0] - (width - margin)) * 0.8
      if (p[1] < margin) fy += (margin - p[1]) * 0.8
      if (p[1] > height - margin) fy -= (p[1] - (height - margin)) * 0.8

      return [
        Math.max(margin, Math.min(width - margin, p[0] + fx)),
        Math.max(margin, Math.min(height - margin, p[1] + fy)),
      ] as [number, number]
    })
    pts = newPts
  }
  return pts
}

function generateStickerPositions(): Sticker[] {
  const width = 95 // percentage - use more horizontal space
  const height = 90 // percentage

  // Start with a shuffled grid to ensure better initial distribution
  const cols = 5
  const rows = 3
  const cellW = width / cols
  const cellH = height / rows

  // Create grid positions with jitter
  let points: [number, number][] = CLIENT_LOGOS.map((_, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return [
      col * cellW + chance.floating({ min: cellW * 0.2, max: cellW * 0.8 }),
      row * cellH + chance.floating({ min: cellH * 0.15, max: cellH * 0.85 }),
    ]
  })

  // Shuffle the points so logos don't always appear in same grid position
  points = chance.shuffle(points)

  // Light relaxation to smooth out any remaining tight spots
  points = lloydRelax(points, width, height, 3)

  return CLIENT_LOGOS.map((client, i) => {
    const size = chance.pickone(SIZES)
    // Bigger = back (low z), smaller = front (high z)
    const sizeIndex = SIZES.indexOf(size)
    const z = (SIZES.length - sizeIndex) * 5 + chance.integer({ min: 0, max: 3 })
    return {
      ...client,
      size,
      x: points[i][0],
      y: points[i][1],
      rotation: chance.floating({ min: -4, max: 4 }),
      z,
    }
  })
}

const clientStickers = ref<Sticker[]>(generateStickerPositions())

async function shuffleStickers() {
  if (!import.meta.client) return

  const { animate } = await import('animejs')
  const newPositions = generateStickerPositions()

  // Animate each sticker to its new position with stagger
  stickerRefs.value.forEach((el, i) => {
    if (!el) return
    const sticker = newPositions[i]

    animate(el, {
      left: sticker.x + '%',
      top: sticker.y + '%',
      rotate: sticker.rotation + 'deg',
      zIndex: sticker.z,
      duration: 600,
      delay: i * 40,
      ease: 'outElastic(1, 0.5)',
    })
  })

  // Update reactive data after animation
  setTimeout(
    () => {
      clientStickers.value = newPositions
    },
    600 + CLIENT_LOGOS.length * 40
  )
}

const specialties = [
  {
    title: 'Rapid Prototyping',
    description: 'Ideas to working software in days, not months.',
    proof: 'NBC Big Board: weekend prototype to 19M viewers, zero crashes.',
  },
  {
    title: 'Newsroom Scale-Up',
    description: 'Systems that multiply team output.',
    proof:
      'Vocativ: 30x output increase (5 graphics/month → 5/day). Dataproofer (Knight Foundation).',
  },
  {
    title: 'AI Integration',
    description: 'Practical AI tools for real workflows.',
    proof: 'ASU Lenfest AI Fellow. Custom tools shipping in newsrooms.',
  },
  {
    title: 'High-Stakes Systems',
    description: "When failure isn't an option.",
    proof: 'CMU COVIDcast, NBC elections, Gothamist investigations.',
  },
]

usePageSeo({
  title: 'Consulting · EJ Fox',
  description:
    'Custom software for high-stakes moments. Live television, breaking news, mission-critical systems.',
  type: 'website',
  section: 'Consulting',
  tags: ['Consulting', 'Data Visualization', 'Elections', 'Journalism'],
})
</script>

<template>
  <div class="bg-transparent">
    <!-- Video Background -->
    <div
      class="fixed inset-0 overflow-hidden transition-opacity duration-300 pointer-events-none z-0"
      :style="{ opacity: videoOpacity }"
    >
      <video
        ref="videoRef"
        :autoplay="!scrollDriven"
        :loop="!scrollDriven"
        muted
        playsinline
        preload="auto"
        class="absolute inset-0 w-full h-full object-cover"
      >
        <source :src="VIDEO_CONFIG.src" type="video/mp4" />
      </video>
      <!-- Overlay for text readability -->
      <div
        class="absolute inset-0 bg-zinc-950"
        :style="{ opacity: VIDEO_CONFIG.overlayOpacity / 100 }"
      ></div>
    </div>

    <main class="container-main pt-8 max-w-2xl relative z-10">
      <!-- Hero -->
      <header class="mb-12">
        <p class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-4">
          Consulting
        </p>
        <h1
          class="font-serif text-3xl md:text-4xl font-normal mb-6"
          style="letter-spacing: -0.02em"
        >
          Custom software for high-stakes moments.
        </h1>
        <p class="font-serif text-lg text-zinc-600 dark:text-zinc-400">
          Live television. Breaking news. Mission-critical systems. I build
          software that can't fail when it matters most.
        </p>
      </header>

      <!-- Photo -->
      <section class="mb-12">
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="EJ Fox presenting election visualization on NBC's Big Board"
          class="w-full"
        />
        <p class="font-mono text-xs text-zinc-500 mt-2">
          Big Board at 30 Rock, election night 2018
        </p>
      </section>

      <!-- Testimonial -->
      <section class="mb-12">
        <blockquote
          class="font-serif text-2xl text-zinc-700 dark:text-zinc-300"
          style="letter-spacing: -0.01em"
        >
          "First election night where Chuck wasn't frustrated with the app."
        </blockquote>
        <p class="font-mono text-xs text-zinc-500 mt-4">
          — Producer, Meet the Press · NBC News, 2018
        </p>
      </section>

      <!-- Credentials -->
      <section class="mb-12">
        <p class="font-serif text-lg text-zinc-600 dark:text-zinc-400 mb-6">
          ASU Lenfest AI Fellow. Knight Foundation grantee. NBC News, Vocativ,
          Room 302 Studio. Built the systems that run on live television.
        </p>
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6 border-y border-zinc-100 dark:border-zinc-800"
        >
          <div>
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100">
              13
            </p>
            <p class="font-mono text-xs text-zinc-500">years shipping</p>
          </div>
          <div>
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100">3</p>
            <p class="font-mono text-xs text-zinc-500">election cycles</p>
          </div>
          <div>
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100">
              19M
            </p>
            <p class="font-mono text-xs text-zinc-500">viewers, zero crashes</p>
          </div>
          <div>
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100">
              $35k
            </p>
            <p class="font-mono text-xs text-zinc-500">Knight grant</p>
          </div>
        </div>
      </section>

      <!-- Clients - Sticker Wall -->
      <section class="mb-16">
        <p
          class="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-8"
        >
          Past clients
        </p>
        <div
          ref="stickerContainer"
          class="relative h-80 md:h-72 cursor-pointer select-none"
          @click="shuffleStickers"
        >
          <div
            v-for="(sticker, i) in clientStickers"
            :key="sticker.name"
            :ref="(el) => (stickerRefs[i] = el)"
            class="sticker absolute bg-white rounded-sm shadow-md px-2 py-1 transition-shadow hover:shadow-lg"
            :style="{
              left: sticker.x + '%',
              top: sticker.y + '%',
              transform: `rotate(${sticker.rotation}deg)`,
              zIndex: sticker.z,
            }"
          >
            <img
              :src="sticker.logo"
              :alt="sticker.name"
              :class="sticker.size"
            />
          </div>
        </div>
      </section>

      <!-- Quick CTA for hot leads -->
      <section
        v-if="calSlots?.slots?.length"
        class="mb-12 py-6 border-y border-zinc-100 dark:border-zinc-800"
      >
        <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
          Ready to talk?
        </p>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="slot in calSlots.slots"
            :key="slot.datetime"
            :href="slot.bookingUrl"
            target="_blank"
            rel="noopener"
            class="px-5 py-3 font-serif text-sm border border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 transition-all duration-300"
          >
            <span class="text-zinc-900 dark:text-zinc-100">
              {{ slot.time }}
            </span>
            <span class="text-zinc-400 dark:text-zinc-500 ml-1">
              {{ slot.day }}
            </span>
          </a>
        </div>
      </section>

      <!-- Specialties -->
      <section class="mb-12">
        <h2
          class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-6"
        >
          What I Do
        </h2>
        <div class="space-y-6">
          <article
            v-for="s in specialties"
            :key="s.title"
            class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
          >
            <h3
              class="font-serif text-lg text-zinc-900 dark:text-zinc-100 mb-2"
            >
              {{ s.title }}
            </h3>
            <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-2">
              {{ s.description }}
            </p>
            <p class="font-mono text-xs text-zinc-500">
              {{ s.proof }}
            </p>
          </article>
        </div>
      </section>

      <!-- Press -->
      <section class="mb-12">
        <h2
          class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-6"
        >
          Press
        </h2>
        <div class="space-y-6">
          <blockquote
            class="border-l border-zinc-300 dark:border-zinc-700 pl-4"
          >
            <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
              "A newly juiced-up model of the board that can zoom in on the most
              obscure House districts"
            </p>
            <cite class="font-mono text-xs text-zinc-500 not-italic">
              — New York Times
            </cite>
          </blockquote>
          <blockquote
            class="border-l border-zinc-300 dark:border-zinc-700 pl-4"
          >
            <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
              "Kornacki... looked amazing with the board, panning and zooming"
            </p>
            <cite class="font-mono text-xs text-zinc-500 not-italic">
              — Vulture
            </cite>
          </blockquote>
        </div>
      </section>

      <!-- How It Works -->
      <section class="mb-12">
        <h2
          class="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-8"
        >
          Process
        </h2>
        <div class="space-y-8">
          <div class="flex gap-6">
            <div
              class="font-mono text-sm text-zinc-300 dark:text-zinc-600 w-6 shrink-0"
            >
              01
            </div>
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
                Consultation
              </p>
              <p class="font-serif text-sm text-zinc-500 dark:text-zinc-400">
                We meet. You describe the problem. I ask questions.
              </p>
            </div>
          </div>
          <div class="flex gap-6">
            <div
              class="font-mono text-sm text-zinc-300 dark:text-zinc-600 w-6 shrink-0"
            >
              02
            </div>
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
                Proposal
              </p>
              <p class="font-serif text-sm text-zinc-500 dark:text-zinc-400">
                I write a statement of work. Fixed scope, fixed price. For
                complex projects, I may request a second meeting to research
                further.
              </p>
            </div>
          </div>
          <div class="flex gap-6">
            <div
              class="font-mono text-sm text-zinc-300 dark:text-zinc-600 w-6 shrink-0"
            >
              03
            </div>
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
                Agreement
              </p>
              <p class="font-serif text-sm text-zinc-500 dark:text-zinc-400">
                You review. If it's right, you sign and pay 50% to begin.
              </p>
            </div>
          </div>
          <div class="flex gap-6">
            <div
              class="font-mono text-sm text-zinc-300 dark:text-zinc-600 w-6 shrink-0"
            >
              04
            </div>
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
                Build
              </p>
              <p class="font-serif text-sm text-zinc-500 dark:text-zinc-400">
                Work begins. Regular check-ins. Working prototypes early.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section class="mb-12">
        <h2
          class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-6"
        >
          Pricing
        </h2>

        <div class="space-y-4 mb-6">
          <div
            class="flex justify-between items-baseline border-b border-zinc-200 dark:border-zinc-800 pb-4"
          >
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100">Sprint</p>
              <p class="font-mono text-xs text-zinc-500">
                5 days · Proof of concept
              </p>
            </div>
            <p class="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              $6,250
            </p>
          </div>
          <div
            class="flex justify-between items-baseline border-b border-zinc-200 dark:border-zinc-800 pb-4"
          >
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100">
                Standard
              </p>
              <p class="font-mono text-xs text-zinc-500">
                10 days · Prototype to production
              </p>
            </div>
            <p class="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              $12,500
            </p>
          </div>
          <div
            class="flex justify-between items-baseline border-b border-zinc-200 dark:border-zinc-800 pb-4"
          >
            <div>
              <p class="font-serif text-zinc-900 dark:text-zinc-100">
                Deep Dive
              </p>
              <p class="font-mono text-xs text-zinc-500">
                20 days · Full system + support
              </p>
            </div>
            <p class="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              $25,000
            </p>
          </div>
        </div>

        <p class="font-mono text-xs text-zinc-500">
          50% upfront, 50% on delivery · Hourly available at $175/hr
        </p>
      </section>

      <!-- FAQ -->
      <section class="mb-12">
        <h2
          class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-6"
        >
          FAQ
        </h2>
        <div class="space-y-6">
          <div>
            <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
              What if we're not sure about scope?
            </p>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              That's what the call is for. Come with the problem, not a
              requirements doc.
            </p>
          </div>
          <div>
            <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
              Tech stack?
            </p>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              TypeScript, Vue/Nuxt, D3.js, Node, MapLibre. 13 years of
              production experience.
            </p>
          </div>
          <div>
            <p class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">
              What happens after?
            </p>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              You own everything. Full source, docs, handoff.
            </p>
          </div>
        </div>
      </section>

      <!-- Availability -->
      <section class="mb-16">
        <p
          class="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-8"
        >
          Availability
        </p>

        <div class="space-y-6 mb-10">
          <p class="font-serif text-2xl" style="letter-spacing: -0.01em">
            <template
              v-if="availability?.currentQuarter?.status === 'available'"
            >
              Currently accepting new clients.
            </template>
            <template
              v-else-if="availability?.currentQuarter?.status === 'limited'"
            >
              Limited availability remains.
            </template>
            <template
              v-else-if="availability?.currentQuarter?.status === 'full'"
            >
              {{ availability?.currentQuarter?.name }} is fully committed.
            </template>
            <template v-else>Inquire about availability.</template>
          </p>

          <p class="font-serif text-zinc-500 dark:text-zinc-400">
            I work with {{ availability?.maxClients || 3 }} clients at a time,
            {{ availability?.hoursPerWeekRange?.[0] || 10 }}&ndash;{{
              availability?.hoursPerWeekRange?.[1] || 30
            }}
            hours per week each.
            <template
              v-if="
                availability?.currentQuarter?.slotsAvailable &&
                availability?.currentQuarter?.slotsAvailable > 0
              "
            >
              {{
                availability?.currentQuarter?.slotsAvailable === 1
                  ? 'One position'
                  : `${availability?.currentQuarter?.slotsAvailable} positions`
              }}
              available for {{ availability?.currentQuarter?.name }}.
            </template>
          </p>
        </div>

        <!-- Capacity indicator - minimal, elegant -->
        <div
          class="flex items-center gap-6 mb-10 py-4 border-y border-zinc-100 dark:border-zinc-800"
        >
          <div class="flex gap-1.5">
            <template v-for="i in availability?.maxClients || 3" :key="i">
              <div
                class="w-3 h-3 rounded-full transition-colors"
                :class="
                  i <= (availability?.activeClientCount || 0)
                    ? 'bg-zinc-400 dark:bg-zinc-500'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                "
              />
            </template>
          </div>
          <p class="font-mono text-xs text-zinc-400">
            {{
              availability?.maxClients - (availability?.activeClientCount || 0)
            }}
            of {{ availability?.maxClients || 3 }} positions available
          </p>
        </div>
      </section>

      <!-- Full Calendar -->
      <section class="mb-12">
        <p
          class="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4"
        >
          Schedule a Consultation
        </p>
        <p class="font-mono text-xs text-zinc-400 mb-6">
          60 minutes · No obligation · We discuss your project and determine fit
        </p>
        <div
          id="cal-inline-embed"
          class="cal-inline-embed border border-zinc-200 dark:border-zinc-800"
        ></div>
      </section>

      <!-- Footer -->
      <footer class="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p class="font-mono text-xs text-zinc-500">
          Quick questions?
          <a
            href="mailto:ejfox@ejfox.com"
            class="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ejfox@ejfox.com
          </a>
        </p>
      </footer>
    </main>

    <!-- Sidebar: Availability + CTA -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="pt-6 space-y-4">
          <!-- Availability status -->
          <div class="flex items-center gap-2">
            <div class="flex gap-1">
              <template v-for="i in availability?.maxClients || 3" :key="i">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="
                    i <= (availability?.activeClientCount || 0)
                      ? 'bg-zinc-400 dark:bg-zinc-500'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  "
                />
              </template>
            </div>
            <span class="font-mono text-xs text-zinc-500">
              {{
                availability?.maxClients -
                (availability?.activeClientCount || 0)
              }}
              open
            </span>
          </div>

          <!-- Book a Call CTA -->
          <a
            href="#cal-inline-embed"
            class="block w-full py-2 px-3 text-center font-mono text-xs border border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            Book a Call
          </a>
          <p class="font-mono text-xs text-zinc-400">60 min · No obligation</p>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.cal-inline-embed {
  min-height: 500px;
  width: 100%;
}

@media (min-width: 640px) {
  .cal-inline-embed {
    min-height: 600px;
  }
}
</style>
