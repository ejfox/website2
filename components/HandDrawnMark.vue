<template>
  <span class="hd-mark" :class="`hd-mark--${placement}`">
    <span class="hd-mark__text"><slot /></span>
    <span class="hd-mark__ink" :style="{ color: tone }" aria-hidden="true">
      <HandDrawn :name="name" stretch />
    </span>
  </span>
</template>

<script setup>
/**
 * Lay a hand-drawn mark tightly over or under a word/phrase — the marked-up-draft
 * vocabulary, inline in real prose:
 *
 *   Just <HandDrawnMark name="circle-md" tone="#f43f5e">pm2 reload</HandDrawnMark>, no orchestration.
 *   This is the <HandDrawnMark placement="under" name="scribble">whole point</HandDrawnMark>.
 *
 * The mark stretches to fit the text box (it's hand-drawn, so the distortion reads
 * as "circled in pen" rather than wrong).
 */
defineProps({
  name: { type: String, default: 'circle-md' },
  // 'around' wraps the text (circle / box); 'under' sits beneath it (underline / strike)
  placement: { type: String, default: 'around' },
  // any CSS color for the ink; defaults to the surrounding text color
  tone: { type: String, default: 'currentColor' }
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
/* wrap the whole word box */
.hd-mark--around .hd-mark__ink {
  left: -0.32em;
  right: -0.32em;
  top: -0.14em;
  bottom: -0.1em;
}
/* sit just below the baseline */
.hd-mark--under .hd-mark__ink {
  left: -0.1em;
  right: -0.1em;
  top: 100%;
  height: 0.55em;
  margin-top: -0.06em;
}
</style>
