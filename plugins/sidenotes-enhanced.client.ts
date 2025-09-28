export default defineNuxtPlugin(() => {
  if (process.server) return

  const initializeEnhancedSidenotes = () => {
    // Find all sidenotes and margin notes
    const sidenotes = document.querySelectorAll(
      '[data-sidenote], [data-margin-note]'
    )
    const container = document.querySelector('article, .prose, main')

    if (!sidenotes.length || !container) return

    // Create margin container if needed
    let marginContainer = document.querySelector('.margin-container')
    if (!marginContainer) {
      marginContainer = document.createElement('aside')
      marginContainer.className = 'margin-container'
      container.parentElement?.appendChild(marginContainer)
    }

    // Collision detection system
    const positionedNotes: Array<{
      element: HTMLElement
      top: number
      bottom: number
    }> = []

    sidenotes.forEach((note) => {
      const noteEl = note as HTMLElement
      const id = noteEl.id
      const ref = document.querySelector(
        `[data-sidenote-id="${id}"], [href="#${id}"]`
      )

      if (!ref) return

      // Position note
      const positionNote = () => {
        const refRect = ref.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        let targetTop = refRect.top - containerRect.top + window.scrollY

        // Check for collisions
        for (const positioned of positionedNotes) {
          if (targetTop < positioned.bottom + 20) {
            // 20px min gap
            targetTop = positioned.bottom + 20
          }
        }

        noteEl.style.position = 'absolute'
        noteEl.style.top = `${targetTop}px`
        noteEl.style.width = '280px'
        noteEl.style.right = '-320px'

        // Track position
        const noteHeight = noteEl.offsetHeight
        positionedNotes.push({
          element: noteEl,
          top: targetTop,
          bottom: targetTop + noteHeight
        })
      }

      // Initial position
      positionNote()

      // Reposition on resize with RAF for performance
      let rafId: number
      const handleResize = () => {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          positionedNotes.length = 0 // Clear collision tracking
          positionNote()
        })
      }

      window.addEventListener('resize', handleResize)

      // Interactive highlighting
      const addInteraction = () => {
        ref.addEventListener('mouseenter', () => {
          noteEl.classList.add('active')
          ref.classList.add('active')
        })

        ref.addEventListener('mouseleave', () => {
          noteEl.classList.remove('active')
          ref.classList.remove('active')
        })

        noteEl.addEventListener('mouseenter', () => {
          noteEl.classList.add('active')
          ref.classList.add('active')
        })

        noteEl.addEventListener('mouseleave', () => {
          noteEl.classList.remove('active')
          ref.classList.remove('active')
        })
      }

      addInteraction()
    })

    // Add CSS
    if (!document.querySelector('#enhanced-sidenotes-styles')) {
      const style = document.createElement('style')
      style.id = 'enhanced-sidenotes-styles'
      style.textContent = `
        article, .prose, main {
          position: relative;
        }

        [data-sidenote], [data-margin-note] {
          font-size: 0.875rem;
          line-height: 1.5;
          color: #71717a;
          padding: 0.5rem 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark [data-sidenote], .dark [data-margin-note] {
          color: #a1a1aa;
        }

        [data-sidenote].active, [data-margin-note].active {
          color: #18181b;
          background: linear-gradient(to right, transparent, rgba(59, 130, 246, 0.05));
          transform: translateX(-4px);
        }

        .dark [data-sidenote].active, .dark [data-margin-note].active {
          color: #fafafa;
          background: linear-gradient(to right, transparent, rgba(96, 165, 250, 0.1));
        }

        .sidenote-ref.active, .margin-note-ref.active {
          color: #3b82f6;
        }

        /* Hide on mobile */
        @media (max-width: 1280px) {
          [data-sidenote], [data-margin-note] {
            display: none;
          }
        }

        /* Expandable details styling */
        .expandable-details {
          margin: 1.5rem 0;
          border-left: 3px solid #e4e4e7;
          padding-left: 1rem;
          transition: border-color 0.2s;
        }

        .dark .expandable-details {
          border-left-color: #3f3f46;
        }

        .expandable-details[open] {
          border-left-color: #3b82f6;
        }

        .expandable-summary {
          cursor: pointer;
          user-select: none;
          padding: 0.5rem 0;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .expandable-summary:hover {
          color: #3b82f6;
        }

        .expandable-icon {
          transition: transform 0.2s;
          font-size: 0.75rem;
        }

        .expandable-details[open] .expandable-icon {
          transform: rotate(90deg);
        }

        .expandable-content {
          padding-top: 0.5rem;
        }

        .inline-expandable {
          display: inline;
        }

        .inline-expandable-summary {
          color: #3b82f6;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dotted;
        }

        .inline-expandable[open] .inline-expandable-summary {
          text-decoration-style: solid;
        }
      `
      document.head.appendChild(style)
    }
  }

  // Initialize on route changes
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      setTimeout(initializeEnhancedSidenotes, 100)
    })
  })

  onNuxtReady(() => {
    setTimeout(initializeEnhancedSidenotes, 100)
  })
})
