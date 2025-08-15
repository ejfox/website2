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
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
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
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
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
        // Bar animation disabled following delete-driven development
        bars.forEach((bar, index) => {
          setTimeout(() => {
            (bar as HTMLElement).style.transform = 'scaleX(1) scaleY(1)';
          }, index * 100);
        });
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
        // Grid animation disabled following delete-driven development
        gridItems.forEach((item, index) => {
          setTimeout(() => {
            (item as HTMLElement).style.opacity = '1';
            (item as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
          }, index * 15);
        });
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
        // Cascade animation disabled following delete-driven development
        items.forEach((item, index) => {
          setTimeout(() => {
            (item as HTMLElement).style.opacity = '1';
            (item as HTMLElement).style.transform = 'translateY(0) scale(1)';
          }, index * 80);
        });
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

      // Timeline animation disabled following delete-driven development
      
      // Stage 1: Primary stat entrance
      if (config.primaryStat) {
        const primaryEl = containerRef.value.querySelector(config.primaryStat)
        if (primaryEl) {
          (primaryEl as HTMLElement).style.opacity = '1';
          (primaryEl as HTMLElement).style.transform = 'scale(1) rotateX(0deg)';
          (primaryEl as HTMLElement).style.filter = 'blur(0px)';
        }
      }
      
      // Stage 2: Bars animation
      if (config.bars) {
        const bars = containerRef.value.querySelectorAll(config.bars)
        bars.forEach((bar, index) => {
          setTimeout(() => {
            (bar as HTMLElement).style.transform = 'scaleX(1) scaleY(1)';
          }, index * 100);
        });
      }
      
      // Stage 3: Grid animation
      if (config.grid) {
        const gridItems = containerRef.value.querySelectorAll(config.grid)
        gridItems.forEach((item, index) => {
          setTimeout(() => {
            (item as HTMLElement).style.opacity = '1';
            (item as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
          }, index * 8);
        });
      }
      
      // Stage 4: Cascade animation
      if (config.cascade) {
        const cascadeItems = containerRef.value.querySelectorAll(config.cascade)
        cascadeItems.forEach((item, index) => {
          setTimeout(() => {
            (item as HTMLElement).style.opacity = '1';
            (item as HTMLElement).style.transform = 'translateY(0) scale(1)';
          }, index * 80);
        });
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