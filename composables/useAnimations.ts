/**
 * UNIFIED ANIMATION SYSTEM
 * 
 * Single source of truth for all site animations based on research from:
 * - Material Design Motion Guidelines
 * - IBM Carbon Design System
 * - 2025 Web Animation Best Practices
 * 
 * PERFORMANCE NOTES:
 * - Uses anime.js for hardware-accelerated animations
 * - Set-based tracking prevents duplicate animations
 * - IntersectionObserver for efficient scroll detection
 * - Debounced scroll handlers for 60fps performance
 * 
 * USAGE:
 * const { timing, easing, reveal, transition, counter, card } = useAnimations()
 * 
 * EDITING:
 * - Timing values are research-backed - avoid arbitrary changes
 * - Test all changes across mobile and desktop
 * - Use browser dev tools Performance tab to verify 60fps
 */

import { animate, stagger, onScroll } from '~/anime.esm.js'
import { useMagicKeys } from '@vueuse/core'

/**
 * TIMING SCALE - Clean Geometric Progression
 * 
 * Simple doubling pattern for predictable animation hierarchy:
 * - 200ms: Quick interactions (hover, click)
 * - 400ms: Standard transitions 
 * - 800ms: Complex animations
 * - 1600ms: Dramatic, expressive moments
 * - 2400ms: Very slow, attention-demanding
 * 
 * DEBUG MODE: Hold Shift to slow all animations by 2x (Apple-style)
 */
const baseTiming = {
  quick: 200,      // Quick interactions (hover, click)
  normal: 400,     // Standard transitions
  slow: 800,       // Complex animations
  dramatic: 1600,  // Dramatic, expressive moments
  glacial: 2400    // Very slow, attention-demanding
} as const

/**
 * EASING CURVES - Physics-Based Motion
 * 
 * Each curve has specific psychological and functional purposes:
 * - Standard: General-purpose, feels natural
 * - Decelerate: Objects coming to rest (entrances)
 * - Accelerate: Objects leaving view (exits)
 * - Productive: Efficient, task-focused motion
 * - Expressive: Personality, brand moments
 */
const easing = {
  // Material Design physics-based curves (anime.js format)
  standard: [0.4, 0.0, 0.2, 1],    // Default - natural deceleration
  decelerate: [0.0, 0.0, 0.2, 1],  // Ease-out for entrances
  accelerate: [0.4, 0.0, 1, 1],    // Ease-in for exits
  
  // IBM Carbon Design System curves
  productive: [0.2, 0, 0.38, 0.9],  // Efficient, focused motion
  expressive: [0.4, 0.14, 0.3, 1],  // Brand personality moments
  
  // Apple's signature curve (reference)
  apple: [0.25, 0.1, 0.25, 1],      // Smooth, premium feel
  
  // Common anime.js easings
  bounce: 'spring(1, 80, 10, 0)'
} as const

/**
 * STAGGER PATTERNS - Sequential Animation Timing
 * 
 * Controls delay between elements in sequence:
 * - Tight: Rapid succession, high energy
 * - Normal: Readable pace, comfortable
 * - Loose: Deliberate separation, thoughtful
 * - Dramatic: Maximum hierarchy emphasis
 * - Cascade: Waterfall effect, very fast
 */
const staggers = {
  tight: 50,        // Rapid succession - high energy sequences
  normal: 80,       // Material Design recommendation - readable pace
  loose: 120,       // Deliberate separation - thoughtful pacing  
  dramatic: 200,    // Maximum hierarchy emphasis - clear tiers
  cascade: 30       // Waterfall effect - very rapid succession
} as const

export const useAnimations = () => {
  // Performance optimization: Use Set for O(1) lookup vs array O(n)
  const revealed = new Set<Element>()
  
  // Apple-style slow-mo debug mode
  const { shift } = useMagicKeys()
  const debugMultiplier = computed(() => shift.value ? 2 : 1)
  
  // Dynamic timing that responds to shift key
  const timing = computed(() => ({
    quick: baseTiming.quick * debugMultiplier.value,
    normal: baseTiming.normal * debugMultiplier.value,
    slow: baseTiming.slow * debugMultiplier.value,
    dramatic: baseTiming.dramatic * debugMultiplier.value,
    glacial: baseTiming.glacial * debugMultiplier.value
  }))
  
  /**
   * SCROLL REVEALS - Information Hierarchy System
   * 
   * PERFORMANCE OPTIMIZATIONS:
   * - Set-based tracking for O(1) duplicate prevention
   * - Efficient selector targeting
   * - Minimal DOM queries
   * - Debounced scroll handling via anime.js onScroll
   * 
   * EDITING TIERS:
   * Add/remove selectors in the tiers array below
   * Delays create information hierarchy (most important first)
   */
  const reveal = {
    /**
     * Initialize scroll reveal system
     * 
     * PERFORMANCE: Only queries DOM once on init
     * Sets initial opacity to 0 for reveal elements
     */
    init() {
      // Target selectors for reveal animation
      const selectors = ['h1', 'h2', 'p', '.stat-value', 'small']
      
      // Performance: Batch DOM operations
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          (el as HTMLElement).style.opacity = '0'
        })
      })
      
      // Use anime.js optimized scroll handler
      onScroll({ target: document, begin: this.check })
      this.check() // Initial check for above-fold content
    },
    
    check() {
      const tiers = [
        { sel: 'h1', delay: 0 },                    // Headlines FIRST
        { sel: 'h2, .intro', delay: 200 },          // Key content after pause
        { sel: 'p, .stat-value', delay: 500 },      // Body content - major gap
        { sel: 'small, .metadata', delay: 900 }     // Metadata last - big separation
      ]
      
      tiers.forEach(({ sel, delay }, tierIndex) => {
        const newEls = Array.from(document.querySelectorAll(sel))
          .filter(el => !revealed.has(el) && isVisible(el))
        
        if (newEls.length) {
          newEls.forEach(el => revealed.add(el))
          
          // ANTICIPATORY ANIMATION: Disabled - was causing looping animations
          // if (tierIndex < tiers.length - 1) {
          //   // Hint at next tier coming by subtle shimmer
          //   const nextTierEls = document.querySelectorAll(tiers[tierIndex + 1].sel)
          //   if (nextTierEls.length) {
          //     setTimeout(() => {
          //       animate(Array.from(nextTierEls), {
          //         opacity: [0, 0.1, 0], // Subtle anticipatory flash
          //         duration: timing.value.quick,
          //         ease: easing.decelerate
          //       })
          //     }, delay + 50) // Hint starts just after current tier begins
          //   }
          // }
          
          // Research-based stagger patterns
          const config = [
            { stagger: staggers.cascade, duration: timing.value.normal, ease: easing.expressive }, // h1: Expressive entrance
            { stagger: staggers.tight, duration: timing.value.slow, ease: easing.standard },       // h2: Standard flow
            { stagger: staggers.normal, duration: timing.value.slow, ease: easing.productive },  // p: Productive reading
            { stagger: staggers.dramatic, duration: timing.value.slow, ease: easing.decelerate } // metadata: Gentle settle
          ][tierIndex] || { stagger: staggers.normal, duration: timing.value.slow, ease: easing.standard }
          
          // Use anime's delay instead of setTimeout
          animate(newEls, {
            opacity: [0, 1],
            // Hierarchy-based scale (Material Design principle)
            scale: tierIndex === 0 ? [0.96, 1] : [0.98, 1], // h1 gets prominent scale
            duration: config.duration,
            ease: config.ease,
            delay: stagger(config.stagger, { start: delay }) // Correct stagger syntax with start delay
          })
        }
      })
    }
  }
  
  // PAGE TRANSITIONS - Clean fades
  const transition = {
    out: (element: HTMLElement) => animate(element, {
      opacity: [1, 0],
      duration: timing.value.normal,
      ease: easing.standard
    }),
    
    in: (element: HTMLElement) => animate(element, {
      opacity: [0, 1],
      duration: timing.value.normal,
      ease: easing.standard
    })
  }
  
  // NUMBER COUNTERS - For stats
  const counter = (element: HTMLElement, value: number, options: any = {}) => {
    const config = {
      duration: timing.value.slow,
      ease: easing.standard,
      formatter: (val: number) => Math.round(val).toString(),
      ...options
    }
    
    animate({ count: 0 }, {
      count: value,
      duration: config.duration,
      ease: config.ease,
      update: (anim: any) => {
        const currentValue = anim.animatables[0].target.count
        element.textContent = config.formatter(currentValue)
      }
    })
  }
  
  // CARD INTERACTIONS - Research-based micro-interactions
  const card = {
    // PREPARATORY MOTION: Slight anticipation before main hover
    hover: (element: HTMLElement) => {
      // Two-stage hover: anticipation then action (Disney animation principle)
      animate(element, {
        keyframes: [
          { scale: 1 },
          { scale: 0.99 },      // Slight pullback (anticipation)
          { scale: 1.03 }       // Main hover state
        ],
        duration: timing.value.quick,  // 200ms - micro-interaction timing
        ease: easing.expressive  // IBM Carbon expressive for significant moments
      })
    },
    
    leave: (element: HTMLElement) => animate(element, {
      scale: [1.03, 1],
      duration: timing.value.quick,
      ease: easing.decelerate  // Ease-out for exits (Material Design)
    })
  }
  
  // Helper: Check if element is visible
  const isVisible = (el: HTMLElement) => {
    const { top, bottom } = el.getBoundingClientRect()
    return top < window.innerHeight * 0.8 && bottom > 0
  }
  
  return {
    // Core systems
    reveal,
    transition,
    counter,
    card,
    
    // Direct access to primitives
    timing,
    easing,
    staggers,
    animate,
    stagger,
    
    // Debug utilities
    debugMultiplier
  }
}