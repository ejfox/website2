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
          animate(target, {
            opacity: [0, 1],
            duration: timing.value.normal, // was 400
            ease: 'linear' // Linear fade for smoothness
          })

          animate(target, {
            y: [12, 0],
            duration: timing.value.slow, // was 800
            ease: [0.16, 1, 0.3, 1], // Custom ease-out
            ...options
          })

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
          animate(target, {
            opacity: [0, 1],
            x: [-20, 0],
            scale: [0.98, 1],
            duration: timing.value.dramatic, // was 1400
            ease: 'outElastic(1, .8)',
            ...options
          })
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
          animate(target, {
            opacity: [0, 1],
            rotate: [-1, 0],
            scale: [0.98, 1],
            duration: timing.value.glacial, // was 1800
            ease: [0.4, 0, 0.2, 1]
          })
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
          animate(target, {
            opacity: [0, 1],
            scaleX: [0, 1],
            duration: timing.value.dramatic, // was 1400
            ease: [0.4, 0.1, 0.3, 1]
          })
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
          animate(element, {
            opacity: [0, 1],
            y: [30, 0],
            filter: [
              'drop-shadow(0 0 0 rgba(0,0,0,0))',
              'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
            ],
            duration: timing.value.normal, // was 350
            ease: 'spring(1, 80, 10, 0)',
            ...animationOptions
          })
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
          animate(target, {
            opacity: [0, 1],
            x: [-2, 0],
            scale: [0.99, 1],
            filter: ['blur(0.5px)', 'blur(0px)'],
            duration: timing.value.normal, // was 500
            ease: [0.25, 0.1, 0.25, 1],
            ...options
          })
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
          animate(target, {
            opacity: [0, 1],
            scale: [0.96, 1.01, 1],
            filter: ['contrast(0.9)', 'contrast(1.05)', 'contrast(1)'],
            duration: timing.value.slow, // was 700
            ease: 'outElastic(1, .8)',
            ...options
          })
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
          animate(target, {
            opacity: [0, 1],
            scaleY: [0.2, 1.02, 1],
            scaleX: [1, 0.99, 1],
            duration: timing.slow, // was 650
            ease: [0.4, 0, 0.2, 1],
            ...options
          })
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
              animate(el, {
                opacity: [0, 1],
                y: [3 + i, 0],
                scale: [0.99, 1],
                filter: ['blur(0.3px)', 'blur(0px)'],
                duration: timing.value.quick + (i * 30), // was 250 + (i * 30)
                ease: [0.25, 0.1, 0.25, 1],
                ...options
              })
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
          animate(target, {
            opacity: [0, 1],
            transform: [
              'matrix(1,0,0,0.2,0,0)',
              'matrix(1,0,0,1.01,0,0)',
              'matrix(1,0,0,1,0,0)'
            ],
            filter: ['contrast(1.1)', 'contrast(1)'],
            duration: timing.slow, // was 550
            ease: [0.4, 0, 0.2, 1],
            ...options
          })
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
          animate(target, {
            keyframes: [
              { opacity: 0, scale: 0.96, filter: 'blur(0.8px) contrast(1.1)' },
              { opacity: 0.6, scale: 1.005, filter: 'blur(0.3px) contrast(1.05)' },
              { opacity: 1, scale: 1, filter: 'blur(0px) contrast(1)' }
            ],
            duration: timing.slow, // was 750
            ease: 'cubicBezier(0.4, 0, 0.2, 1)',
            ...options
          })
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
          
          // Clean grid stagger
          animate(elements, {
            opacity: [0, 1],
            scale: [0.92, 1.01, 1],
            y: [6, 0],
            filter: ['blur(0.4px)', 'blur(0px)'],
            duration: timing.value.normal, // was 500
            delay: stagger(60, {
              grid: [gridConfig.cols, gridConfig.rows],
              from: 'center',
              ease: 'outQuad'
            }),
            ease: 'outElastic(1, .7)'
          })
          
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
          
          animate(target, {
            opacity: [0, 1],
            scale: [0.9, 1.02, 1],
            duration: timing.value.normal, // was 350
            ease: 'outElastic(1, .8)'
          })
          
          // Number animation
          setTimeout(() => {
            animate(counter, {
              value: finalValue,
              duration: timing.value.slow, // was 1000
              ease: 'spring(1, 80, 10, 0)',
              update: () => {
                const formattedValue = Math.round(counter.value).toLocaleString()
                target.textContent = formattedValue
              },
              ...options
            })
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
