<!--
  @file StatSection.vue
  @description Stats section wrapper with optional title and grid layout
  @props title: string - Section title
  @props id: string - Section HTML id (optional)
  @props show: boolean - Whether to show section (default: true)
  @props grid: boolean - Use grid layout (default: false)
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
  props.grid ? 'stack-1' : 'stats-section space-y-8 group'
)
const contentClass = computed(() => (props.grid ? 'grid-2col' : 'div'))
</script>

<template>
  <div v-if="show" :id="id" :class="wrapperClass">
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
      class="stats-section__mark text-zinc-400 dark:text-zinc-500"
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

@media (max-width: 640px) {
  .stats-section {
    padding-left: 0;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .stats-section-title-hover {
    position: static;
    transform: none;
    margin-bottom: 0.5rem;
    display: block;
  }

  .stats-section__mark {
    display: none;
  }
}
</style>
