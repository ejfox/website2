/**
 * Exit intent detection
 *
 * Detects when users are about to leave the page:
 * - Mouse moving towards browser chrome (desktop)
 * - Tab visibility change
 * - Back button / navigation away
 *
 * Use this to:
 * - Show exit-intent offers
 * - Track abandonment points
 * - Trigger surveys
 */

export interface ExitIntentOptions {
  threshold?: number // Pixels from top to trigger (default: 20)
  delay?: number // Ms to wait before enabling (default: 1000)
  cookieName?: string // Cookie to prevent repeat triggers
  cookieExpiry?: number // Days until cookie expires (default: 1)
  onExitIntent?: () => void // Callback when exit intent detected
}

export function useExitIntent(options: ExitIntentOptions = {}) {
  const {
    threshold = 20,
    delay = 1000,
    cookieName = 'exit_intent_shown',
    cookieExpiry = 1,
    onExitIntent,
  } = options

  const hasTriggered = ref(false)
  const isEnabled = ref(false)

  // Check if already shown (cookie)
  function hasBeenShown(): boolean {
    if (!import.meta.client) return true
    return document.cookie.includes(`${cookieName}=true`)
  }

  // Set cookie to prevent repeat triggers
  function markAsShown() {
    if (!import.meta.client) return
    const expires = new Date()
    expires.setDate(expires.getDate() + cookieExpiry)
    document.cookie = `${cookieName}=true; expires=${expires.toUTCString()}; path=/`
  }

  // Track exit intent to analytics
  function trackExitIntent(trigger: string) {
    if (!import.meta.client || !window.umami) return
    window.umami.track('exit_intent', {
      trigger,
      page: window.location.pathname,
      time_on_page: Math.floor(performance.now() / 1000),
    })
  }

  // Mouse leave handler (desktop)
  function handleMouseLeave(e: MouseEvent) {
    if (!isEnabled.value || hasTriggered.value || hasBeenShown()) return

    // Only trigger if mouse is near top of viewport
    if (e.clientY <= threshold) {
      hasTriggered.value = true
      trackExitIntent('mouse_leave_top')
      markAsShown()
      onExitIntent?.()
    }
  }

  // Visibility change handler (tab switch)
  function handleVisibilityChange() {
    if (!isEnabled.value || hasTriggered.value || hasBeenShown()) return

    if (document.visibilityState === 'hidden') {
      // Don't trigger on visibility change, just track
      trackExitIntent('tab_hidden')
    }
  }

  // Back button / navigation handler
  function handleBeforeUnload() {
    if (!isEnabled.value || hasTriggered.value) return
    trackExitIntent('navigation_away')
  }

  // Initialize
  function init() {
    if (!import.meta.client) return

    // Delay enabling to avoid false triggers on page load
    setTimeout(() => {
      isEnabled.value = true
    }, delay)

    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  // Cleanup
  function destroy() {
    if (!import.meta.client) return

    document.removeEventListener('mouseleave', handleMouseLeave)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }

  // Auto-init on mount
  onMounted(() => init())
  onUnmounted(() => destroy())

  return {
    hasTriggered,
    isEnabled,
    reset: () => {
      hasTriggered.value = false
    },
  }
}
