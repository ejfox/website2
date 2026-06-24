<script setup>
import { useMouse, useWindowSize, useRafFn } from '@vueuse/core'
import { ref, onMounted, onUnmounted } from 'vue'

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

// Two ways to drive the tilt:
//   • Desktop (hover + fine pointer): the mouse, as before.
//   • Touch device: the phone's accelerometer/gyroscope (DeviceOrientation),
//     so tilting the phone tilts the card. iOS 13+ gates motion access behind
//     a user gesture, so there we surface a small "enable tilt" tap prompt.
// prefers-reduced-motion disables both.
const mq = (q) =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(q).matches
    : false
const prefersReducedMotion = mq('(prefers-reduced-motion: reduce)')
const canHover = mq('(hover: hover) and (pointer: fine)')
const mouseTilt = canHover && !prefersReducedMotion

const supportsOrientation =
  typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
const needsMotionPermission =
  supportsOrientation &&
  typeof window.DeviceOrientationEvent?.requestPermission === 'function'

const motionActive = ref(false) // orientation listener live + tilting
const motionPrompt = ref(false) // iOS: show the tap-to-enable affordance

// Orientation target (set by events) and current (RAF-smoothed toward target).
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const oTarget = { rx: 0, ry: 0, tz: 0 }
const oCurrent = { rx: 0, ry: 0, tz: 0 }
let baseBeta = null // calibrate "flat" to however the phone is first held

function handleOrientation(e) {
  if (e.gamma === null || e.beta === null) return
  if (baseBeta === null) baseBeta = e.beta
  const ry = (clamp(e.gamma, -40, 40) / 40) * 18 // left-right
  const rx = (clamp(-(e.beta - baseBeta), -40, 40) / 40) * 18 // front-back
  oTarget.rx = rx
  oTarget.ry = ry
  oTarget.tz = ((Math.abs(rx) + Math.abs(ry)) / 36) * 12
}

async function enableMotion() {
  try {
    if (needsMotionPermission) {
      const res = await window.DeviceOrientationEvent.requestPermission()
      if (res !== 'granted') {
        motionPrompt.value = false
        return
      }
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    motionActive.value = true
    motionPrompt.value = false
  } catch {
    motionPrompt.value = false
  }
}

onMounted(() => {
  if (mouseTilt) {
    // 700ms = page-transition duration (600ms) + small easing-settle buffer.
    setTimeout(() => {
      tiltReady.value = true
    }, 700)
    return
  }
  // Touch device — drive the tilt from device orientation instead of going flat.
  if (!prefersReducedMotion && supportsOrientation) {
    if (needsMotionPermission) {
      motionPrompt.value = true // iOS: wait for a tap to request access
    } else {
      enableMotion() // Android/secure-context: just start
    }
  }
})

onUnmounted(() => {
  if (motionActive.value) {
    window.removeEventListener('deviceorientation', handleOrientation, true)
  }
})

useRafFn(() => {
  // Desktop: live mouse-driven tilt (unchanged).
  if (tiltReady.value) {
    const cx = winW.value / 2
    const cy = winH.value / 2
    if (!cx || !cy) return
    const rx = -((my.value - cy) / cy) * 20
    const ry = ((mx.value - cx) / cx) * 20
    const tz =
      (Math.abs(mx.value - cx) / cx + Math.abs(my.value - cy) / cy) * 15
    tiltStyle.value = {
      transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`,
      transformOrigin: 'center center',
      willChange: 'transform',
    }
    return
  }
  // Touch: smooth toward the orientation target (accelerometer is noisy).
  if (motionActive.value) {
    oCurrent.rx += (oTarget.rx - oCurrent.rx) * 0.12
    oCurrent.ry += (oTarget.ry - oCurrent.ry) * 0.12
    oCurrent.tz += (oTarget.tz - oCurrent.tz) * 0.12
    tiltStyle.value = {
      transform: `perspective(1000px) rotateX(${oCurrent.rx.toFixed(2)}deg) rotateY(${oCurrent.ry.toFixed(2)}deg) translateZ(${oCurrent.tz.toFixed(2)}px)`,
      transformOrigin: 'center center',
      willChange: 'transform',
    }
  }
})

// Backward-compatible name for the template binding.
const tilt = tiltStyle

const photoUrl = computed(() => props.gearItem.Photo_URL?.trim() || null)

const displayWeight = computed(() => {
  if (!props.gearItem.Weight_oz) return '?'
  return getItemWeightInGrams(props.gearItem) || 0
})

const buyUrl = computed(() => {
  const raw = props.gearItem?.Amazon_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    // Only Amazon links get the affiliate tag; other retailers pass through.
    if (url.hostname.includes('amazon.'))
      url.searchParams.set('tag', 'ejfox0c-20')
    return url.toString()
  } catch {
    return raw
  }
})

// Internal/URL fields are surfaced via the buy button, photo, or 3D viewer —
// don't repeat them in the raw details table.
const HIDDEN_DETAIL_KEYS = new Set([
  'slug',
  'Amazon_URL',
  'Photo_URL',
  'Scan_3D_URL',
])

const itemDetails = computed(() => {
  if (!props.gearItem || typeof props.gearItem !== 'object') return {}
  return Object.fromEntries(
    Object.entries(props.gearItem).filter(
      ([k, v]) => v?.toString().trim() && !HIDDEN_DETAIL_KEYS.has(k)
    )
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
  <div
    class="gear-card-container w-full max-w-md lg:max-w-3xl 2xl:max-w-5xl mx-auto"
    :style="tilt"
  >
    <!-- Touch (iOS): tap to grant motion access so the card tilts with -->
    <!-- the phone -->
    <button
      v-if="motionPrompt"
      type="button"
      class="motion-prompt"
      @click="enableMotion"
    >
      ↗ tilt to explore
    </button>

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
    <div v-if="buyUrl" class="text-center mt-3">
      <a
        :href="buyUrl"
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
      <div
        class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-10 gap-y-2 text-xs"
      >
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

.motion-prompt {
  @apply mx-auto mb-3 block font-mono text-xs uppercase tracking-wider
         px-3 py-1 rounded-full
         border border-zinc-300 dark:border-zinc-600
         text-zinc-500 dark:text-zinc-400
         hover:bg-zinc-100 dark:hover:bg-zinc-800
         transition-colors duration-150;
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
  @apply flex-shrink-0 uppercase tracking-widest;
  @apply text-zinc-600 dark:text-zinc-400;
}
.detail-val {
  @apply font-mono text-right ml-2 min-w-0 break-words;
  @apply text-zinc-900 dark:text-zinc-100;
}

/* Missing utility classes used in template */
.gear-img-square {
  @apply w-[120px] h-[120px] overflow-hidden rounded-sm;
}
.btn-inline-flex {
  @apply inline-flex items-center px-3 py-1 font-mono text-xs
         uppercase tracking-wider
         border border-zinc-300 dark:border-zinc-600
         text-zinc-700 dark:text-zinc-300
         hover:bg-zinc-100 dark:hover:bg-zinc-800
         transition-colors duration-150 no-underline;
}
.label-tracked-md {
  @apply font-mono text-xs uppercase tracking-wider mb-3;
  @apply text-zinc-500 dark:text-zinc-400;
}
.row-bordered {
  @apply flex justify-between items-baseline py-1;
  @apply border-b border-zinc-100 dark:border-zinc-800;
}
</style>
