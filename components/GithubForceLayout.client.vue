<!--
  @file GithubForceLayout.client.vue
  @description D3 force-directed layout visualization of GitHub repositories by creation/update time and size
  @props repos: Array - Array of repository objects with language, stats, dates, diskUsage
-->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3-force'
import { select } from 'd3-selection'
import { scaleSqrt, scaleTime } from 'd3-scale'
import { useLanguageColors } from '~/composables/useLanguageColors'

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
})

const { getColor } = useLanguageColors()
const containerRef = ref(null)
const svgRef = ref(null)
const { width } = useElementSize(containerRef)
const height = 450

// Simple tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  repo: null,
})

// Prepare nodes - simple data only, exclude forks
const nodes = computed(() => {
  return props.repos
    .filter((repo) => !repo.fork) // Hide forks of other repos
    .map((repo) => ({
      id: repo.name,
      name: repo.name,
      createdAt: repo.createdAt ? new Date(repo.createdAt) : new Date(),
      pushedAt: repo.pushedAt ? new Date(repo.pushedAt) : new Date(),
      diskUsage: repo.diskUsage || 100,
      stars: repo.stats?.stars || 0,
      color: getColor(repo.language),
      language: repo.language || 'Unknown',
    }))
})

// Scales - increased padding for collision space
const xScale = computed(() => {
  const dates = nodes.value.map((n) => n.createdAt)
  const min = new Date(Math.min(...dates))
  const max = new Date(Math.max(...dates))
  const padding = width.value * 0.1 // Increased from 0.05
  return scaleTime()
    .domain([min, max])
    .range([padding, width.value - padding])
})

const yScale = computed(() => {
  const dates = nodes.value.map((n) => n.pushedAt)
  const min = new Date(Math.min(...dates))
  const max = new Date(Math.max(...dates))
  const padding = height * 0.12 // Increased from 0.05
  return scaleTime()
    .domain([min, max])
    .range([height - padding, padding])
})

const radiusScale = computed(() => {
  const sizes = nodes.value.map((n) => n.diskUsage)
  const min = Math.min(...sizes, 100)
  const max = Math.max(...sizes, 1000)
  // Reduced from 3.6-52.5 for better spacing
  return scaleSqrt().domain([min, max]).range([3, 40])
})

function initVisualization() {
  if (!svgRef.value || width.value === 0) return

  const svg = select(svgRef.value)
  svg.selectAll('*').remove()

  // Initialize node positions based on data
  const nodeData = nodes.value.map((n) => ({
    ...n,
    x: xScale.value(n.createdAt),
    y: yScale.value(n.pushedAt),
  }))

  // Refined force simulation - no touching circles
  const simulation = d3
    .forceSimulation(nodeData)
    .force('x', d3.forceX((d) => xScale.value(d.createdAt)).strength(0.4))
    .force('y', d3.forceY((d) => yScale.value(d.pushedAt)).strength(0.4))
    .force(
      'collide',
      d3
        .forceCollide((d) => radiusScale.value(d.diskUsage) + 8)
        .strength(1)
        .iterations(6)
    )
    .alphaDecay(0.005)
    .velocityDecay(0.4)
    .stop()

  // Run simulation synchronously - more iterations for better separation
  for (let i = 0; i < 500; i++) simulation.tick()

  // Clamp nodes within bounds with buffer zone (prevents edge touching)
  nodeData.forEach((d) => {
    const r = radiusScale.value(d.diskUsage)
    const bufferX = r + 12 // Extra space at edges
    const bufferY = r + 12
    d.x = Math.max(bufferX, Math.min(width.value - bufferX, d.x))
    d.y = Math.max(bufferY, Math.min(height - bufferY, d.y))
  })

  // Draw circles - brutalist
  const circles = svg
    .append('g')
    .selectAll('circle')
    .data(nodeData)
    .join('circle')
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', (d) => radiusScale.value(d.diskUsage))
    .attr('fill', (d) => d.color)
    .attr('opacity', 0.7)
    .style('cursor', 'pointer')

  // Nerd Font devicons - generate from codepoints
  const devicons = {
    JavaScript: String.fromCodePoint(0xe781),
    TypeScript: String.fromCodePoint(0xe8ca),
    Vue: String.fromCodePoint(0xe8dc),
    Python: String.fromCodePoint(0xe73c),
    Go: String.fromCodePoint(0xe724),
    Rust: String.fromCodePoint(0xe7a8),
    Java: String.fromCodePoint(0xe738),
    Ruby: String.fromCodePoint(0xe739),
    PHP: String.fromCodePoint(0xe73d),
    Swift: String.fromCodePoint(0xe755),
    Kotlin: String.fromCodePoint(0xe81b),
    C: String.fromCodePoint(0xe771),
    'C++': String.fromCodePoint(0xe7a3),
    Shell: String.fromCodePoint(0xf489),
    HTML: String.fromCodePoint(0xe736),
    CSS: String.fromCodePoint(0xe749),
    Markdown: String.fromCodePoint(0xe73e),
    Lua: String.fromCodePoint(0xe826),
  }

  svg
    .append('g')
    .selectAll('text')
    .data(nodeData)
    .join('text')
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', '"Symbols Nerd Font Mono", monospace')
    .attr('font-size', (d) => {
      const r = radiusScale.value(d.diskUsage)
      return r > 15 ? 14 : r > 10 ? 10 : r > 6 ? 7 : 0
    })
    .attr('fill', '#000')
    .attr('opacity', 0.3)
    .attr('pointer-events', 'none')
    .text((d) => {
      const r = radiusScale.value(d.diskUsage)
      if (r < 6) return ''
      return devicons[d.language] || ''
    })

  circles
    .on('mouseenter', (event, d) => {
      const w = 180
      const h = 60
      let x = event.clientX + 12
      let y = event.clientY + 12

      if (x + w > window.innerWidth) x = event.clientX - w - 12
      if (y + h > window.innerHeight) y = event.clientY - h - 12

      tooltip.value = { show: true, x, y, repo: d }
      select(event.target).attr('opacity', 0.95)
    })
    .on('mouseleave', (event) => {
      tooltip.value.show = false
      select(event.target).attr('opacity', 0.7)
    })
    .on('click', (event, d) => {
      window.location.href = `/github/${d.id}`
    })

  // Legend
  const legend = svg.append('g').attr('class', 'legend')

  // Axis labels
  legend
    .append('text')
    .attr('x', 40)
    .attr('y', height - 12)
    .attr('font-family', 'monospace')
    .attr('font-size', 9)
    .attr('fill', 'currentColor')
    .attr('opacity', 0.4)
    .text('created →')

  legend
    .append('text')
    .attr('x', 12)
    .attr('y', 40)
    .attr('font-family', 'monospace')
    .attr('font-size', 9)
    .attr('fill', 'currentColor')
    .attr('opacity', 0.4)
    .attr('transform', `rotate(-90, 12, 40)`)
    .attr('text-anchor', 'end')
    .text('updated →')

  // Size legend
  const legendX = width.value - 110
  const legendY = height - 100

  legend
    .append('text')
    .attr('x', legendX)
    .attr('y', legendY - 8)
    .attr('font-family', 'monospace')
    .attr('font-size', 9)
    .attr('fill', 'currentColor')
    .attr('opacity', 0.35)
    .text('disk usage')

  // Size samples with actual data distribution
  const allSizes = nodes.value.map((n) => n.diskUsage)
  const maxSize = Math.max(...allSizes)
  const sampleSizes = [1000, maxSize / 4, maxSize / 2].filter((s) => s > 0)

  sampleSizes.forEach((size, i) => {
    const r = radiusScale.value(size)
    const cx = legendX + 20
    const spacing = i === 0 ? 15 : sampleSizes[i - 1] > 10000 ? 25 : 18
    const cy = legendY + 15 + i * spacing

    legend
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', r)
      .attr('fill', 'currentColor')
      .attr('opacity', 0.12)

    legend
      .append('text')
      .attr('x', cx + r + 5)
      .attr('y', cy + 3)
      .attr('font-family', 'monospace')
      .attr('font-size', 8)
      .attr('fill', 'currentColor')
      .attr('opacity', 0.35)
      .text(size >= 1024 ? Math.round(size / 1024) + 'MB' : size + 'KB')
  })
}

onMounted(() => {
  setTimeout(initVisualization, 300)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" :width="width" :height="height" class="w-full" />

    <!-- Tooltip - brutalist minimal -->
    <div
      v-if="tooltip.show && tooltip.repo"
      class="fixed z-50 pointer-events-none bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-100 px-2 py-1 text-[10px] font-mono"
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px',
      }"
    >
      <div class="font-medium text-zinc-900 dark:text-zinc-100">
        {{ tooltip.repo.name }}
      </div>
      <div class="text-zinc-500 flex items-center gap-0.5">
        <span
          class="w-1 h-1 inline-block"
          :style="{ backgroundColor: tooltip.repo.color }"
        />
        <span>{{ tooltip.repo.language }}</span>
        <span>·</span>
        <span>
          {{
            tooltip.repo.diskUsage >= 1024
              ? Math.round(tooltip.repo.diskUsage / 1024) + 'MB'
              : tooltip.repo.diskUsage + 'KB'
          }}
        </span>
        <template v-if="tooltip.repo.stars > 0">
          <span>·</span>
          <span>{{ tooltip.repo.stars }}★</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://www.nerdfonts.com/assets/css/webfont.css');
</style>
