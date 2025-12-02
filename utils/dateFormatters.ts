import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns'

export function formatDate(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === 'string' ? parseISO(dateString) : dateString
    if (!isValid(date)) return 'Invalid date'
    return format(date, 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}

export function formatTimestamp(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
    if (!isValid(date)) return 'Invalid timestamp'
    return format(date, 'MMM d, yyyy HH:mm')
  } catch {
    return 'Invalid timestamp'
  }
}

export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === 'string' ? parseISO(dateString) : dateString
    if (!isValid(date)) return 'Invalid date'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Invalid date'
  }
}

export function formatTrackTime(timestamp: string): string {
  try {
    const date = parseISO(timestamp)
    if (!isValid(date)) return 'Invalid date'
    return format(date, 'MMM d, HH:mm')
  } catch {
    return 'Invalid date'
  }
}

export function formatFullDateTime(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === 'string' ? parseISO(dateString) : dateString
    if (!isValid(date)) return 'Invalid date'
    return format(date, "MMMM d, yyyy 'at' h:mm a")
  } catch {
    return 'Invalid date'
  }
}

export function formatTooltipDate(date: Date): string {
  try {
    if (!isValid(date)) return 'Invalid date'
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}
