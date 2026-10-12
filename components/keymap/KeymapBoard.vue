<script setup lang="ts">
// Draws a ZSA Voyager keymap (from /api/keymap) with no keycaps: the glyphs'
// positions carry the column stagger and thumb keys.
//   specimen: base layer as type; `active` > 0 lays that layer over a faded base
//   diff:     only what layer `active` changes (fall-through = dot, blocked = dash)
//   strata:   every layer at once, one tick per layer per key (the page's mark)
import type { KeymapLayer, KeymapKey } from '~/server/utils/oryx'

const props = withDefaults(
  defineProps<{
    layers: KeymapLayer[]
    active?: number
    mode?: 'specimen' | 'diff' | 'strata'
  }>(),
  { active: 0, mode: 'specimen' }
)
const emit = defineEmits<{ select: [layer: number] }>()

// Geometry in key units. Oryx order: left rows 0–23 (outer → inner), left
// thumbs 24–25, right rows 26–49 (inner → outer), right thumbs 50–51.
const U = 40
const PAD = 26
const STAGGER = [0.45, 0.45, 0.15, 0, 0.15, 0.25]
const MID = 7.9
const left: [number, number][] = []
for (let i = 0; i < 24; i++) {
  const c = i % 6
  left.push([c + 0.5, Math.floor(i / 6) + 0.5 + STAGGER[c]])
}
left.push([5.2, 4.75], [6.3, 5.05])
const mirror = (i: number): [number, number] => [
  2 * MID - left[i][0],
  left[i][1],
]
const right: [number, number][] = []
for (let r = 0; r < 4; r++)
  for (let j = 0; j < 6; j++) right.push(mirror(r * 6 + 5 - j))
right.push(mirror(25), mirror(24))
const POS = [...left, ...right].map(([x, y]) => [PAD + x * U, PAD + y * U])
const VIEW = `0 0 ${2 * PAD + 2 * MID * U} ${2 * PAD + 5.6 * U}`

const layerColor = (i: number) => props.layers[i]?.color || null
const colorStyle = (i: number) =>
  i === 0 || !layerColor(i)
    ? { '--c': 'currentColor' }
    : { '--c': layerColor(i) as string }

const size = (s: string) => {
  const n = [...s].length
  return n <= 1 ? 17 : n <= 3 ? 12 : 10
}

interface Cell {
  i: number
  x: number
  y: number
  key: KeymapKey | null
  layer: number // whose glyph is drawn (0 = base)
  faded: boolean
  ring: boolean // this base key switches to the active layer
}

const cells = computed<Cell[]>(() => {
  const base = props.layers[0]?.keys || []
  const top = props.layers[props.active]?.keys || []
  return POS.map(([x, y], i) => {
    const b = base[i]
    const ring = props.active > 0 && b?.L?.to === props.active
    if (props.mode === 'diff')
      return { i, x, y, key: top[i], layer: props.active, faded: false, ring }
    if (props.active === 0 || top[i] === null)
      return { i, x, y, key: b, layer: 0, faded: props.active > 0, ring }
    return { i, x, y, key: top[i], layer: props.active, faded: false, ring }
  })
})

const ticks = computed(() =>
  POS.flatMap(([x, y], i) =>
    props.layers.map((l, li) => ({
      x,
      y: y - 12 + li * (24 / Math.max(props.layers.length - 1, 1)),
      li,
      state: l.keys[i] === null ? 'none' : l.keys[i]?.x ? 'blocked' : 'set',
      L: l.keys[i]?.L,
    }))
  )
)
</script>

<template>
  <svg
    :viewBox="VIEW"
    class="keymap-board block w-full h-auto font-mono text-zinc-900 dark:text-zinc-100"
    role="img"
    :aria-label="
      mode === 'strata'
        ? 'Every keymap layer as a stack of ticks per key'
        : `${layers[active]?.name || 'Base'} layer`
    "
  >
    <template v-if="mode === 'strata'">
      <template v-for="(t, n) in ticks" :key="n">
        <line
          v-if="t.state !== 'none'"
          :x1="t.state === 'set' ? t.x - 10 : t.x - 3"
          :x2="t.state === 'set' ? t.x + 10 : t.x + 3"
          :y1="t.y"
          :y2="t.y"
          :class="t.state === 'set' ? 'tick' : 'faint-stroke'"
          :style="colorStyle(t.li)"
          :stroke-width="t.state === 'set' ? 4 : 1.5"
        />
        <circle
          v-if="t.L"
          :cx="t.x + 15"
          :cy="t.y"
          r="2.4"
          class="mark"
          :style="colorStyle(t.L.to)"
        />
      </template>
    </template>

    <template v-else>
      <g
        v-for="c in cells"
        :key="c.i"
        :class="['km-key', { 'km-faded': c.faded, 'cursor-pointer': c.key?.L }]"
        :style="colorStyle(c.layer)"
        @click="c.key?.L && emit('select', c.key.L.to)"
      >
        <circle
          v-if="c.ring"
          :cx="c.x"
          :cy="c.y"
          r="17"
          fill="none"
          class="ring"
          :style="colorStyle(active)"
          :stroke-dasharray="mode === 'diff' ? '2 3' : undefined"
        />
        <circle
          v-if="c.key === null"
          :cx="c.x"
          :cy="c.y"
          r="1.5"
          class="faint-fill"
        />
        <line
          v-else-if="c.key?.x"
          :x1="c.x - 4"
          :x2="c.x + 4"
          :y1="c.y"
          :y2="c.y"
          class="faint-stroke"
          stroke-width="1.3"
        />
        <template v-else-if="c.key">
          <text
            v-if="c.key.t"
            :x="c.x"
            :y="c.y"
            :font-size="size(c.key.t)"
            class="glyph"
          >
            {{ c.key.t }}
          </text>
          <text
            v-if="c.key.h"
            :x="c.x"
            :y="c.key.t ? c.y + 13 : c.y"
            :font-size="c.key.t ? 9 : 13"
            class="sub"
          >
            {{ c.key.h }}
          </text>
          <text v-if="c.key.d" :x="c.x" :y="c.y - 13" font-size="8" class="sub">
            ‥{{ c.key.d }}
          </text>
          <g v-if="c.key.L" :style="colorStyle(c.key.L.to)">
            <rect
              v-if="c.key.L.op === 'TO'"
              :x="c.x - 3"
              :y="(c.key.t || c.key.h ? c.y + 13 : c.y) - 3"
              width="6"
              height="6"
              class="mark"
            />
            <circle
              v-else
              :cx="c.x"
              :cy="c.key.t || c.key.h ? c.y + 13 : c.y"
              :r="c.key.L.op === 'MO' ? 3.2 : 2.2"
              class="mark"
              :stroke-width="c.key.L.op === 'MO' ? 0 : 3"
            />
          </g>
        </template>
      </g>
    </template>
  </svg>
</template>

<style scoped>
/* Layer colours are the keyboard's own LED colours from Oryx, passed in as
   --c on each key. On a white page the bright LED hues are darkened so they
   stay legible; on black they show as the LEDs do. */
.glyph,
.mark {
  fill: color-mix(in oklab, var(--c) 72%, black);
}
.mark,
.ring,
.tick {
  stroke: color-mix(in oklab, var(--c) 72%, black);
}
@media (prefers-color-scheme: dark) {
  .glyph,
  .mark {
    fill: var(--c);
  }
  .mark,
  .ring,
  .tick {
    stroke: var(--c);
  }
}
.ring {
  stroke-width: 1.2;
}
text {
  text-anchor: middle;
  dominant-baseline: central;
}
.sub {
  fill: #71717a; /* zinc-500 */
}
.faint-fill {
  fill: #a1a1aa; /* zinc-400 */
  opacity: 0.6;
}
.faint-stroke {
  stroke: #a1a1aa;
  opacity: 0.7;
}
.km-key {
  transition: opacity 0.15s;
}
.km-faded {
  opacity: 0.16;
}
@media (prefers-reduced-motion: reduce) {
  .km-key {
    transition: none;
  }
}
</style>
