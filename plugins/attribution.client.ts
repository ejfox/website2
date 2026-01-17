/* eslint-disable no-undef */
/**
 * Attribution tracking plugin
 * Captures UTMs and referrer on first page load
 * Stores first-touch and last-touch attribution in localStorage
 */
export default defineNuxtPlugin(() => {
  const { initAttribution } = useAttribution()

  // Initialize on first load
  initAttribution()
})
