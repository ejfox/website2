<!--
  @file case-study/nbc-big-board.vue
  @description /case-study/nbc-big-board: hand-written, fully static
    consulting case study (all copy lives in this template, no data fetch).
    SSR on demand. The CTA at the bottom feeds the Umami `project-hire-cta`
    funnel (location: case-study-nbc; see CLAUDE.md "Umami funnel events").
  Gotchas: Every claim here is my published copy; don't edit credits,
    numbers or quotes without checking with me.
-->
<script setup lang="ts">
import { useWindowScroll, useWindowSize } from '@vueuse/core'

// Sidebar contents + reading progress, same pieces a blog post uses
// (PostTOC in #nav-toc-container, a 1px bar across the top).
const SECTIONS = [
  { slug: 'problem', text: 'The Problem' },
  { slug: 'approach', text: 'The Approach' },
  { slug: 'almost-wrong', text: 'What Almost Went Wrong' },
  { slug: 'results', text: 'The Results' },
  { slug: 'pattern', text: 'The Pattern' },
  { slug: 'more', text: 'More Case Studies' },
].map((s, i) => ({ ...s, number: String(i + 1) }))

const tocTarget = ref<Element | null>(null)
onMounted(() => {
  tocTarget.value = document.querySelector('#nav-toc-container')
})

const { y } = useWindowScroll()
const { height } = useWindowSize()
const progress = computed(() => {
  if (!import.meta.client) return 0
  const max = document.documentElement.scrollHeight - height.value
  return max > 0 ? Math.min((y.value / max) * 100, 100) : 0
})
// Active = the last section whose heading has scrolled past the top third.
const activeSection = computed(() => {
  if (!import.meta.client) return ''
  void y.value
  let active = ''
  for (const { slug } of SECTIONS) {
    const el = document.getElementById(slug)
    if (el && el.getBoundingClientRect().top < height.value / 3) active = slug
  }
  return active
})

usePageSeo({
  title: 'Case Study: NBC Big Board · EJ Fox',
  description:
    'How we rebuilt the election touchscreen Steve Kornacki uses on live TV. About 10 million people watching on NBC and MSNBC',
})
</script>

<template>
  <div data-page-main class="container-main pt-8 max-w-2xl">
    <div class="progress-bar print:hidden" aria-hidden="true">
      <div class="progress-inner" :style="{ width: `${progress}%` }" />
    </div>
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <BlogPostTOC :toc-children="SECTIONS" :active-section="activeSection" />
      </Teleport>
    </ClientOnly>

    <!-- One serif, two sizes (title + body), no boxes, no cards. EJ,
         2026-11-25: "my whole shit is simple, minimalist". -->
    <article class="cs">
      <h1>Building the Big Board</h1>
      <p class="muted">NBC News / MSNBC · 2018 · 9 months</p>
      <p>
        How we rebuilt the election touchscreen Steve Kornacki uses on live TV.
        I co-built it and led the design, with Michael Small and NBC News
        Digital's product and tech teams. About 10 million people watching on
        NBC and MSNBC.
      </p>

      <figure>
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="Me with the Big Board at 30 Rock"
        />
        <figcaption class="muted">
          Me with the Big Board at 30 Rock, election night 2018
        </figcaption>
      </figure>

      <h2 id="problem">The Problem</h2>
      <p>
        NBC's existing election touchscreen was showing its age. The interface
        was clunky. The maps couldn't zoom to county level smoothly. And Steve
        Kornacki was fighting the technology.
      </p>
      <p>
        The constraint: build something that feels like magic on a 82-inch
        touchscreen, handles real-time data from 3,000+ counties, and absolutely
        cannot fail.
      </p>

      <h2 id="approach">The Approach</h2>
      <p>I started with a working prototype that showed what was possible.</p>
      <p>
        In January 2018, I demoed it to Steve's producer. Then to Steve himself.
        Then to the executives. Each demo added momentum. By spring, we had
        budget and a team.
      </p>
      <p>
        D3 for the maps and transitions, Vue for the UI state. TopoJSON turned a
        50MB shapefile into 2MB, which kept zooming smooth. The map tiles were
        pre-rendered; only the data overlays updated in real time. Every feature
        had a fallback: if the live data feed died, we could switch to cached
        data.
      </p>

      <h2 id="almost-wrong">What Almost Went Wrong</h2>
      <p>
        Around 9 PM on election night, Steve tapped Montana. Nothing happened.
        He tapped again. Still nothing. The map was frozen on live TV.
      </p>
      <p>
        My heart stopped. I was watching from the control room, headset on,
        listening to the chaos.
      </p>
      <p>
        But the app wasn't frozen. The video feed from the app to the broadcast
        system had hiccupped. His touch inputs were landing and the app was
        processing them correctly—the output just wasn't making it to the
        screen.
      </p>
      <p>
        The control room re-routed the video feed. 15 seconds later, we were
        back. Most viewers probably didn't notice.
      </p>
      <p>
        I can't control the broadcast infrastructure, but I can control how the
        app behaves. It never actually crashed.
      </p>

      <h2 id="results">The Results</h2>
      <p>
        “A newly juiced-up model of the board that can zoom in on the most
        obscure House districts” <span class="muted">— The New York Times</span>
      </p>
      <p>
        “Kornacki, eli5-ing races with sleeves rolled up and an 82-inch vertical
        touchscreen... looked amazing with the board, panning and zooming”
        <span class="muted">— Vulture</span>
      </p>
      <p>
        Chuck Todd's producer said it was the first election night where Chuck
        wasn't frustrated with the app. That might be the compliment I'm
        proudest of.
      </p>

      <h2 id="pattern">The Pattern</h2>
      <p>
        Start with a working prototype, something people can touch and react to.
        Understand the performer: Steve Kornacki has a specific way of thinking
        and moving, and the app had to feel like an extension of his hands.
        Design for the failure mode. Ship something real, then iterate: the app
        that shipped in November was very different from the January prototype,
        but without that prototype, nothing would have shipped.
      </p>

      <h2 id="more">More Case Studies</h2>
      <p>
        <NuxtLink to="/blog/2021/nypd-ccrb-complaint-clusters"
          >NYPD Misconduct Network Analysis</NuxtLink
        >
        ·
        <NuxtLink to="/projects/covidcast">CMU COVIDcast</NuxtLink>
        ·
        <NuxtLink
          to="/consulting"
          data-umami-event="project-hire-cta"
          data-umami-event-location="case-study-nbc"
          data-umami-event-project="nbc-big-board"
          >Let's talk</NuxtLink
        >
      </p>
    </article>
  </div>
</template>

<style scoped>
/* One serif (Georgia via font-serif), two sizes: title and everything else.
   Headings override the site's display face on purpose. */
.cs {
  @apply font-serif text-base leading-7 text-zinc-800 dark:text-zinc-200;
}
.cs h1 {
  @apply font-serif font-normal normal-case tracking-normal text-3xl leading-tight mb-2;
}
.cs h2 {
  @apply font-serif font-normal normal-case tracking-normal text-base leading-7 mt-10 mb-2 scroll-mt-24 text-zinc-900 dark:text-zinc-100;
}
.cs p {
  @apply mb-4;
}
.cs .muted {
  @apply text-zinc-500;
}
.cs figure {
  @apply my-8;
}
.cs img {
  @apply block w-full;
}
.cs figcaption {
  @apply mt-2 font-serif text-base; /* the global figcaption is mono */
}
.cs a {
  @apply underline underline-offset-2;
}

/* Same 1px reading bar as a blog post */
.progress-bar {
  @apply fixed top-0 left-0 right-0 h-px z-[101];
}
.progress-inner {
  @apply h-full bg-zinc-900/60 dark:bg-white/60;
  transition: width 75ms ease-out;
}
</style>
