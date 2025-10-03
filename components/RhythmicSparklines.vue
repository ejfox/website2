<template>
  <div class="rhythmic-container">
    <!-- Inline sparkline - sits on baseline -->
    <span v-if="variant === 'inline'" class="sparkline-inline">
      <svg :width="inlineWidth" :height="baseline" class="inline-spark">
        <rect
          v-for="(d, i) in normalizedData"
          :key="i"
          :x="i * 3"
          :y="baseline - d * baseline"
          :width="2"
          :height="d * baseline"
          :fill="currentColor"
          :opacity="0.4 + d * 0.6"
        />
      </svg>
    </span>

    <!-- Margin sparkline - aligns to text x-height -->
    <aside v-else-if="variant === 'margin'" class="sparkline-margin">
      <svg :width="60" :height="baseline * 2" class="margin-spark">
        <path
          :d="linePath"
          fill="none"
          :stroke="currentColor"
          stroke-width="1"
          opacity="0.4"
        />
      </svg>
    </aside>

    <!-- Header sparkline - fits cap height -->
    <div v-else-if="variant === 'header'" class="sparkline-header">
      <svg :width="width" :height="baseline * 3" class="header-spark">
        <defs>
          <pattern
            :id="`grid-${id}`"
            :width="baseline"
            :height="baseline"
            patternUnits="userSpaceOnUse"
          >
            <rect
              :width="baseline"
              :height="baseline"
              fill="none"
              stroke="currentColor"
              stroke-width="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" :fill="`url(#grid-${id})`" />
        <g v-for="(d, i) in normalizedData" :key="i">
          <rect
            :x="i * baseline"
            :y="(1 - d) * baseline * 3"
            :width="baseline - 1"
            :height="d * baseline * 3"
            :fill="currentColor"
            :opacity="0.2 + d * 0.3"
          />
        </g>
      </svg>
    </div>

    <!-- Paragraph-end sparkline - respects line height -->
    <figure v-else-if="variant === 'paragraph'" class="sparkline-paragraph">
      <svg :width="width" :height="baseline * 4" class="paragraph-spark">
        <g v-for="(d, i) in dataGrid" :key="i">
          <rect
            :x="(i % gridCols) * baseline"
            :y="Math.floor(i / gridCols) * baseline"
            :width="baseline - 1"
            :height="baseline - 1"
            :fill="colorScale(d)"
            :opacity="opacityScale(d)"
          />
        </g>
      </svg>
      <figcaption v-if="caption" class="spark-caption">
        {{ caption }}
      </figcaption>
    </figure>

    <!-- List item sparkline - aligns to bullet -->
    <span v-else-if="variant === 'list'" class="sparkline-list">
      <svg :width="baseline * 2" :height="baseline" class="list-spark">
        <circle
          v-for="(d, i) in normalizedData.slice(0, 3)"
          :key="i"
          :cx="baseline / 2 + i * baseline * 0.6"
          :cy="baseline / 2"
          :r="d * baseline * 0.3"
          :fill="currentColor"
          :opacity="0.3 + d * 0.4"
        />
      </svg>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  variant: {
    type: String,
    default: 'inline',
    validator: (v) =>
      ['inline', 'margin', 'header', 'paragraph', 'list'].includes(v)
  },
  baseline: {
    type: Number,
    default: 8
  },
  width: {
    type: Number,
    default: null
  },
  caption: String,
  currentColor: {
    type: String,
    default: 'currentColor'
  }
})

// Unique ID for patterns
const id = Math.random().toString(36).slice(2, 9)

// Normalize data to 0-1 range
const normalizedData = computed(() => {
  const extent = d3.extent(props.data)
  const scale = d3.scaleLinear().domain(extent).range([0.1, 1])
  return props.data.map((d) => scale(d))
})

// Width calculations based on baseline grid
const inlineWidth = computed(() => props.width || props.data.length * 3)

const gridCols = computed(() => Math.ceil(Math.sqrt(props.data.length)))

// Convert to grid for paragraph variant
const dataGrid = computed(() => {
  if (props.variant !== 'paragraph') return []

  const maxItems = gridCols.value * gridCols.value
  const padded = [...props.data]
  while (padded.length < maxItems) {
    padded.push(0)
  }
  return padded.slice(0, maxItems)
})

// Color scale for grid variant
const colorScale = d3
  .scaleQuantize()
  .domain([0, Math.max(...props.data)])
  .range(['#dbeafe', '#93c5fd', '#3b82f6', '#1e40af'])

const opacityScale = d3
  .scaleLinear()
  .domain([0, Math.max(...props.data)])
  .range([0.1, 1])

// Line path for margin variant
const linePath = computed(() => {
  if (props.variant !== 'margin') return ''

  const line = d3
    .line()
    .x((d, i) => i * (60 / props.data.length))
    .y((d) => props.baseline * 2 - normalizedData.value[i] * props.baseline * 2)
    .curve(d3.curveMonotoneX)

  return line(normalizedData.value)
})
</script>

<style scoped>
/* Inline - sits on text baseline */
.sparkline-inline {
  display: inline-block;
  vertical-align: baseline;
  margin: 0 0.25em;
  line-height: 0;
}

.inline-spark {
  vertical-align: baseline;
}

/* Margin - floats in margin, aligned to x-height */
.sparkline-margin {
  float: right;
  margin-left: 1rem;
  margin-top: 0.25em; /* Align to x-height */
  clear: right;
}

/* Header - respects cap height */
.sparkline-header {
  margin-bottom: calc(var(--baseline, 8px) * 2);
  margin-top: calc(var(--baseline, 8px) * 2);
}

/* Paragraph - sits between paragraphs on baseline grid */
.sparkline-paragraph {
  margin: calc(var(--baseline, 8px) * 3) 0;
  display: block;
}

.spark-caption {
  font-size: 0.75rem;
  line-height: var(--baseline, 8px);
  margin-top: var(--baseline, 8px);
  color: #71717a;
  font-variant-numeric: tabular-nums;
}

/* List - aligns with bullet point */
.sparkline-list {
  display: inline-block;
  margin-right: 0.5em;
  vertical-align: middle;
}

/* Ensure all SVGs respect the grid */
.rhythmic-container svg {
  display: block;
  shape-rendering: crispEdges; /* Pixel-perfect alignment */
}
</style>
