<!--
  @file CommitHeatmap.client.vue
  @description Year × week activity heatmap. Columns = years, rows = ISO weeks.
               Each cell is colored by the language of the repo with the most
               commits that week, opacity scaled by commit count.
-->
<script setup>
import { ref, computed, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useLanguageColors } from '~/composables/useLanguageColors'

const props = defineProps({
  years: { type: Array, required: true },
  weeks: { type: Array, required: true },
  totalCommits: { type: Number, default: 0 },
  totalRepos: { type: Number, default: 0 },
})

const emit = defineEmits(['hover', 'select'])

const { getColor } = useLanguageColors()
const container = ref(null)
const { width } = useElementSize(container)
const hoveredCell = ref(null)
const selectedYear = ref(null)

// Group weeks by year for O(1) lookup
const weeksByYearKey = computed(() => {
  const map = new Map()
  for (const w of props.weeks) {
    map.set(`${w.year}-${w.week}`, w)
  }
  return map
})

const maxCommitsInWeek = computed(() =>
  Math.max(...props.weeks.map((w) => w.commits), 1)
)

// Logarithmic opacity for better contrast across small + large weeks
const cellOpacity = (commits) => {
  if (commits <= 0) return 0
  const t = Math.log1p(commits) / Math.log1p(maxCommitsInWeek.value)
  return 0.15 + t * 0.85
}

const WEEKS_PER_YEAR = 53
const MIN_CELL = 8
const MAX_CELL = 18
const PADDING_LEFT = 36 // for week-of-month labels
const PADDING_TOP = 18 // for year labels

const cellSize = computed(() => {
  if (!width.value) return MIN_CELL
  const available = width.value - PADDING_LEFT
  const size = available / props.years.length
  return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(size)))
})

const dims = computed(() => {
  const cs = cellSize.value
  return {
    cellSize: cs,
    gridWidth: cs * props.years.length,
    gridHeight: cs * WEEKS_PER_YEAR,
    svgWidth: cs * props.years.length + PADDING_LEFT,
    svgHeight: cs * WEEKS_PER_YEAR + PADDING_TOP,
  }
})

const cells = computed(() => {
  const out = []
  const cs = cellSize.value
  props.years.forEach((y, yi) => {
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      const data = weeksByYearKey.value.get(`${y}-${w}`)
      const lang = data?.topRepoLang || 'Unknown'
      out.push({
        key: `${y}-${w}`,
        x: PADDING_LEFT + yi * cs,
        y: PADDING_TOP + w * cs,
        size: cs - 1,
        year: y,
        week: w,
        commits: data?.commits || 0,
        topRepo: data?.topRepo || null,
        topRepoLang: data?.topRepoLang || null,
        weekStart: data?.weekStart || null,
        fill: data?.commits ? getColor(lang) : 'transparent',
        opacity: cellOpacity(data?.commits || 0),
      })
    }
  })
  return out
})

// Month markers along the Y axis
const monthMarkers = [
  { week: 0, label: 'Jan' },
  { week: 9, label: 'Mar' },
  { week: 17, label: 'May' },
  { week: 26, label: 'Jul' },
  { week: 35, label: 'Sep' },
  { week: 43, label: 'Nov' },
]

function onCellEnter(cell) {
  if (!cell.commits) {
    hoveredCell.value = null
    emit('hover', null)
    return
  }
  hoveredCell.value = cell
  emit('hover', cell)
}

function onCellLeave() {
  hoveredCell.value = null
  emit('hover', null)
}

function onCellClick(cell) {
  if (!cell.commits) return
  selectedYear.value = selectedYear.value === cell.year ? null : cell.year
  emit('select', { year: selectedYear.value })
}

function clearSelection() {
  selectedYear.value = null
  emit('select', { year: null })
}

// Year totals
const yearTotals = computed(() => {
  const totals = new Map()
  for (const w of props.weeks) {
    totals.set(w.year, (totals.get(w.year) || 0) + w.commits)
  }
  return totals
})

watch(selectedYear, (v) => emit('select', { year: v }))
</script>

<template>
  <figure ref="container" class="w-full">
    <figcaption
      class="flex items-baseline justify-between mb-2 font-mono text-3xs uppercase tracking-wider text-zinc-500"
    >
      <span>Commit activity</span>
      <span class="tabular-nums normal-case tracking-normal">
        {{ totalCommits.toLocaleString() }} commits · {{ totalRepos }} repos ·
        {{ years.length }} years
      </span>
    </figcaption>

    <svg
      v-if="width"
      :width="dims.svgWidth"
      :height="dims.svgHeight"
      class="block"
    >
      <!-- Year column headers -->
      <g
        class="font-mono"
        font-size="9"
        fill="currentColor"
        text-anchor="middle"
      >
        <text
          v-for="(y, yi) in years"
          :key="`yr-${y}`"
          :x="PADDING_LEFT + yi * dims.cellSize + dims.cellSize / 2"
          y="10"
          class="text-zinc-600 dark:text-zinc-400"
          :class="{
            'font-bold text-zinc-900 dark:text-zinc-100': selectedYear === y,
          }"
        >
          {{ String(y).slice(2) }}
        </text>
      </g>

      <!-- Month row markers -->
      <g class="font-mono" font-size="9" fill="currentColor" text-anchor="end">
        <text
          v-for="m in monthMarkers"
          :key="`m-${m.label}`"
          :x="PADDING_LEFT - 6"
          :y="PADDING_TOP + m.week * dims.cellSize + dims.cellSize / 2 + 3"
          class="text-zinc-400 dark:text-zinc-600"
        >
          {{ m.label }}
        </text>
      </g>

      <!-- Cells -->
      <g>
        <rect
          v-for="cell in cells"
          :key="cell.key"
          :x="cell.x"
          :y="cell.y"
          :width="cell.size"
          :height="cell.size"
          :fill="cell.fill"
          :fill-opacity="cell.opacity"
          class="cell"
          :class="{
            'cell-empty': !cell.commits,
            'cell-dim': selectedYear && selectedYear !== cell.year,
          }"
          @mouseenter="onCellEnter(cell)"
          @mouseleave="onCellLeave"
          @click="onCellClick(cell)"
        />
      </g>
    </svg>

    <!-- Tooltip / current selection -->
    <div
      class="mt-2 flex items-baseline justify-between gap-4 font-mono text-2xs text-zinc-600 dark:text-zinc-400 min-h-4"
    >
      <span v-if="hoveredCell" class="tabular-nums truncate">
        Week of
        {{ new Date(hoveredCell.weekStart).toISOString().slice(0, 10) }} ·
        <span class="text-zinc-900 dark:text-zinc-100">
          {{ hoveredCell.commits }}
        </span>
        commits ·
        <NuxtLink
          v-if="hoveredCell.topRepo"
          :to="`/github/${hoveredCell.topRepo}`"
          class="underline-offset-2 hover:underline"
        >
          {{ hoveredCell.topRepo }}
        </NuxtLink>
      </span>
      <span v-else-if="selectedYear" class="tabular-nums">
        {{ selectedYear }} · {{ yearTotals.get(selectedYear) || 0 }} commits ·
        <button
          type="button"
          class="underline-offset-2 hover:underline"
          @click="clearSelection"
        >
          clear
        </button>
      </span>
      <span v-else class="text-zinc-400 dark:text-zinc-600">
        Hover a week · click a cell to filter the list by that year
      </span>
    </div>
  </figure>
</template>

<style scoped>
.cell {
  @apply cursor-pointer transition-opacity;
}

.cell-empty {
  fill: currentColor;
  @apply text-zinc-100 dark:text-zinc-900;
  fill-opacity: 1;
}

.cell-dim {
  opacity: 0.18;
}
</style>
