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
 * Placement is blue noise (best-candidate sampling) so the field reads as
 * evenly scattered rather than clumped, and brightness is heavy-tailed: most
 * stars are barely there, a rare few are bright, and the brightest behind the
 * page get a 1px cross glint. Resizing keeps every star where it was.
 *
 * Cheap by construction: Canvas 2D, ~30 points, only pixels that changed are
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
const AREA_PER_PARTICLE = 48000 // px² of viewport per particle — VERY sparse
const PAGE_DEPTH = 0.72 // z above this draws over the content (~20% of them)
const PIXEL = 1 // CSS px per particle
const DAMPING = 0.955 // per-frame velocity decay (glide length)
const SCROLL_INERTIA = 0.004 // scroll px → particle velocity at z=1
const REST = 0.01 // below this speed a particle snaps to still
const PULL_FORCE = 0.28 // peak attraction, px/frame² at z=1
const PULL_MS = 520 // how long the well holds before releasing
const GUST_FORCE = 6
const GUST_SWEEP_MS = 420 // time for the route-change gust to cross the screen
const CANDIDATES = 12 // best-candidate samples per star (higher = more even)
const STARS_PER_GLINT = 20 // the brightest 1-in-N behind the page get a cross

const under = ref(null)
const over = ref(null)
const { width, height } = useWindowSize()
const isDark = usePreferredDark()
const reducedMotion = usePreferredReducedMotion()
const visibility = useDocumentVisibility()

const particles = []
let ctxUnder = null
let ctxOver = null
let lastScrollY = 0
let dpr = 1
let well = null // { x, y, start } of the latest mousedown

const rand = (a, b) => a + Math.random() * (b - a)

// Mitchell's best-candidate: of a few random spots, take the one farthest
// from every existing star. Cheap blue noise — even, but still organic.
function place(w, h) {
  let best = null
  let bestDist = -1
  for (let i = 0; i < CANDIDATES; i++) {
    const x = rand(0, w)
    const y = rand(0, h)
    let nearest = Infinity
    for (const p of particles) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2
      if (d < nearest) nearest = d
    }
    if (nearest > bestDist) {
      bestDist = nearest
      best = { x, y }
    }
  }
  return best
}

function makeParticle(w, h) {
  const { x, y } = place(w, h)
  // Bias toward far: most of the field sits behind the page
  const z = Math.pow(Math.random(), 1.6)
  // Intrinsic brightness, heavy-tailed: most faint, a rare few bright
  const lum = Math.pow(Math.random(), 3)
  return {
    x,
    y,
    z,
    lum,
    glint: false, // assigned by rank in fit()
    vx: 0,
    vy: 0,
    gustAt: 0,
    gx: 0,
    gy: 0,
    px: -1, // last drawn pixel, for dirty clears
    py: -1,
  }
}

// Keep the field across resizes: stretch existing stars to the new viewport
// and top up / trim to the new count. Respawning made the whole sky jump
// whenever a mobile toolbar collapsed.
let fieldW = 0
let fieldH = 0
function fit(w, h) {
  if (fieldW && fieldH) {
    const sx = w / fieldW
    const sy = h / fieldH
    for (const p of particles) {
      p.x *= sx
      p.y *= sy
      p.px = -1 // canvases were reset by the resize; nothing to clear
    }
  }
  fieldW = w
  fieldH = h
  const count = Math.round((w * h) / AREA_PER_PARTICLE)
  if (particles.length > count) particles.length = count
  while (particles.length < count) particles.push(makeParticle(w, h))

  // Crosses go to the brightest few behind the page, by rank, so every
  // screen has one or two — a luminance cutoff left some screens with none
  const behind = particles.filter((p) => p.z <= PAGE_DEPTH)
  const glints = Math.max(1, Math.round(particles.length / STARS_PER_GLINT))
  behind.sort((a, b) => b.lum - a.lum)
  for (const p of particles) p.glint = false
  for (const p of behind.slice(0, glints)) p.glint = true
}

// Draw in raw device pixels, never through a dpr transform: at a fractional
// devicePixelRatio (browser zoom, e.g. 1.5 or 1.8) a 1-CSS-px rect lands on
// partial device pixels, clearRect antialiases, and every dirty clear leaves
// residue — moving particles left streaks. Integer device rects clear exactly.
function setupCanvas(canvas) {
  canvas.width = Math.round(width.value * dpr)
  canvas.height = Math.round(height.value * dpr)
  return canvas.getContext('2d')
}

function resize() {
  if (!under.value || !over.value) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  ctxUnder = setupCanvas(under.value)
  ctxOver = setupCanvas(over.value)
  fit(width.value, height.value)
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
  const size = Math.max(1, Math.round(PIXEL * dpr)) // whole device pixels

  // Two passes: clear every moved star, then draw. A glint's 3×3 clear can
  // overlap a neighbour drawn earlier in the same frame — clearing first
  // means nothing gets erased by someone else's dirty rect.
  const moved = []
  for (const p of particles) {
    const px = Math.round(p.x * dpr)
    const py = Math.round(p.y * dpr)
    if (!force && px === p.px && py === p.py) continue // still: no redraw
    const ctx = p.z > PAGE_DEPTH ? ctxOver : ctxUnder
    if (p.px >= 0) {
      if (p.glint) ctx.clearRect(p.px - size, p.py - size, size * 3, size * 3)
      else ctx.clearRect(p.px, p.py, size, size)
    }
    p.px = px
    p.py = py
    moved.push(p)
  }
  for (const p of moved) {
    const over = p.z > PAGE_DEPTH
    const ctx = over ? ctxOver : ctxUnder
    // Over the page stays a quiet constant so it never fights the text;
    // behind it, brightness is the star's own luminance, nudged by depth
    const alpha = over ? 0.7 : 0.06 + p.lum * 0.74 + p.z * 0.12
    ctx.fillStyle = `rgba(${rgb},${alpha})`
    ctx.fillRect(p.px, p.py, size, size)
    if (p.glint) {
      // Pixel-art twinkle cross: four arms at a third of the core
      ctx.fillStyle = `rgba(${rgb},${alpha * 0.33})`
      ctx.fillRect(p.px - size, p.py, size, size)
      ctx.fillRect(p.px + size, p.py, size, size)
      ctx.fillRect(p.px, p.py - size, size, size)
      ctx.fillRect(p.px, p.py + size, size, size)
    }
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
