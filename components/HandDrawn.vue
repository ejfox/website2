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
    <use href="#hd-ink" />
  </svg>
  <span v-else class="hand-drawn-missing" :title="`unknown hand-drawn asset: ${name}`">⟨{{ name }}?⟩</span>
</template>

<script setup>
import { computed } from 'vue'
import manifest from '~/assets/hand-drawn/manifest.json'

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
  title: { type: String, default: '' }
})

const asset = computed(() => manifest.find(a => a.name === props.name))
const viewBox = computed(() =>
  asset.value ? `${asset.value.x} ${asset.value.y} ${asset.value.w} ${asset.value.h}` : '0 0 1 1'
)
const ratio = computed(() => (asset.value ? asset.value.w / asset.value.h : 1))
const heightCss = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const dims = computed(() =>
  props.stretch
    ? { width: '100%', height: '100%' }
    : { height: heightCss.value, width: `calc(${heightCss.value} * ${ratio.value})` }
)

// Inject the shared geometry once per page. The 500KB lives in /public, fetched a
// single time and parked in a hidden node; every <HandDrawn> just <use>s #hd-ink.
let injected = false
function ensureSprite() {
  if (typeof document === 'undefined' || injected) return
  if (document.getElementById('hd-sprite-root')) { injected = true; return }
  injected = true
  fetch('/hand-drawn/sprite.svg')
    .then((r) => r.text())
    .then((svg) => {
      if (document.getElementById('hd-sprite-root')) return
      const holder = document.createElement('div')
      holder.id = 'hd-sprite-root'
      holder.setAttribute('aria-hidden', 'true')
      holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
      holder.innerHTML = svg
      document.body.appendChild(holder)
    })
    .catch(() => { injected = false })
}
// client-only, idempotent; runs as soon as the component is set up
ensureSprite()
</script>

<style scoped>
.hand-drawn {
  display: inline-block;
  vertical-align: -0.18em;
  color: inherit;
  /* MUST clip: <use> pulls the whole sprite; the viewBox crop only shows through
     because the outer SVG clips everything outside it. */
  overflow: hidden;
}
.hand-drawn-missing {
  font-family: ui-monospace, monospace;
  font-size: 0.8em;
  color: #f43f5e;
}
</style>
