// Client-side plugin to highlight active TOC items when scrolling
// Deferred execution for better LCP
export default defineNuxtPlugin((nuxtApp: any) => {
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
  // Use requestIdleCallback to defer non-critical work
  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => {
      const init = () => {
        window.addEventListener('scroll', updateActiveTocItem, {
          passive: true,
        })
        updateActiveTocItem()
      }
      // Defer to idle time for better LCP
      if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 2000 })
      } else {
        setTimeout(init, 1000)
      }
    })
  }

  // Return a cleanup function that Nuxt will call automatically
  return {
    provide: {
      // Empty provide object to satisfy plugin requirements
    },
  }
})
