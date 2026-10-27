/**
 * @file attribution.client.ts
 * @description Client-only. Runs once at app start: calls the auto-imported
 *   attribution() from utils/attribution.ts, which records UTMs + referrer as
 *   first-touch and last-touch entries in localStorage.
 *   Gotcha: this is a separate, older system from plugins/first-touch.client.ts
 *   (utils/firstTouch.ts), which is the one that feeds Cal.com and Umami.
 */
export default defineNuxtPlugin(() => {
  const { initAttribution } = attribution()

  // Initialize on first load
  initAttribution()
})
