/**
 * @file useNumberFormat.ts
 * @description Centralized number formatting utilities using d3-format
 * @exports formatNumber, formatPercent, formatCurrency, formatCompact, smartFormat, etc.
 */
import {
  format as formatDate,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns'
import { format, quantize, interpolateTurbo } from 'd3'

// --- Number formatting (d3-format) ---

// Thousands separators: 1234567 → "1,234,567"
export const formatNumber = (value: number): string => format(',')(value)

// Percentage on an already-0–100 scale: 45.5 → "45.5%"
export const formatPercent = (value: number): string =>
  `${format('.1f')(value)}%`

// Whole-dollar currency: 1234.5 → "$1,235"
export const formatCurrency = (value: number): string => format('$,.0f')(value)

// Compact SI with uppercase K/M/B: 1234 → "1.23K", 1_500_000_000 → "1.5B"
const si = format('.3~s')
export const formatCompact = (value: number): string =>
  si(value).replace(/[kG]$/, (s) => (s === 'k' ? 'K' : 'B'))

// Kept for the old duplicate name — same behaviour as formatCompact
export const formatNumberSimple = formatCompact

// Fixed-precision decimal: formatDecimal(2)(3.14159) → "3.14"
export const formatDecimal =
  (precision: number = 1) =>
  (value: number): string =>
    format(`.${precision}f`)(value)

// Adapts to magnitude: big → compact, else grouped / one-decimal
export function smartFormat(value: number): string {
  if (Math.abs(value) >= 1_000_000) return formatCompact(value)
  if (Math.abs(value) >= 1000 || Number.isInteger(value)) {
    return formatNumber(value)
  }
  return formatDecimal(1)(value)
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

// =============================================================================
// MOBILE-OPTIMIZED FORMATTING UTILITIES
// =============================================================================

/**
 * Format currency with sign prefix for P&L displays
 * Mobile-optimized: Clear visual distinction for gains/losses
 * Always shows 2 decimals for consistency
 * @example formatCurrencyWithSign(123.45) => "+$123.45"
 * @example formatCurrencyWithSign(-50.00) => "-$50.00"
 */
export const formatCurrencyWithSign = (value: number): string => {
  const absValue = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue)

  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

/**
 * Format currency with smart decimal display
 * Mobile-optimized: Shows cents only when necessary to save space
 * @example formatCurrencySmart(100) => "$100"
 * @example formatCurrencySmart(100.50) => "$100.50"
 */
export const formatCurrencySmart = (value: number): string => {
  const absValue = Math.abs(value)
  const hasCents = absValue % 1 !== 0

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absValue)

  // Return with sign for negative values
  return value < 0 ? `-${formatted}` : formatted
}

/**
 * Format Brier score with consistent 3-decimal precision
 * Mobile-optimized: Scientific accuracy for calibration metrics
 * @example formatBrierScore(0.12345) => "0.123"
 */
export const formatBrierScore = (value: number): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return value.toFixed(3)
}

/**
 * Format confidence percentage (no decimals, mobile-friendly)
 * Mobile-optimized: Clean integer display for quick scanning
 * @example formatConfidence(75) => "75%"
 */
export const formatConfidence = (value: number): string => {
  return formatPercentage(Math.round(value), 0)
}

/**
 * Get CSS classes for tabular number display
 * Use on ALL numeric values for consistent vertical alignment
 */
export const tabularClasses = 'tabular-nums font-mono'

/**
 * Get CSS classes for large numeric displays
 * Mobile-optimized: Minimum 20px font size for readability
 */
export const valueClasses =
  'text-xl md:text-2xl font-mono tabular-nums font-bold'

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

// Turbo colormap sampled to 256 steps (d3-scale-chromatic)
export const turboColors: string[] = quantize(interpolateTurbo, 256)

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

    // Mobile-optimized formatting
    formatCurrencyWithSign,
    formatCurrencySmart,
    formatBrierScore,
    formatConfidence,
    tabularClasses,
    valueClasses,

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
