<script setup>
import * as d3 from 'd3'

// Convert PGP fingerprint to visual pattern
const fingerprint = 'E2078E653FE389CD'
const blocks = fingerprint.match(/.{1,2}/g)

// Create a more subtle color scale that works with your theme
const colorScale = d3.scaleSequential()
  .domain([0, blocks.length])
  .interpolator(d3.interpolateHslLong('hsl(200, 30%, 40%)', 'hsl(340, 30%, 40%)'))

// Create unique visual pattern from fingerprint
onMounted(() => {
  const svg = d3.select('#pgp-fingerprint')

  // Clear any existing content
  svg.selectAll('*').remove()

  // Create a group for animation
  const group = svg.append('g')

  // Add blocks
  blocks.forEach((block, i) => {
    const x = (i * 24)

    // Convert hex to decimal for height variation
    const value = parseInt(block, 16)
    const height = 20 + (value % 12)

    group.append('rect')
      .attr('x', x)
      .attr('y', (32 - height) / 2)
      .attr('width', 20)
      .attr('height', height)
      .attr('fill', colorScale(i))
      .attr('rx', 2)
      .attr('opacity', 0)
      .transition()
      .delay(i * 100)
      .duration(500)
      .attr('opacity', 0.8)
  })

  // Add subtle animation on hover
  svg.on('mouseover', () => {
    group.selectAll('rect')
      .transition()
      .duration(500)
      .attr('height', (_, i) => {
        const value = parseInt(blocks[i], 16)
        return 20 + (value % 12)
      })
      .attr('opacity', 1)
  })

  svg.on('mouseout', () => {
    group.selectAll('rect')
      .transition()
      .duration(500)
      .attr('height', (_, i) => {
        const value = parseInt(blocks[i], 16)
        return 20 + (value % 12)
      })
      .attr('opacity', 0.8)
  })
})
</script>

<template>
  <!-- Component is now just a slot for the SVG -->
  <slot></slot>
</template>