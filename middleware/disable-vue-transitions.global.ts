/**
 * This middleware disables Vue's built-in transitions when the browser supports
 * the View Transitions API, allowing for smoother, native transitions between pages.
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip on server or if browser doesn't support View Transitions API
  if (import.meta.server || !document.startViewTransition) {
    return
  }

  // Disable built-in Vue transitions in favor of View Transitions API
  to.meta.pageTransition = false
  to.meta.layoutTransition = false
})
