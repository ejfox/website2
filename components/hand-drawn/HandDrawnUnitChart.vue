<!--
  @file HandDrawnUnitChart.vue
  @description Isotype unit chart built from notebook stipple dots
    (stipple-1..12 via HandDrawn): `value` of `total` dots in `tone`, the rest
    faint. Used on pages/hand-drawn.vue.
  @props value, total (100), columns (10), size, gap, tone, emptyOpacity
-->
<script setup>
/**
 * Hand-drawn unit chart (isotype). Tiles EJ's real notebook stipple dots into a
 * grid, duped + rotated + jittered so no two read the same, and fills the first
 * `value` of `total` in the accent color — the rest sit as faint ghosts.
 *
 *   <HandDrawnUnitChart :value="1"  :total="100" />   <!-- 1 of 100 -->
 *   <HandDrawnUnitChart :value="7"  :total="10" />    <!-- 7 of 10  -->
 *   <HandDrawnUnitChart :value="30" :total="100" tone="#f43f5e" />
 */
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true }, // how many dots are "on"
  total: { type: Number, default: 100 }, // dots in the grid
  columns: { type: Number, default: 10 },
  size: { type: String, default: '0.75rem' }, // dot height
  gap: { type: String, default: '0.5rem' },
  tone: { type: String, default: '#f43f5e' }, // fill for "on" dots; ghosts use ink
  emptyOpacity: { type: Number, default: 0.16 },
})

// the dozen real stipple dots lifted from the notebook grid
const DOTS = Array.from({ length: 12 }, (_, i) => `stipple-${i + 1}`)

// deterministic hash per index — NOT Math.random, so SSR and client agree and
// the jitter stays put between renders
const hash = (i) => {
  // The classic shader "fract(sin(x) * big)" hash: cheap, stable per index.
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x) // 0..1
}

const cells = computed(() =>
  // max(): if value overshoots total, grow the grid instead of hiding dots.
  Array.from({ length: Math.max(props.total, props.value) }, (_, idx) => {
    const i = idx + 1
    const on = i <= props.value
    const r = hash(i)
    const r2 = hash(i + 97)
    return {
      i,
      name: DOTS[Math.floor(r * DOTS.length)],
      style: {
        color: on ? props.tone : 'currentColor',
        opacity: on ? 1 : props.emptyOpacity,
        // dupe → rotate → resize a touch, so the grid reads hand-stippled
        // rotation -20..+20°, scale 0.80..1.25
        transform: `rotate(${(r * 40 - 20).toFixed(1)}deg) scale(${(0.8 + r2 * 0.45).toFixed(2)})`,
      },
    }
  })
)

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: props.gap,
  width: 'fit-content',
  justifyItems: 'center',
  alignItems: 'center',
}))

const ariaLabel = computed(() => `${props.value} of ${props.total}`)
</script>

<template>
  <div class="hd-unit" :style="gridStyle" role="img" :aria-label="ariaLabel">
    <HandDrawn
      v-for="cell in cells"
      :key="cell.i"
      :name="cell.name"
      :size="size"
      class="hd-unit__dot"
      :style="cell.style"
    />
  </div>
</template>

<style scoped>
.hd-unit__dot {
  transform-origin: center;
}
</style>
