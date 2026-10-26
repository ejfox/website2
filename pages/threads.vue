<script setup>
import { useDark, useElementSize, useRafFn, watchDebounced } from '@vueuse/core'

// =============================================================================
// CONSTANTS
// =============================================================================
const NODE_RADIUS = { tag: 2.5, post: 2, scrap: 0.75 }
const COLLISION_RADIUS = { tag: 4, post: 3, scrap: 1.5 }
// 1-bit ink: the canvas paints with the site's own zinc text ladder, read
// from hidden probes styled by the same Tailwind classes as the legend dots,
// so the graph follows the tokens in both modes. Types differ by ink + radius.
const INK = {
  primary: 'text-zinc-900 dark:text-zinc-100',
  secondary: 'text-zinc-600 dark:text-zinc-400',
  tertiary: 'text-zinc-500',
  quaternary: 'text-zinc-500 dark:text-zinc-600',
  page: 'text-page', // label halo: knocks edges out behind topic names
}
const EDGE_ALPHA = 0.07 // primary ink at low alpha: same weight on black or white
const isDark = useDark()
const BLACKLISTED_TAGS = ['video', 'youtube', 'watchlater']
const ANIM_SPEED = 1.25 // 1.0 = default, higher = slower, lower = faster

// Layout
const CANVAS_HEIGHT_VH = 350 // viewport heights
const NUM_MAYPOLES = 25
const BOUNDARY_FORCE_STRENGTH = 0.8
const BATCH_SIZE = 20 // nodes streamed in per tick
// Edge curvature: fraction of edge length used as the bow. 0 = straight/rigid
// (toward a 90/45° schematic feel), higher = more organic Catmull-Rom flow.
const EDGE_CURVE = 0.14
// Ambient life: posts gently breathe by this many px around their settled
// spot (topics stay pinned as steady anchors). Purely cosmetic — the real
// positions, and hit-testing, are untouched.
const AMBIENT_AMP = 1.1

// Also the filter/legend order: each toggle's dot is painted in its node's ink
const NODE_INK = { post: 'secondary', scrap: 'tertiary', tag: 'primary' }

// =============================================================================
// DATA
// =============================================================================
// Canvas-only page: fetched client-side in onMounted so the graph data isn't
// serialized into the SSR payload (that made /threads ~3.9MB of HTML).
const posts = shallowRef([]) // published posts
const scraps = shallowRef([]) // scraps with at least one usable tag

// Strings only (the scraps API can hand back nulls/objects), deduped so a tag
// in both `tags` and `concept_tags` doesn't count or link twice.
const tagsOf = (item) => [
  ...new Set(
    [
      ...(item.tags || item.metadata?.tags || []),
      ...(item.concept_tags || []),
    ].filter(
      (t) =>
        typeof t === 'string' && !BLACKLISTED_TAGS.includes(t.toLowerCase())
    )
  ),
]

// Posts + scraps become content nodes; a tag becomes a node once 2+ items use
// it. Content with no surviving tag is dropped (it would float unconnected).
function buildGraph(postList, scrapList) {
  const items = [
    ...postList.map((p) => ({
      id: `post-${p.slug}`,
      type: 'post',
      title: p.title || p.metadata?.title,
      slug: p.slug,
      tags: tagsOf(p),
    })),
    ...scrapList.map((s) => ({
      id: `scrap-${s.id}`,
      type: 'scrap',
      title: s.title || s.summary?.slice(0, 40) || 'Scrap',
      tags: tagsOf(s),
    })),
  ]
  const counts = new Map()
  items.forEach((n) =>
    n.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1))
  )
  const isActive = (t) => counts.get(t) >= 2
  const tags = [...counts]
    .filter(([t]) => isActive(t))
    .map(([title, count]) => ({
      id: `tag-${title}`,
      type: 'tag',
      title,
      count,
    }))
  const links = items.flatMap((n) =>
    n.tags.filter(isActive).map((t) => ({ source: n.id, target: `tag-${t}` }))
  )
  return { items: items.filter((n) => n.tags.some(isActive)), tags, links }
}

// =============================================================================
// UI STATE
// =============================================================================
const containerRef = ref(null)
const canvasRef = ref(null)
const headerRef = ref(null)
const inkRef = ref(null)
const hoveredNode = shallowRef(null)
const pointer = ref({ x: 0, y: 0 })
const stats = reactive({ posts: 0, scraps: 0, tags: 0, connections: 0 })
const isStreaming = ref(false)
// Counts read as zero until the first batch lands; show a loading line
// instead so a slow fetch doesn't look like an empty site
const hasStarted = ref(false)
const show = reactive({ post: true, scrap: true, tag: true })

// Graph state (plain, non-reactive — the canvas reads it every frame)
let nodes = []
let links = []
let simulation = null
let ctx = null
let width = 0
let height = 0
let ambientClock = 0
let ink = null // resolved colours + mono font, re-read when the OS scheme flips
let inkDark = null
// Bumped on every (re)init and on unmount; stale streaming chains check it
// and stop, so a resize never leaves two animations fighting over `nodes`.
let run = 0

// Tooltip follows the cursor, flipping away from the right/bottom edges
const tooltipStyle = computed(() => {
  const { x, y } = pointer.value
  const flipX = x + 216 > window.innerWidth - 20
  const flipY = y + 86 > window.innerHeight - 20
  return {
    left: `${Math.max(10, flipX ? x - 216 : x + 6)}px`,
    top: `${Math.max(10, flipY ? y - 86 : y + 6)}px`,
  }
})

function handleMouseMove(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  pointer.value = { x: event.clientX, y: event.clientY }

  // Find nearest node within a generous, type-aware grab radius. Bigger than
  // the dots themselves so moving targets are easy to catch; tags reach
  // furthest since their label sits just to the right of the dot.
  let closest = null
  let minDist = Infinity
  for (const n of nodes) {
    if (!show[n.type]) continue
    const dist = Math.hypot(n.x - x, n.y - y)
    const reach = n.type === 'tag' ? 44 : n.type === 'post' ? 24 : 16
    if (dist < reach && dist < minDist) {
      minDist = dist
      closest = n
    }
  }
  hoveredNode.value = closest
  canvasRef.value.style.cursor = closest ? 'pointer' : 'default'
}

function handleClick() {
  const n = hoveredNode.value
  if (n?.type === 'tag') navigateTo(`/tag/${encodeURIComponent(n.title)}`)
  else if (n?.slug) navigateTo(`/blog/${n.slug}`)
}

// =============================================================================
// DRAW (runs every animation frame)
// =============================================================================
function draw() {
  if (!ctx || !inkRef.value) return
  if (inkDark !== isDark.value) {
    inkDark = isDark.value
    const styles = [...inkRef.value.children].map(getComputedStyle)
    ink = Object.fromEntries(
      Object.keys(INK).map((k, i) => [k, styles[i].color])
    )
    ink.font = styles[0].fontFamily
  }
  ctx.clearRect(0, 0, width, height)

  const hoveredId = hoveredNode.value?.id
  const visible = (n) => show[n.type]

  // Ambient breathing: each post drifts on a slow sine around its settled
  // spot (topics stay pinned). ax/ay give the *drawn* position; real n.x/n.y
  // (and hit-testing) are never touched.
  const t = ambientClock
  const phaseOf = (n) => {
    if (n._ph === undefined) {
      let h = 0
      for (let i = 0; i < n.id.length; i++)
        h = (h * 31 + n.id.charCodeAt(i)) % 6283
      n._ph = h / 1000
    }
    return n._ph
  }
  const ax = (n) =>
    n.isMaypole ? n.x : n.x + Math.sin(t * 0.0005 + phaseOf(n)) * AMBIENT_AMP
  const ay = (n) =>
    n.isMaypole
      ? n.y
      : n.y + Math.cos(t * 0.0004 + phaseOf(n) * 1.3) * AMBIENT_AMP

  // Organic edge: a quadratic "bow" gives a Catmull-Rom-ish curve instead of
  // a straight line. Flip EDGE_CURVE to 0 for a rigid 90/45° schematic feel.
  const drawEdge = (l) => {
    const x1 = ax(l.source)
    const y1 = ay(l.source)
    const x2 = ax(l.target)
    const y2 = ay(l.target)
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const bow = Math.min(len * EDGE_CURVE, 28)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(
      (x1 + x2) / 2 + (-dy / len) * bow,
      (y1 + y2) / 2 + (dx / len) * bow,
      x2,
      y2
    )
    ctx.stroke()
  }

  const shown = links.filter(
    (l) => l.source.x && l.target.x && visible(l.source) && visible(l.target)
  )
  const touchesHover = (l) =>
    l.source.id === hoveredId || l.target.id === hoveredId

  // Faint base layer — every visible edge except the hovered node's (those
  // get redrawn bright on top).
  const inkOf = (n) => ink[NODE_INK[n.type]]
  ctx.strokeStyle = ink.primary
  ctx.globalAlpha = EDGE_ALPHA
  ctx.lineWidth = 0.5
  shown.forEach((l) => {
    if (!hoveredId || !touchesHover(l)) drawEdge(l)
  })

  // Reveal layer — light up the hovered node's connections; remember the
  // neighbours so we can accent them below.
  const connected = new Set()
  if (hoveredId) {
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1
    shown.filter(touchesHover).forEach((l) => {
      drawEdge(l)
      connected.add(l.source.id === hoveredId ? l.target.id : l.source.id)
    })
  }

  // Nodes. Additive emphasis only: on hover, the hovered node and its
  // neighbours go full ink and grow — nothing else is ever dimmed.
  nodes.forEach((n) => {
    if (!n.x || !visible(n)) return
    const near = n.id === hoveredId || connected.has(n.id)
    ctx.globalAlpha = near ? 1 : 0.8
    ctx.fillStyle = inkOf(n)
    ctx.beginPath()
    ctx.arc(ax(n), ay(n), NODE_RADIUS[n.type] + (near ? 1 : 0), 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1

  // Topic labels: always-on signposts on the pinned "maypole" tags, so the
  // graph reads as a labeled map of subjects rather than anonymous dots.
  // Size steps up the type scale (12/14/16) with how often it's used.
  if (show.tag) {
    ctx.save()
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    nodes.forEach((n) => {
      if (!n.isMaypole || !n.x) return
      // A topic lights up when it's hovered OR linked to the hovered node —
      // so hovering a post reveals which topics it's filed under.
      const active = n.id === hoveredId || connected.has(n.id)
      const size = n.count >= 36 ? 16 : n.count >= 16 ? 14 : 12
      ctx.font = `${size}px ${ink.font}`
      ctx.letterSpacing = `${size * 0.05}px`
      const labelX = n.x + NODE_RADIUS.tag + 8
      // Tick from the dot to the label — technical-annotation feel.
      ctx.strokeStyle = active ? ink.primary : ink.quaternary
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(n.x + NODE_RADIUS.tag + 2, n.y)
      ctx.lineTo(labelX - 2, n.y)
      ctx.stroke()
      // Topic name, then a dim count annotation — the label is quantitative.
      // Each sits on a page-coloured halo so edges never strike through it.
      const name = (n.title || '').toUpperCase()
      const label = (text, x, fill) => {
        ctx.strokeStyle = ink.page
        ctx.lineWidth = 3
        ctx.strokeText(text, x, n.y)
        ctx.fillStyle = fill
        ctx.fillText(text, x, n.y)
      }
      label(name, labelX, ink.primary)
      label(
        String(n.count || ''),
        labelX + ctx.measureText(name).width + 10,
        active ? ink.primary : ink.quaternary
      )
    })
    ctx.restore()
  }

  // Hover affordance: ring the node under the cursor so it visibly reads as
  // clickable (the tooltip handles the title).
  const h = hoveredNode.value
  if (h?.x && visible(h)) {
    ctx.save()
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = inkOf(h)
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.arc(ax(h), ay(h), NODE_RADIUS[h.type] + 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

// Ambient render loop — keeps the constellation gently breathing (posts
// drift) even after the simulation settles. rAF already
// pauses in hidden tabs, so it never burns CPU in the background.
useRafFn(({ timestamp }) => {
  ambientClock = timestamp
  draw()
})

// =============================================================================
// BUILD: maypoles drop in, then posts stream, then scraps
// =============================================================================
async function initGraph() {
  const myRun = ++run
  const alive = () => myRun === run
  simulation?.stop()
  const [d3, { animate, stagger }] = await Promise.all([
    import('d3'),
    import('animejs'),
  ])
  const canvas = canvasRef.value
  if (!alive() || !canvas || !(posts.value.length || scraps.value.length))
    return

  width = canvas.clientWidth
  height = canvas.clientHeight
  // Cap the backing store under ~16M px: iOS Safari silently refuses to draw
  // larger canvases, and 350vh at DPR 2–3 on an iPad is already at the edge.
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    Math.sqrt(16e6 / (width * height || 1))
  )
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Safe area: clear of the header on top, room for topic labels on the right
  const mobile = width < 768
  const box = {
    x0: mobile ? 80 : 120,
    x1: width - (mobile ? 60 : 150),
    y0: (headerRef.value?.offsetHeight ?? 0) + 40,
    y1: height - (mobile ? 80 : 150),
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const centerX = (box.x0 + box.x1) / 2

  // Maypoles: the top topics, pinned in a gentle sine wave down the page
  const amplitude = (box.x1 - box.x0) * 0.2
  const maypoles = buildGraph(posts.value, scraps.value)
    .tags.sort((a, b) => b.count - a.count)
    .slice(0, NUM_MAYPOLES)
    .map((tag, i) => ({
      ...tag,
      isMaypole: true,
      x: clamp(
        centerX + Math.sin((i / (NUM_MAYPOLES - 1)) * Math.PI * 2) * amplitude,
        box.x0,
        box.x1
      ),
      y: -50, // start above the viewport
      ty: box.y0 + ((box.y1 - box.y0) * (i + 0.5)) / NUM_MAYPOLES,
    }))
  nodes = [...maypoles]
  links = []
  hoveredNode.value = null
  Object.assign(stats, { posts: 0, scraps: 0, tags: 0, connections: 0 })
  isStreaming.value = true
  hasStarted.value = true

  // Merge a new snapshot into the live graph: existing nodes keep their
  // position/velocity (and pins); new ones spawn near their topic's maypole.
  const update = (postList, scrapList) => {
    const g = buildGraph(postList, scrapList)
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const next = [...g.items, ...g.tags].map((n) => {
      const existing = byId.get(n.id)
      if (existing) return Object.assign(existing, n)
      const anchor = maypoles.find((m) => n.tags?.includes(m.title))
      const jitter = () => (Math.random() - 0.5) * 80
      return Object.assign(n, {
        x: anchor
          ? clamp(anchor.x + jitter(), box.x0, box.x1)
          : box.x0 + Math.random() * (box.x1 - box.x0),
        y: anchor
          ? anchor.ty + jitter()
          : box.y0 + Math.random() * (box.y1 - box.y0),
        vy: 5 + Math.random() * 5, // gentle downward drift
      })
    })
    const ids = new Set(next.map((n) => n.id))
    nodes = [...next, ...maypoles.filter((m) => !ids.has(m.id))]
    links = g.links
    stats.tags = g.tags.length
    stats.connections = g.links.length
    simulation.nodes(nodes)
    simulation.force('link').links(links)
    simulation.alpha(0.3).restart()
  }

  const stream = (p = 0, s = 0) => {
    if (!alive()) return
    const postPhase = p < posts.value.length
    if (postPhase) p = Math.min(p + BATCH_SIZE, posts.value.length)
    else if (s < scraps.value.length)
      s = Math.min(s + BATCH_SIZE, scraps.value.length)
    else return (isStreaming.value = false)
    stats.posts = p
    stats.scraps = s
    update(posts.value.slice(0, p), scraps.value.slice(0, s))
    // A short beat between the last post batch and the first scraps
    const wait = postPhase ? (p === posts.value.length ? 160 : 60) : 50
    setTimeout(() => stream(p, s), wait * ANIM_SPEED)
  }

  // Phase 1: maypole tags drop into place from the top, staggered
  await animate(maypoles, {
    y: (m) => m.ty,
    duration: 1000 * ANIM_SPEED,
    delay: stagger(80 * ANIM_SPEED),
    ease: 'outExpo',
  })
  if (!alive()) return
  maypoles.forEach((m) => {
    m.fx = m.x
    m.fy = m.ty
  })

  // Phase 2: start physics and stream the content in
  simulation = d3
    .forceSimulation(nodes)
    .alphaDecay(0.01) // slower cooldown (default 0.0228), runs ~2x longer
    .velocityDecay(0.3) // more slippery (default 0.4)
    .force(
      'link',
      d3
        .forceLink([])
        .id((d) => d.id)
        .distance(30)
        .strength(0.15)
    )
    .force('charge', d3.forceManyBody().strength(-40).distanceMax(400))
    .force('x', d3.forceX(centerX).strength(0.001))
    .force('y', d3.forceY(height / 2).strength(0.0005))
    .force(
      'collision',
      d3.forceCollide().radius((d) => COLLISION_RADIUS[d.type])
    )
    .on('tick', () => {
      // Soft push back from the edges, then a hard clamp as the fallback
      for (const n of nodes) {
        if (n.isMaypole) continue
        const k = BOUNDARY_FORCE_STRENGTH
        if (n.x < box.x0) n.vx += (box.x0 - n.x) * k
        if (n.x > box.x1) n.vx -= (n.x - box.x1) * k
        if (n.y < box.y0) n.vy += (box.y0 - n.y) * k
        if (n.y > box.y1) n.vy -= (n.y - box.y1) * k
        n.x = clamp(n.x, box.x0, box.x1)
        n.y = clamp(n.y, box.y0, box.y1)
      }
    })
  stream()
}

onMounted(async () => {
  const { animate, stagger } = await import('animejs')
  // The import is async: the user may already have navigated away
  const items = headerRef.value?.querySelectorAll('.header-item')
  if (items)
    animate(items, {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 400 * ANIM_SPEED,
      delay: stagger(80 * ANIM_SPEED),
      ease: 'outQuart',
    })

  const [postList, scrapList] = await Promise.all([
    $fetch('/api/manifest').catch(() => []),
    $fetch('/api/scraps/graph').catch(() => []),
  ])
  posts.value = postList.filter(
    (p) =>
      (p.title || p.metadata?.title) &&
      (p.date || p.metadata?.date) &&
      !p.metadata?.draft
  )
  scraps.value = scrapList.filter((s) => tagsOf(s).length)
  initGraph()
})

// Re-lay out when the canvas actually changes size (resize, layout settle).
// Height too: the canvas is 350vh, and a stale backing buffer stretches the
// drawing and puts hover hit-testing in the wrong place.
const box = useElementSize(containerRef)
watchDebounced(
  [box.width, box.height],
  ([w, h]) => {
    if (ctx && (Math.abs(w - width) > 1 || Math.abs(h - height) > 1))
      initGraph()
  },
  { debounce: 200 }
)

onBeforeUnmount(() => {
  run++
  simulation?.stop()
})
</script>

<template>
  <div class="relative" :style="{ height: `${CANVAS_HEIGHT_VH}vh` }">
    <div ref="containerRef" class="absolute inset-0">
      <canvas
        ref="canvasRef"
        class="block w-full h-full"
        role="img"
        aria-label="Graph of posts, scraps, and tags as interconnected nodes"
        @mousemove="handleMouseMove"
        @mouseleave="hoveredNode = null"
        @click="handleClick"
      />
    </div>

    <!-- Ink probes: the canvas reads its colours + mono font from these -->
    <div ref="inkRef" hidden aria-hidden="true">
      <span v-for="(cls, k) in INK" :key="k" class="font-mono" :class="cls" />
    </div>

    <header ref="headerRef" class="relative z-10 px-4 md:px-8 pt-8 pb-4">
      <div
        class="header-item font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4 opacity-0"
      >
        Index / Threads
      </div>
      <h1
        class="header-item text-3xl md:text-4xl font-light tracking-tight mb-2 opacity-0"
      >
        Threads
      </h1>
      <p
        class="header-item font-serif text-base text-zinc-600 dark:text-zinc-400 mb-3 opacity-0"
      >
        Every post and scrap, strung on the topics they share · hover to peek,
        click to open
      </p>
      <!-- posts + scraps count up as they stream in. Gaps, not "·": a
           separator dangles at a line edge when this wraps on a phone -->
      <p
        class="header-item flex flex-wrap gap-x-3 font-mono text-xs text-zinc-500 tabular-nums opacity-0"
      >
        <span
          v-if="!hasStarted || (isStreaming && !stats.posts && !stats.scraps)"
          class="animate-pulse"
        >
          loading posts + scraps…
        </span>
        <template v-else>
          <span v-for="(n, k, i) in stats" :key="k">
            <span
              class="text-zinc-900 dark:text-zinc-100"
              :class="{ 'animate-pulse': isStreaming && i < 2 }"
            >
              {{ n }}
            </span>
            {{ k }}
          </span>
        </template>
      </p>
      <div class="header-item flex gap-4 mt-2 font-mono text-xs opacity-0">
        <button
          v-for="(level, type) in NODE_INK"
          :key="type"
          type="button"
          :aria-pressed="show[type]"
          class="flex items-center gap-1.5 select-none"
          :class="
            show[type]
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 dark:text-zinc-600 line-through'
          "
          @click="show[type] = !show[type]"
        >
          <span class="size-1.5 rounded-full bg-current" :class="INK[level]" />
          <span>{{ type }}s</span>
        </button>
      </div>
    </header>

    <div
      v-if="hoveredNode"
      class="fixed z-50 pointer-events-none max-w-52 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-surface font-mono"
      :style="tooltipStyle"
    >
      <div class="text-4xs uppercase tracking-wider text-zinc-500">
        {{ hoveredNode.type }}
      </div>
      <div
        class="font-serif text-xs leading-tight text-zinc-900 dark:text-zinc-100"
      >
        {{ hoveredNode.title }}
      </div>
      <div class="mt-1 text-3xs text-zinc-500 dark:text-zinc-400">
        {{
          hoveredNode.type === 'tag'
            ? `${hoveredNode.count} items`
            : hoveredNode.tags?.slice(0, 4).join(' · ')
        }}
      </div>
    </div>
  </div>
</template>
