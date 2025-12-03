<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import * as d3 from 'd3-force'
import { select } from 'd3-selection'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import chroma from 'chroma-js'

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
})

const svgRef = ref(null)
const containerRef = ref(null)
const width = ref(800)
const height = ref(600)
const hoveredRepo = ref(null)

// Prepare node data with blended colors
const nodes = computed(() => {
  return props.repos.map((repo) => {
    // Calculate blended color from language breakdown
    const color = getBlendedColor(repo.languages, repo.languageColor)

    // Size by disk usage (in KB), with minimum size
    const size = Math.max(repo.diskUsage || 100, 100)

    return {
      id: repo.name,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      language: repo.language,
      languages: repo.languages,
      diskUsage: repo.diskUsage,
      stars: repo.stats.stars,
      topics: repo.topics,
      color,
      size,
      // D3 force simulation will add x, y, vx, vy
    }
  })
})

// Create links between repos with shared topics
const links = computed(() => {
  const linksList = []
  const nodesByTopic = new Map()

  // Group nodes by topics
  nodes.value.forEach((node) => {
    node.topics.forEach((topic) => {
      if (!nodesByTopic.has(topic)) {
        nodesByTopic.set(topic, [])
      }
      nodesByTopic.get(topic).push(node)
    })
  })

  // Create links between nodes with shared topics
  nodesByTopic.forEach((topicNodes) => {
    if (topicNodes.length > 1) {
      for (let i = 0; i < topicNodes.length; i++) {
        for (let j = i + 1; j < topicNodes.length; j++) {
          linksList.push({
            source: topicNodes[i].id,
            target: topicNodes[j].id,
          })
        }
      }
    }
  })

  return linksList
})

// Format date for tooltip
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))

  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

// Blend language colors using chroma.js in LAB colorspace
function getBlendedColor(languages, fallbackColor) {
  if (!languages || Object.keys(languages).length === 0) {
    return fallbackColor || '#666666'
  }

  const languageColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Vue: '#41b883',
    Python: '#3572A5',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Unknown: '#666666',
  }

  // Get weighted colors based on byte count
  const totalBytes = Object.values(languages).reduce(
    (sum, bytes) => sum + bytes,
    0
  )
  const weightedColors = Object.entries(languages).map(([lang, bytes]) => ({
    color: languageColors[lang] || '#666666',
    weight: bytes / totalBytes,
  }))

  // If single language, return its color
  if (weightedColors.length === 1) {
    return weightedColors[0].color
  }

  // Blend colors in LAB colorspace
  const colors = weightedColors.map((w) => chroma(w.color))
  const weights = weightedColors.map((w) => w.weight)

  // Weighted average in LAB space
  const lab = colors.reduce(
    (acc, color, i) => {
      const [l, a, b] = color.lab()
      return [
        acc[0] + l * weights[i],
        acc[1] + a * weights[i],
        acc[2] + b * weights[i],
      ]
    },
    [0, 0, 0]
  )

  return chroma.lab(lab[0], lab[1], lab[2]).hex()
}

// Scale for node radius based on disk usage
const radiusScale = computed(() => {
  const maxSize = Math.max(...nodes.value.map((n) => n.size))
  return scaleSqrt().domain([0, maxSize]).range([5, 40])
})

// Prepare nodes with temporal data for positioning
const nodesWithDates = computed(() => {
  return nodes.value.map((node) => {
    const repo = props.repos.find((r) => r.name === node.id)
    return {
      ...node,
      createdAt: new Date(repo.createdAt),
      pushedAt: new Date(repo.pushedAt),
      updatedAt: new Date(repo.updatedAt),
    }
  })
})

// X scale: Creation date (older left, newer right)
const xScale = computed(() => {
  const dates = nodesWithDates.value.map((n) => n.createdAt.getTime())
  const extent = [Math.min(...dates), Math.max(...dates)]
  return scaleLinear()
    .domain(extent)
    .range([80, width.value - 80])
})

// Y scale: Last push date (older bottom, newer top)
const yScale = computed(() => {
  const dates = nodesWithDates.value.map((n) => n.pushedAt.getTime())
  const extent = [Math.min(...dates), Math.max(...dates)]
  return scaleLinear()
    .domain(extent)
    .range([height.value - 80, 80])
})

let simulation = null

onMounted(() => {
  initVisualization()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (simulation) {
    simulation.stop()
  }
})

function handleResize() {
  if (!containerRef.value) return
  width.value = containerRef.value.clientWidth
  height.value = Math.max(600, window.innerHeight - 200)

  if (simulation) {
    simulation.force(
      'center',
      d3.forceCenter(width.value / 2, height.value / 2)
    )
    simulation.alpha(0.3).restart()
  }
}

function initVisualization() {
  if (!svgRef.value) return

  width.value = containerRef.value?.clientWidth || 800
  height.value = Math.max(600, window.innerHeight - 200)

  const svg = select(svgRef.value)
  svg.selectAll('*').remove() // Clear existing

  // Create links group
  const linkGroup = svg.append('g').attr('class', 'links')

  // Create nodes group
  const nodeGroup = svg.append('g').attr('class', 'nodes')

  // Setup force simulation with temporal positioning
  simulation = d3
    .forceSimulation(nodesWithDates.value)
    .force(
      'link',
      d3
        .forceLink(links.value)
        .id((d) => d.id)
        .distance(50)
        .strength(0.05)
    )
    .force('charge', d3.forceManyBody().strength(-80))
    .force(
      'x',
      d3.forceX((d) => xScale.value(d.createdAt.getTime())).strength(0.3)
    )
    .force(
      'y',
      d3.forceY((d) => yScale.value(d.pushedAt.getTime())).strength(0.3)
    )
    .force(
      'collision',
      d3.forceCollide().radius((d) => radiusScale.value(d.size) + 2)
    )

  // Draw links
  const link = linkGroup
    .selectAll('line')
    .data(links.value)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke', '#27272a')
    .attr('stroke-opacity', 0.2)
    .attr('stroke-width', 1)

  // Add axis labels
  svg
    .append('text')
    .attr('x', width.value / 2)
    .attr('y', height.value - 20)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .attr('fill', '#71717a')
    .attr('font-size', '12px')
    .attr('font-family', 'monospace')
    .text('Created →')

  svg
    .append('text')
    .attr('x', 20)
    .attr('y', height.value / 2)
    .attr('text-anchor', 'middle')
    .attr('transform', `rotate(-90, 20, ${height.value / 2})`)
    .attr('class', 'axis-label')
    .attr('fill', '#71717a')
    .attr('font-size', '12px')
    .attr('font-family', 'monospace')
    .text('↑ Recently Active')

  // Draw nodes
  const node = nodeGroup
    .selectAll('circle')
    .data(nodesWithDates.value)
    .enter()
    .append('circle')
    .attr('r', (d) => radiusScale.value(d.size))
    .attr('fill', (d) => d.color)
    .attr('stroke', (d) =>
      d.stars > 0 ? chroma(d.color).brighten(1).hex() : '#3f3f46'
    )
    .attr('stroke-width', (d) => (d.stars > 0 ? 2 : 1))
    .attr('opacity', 0.85)
    .style('cursor', 'pointer')
    .on('mouseover', handleNodeHover)
    .on('mouseout', handleNodeLeave)
    .on('click', handleNodeClick)
    .call(
      d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    )

  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)

    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
  })
}

function handleNodeHover(event, d) {
  hoveredRepo.value = d

  // Brighten hovered node
  select(event.target).attr('opacity', 1).attr('stroke-width', 3)
}

function handleNodeLeave(event, d) {
  hoveredRepo.value = null

  // Reset node appearance
  select(event.target)
    .attr('opacity', 0.85)
    .attr('stroke-width', d.stars > 0 ? 2 : 1)
}

function handleNodeClick(event, d) {
  window.open(`/github/${d.id}`, '_self')
}

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged(event, d) {
  d.fx = event.x
  d.fy = event.y
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

// Watch for data changes
watch(
  () => props.repos,
  () => {
    if (simulation) {
      initVisualization()
    }
  }
)
</script>

<template>
  <div ref="containerRef" class="force-layout-container">
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      class="force-layout-svg"
    ></svg>

    <!-- Tooltip -->
    <div v-if="hoveredRepo" class="repo-tooltip">
      <h3 class="font-mono text-sm font-medium">{{ hoveredRepo.name }}</h3>
      <p class="text-xs text-zinc-500 line-clamp-2">
        {{ hoveredRepo.description }}
      </p>
      <div class="flex flex-col gap-1 mt-2 text-xs font-mono">
        <div class="flex items-center gap-2">
          <span v-if="hoveredRepo.stars > 0">⭐ {{ hoveredRepo.stars }}</span>
          <span>{{ hoveredRepo.language }}</span>
          <span v-if="hoveredRepo.diskUsage">
            {{ Math.round(hoveredRepo.diskUsage / 1024) }} MB
          </span>
        </div>
        <div class="text-zinc-400">
          <span v-if="hoveredRepo.createdAt">
            Created {{ formatDate(hoveredRepo.createdAt) }}
          </span>
          <span v-if="hoveredRepo.pushedAt" class="ml-2">
            • Active {{ formatDate(hoveredRepo.pushedAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-title">Visual Encoding</div>
      <div class="legend-item">
        <span class="legend-label">X</span>
        <span>Creation date</span>
      </div>
      <div class="legend-item">
        <span class="legend-label">Y</span>
        <span>Recent activity</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot legend-dot-small"></div>
        <span>Size = Disk usage</span>
      </div>
      <div class="legend-item">
        <div class="legend-color-blend">
          <div class="color-dot" style="background: #f1e05a"></div>
          <div class="color-dot" style="background: #41b883"></div>
        </div>
        <span>Color = Language mix</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot legend-dot-starred"></div>
        <span>Glow = Stars</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.force-layout-container {
  @apply relative w-full;
  @apply bg-white dark:bg-zinc-950;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
}

.force-layout-svg {
  @apply block;
}

.repo-tooltip {
  @apply absolute top-4 right-4 p-3;
  @apply bg-white dark:bg-zinc-900;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply max-w-xs;
  @apply pointer-events-none;
  @apply shadow-lg;
}

.legend {
  @apply absolute bottom-4 left-4;
  @apply flex flex-col gap-2 p-3;
  @apply bg-white/90 dark:bg-zinc-900/90 backdrop-blur;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply text-xs font-mono;
}

.legend-title {
  @apply font-medium text-zinc-900 dark:text-zinc-100 mb-1;
  @apply border-b border-zinc-200 dark:border-zinc-800 pb-1;
}

.legend-item {
  @apply flex items-center gap-2;
}

.legend-label {
  @apply w-4 h-4 flex items-center justify-center;
  @apply bg-zinc-200 dark:bg-zinc-700 rounded;
  @apply font-bold text-[10px];
}

.legend-dot {
  @apply rounded-full;
  @apply bg-zinc-400 dark:bg-zinc-600;
}

.legend-dot-small {
  @apply w-2 h-2;
}

.legend-dot-large {
  @apply w-4 h-4;
}

.legend-dot-starred {
  @apply w-3 h-3;
  @apply ring-2 ring-yellow-500;
}

.legend-color-blend {
  @apply flex items-center gap-0.5;
}

.color-dot {
  @apply w-2 h-2 rounded-full;
}
</style>
