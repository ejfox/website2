/**
 * @file useLiveStats.ts
 * @description Used by pages/stats.vue (and components/stats/StatSection.vue
 * for the flash state). Keep /stats live in place. The page server-renders a
 * cached snapshot (/api/stats is an swr handler, ≤10 min old). While the tab
 * is visible this
 * quietly refetches, and when the aggregate's `generated` stamp is newer it
 * swaps the data in and flashes the sections whose numbers changed (EJ chose
 * a visible "updated" flash, 2026-10-20).
 */
import type { Ref } from 'vue'
import { useIntervalFn, useEventListener } from '@vueuse/core'

/** StatSection id → the /api/stats keys it renders. */
export const SECTION_SOURCES: Record<string, string[]> = {
  'top-stats': ['github', 'chess', 'monkeyType', 'blog', 'leetcode'],
  github: ['github'],
  gists: ['gists'],
  leetcode: ['leetcode'],
  typing: ['monkeyType'],
  chess: ['chess'],
  writing: ['blog'],
  productivity: ['rescueTime'],
  languages: ['duolingo'],
  music: ['lastfm'],
  films: ['letterboxd'],
  books: ['goodreads'],
  website: ['website'],
  gear: ['gear'],
}

type StatsLike = Record<string, unknown> | null | undefined

/** Section ids whose source data differs between two stats payloads. */
export function changedSections(prev: StatsLike, next: StatsLike): string[] {
  if (!prev || !next) return []
  const differs = (k: string) =>
    JSON.stringify(prev[k] ?? null) !== JSON.stringify(next[k] ?? null)
  return Object.entries(SECTION_SOURCES)
    .filter(([, keys]) => keys.some(differs))
    .map(([id]) => id)
}

/** True when `next` was generated after `prev` (ISO timestamps). */
export function isNewer(prev?: string | null, next?: string | null): boolean {
  if (!next) return false
  if (!prev) return true
  return new Date(next).getTime() > new Date(prev).getTime()
}

// Poll every 5 min; a tab coming back into view refetches only if the last
// check was over a minute ago, so tab-flipping doesn't hammer /api/stats.
export const LIVE_INTERVAL_MS = 5 * 60_000
export const LIVE_MIN_GAP_MS = 60_000
export const FLASH_MS = 1600

export function useLiveStats(stats: Ref<any>) {
  const flashing = ref(new Set<string>())
  let lastCheck = Date.now()
  let busy = false

  async function check() {
    if (busy || document.visibilityState !== 'visible') return
    busy = true
    lastCheck = Date.now()
    try {
      const fresh = await $fetch<any>('/api/stats')
      if (!isNewer(stats.value?.generated, fresh?.generated)) return
      const changed = changedSections(stats.value, fresh)
      stats.value = fresh
      if (!changed.length) return
      flashing.value = new Set([...flashing.value, ...changed])
      setTimeout(() => {
        const next = new Set(flashing.value)
        for (const id of changed) next.delete(id)
        flashing.value = next
      }, FLASH_MS)
    } catch {
      // Keep showing the snapshot; the next tick tries again.
    } finally {
      busy = false
    }
  }

  useIntervalFn(check, LIVE_INTERVAL_MS)
  useEventListener(document, 'visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      Date.now() - lastCheck >= LIVE_MIN_GAP_MS
    )
      check()
  })

  return { flashing, check }
}
