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
