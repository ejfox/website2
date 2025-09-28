<template>
  <div ref="container" v-html="html" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as d3 from 'd3'

const props = defineProps(['html'])
const container = ref()

onMounted(() => {
  const el = container.value
  if (!el) return

  // Move footnotes to margin with CSS Grid
  el.style.display = 'grid'
  el.style.gridTemplateColumns = '65ch 300px'
  el.style.gap = '2rem'

  // One-pass: create curves for all footnotes
  const curve = d3.line().curve(d3.curveCardinal.tension(0.3))

  const svg = d3
    .select(el)
    .append('svg')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('inset', '0')

  el.querySelectorAll('sup.footnote-ref').forEach((ref, i) => {
    const note = el.querySelector(`#fn${i + 1}`)
    if (!note) return

    // Position note in margin
    note.style.gridColumn = '2'
    note.style.gridRow = `span ${Math.ceil(ref.offsetTop / 40)}`

    // Get positions
    const r = ref.getBoundingClientRect()
    const n = note.getBoundingClientRect()
    const c = el.getBoundingClientRect()

    // Draw curve
    svg
      .append('path')
      .attr(
        'd',
        curve([
          [r.right - c.left, r.top - c.top + r.height / 2],
          [(r.right - c.left + n.left - c.left) / 2, r.top - c.top + 20],
          [n.left - c.left, n.top - c.top + 10]
        ])
      )
      .style('stroke', '#a1a1aa')
      .style('stroke-width', 1)
      .style('fill', 'none')
      .style('opacity', 0.2)
      .style('transition', 'all 0.2s')
      .on('mouseover', function () {
        d3.select(this).style('opacity', 0.5).style('stroke', '#3b82f6')
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.2).style('stroke', '#a1a1aa')
      })
  })
})
</script>
