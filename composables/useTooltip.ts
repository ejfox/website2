import { ref, computed, type Ref } from 'vue'
import { useMouse, useTransition } from '@vueuse/core'

export interface TooltipOptions {
  offset?: { x: number; y: number }
  transitionDuration?: number
  target?: Ref<HTMLElement | null>
}

/**
 * Composable for creating smooth, positioned tooltips in visualizations
 * Uses VueUse for mouse tracking and transitions
 */
export function useTooltip<T = any>(options: TooltipOptions = {}) {
  const {
    offset = { x: 0, y: 20 },
    transitionDuration = 150,
    target = ref(null),
  } = options

  const hoveredData = ref<T | null>(null)

  // Mouse tracking with smooth easing
  const { x: mouseX, y: mouseY } = useMouse({ target })

  const tooltipX = useTransition(mouseX, {
    duration: transitionDuration,
    transition: [0.25, 0.1, 0.25, 1], // ease-out
  })

  const tooltipY = useTransition(mouseY, {
    duration: transitionDuration,
    transition: [0.25, 0.1, 0.25, 1],
  })

  // Position with offset and viewport bounds
  const position = computed(() => {
    const x = tooltipX.value + offset.x
    const y = tooltipY.value + offset.y

    return {
      left: `${x}px`,
      top: `${y}px`,
    }
  })

  // Helper to show tooltip with data
  const show = (data: T) => {
    hoveredData.value = data
  }

  // Helper to hide tooltip
  const hide = () => {
    hoveredData.value = null
  }

  // Check if tooltip is visible
  const isVisible = computed(() => hoveredData.value !== null)

  return {
    hoveredData,
    position,
    tooltipX,
    tooltipY,
    show,
    hide,
    isVisible,
  }
}
