// Client-side plugin to highlight active TOC items when scrolling
export default defineNuxtPlugin((nuxtApp) => {
  // Function to update active TOC item based on scroll position
  const updateActiveTocItem = () => {
    // Only run on pages with TOC
    const tocContainer = document.querySelector('#toc-container')
    if (!tocContainer) return

    // Get all section headings
    const headings = Array.from(document.querySelectorAll('h2[id], h3[id]'))
    if (headings.length === 0) return

    // Get all TOC links
    const tocLinks = Array.from(tocContainer.querySelectorAll('a[href^="#"]'))
    if (tocLinks.length === 0) return

    // Find the current active heading based on scroll position
    let activeHeading = null
    const scrollPosition = window.scrollY + 100 // Add offset to trigger earlier

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
  if (process.client) {
    // Wait for the DOM to be ready
    nuxtApp.hook('app:mounted', () => {
      window.addEventListener('scroll', updateActiveTocItem, { passive: true })
      // Initial update
      setTimeout(updateActiveTocItem, 500)
    })
  }

  // Return a cleanup function that Nuxt will call automatically
  return {
    provide: {
      // Empty provide object to satisfy plugin requirements
    }
  }
})
