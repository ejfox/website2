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
          <p class="text-lg leading-loose max-w-prose">
            Delete-driven development is the house style<HandDrawn name="circled-1" size="1.05em" class="mx-0.5 align-baseline" />
            and the sidenotes plugin is only 113 lines<HandDrawn name="circled-2" size="1.05em" class="mx-0.5" />
            because complexity is the enemy<HandDrawn name="circled-3" size="1.05em" class="mx-0.5" />.
          </p>
        </Demo>

        <!-- 2. numbered steps -->
        <Demo
          n="2"
          title="Numbered steps & ordered lists"
          blurb="Circled numbers as list bullets turn a dry ordered list into something that reads like a marked-up page."
        >
          <ol class="space-y-4 max-w-prose list-none pl-0">
            <li v-for="(step, i) in steps" :key="i" class="flex items-start gap-4">
              <HandDrawn :name="`circled-bold-${i + 1}`" size="2.1rem" class="shrink-0 mt-0.5" />
              <span class="text-lg leading-snug pt-1">{{ step }}</span>
            </li>
          </ol>
        </Demo>

        <!-- 3. stat badges -->
        <Demo
          n="3"
          title="Stat dashboard accents"
          blurb="The magnitude badges and display numerals were practically built for the stats pages."
        >
          <div class="flex flex-wrap gap-x-12 gap-y-8">
            <div v-for="s in stats" :key="s.label" class="flex flex-col items-center gap-2">
              <HandDrawn :name="s.asset" size="4.5rem" />
              <span class="text-xs uppercase tracking-wider text-zinc-400">{{ s.label }}</span>
            </div>
          </div>
        </Demo>

        <!-- 4. inline annotation -->
        <Demo
          n="4"
          title="Inline annotation"
          blurb="Point at things. Circle the thing that matters. The vocabulary of a marked-up draft, in the browser."
        >
          <div class="text-lg leading-loose max-w-prose space-y-6">
            <p>
              The deploy is just
              <span class="relative inline-block font-medium">
                pm2 reload
                <HandDrawn name="circle-md" size="2.4em"
                  class="absolute -left-3 -top-2 text-rose-500/80 pointer-events-none" />
              </span>
              — no containers, no orchestration.
            </p>
            <p class="flex items-center gap-3">
              <HandDrawn name="arrow-bend-down-right" size="2.2rem" class="text-zinc-400" />
              <span class="text-base text-zinc-500">read the logs, reload it, move on</span>
            </p>
          </div>
        </Demo>

        <!-- 5. callout frame -->
        <Demo
          n="5"
          title="Hand-drawn callout frames"
          blurb="A traced box around a pull-quote or note feels handmade in a way a CSS border never will."
        >
          <div class="relative max-w-prose px-8 py-7">
            <HandDrawn name="box-xl" size="100%" :stretch="true"
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
              <pre class="text-xs bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto"><code>The deploy is just pm2 reload :hd{name="arrow-bend-down-right"}
read the logs, reload it, move on.</code></pre>
              <p class="text-lg leading-loose flex items-center flex-wrap gap-x-1">
                <span>The deploy is just pm2 reload</span>
                <HandDrawn name="arrow-bend-down-right" size="2rem" class="text-zinc-500" />
                <span>read the logs, reload it, move on.</span>
              </p>
            </div>
          </Demo>
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
                class="group flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors p-3"
                @click="copyTag(a.name)"
              >
                <div class="flex-1 flex items-center justify-center w-full min-h-0">
                  <HandDrawn :name="a.name" size="2.6rem" />
                </div>
                <span class="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 truncate max-w-full">
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
