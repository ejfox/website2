<template>
  <div ref="containerRef" class="commit-matrix" :style="{ height: `${height}px` }">
    <div ref="deckRef" class="deck-container" />
  </div>
</template>

<script setup>
import { Deck } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import { useWindowSize, useRafFn } from '@vueuse/core'
import { createNoise2D } from 'simplex-noise'

const props = defineProps({
  commits: {
    type: Array,
    required: true,
  },
  height: {
    type: Number,
    default: 7777,
  },
})

const containerRef = ref(null)
const deckRef = ref(null)
const deckInstance = ref(null)
const { width: windowWidth } = useWindowSize()

const width = computed(() => Math.min(windowWidth.value, 1200))

// Perlin noise generator
const noise2D = createNoise2D()

// Language colors (matching GitHub + making them pop)
const languageColors = {
  JavaScript: [241, 224, 90, 200],
  TypeScript: [49, 120, 198, 200],
  Vue: [65, 184, 131, 200],
  Python: [53, 114, 165, 200],
  CSS: [86, 61, 124, 200],
  HTML: [227, 76, 38, 200],
  Shell: [137, 224, 81, 200],
  Go: [0, 173, 216, 200],
  Rust: [222, 165, 132, 200],
  Ruby: [204, 52, 45, 200],
  Java: [176, 114, 25, 200],
  default: [139, 148, 158, 180],
}

// Base positions (calculated once)
const basePositions = computed(() => {
  if (!props.commits || props.commits.length === 0) return []

  // Sort chronologically
  const sorted = [...props.commits].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  const startDate = new Date(sorted[0].date)
  const endDate = new Date(sorted[sorted.length - 1].date)
  const timeRange = endDate - startDate

  // Group by repo for x-axis clustering
  const repos = [...new Set(sorted.map((c) => c.repo))].sort()
  const repoIndex = Object.fromEntries(repos.map((r, i) => [r, i]))
  const repoCount = repos.length

  return sorted.map((commit, idx) => {
    const date = new Date(commit.date)
    const timeProgress = (date - startDate) / timeRange

    // Y position = time (0 = oldest at top, 1 = newest at bottom)
    const baseY = timeProgress * props.height

    // X position = repo lane
    const repoLane = repoIndex[commit.repo] / Math.max(repoCount - 1, 1)
    const baseX = repoLane * width.value * 0.85 + width.value * 0.075

    // Size varies slightly
    const size = 3 + Math.random() * 4

    // Get language color
    const language = commit.language || 'default'
    const color = languageColors[language] || languageColors.default

    // Unique seed for this commit
    const seed = idx * 0.01

    return {
      basePosition: [baseX, baseY],
      size,
      color,
      repo: commit.repo,
      message: commit.message,
      date: commit.date,
      language,
      seed,
      idx,
    }
  })
})

// Animated positions with Perlin noise + simplified boids
const animatedPositions = ref([])
const time = ref(0)

// Update animation with flocking behavior
const updateAnimation = () => {
  time.value += 0.003 // Slow time increment

  const points = basePositions.value
  const newPositions = []

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const [baseX, baseY] = point.basePosition

    // Perlin noise for organic drift
    const noiseScale = 0.002
    const noiseX = noise2D(baseX * noiseScale, time.value) * 12
    const noiseY = noise2D(baseY * noiseScale, time.value + 100) * 12

    // Global flow pattern (like wind)
    const flowAngle = time.value * 0.3 + baseY * 0.0005
    const flowX = Math.sin(flowAngle) * 6
    const flowY = Math.cos(flowAngle) * 3

    // Simplified boid behavior (only check nearby points every N frames)
    let boidX = 0
    let boidY = 0

    if (i % 20 === Math.floor(time.value * 10) % 20) {
      // Check neighbors
      const neighborRadius = 100
      let neighbors = 0

      for (let j = i - 10; j < i + 10; j++) {
        if (j < 0 || j >= points.length || j === i) continue

        const neighbor = points[j]
        const [nx, ny] = neighbor.basePosition
        const dx = nx - baseX
        const dy = ny - baseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < neighborRadius) {
          // Cohesion + alignment
          boidX += dx * 0.01
          boidY += dy * 0.01
          neighbors++
        }
      }

      if (neighbors > 0) {
        boidX /= neighbors
        boidY /= neighbors
      }
    }

    // Combine all forces
    const finalX = baseX + noiseX + flowX + boidX
    const finalY = baseY + noiseY + flowY + boidY

    newPositions.push({
      ...point,
      position: [finalX, finalY],
    })
  }

  animatedPositions.value = newPositions
}

// Commit points for deck.gl
const commitPoints = computed(() => animatedPositions.value)

// Initialize deck.gl
const initDeck = () => {
  if (!deckRef.value || deckInstance.value) return

  deckInstance.value = new Deck({
    canvas: deckRef.value,
    width: width.value,
    height: props.height,
    initialViewState: {
      target: [width.value / 2, props.height / 2, 0],
      zoom: 0,
    },
    controller: false,
    layers: [
      new ScatterplotLayer({
        id: 'commits',
        data: commitPoints.value,
        pickable: true,
        opacity: 0.8,
        stroked: false,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 2,
        radiusMaxPixels: 8,
        getPosition: (d) => d.position,
        getRadius: (d) => d.size,
        getFillColor: (d) => d.color,
        updateTriggers: {
          getPosition: time.value, // Force update on animation
        },
      }),
    ],
  })
}

// Update deck when data changes
watch(
  [commitPoints, width],
  () => {
    if (!deckInstance.value) return

    deckInstance.value.setProps({
      width: width.value,
      height: props.height,
      layers: [
        new ScatterplotLayer({
          id: 'commits',
          data: commitPoints.value,
          pickable: true,
          opacity: 0.8,
          stroked: false,
          filled: true,
          radiusScale: 1,
          radiusMinPixels: 2,
          radiusMaxPixels: 8,
          getPosition: (d) => d.position,
          getRadius: (d) => d.size,
          getFillColor: (d) => d.color,
          updateTriggers: {
            getPosition: time.value,
          },
        }),
      ],
    })
  },
  { deep: true }
)

// Animation loop using RAF
const { pause, resume } = useRafFn(
  () => {
    updateAnimation()
  },
  { immediate: false }
)

onMounted(() => {
  nextTick(() => {
    // Initialize positions
    updateAnimation()
    initDeck()
    // Start animation loop
    resume()
  })
})

onUnmounted(() => {
  pause()
  if (deckInstance.value) {
    deckInstance.value.finalize()
    deckInstance.value = null
  }
})
</script>

<style scoped>
.commit-matrix {
  position: relative;
  width: 100%;
  margin: 4rem 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.01) 50%,
    transparent 100%
  );
}

.deck-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.deck-container :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .commit-matrix {
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 255, 255, 0.01) 50%,
      transparent 100%
    );
  }
}
</style>
