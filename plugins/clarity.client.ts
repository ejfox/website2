/**
 * Microsoft Clarity - Free session replay + heatmaps
 * Deferred until after LCP to avoid competing with critical rendering
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const clarityId = config.public?.clarityId

  if (!clarityId || !import.meta.client) return

  const load = () => {
    const script = document.createElement('script')
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `
    document.head.appendChild(script)
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 })
  } else {
    setTimeout(load, 2000)
  }
})
