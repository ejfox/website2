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

      <!-- ===== FULL LIBRARY ===== -->
      <section>
        <h2 class="text-2xl font-semibold mb-2">The library</h2>
        <p class="text-zinc-500 mb-10 text-sm">
          Click any asset to copy its <code>&lt;HandDrawn&gt;</code> tag.
        </p>

        <div v-for="group in groups" :key="group.cat" class="mb-14">
          <h3 class="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            {{ group.label }} <span class="text-zinc-300 dark:text-zinc-600">· {{ group.items.length }}</span>
          </h3>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <button
              v-for="a in group.items"
              :key="a.name"
              class="group flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors p-3"
              @click="copyTag(a.name)"
            >
              <div class="flex-1 flex items-center justify-center w-full">
                <HandDrawn :name="a.name" size="2.6rem" />
              </div>
              <span class="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 truncate max-w-full">
                {{ copied === a.name ? 'copied!' : a.name }}
              </span>
            </button>
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

const catLabels = {
  arrow: 'Arrows',
  circled: 'Circled numbers',
  number: 'Numerals & badges',
  box: 'Boxes & frames',
  shape: 'Circles',
  word: 'Number words',
  letter: 'Letters',
  texture: 'Textures'
}
const order = ['arrow', 'circled', 'number', 'box', 'shape', 'word', 'letter', 'texture']
const groups = computed(() =>
  order
    .map((cat) => ({ cat, label: catLabels[cat] || cat, items: manifest.filter((a) => a.cat === cat) }))
    .filter((g) => g.items.length)
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
