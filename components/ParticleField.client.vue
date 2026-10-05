<script setup>
/**
 * ParticleField — a very sparse 3D field of single-pixel particles that the
 * page sits inside. Depth z ∈ [0,1] (0 = far, 1 = near) drives everything:
 * brightness and how hard any push moves a particle. The page itself is a
 * plane at PAGE_DEPTH — particles behind it draw on the `under` canvas
 * (beneath content), the ones in front draw on `over`.
 *
 * At rest the field is still. It only moves when pushed: scrolling feeds
 * velocity in with the scroll (so it carries on briefly after you stop),
 * any mousedown briefly draws the whole field toward that point (a gravity
 * well that swells and releases), and a route change
 * sends one coherent upward gust sweeping top→bottom. Velocity decays
 * exponentially, so everything glides and settles where it lands.
 *
 * Cheap by construction: Canvas 2D, ~60 points, only pixels that changed are
 * redrawn (nothing at rest), paused while the tab is hidden, one static
 * frame under prefers-reduced-motion.
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
const PAGE_DEPTH = 0.72 // z above this draws over the content (~20% of them)
const PIXEL = 1 // CSS px per particle
const DAMPING = 0.955 // per-frame velocity decay (glide length)
const SCROLL_INERTIA = 0.004 // scroll px → particle velocity at z=1
const REST = 0.01 // below this speed a particle snaps to still
const PULL_FORCE = 0.28 // peak attraction, px/frame² at z=1
const PULL_MS = 520 // how long the well holds before releasing
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
let well = null // { x, y, start } of the latest mousedown

const rand = (a, b) => a + Math.random() * (b - a)

function spawn(w, h) {
  const count = Math.round((w * h) / AREA_PER_PARTICLE)
  particles = Array.from({ length: count }, () => {
    // Bias toward far: most of the field sits behind the page
    const z = Math.pow(Math.random(), 1.6)
    return {
      x: rand(0, w),
      y: rand(0, h),
      z,
      vx: 0,
      vy: 0,
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
  draw(true)
}

const wrap = (v, max) => ((v % max) + max) % max

function step(now) {
  const w = width.value
  const h = height.value
  const scrollY = window.scrollY
  const scrollDelta = scrollY - lastScrollY
  lastScrollY = scrollY

  // Gravity well: swells then releases (sin envelope), nearer = stronger
  let pull = 0
  if (well) {
    const t = (now - well.start) / PULL_MS
    if (t >= 1) well = null
    else pull = PULL_FORCE * Math.sin(Math.PI * t)
  }

  for (const p of particles) {
    if (pull) {
      const dx = well.x - p.x
      const dy = well.y - p.y
      const dist = Math.hypot(dx, dy) || 1
      // Ease off close in so nothing slingshots through the point
      const f = pull * (0.2 + p.z) * Math.min(1, dist / 120)
      p.vx += (dx / dist) * f
      p.vy += (dy / dist) * f
    }
    if (p.gustAt && now >= p.gustAt) {
      p.vx += p.gx
      p.vy += p.gy
      p.gustAt = 0
    }
    // Scroll pushes the field along with the page; damping gives it inertia
    p.vy -= scrollDelta * SCROLL_INERTIA * p.z
    p.vx *= DAMPING
    p.vy *= DAMPING
    if (Math.abs(p.vx) < REST) p.vx = 0
    if (Math.abs(p.vy) < REST) p.vy = 0
    if (!p.vx && !p.vy) continue
    p.x = wrap(p.x + p.vx, w)
    p.y = wrap(p.y + p.vy, h)
  }
}

function draw(force = false) {
  if (!ctxUnder || !ctxOver) return
  const rgb = isDark.value ? '244,244,245' : '24,24,27'

  for (const p of particles) {
    const px = Math.round(p.x)
    const py = Math.round(p.y)
    if (!force && px === p.px && py === p.py) continue // still: no redraw
    const ctx = p.z > PAGE_DEPTH ? ctxOver : ctxUnder
    if (p.px >= 0) ctx.clearRect(p.px, p.py, PIXEL, PIXEL)
    // Near = brighter
    const alpha = p.z > PAGE_DEPTH ? 0.7 : 0.12 + p.z * 0.5
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
function gust() {
  const now = performance.now()
  const h = height.value || 1
  // Coherent: the whole field lifts upward together, nearer = further
  for (const p of particles) {
    p.gustAt = now + (p.y / h) * GUST_SWEEP_MS
    p.gx = 0
    p.gy = -GUST_FORCE * (0.2 + p.z)
  }
}

useEventListener(
  'pointerdown',
  (e) => {
    well = { x: e.clientX, y: e.clientY, start: performance.now() }
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
  watch(isDark, () => draw(true))
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
