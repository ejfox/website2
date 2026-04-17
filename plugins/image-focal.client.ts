/**
 * Scroll-linked lift: every .blog-post-content img.img-splay gets a
 * --splay-focal value 0→1 based on its proximity to viewport center. CSS
 * uses that to grow the shadow as images pass through "focus."
 *
 * Wired to a MutationObserver so images added to the DOM after load
 * (e.g. an expanding photo-stack on /photos) pick up the effect
 * automatically — no manual re-init required.
 */
const SELECTOR = '.blog-post-content img.img-splay'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  let imgs: HTMLElement[] = []
  let rescanTimer = 0

  const update = () => {
    if (!imgs.length) return
    const vh = window.innerHeight
    const vc = vh / 2
    const range = vh * 0.5

    for (const el of imgs) {
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh) {
        el.style.setProperty('--splay-focal', '0')
        continue
      }
      const mid = r.top + r.height / 2
      const dist = Math.abs(mid - vc)
      const linear = Math.max(0, 1 - dist / range)
      // Quadratic: stays near 0 at edges, rises toward center
      const eased = linear * linear
      el.style.setProperty('--splay-focal', eased.toFixed(3))
    }
  }

  const rescan = () => {
    imgs = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
    update()
  }

  const scheduleRescan = () => {
    if (rescanTimer) return
    rescanTimer = window.setTimeout(() => {
      rescanTimer = 0
      rescan()
    }, 50)
  }

  const mutationMatters = (nodes: NodeList): boolean => {
    for (const node of nodes) {
      if (node.nodeType !== 1) continue
      const el = node as Element
      if (el.matches?.(SELECTOR)) return true
      if (el.querySelector?.(SELECTOR)) return true
    }
    return false
  }

  const init = () => {
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    // Custom event for components (e.g. photo stacks) to request a rescan
    // after visibility toggles that MutationObserver can't detect.
    window.addEventListener('splay:rescan', rescan)

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (mutationMatters(m.addedNodes) || mutationMatters(m.removedNodes)) {
          scheduleRescan()
          return
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    rescan()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100))
  } else {
    setTimeout(init, 100)
  }
})
