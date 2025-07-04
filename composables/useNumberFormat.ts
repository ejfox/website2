import { format } from 'd3-format'

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
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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

// Composable for use in components
export function useNumberFormat() {
  return {
    formatNumber,
    formatPercent,
    formatCurrency,
    formatCompact,
    formatDecimal,
    smartFormat,
    formatNumberSimple,
    formatBytes,
    formatDuration
  }
}
