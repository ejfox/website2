import { useIntersectionObserver } from '@vueuse/core'
import type { MaybeElementRef } from '@vueuse/core'
import { animate, stagger } from '~/anime.esm.js'

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

  const defaults = {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    duration: 1200,
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
    target.style.transform = 'translateY(20px)'
    target.style.transformOrigin = 'center bottom'
    target.style.filter = 'drop-shadow(0 0 0 rgba(0,0,0,0))'

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          animatedElements.add(target)
          animate(target, {
            opacity: [0, 1],
            translateY: [20, 0],
            filter: [
              'drop-shadow(0 0 0 rgba(0,0,0,0))',
              'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
            ],
            duration: 1800,
            ease: 'spring(1, 95, 8, 0)',
            ...options
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
            translateX: [-20, 0],
            scale: [0.98, 1],
            duration: 1400,
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
            duration: 1800,
            ease: 'cubicBezier(.4, 0, .2, 1)'
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
            duration: 1400,
            ease: 'cubicBezier(0.4, 0.1, 0.3, 1)'
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

  return {
    slideUp,
    slideLeft,
    fadeIn,
    expandLine
  }
}