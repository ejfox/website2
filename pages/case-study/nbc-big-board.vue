<script setup lang="ts">
usePageSeo({
  title: 'Case Study: NBC Big Board · EJ Fox',
  description:
    'How I rebuilt the election touchscreen used by Steve Kornacki on live TV. 19M viewers. Zero crashes. The full story.',
})
</script>

<template>
  <main class="container-main pt-8 max-w-2xl">
    <!-- Header -->
    <header class="section-spacing-lg">
      <p class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-3">
        Case Study
      </p>
      <h1
        class="font-serif text-3xl md:text-4xl font-normal mb-4"
        style="letter-spacing: -0.02em"
      >
        Building the Big Board
      </h1>
      <p class="font-serif text-xl text-zinc-600 dark:text-zinc-400 mb-6">
        How I rebuilt the election touchscreen used by Steve Kornacki on live
        TV. 19 million viewers. Zero crashes. This is the full story.
      </p>

      <div
        class="flex flex-wrap gap-4 text-sm font-mono border-t border-b border-zinc-200 dark:border-zinc-800 py-4"
      >
        <div>
          <span class="text-zinc-500">Client:</span>
          <span class="text-zinc-900 dark:text-zinc-100 ml-1">
            NBC News / MSNBC
          </span>
        </div>
        <div class="border-l border-zinc-300 dark:border-zinc-700 pl-4">
          <span class="text-zinc-500">Timeline:</span>
          <span class="text-zinc-900 dark:text-zinc-100 ml-1">9 months</span>
        </div>
        <div class="border-l border-zinc-300 dark:border-zinc-700 pl-4">
          <span class="text-zinc-500">Year:</span>
          <span class="text-zinc-900 dark:text-zinc-100 ml-1">2018</span>
        </div>
      </div>
    </header>

    <!-- Hero Image -->
    <section class="section-spacing">
      <img
        src="https://res.cloudinary.com/ejf/image/upload/v1667919994/IMG_6222.jpg"
        alt="EJ Fox with the Big Board at 30 Rock"
        class="w-full rounded-lg"
      />
      <p class="font-mono text-xs text-zinc-400 mt-2">
        Me with the Big Board at 30 Rock, election night 2018
      </p>
    </section>

    <!-- The Problem -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">The Problem</h2>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        NBC's existing election touchscreen was showing its age. The interface
        was clunky. The maps couldn't zoom to county level smoothly. And Steve
        Kornacki—the human phenomenon who turns election data into compelling
        TV—was fighting the technology instead of flowing with it.
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        The stakes were absurd. Election night is the Super Bowl of news. Tens
        of millions of viewers. Live TV. No second takes. If the app crashes,
        you've just created a viral moment for all the wrong reasons.
      </p>
      <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 my-6">
        <p class="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          <strong class="text-zinc-900 dark:text-zinc-100">
            The constraint:
          </strong>
          Build something that feels like magic on a 82-inch touchscreen,
          handles real-time data from 3,000+ counties, and absolutely cannot
          fail.
        </p>
      </div>
    </section>

    <!-- The Approach -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">The Approach</h2>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        I started with a prototype. Not a proposal. Not a requirements doc. A
        working prototype that showed what was possible.
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        In January 2018, I demoed it to Steve's producer. Then to Steve himself.
        Then to the executives. Each demo added momentum. By spring, we had
        budget and a team.
      </p>

      <h3 class="font-serif text-lg text-zinc-900 dark:text-zinc-100 mt-8 mb-3">
        Technical decisions that mattered
      </h3>
      <ul class="space-y-3 font-serif text-zinc-700 dark:text-zinc-300">
        <li class="flex gap-3">
          <span class="text-zinc-400 shrink-0">—</span>
          <span>
            <strong>D3.js + Vue:</strong>
            D3 for the maps and transitions, Vue for the UI state. This combo
            let us build complex interactions without fighting the framework.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="text-zinc-400 shrink-0">—</span>
          <span>
            <strong>TopoJSON:</strong>
            Compressed geographic data. A 50MB shapefile becomes 2MB. Critical
            for smooth zoom transitions.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="text-zinc-400 shrink-0">—</span>
          <span>
            <strong>Pre-rendered base layers:</strong>
            The map tiles were pre-rendered. Only the data overlays updated in
            real-time. This separation of concerns saved us.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="text-zinc-400 shrink-0">—</span>
          <span>
            <strong>Graceful degradation:</strong>
            Every feature had a fallback. If the live data feed died, we could
            switch to cached data seamlessly.
          </span>
        </li>
      </ul>
    </section>

    <!-- What Almost Went Wrong -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">What Almost Went Wrong</h2>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        Around 9 PM on election night, Steve tapped Montana. Nothing happened.
        He tapped again. Still nothing. The map was frozen on live TV.
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        My heart stopped. I was watching from the control room, headset on,
        listening to the chaos.
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        But here's the thing: the app wasn't frozen. The video feed from the app
        to the broadcast system had hiccupped. My touch inputs were being
        received and processed correctly—the output just wasn't making it to the
        screen.
      </p>
      <p class="font-serif text-zinc-700 dark:text-zinc-300">
        The control room re-routed the video feed. 15 seconds later, we were
        back. Most viewers probably didn't notice.
      </p>
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6"
      >
        <p class="font-mono text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Lesson:</strong>
          Build systems where you control the failure modes. I couldn't control
          the broadcast infrastructure, but I could control how the app behaved.
          It never actually crashed.
        </p>
      </div>
    </section>

    <!-- The Results -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">The Results</h2>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <p
            class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 font-bold"
          >
            19M
          </p>
          <p class="font-mono text-xs text-zinc-500">
            viewers on election night
          </p>
        </div>
        <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <p
            class="font-mono text-2xl text-zinc-900 dark:text-zinc-100 font-bold"
          >
            0
          </p>
          <p class="font-mono text-xs text-zinc-500">app crashes</p>
        </div>
      </div>

      <blockquote
        class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-6"
      >
        <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
          "A newly juiced-up model of the board that can zoom in on the most
          obscure House districts"
        </p>
        <cite class="font-mono text-xs text-zinc-500 not-italic">
          — The New York Times
        </cite>
      </blockquote>

      <blockquote
        class="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 my-6"
      >
        <p class="font-serif text-zinc-600 dark:text-zinc-400 italic">
          "Kornacki, eli5-ing races with sleeves rolled up and an 82-inch
          vertical touchscreen... looked amazing with the board, panning and
          zooming"
        </p>
        <cite class="font-mono text-xs text-zinc-500 not-italic">
          — Vulture
        </cite>
      </blockquote>

      <p class="font-serif text-zinc-700 dark:text-zinc-300">
        Chuck Todd's producer said it was the first election night where Chuck
        wasn't frustrated with the app. That might be the compliment I'm
        proudest of.
      </p>
    </section>

    <!-- The Pattern -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">The Pattern</h2>
      <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
        This project taught me a pattern I've used ever since:
      </p>
      <ol class="space-y-3 font-serif text-zinc-700 dark:text-zinc-300">
        <li class="flex gap-3">
          <span class="font-mono text-zinc-400 shrink-0">1.</span>
          <span>
            <strong>Start with a working prototype.</strong>
            Not a deck. Not a proposal. Something people can touch and react to.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="font-mono text-zinc-400 shrink-0">2.</span>
          <span>
            <strong>Understand the performer.</strong>
            Steve Kornacki has a specific way of thinking and moving. The app
            had to feel like an extension of his hands, not a barrier.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="font-mono text-zinc-400 shrink-0">3.</span>
          <span>
            <strong>Design for the failure mode.</strong>
            What happens when things go wrong? Make that graceful, not
            catastrophic.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="font-mono text-zinc-400 shrink-0">4.</span>
          <span>
            <strong>Ship something real, then iterate.</strong>
            The app that shipped in November was very different from the January
            prototype. But without that prototype, nothing would have shipped.
          </span>
        </li>
      </ol>
    </section>

    <!-- More Case Studies -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">More Case Studies</h2>
      <div class="space-y-4">
        <NuxtLink
          to="/blog/2021/nypd-ccrb-complaint-clusters"
          class="block group"
        >
          <h3
            class="font-serif text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          >
            NYPD Misconduct Network Analysis
          </h3>
          <p class="font-mono text-xs text-zinc-500">
            Messy data, network visualization, investigative journalism
          </p>
        </NuxtLink>
        <NuxtLink to="/blog/projects/covidcast" class="block group">
          <h3
            class="font-serif text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          >
            CMU COVIDcast
          </h3>
          <p class="font-mono text-xs text-zinc-500">
            Public health dashboards under pressure
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="section-spacing">
      <div class="border border-zinc-900 dark:border-zinc-100 rounded-lg p-6">
        <h2 class="font-serif text-xl text-zinc-900 dark:text-zinc-100 mb-3">
          Have a high-stakes project?
        </h2>
        <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
          I specialize in systems that can't fail when it matters most.
        </p>
        <NuxtLink
          to="/consulting"
          class="inline-block bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-2.5 rounded font-mono text-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Let's talk
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
