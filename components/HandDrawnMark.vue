<template>
  <span ref="root" class="hd-mark" :class="`hd-mark--${placement}`" :style="markVars">
    <span class="hd-mark__text"><slot /></span>
    <span class="hd-mark__ink" :style="{ color: tone }" aria-hidden="true">
      <HandDrawn :name="resolvedName" stretch />
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
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  // 'auto' sizes a ring (or scribble, when placement="under") to the text;
  // or force a specific asset, e.g. name="circle-lg" / name="mark-dash"
  name: { type: String, default: 'auto' },
  // 'around' wraps the text (ring); 'under' sits beneath it (scribble / underline)
  placement: { type: String, default: 'around' },
  // any CSS color for the ink; defaults to highlighter yellow
  tone: { type: String, default: '#fde047' }
})

const root = ref(null)
const { width } = useElementSize(root)

// pick the ring whose native width is closest to the rendered text, so the loop
// only stretches a little and the stroke stays even. thresholds are the geometric
// midpoints between circle-sm (36px), circle-md (71px) and circle-lg (162px).
const ringForWidth = (w) => (w <= 52 ? 'circle-sm' : w <= 108 ? 'circle-md' : 'circle-lg')

const resolvedName = computed(() => {
  if (props.name !== 'auto') return props.name
  if (props.placement === 'under') return 'scribble'
  // SSR / first paint has no measurement yet — assume "a couple words"
  return ringForWidth(width.value || 90)
})

// nudge the underline's thickness up a touch as the phrase widens, so a stretched
// scribble doesn't thin out to a hairline. stays between 0.26em and 0.4em.
const markVars = computed(() => {
  if (props.placement !== 'under') return {}
  const h = Math.min(0.4, Math.max(0.26, (width.value || 0) / 700 + 0.26))
  return { '--hd-under-h': `${h.toFixed(3)}em` }
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
  left: -0.62em;
  right: -0.62em;
  top: -0.14em;
  bottom: -0.1em;
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
