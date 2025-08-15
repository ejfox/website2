/**
 * CUSTOM CURSOR SYSTEM - Personality Over Polish
 * 
 * Adds contextual cursor interactions that respond to content:
 * - Subtle scale changes for different element types
 * - Smooth momentum-based following
 * - Mobile-friendly (no cursor, but enables touch feedback)
 * - Performance optimized with requestAnimationFrame
 * 
 * Mobile UX Considerations:
 * - Cursor is desktop-only, mobile gets enhanced touch feedback
 * - Touch targets remain 44px+ for thumb accessibility
 * - No cursor interference with native mobile scrolling
 */

import { animate } from '~/anime.esm.js'

export const useCursor = () => {
  const cursorRef = ref<HTMLElement | null>(null)
  const _cursorDotRef = ref<HTMLElement | null>(null)
  const isDesktop = ref(false)
  const currentState = ref('default')
  
  // Mouse position with momentum for smooth following
  const mouse = reactive({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  })
  
  // Cursor states for different content types
  const states = {
    default: {
      scale: 1,
      opacity: 0.6,
      mixBlendMode: 'difference'
    },
    link: {
      scale: 1.5,
      opacity: 0.8,
      mixBlendMode: 'exclusion'
    },
    button: {
      scale: 2,
      opacity: 0.9,
      mixBlendMode: 'exclusion'
    },
    text: {
      scale: 0.3,
      opacity: 0.4,
      mixBlendMode: 'difference'
    },
    image: {
      scale: 3,
      opacity: 0.2,
      mixBlendMode: 'multiply'
    },
    code: {
      scale: 0.5,
      opacity: 0.7,
      mixBlendMode: 'difference'
    }
  }
  
  // Check if we're on desktop (has cursor)
  const checkDevice = () => {
    isDesktop.value = window.matchMedia('(pointer: fine)').matches
  }
  
  // Smooth cursor following with momentum
  const updateCursorPosition = () => {
    // Lerp for smooth movement
    mouse.x += (mouse.targetX - mouse.x) * 0.15
    mouse.y += (mouse.targetY - mouse.y) * 0.15
    
    if (cursorRef.value && isDesktop.value) {
      cursorRef.value.style.transform = `translate3d(${mouse.x - 10}px, ${mouse.y - 10}px, 0)`
    }
    
    requestAnimationFrame(updateCursorPosition)
  }
  
  // Animate cursor state changes - using anime.js's full power
  const setCursorState = (state: keyof typeof states) => {
    if (!isDesktop.value || !cursorRef.value) return
    
    currentState.value = state
    const config = states[state]
    
    // Animation disabled following delete-driven development
    if (cursorRef.value) {
      cursorRef.value.style.transform = `scale(${config.scale})`;
      cursorRef.value.style.opacity = config.opacity.toString();
      cursorRef.value.style.mixBlendMode = config.mixBlendMode;
    }
  }
  
  // Mouse move handler
  const onMouseMove = (e: globalThis.MouseEvent) => {
    mouse.targetX = e.clientX
    mouse.targetY = e.clientY
  }
  
  // Enhanced hover detection for personality
  const addHoverListeners = () => {
    if (!isDesktop.value) return
    
    // Link interactions
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement
      
      if (target.matches('a, [role="button"]')) {
        setCursorState('link')
        // Animation disabled following delete-driven development
      } else if (target.matches('button, input[type="submit"], .btn')) {
        setCursorState('button')
      } else if (target.matches('p, span, div:not([class*="cursor"]):not(.container)')) {
        // Text content (excluding our cursor divs)
        setCursorState('text')
      } else if (target.matches('img, video, canvas')) {
        setCursorState('image')
      } else if (target.matches('code, pre, .monospace, .font-mono')) {
        setCursorState('code')
      }
    })
    
    document.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement
      
      if (target.matches('a, button, [role="button"], input[type="submit"], .btn')) {
        setCursorState('default')
      }
    })
  }
  
  // Initialize cursor system
  const init = () => {
    if (process.server) return
    
    checkDevice()
    
    if (!isDesktop.value) {
      // Mobile: Enhanced touch feedback instead of cursor
      addTouchFeedback()
      return
    }
    
    // Desktop: Create custom cursor
    const cursor = document.createElement('div')
    cursor.className = 'custom-cursor'
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: currentColor;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.6;
      mix-blend-mode: difference;
      will-change: transform, opacity, scale;
    `
    
    document.body.appendChild(cursor)
    cursorRef.value = cursor
    
    // Hide default cursor on interactive elements
    const style = document.createElement('style')
    style.textContent = `
      body * {
        cursor: none !important;
      }
      
      /* Bring back cursor for inputs where it's functional */
      input[type="text"],
      input[type="email"],
      textarea,
      [contenteditable] {
        cursor: text !important;
      }
    `
    document.head.appendChild(style)
    
    // Start animation loop and listeners
    document.addEventListener('mousemove', onMouseMove)
    updateCursorPosition()
    addHoverListeners()
  }
  
  // Mobile touch feedback enhancement
  const addTouchFeedback = () => {
    // Add subtle haptic-like visual feedback for touch
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement
      
      if (target.matches('a, button, [role="button"], .btn')) {
        // Touch feedback animation disabled following delete-driven development
      }
    })
    
    // Enhanced touch ripple effect
    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement
      
      if (target.matches('a, button, [role="button"], .btn')) {
        // Create temporary ripple element
        const ripple = document.createElement('div')
        const rect = target.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.1;
          transform: scale(0);
          left: 50%;
          top: 50%;
          transform-origin: center;
          pointer-events: none;
          z-index: 1;
        `
        
        target.style.position = 'relative'
        target.style.overflow = 'hidden'
        target.appendChild(ripple)
        
        // Ripple animation disabled following delete-driven development
        setTimeout(() => ripple.remove(), 600);
      }
    })
  }
  
  // Cleanup
  const cleanup = () => {
    if (cursorRef.value) {
      cursorRef.value.remove()
    }
    document.removeEventListener('mousemove', onMouseMove)
  }
  
  return {
    init,
    cleanup,
    setCursorState,
    currentState: computed(() => currentState.value),
    isDesktop: computed(() => isDesktop.value)
  }
}