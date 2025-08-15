import { ref } from 'vue'

export function useAnimations() {
  // Basic motion tokens as a no-op default
  const timing = ref({
    micro: 80,
    quick: 160,
    normal: 300,
    slow: 600,
    dramatic: 900,
    glacial: 1200,
    slowest: 2400,
    expressive: 1200
  })

  const easing = ref({
    standard: 'cubicBezier(0.4, 0, 0.2, 1)'
  })

  const staggers = ref({
    tight: 60,
    normal: 100,
    loose: 150,
    dramatic: 200
  })

  // ⚡ PERFORMANCE UTILITIES for smooth animations! *SWOOSH*
  const optimizeElement = (element: HTMLElement) => {
    // Enable hardware acceleration
    element.style.willChange = 'transform, opacity'
    element.style.transform = 'translateZ(0)' // Force GPU layer
  }

  const cleanupElement = (element: HTMLElement) => {
    // Clean up will-change to save memory
    element.style.willChange = 'auto'
    element.style.transform = ''
  }

  // ⚡ BATCH OPTIMIZATION for multiple elements! *zoom*
  const optimizeElements = (elements: HTMLElement[] | globalThis.NodeListOf<HTMLElement>) => {
    Array.from(elements).forEach(optimizeElement)
  }

  const cleanupElements = (elements: HTMLElement[] | globalThis.NodeListOf<HTMLElement>) => {
    Array.from(elements).forEach(cleanupElement)
  }

  // ⚡ PERFORMANCE-AWARE animation wrapper! *whoosh*
  const performantAnimate = async (elements: any, options: any) => {
    const elementsArray = Array.isArray(elements) ? elements : Array.from(elements)
    
    // Pre-optimize for animation
    optimizeElements(elementsArray)
    
    try {
      // Import anime.js dynamically for better code splitting
      const { animate } = await import('~/anime.esm.js')
      const result = animate()
      
      // Cleanup after animation completes
      if (options.complete) {
        const originalComplete = options.complete
        options.complete = (...args: any[]) => {
          cleanupElements(elementsArray)
          originalComplete(...args)
        }
      } else {
        // Add cleanup if no complete callback exists
        setTimeout(() => cleanupElements(elementsArray), options.duration || 300)
      }
      
      return result
    } catch (_error) {
      // Fallback cleanup on error
      cleanupElements(elementsArray)
      throw _error
    }
  }

  return { 
    timing, 
    easing, 
    staggers,
    optimizeElement,
    cleanupElement,
    optimizeElements,
    cleanupElements,
    performantAnimate
  }
}
