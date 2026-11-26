<!--
  @file case-study/nbc-big-board.vue
  @description /case-study/nbc-big-board: hand-written, fully static
    consulting case study (all copy lives in this template, no data fetch).
    SSR on demand. The "Let's talk" link feeds the Umami `project-hire-cta`
    funnel (location: case-study-nbc; see CLAUDE.md "Umami funnel events").
  Gotchas: Every claim here is my published copy; don't edit credits,
    numbers or quotes without checking with me.
  Typography (2026-11-25, "simple, minimalist"): one serif, no section
    titles, ⁂ between parts, press quotes (asides) floated left beside
    the paragraph they answer, small caps for the dateline and credits.
-->
<script setup lang="ts">
import { useWindowScroll, useWindowSize } from '@vueuse/core'

// Reading progress: the same 1px bar across the top as a blog post.
const { y } = useWindowScroll()
const { height } = useWindowSize()
const progress = computed(() => {
  if (!import.meta.client) return 0
  const max = document.documentElement.scrollHeight - height.value
  return max > 0 ? Math.min((y.value / max) * 100, 100) : 0
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

    <article class="cs">
      <h1>Building the Big Board</h1>
      <p class="dateline">NBC News / MSNBC · 2018 · 9 months</p>
      <p class="lede">
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
        <figcaption>
          Me with the Big Board at 30 Rock, election night 2018
        </figcaption>
      </figure>

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

      <hr />

      <p>I started with a working prototype that showed what was possible.</p>
      <p>
        In January 2018, I demoed it to Steve's producer. Then to Steve himself.
        Then to the executives. Each demo added momentum. By spring, we had
        budget and a team.
      </p>
      <aside class="pull">
        <p class="pull-quote">
          “A newly juiced-up model of the board that can zoom in on the most
          obscure House districts”
        </p>
        <p class="pull-credit">The New York Times</p>
      </aside>
      <p>
        D3 for the maps and transitions, Vue for the UI state. TopoJSON turned a
        50MB shapefile into 2MB, which kept zooming smooth. The map tiles were
        pre-rendered; only the data overlays updated in real time. Every feature
        had a fallback: if the live data feed died, we could switch to cached
        data.
      </p>
      <hr />

      <aside class="pull">
        <p class="pull-quote">
          “Kornacki, eli5-ing races with sleeves rolled up and an 82-inch
          vertical touchscreen... looked amazing with the board, panning and
          zooming”
        </p>
        <p class="pull-credit">Vulture</p>
      </aside>
      <p>
        Chuck Todd's producer said it was the first election night where Chuck
        wasn't frustrated with the app. That might be the compliment I'm
        proudest of.
      </p>
      <p>
        Start with a working prototype, something people can touch and react to.
        Understand the performer: Steve Kornacki has a specific way of thinking
        and moving, and the app had to feel like an extension of his hands.
        Design for the failure mode. Ship something real, then iterate: the app
        that shipped in November was very different from the January prototype,
        but without that prototype, nothing would have shipped.
      </p>

      <hr />

      <p class="more">
        <NuxtLink to="/blog/2022/election-night-2018"
          >Election Night 2018</NuxtLink
        >
        ·
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
/* One serif (Georgia via font-serif). Body 18/28; the title and the pull
   quotes are the only larger type. */
.cs {
  @apply font-serif text-base leading-7 text-zinc-800 dark:text-zinc-200;
  font-variant-numeric: oldstyle-nums proportional-nums;
  hanging-punctuation: first last; /* Safari: quote marks hang */
}
.cs h1 {
  @apply font-serif font-normal normal-case tracking-normal text-3xl leading-tight mb-1;
  text-wrap: balance;
}
.cs p {
  @apply mb-4;
  text-wrap: pretty; /* no one-word last lines */
}

/* Small caps for the dateline and quote credits */
.dateline,
.pull-credit {
  font-variant-caps: all-small-caps;
  letter-spacing: 0.06em;
  @apply text-zinc-500;
}
.dateline {
  @apply mb-6;
}

/* The opening line in small caps, as books do */
.lede::first-line {
  font-variant-caps: small-caps;
  letter-spacing: 0.02em;
}

.cs figure {
  @apply my-8;
}
.cs img {
  @apply block w-full;
}
.cs figcaption {
  /* the global figcaption is mono */
  @apply mt-2 font-serif text-base italic text-zinc-500;
}

/* Section breaks: a quiet asterism instead of titles */
.cs hr {
  @apply border-0 my-8 text-center text-zinc-500;
  height: auto;
}
.cs hr::after {
  content: '⁂';
  @apply text-base;
}

/* Pull quotes: an <aside>, not <blockquote> (the global blockquote rules are
   all !important). Floated left beside the paragraph they answer, opening
   quote mark hanging. Full width on phones. */
.pull {
  @apply my-6;
}
.pull-quote {
  @apply font-serif italic text-xl leading-8 mb-1 text-zinc-900 dark:text-zinc-100;
  text-indent: -0.45em;
  text-wrap: balance;
}
.pull-credit {
  @apply mb-0;
}
@media (min-width: 640px) {
  .pull {
    float: left;
    width: 34%;
    margin: 0.4rem 1.5rem 0.5rem 0;
  }
}
.cs hr {
  clear: both;
}

.more a,
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
