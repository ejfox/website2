import { computed, type Ref } from 'vue'
import { scaleSequential } from 'd3-scale'
import { interpolateBlues, interpolateTurbo } from 'd3-scale-chromatic'
import { max } from 'd3-array'
import { getDay } from 'date-fns'

export interface HeatmapColorsOptions {
  values: Ref<number[]>
  isDark: Ref<boolean>
  startDate: Date
  daysToShow: number
}

export function useHeatmapColors(options: HeatmapColorsOptions) {
  const maxValue = computed(() => max(options.values.value.slice(0, options.daysToShow)) || 0)
  const hasData = computed(() => options.values.value.some(v => v > 0))

  // Custom dark interpolator
  const darkInterpolator = (t: number) => {
    return options.isDark.value
      ? `rgb(${interpolateTurbo(t).match(/\d+/g)?.map(n => Number(n) * 0.9).join(', ')})`
      : interpolateTurbo(t)
  }

  const colorScale = computed(() => {
    return scaleSequential()
      .domain([0, maxValue.value || 1]) // Prevent 0-0 domain
      .interpolator(options.isDark.value ? darkInterpolator : interpolateBlues)
  })

  // Helper to check if a date is a weekend
  const isWeekend = (date: Date) => {
    const day = getDay(date)
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  }

  const getCellColor = (value: number, index: number) => {
    if (!hasData.value) {
      return options.isDark.value ? '#1e293b' : '#f1f5f9' // slate-800 : slate-100
    }
    
    const color = colorScale.value(value)
    const dayOffset = options.daysToShow - index - 1
    const cellDate = new Date(options.startDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000))
    
    return isWeekend(cellDate)
      ? `${color.replace('rgb', 'rgba').replace(')', ', 0.85)')}` // Reduce saturation for weekends
      : color
  }

  const getCellOpacity = (value: number, index: number) => {
    const dayOffset = options.daysToShow - index - 1
    const cellDate = new Date(options.startDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000))
    // Reduce opacity more for empty data
    const baseOpacity = hasData.value ? 1 : 0.5
    return baseOpacity // Let the fill color handle the weekend distinction
  }

  const getLegendColor = (step: number) => {
    return hasData.value 
      ? colorScale.value(step * maxValue.value) 
      : (options.isDark.value ? '#1e293b' : '#f1f5f9')
  }

  return {
    colorScale,
    maxValue,
    hasData,
    getCellColor,
    getCellOpacity,
    getLegendColor,
    isWeekend
  }
}