<template>
  <div ref="container" class="relative w-full h-full">
    <!-- Loading state -->
    <div v-if="!props.data?.values" class="absolute inset-0 flex items-center justify-center">
      <div class="text-zinc-400 dark:text-zinc-500 text-sm">
        Loading data...
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-show="hoveredCellData && !isOutside" class="absolute z-10 px-3 py-2 text-xs backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 
                rounded-lg shadow-lg border border-zinc-100/20 dark:border-zinc-800/20 transition-all duration-200 pointer-events-none" :style="{
                  left: `${tooltipX}px`,
                  top: `${tooltipY}px`,
    }"
    >
      <div class="space-y-1">
        <div class="font-medium">
          {{ hoveredCellData?.date }}
        </div>
        <div class="text-blue-500 dark:text-blue-400">
          {{ hoveredCellData?.count }} {{ hoveredCellData?.count === 1 ? 'item' : 'items' }}
        </div>
        <div v-if="hoveredCellData?.details?.length" class="pt-1 space-y-1">
          <div
            v-for="detail in hoveredCellData.details" :key="detail.name"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{{ detail.name }}</span>
            <span class="text-gray-400 dark:text-gray-500 tabular-nums">{{ detail.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SVG Container -->
    <div ref="svgContainer" class="w-full h-full">
      <!-- SVG will be injected here by D3 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMouseInElement, useDark, useElementBounding } from '@vueuse/core'
import { parseISO } from 'date-fns'
import { useTransition } from '~/composables/useTransition'
import { useTooltipPosition } from '~/composables/useTooltipPosition'
import { useHeatmapLayout } from '~/composables/useHeatmapLayout'
import { useHeatmapColors } from '~/composables/useHeatmapColors'
import { useD3Heatmap } from '~/composables/useD3Heatmap'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  startDate: {
    type: String,
    default: () => format(new Date(), 'yyyy-MM-dd')
  },
  endDate: {
    type: String,
    default: () => format(new Date(), 'yyyy-MM-dd')
  },
  showFullYear: {
    type: Boolean,
    default: false
  },
  showLegend: {
    type: Boolean,
    default: false
  },
  legendLabels: {
    type: Object,
    default: () => ({
      start: 'Less Frequent',
      end: 'More Frequent'
    })
  }
})

const container = ref<HTMLElement | null>(null)
const svgContainer = ref<HTMLElement | null>(null)
const hoveredCellData = ref<any>(null)
const isDark = useDark()

// Get mouse position and element bounds
const {
  elementX,
  elementY,
  isOutside,
} = useMouseInElement(container)
const bounds = useElementBounding(container)

// Use tooltip position composable
const { tooltipX, tooltipY } = useTooltipPosition({
  elementX,
  elementY,
  containerWidth: bounds.width,
  containerHeight: bounds.height,
  tooltipWidth: 200,
  tooltipHeight: 100
})

// Create smooth transitions for our data
const transitionedValues = useTransition(computed(() => props.data.values))

const drawHeatmap = () => {
  if (!container.value || !props.data?.values || !svgContainer.value) return

  const containerRect = container.value.getBoundingClientRect()
  const startDateObj = parseISO(props.startDate)
  
  // Use layout composable
  const { layout } = useHeatmapLayout({
    containerWidth: ref(containerRect.width),
    containerHeight: ref(containerRect.height),
    startDate: props.startDate,
    endDate: props.endDate,
    showFullYear: props.showFullYear
  })

  const values = transitionedValues.value.slice(-layout.value.daysToShow)
  const details = props.data.details || Array(layout.value.daysToShow).fill([])

  // Use colors composable
  const { getCellColor, getCellOpacity, getLegendColor } = useHeatmapColors({
    values: ref(values),
    isDark,
    startDate: startDateObj,
    daysToShow: layout.value.daysToShow
  })

  // Use D3 heatmap composable
  const { drawHeatmap: draw } = useD3Heatmap()

  const svgHeight = props.showLegend ? layout.value.height + 32 : layout.value.height

  draw({
    svgContainer,
    layout: { ...layout.value, svgHeight },
    values,
    details,
    startDate: startDateObj,
    isDark: isDark.value,
    showLegend: props.showLegend,
    legendLabels: props.legendLabels,
    getCellColor,
    getCellOpacity,
    getLegendColor,
    onCellHover: (data: any) => {
      hoveredCellData.value = data
    },
    onCellLeave: () => {
      hoveredCellData.value = null
    }
  })
}

// Watch for both data and date changes
watch([() => props.data, () => props.startDate, () => props.endDate], drawHeatmap, { deep: true })

onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    if (container.value && container.value.offsetWidth > 0 && container.value.offsetHeight > 0) {
      drawHeatmap()
    }
  })

  if (container.value) {
    resizeObserver.observe(container.value)
  }

  drawHeatmap()
})
</script>

<style scoped>
.contribution {
  transition: all 0.2s ease;
}

.contribution:hover {
  stroke: currentColor;
  stroke-width: 1.5px;
  filter: brightness(1.1);
}

/* Fade animation for tooltip */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

/* Ensure text is crisp */
text {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
</style>