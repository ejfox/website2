/**
 * @file numberFormat.ts
 * @description Centralized number formatting utilities using d3-format
 * @exports formatNumber, formatPercent, formatCurrency, formatCompact, smartFormat, etc.
 */
import { format } from 'd3'

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

// Bundle of number formatters for components that prefer a single call.
export function numberFormat() {
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

    formatPercentage,

    // Mobile-optimized formatting
    formatCurrencyWithSign,
    formatCurrencySmart,
    formatBrierScore,
    formatConfidence,
    tabularClasses,
    valueClasses,
  }
}
