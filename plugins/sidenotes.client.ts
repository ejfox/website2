export default defineNuxtPlugin(() => {
  if (process.server) return

  const initializeSidenotes = () => {
    // Find all footnote references and their corresponding notes
    const footnoteRefs = document.querySelectorAll('sup.footnote-ref a')
    const footnoteSection = document.querySelector('section.footnotes')

    if (!footnoteRefs.length || !footnoteSection) return

    // Hide original footnote section on desktop
    if (window.innerWidth >= 1024) {
      footnoteSection.classList.add('lg:hidden')
    }

    // Create sidenote container if it doesn't exist
    let sidenotesContainer = document.querySelector('.sidenotes-container')
    if (!sidenotesContainer) {
      const contentContainer =
        document.querySelector('article') ||
        document.querySelector('.prose') ||
        document.querySelector('main')

      if (!contentContainer) return

      // Wrap content in a grid layout for sidenotes
      const wrapper = document.createElement('div')
      wrapper.className = 'sidenotes-layout'
      contentContainer.parentNode?.insertBefore(wrapper, contentContainer)
      wrapper.appendChild(contentContainer)

      sidenotesContainer = document.createElement('aside')
      sidenotesContainer.className = 'sidenotes-container'
      wrapper.appendChild(sidenotesContainer)
    }

    // Add CSS for sidenotes layout
    const style = document.createElement('style')
    style.textContent = `
      .sidenotes-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
        position: relative;
      }

      @media (min-width: 1280px) {
        .sidenotes-layout {
          grid-template-columns: minmax(0, 65ch) 300px;
          gap: 4rem;
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
        position: absolute;
        width: 100%;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #71717a;
        padding: 0.5rem 0;
        border-left: 2px solid #e4e4e7;
        padding-left: 1rem;
        transition: all 0.2s;
      }

      .dark .sidenote {
        color: #a1a1aa;
        border-left-color: #3f3f46;
      }

      .sidenote:hover {
        color: #18181b;
        border-left-color: #a1a1aa;
      }

      .dark .sidenote:hover {
        color: #fafafa;
        border-left-color: #71717a;
      }

      .sidenote-ref {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s;
      }

      .sidenote-ref:hover {
        color: #2563eb;
      }

      .dark .sidenote-ref {
        color: #60a5fa;
      }

      .dark .sidenote-ref:hover {
        color: #93c5fd;
      }

      .sidenote-ref.active {
        color: #dc2626;
      }

      .dark .sidenote-ref.active {
        color: #ef4444;
      }

      .sidenote.active {
        color: #18181b;
        border-left-color: #3b82f6;
        background: rgba(59, 130, 246, 0.05);
        margin-left: -0.5rem;
        padding-left: 1.5rem;
      }

      .dark .sidenote.active {
        color: #fafafa;
        border-left-color: #60a5fa;
        background: rgba(96, 165, 250, 0.1);
      }

      sup.footnote-ref {
        vertical-align: super;
        font-size: 0.75rem;
        line-height: 0;
      }
    `
    document.head.appendChild(style)

    // Process each footnote reference
    footnoteRefs.forEach((ref, index) => {
      const footnoteId = ref.getAttribute('href')?.slice(1)
      if (!footnoteId) return

      const footnoteContent = document.getElementById(footnoteId)
      if (!footnoteContent) return

      // Create sidenote
      const sidenote = document.createElement('div')
      sidenote.className = 'sidenote'
      sidenote.id = `sidenote-${index + 1}`

      // Get footnote text (remove back-reference link)
      const noteText = footnoteContent.cloneNode(true) as HTMLElement
      const backRef = noteText.querySelector('a[href^="#fnref"]')
      backRef?.remove()

      sidenote.innerHTML = `<sup class="sidenote-number">${index + 1}</sup> ${noteText.innerHTML.trim()}`

      // Position sidenote
      const positionSidenote = () => {
        if (window.innerWidth < 1280) {
          sidenote.style.display = 'none'
          return
        }

        sidenote.style.display = 'block'
        const refRect = ref.getBoundingClientRect()
        const containerRect = sidenotesContainer!.getBoundingClientRect()
        const topOffset = refRect.top - containerRect.top + window.scrollY
        sidenote.style.top = `${topOffset}px`
      }

      // Add to container
      sidenotesContainer.appendChild(sidenote)

      // Position on load and resize
      positionSidenote()

      // Update reference appearance
      ref.classList.add('sidenote-ref')

      // Add hover interactions
      ref.addEventListener('mouseenter', () => {
        ref.classList.add('active')
        sidenote.classList.add('active')
      })

      ref.addEventListener('mouseleave', () => {
        ref.classList.remove('active')
        sidenote.classList.remove('active')
      })

      sidenote.addEventListener('mouseenter', () => {
        ref.classList.add('active')
        sidenote.classList.add('active')
      })

      sidenote.addEventListener('mouseleave', () => {
        ref.classList.remove('active')
        sidenote.classList.remove('active')
      })
    })

    // Reposition on resize with debounce
    let resizeTimeout: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        document.querySelectorAll('.sidenote').forEach((sidenote, index) => {
          const ref = footnoteRefs[index]
          if (!ref || !sidenotesContainer) return

          if (window.innerWidth < 1280) {
            ;(sidenote as HTMLElement).style.display = 'none'
            return
          }

          ;(sidenote as HTMLElement).style.display = 'block'
          const refRect = ref.getBoundingClientRect()
          const containerRect = sidenotesContainer.getBoundingClientRect()
          const topOffset = refRect.top - containerRect.top + window.scrollY
          ;(sidenote as HTMLElement).style.top = `${topOffset}px`
        })
      }, 150)
    }

    window.addEventListener('resize', debouncedResize)

    // Cleanup on route change
    const router = useRouter()
    router.beforeEach(() => {
      window.removeEventListener('resize', debouncedResize)
      document
        .querySelector('.sidenotes-layout')
        ?.replaceWith(
          document.querySelector('.sidenotes-layout article') ||
            document.querySelector('.sidenotes-layout .prose') ||
            document.querySelector('.sidenotes-layout main') ||
            document.createElement('div')
        )
    })
  }

  // Initialize on route change
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      setTimeout(initializeSidenotes, 100)
    })
  })

  // Initialize on mount
  onNuxtReady(() => {
    setTimeout(initializeSidenotes, 100)
  })
})
