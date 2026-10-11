<script setup>
import { useDark, useElementSize, useRafFn, watchDebounced } from '@vueuse/core'

// =============================================================================
// CONSTANTS
// =============================================================================
const NODE_RADIUS = { tag: 2.5, post: 2, scrap: 0.75 }
const COLLISION_RADIUS = { tag: 4, post: 3, scrap: 1.5 }
// Two palettes, one vibe: a luminous field on black, and the same marks as
// ink on paper in light mode. Glow reads as light on black but as smudge on
// white, so light mode keeps halos off and leans on weight instead.
const PALETTE = {
  dark: {
    node: { tag: '#fbbf24', post: '#fafafa', scrap: '#f87171' },
    edge: '#52525b',
    edgeAlpha: 0.08,
    tagActive: '#fde68a',
    tagTick: 'rgba(251, 191, 36, 0.45)',
    tagCount: 'rgba(251, 191, 36, 0.4)',
    tagCountActive: 'rgba(253, 230, 138, 0.6)',
    labelHalo: 'rgba(0, 0, 0, 0.9)',
    glow: 1,
  },
  light: {
    node: { tag: '#b45309', post: '#18181b', scrap: '#dc2626' },
    edge: '#71717a',
    edgeAlpha: 0.14,
    tagActive: '#78350f',
    tagTick: 'rgba(180, 83, 9, 0.45)',
    tagCount: 'rgba(180, 83, 9, 0.55)',
    tagCountActive: 'rgba(120, 53, 15, 0.75)',
    labelHalo: 'rgba(255, 255, 255, 0.95)',
    glow: 0,
  },
}
const isDark = useDark()
const theme = computed(() => (isDark.value ? PALETTE.dark : PALETTE.light))
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

const FILTERS = [
  {
    type: 'post',
    label: 'posts',
    color: 'text-zinc-700 dark:text-zinc-300',
    accent: 'accent-zinc-900 dark:accent-white',
  },
  {
    type: 'scrap',
    label: 'scraps',
    color: 'text-red-600 dark:text-red-400',
    accent: 'accent-red-600 dark:accent-red-400',
  },
  {
    type: 'tag',
    label: 'tags',
    color: 'text-amber-700 dark:text-amber-400',
    accent: 'accent-amber-700 dark:accent-amber-400',
  },
]

// =============================================================================
// DATA
// =============================================================================
// Canvas-only page: fetched client-side in onMounted so the graph data isn't
// serialized into the SSR payload (that made /threads ~3.9MB of HTML).
const posts = shallowRef([]) // published posts
const scraps = shallowRef([]) // scraps with at least one usable tag

const tagsOf = (item) =>
  [
    ...(item.tags || item.metadata?.tags || []),
    ...(item.concept_tags || []),
  ].filter((t) => !BLACKLISTED_TAGS.includes(t.toLowerCase()))

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
const hoveredNode = shallowRef(null)
const pointer = ref({ x: 0, y: 0 })
const stats = reactive({ posts: 0, scraps: 0, tags: 0, links: 0 })
const isStreaming = ref(false)
const show = reactive({ post: true, scrap: true, tag: true })

// Graph state (plain, non-reactive — the canvas reads it every frame)
let nodes = []
let links = []
let simulation = null
let ctx = null
let width = 0
let height = 0
let ambientClock = 0
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
  if (n?.type === 'tag') navigateTo(`/tag/${n.title}`)
  else if (n?.slug) navigateTo(`/blog/${n.slug}`)
}

// =============================================================================
// DRAW (runs every animation frame)
// =============================================================================
function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  const hoveredId = hoveredNode.value?.id
  const visible = (n) => show[n.type]

  // Ambient breathing: each post drifts on a slow sine around its settled
  // spot (topics stay pinned). ax/ay give the *drawn* position; real n.x/n.y
  // (and hit-testing) are never touched. Also a slow glow pulse for signposts.
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
  const glowPulse = 5 + Math.sin(t * 0.0016) * 2.5

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
  const pal = theme.value
  const NODE_COLOR = pal.node
  ctx.strokeStyle = pal.edge
  ctx.globalAlpha = pal.edgeAlpha
  ctx.lineWidth = 0.5
  shown.forEach((l) => {
    if (!hoveredId || !touchesHover(l)) drawEdge(l)
  })

  // Reveal layer — light up the hovered node's connections; remember the
  // neighbours so we can accent them below.
  const connected = new Set()
  if (hoveredId) {
    ctx.strokeStyle = NODE_COLOR.tag
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1
    ctx.shadowColor = NODE_COLOR.tag
    ctx.shadowBlur = 8 * pal.glow
    shown.filter(touchesHover).forEach((l) => {
      drawEdge(l)
      connected.add(l.source.id === hoveredId ? l.target.id : l.source.id)
    })
    ctx.shadowBlur = 0
  }

  // Nodes. Additive emphasis only: on hover, the hovered node and its
  // neighbours brighten, grow, and glow — nothing else is ever dimmed.
  // Maypole signposts carry a soft always-on glow so they read as luminous;
  // the plain post dots stay crisp (and cheap — no per-frame blur on 100s).
  nodes.forEach((n) => {
    if (!n.x || !visible(n)) return
    const near = n.id === hoveredId || connected.has(n.id)
    ctx.globalAlpha = near ? 1 : 0.8
    ctx.fillStyle = NODE_COLOR[n.type]
    ctx.shadowColor = near ? NODE_COLOR[n.type] : NODE_COLOR.tag
    ctx.shadowBlur = (near ? 12 : n.isMaypole ? glowPulse : 0) * pal.glow
    ctx.beginPath()
    ctx.arc(ax(n), ay(n), NODE_RADIUS[n.type] + (near ? 1 : 0), 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1

  // Topic labels: always-on signposts on the pinned "maypole" tags, so the
  // graph reads as a labeled map of subjects rather than anonymous dots.
  // Size scales gently with how often the topic is used.
  if (show.tag) {
    ctx.save()
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '1.5px'
    nodes.forEach((n) => {
      if (!n.isMaypole || !n.x) return
      // A topic lights up when it's hovered OR linked to the hovered node —
      // so hovering a post reveals which topics it's filed under.
      const active = n.id === hoveredId || connected.has(n.id)
      const size = Math.min(17, 10 + Math.sqrt(n.count || 1))
      ctx.font = `${active ? size + 1 : size}px "Monaspace Neon", ui-monospace, monospace`
      const labelX = n.x + NODE_RADIUS.tag + 8
      // Glow when active; otherwise a dark halo purely for legibility.
      ctx.shadowColor = active && pal.glow ? NODE_COLOR.tag : pal.labelHalo
      ctx.shadowBlur = active ? 8 * pal.glow || 4 : 4
      // Tick from the dot to the label — technical-annotation feel.
      ctx.strokeStyle = active ? pal.tagActive : pal.tagTick
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(n.x + NODE_RADIUS.tag + 2, n.y)
      ctx.lineTo(labelX - 2, n.y)
      ctx.stroke()
      // Topic name, then a dim count annotation — the label is quantitative.
      const name = (n.title || '').toUpperCase()
      ctx.fillStyle = active ? pal.tagActive : NODE_COLOR.tag
      ctx.fillText(name, labelX, n.y)
      ctx.shadowBlur = 0
      ctx.fillStyle = active ? pal.tagCountActive : pal.tagCount
      ctx.fillText(
        String(n.count || ''),
        labelX + ctx.measureText(name).width + 10,
        n.y
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
    ctx.strokeStyle = ctx.shadowColor = NODE_COLOR[h.type]
    ctx.lineWidth = 1.25
    ctx.shadowBlur = 12 * pal.glow
    ctx.beginPath()
    ctx.arc(ax(h), ay(h), NODE_RADIUS[h.type] + 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

// Ambient render loop — keeps the constellation gently breathing (posts
// drift, signposts pulse) even after the simulation settles. rAF already
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
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Safe area: clear of the header on top, room for topic labels on the right
  const mobile = width < 768
  const box = {
    x0: mobile ? 80 : 120,
    x1: width - (mobile ? 60 : 150),
    y0: mobile ? 160 : 260,
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
  Object.assign(stats, { posts: 0, scraps: 0, tags: 0, links: 0 })
  isStreaming.value = true

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
    stats.links = g.links.length
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
  animate(headerRef.value.querySelectorAll('.header-item'), {
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

// Re-lay out when the canvas actually changes width (resize, layout settle)
const { width: boxWidth } = useElementSize(containerRef)
watchDebounced(
  boxWidth,
  (w) => {
    if (ctx && Math.abs(w - width) > 1) initGraph()
  },
  { debounce: 200 }
)

onBeforeUnmount(() => {
  run++
  simulation?.stop()
})
</script>

<template>
  <div
    class="threads-view relative"
    :style="{ height: `${CANVAS_HEIGHT_VH}vh` }"
  >
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

    <header
      ref="headerRef"
      class="relative z-10 px-4 md:px-8 pt-8 pb-4 font-mono text-xs"
    >
      <h1
        class="header-item font-serif text-2xl text-zinc-900 dark:text-zinc-100 mb-1 opacity-0"
      >
        Threads
      </h1>
      <p class="header-item text-zinc-500 tabular-nums opacity-0">
        <span
          :class="{
            'animate-pulse': isStreaming && stats.posts < posts.length,
          }"
        >
          {{ stats.posts }}/{{ posts.length }}
        </span>
        posts ·
        <span
          :class="{
            'animate-pulse': isStreaming && stats.scraps < scraps.length,
          }"
        >
          {{ stats.scraps }}/{{ scraps.length }}
        </span>
        scraps · {{ stats.tags }} tags · {{ stats.links }} connections
      </p>
      <div class="flex gap-4 mt-2">
        <label
          v-for="f in FILTERS"
          :key="f.type"
          class="header-item flex items-center gap-1 cursor-pointer select-none opacity-0"
        >
          <input v-model="show[f.type]" type="checkbox" :class="f.accent" />
          <span
            :class="show[f.type] ? f.color : 'text-zinc-400 dark:text-zinc-600'"
          >
            {{ f.label }}
          </span>
        </label>
      </div>
    </header>

    <div
      v-if="hoveredNode"
      class="fixed z-50 pointer-events-none max-w-52 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 backdrop-blur font-mono"
      :style="tooltipStyle"
    >
      <div class="text-4xs uppercase tracking-wider text-zinc-500">
        {{ hoveredNode.type }}
      </div>
      <div
        class="font-serif text-xs leading-tight text-zinc-900 dark:text-zinc-50"
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
