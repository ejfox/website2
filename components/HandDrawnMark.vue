<template>
  <span ref="root" class="hd-mark" :class="`hd-mark--${placement}`" :style="markVars">
    <span class="hd-mark__text"><slot /></span>
    <span class="hd-mark__ink" :class="inkClass" :style="inkStyle" aria-hidden="true">
      <HandDrawn :name="resolvedName" stretch :erode="erode" />
    </span>
  </span>
</template>

<script setup>
/**
 * Lay a hand-drawn mark tightly over or under a word/phrase — the marked-up-draft
 * vocabulary, inline in real prose:
 *
 *   Just <HandDrawnMark>pm2 reload</HandDrawnMark>, no orchestration.
 *   This is the <HandDrawnMark placement="under">whole point</HandDrawnMark>.
 *
 * The mark stretches to fit the text box. Because the ring assets are all ~square
 * natively, a small ring stretched across a long phrase goes razor-thin while the
 * same ring around a short word looks hand-drawn. So by default we MEASURE the text
 * and pick a ring whose native size ≈ the rendered width — keeping the pen stroke
 * consistent whether we loop a 3-char number or a 3-word phrase. Pass an explicit
 * `name` to override the auto pick.
 */
import { computed, ref, onMounted } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  // force a specific asset (e.g. "circle-lg" / "mark-dash"); "auto" lets the mark
  // size AND vary itself
  name: { type: String, default: 'auto' },
  // 'around' wraps the text (ring); 'under' sits beneath it (scribble / underline)
  placement: { type: String, default: 'around' },
  // ink colour: any CSS colour (defaults to highlighter yellow) ...
  tone: { type: String, default: '#fde047' },
  // ... or a Tailwind text-color token class ("text-amber-500"), which wins over tone
  inkClass: { type: String, default: '' }
})

const root = ref(null)
const { width } = useElementSize(root)

// Every mark claims a sequence number on mount (client-only, so SSR stays stable)
// and uses it to vary ITSELF — different loop, tilt, mirror and thinning — so no two
// marks on a page look like the same stamp pasted twice. Fully automatic: a caller
// just writes <HandDrawnMark>. This IS the hand-drawn illusion; don't hand-tune it.
let _seq = 0
const seq = ref(0)
onMounted(() => {
  seq.value = _seq++
})

// candidate loops at this rendered width (kept close so the ring barely stretches)
const ringPool = (w) =>
  w <= 52
    ? ['circle-sm', 'circle-xs']
    : w <= 108
      ? ['circle-md', 'circle-sm']
      : ['circle-lg', 'circle-md']

// how far each loop's stroke can erode before it vanishes (thinner native = less)
const SAFE_ERODE = { 'circle-xs': 0.55, 'circle-sm': 1.0, 'circle-md': 1.1, 'circle-lg': 1.15 }

// distinct (which-loop, tilt°, mirror) recipes; seq walks them so the first six marks
// are guaranteed visually different before anything can repeat
const VARIANTS = [
  { ring: 0, rot: -3.5, flip: false },
  { ring: 1, rot: 2.5, flip: true },
  { ring: 0, rot: 3.5, flip: true },
  { ring: 1, rot: -2, flip: false },
  { ring: 0, rot: -1.5, flip: true },
  { ring: 1, rot: 4, flip: false }
]
const recipe = computed(() => VARIANTS[seq.value % VARIANTS.length])

const resolvedName = computed(() => {
  if (props.name !== 'auto') return props.name
  if (props.placement === 'under') return 'scribble'
  const pool = ringPool(width.value || 90)
  return pool[recipe.value.ring % pool.length]
})

// nudge the underline's thickness up a touch as the phrase widens, so a stretched
// scribble doesn't thin out to a hairline. stays between 0.26em and 0.4em.
const markVars = computed(() => {
  if (props.placement !== 'under') return {}
  const h = Math.min(0.4, Math.max(0.26, (width.value || 0) / 700 + 0.26))
  return { '--hd-under-h': `${h.toFixed(3)}em` }
})

// auto thinning, for rings only (scribbled underlines stay as-drawn)
const erode = computed(() =>
  props.placement === 'around' ? SAFE_ERODE[resolvedName.value] ?? 1.0 : 0
)

// ink colour (token class wins over tone) + the auto tilt/mirror
const inkStyle = computed(() => {
  const s = props.inkClass ? {} : { color: props.tone }
  if (props.placement === 'around') {
    s.transform = `rotate(${recipe.value.rot}deg)${recipe.value.flip ? ' scaleX(-1)' : ''}`
  }
  return s
})
</script>

<style scoped>
.hd-mark {
  position: relative;
  display: inline-block;
}
.hd-mark__text {
  position: relative;
  z-index: 1;
}
.hd-mark__ink {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}
.hd-mark__ink :deep(.hand-drawn) {
  display: block;
  width: 100%;
  height: 100%;
}
/* wrap the whole word box — reach well into the spaces on either side so the
   loop curves around the word instead of clipping the first/last letters */
.hd-mark--around .hd-mark__ink {
  left: -0.8em;
  right: -0.8em;
  top: -0.42em;
  bottom: -0.38em;
}
/* sit just below the baseline — height tracks width (via --hd-under-h) so a wide
   stretch reads as a line, not a sprawl */
.hd-mark--under .hd-mark__ink {
  left: -0.05em;
  right: -0.05em;
  top: 100%;
  height: var(--hd-under-h, 0.32em);
  margin-top: -0.04em;
}
</style>
