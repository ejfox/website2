/**
 * Link preview popovers for external links in blog posts.
 * Shows OG metadata on hover using the /api/og endpoint.
 * Pure DOM manipulation — works inside v-html content.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const ogCache = new Map<string, any>()
  let activePopover: HTMLElement | null = null
  let enterTimeout: ReturnType<typeof setTimeout> | null = null
  let leaveTimeout: ReturnType<typeof setTimeout> | null = null

  const removePopover = () => {
    if (activePopover) {
      activePopover.remove()
      activePopover = null
    }
  }

  const createPopover = (data: any, anchorRect: DOMRect) => {
    removePopover()

    const el = document.createElement('div')
    el.className = 'link-preview-popover'

    // Position: above the link by default, below if near top of viewport
    const spaceAbove = anchorRect.top
    const positionBelow = spaceAbove < 200

    const top = positionBelow
      ? anchorRect.bottom + 8
      : anchorRect.top - 8
    const transformOrigin = positionBelow ? 'top left' : 'bottom left'
    const translateY = positionBelow ? '0' : '-100%'

    // Clamp horizontal position so popover stays on screen
    let left = anchorRect.left
    const maxLeft = window.innerWidth - 336 // 320 + 16 margin
    if (left > maxLeft) left = maxLeft
    if (left < 8) left = 8

    el.style.cssText = `
      position: fixed;
      z-index: 200;
      max-width: 320px;
      padding: 12px;
      background: rgb(24 24 27);
      border: 1px solid rgb(63 63 70);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      top: ${top}px;
      left: ${left}px;
      transform: translateY(${translateY});
      transform-origin: ${transformOrigin};
      opacity: 0;
      transition: opacity 150ms ease;
      pointer-events: auto;
      color: rgb(228 228 231);
      font-size: 13px;
      line-height: 1.4;
    `

    // Build inner HTML
    const parts: string[] = []

    // Header row: favicon + site name
    const faviconSrc = data.favicon || `https://www.google.com/s2/favicons?domain=${new URL(data.url || '').hostname}&sz=32`
    const siteName = data.siteName || (() => { try { return new URL(data.url || '').hostname } catch { return '' } })()
    if (siteName) {
      parts.push(`
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <img src="${faviconSrc}" width="16" height="16" style="border-radius:2px;flex-shrink:0;" onerror="this.style.display='none'" />
          <span style="font-family:ui-monospace,monospace;font-size:11px;color:rgb(161 161 170);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${siteName}</span>
        </div>
      `)
    }

    // Title
    if (data.title) {
      parts.push(`<div style="font-family:Georgia,serif;font-weight:bold;font-size:14px;margin-bottom:4px;color:rgb(250 250 250);">${escapeHtml(data.title)}</div>`)
    }

    // Description (2 lines max)
    if (data.description) {
      parts.push(`<div style="color:rgb(161 161 170);font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(data.description)}</div>`)
    }

    // OG image
    if (data.image) {
      parts.push(`<img src="${data.image}" style="width:100%;height:auto;max-height:160px;object-fit:cover;border-radius:3px;margin-top:8px;" onerror="this.style.display='none'" />`)
    }

    // Fallback if nothing useful came back
    if (!data.title && !data.description && !data.image) {
      removePopover()
      return
    }

    el.innerHTML = parts.join('')
    document.body.appendChild(el)
    activePopover = el

    // Fade in
    requestAnimationFrame(() => {
      el.style.opacity = '1'
    })

    // Allow mouse to enter the popover without it disappearing
    el.addEventListener('mouseenter', () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout)
        leaveTimeout = null
      }
    })
    el.addEventListener('mouseleave', () => {
      leaveTimeout = setTimeout(removePopover, 150)
    })
  }

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const fetchOg = async (url: string) => {
    if (ogCache.has(url)) return ogCache.get(url)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      if (!res.ok) return null
      const data = await res.json()
      data.url = url
      ogCache.set(url, data)
      return data
    } catch {
      return null
    }
  }

  const initializePreviews = () => {
    // Only on hover-capable devices
    if (!window.matchMedia('(hover: hover)').matches) return

    const container = document.querySelector('.blog-post-content')
    if (!container) return

    const links = container.querySelectorAll<HTMLAnchorElement>('a[data-preview-url]')
    links.forEach((link) => {
      // Skip if already initialized
      if (link.dataset.previewInit) return
      link.dataset.previewInit = '1'

      const url = link.dataset.previewUrl!

      link.addEventListener('mouseenter', () => {
        if (leaveTimeout) {
          clearTimeout(leaveTimeout)
          leaveTimeout = null
        }
        enterTimeout = setTimeout(async () => {
          const data = await fetchOg(url)
          if (data) {
            const rect = link.getBoundingClientRect()
            createPopover(data, rect)
          }
        }, 300)
      })

      link.addEventListener('mouseleave', () => {
        if (enterTimeout) {
          clearTimeout(enterTimeout)
          enterTimeout = null
        }
        leaveTimeout = setTimeout(removePopover, 150)
      })
    })
  }

  // Initialize on ready
  onNuxtReady(() => {
    nextTick(() => {
      setTimeout(initializePreviews, 200)
    })
  })

  // Re-init on navigation
  const router = useRouter()
  router.afterEach(() => {
    removePopover()
    nextTick(() => {
      setTimeout(initializePreviews, 200)
    })
  })
})
