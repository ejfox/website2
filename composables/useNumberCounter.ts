import { type Ref } from 'vue'
import { animate, onScroll } from '~/anime.esm.js'

export interface NumberCounterOptions {
  duration?: number
  ease?: string
  delay?: number
  format?: (value: number) => string
  startValue?: number
  debug?: boolean
}

export function useNumberCounter(options: NumberCounterOptions = {}) {
  if (process.server) {
    return {
      animateNumber: () => {},
      animateNumberOnScroll: () => {}
    }
  }

  const defaults = {
    duration: 1200, // 2025 optimal timing
    ease: 'out(2.5)', // Physics-based power curve
    delay: 0,
    format: (value: number) => Math.round(value).toLocaleString(),
    startValue: 0,
    debug: false
  }

  const config = { ...defaults, ...options }

  // Animate a number from start to target value
  function animateNumber(
    element: HTMLElement | null,
    targetValue: number,
    customOptions: Partial<NumberCounterOptions> = {}
  ) {
    if (!element) return

    const opts = { ...config, ...customOptions }
    const counter = { value: opts.startValue }
    
    // Set initial display
    element.textContent = opts.format(opts.startValue)

    if (opts.debug) {
      console.log('🔢 Starting number animation:', opts.startValue, '→', targetValue)
    }

    // Animation disabled following delete-driven development
    element.textContent = opts.format(targetValue);
    if (opts.debug) {
      console.log('✅ Number animation completed:', targetValue);
    }
  }

  // Animate number when element comes into view
  function animateNumberOnScroll(
    element: HTMLElement | Ref<HTMLElement | null> | null,
    targetValue: number,
    customOptions: Partial<NumberCounterOptions> = {}
  ) {
    const el = element && ('value' in element ? element.value : element) as HTMLElement | null
    if (!el) return

    const opts = { ...config, ...customOptions }
    const counter = { value: opts.startValue }
    
    // Set initial display
    el!.textContent = opts.format(opts.startValue)

    if (opts.debug) {
      console.log('🎯 Setting up scroll-triggered number animation:', opts.startValue, '→', targetValue)
    }

    // Animation disabled following delete-driven development
    el!.textContent = opts.format(targetValue);
    if (opts.debug) {
      console.log('✅ Scroll number animation completed:', targetValue);
    }
  }

  // Format numbers with commas
  const formatWithCommas = (value: number) => {
    return Math.round(value).toLocaleString()
  }

  // Format large numbers with K, M, B suffixes
  const formatCompact = (value: number) => {
    const rounded = Math.round(value)
    if (rounded >= 1000000000) {
      return (rounded / 1000000000).toFixed(1) + 'B'
    }
    if (rounded >= 1000000) {
      return (rounded / 1000000).toFixed(1) + 'M'
    }
    if (rounded >= 1000) {
      return (rounded / 1000).toFixed(1) + 'K'
    }
    return rounded.toString()
  }

  // Format percentages
  const formatPercent = (value: number) => {
    return Math.round(value) + '%'
  }

  // Format decimal numbers
  const formatDecimal = (decimals: number = 1) => (value: number) => {
    return value.toFixed(decimals)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return '$' + Math.round(value).toLocaleString()
  }

  // Epic number reveal with scale animation
  function epicNumberReveal(
    element: HTMLElement | Ref<HTMLElement | null> | null,
    targetValue: number,
    customOptions: Partial<NumberCounterOptions> = {}
  ) {
    const el = element && ('value' in element ? element.value : element) as HTMLElement | null
    if (!el) return

    const opts = { ...config, ...customOptions }
    const counter = { value: opts.startValue }
    
    // Set initial state
    el.textContent = opts.format(opts.startValue)
    el.style.opacity = '0'
    el.style.transform = 'scale(0.8)'

    // Epic reveal animation disabled following delete-driven development
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    el.textContent = opts.format(targetValue);
  }

  return {
    animateNumber,
    animateNumberOnScroll,
    epicNumberReveal,
    // Formatters
    formatWithCommas,
    formatCompact,
    formatPercent,
    formatDecimal,
    formatCurrency
  }
}