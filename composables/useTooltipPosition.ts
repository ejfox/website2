import { computed, type Ref } from 'vue'

export interface TooltipPositionOptions {
  elementX: Ref<number>
  elementY: Ref<number>
  containerWidth: Ref<number>
  containerHeight: Ref<number>
  tooltipWidth?: number
  tooltipHeight?: number
  offset?: { x: number; y: number }
}

export function useTooltipPosition(options: TooltipPositionOptions) {
  const {
    elementX,
    elementY,
    containerWidth,
    containerHeight,
    tooltipWidth = 200,
    tooltipHeight = 100,
    offset = { x: 10, y: 10 }
  } = options

  const tooltipX = computed(() => {
    if (!elementX.value) return 0
    
    // Position tooltip to the right of cursor by default
    let x = elementX.value + offset.x

    // If tooltip would overflow right edge, show it to the left of cursor instead
    if (x + tooltipWidth > containerWidth.value) {
      x = elementX.value - tooltipWidth - offset.x
    }

    // Ensure tooltip stays within container bounds
    return Math.max(offset.x, Math.min(x, containerWidth.value - tooltipWidth - offset.x))
  })

  const tooltipY = computed(() => {
    if (!elementY.value) return 0
    
    // Position tooltip below cursor by default
    let y = elementY.value + offset.y

    // If tooltip would overflow bottom edge, show it above cursor instead
    if (y + tooltipHeight > containerHeight.value) {
      y = elementY.value - tooltipHeight - offset.y
    }

    // Ensure tooltip stays within container bounds
    return Math.max(offset.y, Math.min(y, containerHeight.value - tooltipHeight - offset.y))
  })

  return {
    tooltipX,
    tooltipY
  }
}