/**
 * Centralized status formatting for badges, labels, and indicators
 * Consolidates FOIA status, prediction status, and other status mappings
 */

/**
 * FOIA status mapping - converts API status to display format
 */
export const foiaStatusMap: Record<string, string> = {
  payment: 'PAYMENT',
  no_docs: 'NO_DOCS',
  rejected: 'REJECTED',
  partial: 'PARTIAL',
  processed: 'PROCESSED',
  fix: 'NEEDS_FIX',
  submitted: 'SUBMITTED',
  appealing: 'APPEALING',
  done: 'DONE'
}

/**
 * Prediction status colors for visual indication
 */
export const predictionStatusColors = {
  correct: 'text-green-600 dark:text-green-500',
  incorrect: 'text-red-600 dark:text-red-500',
  pending: 'text-zinc-600 dark:text-zinc-400'
}

/**
 * Get CSS class for prediction outcome
 */
export const getPredictionOutcomeClass = (
  status: 'correct' | 'incorrect' | 'pending'
): string => {
  return predictionStatusColors[status] || predictionStatusColors.pending
}

export const useStatusFormatting = () => {
  /**
   * Format FOIA request status to uppercase label
   * @param status - Raw status from API (lowercase with underscores)
   * @returns Formatted status string (uppercase)
   */
  const formatFoiaStatus = (status: string): string => {
    return foiaStatusMap[status] || status.toUpperCase()
  }

  /**
   * Determine if FOIA request is open or closed
   * @param status - FOIA status
   * @returns boolean indicating if request is still open
   */
  const isFoiaOpen = (status: string): boolean => {
    return status !== 'done'
  }

  /**
   * Get badge styling for FOIA status (no decorative colors, data only)
   * @param _status - FOIA status
   * @returns CSS class string for styling
   */
  const getFoiaStatusClass = (_status: string): string => {
    // All FOIA statuses use same neutral styling - no color decoration
    return 'font-mono text-xs text-zinc-600 dark:text-zinc-400'
  }

  /**
   * Format prediction status string
   * @param status - Raw status value
   * @returns Human-readable status
   */
  const formatPredictionStatus = (
    status: 'correct' | 'incorrect' | 'pending' | string
  ): string => {
    const statusMap: Record<string, string> = {
      correct: '✓ Correct',
      incorrect: '✗ Incorrect',
      pending: '○ Pending',
      resolved: 'Resolved'
    }
    return statusMap[status] || status
  }

  /**
   * Get CSS class for prediction badge
   * @param status - Prediction status
   * @returns CSS class string
   */
  const getPredictionStatusClass = (status: string): string => {
    return getPredictionOutcomeClass(
      status as 'correct' | 'incorrect' | 'pending'
    )
  }

  /**
   * Format generic status indicator
   * @param status - Status string
   * @param type - Type of status (foia, prediction, generic)
   * @returns Formatted status string
   */
  const formatStatus = (
    status: string,
    type: 'foia' | 'prediction' | 'generic' = 'generic'
  ): string => {
    switch (type) {
      case 'foia':
        return formatFoiaStatus(status)
      case 'prediction':
        return formatPredictionStatus(status)
      default:
        return status.toUpperCase()
    }
  }

  return {
    formatFoiaStatus,
    isFoiaOpen,
    getFoiaStatusClass,
    formatPredictionStatus,
    getPredictionStatusClass,
    formatStatus,
    foiaStatusMap,
    predictionStatusColors
  }
}
