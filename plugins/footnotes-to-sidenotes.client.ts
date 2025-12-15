/**
 * Ultra-simple sidenotes - Tufte CSS approach
 * CSS is now in global.css to prevent CLS
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
  }

  // Initialize on mount - run immediately, CSS is pre-loaded
  onNuxtReady(() => {
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
