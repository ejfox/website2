<script setup lang="ts">
import { formatBrierScore } from '~/composables/useNumberFormat'
import { useDark } from '@vueuse/core'

const isDark = useDark()
const { data: calibration } = useCalibration()
const { funnel, trackScrollDepth, trackTimeOnPage } = useFunnelTracking()
const { micro } = useMicroConversions()
const { getAttributionForForm } = useAttribution()

// Element refs for section tracking
const pricingRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)
const calEmbedRef = ref<HTMLElement | null>(null)

// Track section visibility
useElementVisibility(pricingRef, {
  onVisible: () => micro.viewedPricing(),
  threshold: 0.5,
  once: true,
})

useElementVisibility(ctaRef, {
  onVisible: () => micro.clickedCTA('consulting_cta_section'),
  threshold: 0.5,
  once: true,
})

// Exit intent tracking
useExitIntent({
  onExitIntent: () => {
    // Could show modal, for now just tracks
  },
})

// Track page view and engagement
onMounted(() => {
  funnel.viewedConsulting()
  micro.landed('/consulting')
  trackScrollDepth([25, 50, 75, 90])
  trackTimeOnPage([30, 60, 120])

  // Initialize Cal.com inline embed (#8 - inline calendar converts 40% better)
  initCalEmbed()
})

// Cal.com embed initialization
function initCalEmbed() {
  if (!import.meta.client) return

  /* eslint-disable prefer-rest-params, @typescript-eslint/no-unused-expressions */
  ;(function (C, A, L) {
    const p = function (a: { q: unknown[] }, ar: unknown) {
      a.q.push(ar)
    }
    const d = C.document
    ;(C as Window & { Cal?: unknown }).Cal =
      (C as Window & { Cal?: unknown }).Cal ||
      function () {
        const cal = (C as Window & { Cal: { loaded?: boolean; ns: Record<string, unknown>; q: unknown[] } }).Cal
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

  const win = window as Window & { Cal?: (action: string, config?: unknown) => void }
  win.Cal?.('init', { origin: 'https://cal.com' })

  const attribution = getAttributionForForm()
  win.Cal?.('inline', {
    elementOrSelector: '#cal-inline-embed',
    calLink: 'ejfox/30min',
    layout: 'month_view',
    config: { metadata: attribution },
  })

  setTimeout(() => {
    updateCalTheme()
    funnel.calendarLoaded()
  }, 100)

  win.Cal?.('on', {
    action: 'bookingSuccessful',
    callback: () => {
      funnel.calBookingComplete()
    },
  })

  watch(isDark, () => updateCalTheme())
}

function updateCalTheme() {
  const win = window as Window & { Cal?: (action: string, config?: unknown) => void }
  if (!win.Cal) return
  win.Cal('ui', {
    theme: isDark.value ? 'dark' : 'light',
    hideEventTypeDetails: false,
    layout: 'month_view',
    styles: { branding: { brandColor: isDark.value ? '#a1a1aa' : '#3f3f46' } },
  })
}

// Live availability from Cal.com
const { data: availability } = await useFetch('/api/cal/availability', {
  default: () => ({
    quarter: 'Q1 2025',
    slotsAvailable: 2,
    status: 'available',
    message: '2 spots open',
  }),
})

const specialties = [
  {
    title: 'Election Night Systems',
    description: 'Real-time visualization that doesn\'t crash when 50 million people are watching.',
    proof: 'NBC Big Board: 19M viewers on election night 2018. Zero crashes. Featured in NYT and Vulture.',
  },
  {
    title: 'Investigative Data Analysis',
    description: 'Finding patterns in messy datasets that hold up to scrutiny.',
    proof: 'NYPD analysis: 180K+ complaints, 113K officer nodes. Findings confirmed by victim interviews for Gothamist.',
  },
  {
    title: 'Public Interest Dashboards',
    description: 'Making complex data accessible without dumbing it down.',
    proof: 'CMU COVIDcast: Helped millions track pandemic spread during peak uncertainty.',
  },
]

const notFor = [
  'Generic BI dashboards',
  'Projects without editorial stakes',
  'Engagements under 5 days',
]

usePageSeo({
  title: 'Consulting · EJ Fox',
  description: 'High-stakes data visualization for newsrooms, investigations, and public interest. Built NBC\'s election Big Board. Limited availability.',
  type: 'website',
  section: 'Consulting',
  tags: ['Consulting', 'Data Visualization', 'Elections', 'Journalism'],
})
</script>

<template>
  <main class="container-main pt-8 max-w-2xl">
    <!-- Hero -->
    <header class="section-spacing-lg">
      <p class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-3">
        Consulting via Room 302 Studio
      </p>
      <h1 class="font-serif text-3xl md:text-4xl font-normal mb-6" style="letter-spacing: -0.02em">
        I build data systems for moments when failure isn't an option.
      </h1>
      <p class="font-serif text-lg text-zinc-600 dark:text-zinc-400 mb-6">
        Election nights. Breaking investigations. Public health crises.
        When millions are watching and the data has to be right, that's when you call me.
      </p>

      <!-- Photo - 39% conversion lift from showing face -->
      <div class="mb-8">
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="EJ Fox presenting election visualization on NBC's Big Board"
          class="w-full rounded-lg"
        />
        <p class="font-mono text-xs text-zinc-400 mt-2">
          Me with the Big Board at 30 Rock, election night 2018
        </p>
      </div>

      <!-- Credibility bar -->
      <div class="flex flex-wrap gap-4 text-sm font-mono border-t border-b border-zinc-200 dark:border-zinc-800 py-4 mb-8">
        <div>
          <span class="text-zinc-500">Past clients:</span>
          <span class="text-zinc-900 dark:text-zinc-100 ml-1">NBC, MSNBC, WaPo, AP, CMU</span>
        </div>
        <div v-if="calibration?.brier_score" class="border-l border-zinc-300 dark:border-zinc-700 pl-4">
          <span class="text-zinc-500">Prediction accuracy:</span>
          <span class="text-green-600 dark:text-green-400 ml-1 font-bold">{{ formatBrierScore(calibration.brier_score) }}</span>
          <span class="text-zinc-400 ml-1">Brier</span>
        </div>
      </div>

      <!-- Live Availability -->
      <div
        class="rounded px-4 py-3"
        :class="{
          'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800': availability?.status === 'available',
          'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800': availability?.status === 'limited',
          'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700': availability?.status === 'full',
        }"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-green-500 animate-pulse': availability?.status === 'available',
              'bg-yellow-500 animate-pulse': availability?.status === 'limited',
              'bg-zinc-400': availability?.status === 'full',
            }"
          ></span>
          <span
            class="font-mono text-sm"
            :class="{
              'text-green-800 dark:text-green-300': availability?.status === 'available',
              'text-yellow-800 dark:text-yellow-300': availability?.status === 'limited',
              'text-zinc-600 dark:text-zinc-400': availability?.status === 'full',
            }"
          >
            {{ availability?.message }}
          </span>
        </div>
      </div>
    </header>

    <!-- Why Now -->
    <section class="section-spacing border-l-2 border-orange-400 dark:border-orange-600 pl-4 bg-orange-50/50 dark:bg-orange-900/10 -mx-4 px-4 py-4 rounded-r">
      <p class="font-mono text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
        2024-2025
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300">
        Election cycles, AI-disrupted newsrooms, climate deadlines converging.
        Newsrooms need people who understand both the journalism and the engineering.
        That intersection is getting rarer, not more common.
      </p>
    </section>

    <!-- Specialties -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-6">What I Do</h2>
      <div class="space-y-8">
        <article
          v-for="s in specialties"
          :key="s.title"
          class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
        >
          <h3 class="font-serif text-xl text-zinc-900 dark:text-zinc-100 mb-2">
            {{ s.title }}
          </h3>
          <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-3">
            {{ s.description }}
          </p>
          <p class="font-mono text-xs text-zinc-500">
            <span class="text-green-600 dark:text-green-400">Proof:</span>
            {{ s.proof }}
          </p>
        </article>
      </div>
    </section>

    <!-- Press Mentions -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">Featured In</h2>
      <div class="space-y-4">
        <blockquote class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
          <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
            "A newly juiced-up model of the board that can zoom in on the most obscure House districts"
          </p>
          <cite class="font-mono text-xs text-zinc-500 not-italic">— The New York Times, on NBC's Big Board</cite>
        </blockquote>
        <blockquote class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
          <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
            "Kornacki,eli5-ing races with sleeves rolled up and an 82-inch vertical touchscreen... looked amazing with the board, panning and zooming"
          </p>
          <cite class="font-mono text-xs text-zinc-500 not-italic">— Vulture</cite>
        </blockquote>
      </div>
    </section>

    <!-- Not For -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">Not a Fit</h2>
      <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
        To keep quality high and availability real, I'm selective:
      </p>
      <ul class="space-y-2">
        <li
          v-for="item in notFor"
          :key="item"
          class="flex items-start gap-3 font-mono text-sm"
        >
          <span class="text-zinc-400">—</span>
          <span class="text-zinc-500">{{ item }}</span>
        </li>
      </ul>
    </section>

    <!-- How It Works -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">How It Works</h2>
      <div class="space-y-6">
        <div class="flex gap-4">
          <div class="font-mono text-sm text-zinc-400 w-8 shrink-0">01</div>
          <div>
            <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">Discovery call</h3>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              30 minutes. You tell me the problem, I tell you if I can help.
              No pitch deck required.
            </p>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="font-mono text-sm text-zinc-400 w-8 shrink-0">02</div>
          <div>
            <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">Proposal</h3>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              If it's a fit, you get a proposal within a week. Fixed scope, fixed price.
              No hourly billing, no surprises.
            </p>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="font-mono text-sm text-zinc-400 w-8 shrink-0">03</div>
          <div>
            <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-1">Execution</h3>
            <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
              Weekly check-ins, async updates, working prototypes early.
              You see progress, not just status reports.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section ref="pricingRef" class="section-spacing">
      <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
        <h2 class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-4">
          Rates
        </h2>

        <!-- Rate cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white dark:bg-zinc-900 rounded p-4 border border-zinc-200 dark:border-zinc-700">
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 font-bold">$1,250</p>
            <p class="font-mono text-xs text-zinc-500">per day</p>
          </div>
          <div class="bg-white dark:bg-zinc-900 rounded p-4 border border-zinc-200 dark:border-zinc-700">
            <p class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 font-bold">$175</p>
            <p class="font-mono text-xs text-zinc-500">per hour</p>
          </div>
        </div>

        <!-- Payment terms -->
        <div class="border-t border-zinc-200 dark:border-zinc-700 pt-4 mb-4">
          <p class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-2">Payment</p>
          <p class="font-serif text-zinc-700 dark:text-zinc-300">
            <span class="font-mono text-zinc-900 dark:text-zinc-100">50% upfront</span> to start,
            <span class="font-mono text-zinc-900 dark:text-zinc-100">50% on delivery</span>.
            Simple.
          </p>
        </div>

        <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
          <span class="font-mono text-orange-600 dark:text-orange-400 font-bold">Rush jobs welcome.</span>
          Tight deadline? I love those. We'll figure it out on the call.
        </p>

        <p class="font-serif text-sm text-zinc-500">
          Typical engagements run 5–20 days. Longer projects and retainers available.
        </p>
      </div>
    </section>

    <!-- FAQ - reduces uncertainty -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-6">Common Questions</h2>
      <div class="space-y-6">
        <div>
          <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-2">What if we're not sure about scope yet?</h3>
          <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
            That's what the discovery call is for. Come with the problem, not a requirements doc.
            We'll figure out scope together—and if it's not a fit, I'll tell you.
          </p>
        </div>
        <div>
          <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-2">Do you work with teams or solo?</h3>
          <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
            Both. I can embed with your existing team or run the whole thing myself.
            For larger projects, I bring in trusted collaborators from my network.
          </p>
        </div>
        <div>
          <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-2">What's your tech stack?</h3>
          <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
            D3.js, Vue/Nuxt, TypeScript, Node. For mapping: Mapbox, TopoJSON.
            For data: Python, Observable, Datasette. But I pick tools based on your constraints, not mine.
          </p>
        </div>
        <div>
          <h3 class="font-serif text-zinc-900 dark:text-zinc-100 mb-2">What happens after the project ends?</h3>
          <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
            You own everything. Full source code, documentation, handoff to your team.
            I'm available for maintenance retainers if you want ongoing support.
          </p>
        </div>
      </div>
    </section>

    <!-- #7: Value Before Ask -->
    <section class="section-spacing">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 class="font-mono text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
          What you'll get on the call
        </h2>
        <ul class="space-y-2 font-serif text-zinc-700 dark:text-zinc-300">
          <li class="flex gap-3">
            <span class="text-blue-500 shrink-0">1.</span>
            <span>Honest assessment: is this a good fit, or should you look elsewhere?</span>
          </li>
          <li class="flex gap-3">
            <span class="text-blue-500 shrink-0">2.</span>
            <span>Initial approach: how I'd tackle your specific problem</span>
          </li>
          <li class="flex gap-3">
            <span class="text-blue-500 shrink-0">3.</span>
            <span>Ballpark scope: rough timeline and investment range</span>
          </li>
        </ul>
        <p class="mt-4 font-mono text-xs text-blue-600 dark:text-blue-400">
          Even if we don't work together, you'll leave with a clearer picture.
        </p>
      </div>
    </section>

    <!-- Video Intro - personal connection before booking -->
    <section class="section-spacing">
      <div class="bg-zinc-900 dark:bg-zinc-800 rounded-lg p-6 text-center">
        <p class="font-mono text-xs text-zinc-400 uppercase tracking-wide mb-3">
          2 min video
        </p>
        <h2 class="font-serif text-xl text-zinc-100 mb-4">
          Before you book: a quick intro
        </h2>
        <div class="aspect-video bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-4">
          <!-- Replace with Loom embed: <iframe src="https://www.loom.com/embed/VIDEO_ID" ... /> -->
          <div class="text-center">
            <p class="font-mono text-sm text-zinc-500 mb-2">Video coming soon</p>
            <p class="font-mono text-xs text-zinc-600">Who I am, how I work, what to expect</p>
          </div>
        </div>
        <p class="font-serif text-sm text-zinc-400">
          I recorded this so you know what you're getting into before we talk.
        </p>
      </div>
    </section>

    <!-- #2: Social Proof at Decision Point -->
    <section ref="ctaRef" class="section-spacing">
      <div class="text-center mb-6">
        <p class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-4">
          Trusted by teams at
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 md:gap-5 opacity-50">
          <img src="/logos/nbc-news.svg" alt="NBC News" class="h-4 dark:invert" />
          <img src="/logos/msnbc.svg" alt="MSNBC" class="h-4 dark:invert" />
          <img src="/logos/wapo.svg" alt="The Washington Post" class="h-4 dark:invert" />
          <img src="/logos/ap.svg" alt="Associated Press" class="h-3 dark:invert" />
          <img src="/logos/github.svg" alt="GitHub" class="h-4 dark:invert" />
          <img src="/logos/gothamist.svg" alt="Gothamist" class="h-4 dark:invert" />
          <img src="/logos/wnyc.svg" alt="WNYC" class="h-3 dark:invert" />
          <img src="/logos/cmu.svg" alt="Carnegie Mellon" class="h-3 dark:invert" />
          <img src="/logos/climate-trace.svg" alt="Climate TRACE" class="h-3 dark:invert" />
          <img src="/logos/knight.svg" alt="Knight Foundation" class="h-3 dark:invert" />
        </div>
      </div>

      <!-- #3: Risk Reversal -->
      <div class="text-center mb-8">
        <p class="font-serif text-zinc-600 dark:text-zinc-400">
          No pitch. No commitment. Just a conversation.
        </p>
        <p class="font-mono text-sm text-zinc-500 mt-1">
          30 minutes · You talk, I listen · Zero obligation
        </p>
      </div>

      <!-- #8: Inline Calendar (40% better conversion than links) -->
      <div id="cal-inline-embed" class="cal-inline-embed rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"></div>
    </section>

    <!-- Footer -->
    <footer class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <p class="font-serif text-sm text-zinc-500">
        Quick questions?
        <a href="mailto:ejfox@ejfox.com" class="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          ejfox@ejfox.com
        </a>
      </p>
    </footer>
  </main>
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
