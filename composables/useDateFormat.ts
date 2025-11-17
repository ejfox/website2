/**
 * Centralized date formatting composable
 * Consolidates 15+ duplicate formatDate functions across the codebase
 */
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const useDateFormat = () => {
  const formatDate = (date: string | Date | null | undefined, pattern = 'MMM d, yyyy'): string => {
    if (!date) return ''
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      return format(dateObj, pattern)
    } catch {
      return ''
    }
  }

  const formatShortDate = (date: string | Date | null | undefined): string => {
    return formatDate(date, 'MMM d, yyyy')
  }

  const formatLongDate = (date: string | Date | null | undefined): string => {
    return formatDate(date, 'MMMM d, yyyy')
  }

  const formatCompactDate = (date: string | Date | null | undefined): string => {
    return formatDate(date, 'yyyy-MM-dd')
  }

  const formatYearOnly = (date: string | Date | null | undefined): string => {
    return formatDate(date, 'yyyy')
  }

  const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return ''
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      return formatDistanceToNow(dateObj, { addSuffix: true })
    } catch {
      return ''
    }
  }

  const formatTimestamp = (date: string | Date | null | undefined): string => {
    return formatDate(date, 'MMM d, yyyy h:mm a')
  }

  return {
    formatDate,
    formatShortDate,
    formatLongDate,
    formatCompactDate,
    formatYearOnly,
    formatRelativeTime,
    formatTimestamp
  }
}
