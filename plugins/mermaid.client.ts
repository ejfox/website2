/**
 * Client-side mermaid renderer.
 * remarkMermaid.mjs converts ```mermaid blocks into <pre class="mermaid">SOURCE</pre>.
 * This plugin dynamic-imports mermaid only when such blocks exist on the page.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  let initialized = false
  let mermaidPromise: Promise<any> | null = null

  const loadMermaid = () => {
    if (!mermaidPromise) {
      mermaidPromise = import('mermaid').then((m) => {
        const mermaid = m.default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'Georgia, serif',
        })
        return mermaid
      })
    }
    return mermaidPromise
  }

  const renderAll = async () => {
    const blocks = document.querySelectorAll<HTMLElement>(
      'pre.mermaid:not([data-mermaid-processed])'
    )
    if (!blocks.length) return

    const mermaid = await loadMermaid()

    for (const block of Array.from(blocks)) {
      block.setAttribute('data-mermaid-processed', 'true')
      const source = block.textContent || ''
      const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
      try {
        const { svg } = await mermaid.render(id, source)
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-diagram'
        wrapper.innerHTML = svg
        block.replaceWith(wrapper)
      } catch (err) {
        console.warn('[mermaid] render failed', err)
        block.setAttribute('data-mermaid-error', 'true')
      }
    }
  }

  const schedule = () => {
    if (initialized) return
    initialized = true
    setTimeout(renderAll, 50)
  }

  nuxtApp.hook('app:mounted', schedule)
  nuxtApp.hook('page:finish', () => {
    initialized = false
    schedule()
  })
})
