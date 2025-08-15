// ⚡ CENTRALIZED DATE UTILITIES - Bundle Size Optimization! *SWOOSH*
// Single import point for all date-fns functions to enable tree-shaking!

import { 
  format as _format,
  formatDistanceToNow as _formatDistanceToNow,
  formatDistance as _formatDistance,
  parseISO as _parseISO,
  isValid as _isValid,
  startOfWeek as _startOfWeek,
  addDays as _addDays,
  subMonths as _subMonths,
  differenceInDays as _differenceInDays,
  differenceInHours as _differenceInHours,
  differenceInMinutes as _differenceInMinutes,
  differenceInYears as _differenceInYears,
  differenceInMonths as _differenceInMonths,
  getDay as _getDay,
  parse as _parse,
  compareDesc as _compareDesc,
  formatISO as _formatISO,
  isThisMonth as _isThisMonth,
  isThisYear as _isThisYear
} from 'date-fns'

// ⚡ OPTIMIZED: Re-export with consistent naming! *zoom*
export const format = _format
export const formatDistanceToNow = _formatDistanceToNow
export const formatDistance = _formatDistance
export const parseISO = _parseISO
export const isValid = _isValid
export const startOfWeek = _startOfWeek
export const addDays = _addDays
export const subMonths = _subMonths
export const differenceInDays = _differenceInDays
export const differenceInHours = _differenceInHours
export const differenceInMinutes = _differenceInMinutes
export const differenceInYears = _differenceInYears
export const differenceInMonths = _differenceInMonths
export const getDay = _getDay
export const parse = _parse
export const compareDesc = _compareDesc
export const formatISO = _formatISO
export const isThisMonth = _isThisMonth
export const isThisYear = _isThisYear

// ⚡ COMMON FORMATTERS - Pre-configured for performance! *whoosh*
export const formatShortDate = (date: Date | string) => format(new Date(date), 'MMM d, yyyy')
export const formatLongDate = (date: Date | string) => format(new Date(date), 'MMMM do, yyyy')
export const formatTime = (date: Date | string) => format(new Date(date), 'h:mm a')
export const formatDateTime = (date: Date | string) => format(new Date(date), 'MMM d, yyyy h:mm a')
export const formatRelative = (date: Date | string) => formatDistanceToNow(new Date(date), { addSuffix: true })

// ⚡ VALIDATION HELPERS! *zoom*
export const isValidDate = (date: any): boolean => {
  if (!date) return false
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(parsed)
}

export const safeParseDate = (date: any): Date | null => {
  if (!date) return null
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
  return isValid(parsed) ? parsed : null
}