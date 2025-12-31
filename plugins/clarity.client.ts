/**
 * Microsoft Clarity - Free session replay + heatmaps
 *
 * Features (all automatic):
 * - Session recordings
 * - Heatmaps (click, scroll, area)
 * - Rage click detection
 * - Dead click detection
 * - Quick-back detection (user leaves and returns quickly)
 * - Excessive scrolling detection
 * - JavaScript error tracking
 *
 * Setup:
 * 1. Go to https://clarity.microsoft.com
 * 2. Create project for ejfox.com
 * 3. Copy project ID to NUXT_PUBLIC_CLARITY_ID env var
 *
 * @see https://clarity.microsoft.com
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const clarityId = config.public?.clarityId

  if (!clarityId || !import.meta.client) return

  // Clarity tracking script
  const script = document.createElement('script')
  script.innerHTML = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${clarityId}");
  `
  document.head.appendChild(script)
})
