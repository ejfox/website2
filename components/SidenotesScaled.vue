<template>
  <div ref="container" :style="containerStyles" v-html="html" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps(['html'])
const container = ref()

// Scales for responsive layout
const scales = {
  // Map viewport width to margin width
  marginWidth: d3
    .scaleLinear()
    .domain([1280, 1920])
    .range([280, 400])
    .clamp(true),

  // Map scroll position to curve tension
  curveTension: d3.scaleLinear().domain([0, 1000]).range([0.1, 0.5]),

  // Map footnote index to curve sag
  curveSag: d3.scalePow().exponent(0.7).domain([0, 10]).range([10, 40]),

  // Map distance to opacity
  curveOpacity: d3
    .scaleLinear()
    .domain([100, 500])
    .range([0.3, 0.1])
    .clamp(true),

  // Collision-free positioning
  noteSpacing: d3
    .scaleOrdinal()
    .domain(d3.range(20))
    .range(d3.range(0, 800, 40)) // 40px minimum spacing
}

const containerStyles = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `minmax(0, 65ch) ${scales.marginWidth(window.innerWidth)}px`,
  gap: '2rem',
  position: 'relative'
}))

onMounted(() => {
  const el = container.value
  if (!el) return

  // SVG for curves
  const svg = d3
    .select(el)
    .append('svg')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('inset', '0')

  // Footnote positioning with collision detection
  const refs = Array.from(el.querySelectorAll('sup.footnote-ref'))
  const notes = Array.from(el.querySelectorAll('.footnotes li'))

  // Build position scale based on actual content
  const yScale = d3
    .scaleLinear()
    .domain([0, refs.length - 1])
    .range([refs[0]?.offsetTop || 0, refs[refs.length - 1]?.offsetTop || 1000])

  // Process each footnote
  const connections = refs
    .map((ref, i) => {
      const note = notes[i]
      if (!note) return null

      // Calculate positions using scales
      const idealY = yScale(i)
      const actualY = scales.noteSpacing(i % 20) // Modulo for repeating pattern

      // Position note
      note.style.gridColumn = '2'
      note.style.position = 'relative'
      note.style.top = `${actualY}px`

      // Return connection data
      return {
        ref: ref.getBoundingClientRect(),
        note: note.getBoundingClientRect(),
        index: i,
        distance: 0
      }
    })
    .filter(Boolean)

  // Calculate distances for opacity
  connections.forEach((conn) => {
    conn.distance = Math.abs(conn.note.left - conn.ref.right)
  })

  // Draw curves using scales
  const curve = d3
    .line()
    .curve(d3.curveCardinal.tension(scales.curveTension(window.scrollY)))

  connections.forEach((conn) => {
    const c = el.getBoundingClientRect()
    const sag = scales.curveSag(conn.index)
    const opacity = scales.curveOpacity(conn.distance)

    svg
      .append('path')
      .attr(
        'd',
        curve([
          [conn.ref.right - c.left, conn.ref.top - c.top + conn.ref.height / 2],
          [
            (conn.ref.right - c.left + conn.note.left - c.left) / 2,
            conn.ref.top - c.top + sag
          ],
          [conn.note.left - c.left, conn.note.top - c.top + 10]
        ])
      )
      .style('stroke', '#a1a1aa')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('opacity', opacity)
      .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)')
      .on('mouseover', function () {
        d3.select(this)
          .style('opacity', Math.min(opacity * 3, 1))
          .style('stroke', '#3b82f6')
          .style('stroke-width', 2)
      })
      .on('mouseout', function () {
        d3.select(this)
          .style('opacity', opacity)
          .style('stroke', '#a1a1aa')
          .style('stroke-width', 1)
      })
  })

  // Dynamic updates on scroll
  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Update curve tension based on scroll
          const newTension = scales.curveTension(window.scrollY)
          svg
            .selectAll('path')
            .transition()
            .duration(100)
            .attr('d', function (d, i) {
              const conn = connections[i]
              if (!conn) return ''
              const sag = scales.curveSag(i) * (1 + window.scrollY / 1000)
              return curve([
                [
                  conn.ref.right - c.left,
                  conn.ref.top - c.top + conn.ref.height / 2
                ],
                [
                  (conn.ref.right - c.left + conn.note.left - c.left) / 2,
                  conn.ref.top - c.top + sag
                ],
                [conn.note.left - c.left, conn.note.top - c.top + 10]
              ])
            })
          ticking = false
        })
        ticking = true
      }
    },
    { passive: true }
  )
})
</script>
