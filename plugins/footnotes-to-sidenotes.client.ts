/**
 * Ultra-simple sidenotes - Tufte CSS approach
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const initializeSidenotes = () => {
    // Only run once per page
    if (document.querySelector('.sidenote')) return

    const footnoteRefs = document.querySelectorAll('a[data-footnote-ref]')
    const footnoteSection = document.querySelector('section[data-footnotes]')

    if (!footnoteRefs.length || !footnoteSection) return

    // Process each footnote only once
    footnoteRefs.forEach((ref, index) => {
      const footnoteId = ref.getAttribute('href')?.slice(1)
      if (!footnoteId) return

      const footnoteContent = document.getElementById(footnoteId)
      if (!footnoteContent) return

      // Get clean text content - try multiple extraction methods
      let cleanText = ''

      // Method 1: Try getting text from the paragraph inside
      const footnoteParagraph = footnoteContent.querySelector('p')
      if (footnoteParagraph) {
        cleanText = footnoteParagraph.textContent || ''
      } else {
        // Method 2: Get all text content
        cleanText = footnoteContent.textContent || ''
      }

      // Clean up the text
      cleanText = cleanText.replace(/↩/g, '').replace(/\s+/g, ' ').trim()

      if (!cleanText) return

      // Create sidenote - SIMPLE
      const sidenote = document.createElement('span')
      sidenote.className = 'sidenote'
      sidenote.innerHTML = `${index + 1}. ${cleanText}`

      // Insert sidenote after the sup element
      const sup = ref.closest('sup')
      if (sup && sup.parentNode) {
        sup.parentNode.insertBefore(sidenote, sup.nextSibling)
      }
    })

    // Hide original footnote section only on desktop
    // (where sidenotes are shown)
    if (footnoteSection && window.innerWidth >= 1280) {
      footnoteSection.style.display = 'none'
    }

    // Add CSS once
    if (!document.getElementById('sidenote-styles')) {
      const style = document.createElement('style')
      style.id = 'sidenote-styles'
      style.textContent = `
        /* Sidenotes - MINIMAL CSS ONLY */
        @media (min-width: 1280px) {
          .blog-post-content {
            position: relative;
            /* Margin space for sidenotes */
            margin-right: 240px;
          }

          .sidenote {
            float: right;
            clear: right;
            margin-right: -240px;
            width: 200px;
            font-size: 0.7rem;
            line-height: 1.3;
            font-family: 'SF Mono', Monaco, 'Cascadia Code',
              'Roboto Mono', Consolas, 'Courier New', monospace;
            color: #71717a;
            text-align: justify;
            word-break: break-word;
            hyphens: auto;
            overflow-wrap: break-word;
            margin-bottom: 16px;
            /* Prevent sidenote from causing layout shift */
            visibility: hidden;
            animation: fadeInSidenote 0.2s ease-out 0.05s forwards;
          }

          @keyframes fadeInSidenote {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
              visibility: visible;
            }
          }
        }

        /* Extra large screens - more space for sidenotes */
        @media (min-width: 1536px) {
          .blog-post-content {
            margin-right: 260px;
          }

          .sidenote {
            margin-right: -260px;
            width: 220px;
          }
        }

        /* Mobile: hide sidenotes and enhance footnote experience */
        @media (max-width: 1279px) {
          .sidenote {
            display: none;
          }

          /* Enhanced mobile footnote section */
          section[data-footnotes] {
            display: block !important;
            margin-top: 3rem;
            padding: 1.5rem;
            background: #fafafa;
            border-radius: 0.5rem;
            border-left: 4px solid #e4e4e7;
          }

          section[data-footnotes] h2 {
            font-size: 1rem !important;
            font-weight: 600 !important;
            margin-bottom: 1rem !important;
            color: #52525b !important;
          }

          section[data-footnotes] ol {
            padding-left: 1rem !important;
          }

          section[data-footnotes] li {
            margin-bottom: 0.75rem !important;
            line-height: 1.5 !important;
            font-size: 0.9rem !important;
          }

          @media (prefers-color-scheme: dark) {
            section[data-footnotes] {
              background: #18181b;
              border-left-color: #3f3f46;
            }
            section[data-footnotes] h2 {
              color: #a1a1aa !important;
            }
          }
        }
      `
      document.head.appendChild(style)
    }
  }

  // Initialize once on mount - minimal delay to avoid layout shift
  onNuxtReady(() => {
    // Use nextTick to ensure DOM is ready, then init immediately
    nextTick(() => {
      initializeSidenotes()
    })
  })

  // Re-init on navigation
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      initializeSidenotes()
    })
  })
})
