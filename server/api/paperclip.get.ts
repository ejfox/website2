/**
 * @file paperclip.get.ts
 * @description EJ's current Paperclip presence emoji, for SSR. The browser
 *   upgrades it to a live SSE stream straight from Paperclip (see
 *   composables/usePaperclipStatus.ts) — this route only seeds first paint.
 * @endpoint GET /api/paperclip
 * @returns { emoji, updated_at } or null when Paperclip is down / profile not public
 */

const STATUS_URL = 'https://getpaperclipped.com/api/users/ejfox/status'

interface PaperclipStatus {
  emoji: string
  updated_at: string
}

// Cached 60s so we never hit Paperclip per visitor (their public limit is
// 60 req/min per IP). Failures return null and are cached too — a down API
// shouldn't get hammered. swr off: never serve a value older than a minute.
export default defineCachedEventHandler(
  async (): Promise<PaperclipStatus | null> => {
    try {
      const data = await $fetch<Partial<PaperclipStatus>>(STATUS_URL, {
        timeout: 2000,
      })
      if (typeof data?.emoji !== 'string' || !data.emoji) return null
      return { emoji: data.emoji, updated_at: String(data.updated_at || '') }
    } catch {
      return null
    }
  },
  { maxAge: 60, swr: false, name: 'paperclip-status' }
)
