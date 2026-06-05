<template>
  <div class="hd-annotation" :style="posStyle">
    <span v-if="label && labelFirst" class="hd-annotation__label" :style="labelStyle">{{ label }}</span>
    <HandDrawn :name="name" :size="size" :stretch="stretch" :title="label || undefined"
               class="hd-annotation__mark" :style="markStyle" />
    <span v-if="label && !labelFirst" class="hd-annotation__label" :style="labelStyle">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Drop a hand-drawn mark (arrow, circle, bracket…) + optional label onto any chart.
 * Place it inside a position:relative wrapper around your viz (SVG or canvas) and
 * give x/y in that wrapper's space. Rotate to aim arrows; circle an outlier with
 * name="circle-md"; bracket a range, etc.
 *
 *   <div class="relative">
 *     <MyChart />
 *     <HandDrawnAnnotation :x="320" :y="64" name="arrow-bend-down-right" label="peak" />
 *     <HandDrawnAnnotation x="58%" y="40%" name="circle-md" size="3rem" class="text-rose-500" />
 *   </div>
 */
const props = defineProps({
  // position within the positioned ancestor; number => px, string => any CSS length (e.g. "60%")
  x: { type: [Number, String], default: 0 },
  y: { type: [Number, String], default: 0 },
  name: { type: String, default: 'arrow-bend-down-right' },
  size: { type: [Number, String], default: '2.5rem' },
  stretch: { type: Boolean, default: false },
  // how (x,y) maps to the mark: 'center' | 'tip' (top-left) | 'tail' (bottom-right)
  anchor: { type: String, default: 'center' },
  rotate: { type: Number, default: 0 },
  flipX: { type: Boolean, default: false },
  flipY: { type: Boolean, default: false },
  label: { type: String, default: '' },
  // which side of the mark the label sits on: 'right' | 'left' | 'top' | 'bottom'
  labelSide: { type: String, default: 'right' }
})

const len = (v) => (typeof v === 'number' ? `${v}px` : v)

const posStyle = computed(() => {
  const t = { center: '-50%, -50%', tip: '0, 0', tail: '-100%, -100%' }[props.anchor] || '-50%, -50%'
  return { left: len(props.x), top: len(props.y), transform: `translate(${t})` }
})

const markStyle = computed(() => {
  const parts = []
  if (props.rotate) parts.push(`rotate(${props.rotate}deg)`)
  if (props.flipX) parts.push('scaleX(-1)')
  if (props.flipY) parts.push('scaleY(-1)')
  return parts.length ? { transform: parts.join(' ') } : {}
})

const labelFirst = computed(() => props.labelSide === 'left' || props.labelSide === 'top')
const labelStyle = computed(() => ({
  display: props.labelSide === 'top' || props.labelSide === 'bottom' ? 'block' : 'inline'
}))
</script>

<style scoped>
.hd-annotation {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  pointer-events: none;
  white-space: nowrap;
  color: inherit;
}
.hd-annotation__mark {
  transform-origin: center;
}
.hd-annotation__label {
  font-family: var(--hd-annotation-font, ui-sans-serif, system-ui, sans-serif);
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.1;
}
</style>
