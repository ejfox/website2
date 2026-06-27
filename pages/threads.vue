<script setup>
const { tocTarget } = useTOC()

// =============================================================================
// CONSTANTS
// =============================================================================
const NODE_RADIUS = {
  tag: 2.5,
  post: 2,
  scrap: 0.75,
}

const COLLISION_RADIUS = {
  tag: 4,
  post: 3,
  scrap: 1.5,
}

const NODE_COLOR = {
  tag: '#fbbf24', // amber
  post: '#fafafa', // white
  scrap: '#f87171', // red
}

const BLACKLISTED_TAGS = ['video', 'youtube', 'watchlater']

const ANIM_SPEED = 1.25 // 1.0 = default, higher = slower, lower = faster

// Layout
const CANVAS_HEIGHT_VH = 350 // viewport heights
const NUM_MAYPOLES = 25
const BOUNDARY_FORCE_STRENGTH = 0.8
// Edge curvature: fraction of edge length used as the bow. 0 = straight/rigid
// (toward a 90/45° schematic feel), higher = more organic Catmull-Rom flow.
const EDGE_CURVE = 0.14

// =============================================================================

const { data: postsData } = await useFetch('/api/manifest', { lazy: true })
const { data: scrapsData } = await useFetch('/api/scraps', { lazy: true })

const posts = computed(() => postsData.value || [])
const scraps = computed(() => scrapsData.value || [])

// Filtered counts (what actually appears in the graph)
const filteredPostCount = computed(
  () =>
    posts.value.filter(
      (p) =>
        (p.title || p.metadata?.title) &&
        (p.date || p.metadata?.date) &&
        !p.metadata?.draft
    ).length
)
const filteredScrapCount = computed(
  () =>
    scraps.value.filter((s) => {
      const tags = [...(s.tags || []), ...(s.concept_tags || [])]
      return tags.length > 0
    }).length
)

const containerRef = ref(null)
const canvasRef = ref(null)
const tooltipRef = ref(null)
const headerRef = ref(null)
const hoveredNode = ref(null)
const mousePos = ref({ x: 0, y: 0 })

// Streaming state
const loadedPostCount = ref(0)
const loadedScrapCount = ref(0)
const isStreaming = ref(false)

// Filters
const showPosts = ref(true)
const showScraps = ref(true)
const showTags = ref(true)

// Store nodes for hit detection
let renderedNodes = []
// Assigned to draw() inside the client block so the hover handlers can force a
// repaint (e.g. to show the hover ring) once the simulation has settled.
let requestRedraw = null

// Smart tooltip positioning with edge detection (fixed position, uses viewport)
const tooltipStyle = computed(() => {
  if (!hoveredNode.value) return {}

  const tooltipWidth = 200
  const tooltipHeight = 80
  const offset = 6

  let x = mousePos.value.clientX + offset
  let y = mousePos.value.clientY + offset

  // Flip horizontal if too close to right edge
  if (x + tooltipWidth > window.innerWidth - 20) {
    x = mousePos.value.clientX - tooltipWidth - offset
  }

  // Flip vertical if too close to bottom
  if (y + tooltipHeight > window.innerHeight - 20) {
    y = mousePos.value.clientY - tooltipHeight - offset
  }

  // Keep in bounds
  x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10))
  y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10))

  return {
    left: `${x}px`,
    top: `${y}px`,
  }
})

function handleMouseMove(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  mousePos.value = { x, y, clientX: event.clientX, clientY: event.clientY }

  // Find nearest node within a generous, type-aware grab radius. Bigger than
  // the dots themselves so moving targets are easy to catch; tags reach
  // furthest since their label sits just to the right of the dot.
  let closest = null
  let minDist = Infinity

  for (const n of renderedNodes) {
    const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
    const reach = n.type === 'tag' ? 44 : n.type === 'post' ? 24 : 16
    if (dist < reach && dist < minDist) {
      minDist = dist
      closest = n
    }
  }

  const changed = closest?.id !== hoveredNode.value?.id
  hoveredNode.value = closest
  canvasRef.value.style.cursor = closest ? 'pointer' : 'default'
  // Repaint so the hover ring tracks the cursor even after the sim settles.
  if (changed) requestRedraw?.()
}

function handleClick() {
  if (!hoveredNode.value) return
  if (hoveredNode.value.type === 'tag') {
    navigateTo(`/tag/${hoveredNode.value.title}`)
  } else if (hoveredNode.value.slug) {
    navigateTo(`/blog/${hoveredNode.value.slug}`)
  }
}

// Build graph from posts + limited scraps
function buildGraphData(postsList, scrapsList) {
  const nodes = []
  const links = []
  const tagCounts = new Map()
  const nodeIds = new Set()

  // Add posts
  postsList
    .filter(
      (p) =>
        (p.title || p.metadata?.title) &&
        (p.date || p.metadata?.date) &&
        !p.metadata?.draft
    )
    .forEach((post) => {
      const tags = (post.tags || post.metadata?.tags || []).filter(
        (t) => !BLACKLISTED_TAGS.includes(t.toLowerCase())
      )
      const id = `post-${post.slug}`
      nodeIds.add(id)
      nodes.push({
        id,
        title: post.title || post.metadata?.title,
        tags,
        slug: post.slug,
        type: 'post',
      })
      tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

  // Add scraps (only the ones we've loaded so far)
  scrapsList.forEach((scrap) => {
    const tags = [...(scrap.tags || []), ...(scrap.concept_tags || [])].filter(
      (t) => !BLACKLISTED_TAGS.includes(t.toLowerCase())
    )
    if (tags.length === 0) return
    const id = `scrap-${scrap.id}`
    nodeIds.add(id)
    nodes.push({
      id,
      title: scrap.title || scrap.summary?.slice(0, 40) || 'Scrap',
      tags,
      type: 'scrap',
    })
    tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  // Add tag nodes (only tags used by 2+ items)
  const activeTags = new Set()
  tagCounts.forEach((count, tag) => {
    if (count >= 2) {
      activeTags.add(tag)
      nodes.push({
        id: `tag-${tag}`,
        title: tag,
        type: 'tag',
        count,
      })
    }
  })

  // Create links from posts/scraps to their tags
  nodes.forEach((node) => {
    if (node.type === 'tag') return
    node.tags?.forEach((tag) => {
      if (activeTags.has(tag)) {
        links.push({
          source: node.id,
          target: `tag-${tag}`,
        })
      }
    })
  })

  return { nodes, links }
}

// Computed for header display
const graphData = computed(() => {
  const filteredPosts = posts.value
    .filter(
      (p) =>
        (p.title || p.metadata?.title) &&
        (p.date || p.metadata?.date) &&
        !p.metadata?.draft
    )
    .slice(0, loadedPostCount.value)
  const currentScraps = scraps.value.slice(0, loadedScrapCount.value)
  return buildGraphData(filteredPosts, currentScraps)
})

if (import.meta.client) {
  let simulation = null
  let resizeHandler = null
  // Halts the recursive streaming setTimeout chains once the page unmounts.
  let isUnmounted = false
  let nodes = []
  let links = []
  let ctx = null
  let width = 0
  let height = 0

  const isNodeVisible = (n) => {
    if (n.type === 'post') return showPosts.value
    if (n.type === 'scrap') return showScraps.value
    if (n.type === 'tag') return showTags.value
    return true
  }

  const draw = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)

    const hovered = hoveredNode.value
    // hoveredNode is a Vue ref, so .value is a reactive PROXY — never identical
    // (===) to the raw node objects in nodes/links. Match by id instead.
    const hoveredId = hovered?.id

    // Organic edge: a quadratic "bow" gives a Catmull-Rom-ish curve instead of
    // a straight line. Flip EDGE_CURVE to 0 for a rigid 90/45° schematic feel.
    const drawEdge = (l) => {
      const x1 = l.source.x
      const y1 = l.source.y
      const x2 = l.target.x
      const y2 = l.target.y
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

    // Faint base layer — every visible edge except the hovered node's (those
    // get redrawn bright on top).
    ctx.strokeStyle = '#52525b'
    ctx.globalAlpha = 0.08
    ctx.lineWidth = 0.5
    links.forEach((l) => {
      if (!l.source.x || !l.target.x) return
      if (!isNodeVisible(l.source) || !isNodeVisible(l.target)) return
      if (hoveredId && (l.source.id === hoveredId || l.target.id === hoveredId))
        return
      drawEdge(l)
    })

    // Reveal layer — light up the hovered node's connections to referenced
    // notes; remember the neighbours so we can accent them below.
    const connected = new Set()
    if (hovered) {
      ctx.strokeStyle = '#fbbf24'
      ctx.globalAlpha = 0.6
      ctx.lineWidth = 1
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 8
      links.forEach((l) => {
        if (!isNodeVisible(l.source) || !isNodeVisible(l.target)) return
        if (l.source.id !== hoveredId && l.target.id !== hoveredId) return
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
      if (!n.x || !isNodeVisible(n)) return
      const near = hovered && (n.id === hoveredId || connected.has(n.id))
      ctx.globalAlpha = near ? 1 : 0.8
      ctx.fillStyle = NODE_COLOR[n.type]
      if (near) {
        ctx.shadowColor = NODE_COLOR[n.type]
        ctx.shadowBlur = 12
      } else if (n.isMaypole) {
        ctx.shadowColor = NODE_COLOR.tag
        ctx.shadowBlur = 6
      } else {
        ctx.shadowBlur = 0
      }
      ctx.beginPath()
      ctx.arc(n.x, n.y, NODE_RADIUS[n.type] + (near ? 1 : 0), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    // Topic labels: always-on signposts on the pinned "maypole" tags, so the
    // graph reads as a labeled map of subjects rather than anonymous dots.
    // Size scales gently with how often the topic is used.
    if (showTags.value) {
      ctx.save()
      ctx.globalAlpha = 1
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '1.5px'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 4
      nodes.forEach((n) => {
        if (!n.isMaypole || !n.x) return
        const active = n.id === hoveredId
        const size = Math.min(17, 10 + Math.sqrt(n.count || 1))
        ctx.font = `${active ? size + 1 : size}px "Monaspace Neon", ui-monospace, monospace`
        const labelX = n.x + NODE_RADIUS.tag + 8
        // Tick from the dot to the label — technical-annotation feel.
        ctx.strokeStyle = active ? '#fde68a' : 'rgba(251, 191, 36, 0.45)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(n.x + NODE_RADIUS.tag + 2, n.y)
        ctx.lineTo(labelX - 2, n.y)
        ctx.stroke()
        ctx.fillStyle = active ? '#fde68a' : '#fbbf24'
        ctx.fillText((n.title || '').toUpperCase(), labelX, n.y)
      })
      ctx.restore()
    }

    // Hover affordance: ring the node under the cursor so it visibly reads as
    // selectable/clickable (the tooltip handles the title).
    if (hovered && hovered.x && isNodeVisible(hovered)) {
      ctx.save()
      ctx.globalAlpha = 0.9
      ctx.strokeStyle = NODE_COLOR[hovered.type]
      ctx.lineWidth = 1.25
      ctx.shadowColor = NODE_COLOR[hovered.type]
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(
        hovered.x,
        hovered.y,
        (NODE_RADIUS[hovered.type] || 2) + 5,
        0,
        Math.PI * 2
      )
      ctx.stroke()
      ctx.restore()
    }

    // Only include visible nodes for hit detection
    renderedNodes = nodes.filter(isNodeVisible)
  }
  requestRedraw = draw

  const initGraph = async () => {
    const d3 = await import('d3')

    if (!canvasRef.value || !containerRef.value || !posts.value.length) return

    const canvas = canvasRef.value
    ctx = canvas.getContext('2d')

    const rect = containerRef.value.getBoundingClientRect()
    width = rect.width
    height = window.innerHeight * (CANVAS_HEIGHT_VH / 100)

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Start empty
    loadedPostCount.value = 0
    loadedScrapCount.value = 0
    nodes = []
    links = []

    // Padding to avoid UI elements (responsive) - generous breathing room
    const isMobile = width < 768
    const sidebarWidth = isMobile ? 20 : 180
    const headerHeight = isMobile ? 100 : 140
    const padding = isMobile ? 60 : 120
    const rightPadding = isMobile ? 60 : 150
    const bottomPadding = isMobile ? 80 : 150

    // Center point offset to account for sidebar - shifted right of true center
    const centerX = sidebarWidth + (width - sidebarWidth - rightPadding) / 2

    // Boundary force to push nodes away from edges - stronger repulsion
    const boundaryForce = () => {
      for (const n of nodes) {
        if (n.fx !== undefined) continue // Skip pinned nodes

        // Left boundary
        if (n.x < sidebarWidth + padding) {
          n.vx += (sidebarWidth + padding - n.x) * BOUNDARY_FORCE_STRENGTH
        }
        // Right boundary
        if (n.x > width - rightPadding) {
          n.vx -= (n.x - (width - rightPadding)) * BOUNDARY_FORCE_STRENGTH
        }
        // Top boundary
        if (n.y < headerHeight + padding) {
          n.vy += (headerHeight + padding - n.y) * BOUNDARY_FORCE_STRENGTH
        }
        // Bottom boundary
        if (n.y > height - bottomPadding) {
          n.vy -= (n.y - (height - bottomPadding)) * BOUNDARY_FORCE_STRENGTH
        }
      }
    }

    simulation = d3
      .forceSimulation(nodes)
      .alphaDecay(0.01) // Slower cooldown (default 0.0228), runs ~2x longer
      .velocityDecay(0.3) // More slippery (default 0.4)
      .force(
        'link',
        d3
          .forceLink(links)
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
        boundaryForce()
        // Hard clamp as fallback
        nodes.forEach((n) => {
          if (n.fx === undefined) {
            n.x = Math.max(
              sidebarWidth + padding,
              Math.min(width - rightPadding, n.x)
            )
          }
          if (n.fy === undefined) {
            n.y = Math.max(
              headerHeight + padding,
              Math.min(height - bottomPadding, n.y)
            )
          }
        })
        draw()
      })

    isStreaming.value = true

    // Filter posts once
    const allPosts = posts.value.filter(
      (p) =>
        (p.title || p.metadata?.title) &&
        (p.date || p.metadata?.date) &&
        !p.metadata?.draft
    )
    const allScraps = scraps.value
    const batchSize = 20

    // Timing values (all scaled by ANIM_SPEED)
    const POST_INTERVAL = 60 * ANIM_SPEED
    const POST_TO_SCRAP_PAUSE = 100 * ANIM_SPEED
    const SCRAP_INTERVAL = 50 * ANIM_SPEED

    let postIndex = 0
    let scrapIndex = 0

    // Maypole positioning
    const maypoleX = sidebarWidth + (width - sidebarWidth) / 2
    const maypoleTop = headerHeight + padding
    const maypoleHeight = height - maypoleTop - padding

    // Get top tags for maypoles (need to scan all content first)
    const tagCounts = new Map()
    allPosts.forEach((post) => {
      const tags = post.tags || post.metadata?.tags || []
      tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
    })
    allScraps.forEach((scrap) => {
      const tags = [...(scrap.tags || []), ...(scrap.concept_tags || [])]
      tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
    })

    // Spread maypoles in a gentle wave pattern - constrained to safe area
    const safeWidth = width - sidebarWidth - rightPadding - padding * 2
    const waveAmplitude = safeWidth * 0.25
    const minX = sidebarWidth + padding
    const maxX = width - rightPadding
    const topTags = [...tagCounts.entries()]
      .filter(([tag]) => !BLACKLISTED_TAGS.includes(tag.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, NUM_MAYPOLES)
      .map(([tag, count], i) => {
        // Sine wave offset from center, clamped to safe area
        const waveOffset =
          Math.sin((i / (NUM_MAYPOLES - 1)) * Math.PI * 2) * waveAmplitude
        const tagX = Math.max(minX, Math.min(maxX, maypoleX + waveOffset))
        return {
          id: `tag-${tag}`,
          title: tag,
          type: 'tag',
          count,
          x: tagX,
          y: -50, // Start above viewport
          targetY: maypoleTop + (maypoleHeight * (i + 0.5)) / NUM_MAYPOLES,
          targetX: tagX,
          fx: null, // Will be set after animation
          fy: null,
        }
      })

    const updateGraph = (
      currentPosts,
      currentScraps,
      includeMaypoles = true
    ) => {
      const newData = buildGraphData(currentPosts, currentScraps)

      // Preserve positions of existing nodes
      const existingNodeMap = new Map(nodes.map((n) => [n.id, n]))
      const updatedNodes = newData.nodes.map((n) => {
        const existing = existingNodeMap.get(n.id)
        if (existing) {
          return {
            ...n,
            x: existing.x,
            y: existing.y,
            vx: existing.vx,
            vy: existing.vy,
            fx: existing.fx,
            fy: existing.fy,
          }
        }
        // New nodes spawn near their connected tag (or random in safe area)
        const connectedTag = topTags.find((t) =>
          (n.tags || []).includes(t.title)
        )
        const safeSpawnWidth = width - sidebarWidth - rightPadding - padding * 2
        const safeSpawnHeight =
          height - headerHeight - bottomPadding - padding * 2
        let spawnX, spawnY
        if (connectedTag) {
          // Spawn near tag but clamp to safe area
          spawnX = Math.max(
            minX,
            Math.min(maxX, connectedTag.targetX + (Math.random() - 0.5) * 80)
          )
          spawnY = connectedTag.targetY + (Math.random() - 0.5) * 80
        } else {
          spawnX = sidebarWidth + padding + Math.random() * safeSpawnWidth
          spawnY = headerHeight + padding + Math.random() * safeSpawnHeight
        }
        return {
          ...n,
          x: spawnX,
          y: spawnY,
          vy: 5 + Math.random() * 5, // Gentle downward drift
        }
      })

      // Pin maypole tags
      if (includeMaypoles) {
        updatedNodes
          .filter((n) => n.type === 'tag' && topTags.some((t) => t.id === n.id))
          .forEach((tag) => {
            const maypole = topTags.find((t) => t.id === tag.id)
            if (maypole) {
              tag.fx = maypole.targetX
              tag.fy = maypole.targetY
              tag.isMaypole = true
            }
          })
      }

      // Filter out orphan nodes (no connections)
      const connectedIds = new Set()
      newData.links.forEach((l) => {
        connectedIds.add(typeof l.source === 'object' ? l.source.id : l.source)
        connectedIds.add(typeof l.target === 'object' ? l.target.id : l.target)
      })
      const filteredNodes = updatedNodes.filter(
        (n) => connectedIds.has(n.id) || topTags.some((t) => t.id === n.id)
      )

      nodes = filteredNodes
      links = newData.links.map((d) => ({ ...d }))

      simulation.nodes(nodes)
      simulation.force('link').links(links)
      simulation.alpha(0.3).restart()
    }

    // Animate header elements in
    const animateHeader = async () => {
      const { animate, stagger } = await import('animejs')

      if (!headerRef.value) return

      const items = headerRef.value.querySelectorAll('.header-item')

      await animate(items, {
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 400 * ANIM_SPEED,
        delay: stagger(80 * ANIM_SPEED),
        ease: 'outQuart',
      })
    }

    // Stream scraps (called after posts are done)
    const streamScraps = () => {
      if (isUnmounted) return
      if (scrapIndex >= allScraps.length) {
        isStreaming.value = false
        animateHeader()
        return
      }

      scrapIndex = Math.min(scrapIndex + batchSize, allScraps.length)
      loadedScrapCount.value = scrapIndex
      updateGraph(allPosts, allScraps.slice(0, scrapIndex))
      setTimeout(streamScraps, SCRAP_INTERVAL)
    }

    // Stream posts (called after maypoles are done)
    const streamPosts = () => {
      if (isUnmounted) return
      if (postIndex >= allPosts.length) {
        setTimeout(streamScraps, POST_TO_SCRAP_PAUSE)
        return
      }

      postIndex = Math.min(postIndex + batchSize, allPosts.length)
      loadedPostCount.value = postIndex
      updateGraph(allPosts.slice(0, postIndex), [])
      setTimeout(streamPosts, POST_INTERVAL)
    }

    // Phase 1: Animate maypole tags from top
    const animateMaypoles = async () => {
      const { animate, stagger } = await import('animejs')

      // Add maypole nodes to graph first
      nodes = topTags.map((t) => ({ ...t, isMaypole: true }))
      simulation.nodes(nodes)
      simulation.alpha(0).stop() // Pause simulation during anime animation

      // Animate each tag dropping into place with stagger
      const anim = animate(nodes, {
        x: (_el, i) => topTags[i].targetX,
        y: (_el, i) => topTags[i].targetY,
        duration: 1000 * ANIM_SPEED,
        delay: stagger(80 * ANIM_SPEED),
        ease: 'outExpo',
        onUpdate: () => draw(),
      })

      await anim

      // Lock maypoles in place
      nodes.forEach((n, i) => {
        n.fx = topTags[i].targetX
        n.fy = topTags[i].targetY
      })

      // Start simulation and stream posts
      simulation.alpha(0.5).restart()
      streamPosts()
    }

    // Start the animation sequence
    animateMaypoles()
  }

  onMounted(() => {
    watch(
      [posts, scraps],
      () => {
        // Render as soon as EITHER source has data. Previously this required
        // both posts AND scraps, so an empty /api/scraps response left the
        // entire graph blank even with hundreds of posts.
        if (posts.value.length || scraps.value.length) {
          nextTick(initGraph)
        }
      },
      { immediate: true }
    )

    // Redraw immediately when filters change
    watch([showPosts, showScraps, showTags], () => {
      draw()
    })

    // Named handler so it can actually be removed on unmount (an anonymous
    // arrow function here would leak — it can never be detached).
    resizeHandler = () => {
      if (!isStreaming.value) {
        nextTick(initGraph)
      }
    }
    window.addEventListener('resize', resizeHandler)
  })

  onBeforeUnmount(() => {
    isUnmounted = true
    simulation?.stop()
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  })
}
</script>

<template>
  <div
    class="threads-view relative"
    :style="{ height: `${CANVAS_HEIGHT_VH}vh` }"
  >
    <!-- Canvas behind everything, scrollable -->
    <ClientOnly>
      <div
        ref="containerRef"
        class="absolute inset-0 w-full h-full"
        style="z-index: 0"
      >
        <canvas
          ref="canvasRef"
          class="w-full h-full"
          role="img"
          aria-label="Graph of posts, scraps, and tags as interconnected nodes"
          @mousemove="handleMouseMove"
          @mouseleave="hoveredNode = null"
          @click="handleClick"
        />
      </div>
      <template #fallback>
        <div class="absolute inset-0 bg-zinc-950" />
      </template>
    </ClientOnly>

    <!-- UI overlay -->
    <header ref="headerRef" class="relative z-10 px-4 md:px-8 pt-8 pb-4">
      <h1 class="header-item font-serif text-2xl mb-1 opacity-0">Threads</h1>
      <p class="header-item font-mono text-xs text-zinc-500 opacity-0">
        <span
          :class="{
            'animate-pulse': isStreaming && loadedPostCount < filteredPostCount,
          }"
        >
          {{ loadedPostCount }}/{{ filteredPostCount }}
        </span>
        posts ·
        <span
          :class="{
            'animate-pulse':
              isStreaming && loadedScrapCount < filteredScrapCount,
          }"
        >
          {{ loadedScrapCount }}/{{ filteredScrapCount }}
        </span>
        scraps ·
        {{ graphData.nodes.filter((n) => n.type === 'tag').length }} tags ·
        {{ graphData.links.length }} connections
      </p>
      <p
        class="header-item font-mono text-3xs text-zinc-600 opacity-0 mt-1 hidden sm:block"
      >
        hover a node to peek · click to open · amber labels are topics
      </p>
      <div class="flex gap-4 mt-2 font-mono text-xs">
        <label
          class="header-item filter-item flex items-center gap-1 cursor-pointer select-none opacity-0"
        >
          <input v-model="showPosts" type="checkbox" class="accent-white" />
          <span :class="showPosts ? 'text-zinc-300' : 'text-zinc-600'">
            posts
          </span>
        </label>
        <label
          class="header-item filter-item flex items-center gap-1 cursor-pointer select-none opacity-0"
        >
          <input v-model="showScraps" type="checkbox" class="accent-red-400" />
          <span :class="showScraps ? 'text-red-400' : 'text-zinc-600'">
            scraps
          </span>
        </label>
        <label
          class="header-item filter-item flex items-center gap-1 cursor-pointer select-none opacity-0"
        >
          <input v-model="showTags" type="checkbox" class="accent-amber-400" />
          <span :class="showTags ? 'text-amber-400' : 'text-zinc-600'">
            tags
          </span>
        </label>
      </div>
    </header>

    <!-- Tooltip (fixed position) -->
    <div
      v-if="hoveredNode"
      ref="tooltipRef"
      class="tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-type">{{ hoveredNode.type }}</div>
      <div class="tooltip-title">{{ hoveredNode.title }}</div>
      <div v-if="hoveredNode.type === 'tag'" class="tooltip-tags">
        {{ hoveredNode.count }} items
      </div>
      <div v-else-if="hoveredNode.tags?.length" class="tooltip-tags">
        {{ hoveredNode.tags.slice(0, 4).join(' · ') }}
      </div>
    </div>

    <!-- Sidebar teleport -->
    <ClientOnly>
      <Teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="space-y-4">
          <div
            class="font-mono text-3xs uppercase tracking-wider text-zinc-500"
          >
            Graph
          </div>

          <!-- Stats -->
          <div class="space-y-1 font-mono text-3xs tabular-nums">
            <div class="flex justify-between">
              <span class="text-zinc-500">Posts</span>
              <span class="text-zinc-300">
                {{ loadedPostCount }}/{{ filteredPostCount }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Scraps</span>
              <span class="text-zinc-300">
                {{ loadedScrapCount }}/{{ filteredScrapCount }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Tags</span>
              <span class="text-zinc-300">
                {{ graphData.nodes.filter((n) => n.type === 'tag').length }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Links</span>
              <span class="text-zinc-300">{{ graphData.links.length }}</span>
            </div>
          </div>

          <!-- Filters -->
          <div class="space-y-1.5 pt-2 border-t border-zinc-800">
            <div
              class="font-mono text-3xs uppercase tracking-wider text-zinc-500 mb-1"
            >
              Filter
            </div>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="showPosts"
                type="checkbox"
                class="accent-white w-3 h-3"
              />
              <span
                class="font-mono text-3xs"
                :class="showPosts ? 'text-zinc-300' : 'text-zinc-600'"
              >
                Posts
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="showScraps"
                type="checkbox"
                class="accent-red-400 w-3 h-3"
              />
              <span
                class="font-mono text-3xs"
                :class="showScraps ? 'text-red-400' : 'text-zinc-600'"
              >
                Scraps
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="showTags"
                type="checkbox"
                class="accent-amber-400 w-3 h-3"
              />
              <span
                class="font-mono text-3xs"
                :class="showTags ? 'text-amber-400' : 'text-zinc-600'"
              >
                Tags
              </span>
            </label>
          </div>

          <!-- Streaming indicator -->
          <div
            v-if="isStreaming"
            class="font-mono text-3xs text-zinc-600 animate-pulse"
          >
            Loading nodes...
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.tooltip {
  position: fixed;
  background: rgba(9, 9, 11, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid #27272a;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 100;
  max-width: 200px;
  @apply font-mono;
}

.tooltip-type {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717a;
  margin-bottom: 2px;
}

.tooltip-title {
  @apply font-serif;
  font-size: 13px;
  color: #fafafa;
  line-height: 1.3;
}

.tooltip-tags {
  font-size: 10px;
  color: #a1a1aa;
  margin-top: 4px;
}
</style>

<!-- Global (un-scoped): on the threads route only, collapse the layout's
     surface elevation so the sidebar and the canvas read as one deep,
     full-bleed field instead of a boxed panel sitting on grey. -->
<style>
body:has(.threads-view) .min-h-screen {
  background-color: #08080a;
}
</style>
