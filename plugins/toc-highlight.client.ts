/**
 * @file toc-highlight.client.ts
 * @description Client-only. Scroll-spy for the table of contents: adds/removes
 *   `.active` on links in #nav-toc-container (the teleport target in
 *   layouts/default.vue, filled via composables/useTOC.ts) to match the
 *   last h2[id]/h3[id] whose top is within 150px of the viewport top.
 *   One global passive scroll listener, attached on app:mounted and never
 *   removed; it bails cheaply on pages without a TOC.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Function to update active TOC item based on scroll position
  const updateActiveTocItem = () => {
    // Only run on pages with TOC
    const tocContainer = document.querySelector('#nav-toc-container')
    if (!tocContainer) return

    // Get all section headings
    const headings = Array.from(document.querySelectorAll('h2[id], h3[id]'))
    if (headings.length === 0) return

    // Get all TOC links
    const tocLinks = Array.from(tocContainer.querySelectorAll('a[href^="#"]'))
    if (tocLinks.length === 0) return

    // Find active heading based on scroll position
    let activeHeading = null
    const _scrollPosition = window.scrollY + 100 // Offset for earlier trigger

    // Find the last heading that's above the current scroll position
    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i]
      if (heading.getBoundingClientRect().top <= 150) {
        activeHeading = heading
        break
      }
    }

    // If no heading is found, use the first one
    if (!activeHeading && headings.length > 0) {
      activeHeading = headings[0]
    }

    // Update active class on TOC links
    tocLinks.forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return

      if (activeHeading && href === `#${activeHeading.id}`) {
        link.classList.add('active')
      } else {
        link.classList.remove('active')
      }
    })
  }

  // Set up scroll event listener when component is mounted
  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => {
      window.addEventListener('scroll', updateActiveTocItem, { passive: true })
      // Small delay to ensure DOM is ready
      setTimeout(updateActiveTocItem, 100)
    })
  }

  // Not a cleanup hook: an empty provide. The scroll listener above lives for
  // the life of the page.
  return {
    provide: {
      // Empty provide object to satisfy plugin requirements
    },
  }
})
