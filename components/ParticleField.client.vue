<script setup>
/**
 * ParticleField — a very sparse 3D field of single-pixel particles that the
 * page sits inside. Depth z ∈ [0,1] (0 = far, 1 = near) drives everything:
 * brightness, scroll parallax, and how hard impulses shove a particle. The
 * page itself is a plane at PAGE_DEPTH — particles behind it draw on the
 * `under` canvas (beneath content), the few in front draw on `over`.
 *
 * Impulses: clicking a link/button bursts outward from the pointer; a route
 * change sends a gust that sweeps top→bottom. Velocity decays exponentially,
 * so pushed particles glide and settle where they land.
 *
 * Cheap by construction: Canvas 2D, ~60 points, dirty-pixel clears (no
 * full-canvas clear), paused while the tab is hidden, one static frame
 * under prefers-reduced-motion.
 */
import {
  useDocumentVisibility,
  useEventListener,
  usePreferredDark,
  usePreferredReducedMotion,
  useRafFn,
  useWindowSize,
} from '@vueuse/core'

// ── tuning ───────────────────────────────────────────────────────────────────
const AREA_PER_PARTICLE = 24000 // px² of viewport per particle — VERY sparse
const PAGE_DEPTH = 0.86 // z above this draws over the content
const PIXEL = 1 // CSS px per particle
const DAMPING = 0.955 // per-frame velocity decay (glide length)
const JIGGLE = 0.035 // brownian kick per frame
const DRIFT = 0.06 // ambient drift speed (px/frame at z=1)
const PARALLAX = 0.45 // scroll parallax at z=1
const CLICK_FORCE = 9
const CLICK_RADIUS = 360
const GUST_FORCE = 6
const GUST_SWEEP_MS = 420 // time for the route-change gust to cross the screen

const under = ref(null)
const over = ref(null)
const { width, height } = useWindowSize()
const isDark = usePreferredDark()
const reducedMotion = usePreferredReducedMotion()
const visibility = useDocumentVisibility()

let particles = []
let ctxUnder = null
let ctxOver = null
let lastScrollY = 0

const rand = (a, b) => a + Math.random() * (b - a)

function spawn(w, h) {
  const count = Math.round((w * h) / AREA_PER_PARTICLE)
  particles = Array.from({ length: count }, () => {
    // Bias toward far: most of the field sits behind the page
    const z = Math.pow(Math.random(), 1.6)
    const angle = rand(0, Math.PI * 2)
    return {
      x: rand(0, w),
      y: rand(0, h),
      z,
      vx: 0,
      vy: 0,
      dx: Math.cos(angle) * DRIFT * (0.3 + z),
      dy: Math.sin(angle) * DRIFT * (0.3 + z),
      gustAt: 0,
      gx: 0,
      gy: 0,
      px: -1, // last drawn pixel, for dirty clears
      py: -1,
    }
  })
}

function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width.value * dpr)
  canvas.height = Math.round(height.value * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function resize() {
  if (!under.value || !over.value) return
  ctxUnder = setupCanvas(under.value)
  ctxOver = setupCanvas(over.value)
  spawn(width.value, height.value)
  draw()
}

const wrap = (v, max) => ((v % max) + max) % max

function step(now) {
  const w = width.value
  const h = height.value
  const scrollY = window.scrollY
  const scrollDelta = scrollY - lastScrollY
  lastScrollY = scrollY

  for (const p of particles) {
    if (p.gustAt && now >= p.gustAt) {
      p.vx += p.gx
      p.vy += p.gy
      p.gustAt = 0
    }
    p.vx = (p.vx + (Math.random() - 0.5) * JIGGLE) * DAMPING
    p.vy = (p.vy + (Math.random() - 0.5) * JIGGLE) * DAMPING
    p.x = wrap(p.x + p.vx + p.dx, w)
    p.y = wrap(p.y + p.vy + p.dy - scrollDelta * PARALLAX * p.z, h)
  }
}

function draw() {
  if (!ctxUnder || !ctxOver) return
  const rgb = isDark.value ? '244,244,245' : '24,24,27'

  for (const p of particles) {
    const ctx = p.z > PAGE_DEPTH ? ctxOver : ctxUnder
    if (p.px >= 0) ctx.clearRect(p.px, p.py, PIXEL, PIXEL)
    const px = Math.round(p.x)
    const py = Math.round(p.y)
    // Near = brighter; over-the-page particles stay faint so text wins
    const alpha = p.z > PAGE_DEPTH ? 0.55 : 0.12 + p.z * 0.5
    ctx.fillStyle = `rgba(${rgb},${alpha})`
    ctx.fillRect(px, py, PIXEL, PIXEL)
    p.px = px
    p.py = py
  }
}

const { pause, resume } = useRafFn(
  ({ timestamp }) => {
    step(timestamp)
    draw()
  },
  { immediate: false }
)

function syncRunning() {
  if (reducedMotion.value === 'reduce' || visibility.value === 'hidden') pause()
  else resume()
}

// ── impulses ─────────────────────────────────────────────────────────────────
function burst(cx, cy) {
  for (const p of particles) {
    const dx = p.x - cx
    const dy = p.y - cy
    const dist = Math.hypot(dx, dy) || 1
    if (dist > CLICK_RADIUS) continue
    const falloff = (1 - dist / CLICK_RADIUS) ** 2
    const f = CLICK_FORCE * falloff * (0.25 + p.z)
    p.vx += (dx / dist) * f
    p.vy += (dy / dist) * f
  }
}

function gust() {
  const now = performance.now()
  const h = height.value || 1
  // One shared heading per navigation, slightly curled per particle
  const heading = rand(-Math.PI * 0.75, -Math.PI * 0.25) // mostly upward
  for (const p of particles) {
    const a = heading + rand(-0.5, 0.5)
    const f = GUST_FORCE * (0.2 + p.z) * rand(0.6, 1)
    p.gustAt = now + (p.y / h) * GUST_SWEEP_MS
    p.gx = Math.cos(a) * f
    p.gy = Math.sin(a) * f
  }
}

useEventListener(
  'pointerdown',
  (e) => {
    if (e.target?.closest?.('a, button, [role="button"]')) {
      burst(e.clientX, e.clientY)
    }
  },
  { passive: true }
)

const router = useRouter()
const removeGuard = router.beforeEach((to, from) => {
  if (to.path !== from.path) gust()
})
onBeforeUnmount(removeGuard)

// .client components can run onMounted before their template is in the DOM
// (Nuxt docs) — without the nextTick the canvas refs are still null
onMounted(async () => {
  await nextTick()
  lastScrollY = window.scrollY
  resize()
  watch([width, height], resize)
  watch(isDark, draw)
  watch([reducedMotion, visibility], syncRunning, { immediate: true })
})
</script>

<template>
  <div class="particle-field-root" aria-hidden="true">
    <canvas ref="under" class="particle-field particle-field--under" />
    <canvas ref="over" class="particle-field particle-field--over" />
  </div>
</template>

<style scoped>
.particle-field {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

/* Under: needs an ancestor with `isolation: isolate` (the layout root) so
   z-index -1 lands above that ancestor's background but below its content */
.particle-field--under {
  z-index: -1;
}

.particle-field--over {
  z-index: 200;
}

@media print {
  .particle-field {
    display: none;
  }
}
</style>
