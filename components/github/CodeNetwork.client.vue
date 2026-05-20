<!--
  @file CodeNetwork.client.vue
  @description d3-force visualization of a code function-call graph (from ejfox/code-network-gen)
  @props nodes: Array - { id, label, type, lines, file }
  @props edges: Array - { source, target, type }
-->
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3'
import { useElementSize } from '@vueuse/core'
import { useLanguageColors } from '~/composables/useLanguageColors'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
})

const container = ref(null)
const svgWrap = ref(null)
const { width } = useElementSize(container)
const height = 480
const hovered = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const { getColor } = useLanguageColors()

const fileColor = (file) => getColor(file || 'Unknown')

const MAX_PATH = 60
function displayPath(node) {
  // Prefer resolved full path (single match); fall back to basename or list
  if (node.filePath) {
    const p = node.filePath
    if (p.length <= MAX_PATH) return p
    // Middle-truncate: keep start dir + final segments
    const parts = p.split('/')
    const last = parts.pop()
    const first = parts.shift() || ''
    let out = `${first}/…/${last}`
    while (
      parts.length &&
      out.length + parts[parts.length - 1].length + 1 <= MAX_PATH
    ) {
      out = `${first}/…/${parts.pop()}/${out.split('/…/').pop()}`
    }
    return out.length <= MAX_PATH ? out : `…/${last.slice(-MAX_PATH + 2)}`
  }
  if (node.filePaths?.length) {
    return `${node.file} (${node.filePaths.length} locations)`
  }
  return node.file
}

// Synthesize any missing nodes referenced by edges (CSV omits :global anchors).
// Then compute a "call depth" for each node — distance from the nearest :global root
// via BFS — so entry points stay on the left and deeply-called leaves drift right.
const enriched = computed(() => {
  const nodes = props.nodes.map((n) => ({ ...n }))
  const ids = new Set(nodes.map((n) => n.id))
  for (const e of props.edges) {
    for (const ref of [e.source, e.target]) {
      if (!ids.has(ref)) {
        ids.add(ref)
        const file = ref.split(':')[0]
        nodes.push({
          id: ref,
          label: ref.endsWith(':global') ? `${file} (root)` : ref,
          type: ref.endsWith(':global') ? 'global' : 'function',
          lines: '',
          file,
        })
      }
    }
  }

  // Forward adjacency: src -> [targets]
  const out = new Map()
  for (const n of nodes) out.set(n.id, [])
  for (const e of props.edges) out.get(e.source)?.push(e.target)

  // Multi-source BFS from every :global node
  const depth = new Map()
  const queue = []
  for (const n of nodes) {
    if (n.type === 'global') {
      depth.set(n.id, 0)
      queue.push(n.id)
    }
  }
  while (queue.length) {
    const cur = queue.shift()
    const d = depth.get(cur)
    for (const nxt of out.get(cur) || []) {
      if (!depth.has(nxt)) {
        depth.set(nxt, d + 1)
        queue.push(nxt)
      }
    }
  }
  const maxDepth = Math.max(0, ...depth.values())
  for (const n of nodes) {
    const d = depth.has(n.id) ? depth.get(n.id) : maxDepth + 1
    // 0..1 normalized; orphans live just past the max-depth band so they cluster on the right
    n.depthRatio = maxDepth + 1 === 0 ? 0 : d / (maxDepth + 1)
  }

  return { nodes, edges: props.edges.map((e) => ({ ...e })) }
})

const simNodes = computed(() => enriched.value.nodes)
const simEdges = computed(() => enriched.value.edges)

const positionedNodes = ref([])
const positionedEdges = ref([])
let simulation = null

function runSim() {
  if (simulation) simulation.stop()
  if (!simNodes.value.length || !width.value) return

  const w = width.value
  const h = height

  const padX = 32
  const usableX = Math.max(1, w - padX * 2)

  simulation = forceSimulation(simNodes.value)
    .force(
      'link',
      forceLink(simEdges.value)
        .id((d) => d.id)
        .distance(32)
        .strength(0.5)
    )
    .force('charge', forceManyBody().strength(-45))
    .force('center', forceCenter(w / 2, h / 2))
    .force('collide', forceCollide(6))
    // X target driven by call depth: roots (left) → leaves (right)
    .force(
      'x',
      forceX((d) => padX + (d.depthRatio ?? 0.5) * usableX).strength(0.18)
    )
    // Strong Y pull keeps orphans from drifting to the top/bottom edges
    .force('y', forceY(h / 2).strength(0.18))
    .alpha(1)
    .alphaDecay(0.04)

  simulation.on('tick', () => {
    positionedNodes.value = simNodes.value.map((n) => ({
      ...n,
      x: Math.max(8, Math.min(w - 8, n.x ?? w / 2)),
      y: Math.max(8, Math.min(h - 8, n.y ?? h / 2)),
    }))
    positionedEdges.value = simEdges.value.map((e) => ({
      source: e.source,
      target: e.target,
      x1: e.source.x,
      y1: e.source.y,
      x2: e.target.x,
      y2: e.target.y,
    }))
  })
}

watch([() => props.nodes, width], runSim, { immediate: true })
onBeforeUnmount(() => simulation?.stop())

// `index.*` files are the public face of their dir — promote them so they
// pop out of the cluster a bit.
const isIndexFile = (n) => /(?:^|\/)index\./i.test(n.file || '')
const baseRadius = (n) => (n.type === 'global' ? 5 : 3.5)
const nodeRadius = (n) => (isIndexFile(n) ? baseRadius(n) * 1.5 : baseRadius(n))

const stats = computed(() => {
  const fileSet = new Set(simNodes.value.map((n) => n.file))
  return {
    nodes: simNodes.value.length,
    edges: simEdges.value.length,
    files: fileSet.size,
  }
})

// Split nodes so index files render last (on top of the cluster) and we can
// give them a halo without touching the regular circles.
const regularNodes = computed(() =>
  positionedNodes.value.filter((n) => !isIndexFile(n))
)
const indexNodes = computed(() =>
  positionedNodes.value.filter((n) => isIndexFile(n))
)

function onNodeEnter(node, evt) {
  hovered.value = node
  updateTooltip(evt)
}

function onNodeLeave() {
  hovered.value = null
}

function updateTooltip(evt) {
  if (!hovered.value || !svgWrap.value) return
  const rect = svgWrap.value.getBoundingClientRect()
  tooltipPos.value = {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  }
}

// Position the floating tooltip so it never overflows the SVG bounds.
const tooltipStyle = computed(() => {
  const offset = 12
  const wMax = width.value || 0
  const left = tooltipPos.value.x + offset
  const top = tooltipPos.value.y + offset
  // Flip to the other side of the cursor near the right/bottom edges.
  const flipX = left > wMax - 220
  const flipY = top > height - 60
  return {
    left: (flipX ? tooltipPos.value.x - offset : left) + 'px',
    top: (flipY ? tooltipPos.value.y - offset : top) + 'px',
    transform:
      (flipX ? 'translateX(-100%) ' : '') + (flipY ? 'translateY(-100%)' : ''),
  }
})
</script>

<template>
  <div ref="container" class="w-full">
    <div class="flex items-baseline justify-between mb-1">
      <span class="font-mono text-3xs uppercase tracking-wider text-zinc-500">
        Function-call graph
      </span>
      <span class="font-mono text-3xs tabular-nums text-zinc-500">
        {{ stats.files }} files · {{ stats.nodes }} nodes · {{ stats.edges }}
        edges
      </span>
    </div>
    <div
      ref="svgWrap"
      class="relative border border-zinc-200 dark:border-zinc-800"
      @mousemove="updateTooltip"
    >
      <svg v-if="width" :width="width" :height="height" class="block">
        <g class="edges" stroke-opacity="0.35">
          <line
            v-for="(e, i) in positionedEdges"
            :key="`e-${i}`"
            :x1="e.x1"
            :y1="e.y1"
            :x2="e.x2"
            :y2="e.y2"
            stroke="currentColor"
            class="text-zinc-400 dark:text-zinc-600"
            stroke-width="0.5"
          />
        </g>
        <g class="nodes">
          <circle
            v-for="n in regularNodes"
            :key="n.id"
            :cx="n.x"
            :cy="n.y"
            :r="nodeRadius(n)"
            :fill="fileColor(n.file)"
            :stroke="hovered?.id === n.id ? 'currentColor' : 'none'"
            stroke-width="1"
            class="text-zinc-900 dark:text-zinc-100 cursor-pointer"
            @mouseenter="onNodeEnter(n, $event)"
            @mouseleave="onNodeLeave"
          />
        </g>
        <!-- index.* files: halo + slightly heavier stroke, rendered on top -->
        <g class="nodes-index">
          <template v-for="n in indexNodes" :key="n.id">
            <circle
              :cx="n.x"
              :cy="n.y"
              :r="nodeRadius(n) * 1.9"
              :fill="fileColor(n.file)"
              fill-opacity="0.18"
              class="pointer-events-none"
            />
            <circle
              :cx="n.x"
              :cy="n.y"
              :r="nodeRadius(n)"
              :fill="fileColor(n.file)"
              stroke="currentColor"
              :stroke-width="hovered?.id === n.id ? 1.5 : 0.75"
              class="text-zinc-900 dark:text-zinc-100 cursor-pointer"
              @mouseenter="onNodeEnter(n, $event)"
              @mouseleave="onNodeLeave"
            />
          </template>
        </g>
      </svg>

      <!-- Floating tooltip anchored near the cursor -->
      <div
        v-if="hovered"
        class="pointer-events-none absolute z-10 px-2 py-1 font-mono text-3xs leading-snug bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-sm whitespace-nowrap"
        :style="tooltipStyle"
      >
        <div class="text-zinc-500">{{ displayPath(hovered) }}</div>
        <div class="text-zinc-900 dark:text-zinc-100">
          {{ hovered.label }}
          <span v-if="hovered.lines" class="text-zinc-500 ml-1">
            {{ hovered.lines }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
