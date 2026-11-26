<!--
  @file case-study/nbc-big-board.vue
  @description /case-study/nbc-big-board: hand-written, fully static
    consulting case study (all copy lives in this template, no data fetch).
    SSR on demand. The "Let's talk" link feeds the Umami `project-hire-cta`
    funnel (location: case-study-nbc; see CLAUDE.md "Umami funnel events").
  Gotchas: Every claim here is my published copy; don't edit credits,
    numbers or quotes without checking with me.
  Copy (2026-11-25): ad-length, about 130 words, facts only (70 was too short). EJ: "still so much
    text… imagine you were a copywriter". One serif, small-caps dateline,
    the NYT quote as a floated pull quote.
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
    "Steve Kornacki's election-night touchscreen, rebuilt. Over 10 million people have watched it on NBC and MSNBC",
})
</script>

<template>
  <div data-page-main class="container-main pt-8 max-w-2xl">
    <div class="progress-bar print:hidden" aria-hidden="true">
      <div class="progress-inner" :style="{ width: `${progress}%` }" />
    </div>

    <article class="cs">
      <h1>Building the Big Board</h1>
      <p class="dateline">NBC News / MSNBC · 2018</p>

      <figure>
        <img
          src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
          alt="Me with the Big Board at 30 Rock"
        />
      </figure>

      <p class="lede">
        Steve Kornacki's election-night touchscreen, rebuilt. I co-built it and
        led the design, with Michael Small and NBC News Digital.
      </p>
      <p>
        It started as a prototype I made in January. I demoed it to Steve's
        producer, then to Steve, then to the executives, until it had a budget
        and a team.
      </p>
      <aside class="pull">
        <p class="pull-quote">
          “A newly juiced-up model of the board that can zoom in on the most
          obscure House districts”
        </p>
        <p class="pull-credit">The New York Times</p>
      </aside>

      <p>
        D3 and Vue for the maps and interface. TopoJSON shrank a 50MB shapefile
        to 2MB, so zooming to any county stayed smooth on an 82-inch screen.
      </p>

      <p>
        Over 10 million people have watched it on NBC and MSNBC. Chuck Todd's
        producer said it was the first election night Chuck wasn't frustrated
        with the app. It's still in use today.
      </p>

      <aside class="pull pull-wide">
        <p class="pull-quote">
          “Kornacki, eli5-ing races with sleeves rolled up and an 82-inch
          vertical touchscreen... looked amazing with the board, panning and
          zooming”
        </p>
        <p class="pull-credit">Vulture</p>
      </aside>

      <hr />

      <p class="more">
        <NuxtLink to="/blog/2022/election-night-2018"
          >Election Night 2018</NuxtLink
        >
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
/* The second quote breaks out full width: two floats in this little text
   leave a dead column. */
.pull-wide {
  @apply my-8;
  clear: both;
}
@media (min-width: 640px) {
  .pull:not(.pull-wide) {
    float: left;
    clear: left; /* a tall quote never stacks beside the next one */
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
