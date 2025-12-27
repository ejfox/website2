<script setup lang="ts">
import { formatBrierScore } from '~/composables/useNumberFormat'

const { data: calibration } = useCalibration()
const { funnel, trackScrollDepth, trackTimeOnPage } = useFunnelTracking()
const { micro } = useMicroConversions()

// Element refs for section tracking
const pricingRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)

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
})

const currentQuarter = computed(() => {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `Q${q} ${now.getFullYear()}`
})

const specialties = [
  {
    title: 'Election Night Systems',
    description: 'Real-time visualization that doesn\'t crash when 50 million people are watching.',
    proof: 'Built NBC\'s Big Board used by Steve Kornacki on live TV.',
  },
  {
    title: 'Investigative Data Analysis',
    description: 'Finding patterns in messy datasets that hold up to scrutiny.',
    proof: 'NYPD misconduct network analysis—findings confirmed by victim interviews.',
  },
  {
    title: 'Public Interest Dashboards',
    description: 'Making complex data accessible without dumbing it down.',
    proof: 'COVIDcast visualizations for Carnegie Mellon during peak pandemic.',
  },
]

const notFor = [
  'Generic BI dashboards',
  'Projects without editorial stakes',
  'Budgets under $25K',
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

      <!-- Credibility bar -->
      <div class="flex flex-wrap gap-4 text-sm font-mono border-t border-b border-zinc-200 dark:border-zinc-800 py-4 mb-8">
        <div>
          <span class="text-zinc-500">Past clients:</span>
          <span class="text-zinc-900 dark:text-zinc-100 ml-1">NBC News, Gothamist, CMU</span>
        </div>
        <div v-if="calibration?.brier_score" class="border-l border-zinc-300 dark:border-zinc-700 pl-4">
          <span class="text-zinc-500">Prediction accuracy:</span>
          <span class="text-green-600 dark:text-green-400 ml-1 font-bold">{{ formatBrierScore(calibration.brier_score) }}</span>
          <span class="text-zinc-400 ml-1">Brier</span>
        </div>
      </div>

      <!-- Availability -->
      <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span class="font-mono text-sm text-green-800 dark:text-green-300">
            1 engagement slot open for {{ currentQuarter }}
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

    <!-- Pricing Signal -->
    <section ref="pricingRef" class="section-spacing">
      <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
        <h2 class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-3">
          Investment
        </h2>
        <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
          Typical engagements run <span class="font-mono text-zinc-900 dark:text-zinc-100 font-bold">$25K–$75K</span> for 4–8 weeks of focused work.
          Larger systems (election platforms, ongoing newsroom tools) start higher.
        </p>
        <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
          <span class="font-mono text-orange-600 dark:text-orange-400 font-bold">Rush jobs welcome.</span>
          Tight deadline? I love those. Rush fee applies—we'll figure it out on the call.
        </p>
        <p class="font-serif text-sm text-zinc-500">
          If that's not in your budget, no hard feelings—I can sometimes recommend others.
        </p>
      </div>
    </section>

    <!-- CTA -->
    <section ref="ctaRef" class="section-spacing">
      <div class="border border-zinc-900 dark:border-zinc-100 rounded-lg p-6">
        <h2 class="font-serif text-xl text-zinc-900 dark:text-zinc-100 mb-3">
          Ready to talk?
        </h2>
        <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
          Book a discovery call. Come with a problem, not a requirements doc.
        </p>
        <NuxtLink
          to="/calendar"
          class="inline-block bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-2.5 rounded font-mono text-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Book Discovery Call
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <p class="font-serif text-sm text-zinc-500">
        Quick questions?
        <a href="mailto:ejfox@ejfox.com" class="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          ejfox@ejfox.com
        </a>
        — but for projects, the calendar is faster.
      </p>
    </footer>
  </main>
</template>
