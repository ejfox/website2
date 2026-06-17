<script setup>
import { useMouse, useWindowSize, useRafFn } from '@vueuse/core'
import { ref, onMounted } from 'vue'

const props = defineProps({ gearItem: { type: Object, default: () => ({}) } })

const { getItemWeightInGrams } = useWeightCalculations()
const { TYPE_SYMBOLS, PRIORITY_PIPS } = useGearUI()

// Mouse-tracking 3D tilt.
//
// Three things used to conflict and produce visible jitter:
//   1. `useMouse()` fires on every mousemove (60+/s) and the transform
//      was being recomputed + reactively flushed to inline `style` each
//      time.
//   2. A `transition: transform 0.15s` on the same element kept starting
//      new 150ms transitions before the previous one finished, so the
//      browser was racing transitions against fresh inline-style writes.
//   3. The parent page's `gear-slide` 600ms transition writes its own
//      transform to the same element's ancestor, which composes with the
//      tilt — during entry, every mousemove broke the slide-in.
//
// Fix: drive the transform via `useRafFn` so updates batch to one per
// animation frame (and don't recompute on every mousemove), drop the
// CSS transition (RAF at 60fps is inherently smooth, no transitions to
// interrupt), and skip the tilt during the ~600ms page-transition window
// so the entry animation plays clean.
const { x: mx, y: my } = useMouse({ touch: false })
const { width: winW, height: winH } = useWindowSize()

// `tilt` is BOUND TO `:style` — emitting an empty object while we're in
// the grace period leaves the inline transform unset, which lets the
// page-transition CSS rules win cleanly. Once the grace period ends,
// `useRafFn` starts populating real transform values from the mouse.
const tiltStyle = ref({})
const tiltReady = ref(false)

// Respect prefers-reduced-motion — skip the tilt entirely for users who
// have it on.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (prefersReducedMotion) return
  // 700ms = page-transition duration (600ms) + small easing-settle buffer.
  setTimeout(() => {
    tiltReady.value = true
  }, 700)
})

useRafFn(() => {
  if (!tiltReady.value || prefersReducedMotion) return
  const cx = winW.value / 2
  const cy = winH.value / 2
  if (!cx || !cy) return
  const rx = -((my.value - cy) / cy) * 20
  const ry = ((mx.value - cx) / cx) * 20
  const tz = (Math.abs(mx.value - cx) / cx + Math.abs(my.value - cy) / cy) * 15
  tiltStyle.value = {
    transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`,
    transformOrigin: 'center center',
    willChange: 'transform',
  }
})

// Backward-compatible name for the template binding.
const tilt = tiltStyle

const photoUrl = computed(() => props.gearItem.imageUrl?.trim() || null)

const displayWeight = computed(() => {
  if (!props.gearItem['Base Weight ()'] && !props.gearItem['Loaded Weight ()'])
    return '?'
  return getItemWeightInGrams(props.gearItem) || 0
})

const amazonUrl = computed(() => {
  if (!props.gearItem?.amazon) return '#'
  try {
    const url = new URL(props.gearItem.amazon)
    url.searchParams.set('tag', 'ejfox0c-20')
    return url.toString()
  } catch {
    return props.gearItem.amazon
  }
})

const itemDetails = computed(() => {
  if (!props.gearItem || typeof props.gearItem !== 'object') return {}
  return Object.fromEntries(
    Object.entries(props.gearItem).filter(([, v]) => v?.toString().trim())
  )
})

const humanize = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[()]/g, '')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
</script>

<template>
  <div class="gear-card-container" :style="tilt">
    <!-- Header -->
    <div class="card-header">
      <div class="text-2xl mb-2">{{ TYPE_SYMBOLS[gearItem.Type] || '—' }}</div>
      <h1 class="text-xl font-light text-primary mb-1">{{ gearItem.Name }}</h1>
      <div class="label-uppercase">{{ gearItem.Type }}</div>
    </div>

    <!-- Photo -->
    <div v-if="photoUrl" class="photo-wrap">
      <div class="gear-img-square">
        <img
          :src="photoUrl"
          :alt="`Photo of ${gearItem.Name}`"
          class="w-full h-full object-cover"
          loading="lazy"
          width="480"
          height="480"
          style="image-rendering: pixelated"
        />
      </div>
    </div>

    <!-- Weight hero -->
    <div class="section text-center">
      <div class="stat-value">{{ displayWeight }}g</div>
      <div class="label-uppercase">Weight</div>
    </div>

    <!-- H₂O + Priority -->
    <div class="section section-grid">
      <div class="text-center">
        <div class="text-sm font-mono text-primary">
          {{ gearItem.Waterproof || '—' }}
        </div>
        <div class="label-uppercase">H₂O</div>
      </div>
      <div class="text-center">
        <div class="text-sm font-mono text-primary tracking-tighter">
          {{ PRIORITY_PIPS[gearItem.Priority] || '—' }}
        </div>
        <div class="label-uppercase">Priority</div>
      </div>
    </div>

    <!-- Container breadcrumb -->
    <div class="section text-center">
      <span class="label-uppercase">
        {{ (gearItem['Parent Container'] || 'Unassigned').toUpperCase() }} › ●
      </span>
    </div>

    <!-- Notes callout -->
    <div v-if="gearItem.Notes" class="callout">
      <span class="text-3xs text-secondary italic">{{ gearItem.Notes }}</span>
    </div>

    <!-- Buy link -->
    <div v-if="gearItem.amazon" class="text-center mt-3">
      <a
        :href="amazonUrl"
        target="_blank"
        rel="nofollow noopener"
        class="btn-inline-flex"
      >
        Buy
      </a>
    </div>

    <!-- Details table -->
    <div class="details-section">
      <h3 class="label-tracked-md">Item Details</h3>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div
          v-for="(value, key) in itemDetails"
          :key="key"
          class="row-bordered"
        >
          <span class="detail-key">{{ humanize(key) }}</span>
          <span class="detail-val" :title="value">{{ value || '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gear-card-container {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.card-header {
  @apply text-center mb-3;
}
.photo-wrap {
  @apply mb-3 flex justify-center;
}

.section {
  @apply border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3;
}
.section-grid {
  @apply grid grid-cols-2;
}

.callout {
  @apply border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 mt-3;
}

.details-section {
  @apply mt-8 border-t border-zinc-200 dark:border-zinc-700 pt-8;
}
.detail-key {
  @apply flex-shrink-0 uppercase tracking-widest text-zinc-600 dark:text-zinc-400;
}
.detail-val {
  @apply font-mono text-right truncate ml-2 min-w-0 text-zinc-900 dark:text-zinc-100;
}

/* Missing utility classes used in template */
.gear-img-square {
  @apply w-[120px] h-[120px] overflow-hidden rounded-sm;
}
.btn-inline-flex {
  @apply inline-flex items-center px-3 py-1 font-mono text-xs uppercase tracking-wider
         border border-zinc-300 dark:border-zinc-600
         text-zinc-700 dark:text-zinc-300
         hover:bg-zinc-100 dark:hover:bg-zinc-800
         transition-colors duration-150 no-underline;
}
.label-tracked-md {
  @apply font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3;
}
.row-bordered {
  @apply flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-800 py-1;
}
</style>
