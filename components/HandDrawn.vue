<template>
  <svg
    v-if="asset"
    class="hand-drawn"
    :viewBox="viewBox"
    :style="dims"
    :role="title ? 'img' : 'presentation'"
    :aria-label="title || undefined"
    :aria-hidden="title ? undefined : 'true'"
    :preserveAspectRatio="stretch ? 'none' : 'xMidYMid meet'"
  >
    <filter
      v-if="erode > 0"
      :id="erodeId"
      filterUnits="userSpaceOnUse"
      :x="region.x"
      :y="region.y"
      :width="region.w"
      :height="region.h"
    >
      <feMorphology operator="erode" :radius="erode" />
    </filter>
    <use href="#hd-ink" :filter="erode > 0 ? `url(#${erodeId})` : undefined" />
  </svg>
  <span v-else class="hand-drawn-missing" :title="`unknown hand-drawn asset: ${name}`">⟨{{ name }}?⟩</span>
</template>

<script setup>
import { computed } from 'vue'
import { findHandDrawnAsset, handDrawnViewBox, ensureHandDrawnSprite } from '~/utils/handDrawn'

// One scanned-from-the-notebook sprite, sliced into named regions by viewBox.
// Renders inline so it inherits `currentColor` — drop it in text and it takes the text color.
const props = defineProps({
  // asset name from the manifest, e.g. "circled-3", "arrow-right-long", "badge-10k"
  name: { type: String, required: true },
  // rendered height; number => px, string => any CSS length (default tracks the line)
  size: { type: [Number, String], default: '1.1em' },
  // fill the parent box (used for frames around content); distorts to fit
  stretch: { type: Boolean, default: false },
  // accessible label; when set the mark is exposed as an image instead of decoration
  title: { type: String, default: '' },
  // erode (thin) the filled ink inward by N viewBox units via feMorphology — the
  // Illustrator "make it thinner" move. Shape/size stay put; the line gets finer.
  // 0 = off; ~0.5–2.5 reads as a progressively finer pen. Fully dynamic.
  erode: { type: Number, default: 0 }
})

const asset = computed(() => findHandDrawnAsset(props.name))
const viewBox = computed(() => (asset.value ? handDrawnViewBox(asset.value) : '0 0 1 1'))
// filter region = the cropped asset window, so feMorphology only rasterises the
// crop (not the whole sprite that `<use>` pulls in)
const region = computed(() => {
  const [x, y, w, h] = viewBox.value.split(' ').map(Number)
  return { x, y, w, h }
})
// deterministic (SSR-safe) id; identical erode on the same asset shares one def
const erodeId = computed(
  () => `hde-${props.name.replace(/[^a-z0-9-]/gi, '')}-${String(props.erode).replace('.', '_')}`
)
const ratio = computed(() => (asset.value ? asset.value.w / asset.value.h : 1))
const heightCss = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const dims = computed(() =>
  props.stretch
    ? { width: '100%', height: '100%' }
    : { height: heightCss.value, width: `calc(${heightCss.value} * ${ratio.value})` }
)

// client-only, idempotent; runs as soon as the component is set up
ensureHandDrawnSprite()
</script>

<style scoped>
.hand-drawn {
  display: inline-block;
  vertical-align: -0.18em;
  /* no `color: inherit` — its scoped [data-v] specificity beats utility color
     classes like text-amber-400; color inherits by default anyway */
  /* MUST clip: <use> pulls the whole sprite; the viewBox crop only shows through
     because the outer SVG clips everything outside it. overflow:hidden covers
     Chrome/Firefox; clip-path forces it in Safari, which otherwise leaks
     out-of-viewBox <use> content (neighbouring marks bleed into the crop). */
  overflow: hidden;
  clip-path: inset(0);
}
.hand-drawn-missing {
  font-family: ui-monospace, monospace;
  font-size: 0.8em;
  color: #f43f5e;
}
</style>
