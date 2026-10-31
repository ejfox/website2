/**
 * @file footnotes-to-sidenotes.client.ts
 * @description Client-only. Copies each Markdown footnote
 *   (a[data-footnote-ref] → section[data-footnotes]) into a `span.sidenote`
 *   right after its <sup>, Tufte-style. Styling lives in assets/css/global.css
 *   so the margin notes don't cause layout shift. On viewports ≥1280px it
 *   also hides the original footnote section (checked once, at run time; no
 *   resize handling).
 *   Runs on onNuxtReady and after every page:finish (nextTick). Not
 *   router.afterEach: that fires before the new page renders, so it saw the
 *   old page and in-site navigation got no sidenotes.
 *   Shares footnote markers with hand-drawn.client.ts, which swaps the
 *   marker text for circled numbers.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const initializeSidenotes = () => {
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
      let cleanText: string

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
      sidenote.textContent = `${index + 1}. ${cleanText}`

      // Insert sidenote after the sup element (once per footnote)
      const sup = ref.closest('sup')
      if (sup?.nextElementSibling?.classList.contains('sidenote')) return
      if (sup && sup.parentNode) {
        sup.parentNode.insertBefore(sidenote, sup.nextSibling)
      }
    })

    // Hide original footnote section only on desktop
    // (where sidenotes are shown)
    if (footnoteSection && window.innerWidth >= 1280) {
      ;(footnoteSection as HTMLElement).style.display = 'none'
    }
  }

  // Initialize on mount - run immediately, CSS is pre-loaded
  onNuxtReady(() => {
    nextTick(() => {
      initializeSidenotes()
    })
  })

  // Re-init after each client navigation has rendered
  nuxtApp.hook('page:finish', () => {
    nextTick(() => {
      initializeSidenotes()
    })
  })
})
