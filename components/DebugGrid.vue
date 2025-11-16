<template>
  <div v-if="visible" class="debug-grid" :style="gridStyles">
    <!-- Baseline grid -->
    <svg v-if="showBaseline" class="baseline-grid" :style="baselineStyles">
      <defs>
        <pattern
          id="baseline"
          :width="1"
          :height="baseline"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            :stroke="baselineColor"
            :stroke-width="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#baseline)" />
    </svg>

    <!-- Vertical columns -->
    <div v-if="showColumns" class="column-grid">
      <div
        v-for="i in columns"
        :key="i"
        class="column-guide"
        :style="{
          left: `${(i - 1) * (100 / columns)}%`,
          width: `${100 / columns}%`,
          background: columnColor,
          opacity: 0.05
        }"
      />
    </div>

    <!-- Modular scale markers -->
    <div v-if="showScale" class="scale-markers">
      <div
        v-for="(size, i) in fontSizes"
        :key="i"
        class="scale-marker"
        :style="{
          top: `${i * 100}px`,
          height: `${size}px`,
          background: scaleColor,
          opacity: 0.1
        }"
      >
        <span class="scale-label">{{ size }}px / {{ lineHeights[i] }}</span>
      </div>
    </div>

    <!-- Grid info overlay -->
    <div class="grid-info">
      <div>Baseline: {{ baseline }}px</div>
      <div>Columns: {{ columns }}</div>
      <div>Container: {{ containerWidth }}ch</div>
      <div>Scale: {{ scaleRatio }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as d3 from 'd3'

defineProps({
  baseline: {
    type: Number,
    default: 8
  },
  columns: {
    type: Number,
    default: 12
  },
  showBaseline: {
    type: Boolean,
    default: true
  },
  showColumns: {
    type: Boolean,
    default: true
  },
  showScale: {
    type: Boolean,
    default: false
  },
  baselineColor: {
    type: String,
    default: '#3b82f6'
  },
  columnColor: {
    type: String,
    default: '#10b981'
  },
  scaleColor: {
    type: String,
    default: '#8b5cf6'
  }
})

const visible = ref(false)

// Typography scales
const scaleRatio = 1.25 // Major third
const modularScale = d3
  .scalePow()
  .exponent(scaleRatio)
  .domain([0, 8])
  .range([12, 72])

const fontSizes = computed(() =>
  d3.range(0, 9).map((i) => Math.round(modularScale(i)))
)

const lineHeights = computed(() =>
  fontSizes.value.map((size) => {
    const lh = d3.scaleLinear().domain([12, 72]).range([1.8, 1.1])(size)
    return lh.toFixed(2)
  })
)

const containerWidth = computed(() => {
  const width = window.innerWidth
  return d3
    .scaleLinear()
    .domain([320, 768, 1280, 1920])
    .range([20, 40, 65, 65])
    .clamp(true)(width)
})

const gridStyles = computed(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 9999
}))

const baselineStyles = computed(() => ({
  width: '100%',
  height: '100%',
  position: 'absolute'
}))

// Keyboard toggle
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + G to toggle grid
    if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
      e.preventDefault()
      visible.value = !visible.value
    }
  })
}

// Expose for external control
defineExpose({ visible })
</script>

<style scoped>
.debug-grid {
  mix-blend-mode: multiply;
}

.dark .debug-grid {
  mix-blend-mode: screen;
}

.column-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px solid currentColor;
  border-right: 1px solid currentColor;
  opacity: 0.05;
}

.scale-marker {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed;
  border-bottom: 1px dashed;
}

.scale-label {
  position: absolute;
  right: 10px;
  top: 2px;
  font-size: 10px;
  font-family: monospace;
  color: #8b5cf6;
  background: white;
  padding: 2px 4px;
  border-radius: 2px;
}

.grid-info {
  position: fixed;
  bottom: 10px;
  right: 10px;
  font-family: monospace;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e4e4e7;
  padding: 8px;
  border-radius: 4px;
  line-height: 1.5;
}

.dark .grid-info {
  background: rgba(0, 0, 0, 0.9);
  border-color: #3f3f46;
  color: #a1a1aa;
}
</style>
