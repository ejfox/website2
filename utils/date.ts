/**
 * Centralized date utilities — the single date-fns entry point for the app.
 *
 * Consolidates the former dateUtils.ts (date-fns barrel), useDateFormat.ts
 * (wrapper), and the date helpers that were living in numberFormat.ts. Import
 * the primitives you need directly (they're auto-imported), or use the named
 * formatters below. No `use`-prefixed wrapper — these are plain functions.
 */
import {
  format,
  formatDistanceToNow,
  formatDistance,
  parseISO,
  isValid,
  startOfWeek,
  addDays,
  subMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInYears,
  differenceInMonths,
  getDay,
  parse,
  compareDesc,
  formatISO,
  isThisMonth,
  isThisYear,
} from 'date-fns'

// Re-export the date-fns primitives the app uses (single import point).
export {
  format,
  formatDistanceToNow,
  formatDistance,
  parseISO,
  isValid,
  startOfWeek,
  addDays,
  subMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInYears,
  differenceInMonths,
  getDay,
  parse,
  compareDesc,
  formatISO,
  isThisMonth,
  isThisYear,
}

type DateInput = string | Date | null | undefined

// Base formatter: parse (ISO strings) then format; empty string on bad input.
export const formatDate = (date: DateInput, pattern = 'MMM d, yyyy'): string => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, pattern)
  } catch {
    return ''
  }
}

export const formatShortDate = (date: DateInput) => formatDate(date, 'MMM d, yyyy')
export const formatLongDate = (date: DateInput) => formatDate(date, 'MMMM do, yyyy')
export const formatCompactDate = (date: DateInput) => formatDate(date, 'yyyy-MM-dd')
export const formatYearOnly = (date: DateInput) => formatDate(date, 'yyyy')
export const formatTime = (date: DateInput) => formatDate(date, 'h:mm a')
export const formatDateTime = (date: DateInput) =>
  formatDate(date, 'MMM d, yyyy h:mm a')
// Alias kept for former useDateFormat().formatTimestamp callers
export const formatTimestamp = formatDateTime

// "3 days ago" style relative time.
export const formatRelative = (date: DateInput): string => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return ''
  }
}
// Alias kept for former useDateFormat().formatRelativeTime callers
export const formatRelativeTime = formatRelative

export const isValidDate = (date: string | number | Date | null | undefined): boolean => {
  if (!date) return false
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(parsed)
}

export const safeParseDate = (
  date: string | number | Date | null | undefined
): Date | null => {
  if (!date) return null
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(parsed) ? parsed : null
}

// Epoch-seconds or date-string → "MM.dd" (dense stats components).
export const formatDateMinimal = (timestamp: string | number): string => {
  try {
    let date: Date
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      date = new Date(Number.parseInt(timestamp) * 1000)
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000)
    } else {
      date = new Date(timestamp)
    }
    return format(date, 'MM.dd')
  } catch {
    return '—'
  }
}

// Chess time-control (e.g. "600+0") → tier label.
export const formatGameTypeMinimal = (timeControl: string): string => {
  if (!timeControl) return '—'
  const match = timeControl.match(/^(\d+)/)
  if (!match) return timeControl.toUpperCase()
  const minutes = Math.floor(Number.parseInt(match[1]) / 60)
  if (minutes < 3) return 'BULLET'
  if (minutes < 10) return 'BLITZ'
  if (minutes < 30) return 'RAPID'
  return 'CLASSICAL'
}

// Compact "Xd ago / Xh ago / just now".
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(target.getTime())) return '—'
  const days = differenceInDays(now, target)
  const hours = differenceInHours(now, target)
  const minutes = differenceInMinutes(now, target)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
