<template>
  <div class="hd-page min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
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
        <p class="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
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
          <p v-inview class="hd-anim text-lg leading-loose max-w-prose">
            Delete-driven development is the house style<HandDrawn name="circled-1" size="1.05em" class="mx-0.5 align-baseline" />
            and the sidenotes plugin is only 113 lines<HandDrawn name="circled-2" size="1.05em" class="mx-0.5" />
            because complexity is the enemy<HandDrawn name="circled-3" size="1.05em" class="mx-0.5" />.
          </p>
        </Demo>

        <!-- 2. THE MONEY SHOT — a marked-up draft -->
        <Demo
          n="2"
          title="A marked-up draft"
          blurb="The whole vocabulary at once — circle a word, underline a phrase, point from the margin, star a line. The page someone red-penned."
        >
          <div v-inview class="hd-anim relative max-w-prose text-lg leading-loose pl-10 pr-12">
            <!-- margin marks -->
            <HandDrawn name="star-5pt" size="1.3rem" class="absolute left-0 top-1 text-amber-500" />
            <HandDrawnAnnotation x="-0.2rem" y="5.4rem" name="arrow-right" size="1.9rem"
                                 anchor="tip" class="text-rose-500" :rotate="8" />
            <HandDrawn name="marks-cluster" size="2.6rem" class="absolute right-0 top-10 text-zinc-400" />
            <p>
              We retired Docker and moved the whole site to
              <HandDrawnMark name="circle-md" tone="#f43f5e">one node process</HandDrawnMark>
              under pm2. The deploy is a <code class="text-base">git pull</code> and a reload —
              <HandDrawnMark placement="under" name="scribble" tone="#3b82f6">no containers, no orchestration.</HandDrawnMark>
              It is gloriously boring, and it has not gone down since.
            </p>
          </div>
        </Demo>

        <!-- 3. inline annotation, tightened -->
        <Demo
          n="3"
          title="Inline annotation"
          blurb="Circle the thing that matters. Point at the next thing. The marks actually hug the words now."
        >
          <div v-inview class="hd-anim text-lg leading-loose max-w-prose space-y-7">
            <p>
              When it hangs, <HandDrawnMark name="circle-md" tone="#f43f5e">delete code</HandDrawnMark>
              until it works — no clever fixes.
            </p>
            <p class="flex items-center gap-3 text-zinc-500">
              <HandDrawn name="arrow-bend-down-right" size="2.1rem" class="text-rose-500 shrink-0" />
              <span class="text-base">simple beats complex, working beats perfect</span>
            </p>
          </div>
        </Demo>

        <!-- 4. inline stats in a sentence -->
        <Demo
          n="4"
          title="Stats, woven into a sentence"
          blurb="Magnitude badges read inline like words. A stat line that feels written, not dashboarded."
        >
          <p v-inview class="hd-anim text-xl md:text-2xl leading-loose max-w-prose">
            This week I shipped <HandDrawn name="badge-1k" size="2em" :style="badgeStyle" /> commits,
            logged <HandDrawn name="badge-10k" size="2em" :style="badgeStyle" /> plays,
            and wrote <HandDrawn name="badge-100k" size="2em" :style="badgeStyle" /> words.
          </p>
        </Demo>

        <!-- 5. numbered steps -->
        <Demo
          n="5"
          title="Numbered steps"
          blurb="Circled numbers as bullets turn a dry ordered list into something that reads like a marked-up page."
        >
          <ol v-inview class="hd-anim space-y-4 max-w-prose list-none pl-0">
            <li v-for="(step, i) in steps" :key="i" class="flex items-start gap-4">
              <HandDrawn :name="`circled-bold-${i + 1}`" size="2.1rem" class="shrink-0 mt-0.5" />
              <span class="text-lg leading-snug pt-1">{{ step }}</span>
            </li>
          </ol>
        </Demo>

        <!-- 6. flow diagram -->
        <Demo
          n="6"
          title="A little flow diagram"
          blurb="Circled numbers and arrows compose into a hand-sketched pipeline — the kind you'd draw on a whiteboard."
        >
          <div v-inview class="hd-anim flex flex-wrap items-center gap-x-3 gap-y-4 text-sm">
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
          <div v-inview class="hd-anim relative max-w-prose px-8 py-7">
            <HandDrawn name="box-xl" :stretch="true"
              class="absolute inset-0 w-full h-full text-zinc-800 dark:text-zinc-200" />
            <p class="relative text-lg italic leading-relaxed">
              “When the system hangs, delete code until it works. Simple beats complex.
              Working beats perfect.”
            </p>
          </div>
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
              <HandDrawnAnnotation :x="pct(peak.cx + 6, 'x')" :y="pct(peak.y - 46, 'y')" name="arrow-down"
                                   size="2.4rem" label="all-time high" label-side="right" class="text-rose-500" />
              <HandDrawnAnnotation :x="pct(note.cx, 'x')" :y="pct(note.cy, 'y')" name="circle-md"
                                   size="2.8rem" class="text-amber-500" />
              <HandDrawnAnnotation :x="pct(CH.left, 'x')" :y="pct(CH.base + 20, 'y')" name="badge-1k"
                                   size="2rem" anchor="tip" class="text-zinc-400" />
            </div>
          </Demo>

          <!-- automatic: footnotes + dividers, no new syntax -->
          <Demo n="B" title="Automatic — no new syntax"
                blurb="A client plugin upgrades existing markup inside posts: footnote markers become circled numbers, <hr> becomes a hand-drawn rule. Old posts get it for free.">
            <div class="max-w-prose text-lg leading-loose">
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
              <pre class="text-xs bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 whitespace-pre-wrap break-words"><code>The deploy is just pm2 reload :hd{name="arrow-right-long"}
then read the logs and move on.</code></pre>
              <p class="text-lg leading-loose">
                The deploy is just pm2 reload<HandDrawn name="arrow-right-long" size="1.4rem" class="text-zinc-500 mx-1.5" />then read the logs and move on.
              </p>
            </div>
          </Demo>
        </div>
      </section>

      <!-- ===== IN THE WILD: realistic scenes ===== -->
      <section class="mb-28">
        <h2 class="text-2xl font-semibold mb-3">In the wild</h2>
        <p class="text-zinc-500 dark:text-zinc-400 mb-14 max-w-prose">
          Dropped into the kind of UI and writing they'd actually live in.
        </p>

        <div class="grid md:grid-cols-2 gap-x-12 gap-y-20">

          <!-- stat dashboard card -->
          <div>
            <p class="text-[11px] uppercase tracking-[0.16em] text-zinc-400 mb-5">Stats dashboard</p>
            <div v-inview class="hd-anim rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-xs">
              <div class="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-5">commits this week</div>
              <div class="flex items-center gap-4 mb-2">
                <HandDrawnMark name="circle-md" tone="#f43f5e" class="text-5xl font-semibold tracking-tight">128</HandDrawnMark>
                <HandDrawn name="arrow-up-thick" size="1.7rem" class="text-emerald-500" />
              </div>
              <div class="text-sm text-zinc-500">up 22% — best week this month</div>
              <hr class="my-5 border-zinc-100 dark:border-zinc-800">
              <div class="text-sm text-zinc-500 leading-relaxed">
                <HandDrawn name="badge-1k" size="1.7em" :style="badgeStyle" /> commits all-time,
                across <HandDrawn name="num-7" size="1.4em" class="align-baseline mx-0.5" /> languages.
              </div>
            </div>
          </div>

          <!-- analytics chart with a "what happened" annotation -->
          <div>
            <p class="text-[11px] uppercase tracking-[0.16em] text-zinc-400 mb-5">Analytics annotation</p>
            <div v-inview class="hd-anim relative w-full text-emerald-600/70 dark:text-emerald-400/60">
              <svg :viewBox="`0 0 ${TR.w} ${TR.h}`" class="w-full">
                <path :d="trendPath.area" fill="currentColor" opacity="0.12" />
                <path :d="trendPath.line" fill="none" stroke="currentColor" stroke-width="2.5"
                      stroke-linejoin="round" stroke-linecap="round" />
              </svg>
              <HandDrawnAnnotation x="66%" y="20%" name="circle-md" size="2.8rem" class="text-rose-500" />
              <span class="absolute flex items-center gap-1.5 text-xs font-medium text-rose-500 whitespace-nowrap"
                    style="left: 70%; top: 2%">
                shipped v2 <HandDrawn name="arrow-down" size="1.2rem" />
              </span>
            </div>
          </div>

          <!-- prediction card: circled number as a confidence rating -->
          <div>
            <p class="text-[11px] uppercase tracking-[0.16em] text-zinc-400 mb-5">Prediction</p>
            <div v-inview class="hd-anim relative px-8 py-7 w-full max-w-md">
              <HandDrawn name="box-l" :stretch="true"
                class="absolute inset-0 w-full h-full text-zinc-800 dark:text-zinc-200" />
              <div class="relative">
                <div class="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-3">Prediction · resolves 2028</div>
                <p class="text-lg font-medium leading-snug mb-5">
                  Local-first apps overtake cloud-first for indie devs.
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
            <p class="text-[11px] uppercase tracking-[0.16em] text-zinc-400 mb-5">Changelog</p>
            <ol v-inview class="hd-anim space-y-6 list-none pl-0">
              <li v-for="(r, i) in releases" :key="i" class="flex items-start gap-4">
                <HandDrawn :name="`circled-bold-${i + 1}`" size="1.9rem" class="shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <div class="font-medium leading-tight">{{ r.title }}</div>
                  <div class="text-sm text-zinc-500 mt-1 leading-snug">
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
            <div v-if="group.subs.length > 1" class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mb-3 pl-1">
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
                <span class="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 max-w-full text-center leading-tight break-all">
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

// tiny inline layout helper for the demo blocks (keeps the template readable)
const Demo = (props, { slots }) =>
  h('div', { class: 'grid md:grid-cols-[200px_1fr] gap-6 md:gap-10' }, [
    h('div', { class: 'md:text-right' }, [
      h('div', { class: 'flex md:justify-end items-center gap-2 mb-2' }, [
        h('span', { class: 'font-mono text-xs text-zinc-300 dark:text-zinc-600' }, props.n),
        h('h2', { class: 'text-lg font-semibold' }, props.title)
      ]),
      h('p', { class: 'text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed' }, props.blurb)
    ]),
    h('div', { class: 'min-w-0' }, slots.default ? slots.default() : [])
  ])
Demo.props = ['n', 'title', 'blurb']

const steps = [
  'Write in Obsidian with YAML frontmatter and tags.',
  'Process with yarn blog:process into structured JSON.',
  'Serve through dynamic routes that consume the JSON.',
  'Push to main — GitHub Actions builds and deploys.'
]

const stats = [
  { asset: 'badge-1k', label: 'commits' },
  { asset: 'badge-10k', label: 'plays' },
  { asset: 'badge-100k', label: 'words' },
  { asset: 'num-7', label: 'languages' }
]

const flow = ['write', 'process', 'serve', 'deploy']

// big inline badges sit high on the line by default — drop them onto the baseline
const badgeStyle = { verticalAlign: '-0.72em', margin: '0 0.15em' }

// --- "in the wild" realistic scenes ---
// a little analytics area chart with a launch spike to annotate
const TR = { w: 480, h: 150, pad: 12 }
const trend = [18, 22, 20, 26, 24, 30, 58, 64, 60, 66]
const trendPath = computed(() => {
  const max = Math.max(...trend)
  const n = trend.length
  const xs = (i) => TR.pad + (i / (n - 1)) * (TR.w - TR.pad * 2)
  const ys = (v) => TR.h - TR.pad - (v / max) * (TR.h - TR.pad * 2.2)
  const line = trend.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ')
  const area = `${line} L${xs(n - 1).toFixed(1)} ${TR.h - TR.pad} L${xs(0).toFixed(1)} ${TR.h - TR.pad} Z`
  return { line, area }
})

const releases = [
  { title: 'Sidenotes, rewritten', from: 'an 800-line system', to: 'a 113-line client plugin' },
  { title: 'Docker → pm2', from: 'containers + orchestration', to: 'one boring node process' },
  { title: 'Hand-drawn kit', from: 'a flat SVG sheet', to: '140 inline components' }
]

// draw marks in when they scroll into view (stamp + slight settle, staggered).
// Failsafe: never leave a block hidden — if the observer misses it (fast scroll
// past, or it loaded above the fold), reveal it anyway after a beat.
const vInview = {
  mounted(el) {
    const reveal = () => el.classList.add('is-inview')
    if (typeof IntersectionObserver === 'undefined') { reveal(); return }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { reveal(); io.unobserve(el) }
      }),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    )
    io.observe(el)
    el._hdFailsafe = setTimeout(reveal, 1100)
  },
  unmounted(el) {
    if (el._hdFailsafe) clearTimeout(el._hdFailsafe)
  }
}

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
  const b = bars.value[3] // circle this one
  return { cx: b.cx, cy: (b.y + CH.base) / 2, size: `${Math.round(b.bw + 26)}px` }
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
const order = ['arrows', 'circled', 'numbers', 'magnitudes', 'boxes', 'circles', 'letters', 'words', 'textures']
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

useHead({ title: 'Hand-drawn asset kit' })
</script>

<style scoped>
/* marks "draw" themselves in when their block scrolls into view */
.hd-anim :deep(.hand-drawn) {
  opacity: 0;
  transform: translateY(3px) scale(0.84) rotate(-5deg);
}
@media (prefers-reduced-motion: reduce) {
  .hd-anim :deep(.hand-drawn) { opacity: 1; transform: none; }
}
.hd-anim.is-inview :deep(.hand-drawn) {
  animation: hd-stamp 0.5s cubic-bezier(0.18, 0.7, 0.2, 1.2) forwards;
}
/* gentle stagger so a row of marks lands one-after-another */
.hd-anim.is-inview :deep(.hand-drawn:nth-child(1)) { animation-delay: 0.02s; }
.hd-anim.is-inview :deep(.hand-drawn:nth-child(2)) { animation-delay: 0.09s; }
.hd-anim.is-inview :deep(.hand-drawn:nth-child(3)) { animation-delay: 0.16s; }
.hd-anim.is-inview :deep(.hand-drawn:nth-child(4)) { animation-delay: 0.23s; }
.hd-anim.is-inview :deep(.hand-drawn:nth-child(n + 5)) { animation-delay: 0.3s; }
@keyframes hd-stamp {
  60% { opacity: 1; transform: translateY(0) scale(1.04) rotate(1deg); }
  100% { opacity: 1; transform: none; }
}

/* little life on hover — gallery tiles get a hand-jitter (scoped here so the
   transition never fights the stamp-in animation on the demo marks) */
.gallery-tile :deep(.hand-drawn) { transition: transform 0.18s ease; }
.gallery-tile:hover :deep(.hand-drawn) { transform: rotate(-3deg) scale(1.08); }
</style>
