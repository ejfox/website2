import { useIntersectionObserver } from '@vueuse/core'
import type { MaybeElementRef as _MaybeElementRef } from '@vueuse/core'
import { 
  animate, 
  stagger, 
  createAnimatable as _createAnimatable, 
  createTimeline as _createTimeline,
  utils as _utils
} from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

export interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  duration?: number
  ease?: string
  initialY?: number
  initialX?: number
  debug?: boolean
}

type AnimationTarget = HTMLElement | SVGElement | null

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  if (process.server) {
    return {
      slideUp: () => {},
      slideLeft: () => {},
      fadeIn: () => {},
      expandLine: () => {}
    }
  }

  // Track which elements have been animated
  const animatedElements = new Set()
  const { timing } = useAnimations()

  const defaults = {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    duration: timing.value.dramatic, // was 1200
    ease: 'outExpo',
    initialY: 28,
    initialX: 0,
    debug: false
  }

  const config = { ...defaults, ...options }

  function slideUp(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    // Set initial state
    target.style.opacity = '0'
    target.style.transform = 'translateY(12px)'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)

          // Separate animations for smoother effect
          // Animation disabled following delete-driven development
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';

          stop()
        }
      },
      {
        threshold: 0.15,
        rootMargin: '-5% 0px -5% 0px'
      }
    )
    return stop
  }

  function slideLeft(
    target: AnimationTarget,
    options: Record<string, any> = {}
  ) {
    if (!target) return
    if (animatedElements.has(target)) return

    // Set initial state
    target.style.opacity = '0'
    target.style.transform = 'translateX(-20px)'
    target.style.scale = '0.98'
    target.style.transformOrigin = 'left center'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          stop()
        }
      },
      { threshold: config.threshold, rootMargin: config.rootMargin }
    )
    return stop
  }

  function fadeIn(target: AnimationTarget) {
    if (!target) return
    if (animatedElements.has(target)) return

    // Set initial state
    target.style.opacity = '0'
    target.style.transform = 'rotate(-1deg) scale(0.98)'
    target.style.transformOrigin = 'center center'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          stop() // Stop observing after animation starts
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin
      }
    )

    return stop
  }

  function expandLine(target: AnimationTarget) {
    if (!target) return
    if (animatedElements.has(target)) return

    // Set initial state
    target.style.opacity = '0'
    target.style.transform = 'scaleX(0)'
    target.style.transformOrigin = 'center center'
    target.style.mask =
      'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)'
    target.style.webkitMask =
      'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          stop()
        }
      },
      {
        threshold: config.threshold,
        rootMargin: '0px 0px -15% 0px'
      }
    )
    return stop
  }

  function setupAnimation(
    element: AnimationTarget,
    animationOptions: Record<string, any>
  ) {
    if (!element) return
    if (animatedElements.has(element)) return

    // Set initial state
    element.style.opacity = '0'
    element.style.transform = 'translateY(30px)'
    element.style.transformOrigin = 'center bottom'
    element.style.filter = 'drop-shadow(0 0 0 rgba(0,0,0,0))'

    const { stop } = useIntersectionObserver(
      element,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(element)
          stop()
        }
      },
      {
        threshold: 0.15,
        rootMargin: config.rootMargin
      }
    )
    return stop
  }

  // Clean data reveal animation
  function dataStream(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    // Set initial state
    target.style.opacity = '0'
    target.style.transform = 'translateX(-2px) scale(0.99)'
    target.style.filter = 'blur(0.5px)'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          // Clean reveal with subtle blur
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-2% 0px -5% 0px' }
    )
    return stop
  }

  // Emphasis animation for important content
  function criticalHighlight(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    target.style.opacity = '0'
    target.style.transform = 'scale(0.96)'
    target.style.filter = 'contrast(0.9)'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          // Subtle emphasis reveal
          stop()
        }
      },
      { threshold: 0.15, rootMargin: '-3% 0px -8% 0px' }
    )
    return stop
  }

  // Vertical reveal animation
  function systemScan(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    target.style.opacity = '0'
    target.style.transform = 'scaleY(0.2) scaleX(1)'
    target.style.transformOrigin = 'top left'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          // Clean vertical expand
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-5% 0px -10% 0px' }
    )
    return stop
  }

  // Sequential reveal for multiple elements
  function dataCascade(targets: HTMLElement[] | Element[], options: Record<string, any> = {}) {
    if (!targets || targets.length === 0) return
    
    const elements = Array.from(targets) as HTMLElement[]
    let hasTriggered = false

    // Set initial states
    elements.forEach((el, i) => {
      if (animatedElements.has(el)) return
      el.style.opacity = '0'
      el.style.transform = `translateY(${3 + i}px) scale(0.99)`
      el.style.filter = 'blur(0.3px)'
    })

    const { stop } = useIntersectionObserver(
      elements[0],
      ([{ isIntersecting }]) => {
        if (isIntersecting && !hasTriggered) {
          hasTriggered = true
          
          elements.forEach((el, i) => {
            if (animatedElements.has(el)) return
            animatedElements.add(el)
            
            setTimeout(() => {
              // Animation disabled following delete-driven development
              el.style.opacity = '1';
              el.style.transform = 'scale(1)';
            }, i * 50)
          })
          
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-2% 0px -8% 0px' }
    )
    return stop
  }

  // Matrix-style transform reveal
  function matrixScan(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    target.style.opacity = '0'
    target.style.transform = 'matrix(1,0,0,0.2,0,0)'
    target.style.filter = 'contrast(1.1)'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          // Clean matrix transform
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-5% 0px -10% 0px' }
    )
    return stop
  }

  // Multi-stage processing reveal
  function dataProcessing(target: AnimationTarget, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          // Clean multi-stage keyframes
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-3% 0px -5% 0px' }
    )
    return stop
  }

  // Grid-based stagger reveal
  function gridDataReveal(targets: HTMLElement[] | Element[], gridConfig: {cols: number, rows: number} = {cols: 3, rows: 3}) {
    if (!targets || targets.length === 0) return
    
    const elements = Array.from(targets) as HTMLElement[]
    let hasTriggered = false

    // Set initial states
    elements.forEach((el, _i) => {
      if (animatedElements.has(el)) return
      el.style.opacity = '0'
      el.style.transform = 'scale(0.92) translateY(6px)'
      el.style.filter = 'blur(0.4px)'
    })

    const { stop } = useIntersectionObserver(
      elements[0],
      ([{ isIntersecting }]) => {
        if (isIntersecting && !hasTriggered) {
          hasTriggered = true
          
          elements.forEach(el => animatedElements.add(el))
          
          // Grid animation disabled following delete-driven development
          
          stop()
        }
      },
      { threshold: 0.1, rootMargin: '-2% 0px -8% 0px' }
    )
    return stop
  }

  // Sequential typing effect
  function terminalReveal(target: AnimationTarget, _options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    const originalText = target.textContent || ''
    target.textContent = ''

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          target.style.opacity = '1'
          target.style.fontFamily = 'monospace'
          
          // Clean typing animation
          let currentIndex = 0
          const typeInterval = setInterval(() => {
            if (currentIndex <= originalText.length) {
              target.textContent = originalText.slice(0, currentIndex)
              currentIndex++
            } else {
              clearInterval(typeInterval)
            }
          }, 35)
          
          stop()
        }
      },
      { threshold: 0.15, rootMargin: '-2% 0px -5% 0px' }
    )
    return stop
  }

  // Number counting animation with spring physics
  function dataCounter(target: AnimationTarget, finalValue: number, options: Record<string, any> = {}) {
    if (!target) return
    if (animatedElements.has(target)) return

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          
          const counter = { value: 0 }
          
          // Clean reveal
          target.style.opacity = '0'
          target.style.transform = 'scale(0.9)'
          
          
          // Number animation disabled following delete-driven development
          setTimeout(() => {
            target.style.opacity = '1';
            target.style.transform = 'scale(1)';
          }, timing.value.quick) // was 150
          
          stop()
        }
      },
      { threshold: 0.15, rootMargin: '-5% 0px -10% 0px' }
    )
    return stop
  }

  return {
    setupAnimation,
    slideUp,
    slideLeft,
    fadeIn,
    expandLine,
    dataStream,
    criticalHighlight,
    systemScan,
    dataCascade,
    matrixScan,
    // Advanced anime.js v4 features
    dataProcessing,
    gridDataReveal,
    terminalReveal,
    dataCounter
  }
}
