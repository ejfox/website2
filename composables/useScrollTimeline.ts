import { useIntersectionObserver } from '@vueuse/core'
import { type Ref } from 'vue'
import { 
  animate, 
  stagger, 
  createTimeline
} from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

export interface ScrollTimelineOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
  debug?: boolean
}

export function useScrollTimeline(options: ScrollTimelineOptions = {}) {
  if (process.server) {
    return {
      observeElement: () => {},
      observeTimeline: () => {}
    }
  }

  // Track which elements have been animated
  const animatedElements = new Set()
  const { timing } = useAnimations()

  const defaults = {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    once: true,
    debug: false
  }

  const config = { ...defaults, ...options }

  // Basic element scroll trigger
  function observeElement(
    target: Ref<HTMLElement | null> | HTMLElement | null,
    animationFn: () => void | Promise<void>
  ) {
    if (!target) return

    const element = 'value' in target ? target.value : target
    if (!element) return
    if (animatedElements.has(element)) return

    const { stop } = useIntersectionObserver(
      element,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(element)
          
          if (config.debug) {
            console.log('🎬 Scroll animation triggered for:', element)
          }
          
          // Execute animation function
          const result = animationFn()
          if (result instanceof Promise) {
            result.catch(err => console.warn('Animation error:', err))
          }
          
          if (config.once) {
            stop()
          }
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin
      }
    )
    
    return stop
  }

  // Timeline-based scroll animation
  function observeTimeline(
    target: Ref<HTMLElement | null> | HTMLElement | null,
    timelineFn: () => any
  ) {
    if (!target) return

    const element = 'value' in target ? target.value : target
    if (!element) return
    if (animatedElements.has(element)) return

    const { stop } = useIntersectionObserver(
      element,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(element)
          
          if (config.debug) {
            console.log('🎭 Timeline animation triggered for:', element)
          }
          
          try {
            timelineFn()
          } catch (err) {
            console.warn('Timeline animation error:', err)
          }
          
          if (config.once) {
            stop()
          }
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin
      }
    )
    
    return stop
  }

  // Epic bars animation for scroll trigger
  function createBarsAnimation(
    containerRef: Ref<HTMLElement | null>,
    barsSelector: string = '.bar, .category-bar-fill, .lang-bar-fill, .histogram-bar'
  ) {
    return observeTimeline(containerRef, () => {
      if (!containerRef.value) return

      const bars = containerRef.value.querySelectorAll(barsSelector)
      if (bars.length) {
        // NUKED BY BLOODHOUND: // animate(Array.from(bars), {
          scaleX: [0, 1.1, 1],
          scaleY: [0.3, 1.2, 1],
          duration: timing.value.slow, // was 600
          delay: stagger(100, { from: 'first' }),
          ease: 'outElastic(1, .8)'
        })
      }
    })
  }

  // Epic grid animation for scroll trigger
  function createGridAnimation(
    containerRef: Ref<HTMLElement | null>,
    gridSelector: string = '.grid-item, .waffle-cell, .contribution-square',
    gridConfig: { cols: number, rows: number } = { cols: 10, rows: 10 }
  ) {
    return observeTimeline(containerRef, () => {
      if (!containerRef.value) return

      const gridItems = containerRef.value.querySelectorAll(gridSelector)
      if (gridItems.length) {
        // NUKED BY BLOODHOUND: // animate(Array.from(gridItems), {
          keyframes: [
            { opacity: 0, scale: 0, rotateZ: -45 },
            { opacity: 0.8, scale: 1.3, rotateZ: 15 },
            { opacity: 1, scale: 1, rotateZ: 0 }
          ],
          duration: timing.value.normal, // was 400
          delay: stagger(15, { grid: [gridConfig.cols, gridConfig.rows], from: 'center' }),
          ease: 'outElastic(1, .9)'
        })
      }
    })
  }

  // Epic cascade animation for scroll trigger
  function createCascadeAnimation(
    containerRef: Ref<HTMLElement | null>,
    itemsSelector: string = '.cascade-item'
  ) {
    return observeTimeline(containerRef, () => {
      if (!containerRef.value) return

      const items = containerRef.value.querySelectorAll(itemsSelector)
      if (items.length) {
        // NUKED BY BLOODHOUND: // animate(Array.from(items), {
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.95, 1.02, 1],
          duration: timing.value.normal, // was 450
          delay: stagger(80),
          ease: 'outBack(1.7)'
        })
      }
    })
  }

  // Epic timeline for complex stats components
  function createStatsTimeline(
    containerRef: Ref<HTMLElement | null>,
    config: {
      primaryStat?: string
      bars?: string
      grid?: string
      cascade?: string
      gridConfig?: { cols: number, rows: number }
    }
  ) {
    return observeTimeline(containerRef, () => {
      if (!containerRef.value) return

      const timeline = createTimeline()
      
      // Stage 1: Primary stat entrance
      if (config.primaryStat) {
        const primaryEl = containerRef.value.querySelector(config.primaryStat)
        if (primaryEl) {
          timeline.add(primaryEl, {
            keyframes: [
              { opacity: 0, scale: 0.8, rotateX: -15, filter: 'blur(1px)' },
              { opacity: 0.8, scale: 1.05, rotateX: 5, filter: 'blur(0.3px)' },
              { opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }
            ],
            duration: timing.value.slow, // was 700
            ease: 'outElastic(1, .8)'
          })
        }
      }
      
      // Stage 2: Bars animation
      if (config.bars) {
        const bars = containerRef.value.querySelectorAll(config.bars)
        if (bars.length) {
          timeline.add(Array.from(bars), {
            scaleX: [0, 1.1, 1],
            scaleY: [0.3, 1.2, 1],
            duration: timing.value.slow, // was 600
            delay: stagger(100),
            ease: 'outElastic(1, .8)'
          }, '-=400')
        }
      }
      
      // Stage 3: Grid animation
      if (config.grid) {
        const gridItems = containerRef.value.querySelectorAll(config.grid)
        if (gridItems.length) {
          timeline.add(Array.from(gridItems), {
            keyframes: [
              { opacity: 0, scale: 0, rotateZ: 180 },
              { opacity: 0.8, scale: 1.2, rotateZ: -10 },
              { opacity: 1, scale: 1, rotateZ: 0 }
            ],
            duration: timing.value.normal, // was 500
            delay: stagger(8, { 
              grid: [config.gridConfig?.cols || 10, config.gridConfig?.rows || 10], 
              from: 'center' 
            }),
            ease: 'outElastic(1, .9)'
          }, '-=200')
        }
      }
      
      // Stage 4: Cascade animation
      if (config.cascade) {
        const cascadeItems = containerRef.value.querySelectorAll(config.cascade)
        if (cascadeItems.length) {
          timeline.add(Array.from(cascadeItems), {
            opacity: [0, 1],
            translateY: [15, 0],
            scale: [0.95, 1.02, 1],
            duration: timing.value.normal, // was 450
            delay: stagger(80),
            ease: 'outBack(1.7)'
          }, '-=300')
        }
      }
    })
  }

  return {
    observeElement,
    observeTimeline,
    createBarsAnimation,
    createGridAnimation,
    createCascadeAnimation,
    createStatsTimeline
  }
}