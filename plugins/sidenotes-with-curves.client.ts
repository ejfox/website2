export default defineNuxtPlugin(() => {
  if (process.server) return

  const initializeSidenotesWithCurves = () => {
    const footnoteRefs = document.querySelectorAll('sup.footnote-ref a')
    const footnoteSection = document.querySelector('section.footnotes')

    if (!footnoteRefs.length || !footnoteSection) return

    // Hide original footnotes on desktop
    if (window.innerWidth >= 1024) {
      footnoteSection.classList.add('lg:hidden')
    }

    // Create sidenote container
    let sidenotesContainer = document.querySelector('.sidenotes-container')
    if (!sidenotesContainer) {
      const contentContainer =
        document.querySelector('article') ||
        document.querySelector('.prose') ||
        document.querySelector('main')

      if (!contentContainer) return

      const wrapper = document.createElement('div')
      wrapper.className = 'sidenotes-layout'
      contentContainer.parentNode?.insertBefore(wrapper, contentContainer)
      wrapper.appendChild(contentContainer)

      sidenotesContainer = document.createElement('aside')
      sidenotesContainer.className = 'sidenotes-container'
      wrapper.appendChild(sidenotesContainer)
    }

    // Create SVG overlay for curves
    let svgOverlay = document.querySelector('.sidenote-curves-svg')
    if (!svgOverlay) {
      svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svgOverlay.classList.add('sidenote-curves-svg')
      svgOverlay.style.position = 'absolute'
      svgOverlay.style.top = '0'
      svgOverlay.style.left = '0'
      svgOverlay.style.width = '100%'
      svgOverlay.style.height = '100%'
      svgOverlay.style.pointerEvents = 'none'
      svgOverlay.style.zIndex = '1'
      sidenotesContainer.appendChild(svgOverlay)
    }

    // Store connections for updating
    const connections: Array<{
      ref: Element
      note: HTMLElement
      path: SVGPathElement
    }> = []

    // Process each footnote
    footnoteRefs.forEach((ref, index) => {
      const footnoteId = ref.getAttribute('href')?.slice(1)
      if (!footnoteId) return

      const footnoteContent = document.getElementById(footnoteId)
      if (!footnoteContent) return

      // Create sidenote
      const sidenote = document.createElement('div')
      sidenote.className = 'sidenote'
      sidenote.id = `sidenote-${index + 1}`
      sidenote.dataset.footnoteId = footnoteId

      // Clone content (remove back-reference)
      const noteText = footnoteContent.cloneNode(true) as HTMLElement
      const backRef = noteText.querySelector('a[href^="#fnref"]')
      backRef?.remove()

      sidenote.innerHTML = `<sup class="sidenote-number">${index + 1}</sup> ${noteText.innerHTML.trim()}`

      // Add to container
      sidenotesContainer.appendChild(sidenote)

      // Create curve path
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )
      path.classList.add('sidenote-curve')
      path.setAttribute('stroke', '#a1a1aa')
      path.setAttribute('stroke-width', '1')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', '0')
      path.style.transition = 'opacity 0.3s ease, stroke 0.3s ease'
      svgOverlay.appendChild(path)

      connections.push({ ref, note: sidenote, path })

      // Add hover interactions
      const showCurve = () => {
        path.setAttribute('opacity', '0.4')
        path.setAttribute('stroke', '#3b82f6')
        sidenote.classList.add('active')
        ref.classList.add('active')
      }

      const hideCurve = () => {
        path.setAttribute('opacity', '0')
        path.setAttribute('stroke', '#a1a1aa')
        sidenote.classList.remove('active')
        ref.classList.remove('active')
      }

      ref.addEventListener('mouseenter', showCurve)
      ref.addEventListener('mouseleave', hideCurve)
      sidenote.addEventListener('mouseenter', showCurve)
      sidenote.addEventListener('mouseleave', hideCurve)
    })

    // Function to draw curves
    const drawCurves = () => {
      if (window.innerWidth < 1280) {
        svgOverlay.style.display = 'none'
        return
      }

      svgOverlay.style.display = 'block'

      // Update SVG dimensions
      const containerRect = sidenotesContainer.getBoundingClientRect()
      svgOverlay.setAttribute('width', containerRect.width.toString())
      svgOverlay.setAttribute('height', document.body.scrollHeight.toString())

      connections.forEach(({ ref, note, path }) => {
        // Get positions
        const refRect = ref.getBoundingClientRect()
        const noteRect = note.getBoundingClientRect()
        const containerRect = sidenotesContainer.getBoundingClientRect()

        // Calculate points (relative to container)
        const startX =
          refRect.right - containerRect.left - sidenotesContainer.offsetLeft
        const startY =
          refRect.top + window.scrollY - containerRect.top + refRect.height / 2

        const endX = 20 // Note starts 20px from left of container
        const endY = noteRect.top + window.scrollY - containerRect.top + 10 // Aim for top of note

        // Calculate control points for a nice hanging curve
        const distance = Math.abs(endX - startX)
        const sag = Math.min(30, distance * 0.1) // How much the curve sags

        // Control point 1: straight out from the reference
        const cp1X = startX + distance * 0.3
        const cp1Y = startY + sag

        // Control point 2: curve into the sidenote
        const cp2X = endX - distance * 0.3
        const cp2Y = endY + sag

        // Create the path
        const pathData = `
          M ${startX},${startY}
          C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}
        `

        path.setAttribute('d', pathData)
      })
    }

    // Position sidenotes and draw curves
    const positionElements = () => {
      // First position all sidenotes (with collision detection)
      const positionedNotes: Array<{ top: number; bottom: number }> = []

      connections.forEach(({ ref, note }) => {
        if (window.innerWidth < 1280) {
          note.style.display = 'none'
          return
        }

        note.style.display = 'block'
        const refRect = ref.getBoundingClientRect()
        const containerRect = sidenotesContainer!.getBoundingClientRect()
        let targetTop = refRect.top - containerRect.top + window.scrollY

        // Collision detection
        for (const positioned of positionedNotes) {
          if (targetTop < positioned.bottom + 20) {
            targetTop = positioned.bottom + 20
          }
        }

        note.style.position = 'absolute'
        note.style.top = `${targetTop}px`
        note.style.left = '40px' // Leave space for curves
        note.style.width = 'calc(100% - 50px)'

        const noteHeight = note.offsetHeight
        positionedNotes.push({
          top: targetTop,
          bottom: targetTop + noteHeight
        })
      })

      // Then draw curves
      drawCurves()
    }

    // Initial positioning
    positionElements()

    // Reposition on scroll/resize with RAF
    let rafId: number
    const handleUpdate = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(positionElements)
    }

    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, { passive: true })

    // Add styles
    if (!document.querySelector('#sidenote-curves-styles')) {
      const style = document.createElement('style')
      style.id = 'sidenote-curves-styles'
      style.textContent = `
        .sidenotes-layout {
          display: grid;
          grid-template-columns: 1fr;
          position: relative;
        }

        @media (min-width: 1280px) {
          .sidenotes-layout {
            grid-template-columns: minmax(0, 65ch) 320px;
            gap: 2rem;
          }
        }

        .sidenotes-container {
          display: none;
          position: relative;
        }

        @media (min-width: 1280px) {
          .sidenotes-container {
            display: block;
          }
        }

        .sidenote {
          font-size: 0.875rem;
          line-height: 1.5;
          color: #71717a;
          padding: 0.5rem 0;
          transition: all 0.2s;
        }

        .dark .sidenote {
          color: #a1a1aa;
        }

        .sidenote.active {
          color: #18181b;
          transform: translateX(2px);
        }

        .dark .sidenote.active {
          color: #fafafa;
        }

        .sidenote-number {
          color: #3b82f6;
          font-weight: 600;
          margin-right: 0.25rem;
        }

        .footnote-ref.active a {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          padding: 0 2px;
          border-radius: 2px;
        }

        /* Curve styles handled in SVG attributes */
        .sidenote-curves-svg {
          mix-blend-mode: multiply;
        }

        .dark .sidenote-curves-svg {
          mix-blend-mode: screen;
        }
      `
      document.head.appendChild(style)
    }

    // Cleanup on route change
    const router = useRouter()
    router.beforeEach(() => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate)
    })
  }

  // Initialize on route changes
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      setTimeout(initializeSidenotesWithCurves, 100)
    })
  })

  onNuxtReady(() => {
    setTimeout(initializeSidenotesWithCurves, 100)
  })
})
