/**
 * @file useNumberFormat.ts
 * @description Centralized number formatting utilities using d3-format
 * @exports formatNumber, formatPercent, formatCurrency, formatCompact, smartFormat, etc.
 */
import { format } from 'd3-format'
import {
  format as formatDate,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns'

// Basic number formatting with thousands separators
export const formatNumber = format(',d')

// Percentage formatting with one decimal place
export const formatPercent = (value: number) => format('.1%')(value / 100)

// Currency formatting
export const formatCurrency = format('$,.0f')

// Compact number formatting (e.g., 1.2M, 450K)
export const formatCompact = format('.2~s')

// Decimal number with configurable precision
export const formatDecimal = (precision: number = 1) =>
  format(`,.${precision}f`)

// Smart number formatting that adapts based on magnitude
export function smartFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return formatCompact(value)
  }
  if (Math.abs(value) >= 1000) {
    return formatNumber(value)
  }
  if (Number.isInteger(value)) {
    return formatNumber(value)
  }
  return formatDecimal(1)(value)
}

// Common simplified formatters used throughout the codebase
export function formatNumberSimple(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// =============================================================================
// DATE & TIME FORMATTING UTILITIES
// =============================================================================

// Date formatting utilities used across stats components
export const formatDateMinimal = (timestamp: string | number): string => {
  try {
    let date: Date

    // Handle epoch timestamps (both string and number)
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      // String of digits - treat as epoch seconds
      date = new Date(Number.parseInt(timestamp) * 1000)
    } else if (typeof timestamp === 'number') {
      // Number - treat as epoch seconds
      date = new Date(timestamp * 1000)
    } else {
      // String date
      date = new Date(timestamp)
    }

    return formatDate(date, 'MM.dd')
  } catch {
    return '—'
  }
}

// Game date formatting (specific to chess/gaming components)
export const formatGameDateMinimal = (timestamp: string | number): string => {
  try {
    let date: Date

    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      date = new Date(Number.parseInt(timestamp) * 1000)
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000)
    } else {
      date = new Date(timestamp)
    }

    return formatDate(date, 'MM.dd')
  } catch {
    return '—'
  }
}

// Game time formatting (specific to chess/gaming components)
export const formatGameTime = (timestamp: string | number): string => {
  try {
    let date: Date

    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      date = new Date(Number.parseInt(timestamp) * 1000)
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000)
    } else {
      date = new Date(timestamp)
    }

    return formatDate(date, 'HH:mm')
  } catch {
    return '—'
  }
}

// Game type formatting (specific to chess components)
export const formatGameTypeMinimal = (timeControl: string): string => {
  if (!timeControl) return '—'

  // Extract the main time from formats like "600+0" or "180+2"
  const match = timeControl.match(/^(\d+)/)
  if (!match) return timeControl.toUpperCase()

  const seconds = Number.parseInt(match[1])
  const minutes = Math.floor(seconds / 60)

  if (minutes < 3) return 'BULLET'
  if (minutes < 10) return 'BLITZ'
  if (minutes < 30) return 'RAPID'
  return 'CLASSICAL'
}

// Time ago formatting
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date

  if (Number.isNaN(targetDate.getTime())) return '—'

  const days = differenceInDays(now, targetDate)
  const hours = differenceInHours(now, targetDate)
  const minutes = differenceInMinutes(now, targetDate)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

// Percentage formatting
export const formatPercentage = (
  value: number,
  precision: number = 0
): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return `${value.toFixed(precision)}%`
}

// Week range formatting (for health/activity stats)
export const formatWeekRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // If same month, show "Jan 1-7"
    if (start.getMonth() === end.getMonth()) {
      return `${formatDate(start, 'MMM d')}-${formatDate(end, 'd')}`
    }

    // If different months, show "Jan 28-Feb 3"
    return `${formatDate(start, 'MMM d')}-${formatDate(end, 'MMM d')}`
  } catch {
    return '—'
  }
}

// Rating difference formatting (for chess/gaming)
export const formatRatingDiff = (diff: number): string => {
  if (diff === 0) return '±0'
  return diff > 0 ? `+${diff}` : `${diff}`
}

// Chess-specific color utilities
export const getChessResultColor = (result: string): string => {
  switch (result) {
    case 'win':
      return 'bg-zinc-400 dark:bg-zinc-500'
    case 'loss':
      return 'bg-red-500'
    case 'draw':
      return 'bg-zinc-500'
    default:
      return 'bg-zinc-500'
  }
}

export const getChessBarColor = (result: string): string => {
  switch (result) {
    case 'win':
      return '#a1a1aa' // Gray-400
    case 'loss':
      return '#3f3f46' // Gray-700
    case 'draw':
      return '#71717a' // Gray-500
    default:
      return '#71717a' // Gray-500
  }
}

export const getRatingDiffClass = (diff: number): string => {
  return diff > 0 ? 'text-zinc-600 dark:text-zinc-400' : 'text-red-500'
}

// =============================================================================
// COLOR PALETTES & UTILITIES
// =============================================================================

// Turbo color palette for high-contrast data visualization
export const turboColors = [
  '#30123b',
  '#311542',
  '#321949',
  '#341c4f',
  '#351f56',
  '#36235c',
  '#372663',
  '#382a69',
  '#392d6f',
  '#3a3175',
  '#3b347b',
  '#3c3880',
  '#3d3b86',
  '#3e3e8c',
  '#3f4292',
  '#404597',
  '#41499d',
  '#424ca2',
  '#4350a8',
  '#4453ad',
  '#4557b3',
  '#465ab8',
  '#475ebe',
  '#4861c3',
  '#4965c9',
  '#4a68ce',
  '#4b6cd4',
  '#4c6fd9',
  '#4d73de',
  '#4e76e4',
  '#4f7ae9',
  '#507dee',
  '#5181f3',
  '#5284f8',
  '#5388fd',
  '#548bff',
  '#558fff',
  '#5692ff',
  '#5795ff',
  '#5899ff',
  '#599cff',
  '#5a9fff',
  '#5ba3ff',
  '#5ca6ff',
  '#5da9ff',
  '#5eacff',
  '#5fb0ff',
  '#60b3ff',
  '#61b6ff',
  '#62b9ff',
  '#63bcff',
  '#64c0ff',
  '#65c3ff',
  '#66c6ff',
  '#67c9ff',
  '#68ccff',
  '#69d0ff',
  '#6ad3ff',
  '#6bd6ff',
  '#6cd9ff',
  '#6ddcff',
  '#6ee0ff',
  '#6fe3ff',
  '#70e6ff',
  '#71e9ff',
  '#72ecff',
  '#73f0ff',
  '#74f3ff',
  '#75f6ff',
  '#76f9ff',
  '#77fcff',
  '#78ffff',
  '#79fffc',
  '#7afff9',
  '#7bfff6',
  '#7cfff3',
  '#7dfff0',
  '#7effed',
  '#7fffea',
  '#80ffe7',
  '#81ffe4',
  '#82ffe1',
  '#83ffde',
  '#84ffdb',
  '#85ffd8',
  '#86ffd5',
  '#87ffd2',
  '#88ffcf',
  '#89ffcc',
  '#8affc9',
  '#8bffc6',
  '#8cffc3',
  '#8dffc0',
  '#8effbd',
  '#8fffba',
  '#90ffb7',
  '#91ffb4',
  '#92ffb1',
  '#93ffae',
  '#94ffab',
  '#95ffa8',
  '#96ffa5',
  '#97ffa2',
  '#98ff9f',
  '#99ff9c',
  '#9aff99',
  '#9bff96',
  '#9cff93',
  '#9dff90',
  '#9eff8d',
  '#9fff8a',
  '#a0ff87',
  '#a1ff84',
  '#a2ff81',
  '#a3ff7e',
  '#a4ff7b',
  '#a5ff78',
  '#a6ff75',
  '#a7ff72',
  '#a8ff6f',
  '#a9ff6c',
  '#aaff69',
  '#abff66',
  '#acff63',
  '#adff60',
  '#aeff5d',
  '#afff5a',
  '#b0ff57',
  '#b1ff54',
  '#b2ff51',
  '#b3ff4e',
  '#b4ff4b',
  '#b5ff48',
  '#b6ff45',
  '#b7ff42',
  '#b8ff3f',
  '#b9ff3c',
  '#baff39',
  '#bbff36',
  '#bcff33',
  '#bdff30',
  '#beff2d',
  '#bfff2a',
  '#c0ff27',
  '#c1ff24',
  '#c2ff21',
  '#c3ff1e',
  '#c4ff1b',
  '#c5ff18',
  '#c6ff15',
  '#c7ff12',
  '#c8ff0f',
  '#c9ff0c',
  '#caff09',
  '#cbff06',
  '#ccff03',
  '#cdff00',
  '#ceff00',
  '#cffc00',
  '#d0f900',
  '#d1f600',
  '#d2f300',
  '#d3f000',
  '#d4ed00',
  '#d5ea00',
  '#d6e700',
  '#d7e400',
  '#d8e100',
  '#d9de00',
  '#dadb00',
  '#dbd800',
  '#dcd500',
  '#ddd200',
  '#decf00',
  '#dfcc00',
  '#e0c900',
  '#e1c600',
  '#e2c300',
  '#e3c000',
  '#e4bd00',
  '#e5ba00',
  '#e6b700',
  '#e7b400',
  '#e8b100',
  '#e9ae00',
  '#eaab00',
  '#eba800',
  '#eca500',
  '#eda200',
  '#ee9f00',
  '#ef9c00',
  '#f09900',
  '#f19600',
  '#f29300',
  '#f39000',
  '#f48d00',
  '#f58a00',
  '#f68700',
  '#f78400',
  '#f88100',
  '#f97e00',
  '#fa7b00',
  '#fb7800',
  '#fc7500',
  '#fd7200',
  '#fe6f00',
  '#ff6c00',
  '#ff6900',
  '#ff6600',
  '#ff6300',
  '#ff6000',
  '#ff5d00',
  '#ff5a00',
  '#ff5700',
  '#ff5400',
  '#ff5100',
  '#ff4e00',
  '#ff4b00',
  '#ff4800',
  '#ff4500',
  '#ff4200',
  '#ff3f00',
  '#ff3c00',
  '#ff3900',
  '#ff3600',
  '#ff3300',
  '#ff3000',
  '#ff2d00',
  '#ff2a00',
  '#ff2700',
  '#ff2400',
  '#ff2100',
  '#ff1e00',
  '#ff1b00',
  '#ff1800',
  '#ff1500',
  '#ff1200',
  '#ff0f00',
  '#ff0c00',
  '#ff0900',
  '#ff0600',
  '#ff0300',
  '#ff0000',
]

// Monochromatic zinc shades for consistent UI elements
export const zincShades = [
  'rgb(161, 161, 170)', // zinc-400
  'rgb(113, 113, 122)', // zinc-500
  'rgb(82, 82, 91)', // zinc-600
  'rgb(63, 63, 70)', // zinc-700
  'rgb(39, 39, 42)', // zinc-800
  'rgb(24, 24, 27)', // zinc-900
]

// Get color for a normalized value (0-1)
export const getColorForValue = (
  value: number,
  palette: string[] = turboColors
): string => {
  if (value <= 0) return palette[0]
  if (value >= 1) return palette[palette.length - 1]

  const index = Math.floor(value * (palette.length - 1))
  return palette[index]
}

// Get color for an index (cycling through palette)
export const getColorForIndex = (
  index: number,
  palette: string[] = zincShades
): string => {
  return palette[index % palette.length]
}

// Composable for use in components
export function useNumberFormat() {
  return {
    // Number formatting
    formatNumber,
    formatPercent,
    formatCurrency,
    formatCompact,
    formatDecimal,
    smartFormat,
    formatNumberSimple,
    formatBytes,
    formatDuration,

    // Date/time formatting
    formatDateMinimal,
    formatGameDateMinimal,
    formatGameTime,
    formatGameTypeMinimal,
    formatTimeAgo,
    formatPercentage,
    formatWeekRange,
    formatRatingDiff,

    // Color utilities
    turboColors,
    zincShades,
    getColorForValue,
    getColorForIndex,
    getChessResultColor,
    getChessBarColor,
    getRatingDiffClass,
  }
}
