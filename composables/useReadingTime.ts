/**
 * Reading time calculation composable
 * Consolidates duplicate Math.ceil(words / 200) calculations
 */

export const useReadingTime = () => {
  const WORDS_PER_MINUTE = 200

  const calculateMinutes = (words: number): number => {
    if (!words || words <= 0) return 0
    return Math.ceil(words / WORDS_PER_MINUTE)
  }

  const formatReadingTime = (words: number): string => {
    const minutes = calculateMinutes(words)
    if (minutes === 0) return ''
    return minutes === 1 ? '1 min read' : `${minutes} min read`
  }

  const formatCompact = (words: number): string => {
    const minutes = calculateMinutes(words)
    if (minutes === 0) return ''
    return `${minutes}m`
  }

  return {
    calculateMinutes,
    formatReadingTime,
    formatCompact,
  }
}
