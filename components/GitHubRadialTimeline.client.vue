<script setup>
import { ref, computed } from 'vue'
import { scaleTime } from 'd3-scale'
import { extent } from 'd3-array'
import { arc } from 'd3-shape'
import { useLanguageColors } from '~/composables/useLanguageColors'

const { getColor } = useLanguageColors()

const props = defineProps({
  repos: {
    type: Array,
    required: true,
  },
  size: {
    type: Number,
    default: 600,
  },
})

const hoveredRepo = ref(null)

const centerX = computed(() => props.size / 2)
const centerY = computed(() => props.size / 2)
const maxRadius = computed(() => props.size / 2 - 60)

// Calculate date extents
const dateExtent = computed(() => {
  const allDates = props.repos.flatMap((r) => [
    new Date(r.createdAt),
    new Date(r.pushedAt),
  ])
  return extent(allDates)
})

// Radial scale (time = radius, from center outward)
const radiusScale = computed(() => {
  return scaleTime().domain(dateExtent.value).range([40, maxRadius.value])
})

// Group repos by language for angular positioning
const languageGroups = computed(() => {
  const grouped = {}

  props.repos.forEach((repo) => {
    const lang = repo.language || 'Unknown'
    if (!grouped[lang]) {
      grouped[lang] = {
        language: lang,
        repos: [],
      }
    }
    grouped[lang].repos.push(repo)
  })

  const groups = Object.values(grouped)

  // Assign consistent colors by language name
  return groups.map((group) => ({
    ...group,
    color: getColor(group.language),
  }))
})

// Angular scale (divide circle among languages)
const angleScale = computed(() => {
  let currentAngle = 0
  const totalRepos = props.repos.length

  return languageGroups.value.map((group) => {
    const startAngle = currentAngle
    const angleSpan = (group.repos.length / totalRepos) * 2 * Math.PI
    const endAngle = currentAngle + angleSpan

    currentAngle = endAngle

    return {
      ...group,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
    }
  })
})

// Generate tree ring arcs for each repo
const repoRings = computed(() => {
  const rings = []

  angleScale.value.forEach((langGroup) => {
    const reposInGroup = langGroup.repos
    const anglePerRepo =
      (langGroup.endAngle - langGroup.startAngle) / reposInGroup.length

    reposInGroup.forEach((repo, i) => {
      const startAngle = langGroup.startAngle + i * anglePerRepo
      const endAngle = startAngle + anglePerRepo

      const innerRadius = radiusScale.value(new Date(repo.createdAt))
      const outerRadius = radiusScale.value(new Date(repo.pushedAt))

      const arcGen = arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .padAngle(0.01)

      // Calculate label position
      const midAngle = (startAngle + endAngle) / 2
      const midRadius = (innerRadius + outerRadius) / 2
      const labelX =
        centerX.value + Math.cos(midAngle - Math.PI / 2) * midRadius
      const labelY =
        centerY.value + Math.sin(midAngle - Math.PI / 2) * midRadius

      rings.push({
        repo,
        path: arcGen(),
        color: langGroup.color,
        labelX,
        labelY,
        midAngle,
        thickness: outerRadius - innerRadius,
      })
    })
  })

  return rings
})

// Year rings for reference
const yearRings = computed(() => {
  const [minDate, maxDate] = dateExtent.value
  const years = []

  let year = minDate.getFullYear()
  const maxYear = maxDate.getFullYear()

  while (year <= maxYear) {
    const date = new Date(year, 0, 1)
    if (date >= minDate && date <= maxDate) {
      years.push({
        year,
        radius: radiusScale.value(date),
      })
    }
    year++
  }

  return years
})

const handleMouseEnter = (ring) => {
  hoveredRepo.value = ring.repo
}

const handleMouseLeave = () => {
  hoveredRepo.value = null
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="radial-timeline-container">
    <svg
      :width="size"
      :height="size"
      class="radial-timeline-svg"
      role="img"
      aria-label="Radial timeline of repository development"
    >
      <!-- Year reference rings -->
      <g class="year-rings">
        <g v-for="ring in yearRings" :key="ring.year">
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="ring.radius"
            fill="none"
            stroke="currentColor"
            stroke-opacity="0.1"
            stroke-width="1"
          />
          <text
            :x="centerX"
            :y="centerY - ring.radius - 5"
            text-anchor="middle"
            class="year-label"
          >
            {{ ring.year }}
          </text>
        </g>
      </g>

      <!-- Center dot -->
      <circle :cx="centerX" :cy="centerY" r="3" class="center-dot" />

      <!-- Repo tree rings -->
      <g :transform="`translate(${centerX}, ${centerY})`">
        <path
          v-for="(ring, i) in repoRings"
          :key="i"
          :d="ring.path"
          :fill="ring.color"
          :fill-opacity="
            hoveredRepo && hoveredRepo.name === ring.repo.name ? 0.9 : 0.6
          "
          :stroke="ring.color"
          :stroke-width="
            hoveredRepo && hoveredRepo.name === ring.repo.name ? 2 : 0.5
          "
          class="tree-ring"
          @mouseenter="handleMouseEnter(ring)"
          @mouseleave="handleMouseLeave"
        />
      </g>

      <!-- Language labels (around perimeter) -->
      <g v-for="group in angleScale" :key="group.language">
        <text
          :x="
            centerX + Math.cos(group.midAngle - Math.PI / 2) * (maxRadius + 20)
          "
          :y="
            centerY + Math.sin(group.midAngle - Math.PI / 2) * (maxRadius + 20)
          "
          :text-anchor="
            Math.abs(group.midAngle - Math.PI) < Math.PI / 2 ? 'start' : 'end'
          "
          class="lang-label"
        >
          {{ group.language }} ({{ group.repos.length }})
        </text>
      </g>
    </svg>

    <!-- Tooltip -->
    <div v-if="hoveredRepo" class="radial-tooltip">
      <div class="tooltip-title">{{ hoveredRepo.name }}</div>
      <div class="tooltip-info">
        <div>
          <span class="info-label">Created:</span>
          {{ formatDate(hoveredRepo.createdAt) }}
        </div>
        <div>
          <span class="info-label">Last push:</span>
          {{ formatDate(hoveredRepo.pushedAt) }}
        </div>
        <div>
          <span class="info-label">Language:</span>
          {{ hoveredRepo.language }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.radial-timeline-container {
  @apply relative;
}

.radial-timeline-svg {
  @apply text-zinc-400 dark:text-zinc-600;
}

.tree-ring {
  @apply transition-all duration-200;
  @apply cursor-pointer;
}

.center-dot {
  @apply fill-zinc-900 dark:fill-zinc-100;
}

.year-label {
  @apply text-[10px] font-mono;
  @apply fill-zinc-400 dark:fill-zinc-600;
}

.lang-label {
  @apply text-xs font-mono;
  @apply fill-zinc-700 dark:fill-zinc-300;
}

.radial-tooltip {
  @apply absolute top-4 right-4;
  @apply bg-white dark:bg-zinc-900;
  @apply border border-zinc-200 dark:border-zinc-800 rounded;
  @apply p-3 shadow-lg;
  @apply max-w-xs;
}

.tooltip-title {
  @apply text-sm font-mono font-medium mb-2;
  @apply text-zinc-900 dark:text-zinc-100;
}

.tooltip-info {
  @apply space-y-1 text-xs font-mono;
  @apply text-zinc-700 dark:text-zinc-300;
}

.info-label {
  @apply text-zinc-500 dark:text-zinc-500;
  @apply mr-2;
}
</style>
