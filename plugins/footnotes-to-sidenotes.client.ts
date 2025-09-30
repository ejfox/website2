/**
 * Ultra-simple sidenotes - Tufte CSS approach
 */
export default defineNuxtPlugin(() => {
  if (process.server) return

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

      // Get clean text content
      const textContent = footnoteContent.textContent || ''
      const cleanText = textContent.replace(/↩/g, '').trim()

      // Create sidenote HTML
      const sidenote = document.createElement('span')
      sidenote.className = 'sidenote'
      sidenote.innerHTML = `<span class="sidenote-number">${index + 1}.</span> ${cleanText}`

      // Replace the sup element with both ref and sidenote
      const sup = ref.closest('sup')
      if (sup) {
        const wrapper = document.createElement('span')
        wrapper.innerHTML = `<sup class="footnote-ref">${index + 1}</sup>`
        wrapper.appendChild(sidenote)
        sup.replaceWith(wrapper)
      }
    })

    // Hide original footnote section
    if (footnoteSection) {
      footnoteSection.style.display = 'none'
    }

    // Add CSS once
    if (!document.getElementById('sidenote-styles')) {
      const style = document.createElement('style')
      style.id = 'sidenote-styles'
      style.textContent = `
        /* Sidenotes */
        @media (min-width: 1280px) {
          .sidenote {
            position: absolute;
            right: -280px;
            width: 240px;
            font-size: 0.8125rem;
            line-height: 1.4;
            color: #71717a;
            margin-top: -0.5rem;
          }

          .sidenote-number {
            font-weight: normal;
            opacity: 0.7;
            font-size: 0.75rem;
          }

          /* Ensure container has relative positioning */
          .blog-post-content {
            position: relative;
          }

          /* Make room for sidenotes */
          article {
            max-width: 65ch;
            margin-left: auto;
            margin-right: 320px;
          }
        }

        /* Mobile: hide sidenotes */
        @media (max-width: 1279px) {
          .sidenote {
            display: none;
          }
        }

        /* Clean up footnote refs */
        sup.footnote-ref {
          font-size: 0.75rem;
          opacity: 0.7;
        }
      `
      document.head.appendChild(style)
    }
  }

  // Initialize once on mount
  onNuxtReady(() => {
    setTimeout(initializeSidenotes, 200)
  })

  // Re-init on navigation
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      setTimeout(initializeSidenotes, 200)
    })
  })
})