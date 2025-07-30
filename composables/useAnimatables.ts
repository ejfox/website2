import { createAnimatable } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

interface _AnimatableConfig {
  [property: string]: {
    duration?: number
    ease?: string
    [key: string]: any
  }
}

/**
 * High-performance animatable objects for clean interactive effects
 * Uses anime.js v4's createAnimatable for optimized performance
 */
export function useAnimatables() {
  if (process.server) {
    return {
      createDataCard: () => null,
      createMetricsDisplay: () => null,
      createTerminalOutput: () => null,
      createStatusIndicator: () => null
    }
  }

  const { timing } = useAnimations()

  // Reusable animatable for cards/panels
  function createDataCard(selector: string) {
    return createAnimatable(selector, {
      // Scale for hover effects
      scale: {
        duration: timing.value.quick, // was 250
        ease: 'spring(1, 80, 10, 0)'
      },
      // Opacity for fade effects
      opacity: {
        duration: timing.value.quick, // was 200
        ease: 'linear'
      },
      // Filter for subtle highlights
      filter: {
        duration: timing.value.normal, // was 300
        ease: 'outQuad'
      },
      // Box shadow for depth
      boxShadow: {
        duration: timing.value.normal, // was 400
        ease: 'outElastic(1, .6)'
      },
      // Transform for movements
      translateY: {
        duration: timing.value.normal, // was 500
        ease: 'cubicBezier(0.34, 1.56, 0.64, 1)'
      }
    })
  }

  // Animatable optimized for metric displays (numbers, stats)
  function createMetricsDisplay(selector: string) {
    return createAnimatable(selector, {
      // Scale for emphasis
      scale: {
        duration: timing.value.quick, // was 250
        ease: 'outBack(1.7)'
      },
      // Color for status changes
      color: {
        duration: timing.value.normal, // was 300
        ease: 'easeInOut'
      },
      // Transform for value changes
      translateX: {
        duration: timing.value.normal, // was 400
        ease: 'spring(1, 100, 12, 0)'
      },
      // Filter for processing states
      filter: {
        duration: timing.value.normal, // was 350
        ease: 'cubicBezier(0.25, 0.1, 0.25, 1)'
      }
    })
  }

  // Terminal-style output animatable
  function createTerminalOutput(selector: string) {
    return createAnimatable(selector, {
      // Opacity for text appearing
      opacity: {
        duration: timing.value.quick, // was 150
        ease: 'linear'
      },
      // Slight glow for active state
      textShadow: {
        duration: timing.value.quick, // was 200
        ease: 'easeOut'
      },
      // Filter for brightness changes
      filter: {
        duration: timing.value.normal, // was 300
        ease: 'linear'
      },
      // Transform for scrolling effects
      translateY: {
        duration: timing.value.normal, // was 400
        ease: 'cubicBezier(0.25, 0.1, 0.25, 1)'
      }
    })
  }

  // Status indicator (loading, success, error states)
  function createStatusIndicator(selector: string) {
    return createAnimatable(selector, {
      // Scale for pulsing
      scale: {
        duration: timing.value.slow, // was 800
        ease: 'easeInOut'
      },
      // Rotation for loading spinners
      rotate: {
        duration: timing.value.slow, // was 1000
        ease: 'linear'
      },
      // Color for state changes
      backgroundColor: {
        duration: timing.value.normal, // was 400
        ease: 'outQuart'
      },
      // Border for emphasis
      borderColor: {
        duration: timing.value.normal, // was 300
        ease: 'easeOut'
      },
      // Shadow for glowing effects
      boxShadow: {
        duration: timing.value.slow, // was 600
        ease: 'outElastic(1, .8)'
      }
    })
  }

  // Presets for clean interactions
  const presets = {
    // Card hover effect
    dataCardHover: {
      scale: 1.01,
      filter: 'brightness(1.05) contrast(1.02)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },

    // Card active/selected state
    dataCardActive: {
      scale: 1.02,
      filter: 'brightness(1.08) contrast(1.04)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },

    // Metrics emphasis (when value changes)
    metricsEmphasis: {
      scale: 1.08,
      filter: 'brightness(1.1) contrast(1.05)'
    },

    // Terminal active line
    terminalActive: {
      opacity: 1,
      filter: 'brightness(1.1) contrast(1.02)'
    },

    // Status loading
    statusLoading: {
      scale: 1.02,
      rotate: 360,
      filter: 'brightness(1.05)'
    },

    // Status success
    statusSuccess: {
      scale: 1.01,
      filter: 'brightness(1.08) contrast(1.03)'
    },

    // Status error
    statusError: {
      scale: 1.01,
      filter: 'brightness(0.95) contrast(1.05)'
    }
  }

  return {
    createDataCard,
    createMetricsDisplay,
    createTerminalOutput,
    createStatusIndicator,
    presets
  }
}