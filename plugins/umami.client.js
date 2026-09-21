export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  // Defer analytics until after LCP — don't compete with critical rendering
  const load = () => {
    const script = document.createElement('script')
    script.src = 'https://umami.tools.ejfox.com/script.js'
    script.async = true
    script.defer = true
    script.setAttribute(
      'data-website-id',
      '357e74b7-fbdc-4e57-b17c-927df9b76830'
    )
    document.head.appendChild(script)
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 })
  } else {
    setTimeout(load, 2000)
  }
})
