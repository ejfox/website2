import { computed, type Ref } from 'vue'
import { differenceInDays, parseISO } from 'date-fns'

export interface HeatmapLayoutOptions {
  containerWidth: Ref<number>
  containerHeight: Ref<number>
  startDate: string
  endDate: string
  showFullYear: boolean
  daysToShow?: number
}

export interface HeatmapLayoutResult {
  cellSize: number
  useHorizontalLayout: boolean
  width: number
  height: number
  svgHeight: number
  daysToShow: number
  weeks: number
}

export function useHeatmapLayout(options: HeatmapLayoutOptions) {
  const DAYS_TO_SHOW = options.daysToShow || 365
  const DAYS_IN_WEEK = 7
  const CELL_PADDING = 2
  const MARGIN = {
    top: 24,
    right: 24,
    bottom: 24,
    left: 24
  }

  const layout = computed((): HeatmapLayoutResult => {
    const daysToShow = options.showFullYear
      ? DAYS_TO_SHOW
      : Math.min(
          differenceInDays(
            parseISO(options.endDate),
            parseISO(options.startDate)
          ) + 1,
          DAYS_TO_SHOW
        )

    // Determine if we should use horizontal layout
    const useHorizontalLayout = daysToShow <= 15

    // Calculate optimal cell size based on container and layout
    const cellSize = Math.floor(
      useHorizontalLayout
        ? Math.min(
            (options.containerWidth.value - MARGIN.left - MARGIN.right) /
              daysToShow,
            options.containerHeight.value - MARGIN.top - MARGIN.bottom - 40
          )
        : Math.min(
            (options.containerHeight.value - MARGIN.top - MARGIN.bottom) /
              DAYS_IN_WEEK,
            (options.containerWidth.value - MARGIN.left - MARGIN.right) /
              Math.ceil(daysToShow / DAYS_IN_WEEK)
          )
    )

    // Calculate dimensions based on layout
    let width: number, height: number
    if (useHorizontalLayout) {
      width =
        (cellSize + CELL_PADDING) * daysToShow + MARGIN.left + MARGIN.right
      height = cellSize + MARGIN.top + MARGIN.bottom + 30
    } else {
      const weeks = Math.ceil(daysToShow / DAYS_IN_WEEK)
      width = (cellSize + CELL_PADDING) * weeks + MARGIN.left + MARGIN.right
      height =
        (cellSize + CELL_PADDING) * DAYS_IN_WEEK + MARGIN.top + MARGIN.bottom
    }

    const weeks = Math.ceil(daysToShow / DAYS_IN_WEEK)
    const svgHeight = height // Will be adjusted for legend in parent component

    return {
      cellSize,
      useHorizontalLayout,
      width,
      height,
      svgHeight,
      daysToShow,
      weeks
    }
  })

  const constants = {
    DAYS_TO_SHOW,
    DAYS_IN_WEEK,
    CELL_PADDING,
    MARGIN
  }

  return {
    layout,
    constants
  }
}
