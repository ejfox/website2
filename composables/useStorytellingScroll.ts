/**
 * STORYTELLING SCROLL SYSTEM
 * 
 * Transforms scrolling from mechanical navigation into narrative progression.
 * Small implementation, huge narrative impact - inspired by documentary films
 * and Apple's marketing pages.
 * 
 * PERFORMANCE PHILOSOPHY:
 * - Single RAF loop for all scroll effects
 * - Intersection Observer for enter/exit triggers  
 * - Transform-only animations (no reflow/repaint)
 * - Debounced viewport calculations
 * 
 * NARRATIVE PRINCIPLES:
 * - Depth through parallax (background/foreground layers)
 * - Progressive revelation (content builds meaning)
 * - Pacing control (strategic delays and accelerations) 
 * - Typography choreography (letters/words/lines)
 * 
 * USAGE:
 * const story = useStorytellingScroll()
 * story.enableParallax('.hero-bg', { speed: 0.5 })
 * story.progressiveReveal('.content-section')
 * story.typewriterEffect('.headline')
 */

import { useRafFn, useIntersectionObserver, useDebounceFn } from '@vueuse/core'
import { animate, stagger, createTimeline, eases, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

// DOM types handled by casting to HTMLElement[] arrays

interface ParallaxOptions {
  speed?: number        // 0-1, where 0.5 = half scroll speed
  direction?: 'y' | 'x' // Direction of movement
  intensity?: number    // Multiplier for effect strength
}

interface RevealOptions {
  threshold?: number    // When to trigger reveal (0-1)
  stagger?: number     // Delay between elements
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number    // Initial offset distance
}

interface TypographyOptions {
  speed?: number       // Characters per second
  cursor?: boolean     // Show blinking cursor
  sound?: boolean      // Visual 'sound' effects (disabled for accessibility)
  delay?: number       // Initial delay before starting
  completeAt?: number  // Scroll progress where text is fully revealed (0-1, default 0.5)
}

export function useStorytellingScroll() {
  if (process.server) {
    return {
      enableParallax: () => {},
      progressiveReveal: () => {},
      typewriterEffect: () => {},
      depthLayers: () => {},
      narrativePacing: () => {},
      cleanup: () => {}
    }
  }

  const { timing, easing, staggers } = useAnimations()
  
  // Track all active effects
  const parallaxElements = new Map()
  const revealElements = new Set()
  const typingElements = new Map()
  const depthLayers = new Map()
  
  // Scroll state
  let scrollY = 0
  let viewportHeight = window.innerHeight
  let isScrolling = false
  let documentHeight = document.body.scrollHeight
  
  // Single RAF loop for all effects
  const { pause, resume } = useRafFn(() => {
    const newScrollY = window.scrollY
    const direction = newScrollY > scrollY ? 'down' : 'up'
    scrollY = newScrollY
    documentHeight = document.body.scrollHeight // Update document height
    
    // Update parallax effects
    updateParallaxElements()
    
    // Update depth layers
    updateDepthLayers(direction)
    
    isScrolling = true
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      isScrolling = false
    }, 150)
  }, { immediate: false })

  let scrollTimeout: ReturnType<typeof setTimeout>

  // Debounced viewport updates
  const updateViewport = useDebounceFn(() => {
    viewportHeight = window.innerHeight
  }, 250)

  window.addEventListener('resize', updateViewport)

  /**
   * SCROLL-DRIVEN PARALLAX SYSTEM
   * Elements animate directly with scroll position using anime.js ScrollObserver
   */
  function enableParallax(selector: string, options: ParallaxOptions = {}) {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return

    const config = {
      speed: 0.5,
      direction: 'y' as const,
      intensity: 1,
      ...options
    }

    elements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      // Create scroll-driven animation using anime.js
      const scrollAnimation = animate(htmlElement, {
        y: [0, -300 * config.speed * config.intensity], // Parallax range
        ease: 'linear',
        autoplay: false, // Controlled by scroll
        duration: 1000 // Total scroll distance
      })

      // Link animation to scroll using onScroll
      const observer = onScroll({
        target: htmlElement,
        onUpdate: (self) => {
          // Map scroll progress (0-1) to animation progress
          const progress = self.progress || 0
          scrollAnimation.seek(progress * scrollAnimation.duration)
        }
      })

      // Store for cleanup
      parallaxElements.set(htmlElement, { 
        ...config, 
        animation: scrollAnimation, 
        observer 
      })
      
      htmlElement.style.willChange = 'transform'
      htmlElement.style.backfaceVisibility = 'hidden'
    })
  }

  function updateParallaxElements() {
    parallaxElements.forEach((config, element) => {
      const rect = element.getBoundingClientRect()
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
      
      if (progress >= -0.1 && progress <= 1.1) {
        const movement = (scrollY * config.speed * config.intensity)
        
        if (config.direction === 'y') {
          element.style.transform = `translate3d(0, ${movement}px, 0)`
        } else {
          element.style.transform = `translate3d(${movement}px, 0, 0)`
        }
      }
    })
  }

  /**
   * PROGRESSIVE REVELATION SYSTEM
   * Content builds meaning as user scrolls - like a documentary unfolding
   */
  function progressiveReveal(selector: string, options: RevealOptions = {}) {
    const elements = document.querySelectorAll(selector) as unknown as HTMLElement[]
    if (!elements.length) return

    const config = {
      threshold: 0.15,
      stagger: staggers.tight,
      direction: 'up' as const,
      distance: 30,
      ...options
    }

    // Set initial states for all elements
    elements.forEach(element => {
      element.style.opacity = '0'
      // @ts-expect-error - fade is a valid direction option
      if (config.direction !== 'fade') {
        const initialTransform = getInitialTransform(config.direction, config.distance)
        element.style.transform = initialTransform
      }
      element.style.willChange = 'transform, opacity'
    })

    // Use Intersection Observer to trigger the reveal
    const { stop } = useIntersectionObserver(
      elements,
      ([entry]) => {
        if (entry.isIntersecting) {
          // Create anime.js timeline for orchestrated reveal
          const _tl = createTimeline({
            autoplay: true,
            duration: timing.value.slow,
            // @ts-expect-error - ease is a valid TimelineParams property
            ease: eases.outExpo
          } as any)

          // Add staggered animations using proper anime.js API
          animate(Array.from(elements), {
            opacity: [0, 1],
            // @ts-expect-error - fade is a valid direction
            ...(config.direction === 'fade' ? {} : {
              ...(config.direction === 'up' && { y: [config.distance, 0] }),
              ...(config.direction === 'down' && { y: [-config.distance, 0] }),
              ...(config.direction === 'left' && { x: [config.distance, 0] }),
              ...(config.direction === 'right' && { x: [-config.distance, 0] })
            }),
            duration: timing.value.slow,
            ease: 'outExpo',
            delay: stagger(config.stagger), // Use anime.js stagger function
            complete: () => {
              elements.forEach(el => el.style.willChange = 'auto')
            }
          })
          
          stop()
        }
      },
      { 
        threshold: config.threshold,
        rootMargin: '0px 0px -10% 0px'
      }
    )
  }

  function getInitialTransform(direction: string, distance: number): string {
    switch (direction) {
      case 'fade': return 'none' // No transform, just opacity
      case 'up': return `translateY(${distance}px)`
      case 'down': return `translateY(-${distance}px)`
      case 'left': return `translateX(${distance}px)`
      case 'right': return `translateX(-${distance}px)`
      default: return `translateY(${distance}px)`
    }
  }

  /**
   * SCROLL-BASED TYPOGRAPHY
   * Letters and words appear with scroll position - creates reading rhythm
   */
  function typewriterEffect(selector: string, options: TypographyOptions = {}) {
    const elements = document.querySelectorAll(selector) as unknown as HTMLElement[]
    if (!elements.length) return

    const config = {
      speed: 50, // Characters per second
      cursor: false,
      sound: false, // Visual effects disabled for accessibility
      delay: 0,
      ...options
    }

    elements.forEach(element => {
      if (typingElements.has(element)) return
      
      const originalText = element.textContent || ''
      const characters = originalText.split('')
      
      // Create character spans
      const charSpans = characters.map((char, index) => {
        if (char === ' ') return '<span class="story-char story-space"> </span>'
        return `<span class="story-char" data-index="${index}">${char}</span>`
      }).join('')
      
      element.innerHTML = charSpans
      element.style.willChange = 'contents'
      
      const charElements = element.querySelectorAll('.story-char:not(.story-space)') as unknown as HTMLElement[]
      
      // Set initial state
      charElements.forEach(char => {
        char.style.opacity = '0'
        char.style.transform = 'translateY(10px)'
        char.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      })
      
      typingElements.set(element, { characters: charElements, config })
      
      // Intersection observer to trigger typing
      const { stop } = useIntersectionObserver(
        element,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            setTimeout(() => {
              typeCharacters(charElements, config)
            }, config.delay)
            stop()
          }
        },
        { threshold: 0.3 }
      )
    })
  }

  function typeCharacters(elements: HTMLElement[], config: TypographyOptions) {
    // Use anime.js stagger for smooth character reveals with elastic bounce
    animate(Array.from(elements), {
      opacity: [0, 1],
      y: [10, 0],
      scale: [0.8, 1], // Character pop effect
      rotate: [2, 0], // Subtle rotation for personality
      duration: 800,
      ease: 'outElastic(1, .6)', // Anime.js elastic easing
      delay: stagger(1000 / (config.speed || 50), {
        from: 'first', // Start from first character
        ease: 'linear'
      }),
      complete: () => {
        // Add blinking cursor at the end
        if (config.cursor && elements.length > 0) {
          const lastChar = elements[elements.length - 1]
          lastChar.insertAdjacentHTML('afterend', '<span class="story-cursor">|</span>')
        }
      }
    })
  }

  /**
   * DEPTH LAYER SYSTEM
   * Multiple parallax layers create cinematic depth
   */
  function createDepthLayers(layerConfig: Array<{ selector: string; depth: number }>) {
    layerConfig.forEach(({ selector, depth }) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        const htmlElement = element as HTMLElement
        depthLayers.set(htmlElement, { depth, originalY: 0 })
        htmlElement.style.willChange = 'transform'
      })
    })
    
    resume() // Start RAF loop
  }

  function updateDepthLayers(_direction: 'up' | 'down') {
    depthLayers.forEach((config, element) => {
      const rect = element.getBoundingClientRect()
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
      
      if (progress >= -0.2 && progress <= 1.2) {
        // Depth-based parallax with easing
        const movement = scrollY * (config.depth * 0.1)
        const easeAmount = Math.sin(progress * Math.PI) * 0.5 + 0.5
        const easedMovement = movement * easeAmount
        
        element.style.transform = `translate3d(0, ${easedMovement}px, 0)`
      }
    })
  }

  /**
   * NARRATIVE PACING SYSTEM
   * Controls revelation timing based on content importance
   */
  function narrativePacing(sections: Array<{ selector: string; weight: number }>) {
    sections.forEach(({ selector, weight }) => {
      const elements = document.querySelectorAll(selector)
      
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement
        const delay = weight * 100 // Convert weight to milliseconds
        
        const { stop } = useIntersectionObserver(
          htmlElement,
          ([{ isIntersecting }]) => {
            if (isIntersecting) {
              setTimeout(() => {
                animate(htmlElement, {
                  opacity: [0, 1],
                  scale: [0.98, 1],
                  translateY: [20, 0],
                  duration: timing.value.dramatic,
                  ease: easing.decelerate
                })
              }, delay + (index * staggers.normal))
              stop()
            }
          },
          { threshold: 0.1 }
        )
      })
    })
  }

  /**
   * CLEANUP FUNCTION
   * Remove event listeners and clear RAF loop
   */
  function cleanup() {
    pause()
    window.removeEventListener('resize', updateViewport)
    parallaxElements.clear()
    revealElements.clear()
    typingElements.clear()
    depthLayers.clear()
  }

  // Auto-cleanup on unmount
  onUnmounted(cleanup)

  /**
   * SCROLL-DRIVEN TEXT REVEAL
   * Characters appear based on scroll position - true scroll-linked animation
   */
  function scrollDrivenText(selector: string, options: TypographyOptions = {}) {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return

    const config = {
      speed: 80,
      cursor: false,
      completeAt: 0.5, // Default: fully typed by middle of viewport
      ...options
    }

    elements.forEach(element => {
      const text = element.textContent || ''
      const chars = text.split('')
      
      // Replace with individual character spans
      element.innerHTML = chars.map((char, i) => 
        `<span class="story-char" data-char="${i}">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('')

      const charElements = element.querySelectorAll('.story-char')
      
      // Create scroll-driven reveal for each character
      const textAnimation = animate(Array.from(charElements), {
        opacity: [0, 1],
        y: [15, 0],
        scale: [0.9, 1],
        rotate: [3, 0],
        duration: 2000,
        ease: 'outElastic(1, .8)', // Gentler elastic bounce
        delay: stagger(30, { from: 'first' }), // Tighter stagger for smoother typing
        autoplay: false
      })

      // Link to scroll position with configurable completion point
      const observer = onScroll({
        target: element,
        onUpdate: (self) => {
          // Scale progress so animation completes at specified scroll position
          const rawProgress = self.progress || 0
          const scaledProgress = Math.min(rawProgress / config.completeAt, 1)
          textAnimation.seek(scaledProgress * textAnimation.duration)
        }
      })

      typingElements.set(element as HTMLElement, { 
        animation: textAnimation, 
        observer,
        ...config 
      })
    })
  }

  return {
    // Core storytelling functions
    enableParallax,
    progressiveReveal,
    typewriterEffect,
    scrollDrivenText, // New scroll-linked text reveal
    createDepthLayers,
    narrativePacing,
    
    // Utility functions
    cleanup,
    
    // State access (for debugging)
    isScrolling: computed(() => isScrolling),
    scrollProgress: computed(() => {
      const maxScroll = Math.max(documentHeight - viewportHeight, 1)
      return Math.min(scrollY / maxScroll, 1)
    })
  }
}

/**
 * CSS VARIABLES FOR STORYTELLING
 * Add these to your global CSS for consistent storytelling effects
 */
export const storytellingCSS = `
.story-char {
  display: inline-block;
  will-change: transform, opacity;
}

.story-space {
  width: 0.25em;
}

.story-cursor {
  display: inline-block;
  width: 2px;
  background: currentColor;
  animation: story-blink 1s infinite;
  margin-left: 2px;
}

@keyframes story-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Parallax containers */
.story-parallax-container {
  overflow: hidden;
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Depth layers */
.story-depth-bg { z-index: 1; }
.story-depth-mid { z-index: 2; }
.story-depth-fg { z-index: 3; }

/* Performance optimizations */
.story-element {
  will-change: transform;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

/* Accessibility: Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  .story-char,
  .story-parallax-container,
  .story-element {
    transform: none !important;
    animation: none !important;
    transition: none !important;
  }
  
  .story-cursor {
    display: none;
  }
}
`