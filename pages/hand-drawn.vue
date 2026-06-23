<template>
  <div class="hd-page min-h-screen bg-sunken text-zinc-900 dark:text-zinc-100">
    <div class="max-w-screen-lg mx-auto px-4 md:px-8 py-16">

      <!-- header -->
      <header class="mb-20 max-w-prose">
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
          Hand-drawn asset kit
        </p>
        <h1 class="text-4xl md:text-5xl font-semibold leading-tight mb-5 flex items-center gap-3 flex-wrap">
          Notebook marginalia,
          <HandDrawn name="arrow-right-long" size="0.8em" class="text-zinc-400" />
          as components
        </h1>
        <p class="text-lg text-zinc-600 dark:text-zinc-300 leading-8">
          Arrows, circled numbers, magnitude badges, boxes and numerals — scanned from the
          notebook, traced, and sliced into <code class="text-sm">{{ manifest.length }}</code> named
          pieces. Each one renders inline and inherits <code class="text-sm">currentColor</code>, so it
          adapts to dark mode and sits in a sentence like a letter. Below: a few ways they could live
          in posts and across the design.
        </p>
      </header>

      <!-- ===== INTEGRATION DEMOS ===== -->
      <section class="space-y-24 mb-28">

        <!-- 1. footnote / sidenote markers -->
        <Demo
          n="1"
          title="Footnote & sidenote markers"
          blurb="Swap the plain superscript ¹²³ in the sidenotes system for your own circled numbers — unmistakably yours."
        >
          <p class="text-lg leading-9 max-w-prose">
            Delete-driven development is the house style<HandDrawn name="circled-1" size="1.05em" class="mx-0.5 align-baseline" />
            and the sidenotes plugin is only 113 lines<HandDrawn name="circled-2" size="1.05em" class="mx-0.5" />
            because complexity is the enemy<HandDrawn name="circled-3" size="1.05em" class="mx-0.5" />.
          </p>
        </Demo>

        <!-- 2. THE MONEY SHOT — a marked-up draft (full width so phrases don't wrap) -->
        <Demo
          n="2"
          stacked
          title="A marked-up draft"
          blurb="Point at the phrase, circle it, underline the word that matters. The red pen, used sparingly."
        >
          <div class="relative text-xl leading-loose max-w-2xl">
            <p>
              We moved the whole site to
              <span class="whitespace-nowrap"><HandDrawn name="arrow-right" size="1.3rem" class="text-zinc-400 dark:text-zinc-500 mx-1" /><HandDrawnMark tone="#fde047">one node process</HandDrawnMark></span>
              under pm2 — a <code class="text-lg">git pull</code> and a reload, no containers,
              no orchestration. It is gloriously
              <HandDrawnMark placement="under" tone="#fde047">boring</HandDrawnMark>,
              and it hasn't gone down since.
            </p>
          </div>
        </Demo>

        <!-- 3. inline annotation, tightened -->
        <Demo
          n="3"
          title="Inline annotation"
          blurb="Circle the thing that matters. Point at the next thing. The marks actually hug the words now."
        >
          <div class="text-lg leading-9 max-w-prose space-y-7">
            <p>
              When it hangs, <HandDrawnMark tone="#fde047">delete code</HandDrawnMark>
              until it works — no clever fixes.
            </p>
            <p class="flex items-center gap-3 text-zinc-500">
              <HandDrawn name="arrow-bend-down-right" size="2.1rem" class="text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span class="text-base">simple beats complex, working beats perfect</span>
            </p>
          </div>
        </Demo>

        <!-- 4. a real number, circled -->
        <Demo
          n="4"
          title="A number worth circling"
          blurb="A stat reads like it was written, not dashboarded — when only the number that matters gets the pen."
        >
          <p class="text-xl md:text-2xl leading-loose max-w-prose">
            This year the blog crossed
            <HandDrawnMark tone="#fde047">65,820 words</HandDrawnMark>,
            across 103 posts — and counting.
          </p>
        </Demo>

        <!-- 5. numbered steps -->
        <Demo
          n="5"
          title="Numbered steps"
          blurb="Circled numbers as bullets turn a dry ordered list into something that reads like a marked-up page."
        >
          <ol class="space-y-4 max-w-prose list-none pl-0">
            <li v-for="(step, i) in steps" :key="i" class="flex items-start gap-4">
              <HandDrawn :name="`circled-bold-${i + 1}`" size="2.1rem" class="shrink-0 mt-0.5" />
              <span class="text-lg leading-7 pt-1">{{ step }}</span>
            </li>
          </ol>
        </Demo>

        <!-- 6. flow diagram -->
        <Demo
          n="6"
          title="A little flow diagram"
          blurb="Circled numbers and arrows compose into a hand-sketched pipeline — the kind you'd draw on a whiteboard."
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-4 text-sm">
            <template v-for="(node, i) in flow" :key="node">
              <span class="flex items-center gap-2">
                <HandDrawn :name="`circled-bold-${i + 1}`" size="1.9rem" />
                <span class="font-medium">{{ node }}</span>
              </span>
              <HandDrawn v-if="i < flow.length - 1" name="arrow-right" size="1.6rem" class="text-zinc-400" />
            </template>
          </div>
        </Demo>

        <!-- 7. callout frame -->
        <Demo
          n="7"
          title="Hand-drawn callout frames"
          blurb="A traced box around a pull-quote feels handmade in a way a CSS border never will."
        >
          <div class="relative max-w-prose px-8 py-7">
            <HandDrawn name="box-xl" stretch
              class="absolute inset-0 text-zinc-800 dark:text-zinc-200" />
            <p class="relative text-lg italic leading-8">
              “When the system hangs, delete code until it works. Simple beats complex.
              Working beats perfect.”
            </p>
          </div>
        </Demo>

        <!-- 8. hand-drawn unit chart from addressable stipple dots -->
        <Demo
          n="8"
          stacked
          title="Hand-drawn unit charts"
          blurb="Your real notebook stipple dots, duped and rotated into a 10×10 grid. Fill as many as the number says — isotype, by hand."
        >
          <figure>
            <HandDrawnUnitChart :value="1" :total="100" :columns="10" size="0.8rem" tone="#fde047" />
            <figcaption class="mt-6 text-base text-zinc-600 dark:text-zinc-300 max-w-prose leading-7">
              <span class="text-rose-500 font-semibold">One</span> video made last year — out of the
              <span class="font-semibold">100</span> I want to make this year.
              <span class="block text-3xs uppercase tracking-[0.16em] text-zinc-400 mt-3">week note · 2024-01</span>
            </figcaption>
          </figure>
        </Demo>
      </section>

      <!-- ===== ORGANIC USAGE: how they actually weave in ===== -->
      <section class="mb-28">
        <h2 class="text-2xl font-semibold mb-3">Weaving them in</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-12 max-w-prose">
          The point isn't a gallery — it's that they disappear into the writing, the
          UI, and the charts. Three hooks do that: an <code class="text-sm">:hd{}</code>
          directive for prose, automatic upgrades of existing markup (footnotes, dividers),
          and a <code class="text-sm">&lt;HandDrawnAnnotation&gt;</code> for dataviz.
        </p>

        <div class="space-y-24">
          <!-- dataviz annotation over a real chart -->
          <Demo n="A" title="Dataviz annotations"
                blurb="Point, circle, label — anchored to coordinates over any chart (SVG or canvas). The vocabulary of a marked-up printout.">
            <div class="relative inline-block w-full max-w-[560px] text-zinc-800 dark:text-zinc-200">
              <svg :viewBox="`0 0 ${CH.w} ${CH.h}`" class="w-full">
                <line :x1="CH.left" :y1="CH.base" :x2="CH.w - CH.left" :y2="CH.base"
                      stroke="currentColor" stroke-width="1" opacity="0.3" />
                <rect v-for="b in bars" :key="b.i" :x="b.x" :y="b.y" :width="b.bw" :height="b.h"
                      rx="1" fill="currentColor" :opacity="b.i === peak.i ? 0.9 : 0.32" />
              </svg>
              <HandDrawnAnnotation :x="pct(peak.cx, 'x')" :y="pct(peak.y - 40, 'y')" name="arrow-down"
                                   size="2.2rem" class="text-rose-500" />
              <span class="absolute text-xs font-medium text-rose-500 whitespace-nowrap"
                    :style="{ left: pct(peak.cx + 16, 'x'), top: pct(peak.y - 54, 'y') }">all-time high</span>
              <HandDrawnAnnotation :x="pct(note.cx, 'x')" :y="pct(note.cy, 'y')" name="circle-md"
                                   size="2.8rem" class="text-zinc-400 dark:text-zinc-500" />
            </div>
          </Demo>

          <!-- automatic: footnotes + dividers, no new syntax -->
          <Demo n="B" title="Automatic — no new syntax"
                blurb="A client plugin upgrades existing markup inside posts: footnote markers become circled numbers, <hr> becomes a hand-drawn rule. Old posts get it for free.">
            <div class="max-w-prose text-lg leading-9">
              <p>
                Boring infra wins<a class="hd-footnote-ref text-rose-500" href="#"><HandDrawn name="circled-1" size="1.25em" /></a>
                — pm2, a single node process, read-the-logs-and-reload<a class="hd-footnote-ref text-rose-500" href="#"><HandDrawn name="circled-2" size="1.25em" /></a>.
              </p>
              <div class="hd-divider my-8 flex justify-center text-zinc-400 dark:text-zinc-600">
                <HandDrawn name="bead-chain" size="14px" style="width:132px" />
              </div>
              <p class="text-base text-zinc-500">…and the divider above was just a plain <code>---</code>.</p>
            </div>
          </Demo>

          <!-- intentional: the :hd directive -->
          <Demo n="C" title="Intentional — the :hd directive"
                blurb="Drop a specific mark exactly where you want it, right in the markdown. Mirrors your :prediction / ::gear directives.">
            <div class="space-y-5 max-w-prose">
              <pre class="text-xs bg-zinc-100 dark:bg-surface rounded-lg p-4 whitespace-pre-wrap break-words"><code>The deploy is just pm2 reload :hd{name="arrow-right-long"}
then read the logs and move on.</code></pre>
              <p class="text-lg leading-9">
                The deploy is just pm2 reload<HandDrawn name="arrow-right-long" size="1.4rem" class="text-zinc-500 mx-1" />then read the logs and move on.
              </p>
            </div>
          </Demo>
        </div>
      </section>

      <!-- ===== IN THE WILD: realistic scenes ===== -->
      <section class="mb-28">
        <h2 class="text-2xl font-semibold mb-3">In the wild</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-14 max-w-prose">
          Dropped into the kind of UI they'd actually live in. Every number, prediction,
          and changelog entry below is real — pulled straight from the site and the archive.
        </p>

        <div class="grid md:grid-cols-2 gap-x-12 gap-y-20">

          <!-- stat dashboard card: real blog numbers -->
          <div>
            <p class="text-3xs uppercase tracking-[0.16em] text-zinc-400 mb-5">Stats dashboard</p>
            <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-xs">
              <div class="text-3xs uppercase tracking-[0.15em] text-zinc-400 mb-5">blog posts published</div>
              <div class="flex items-center gap-4 mb-2">
                <HandDrawnMark tone="#fde047" class="text-5xl font-semibold tracking-tight">103</HandDrawnMark>
                <HandDrawn name="arrow-up-thick" size="1.7rem" class="text-zinc-400 dark:text-zinc-500" />
              </div>
              <div class="text-sm text-zinc-500">15.6 a year — and climbing</div>
              <hr class="my-5 border-zinc-100 dark:border-zinc-800">
              <div class="text-sm text-zinc-500 leading-6">
                65,820 words published in all.
              </div>
            </div>
          </div>

          <!-- analytics chart with a "what happened" annotation -->
          <div>
            <p class="text-3xs uppercase tracking-[0.16em] text-zinc-400 mb-5">Analytics annotation</p>
            <div class="relative w-full text-zinc-400 dark:text-zinc-500">
              <svg :viewBox="`0 0 ${TR.w} ${TR.h}`" class="w-full">
                <path :d="trendPath.area" fill="currentColor" opacity="0.12" />
                <path :d="trendPath.line" fill="none" stroke="currentColor" stroke-width="2.5"
                      stroke-linejoin="round" stroke-linecap="round" />
              </svg>
              <!-- circle the launch spike; label sits in the headroom above it -->
              <HandDrawnAnnotation :x="trendSpike.x" :y="trendSpike.y" name="circle-md"
                                   size="2.4rem" class="text-rose-500" />
              <span class="absolute -translate-x-1/2 flex flex-col items-center gap-0.5 text-xs
                           font-medium text-rose-500 whitespace-nowrap"
                    :style="{ left: trendSpike.x, top: '0%' }">
                shipped tv-station
                <HandDrawn name="arrow-down" size="1.1rem" />
              </span>
            </div>
          </div>

          <!-- prediction card: circled number as a confidence rating -->
          <div>
            <p class="text-3xs uppercase tracking-[0.16em] text-zinc-400 mb-5">Prediction</p>
            <div class="relative px-9 py-8 w-full max-w-md">
              <HandDrawn name="box-xl" stretch
                class="absolute inset-0 text-zinc-800 dark:text-zinc-200" />
              <div class="relative">
                <div class="text-3xs uppercase tracking-[0.15em] text-zinc-400 mb-3">Prediction · resolves 2026</div>
                <p class="text-lg font-medium leading-7 mb-5">
                  AI-generated code tops 30% of commits in the 50 biggest GitHub repos.
                </p>
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                  <span>confidence</span>
                  <HandDrawn name="circled-bold-7" size="1.7rem" class="text-rose-500" />
                  <span>/ 10</span>
                </div>
              </div>
            </div>
          </div>

          <!-- changelog with circled version markers + inline "X → Y" arrows -->
          <div>
            <p class="text-3xs uppercase tracking-[0.16em] text-zinc-400 mb-5">Changelog</p>
            <ol class="space-y-6 list-none pl-0">
              <li v-for="(r, i) in releases" :key="i" class="flex items-start gap-4">
                <HandDrawn :name="`circled-bold-${i + 1}`" size="1.9rem" class="shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <div class="font-medium leading-tight">{{ r.title }}</div>
                  <div class="text-sm text-zinc-500 mt-1 leading-6">
                    {{ r.from }}
                    <HandDrawn name="arrow-right" size="0.95rem" class="text-zinc-400 mx-1" />
                    {{ r.to }}
                  </div>
                </div>
              </li>
            </ol>
          </div>

        </div>
      </section>

      <!-- ===== STRAIGHT FROM THE ARCHIVE: real lines, marked up ===== -->
      <section class="mb-28">
        <h2 class="text-2xl font-semibold mb-3">Straight from the archive</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-16 max-w-prose">
          Not lorem ipsum — actual lines from real posts and week notes, marked up the way
          you might in the margin. Each one notes where it came from.
        </p>

        <div class="space-y-16">

          <!-- a goal, the number circled and starred in the margin -->
          <figure class="relative max-w-2xl">
            <p class="text-xl md:text-2xl leading-loose">
              Last year I made a grand total of one video. This year I want to make
              <span class="whitespace-nowrap"><HandDrawn name="arrow-up-thick" size="1.4rem" class="text-zinc-400 dark:text-zinc-500 mx-1" /><HandDrawnMark tone="#fde047">100</HandDrawnMark></span>.
            </p>
            <figcaption class="mt-6 text-3xs uppercase tracking-[0.16em] text-zinc-400">week note · 2024-01</figcaption>
          </figure>

          <!-- a wry line, the punchline circled -->
          <figure class="max-w-2xl">
            <p class="text-xl leading-loose">
              Seeing my step count drop below 5,000 for days running is a clear sign I need to
              <HandDrawnMark tone="#fde047">touch grass</HandDrawnMark>.
            </p>
            <figcaption class="mt-5 text-3xs uppercase tracking-[0.16em] text-zinc-400">Personal APIs</figcaption>
          </figure>

          <!-- a single word, underlined -->
          <figure class="max-w-2xl">
            <p class="text-xl leading-loose">
              If you're going to spend half your life in a terminal, it might as well feel like a
              <HandDrawnMark placement="under" tone="#fde047">cyberpunk</HandDrawnMark> movie.
            </p>
            <figcaption class="mt-5 text-3xs uppercase tracking-[0.16em] text-zinc-400">CLI tools</figcaption>
          </figure>

          <!-- footnote markers on a real, number-dense paragraph -->
          <figure class="max-w-2xl">
            <p class="text-xl leading-loose">
              I built a network of 29,915 officer nodes<HandDrawn name="circled-1" size="1.05em" class="mx-0.5 align-baseline" />
              and 159,671 relationships<HandDrawn name="circled-2" size="1.05em" class="mx-0.5 align-baseline" />
              in Neo4j, then let the clusters surface<HandDrawn name="circled-3" size="1.05em" class="mx-0.5 align-baseline" />.
            </p>
            <figcaption class="mt-5 text-3xs uppercase tracking-[0.16em] text-zinc-400">CCRB officer clusters</figcaption>
          </figure>

          <!-- a pull-quote in a traced frame, one word underlined -->
          <figure class="relative max-w-2xl px-10 py-9">
            <HandDrawn name="box-xl" stretch class="absolute inset-0 text-zinc-800 dark:text-zinc-200" />
            <blockquote class="relative text-xl md:text-2xl italic leading-relaxed text-center">
              Instead of avoiding hard work or hard problems, we should make hard work
              <HandDrawnMark placement="under" tone="#fde047">fun</HandDrawnMark>.
            </blockquote>
            <figcaption class="relative mt-6 text-center text-3xs uppercase tracking-[0.16em] text-zinc-400">Joy-Driven Development</figcaption>
          </figure>

          <!-- the key concept, circled -->
          <figure class="max-w-2xl">
            <p class="text-xl leading-loose">
              If you can reliably discover the
              <HandDrawnMark tone="#fde047">magic words</HandDrawnMark>
              you need, you can teach yourself almost anything.
            </p>
            <figcaption class="mt-5 text-3xs uppercase tracking-[0.16em] text-zinc-400">Everyone Should Code</figcaption>
          </figure>

        </div>
      </section>

      <!-- ===== THE COMPLETE KIT: a real example of every asset ===== -->
      <section class="mb-28">
        <h2 class="text-2xl font-semibold mb-3">The complete kit, in use</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-16 max-w-prose">
          Every mark in the set doing a real job — captioned with real numbers, projects,
          and lines from the archive. Repeats are fine; the point is that nothing's left
          sitting in the drawer.
        </p>

        <div class="space-y-20">

          <!-- ARROWS — grouped by the direction they actually point -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Arrows · pointed the way they point</h3>

            <!-- horizontal: A → B -->
            <div class="grid sm:grid-cols-2 gap-x-12 gap-y-5 mb-12">
              <div v-for="a in arrowH" :key="a.name" class="flex items-center gap-2.5 text-sm">
                <span class="text-zinc-500 text-right shrink-0 basis-28">{{ a.a }}</span>
                <HandDrawn :name="a.name" size="1.5rem" class="text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span class="font-medium">{{ a.b }}</span>
              </div>
            </div>

            <!-- vertical: a down arrow resolves top→bottom, an up arrow grows bottom→top -->
            <div class="text-3xs font-medium text-zinc-400 mb-5">downward · resolves to&nbsp;&nbsp;·&nbsp;&nbsp;upward · grew to</div>
            <div class="flex flex-wrap gap-x-9 gap-y-8 mb-12">
              <figure v-for="a in [...arrowDown, ...arrowUp]" :key="a.name" class="flex flex-col items-center text-center">
                <span class="text-sm font-medium leading-5">{{ a.top }}</span>
                <HandDrawn :name="a.name" size="1.7rem" class="text-zinc-700 dark:text-zinc-300 my-1" />
                <span class="text-sm text-zinc-500 leading-5">{{ a.bottom }}</span>
              </figure>
            </div>

            <!-- the non-linear rest, shown as themselves -->
            <div class="text-3xs font-medium text-zinc-400 mb-4">loops, turns &amp; sketchbook studies</div>
            <div class="flex flex-wrap items-end gap-x-8 gap-y-5">
              <figure v-for="name in arrowStudies" :key="name" class="flex flex-col items-center gap-2">
                <span class="flex items-end justify-center h-9"><HandDrawn :name="name" size="1.9rem" class="text-zinc-700 dark:text-zinc-300" /></span>
                <figcaption class="text-3xs font-mono text-zinc-400">{{ name.replace('arrow-', '') }}</figcaption>
              </figure>
            </div>
          </div>

          <!-- NUMERALS — real figures, hand-set digit by digit -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Numerals · real figures, hand-set</h3>
            <div class="space-y-4">
              <div v-for="s in numeralStats" :key="s.digits + s.label" class="flex items-baseline gap-3 flex-wrap">
                <span class="flex items-end text-zinc-800 dark:text-zinc-200">
                  <template v-for="(t, i) in groupDigits(s.digits)" :key="i">
                    <span v-if="t === ','" aria-hidden="true" class="inline-block" style="width:0.34rem"></span>
                    <HandDrawn v-else :name="`${s.thin ? 'num-thin-' : 'num-'}${t}`" size="1.7rem" style="margin:0 0.03em" />
                  </template>
                </span>
                <span class="text-zinc-500 text-sm">{{ s.label }}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-x-7 gap-y-3 pt-5">
              <span v-for="[name, label] in numCompound" :key="name" class="flex items-center gap-2 text-sm text-zinc-500">
                <HandDrawn :name="name" size="1.5rem" class="text-zinc-700 dark:text-zinc-300" /> {{ label }}
              </span>
            </div>
          </div>

          <!-- NUMBER WORDS — real counts, spelled -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Number words · counts, spelled out</h3>
            <div class="grid sm:grid-cols-2 gap-x-10 gap-y-3">
              <div v-for="[name, label] in wordCounts" :key="name" class="flex items-center gap-2.5">
                <HandDrawn :name="name" size="1.4rem" class="text-zinc-800 dark:text-zinc-200 shrink-0" />
                <span class="text-zinc-600 dark:text-zinc-300 text-sm">{{ label }}</span>
              </div>
            </div>
          </div>

          <!-- CIRCLED — real project list + real changelog -->
          <div class="grid md:grid-cols-2 gap-x-12 gap-y-12">
            <div>
              <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Circled · 11 tools shipped</h3>
              <ol class="space-y-2.5 list-none pl-0">
                <li v-for="(p, i) in kitProjects" :key="p" class="flex items-center gap-3">
                  <HandDrawn :name="`circled-${i + 1}`" size="1.5rem" class="shrink-0" />
                  <span class="font-mono text-sm">{{ p }}</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Bold circled · the changelog</h3>
              <ol class="space-y-2.5 list-none pl-0">
                <li v-for="m in kitTimeline" :key="m.n" class="flex items-start gap-3">
                  <HandDrawn :name="`circled-bold-${m.n}`" size="1.5rem" class="shrink-0 mt-0.5" />
                  <span class="text-zinc-600 dark:text-zinc-300 text-sm leading-6">{{ m.t }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- LETTERS — circled grades, boxed pipeline nodes, the alphabet sheet -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Letters · labels, grades, nodes</h3>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-4 mb-7">
              <span v-for="[name, label] in letterGrades" :key="name" class="flex items-center gap-2 text-sm">
                <HandDrawn :name="name" size="1.7rem" class="text-zinc-800 dark:text-zinc-200" />
                <span class="font-mono">{{ label }}</span>
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3 mb-7">
              <template v-for="([name, label], i) in boxedNodes" :key="name">
                <span class="flex items-center gap-2">
                  <HandDrawn :name="name" size="1.9rem" class="text-zinc-800 dark:text-zinc-200" />
                  <span class="text-sm font-medium">{{ label }}</span>
                </span>
                <HandDrawn v-if="i < boxedNodes.length - 1" name="arrow-right" size="1.2rem" class="text-zinc-400" />
              </template>
            </div>
            <div class="flex items-center gap-3 text-sm text-zinc-500">
              <HandDrawn name="alphabet" size="2.2rem" class="text-zinc-700 dark:text-zinc-300" />
              the full set, traced from the notebook
            </div>
          </div>

          <!-- MAGNITUDES & BADGES -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Magnitudes & badges · real orders of magnitude</h3>
            <div class="grid sm:grid-cols-2 gap-x-10 gap-y-4">
              <div v-for="[name, label] in magStats" :key="name" class="flex items-center gap-3 text-sm">
                <HandDrawn :name="name" size="1.7rem" class="text-zinc-800 dark:text-zinc-200 shrink-0" />
                <span class="text-zinc-600 dark:text-zinc-300">{{ label }}</span>
              </div>
            </div>
          </div>

          <!-- FRAMES — a real line in every box; squares as labels -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Frames · a real line in every box</h3>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              <div v-for="[name, quote] in frameQuotes" :key="name"
                   class="relative px-10 py-11 flex items-center justify-center text-center min-h-[7.5rem]">
                <HandDrawn :name="name" stretch class="absolute inset-0 text-zinc-700 dark:text-zinc-300" />
                <span class="relative text-sm italic leading-6">{{ quote }}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-end gap-x-9 gap-y-5">
              <figure v-for="[name, label] in boxSpecimens" :key="name" class="flex flex-col items-center gap-2">
                <span class="flex items-end justify-center h-12">
                  <HandDrawn :name="name" size="2.6rem" class="text-zinc-700 dark:text-zinc-300" />
                </span>
                <figcaption class="text-xs font-mono text-zinc-500">{{ label }}</figcaption>
              </figure>
            </div>
          </div>

          <!-- TEXTURES & MARKS -->
          <div>
            <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Textures & marks · marginalia</h3>

            <!-- stars flag real "starred" lines -->
            <div class="space-y-2 mb-9 max-w-prose">
              <div v-for="[name, label] in starFlags" :key="name" class="flex items-center gap-3 text-sm">
                <HandDrawn :name="name" size="1.2rem" class="text-rose-500 shrink-0" />
                <span class="text-zinc-600 dark:text-zinc-300">{{ label }}</span>
              </div>
            </div>

            <!-- edit marks (! ? —) on a real line -->
            <p class="text-lg leading-9 max-w-prose mb-9">
              We moved the whole site to one node process under pm2<HandDrawn name="mark-question" size="1.1em" class="text-rose-500 mx-0.5 align-baseline" />
              — no containers<HandDrawn name="mark-exclamation" size="1.1em" class="text-rose-500 mx-0.5 align-baseline" />
              <HandDrawn name="mark-dash" size="1.3em" class="text-zinc-400 mx-1" />no orchestration.
            </p>

            <!-- plus/minus diff of a real change -->
            <div class="font-mono text-sm space-y-1.5 mb-9 max-w-prose">
              <div class="flex items-center gap-2.5"><HandDrawn name="plus-minus" size="1.2rem" class="text-zinc-700 dark:text-zinc-300 shrink-0" /> Restart=on-failure → Restart=always</div>
              <div class="flex items-center gap-2.5"><HandDrawn name="plus-minus-2" size="1.2rem" class="text-zinc-700 dark:text-zinc-300 shrink-0" /> Electron bloat → Tauri / Rust</div>
            </div>

            <!-- dot / dot-lg as real bullets -->
            <ul class="space-y-2 mb-9 max-w-prose">
              <li v-for="(req, i) in toolReqs" :key="req" class="flex items-start gap-3 text-sm">
                <HandDrawn :name="i === 0 ? 'dot-lg' : 'dot'" size="0.55rem" class="mt-1 shrink-0 text-zinc-700 dark:text-zinc-300" />
                <span class="text-zinc-600 dark:text-zinc-300">{{ req }}</span>
              </li>
            </ul>

            <!-- ring sizes, smallest to largest -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-500 mb-9">
              <span class="shrink-0">rings, to lasso a stat:</span>
              <HandDrawn name="circle-xs" size="1rem" class="text-zinc-700 dark:text-zinc-300" />
              <HandDrawn name="circle-sm" size="1.4rem" class="text-zinc-700 dark:text-zinc-300" />
              <HandDrawn name="circle-md" size="1.9rem" class="text-zinc-700 dark:text-zinc-300" />
              <HandDrawn name="circle-lg" size="2.6rem" class="text-zinc-700 dark:text-zinc-300" />
            </div>

            <!-- bead-chain divider -->
            <div class="flex justify-center my-9 text-zinc-400">
              <HandDrawn name="bead-chain" size="14px" style="width:160px" />
            </div>

            <!-- fills / clusters + a tiny inline unit chart -->
            <div class="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-zinc-500">
              <span class="flex items-center gap-2"><HandDrawn name="stipple-grid" size="2.2rem" class="text-zinc-700 dark:text-zinc-300" /> stipple field</span>
              <span class="flex items-center gap-2"><HandDrawn name="blob-cluster" size="2.4rem" class="text-zinc-700 dark:text-zinc-300" /> blob cluster</span>
              <span class="flex items-center gap-2"><HandDrawn name="marks-cluster" size="2.2rem" class="text-zinc-700 dark:text-zinc-300" /> marks study</span>
              <span class="flex items-center gap-3"><HandDrawnUnitChart :value="6" :total="10" :columns="10" size="0.6rem" gap="0.32rem" /> 6 of 10 — a confidence</span>
            </div>
          </div>

        </div>
      </section>

      <!-- ===== FULL LIBRARY ===== -->
      <section>
        <h2 class="text-2xl font-semibold mb-2">The library</h2>
        <p class="text-zinc-500 mb-10 text-sm">
          Click any asset to copy its <code>&lt;HandDrawn&gt;</code> tag.
        </p>

        <div v-for="group in groups" :key="group.group" class="mb-16">
          <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            {{ group.label }} <span class="text-zinc-300 dark:text-zinc-600">· {{ group.count }}</span>
          </h3>

          <div v-for="sg in group.subs" :key="sg.sub" class="mb-7">
            <div v-if="group.subs.length > 1" class="text-3xs font-medium text-zinc-400 dark:text-zinc-500 mb-3 pl-1">
              {{ sg.label }}
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              <button
                v-for="a in sg.items"
                :key="a.name"
                :title="a.desc"
                class="gallery-tile group flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors p-3"
                @click="copyTag(a.name)"
              >
                <div class="flex-1 flex items-center justify-center w-full min-h-0">
                  <HandDrawn :name="a.name" size="2.6rem" />
                </div>
                <span class="text-3xs font-mono text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 max-w-full text-center leading-3 break-all">
                  {{ copied === a.name ? 'copied!' : a.name }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, h } from 'vue'
import manifest from '~/assets/hand-drawn/manifest.json'

// tiny inline layout helper for the demo blocks (keeps the template readable).
// `stacked` puts the label above a full-width body — for demos that need room
// (rich marked-up prose, charts) rather than the narrow side-by-side column.
const Demo = (props, { slots }) => {
  const label = h('div', { class: props.stacked ? '' : 'md:text-right' }, [
    h('div', { class: ['flex items-center gap-2 mb-2', props.stacked ? '' : 'md:justify-end'] }, [
      h('span', { class: 'font-mono text-xs text-zinc-300 dark:text-zinc-600' }, props.n),
      h('h2', { class: 'text-lg font-semibold' }, props.title)
    ]),
    h('p', { class: 'text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-prose' }, props.blurb)
  ])
  const body = h('div', { class: 'min-w-0' }, slots.default ? slots.default() : [])
  return props.stacked
    ? h('div', { class: 'space-y-7' }, [label, body])
    : h('div', { class: 'grid md:grid-cols-[200px_1fr] gap-6 md:gap-10' }, [label, body])
}
// typed (not array) so a bare `stacked` attribute coerces to true
Demo.props = { n: String, title: String, blurb: String, stacked: Boolean }

const steps = [
  'Write in Obsidian with YAML frontmatter and tags.',
  'Process with yarn blog:process into structured JSON.',
  'Serve through dynamic routes that consume the JSON.',
  'Push to main — GitHub Actions builds and deploys.'
]

const flow = ['write', 'process', 'serve', 'deploy']

// --- "in the wild" realistic scenes ---
// a little analytics area chart with a launch spike to annotate
const TR = { w: 480, h: 150, pad: 12 }
const trend = [18, 22, 20, 26, 24, 30, 58, 64, 60, 66]
const TREND_SPIKE = 6 // index where tv-station shipped (the launch jump)
// the line only uses the lower ~60% of the box, leaving clear headroom on top
// for the annotation label to live without ever touching the data
const trendXY = (i) => {
  const max = Math.max(...trend)
  const x = TR.pad + (i / (trend.length - 1)) * (TR.w - TR.pad * 2)
  const y = TR.h - TR.pad - (trend[i] / max) * (TR.h * 0.58)
  return { x, y }
}
const trendPath = computed(() => {
  const n = trend.length
  const line = trend.map((v, i) => `${i ? 'L' : 'M'}${trendXY(i).x.toFixed(1)} ${trendXY(i).y.toFixed(1)}`).join(' ')
  const area = `${line} L${trendXY(n - 1).x.toFixed(1)} ${TR.h - TR.pad} L${trendXY(0).x.toFixed(1)} ${TR.h - TR.pad} Z`
  return { line, area }
})
const trendSpike = computed(() => {
  const p = trendXY(TREND_SPIKE)
  return { x: `${((p.x / TR.w) * 100).toFixed(1)}%`, y: `${((p.y / TR.h) * 100).toFixed(1)}%` }
})

// real before→afters pulled from posts & week notes
const releases = [
  { title: 'Photo backup', from: 'Electron + Chrome bloat', to: 'a Tauri / Rust app' },
  { title: 'systemd, the hard way', from: 'Restart=on-failure', to: 'Restart=always' },
  { title: 'Where I post', from: 'Twitter', to: 'Mastodon' },
  { title: 'MCP meta-map', from: '4,096 dimensions', to: '2' }
]

// ===== THE COMPLETE KIT — a real example of every asset (repeating real data is fine) =====

// arrows grouped by the direction they actually point, each on a real move.
// horizontal: A → B
const arrowH = [
  { name: 'arrow-right-thick', a: 'Docker', b: 'pm2' },
  { name: 'arrow-right-long', a: 'Twitter', b: 'Mastodon' },
  { name: 'arrow-right', a: 'Electron', b: 'Tauri' },
  { name: 'arrow-right-thin', a: 'Flickr', b: 'self-host' },
  { name: 'arrow-wavy-right', a: 'cloud', b: 'local-first' },
  { name: 'arrow-squiggle', a: '800 lines', b: '113' },
  { name: 'arrow-diagonal-thick', a: '4,096-D', b: '2-D' }
]
// downward: top resolves down to bottom
const arrowDown = [
  { name: 'arrow-down', top: 'write', bottom: 'ship' },
  { name: 'arrow-down-tall', top: 'deploy', bottom: 'done' },
  { name: 'arrow-down-thin', top: 'commit', bottom: 'push' },
  { name: 'arrow-down-curve', top: 'draft', bottom: 'post' },
  { name: 'arrow-down-curve-2', top: 'idea', bottom: 'tool' },
  { name: 'arrow-down-curve-tall', top: 'photo', bottom: 'backup' },
  { name: 'arrow-down-fork', top: 'one repo', bottom: 'two apps' },
  { name: 'arrow-hook-down', top: 'Watch Later', bottom: 'tv-station' },
  { name: 'arrow-bend-down-right', top: 'it hangs', bottom: 'delete code' }
]
// upward: bottom grew up to top
const arrowUp = [
  { name: 'arrow-up', top: '100', bottom: '1 video' },
  { name: 'arrow-up-thick', top: 'best week', bottom: 'last week' },
  { name: 'arrow-up-thin', top: 'touch grass', bottom: '< 5,000 steps' }
]
// loops, turns, and notebook studies — not simple moves, shown as themselves
const arrowStudies = ['arrow-left', 'arrow-uturn', 'arrow-bend-corner', 'arrow-bend-zigzag', 'arrow-rule-return', 'arrow-compass', 'arrow-study-horizontal', 'arrow-study-vertical', 'arrow-study-rays', 'arrow-study-maze']

// real stats spelled out in the hand-drawn digit glyphs. there's no zero in the set,
// so the figures are real ones that happen to avoid it; together they exercise 1–9 in
// both weights. the compound "10–13" glyphs carry small real counts.
const numeralStats = [
  { digits: '29915', label: 'officer nodes mapped (CCRB)', thin: false },
  { digits: '45923', label: 'words written this year', thin: false },
  { digits: '159671', label: 'relationships in the graph', thin: false },
  { digits: '1189', label: 'GitHub contributions', thin: false },
  { digits: '1554', label: 'screenshots in the atlas', thin: true },
  { digits: '389', label: 'photographs shared', thin: true },
  { digits: '224', label: 'hours of looping runtime', thin: true },
  { digits: '475', label: 'alive videos from Watch Later', thin: true },
  { digits: '6', label: 'active days in the last 52', thin: true }
]
const numCompound = [
  ['num-10', '~10 years posting photos to Flickr'],
  ['num-11', '11 tools shipped, numbered below'],
  ['num-12', 'a 12-entry changelog'],
  ['num-13', 'knives forged since the 13th century'],
  ['num-thin-10', 'a 10-week note streak']
]

// real bulleted list (dot / dot-lg markers) — the backup tool's requirements
const toolReqs = [
  "Rip everything from Cloudinary's API",
  'Handle the rate limits without exploding',
  'Resume incomplete downloads after a hiccup',
  "Work while I'm three spliffs in on a beach"
]

// split a digit string into tokens with hand-drawn thousands commas:
// '29915' -> ['2','9',',','9','1','5']
const groupDigits = (str) => {
  const out = []
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) out.push(',')
    out.push(str[i])
  }
  return out
}

// real counts, spelled — the number-words
const wordCounts = [
  ['word-one', 'video made last year'], ['word-two', 'days in the studio'],
  ['word-three', 'spliffs in, on a beach'], ['word-four', 'rules for the backup tool'],
  ['word-five', 'phases in the design process'], ['word-six', 'songs to polish in Logic'],
  ['word-seven', 'services humming on the VPS'], ['word-eight', 'thousand Pinboard bookmarks'],
  ['word-nine', '-to-five I walked away from'], ['word-ten', 'years of week notes']
]

// real projects → circled numbers 1–11
const kitProjects = ['dockrune', 'exif-printer', 'git-status-dash', 'ascii_webcam', 'Dataproofer', 'smallbot-mcp', 'tv-station', 'scrapbook-cli', 'MorningRadio', 'music-cli', 'NBC Big Board']

// real milestones → bold circled numbers (the set skips 11)
const kitTimeline = [
  { n: 1, t: 'Flickr → Instagram → self-hosted photos' },
  { n: 2, t: 'Twitter → Mastodon' },
  { n: 3, t: '800-line sidenotes → 113-line plugin' },
  { n: 4, t: 'Docker → pm2, one node process' },
  { n: 5, t: 'Electron → Tauri for the backup tool' },
  { n: 6, t: 'CCRB: 29,915-node officer graph' },
  { n: 7, t: '1,554-screenshot embeddings atlas' },
  { n: 8, t: 'tv-station: public-access from Watch Later' },
  { n: 9, t: 'personal APIs → "touch grass" alerts' },
  { n: 10, t: 'the hand-drawn kit, 152 marks' },
  { n: 12, t: '100 videos — the goal for this year' }
]

// letters: circled grades for real tools, boxed letters as pipeline nodes
const letterGrades = [['circled-A', 'Dataproofer'], ['circled-B', 'dockrune'], ['circled-C', 'exif-printer'], ['circled-D', 'git-status-dash'], ['circled-E', 'ascii_webcam']]
const boxedNodes = [['boxed-A', 'write'], ['boxed-B', 'process'], ['boxed-C', 'serve'], ['boxed-D', 'deploy'], ['boxed-E', 'done']]

// magnitudes + badges → real figures at that order of magnitude
const magStats = [
  ['mag-100', '~100 photos on the photo site'], ['mag-1000', '1,189 GitHub contributions'],
  ['mag-10000', '22,380 hours tracked in 14 years'], ['mag-100000', '159,671 graph edges'],
  ['mag-1k', '~1k commits a year'], ['mag-10k', '45,923 words written'],
  ['mag-100k', '1.5M messages in the archive'], ['badge-1k', '1,554 screenshots'],
  ['badge-10k', '65,820 words published'], ['badge-100k', '100k+ runtime seconds']
]

// every frame, around a real line. big frames get quotes; squares get short labels.
// big, wide-ish frames stretch to fit a quote without distorting (their native
// aspect is already landscape-ish). the small / square / odd-ratio boxes don't —
// they're shown below at natural size instead.
const frameQuotes = [
  ['box-xl', 'Make hard work fun.'], ['box-lg', 'You can’t improve what you don’t measure.'],
  ['box-l', 'Simple beats complex. Working beats perfect.'], ['box-m', 'Restart=always everywhere.'],
  ['box-m2', 'Delete code until it works.'], ['box-s', 'Touch grass.'],
  ['rect-wide', 'The world is very changeable.']
]
// squares + the folded box, drawn at their own size (no stretch) so the stroke stays true
const boxSpecimens = [['square-xl', 'pm2'], ['square-lg', 'ship'], ['square-bold', 'fun'], ['box-divided', 'boring'], ['square-stack', 'logs'], ['square-s', '100'], ['square-tiny', '!']]

// the five stars, each flagging a real "starred" line
const starFlags = [['star-6pt', 'shipped tv-station'], ['star-6pt-2', '100 videos goal'], ['star-5pt', 'best week this month'], ['star-4pt', 'all-time high'], ['star-4pt-2', 'note to future me']]

// little bar chart for the dataviz-annotation demo
const CH = { w: 560, h: 220, base: 190, top: 30, left: 28 }
const chartData = [3, 5, 4, 8, 6, 9, 5, 7]
const bars = computed(() => {
  const max = Math.max(...chartData)
  const slot = (CH.w - CH.left * 2) / chartData.length
  const bw = slot * 0.62
  return chartData.map((v, i) => {
    const h = (v / max) * (CH.base - CH.top)
    const x = CH.left + i * slot + (slot - bw) / 2
    return { i, v, x, bw, h, y: CH.base - h, cx: x + bw / 2 }
  })
})
// annotations position in % so they track the responsively-scaled chart SVG
const pct = (v, axis) => `${(v / (axis === 'x' ? CH.w : CH.h)) * 100}%`
const peak = computed(() => bars.value.reduce((a, b) => (b.v > a.v ? b : a), bars.value[0]))
const note = computed(() => {
  const b = bars.value[3] // the bar we circle
  return { cx: b.cx, cy: (b.y + CH.base) / 2 }
})

// taxonomy: group -> ordered subgroups. Anything unlisted falls to the end.
const groupLabels = {
  arrows: 'Arrows',
  circled: 'Circled numbers',
  numbers: 'Numerals',
  magnitudes: 'Magnitudes & badges',
  boxes: 'Boxes & frames',
  circles: 'Circles & dots',
  letters: 'Letters',
  words: 'Number words',
  textures: 'Textures & marks'
}
const subLabels = {
  straight: 'Straight', curved: 'Curved', bent: 'Bent', special: 'Special', study: 'Studies',
  display: 'Display', script: 'Script', teens: 'Teens',
  thin: 'Thin', bold: 'Bold',
  text: 'Written', badge: 'Badges',
  rect: 'Rectangles', square: 'Squares',
  ring: 'Rings', dot: 'Dots',
  set: 'Alphabet', circled: 'Circled', boxed: 'Boxed',
  cardinal: 'One–Ten',
  star: 'Stars', fill: 'Fills', divider: 'Dividers', marks: 'Marks'
}
// display order is the key order of groupLabels — one source of truth
const order = Object.keys(groupLabels)
const groups = computed(() =>
  order
    .map((g) => {
      const items = manifest.filter((a) => a.group === g)
      const subKeys = [...new Set(items.map((a) => a.sub))]
      const subs = subKeys.map((s) => ({
        sub: s,
        label: subLabels[s] || s,
        items: items.filter((a) => a.sub === s)
      }))
      return { group: g, label: groupLabels[g] || g, count: items.length, subs }
    })
    .filter((g) => g.count)
)

const copied = ref('')
function copyTag(name) {
  const tag = `<HandDrawn name="${name}" />`
  if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(tag)
  copied.value = name
  setTimeout(() => { if (copied.value === name) copied.value = '' }, 1200)
}

useHead({
  title: 'Hand-drawn asset kit',
  // download the sprite during HTML parse (before JS runs) so the marks have
  // their geometry by the time they hydrate — no blank-then-pop on load
  link: [{ rel: 'preload', as: 'fetch', href: '/hand-drawn/sprite.svg' }]
})
</script>

<style scoped>
/* little life on hover — gallery tiles get a hand-jitter */
.gallery-tile :deep(.hand-drawn) { transition: transform 0.18s ease; }
.gallery-tile:hover :deep(.hand-drawn) { transform: rotate(-3deg) scale(1.08); }
</style>
