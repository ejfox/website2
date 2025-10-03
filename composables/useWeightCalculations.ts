/**
 * Centralized weight calculations for gear inventory
 * Handles conversions between ounces, grams, and pounds with smart formatting
 */

export const useWeightCalculations = () => {
  // Conversion constants
  const OZ_TO_GRAMS = 28.3495
  const OZ_TO_POUNDS = 16
  const GRAMS_TO_POUNDS_THRESHOLD = 4536 // 10 lbs in grams

  /**
   * Convert ounces to grams (rounded)
   */
  const ouncesToGrams = (ounces: number): number => {
    return Math.round(ounces * OZ_TO_GRAMS)
  }

  /**
   * Convert ounces to pounds
   */
  const ouncesToPounds = (ounces: number): number => {
    return ounces / OZ_TO_POUNDS
  }

  /**
   * Format weight display - grams for light items, pounds for heavy items
   */
  const formatWeight = (ounces: number, forceUnit?: 'g' | 'lbs'): string => {
    if (ounces <= 0) return '0'

    const grams = ouncesToGrams(ounces)

    if (forceUnit === 'g') {
      return `${grams}g`
    }

    if (forceUnit === 'lbs') {
      return `${ouncesToPounds(ounces).toFixed(1)}lbs`
    }

    // Auto-format: use pounds if over threshold, otherwise grams
    if (grams > GRAMS_TO_POUNDS_THRESHOLD) {
      return `${ouncesToPounds(ounces).toFixed(1)}lbs`
    }

    return `${grams}g`
  }

  /**
   * Get weight in grams from gear item
   */
  const getItemWeightInGrams = (item: any): number => {
    const ounces = parseFloat(item['Weight_oz']) || 0
    return ouncesToGrams(ounces)
  }

  /**
   * Get weight in ounces from gear item
   */
  const getItemWeightInOunces = (item: any): number => {
    return parseFloat(item['Weight_oz']) || 0
  }

  /**
   * Calculate total weight for a collection of items
   */
  const calculateTotalWeight = (
    items: any[]
  ): {
    ounces: number
    grams: number
    pounds: number
    formatted: string
  } => {
    if (!items?.length) {
      return {
        ounces: 0,
        grams: 0,
        pounds: 0,
        formatted: '0'
      }
    }

    const totalOunces = items.reduce((sum, item) => {
      return sum + getItemWeightInOunces(item)
    }, 0)

    const totalGrams = ouncesToGrams(totalOunces)
    const totalPounds = ouncesToPounds(totalOunces)

    return {
      ounces: totalOunces,
      grams: totalGrams,
      pounds: totalPounds,
      formatted: formatWeight(totalOunces)
    }
  }

  /**
   * Calculate average weight for a collection of items
   */
  const calculateAverageWeight = (
    items: any[]
  ): {
    ounces: number
    grams: number
    pounds: number
    formatted: string
  } => {
    if (!items?.length) {
      return {
        ounces: 0,
        grams: 0,
        pounds: 0,
        formatted: '0'
      }
    }

    const weights = items
      .map(getItemWeightInOunces)
      .filter((weight) => weight > 0)

    if (!weights.length) {
      return {
        ounces: 0,
        grams: 0,
        pounds: 0,
        formatted: '0'
      }
    }

    const avgOunces = weights.reduce((a, b) => a + b, 0) / weights.length
    const avgGrams = ouncesToGrams(avgOunces)
    const avgPounds = ouncesToPounds(avgOunces)

    return {
      ounces: avgOunces,
      grams: avgGrams,
      pounds: avgPounds,
      formatted: formatWeight(avgOunces, 'g') // Always show average in grams
    }
  }

  /**
   * Get weight categories for items
   */
  const getWeightCategories = (items: any[]) => {
    const categories = {
      lightweight: 0, // < 5oz (< 142g)
      mediumweight: 0, // 5-15oz (142-425g)
      heavyweight: 0 // > 15oz (> 425g)
    }

    items.forEach((item) => {
      const ounces = getItemWeightInOunces(item)

      if (ounces < 5) {
        categories.lightweight++
      } else if (ounces <= 15) {
        categories.mediumweight++
      } else {
        categories.heavyweight++
      }
    })

    return categories
  }

  return {
    // Core conversion functions
    ouncesToGrams,
    ouncesToPounds,
    formatWeight,

    // Item weight getters
    getItemWeightInGrams,
    getItemWeightInOunces,

    // Aggregate calculations
    calculateTotalWeight,
    calculateAverageWeight,

    // Analysis functions
    getWeightCategories,

    // Constants
    OZ_TO_GRAMS,
    OZ_TO_POUNDS,
    GRAMS_TO_POUNDS_THRESHOLD
  }
}
