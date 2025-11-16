<template>
  <div class="space-y-4">
    <!-- Books per year sparkline -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <div class="section-label-tiny">Reading Activity by Year</div>
      <svg :width="width" :height="40" class="overflow-visible">
        <!-- Y-axis reference lines (very subtle) -->
        <line
          v-for="tick in [5, 10, 15]"
          :key="`tick-${tick}`"
          :x1="0"
          :x2="width"
          :y1="40 - (tick / maxBooksPerYear) * 35"
          :y2="40 - (tick / maxBooksPerYear) * 35"
          stroke="currentColor"
          class="text-zinc-200 dark:text-zinc-800"
          stroke-width="0.5"
        />

        <!-- Bars -->
        <g v-for="(item, idx) in yearlyData" :key="item.year">
          <rect
            :x="idx * barWidth + barGap"
            :y="40 - (item.count / maxBooksPerYear) * 35"
            :width="barWidth - barGap * 2"
            :height="(item.count / maxBooksPerYear) * 35"
            :class="
              item.year === currentYear
                ? 'fill-zinc-900 dark:fill-zinc-100'
                : 'fill-zinc-400 dark:fill-zinc-600'
            "
            class="transition-colors hover:fill-zinc-600 dark:hover:fill-zinc-400"
          />
          <!-- Year labels (every other year to avoid crowding) -->
          <text
            v-if="idx % 2 === 0 || yearlyData.length < 10"
            :x="idx * barWidth + barWidth / 2"
            y="38"
            text-anchor="middle"
            class="font-mono text-[8px] fill-zinc-400 dark:fill-zinc-600"
          >
            {{ item.year }}
          </text>
          <!-- Count on hover (always show for current year) -->
          <text
            v-if="item.year === currentYear"
            :x="idx * barWidth + barWidth / 2"
            :y="40 - (item.count / maxBooksPerYear) * 35 - 3"
            text-anchor="middle"
            class="font-mono text-[9px] font-bold fill-zinc-900 dark:fill-zinc-100"
          >
            {{ item.count }}
          </text>
        </g>
      </svg>
      <div
        class="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 mt-1 flex justify-between"
      >
        <span>{{ yearlyData[0]?.year || '' }}</span>
        <span>{{ totalBooks }} books total</span>
        <span>{{ yearlyData[yearlyData.length - 1]?.year || '' }}</span>
      </div>
    </div>

    <!-- Highlights distribution sparkline -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 pb-4">
      <div class="section-label-tiny">Highlights Per Book Distribution</div>
      <svg :width="width" :height="30" class="overflow-visible">
        <!-- Sparkline path -->
        <polyline
          :points="highlightSparklinePoints"
          fill="none"
          stroke="currentColor"
          class="text-zinc-400 dark:text-zinc-600"
          stroke-width="1"
        />
        <!-- Area fill -->
        <polygon
          :points="highlightSparklineArea"
          class="fill-zinc-200 dark:fill-zinc-800 opacity-30"
        />
        <!-- Min/max markers -->
        <circle
          v-if="highlightStats.max > 0"
          :cx="highlightStats.maxIdx * (width / sortedHighlights.length)"
          :cy="30 - (highlightStats.max / highlightStats.max) * 25"
          r="2"
          class="fill-zinc-900 dark:fill-zinc-100"
        />
      </svg>
      <div
        class="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 mt-1 flex justify-between"
      >
        <span>min: {{ highlightStats.min }}</span>
        <span>avg: {{ highlightStats.avg }}</span>
        <span>max: {{ highlightStats.max }}</span>
      </div>
    </div>

    <!-- Reading streak calendar (tiny heatmap) -->
    <div>
      <div class="section-label-tiny">Recent Activity (Last 12 Months)</div>
      <div class="grid grid-cols-12 gap-0.5">
        <div
          v-for="month in last12Months"
          :key="month.label"
          class="aspect-square rounded-sm"
          :class="getMonthIntensityClass(month.count)"
          :title="`${month.label}: ${month.count} books`"
        ></div>
      </div>
      <div
        class="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 mt-2 flex justify-between"
      >
        <span>{{ last12Months[0]?.label || '' }}</span>
        <span>{{ last12MonthsTotal }} books in last year</span>
        <span>{{ last12Months[11]?.label || '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  books: {
    type: Array,
    required: true
  },
  width: {
    type: Number,
    default: 600
  }
})

const currentYear = new Date().getFullYear()

// Process yearly data
const yearlyData = computed(() => {
  const yearCounts = {}

  props.books.forEach((book) => {
    const date = book.metadata?.['kindle-sync']?.lastAnnotatedDate
    if (date) {
      const year = Number.parseInt(date.split('-')[0])
      yearCounts[year] = (yearCounts[year] || 0) + 1
    }
  })

  const years = Object.keys(yearCounts).map(Number).sort()
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  // Fill in missing years with 0
  const result = []
  for (let year = minYear; year <= maxYear; year++) {
    result.push({
      year,
      count: yearCounts[year] || 0
    })
  }

  return result
})

const maxBooksPerYear = computed(() => {
  return Math.max(...yearlyData.value.map((d) => d.count))
})

const totalBooks = computed(() => {
  return yearlyData.value.reduce((sum, d) => sum + d.count, 0)
})

const barWidth = computed(() => {
  return props.width / yearlyData.value.length
})

const barGap = computed(() => {
  return Math.max(1, barWidth.value * 0.1)
})

// Highlights distribution
const sortedHighlights = computed(() => {
  return props.books
    .map((b) => b.metadata?.['kindle-sync']?.highlightsCount || 0)
    .sort((a, b) => a - b)
})

const highlightStats = computed(() => {
  const counts = sortedHighlights.value
  if (counts.length === 0) return { min: 0, max: 0, avg: 0, maxIdx: 0 }

  const sum = counts.reduce((a, b) => a + b, 0)
  const max = Math.max(...counts)
  const maxIdx = counts.indexOf(max)

  return {
    min: Math.min(...counts),
    max,
    avg: Math.round(sum / counts.length),
    maxIdx
  }
})

const highlightSparklinePoints = computed(() => {
  const counts = sortedHighlights.value
  if (counts.length === 0) return ''

  const max = highlightStats.value.max
  const points = counts.map((count, idx) => {
    const x = (idx / counts.length) * props.width
    const y = 30 - (count / max) * 25
    return `${x},${y}`
  })

  return points.join(' ')
})

const highlightSparklineArea = computed(() => {
  const counts = sortedHighlights.value
  if (counts.length === 0) return ''

  const max = highlightStats.value.max
  const points = counts.map((count, idx) => {
    const x = (idx / counts.length) * props.width
    const y = 30 - (count / max) * 25
    return `${x},${y}`
  })

  // Add bottom corners to close the polygon
  return `${points.join(' ')} ${props.width},30 0,30`
})

// Last 12 months activity
const last12Months = computed(() => {
  const now = new Date()
  const months = []

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()

    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    })

    // Count books annotated in this month
    const count = props.books.filter((book) => {
      const annotatedDate = book.metadata?.['kindle-sync']?.lastAnnotatedDate
      return annotatedDate && annotatedDate.startsWith(monthKey)
    }).length

    months.push({ label, count, month: monthKey })
  }

  return months
})

const last12MonthsTotal = computed(() => {
  return last12Months.value.reduce((sum, m) => sum + m.count, 0)
})

function getMonthIntensityClass(count) {
  if (count === 0) return 'bg-zinc-100 dark:bg-zinc-900'
  if (count === 1) return 'bg-zinc-300 dark:bg-zinc-700'
  if (count === 2) return 'bg-zinc-400 dark:bg-zinc-600'
  if (count <= 4) return 'bg-zinc-600 dark:bg-zinc-400'
  return 'bg-zinc-900 dark:bg-zinc-100'
}
</script>
