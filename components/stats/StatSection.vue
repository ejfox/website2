<!--
  @file StatSection.vue
  @description Wrapper for one section of /stats (pages/stats.vue): a title
    rotated into the left gutter (inline on phones), a hand-drawn margin
    doodle, and the slotted content. Flashes when useLiveStats reports its
    section changed. Also wraps the ?simple text-only mode's blocks.
    grid=true is a compact variant (plain label, 2-column grid, no doodle);
    no page passes it today, only the kitchen-sink story.
  @props title: string - Section title (also picks the doodle)
  @props id: string - HTML id; doubles as the TOC anchor and the key the page's
    `statsFlashing` set uses (optional)
  @props show: any - Truthy to render; the page passes the data object itself
    (default: true)
  @props grid: boolean - Compact grid layout (default: false)
-->
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: undefined,
  },
  show: {
    type: [Boolean, Object, Array, String, Number],
    default: true,
  },
  grid: {
    type: Boolean,
    default: false,
  },
})

// /stats live refresh (composables/useLiveStats) flashes changed sections.
const flashing = inject('statsFlashing', null)
const isUpdated = computed(() => !!props.id && !!flashing?.value.has(props.id))

// one quiet margin doodle per section. Picked from the section title so it's
// deterministic (SSR-safe) and stable, and the list is long enough that no two
// sections land on the same mark — they all look hand-drawn-different.
const SECTION_MARK = {
  GITHUB: 'arrow-down-curve',
  CODE: 'plus-minus', // a diff +/-
  LEETCODE: 'mark-question', // problems
  TYPING: 'marks-cluster', // keystrokes
  CHESS: 'star-4pt',
  WRITING: 'comma',
  PRODUCTIVITY: 'arrow-up-thin', // productive ↑
  LANGUAGES: 'mark-exclamation',
  MUSIC: 'star-6pt',
  FILMS: 'star-5pt', // ★ ratings
  BOOKS: 'dot-lg',
  ANALYTICS: 'arrow-hook-down',
  GEAR: 'plus-minus-2',
}
const FALLBACK = [
  'mark-dash',
  'dot',
  'star-4pt-2',
  'arrow-down-thin',
  'dot-lg',
  'comma',
]
// Small string hash of the title (31-multiplier, mod a prime). Picks the
// fallback mark and a -8°..+8° tilt, both stable across SSR and hydration.
const titleHash = computed(() => {
  let h = 0
  for (let i = 0; i < props.title.length; i++)
    h = (h * 31 + props.title.charCodeAt(i)) % 100003
  return h
})
const subtleMark = computed(
  () =>
    SECTION_MARK[(props.title || '').toUpperCase()] ||
    FALLBACK[titleHash.value % FALLBACK.length]
)
const markStyle = computed(() => ({
  transform: `rotate(${((titleHash.value % 5) - 2) * 4}deg)`,
}))

const headerTag = computed(() => (props.grid ? 'div' : 'h2'))
const headerClass = computed(() =>
  props.grid ? 'label-uppercase' : 'stats-section-title-hover'
)
const wrapperClass = computed(() =>
  props.grid ? 'stack-1' : 'stats-section sm:space-y-8 group'
)
// 'div' isn't a utility class; it's just a no-op class for the non-grid case.
const contentClass = computed(() => (props.grid ? 'grid-2col' : 'div'))
</script>

<template>
  <div
    v-if="show"
    :id="id"
    :class="[wrapperClass, { 'stat-flash': isUpdated }]"
  >
    <component :is="headerTag" :class="headerClass">
      {{ title }}
    </component>
    <!-- a faint hand-drawn doodle in the margin: every section gets one,
         each a different mark (chosen from the title so it's stable + never
         a twin) -->
    <HandDrawn
      v-if="!grid"
      :name="subtleMark"
      size="1.05rem"
      class="stats-section__mark hd-ink"
      :style="markStyle"
      aria-hidden="true"
    />
    <div :class="contentClass">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.stats-section {
  position: relative;
  padding-left: 2.5rem;
  /* Offscreen sections skip style + layout until they're near the viewport
     (style/layout was 2.3s of /stats' mobile main thread). `auto` makes the
     browser remember each section's real height once rendered, so TOC jumps
     and the scrollbar settle instead of guessing every time. */
  content-visibility: auto;
  contain-intrinsic-size: auto 520px;
}

/* faint margin doodle, tucked into the gutter near the top, well clear of the
   vertically-centred section label */
.stats-section__mark {
  position: absolute;
  left: 0.4rem;
  top: 0.1rem;
  opacity: 0.9;
  pointer-events: none;
}

.stats-section-title-hover {
  @apply tracking-wider font-mono text-zinc-500;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left top;
  font-size: 0.75rem;
  line-height: 1rem;
}

/* Phone: the rotated gutter label becomes an inline heading. A rule above it
   + top padding make it open its own section instead of trailing the last
   row of the section before. The page owns the horizontal gutter. */
@media (max-width: 640px) {
  .stats-section {
    padding-left: 0;
    padding-right: 0;
    padding-top: 1rem;
    @apply border-t border-zinc-200 dark:border-zinc-800;
  }

  .stats-section-title-hover {
    position: static;
    transform: none;
    margin-bottom: 0.75rem;
    display: block;
    @apply text-zinc-600 dark:text-zinc-400;
  }

  .stats-section__mark {
    display: none;
  }
}
</style>
