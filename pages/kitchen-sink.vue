<script setup>
// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Sink — a private, in-house Storybook. A single-column list of every
// reusable component on the left; a persistent preview pane on the right that
// renders the hovered (or pinned) component live with mock props.
//
// Curated mock props live in utils/kitchenSinkStories.js. Components without a
// story still list — they just show metadata, not a live render.
//
// Hidden the same way /ff is: layout:false, ssr:false, noindex three ways
// (meta below + X-Robots-Tag in nuxt.config routeRules), never in nav/sitemap.
// "Hidden" not "private" — anyone with the link can view it. It's a dev tool.
// ─────────────────────────────────────────────────────────────────────────────
import { computed, ref, shallowRef, watch } from 'vue'
import { storiesFor, stories } from '~/utils/kitchenSinkStories'

definePageMeta({ layout: false })
useHead({
  title: 'Kitchen Sink · Components',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// Lazy importers for every component, plus matching lazy ?raw source loaders.
// Keys look like '../components/ui/AnimatedNumber.vue'.
const compModules = import.meta.glob('../components/**/*.vue')
const rawModules = import.meta.glob('../components/**/*.vue', {
  query: '?raw',
  import: 'default',
})

// ── Nuxt's canonical component-name algorithm ────────────────────────────────
// Split every path segment into words (camelCase + separators), drop CONSECUTIVE
// duplicate words, PascalCase-join. Matches .nuxt/components.d.ts exactly:
//   ui/AnimatedNumber → UiAnimatedNumber, gear/GearItem → GearItem,
//   widgets/PullQuote → WidgetsPullQuote, blog/post/PostFooter → BlogPostFooter.
function splitByCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean)
}
function canonicalName(relPath) {
  const clean = relPath.replace(/\.(client|server)\.vue$/, '').replace(/\.vue$/, '')
  const words = clean.split('/').flatMap(splitByCase)
  const deduped = []
  for (const w of words) {
    if (!deduped.length || deduped[deduped.length - 1].toLowerCase() !== w.toLowerCase()) {
      deduped.push(w)
    }
  }
  return deduped.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
}

// ── Build the component catalog ──────────────────────────────────────────────
const entries = Object.keys(compModules)
  .map((key) => ({ key, relPath: key.replace('../components/', '') }))
  .filter((e) => !e.relPath.startsWith('dev/')) // hide our own StoryRenderer helper
  .map(({ key, relPath }) => {
    const file = relPath.split('/').pop()
    const baseName = file.replace(/\.(client|server)\.vue$/, '').replace(/\.vue$/, '')
    const segs = relPath.split('/')
    const folder = segs.length > 1 ? segs[0] : 'root'
    return {
      key,
      relPath,
      baseName,
      folder,
      isClient: /\.client\.vue$/.test(file),
      isServer: /\.server\.vue$/.test(file),
      name: canonicalName(relPath),
      loader: compModules[key],
      rawLoader: rawModules[key],
      stories: storiesFor(baseName),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const folders = computed(() => {
  const counts = {}
  for (const e of entries) counts[e.folder] = (counts[e.folder] || 0) + 1
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

// ── Coverage / drift guard ───────────────────────────────────────────────────
// Catches the two ways this tool rots over time: a new component lands without a
// story, or a component gets renamed/removed and leaves an orphaned story key.
// Surfaced in the header (missing count) and, in dev, as a one-time console warn.
const missingStory = computed(() => entries.filter((e) => !e.stories))
const orphanedKeys = (() => {
  const baseNames = new Set(entries.map((e) => e.baseName))
  return Object.keys(stories).filter((k) => !baseNames.has(k))
})()
if (import.meta.dev) {
  if (missingStory.value.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[kitchen-sink] ${missingStory.value.length} component(s) missing a story:`,
      missingStory.value.map((e) => e.name)
    )
  }
  if (orphanedKeys.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[kitchen-sink] orphaned story key(s) — no matching component (renamed/removed?):',
      orphanedKeys
    )
  }
}

// ── Filters ──────────────────────────────────────────────────────────────────
const search = ref('')
const activeFolder = ref(null)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return entries.filter((e) => {
    if (activeFolder.value && e.folder !== activeFolder.value) return false
    if (q && !e.name.toLowerCase().includes(q) && !e.relPath.toLowerCase().includes(q)) return false
    return true
  })
})

// The visible list grouped by folder, for the sectioned sidebar. Groups are
// ordered by size (matching the folder chips), items stay name-sorted.
const groupedVisible = computed(() => {
  const groups = new Map()
  for (const e of visible.value) {
    if (!groups.has(e.folder)) groups.set(e.folder, [])
    groups.get(e.folder).push(e)
  }
  return [...groups.entries()]
    .map(([folder, items]) => ({ folder, items }))
    .sort((a, b) => b.items.length - a.items.length || a.folder.localeCompare(b.folder))
})

// ── Preview pane (hover to preview, click to pin) ────────────────────────────
const hovered = shallowRef(null)
const pinned = shallowRef(null)
const active = computed(() => pinned.value || hovered.value)
const activeVariant = ref(0)
const activeSource = ref('')
const sourceOpen = ref(false)

// On the first activation (e.g. from a ?c= deep link) honor the URL's variant;
// every later component switch starts at variant 0.
let pendingVariant = null
watch(active, async (entry) => {
  activeVariant.value = pendingVariant ?? 0
  pendingVariant = null
  sourceOpen.value = false
  activeSource.value = ''
  if (!entry) return
  try {
    activeSource.value = await entry.rawLoader()
  } catch {
    activeSource.value = '// source unavailable'
  }
})

const activeStory = computed(() => {
  const e = active.value
  if (!e?.stories) return null
  return e.stories[activeVariant.value] || e.stories[0]
})

function pin(entry) {
  pinned.value = pinned.value?.key === entry.key ? null : entry
}
const copied = ref('')
function copy(text, tag) {
  navigator.clipboard?.writeText(text)
  copied.value = tag
  setTimeout(() => (copied.value = ''), 1200)
}

// ── URL deep-link + focus mode (HMR-friendly) ────────────────────────────────
// /kitchen-sink?c=GearItem&v=1&focus=1 pins that component + variant and (focus)
// hides the list. Because the selection lives in the URL, a Vite HMR full reload
// drops you right back on the component you're iterating on.
const route = useRoute()
const router = useRouter()
const focusMode = ref(false)
const galleryMode = ref(false) // contact-sheet grid for QA sweeps
const reloadKey = ref(0) // bump to force-remount the preview

// Match the canonical display name (e.g. PhotosPhotoStack) OR the bare base name
// (PhotoStack), case-insensitively — so a hand-typed ?c=photostack still lands.
// syncUrl writes the canonical name, which is unique, so shared links round-trip.
const entryByName = (name) => {
  if (!name) return null
  const lower = String(name).toLowerCase()
  return (
    entries.find((e) => e.name.toLowerCase() === lower) ||
    entries.find((e) => e.baseName.toLowerCase() === lower) ||
    null
  )
}

// hydrate selection from the URL once, before the watchers below are wired
{
  const q = route.query
  const cName = Array.isArray(q.c) ? q.c[0] : q.c
  if (cName) {
    const e = entryByName(cName)
    if (e) {
      pinned.value = e
      const vi = parseInt(Array.isArray(q.v) ? q.v[0] : q.v, 10)
      if (!Number.isNaN(vi)) pendingVariant = vi
    }
  }
  focusMode.value = q.focus === '1'
  galleryMode.value = q.gallery === '1'
}

function syncUrl() {
  const query = {}
  if (pinned.value) query.c = pinned.value.name
  if (pinned.value && activeVariant.value > 0) query.v = String(activeVariant.value)
  if (focusMode.value) query.focus = '1'
  if (galleryMode.value) query.gallery = '1'
  router.replace({ query })
}
watch([pinned, activeVariant, focusMode, galleryMode], syncUrl)

const reloadPreview = () => reloadKey.value++
function copyLink() {
  if (typeof window !== 'undefined') copy(window.location.href, 'link')
}
// Step through the currently-filtered list while focused (‹ ›).
function focusStep(dir) {
  const list = visible.value
  if (!list.length) return
  const i = pinned.value ? list.findIndex((e) => e.key === pinned.value.key) : -1
  pinned.value = list[(i + dir + list.length) % list.length]
}
</script>

<template>
  <!-- Brutalist/utilitarian: hairline rules, monospace, text-links, no chrome. -->
  <div
    class="ks h-screen flex flex-col bg-sunken text-zinc-900 dark:text-zinc-200 font-mono"
  >
    <!-- Masthead -->
    <header class="shrink-0 border-b border-zinc-300 dark:border-zinc-700 px-3 py-2">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 class="text-xs font-bold uppercase tracking-widest">Kitchen Sink</h1>
        <span class="text-2xs text-zinc-500">
          {{ visible.length }}<template v-if="visible.length !== entries.length">/{{ entries.length }}</template>
          components<template v-if="missingStory.length"> · {{ missingStory.length }} without a story</template>
        </span>
        <input
          v-model="search"
          type="search"
          placeholder="filter…"
          class="ml-auto w-full sm:w-48 bg-transparent border-b border-zinc-300 dark:border-zinc-700 px-0 py-0.5 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
        />
      </div>
      <!-- folder filter: plain inline text links -->
      <div class="mt-1 text-2xs text-zinc-500 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <button class="lnk" :class="{ on: !activeFolder }" @click="activeFolder = null">all</button>
        <button
          v-for="f in folders"
          :key="f.name"
          class="lnk"
          :class="{ on: activeFolder === f.name }"
          @click="activeFolder = f.name"
        >
          {{ f.name }}<span class="text-zinc-400 dark:text-zinc-600"> {{ f.count }}</span>
        </button>
        <span class="flex-1" />
        <button class="lnk" :class="{ on: galleryMode }" @click="galleryMode = !galleryMode">gallery</button>
      </div>
    </header>

    <!-- Gallery / contact-sheet mode (QA sweep) -->
    <div v-if="galleryMode" class="flex-1 overflow-y-auto p-2">
      <div class="grid gap-px bg-zinc-200 dark:bg-raised grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DevGalleryCell v-for="entry in visible" :key="entry.key" :entry="entry" />
      </div>
    </div>

    <!-- Body: list column + persistent preview pane -->
    <div v-else class="flex flex-1 min-h-0">
      <!-- Index -->
      <nav
        v-show="!focusMode"
        class="w-60 lg:w-72 shrink-0 border-r border-zinc-300 dark:border-zinc-700 overflow-y-auto"
        @mouseleave="hovered = null"
      >
        <template v-for="group in groupedVisible" :key="group.folder">
          <div
            class="sticky top-0 z-10 flex items-center justify-between px-3 py-0.5 bg-sunken border-b border-zinc-300 dark:border-zinc-700 text-3xs uppercase tracking-wider text-zinc-500"
          >
            <span>{{ group.folder }}</span>
            <span class="text-zinc-400 dark:text-zinc-600">{{ group.items.length }}</span>
          </div>
          <button
            v-for="entry in group.items"
            :key="entry.key"
            class="row"
            :class="{ on: active && active.key === entry.key }"
            @mouseenter="hovered = entry"
            @click="pin(entry)"
          >
            <span class="text-xs truncate flex-1">
              <span
                v-if="!entry.stories"
                class="text-zinc-400 dark:text-zinc-600"
                title="no story — add one in utils/kitchenSinkStories.js"
                >*</span
              >{{ entry.name }}
            </span>
            <span v-if="entry.isClient" class="meta">client</span>
            <span v-if="entry.isServer" class="meta">server</span>
          </button>
        </template>

        <p v-if="!visible.length" class="text-2xs text-zinc-500 p-3">no match</p>
      </nav>

      <!-- Preview -->
      <section class="flex-1 min-w-0 overflow-y-auto">
        <div v-if="!active" class="h-full flex items-center justify-center px-6">
          <p class="text-2xs text-zinc-400 dark:text-zinc-600 text-center leading-5">
            hover a component to preview · click to pin<br />
            deep-link with <span class="text-zinc-500">?c=Name</span> · focus mode survives HMR
          </p>
        </div>

        <div v-else>
          <!-- preview masthead -->
          <div
            class="sticky top-0 z-10 bg-sunken border-b border-zinc-300 dark:border-zinc-700 px-4 py-2"
          >
            <div class="flex items-baseline gap-x-3 gap-y-1 flex-wrap text-2xs text-zinc-500">
              <template v-if="focusMode">
                <button class="lnk" @click="focusMode = false">← index</button>
                <button class="lnk" @click="focusStep(-1)">prev</button>
                <button class="lnk" @click="focusStep(1)">next</button>
              </template>
              <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ active.name }}</h2>
              <span class="flex-1" />
              <button class="lnk" @click="reloadPreview">reload</button>
              <button class="lnk" :class="{ on: focusMode }" @click="focusMode = !focusMode">focus</button>
              <button class="lnk" @click="copy(`<${active.name} />`, 'tag')">
                copy tag<span v-if="copied === 'tag'" class="text-zinc-900 dark:text-zinc-100"> ✓</span>
              </button>
              <button class="lnk" @click="copyLink">
                copy link<span v-if="copied === 'link'" class="text-zinc-900 dark:text-zinc-100"> ✓</span>
              </button>
              <button v-if="pinned" class="lnk" @click="pinned = null">unpin</button>
            </div>
            <div class="mt-0.5 text-2xs text-zinc-400 dark:text-zinc-600">
              <button class="hover:underline underline-offset-2" @click="copy(`components/${active.relPath}`, 'path')">
                components/{{ active.relPath }}<span v-if="copied === 'path'"> ✓</span>
              </button>
              <span v-if="active.isClient"> · client</span>
              <span v-if="active.isServer"> · server</span>
            </div>
            <div v-if="active.stories && active.stories.length > 1" class="mt-1 text-2xs text-zinc-500">
              <span class="text-zinc-400 dark:text-zinc-600">variants&nbsp;</span>
              <button
                v-for="(s, i) in active.stories"
                :key="s.name"
                class="lnk mr-1"
                :class="{ on: activeVariant === i }"
                @click="activeVariant = i"
              >
                {{ s.name }}
              </button>
            </div>
          </div>

          <!-- render + data -->
          <div class="p-5 max-w-4xl">
            <div class="border border-zinc-300 dark:border-zinc-700 p-5">
              <DevStoryRenderer
                v-if="active.stories"
                :key="active.key + ':' + activeVariant + ':' + reloadKey"
                :loader="active.loader"
                :component-props="activeStory.props"
                :wrapper="activeStory.wrapper"
                :slot-text="activeStory.slot || null"
              />
              <div v-else class="text-2xs text-zinc-400 dark:text-zinc-600 py-8 text-center">
                no story yet — add it in utils/kitchenSinkStories.js
              </div>
            </div>

            <!-- props -->
            <div v-if="activeStory" class="mt-5">
              <div class="text-3xs uppercase tracking-wider text-zinc-400 dark:text-zinc-600 border-b border-zinc-200 dark:border-zinc-800 pb-0.5 mb-1">
                props
              </div>
              <pre class="text-2xs leading-5 overflow-x-auto whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{{ JSON.stringify(activeStory.props, null, 2) }}</pre>
            </div>

            <!-- source -->
            <div class="mt-5">
              <button
                class="w-full text-left flex items-baseline justify-between text-3xs uppercase tracking-wider text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-0.5"
                @click="sourceOpen = !sourceOpen"
              >
                <span>source · components/{{ active.relPath }}</span>
                <span>{{ sourceOpen ? '−' : '+' }}</span>
              </button>
              <pre
                v-if="sourceOpen"
                class="mt-1 text-2xs leading-5 overflow-auto max-h-[55vh] text-zinc-600 dark:text-zinc-400"
              >{{ activeSource }}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* text-link: the only interactive idiom. underline on hover, bold+underline when on. */
.lnk {
  @apply text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline underline-offset-2;
}
.lnk.on {
  @apply text-zinc-900 dark:text-zinc-100 font-bold underline underline-offset-2;
}
/* index row: flat, hairline-separated; selection is a hard invert. */
.row {
  @apply w-full text-left pl-3 pr-3 py-1 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900;
}
.row.on {
  @apply bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-900 dark:hover:bg-zinc-100;
}
.meta {
  @apply text-3xs lowercase text-zinc-400 dark:text-zinc-600 shrink-0;
}
.row.on .meta {
  @apply text-zinc-300 dark:text-zinc-600;
}
</style>
