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
import { storiesFor } from '~/utils/kitchenSinkStories'

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

// ── Filters ──────────────────────────────────────────────────────────────────
const search = ref('')
const activeFolder = ref(null)
const storiesOnly = ref(false)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return entries.filter((e) => {
    if (activeFolder.value && e.folder !== activeFolder.value) return false
    if (storiesOnly.value && !e.stories) return false
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
  <div
    class="ks h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
  >
    <!-- Header / filters -->
    <header
      class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5"
    >
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 class="font-mono text-sm uppercase tracking-widest">Kitchen Sink</h1>
        <span class="font-mono text-2xs text-zinc-500">
          {{ visible.length }}<span v-if="visible.length !== entries.length">/{{ entries.length }}</span>
          components · all preview live
        </span>
        <input
          v-model="search"
          type="search"
          placeholder="filter…"
          class="ml-auto w-full sm:w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <button class="chip" :class="!activeFolder ? 'chip-on' : ''" @click="activeFolder = null">
          all
        </button>
        <button
          v-for="f in folders"
          :key="f.name"
          class="chip"
          :class="activeFolder === f.name ? 'chip-on' : ''"
          @click="activeFolder = f.name"
        >
          {{ f.name }} <span class="opacity-50">{{ f.count }}</span>
        </button>
        <label class="chip ml-2 cursor-pointer select-none flex items-center gap-1.5">
          <input v-model="storiesOnly" type="checkbox" class="accent-zinc-600" />
          live only
        </label>
        <button class="chip" :class="galleryMode ? 'chip-on' : ''" @click="galleryMode = !galleryMode">
          ▦ gallery
        </button>
      </div>
    </header>

    <!-- Gallery / contact-sheet mode (QA sweep) -->
    <div v-if="galleryMode" class="flex-1 overflow-y-auto p-3">
      <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <DevGalleryCell v-for="entry in visible" :key="entry.key" :entry="entry" />
      </div>
    </div>

    <!-- Body: list column + persistent preview pane -->
    <div v-else class="flex flex-1 min-h-0">
      <!-- List -->
      <nav
        v-show="!focusMode"
        class="w-72 lg:w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto"
        @mouseleave="hovered = null"
      >
        <template v-for="group in groupedVisible" :key="group.folder">
          <!-- Sticky folder header — sections the otherwise-huge flat list. -->
          <div
            class="sticky top-0 z-10 flex items-center justify-between px-3 py-1 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur border-y border-zinc-200 dark:border-zinc-800 font-mono text-3xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            <span>{{ group.folder }}</span>
            <span class="opacity-50">{{ group.items.length }}</span>
          </div>
          <button
            v-for="entry in group.items"
            :key="entry.key"
            class="group w-full text-left pl-4 pr-3 py-1.5 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 transition-colors"
            :class="
              active && active.key === entry.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
            "
            @mouseenter="hovered = entry"
            @click="pin(entry)"
          >
            <span
              class="text-[10px] leading-none w-2 shrink-0"
              :class="entry.stories ? 'text-transparent' : 'text-amber-500'"
              :title="entry.stories ? '' : 'no story — add one in utils/kitchenSinkStories.js'"
              >●</span
            >
            <span class="font-mono text-xs truncate flex-1">{{ entry.name }}</span>
            <span v-if="entry.isClient" class="badge badge-client">client</span>
            <span v-if="entry.isServer" class="badge badge-server">server</span>
          </button>
        </template>

        <p v-if="!visible.length" class="font-mono text-2xs text-zinc-500 p-4">
          nothing matches that filter
        </p>
      </nav>

      <!-- Preview pane -->
      <section class="flex-1 min-w-0 overflow-y-auto">
        <!-- empty state -->
        <div
          v-if="!active"
          class="h-full flex flex-col items-center justify-center text-center gap-2 px-6"
        >
          <span class="font-mono text-xs text-zinc-400 dark:text-zinc-600">
            hover a component to preview · click to pin
          </span>
          <span class="font-mono text-2xs text-zinc-300 dark:text-zinc-700">
            all {{ entries.length }} preview live · deep-link with ?c=Name · ⤢ focus for HMR
          </span>
        </div>

        <div v-else class="flex flex-col min-h-full">
          <!-- preview header -->
          <div
            class="shrink-0 sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-5 py-3"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <button v-if="focusMode" class="chip" title="back to list" @click="focusMode = false">
                ← all
              </button>
              <button v-if="focusMode" class="chip" title="previous component" @click="focusStep(-1)">‹</button>
              <button v-if="focusMode" class="chip" title="next component" @click="focusStep(1)">›</button>

              <h2 class="font-mono text-base font-semibold">{{ active.name }}</h2>
              <button
                class="font-mono text-2xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                @click="copy(`<${active.name} />`, 'tag')"
              >
                &lt;{{ active.name }} /&gt;
                <span v-if="copied === 'tag'" class="text-emerald-500 ml-1">copied</span>
              </button>

              <div class="ml-auto flex items-center gap-1">
                <button class="chip" title="reload preview (force remount)" @click="reloadPreview">⟳</button>
                <button
                  class="chip"
                  :class="focusMode ? 'chip-on' : ''"
                  title="focus mode (hide list)"
                  @click="focusMode = !focusMode"
                >
                  ⤢ focus
                </button>
                <button class="chip" title="copy deep link to this component" @click="copyLink">
                  link<span v-if="copied === 'link'" class="text-emerald-500 ml-1">✓</span>
                </button>
                <button v-if="pinned" class="chip" @click="pinned = null">unpin ✕</button>
                <span v-else class="font-mono text-2xs text-zinc-400 px-1">click row to pin</span>
              </div>
            </div>
            <button
              class="mt-1 font-mono text-2xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              :title="`components/${active.relPath}`"
              @click="copy(`components/${active.relPath}`, 'path')"
            >
              components/{{ active.relPath }}
              <span v-if="copied === 'path'" class="text-emerald-500 ml-1">copied</span>
            </button>

            <!-- variant tabs -->
            <div
              v-if="active.stories && active.stories.length > 1"
              class="mt-2 flex flex-wrap gap-1"
            >
              <button
                v-for="(s, i) in active.stories"
                :key="s.name"
                class="chip"
                :class="activeVariant === i ? 'chip-on' : ''"
                @click="activeVariant = i"
              >
                {{ s.name }}
              </button>
            </div>
          </div>

          <!-- live render -->
          <div class="flex-1 p-6 flex items-center justify-center">
            <div class="w-full max-w-3xl">
              <div
                class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 ks-surface"
              >
                <DevStoryRenderer
                  v-if="active.stories"
                  :key="active.key + ':' + activeVariant + ':' + reloadKey"
                  :loader="active.loader"
                  :component-props="activeStory.props"
                  :wrapper="activeStory.wrapper"
                  :slot-text="activeStory.slot || null"
                />
                <div
                  v-else
                  class="font-mono text-2xs text-amber-600 dark:text-amber-400 text-center py-8"
                >
                  no story for this one yet — add it in
                  <span class="text-zinc-600 dark:text-zinc-300">utils/kitchenSinkStories.js</span>
                </div>
              </div>

              <!-- props -->
              <div v-if="activeStory" class="mt-4">
                <div class="font-mono text-2xs uppercase tracking-wider text-zinc-400 mb-1">
                  props
                </div>
                <pre class="font-mono text-2xs leading-relaxed bg-zinc-100 dark:bg-zinc-900 rounded p-3 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(activeStory.props, null, 2) }}</pre>
              </div>

              <!-- source -->
              <button class="mt-4 chip" @click="sourceOpen = !sourceOpen">
                {{ sourceOpen ? 'hide' : 'view' }} source
              </button>
              <pre
                v-if="sourceOpen"
                class="mt-2 font-mono text-2xs leading-relaxed bg-zinc-100 dark:bg-zinc-900 rounded p-3 overflow-auto max-h-[50vh]"
              >{{ activeSource }}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.chip {
  @apply font-mono text-2xs px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors;
}
.chip-on {
  @apply bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100;
}
.badge {
  @apply px-1 rounded text-[9px] leading-tight uppercase tracking-wide shrink-0;
}
.badge-client {
  @apply bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400;
}
.badge-server {
  @apply bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400;
}
/* Subtle checkerboard so transparent/edge-to-edge components read clearly. */
.ks-surface {
  background-image:
    linear-gradient(45deg, rgba(127, 127, 127, 0.04) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(127, 127, 127, 0.04) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(127, 127, 127, 0.04) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(127, 127, 127, 0.04) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
