/**
 * EJ's live Paperclip presence emoji.
 *
 * SSR seeds the value from /api/paperclip (cached 60s server-side). In the
 * browser, ONE EventSource per tab is shared by every component that calls
 * this — Paperclip allows 5 concurrent streams per IP, and the layout renders
 * the emoji twice (sidebar + mobile nav). The stream's first message is the
 * current state, so a reconnect re-syncs on its own. It closes while the tab
 * is hidden and reopens when it's visible again.
 *
 * Never invents a value: a failed fetch or a dead stream yields null, and the
 * component hides.
 */
import { useDocumentVisibility } from '@vueuse/core'
import { effectScope, watch, type EffectScope, type Ref } from 'vue'

export interface PaperclipStatus {
  emoji: string
  updated_at: string
}

const STREAM_URL = 'https://getpaperclipped.com/api/stream?users=ejfox'

let source: EventSource | null = null
let subscribers = 0

export function usePaperclipStatus() {
  // SSR / first paint. Nuxt shares useFetch data by key, so every caller
  // gets the same ref and the stream below writes straight into it.
  const { data: status } = useFetch<PaperclipStatus | null>('/api/paperclip', {
    key: 'paperclip-status',
    default: () => null,
  })

  if (import.meta.client) {
    onMounted(() => {
      if (++subscribers === 1) startStreaming(status)
    })
    onBeforeUnmount(() => {
      if (--subscribers === 0) stopStreaming()
    })
  }

  return status
}

function parseStatus(raw: string): PaperclipStatus | null | undefined {
  try {
    const msg = JSON.parse(raw)
    if (msg?.type !== 'status') return undefined
    const me = msg.users?.find(
      (u: { username?: string }) => u.username === 'ejfox'
    )
    return me && typeof me.emoji === 'string' && me.emoji
      ? { emoji: me.emoji, updated_at: String(me.updated_at || '') }
      : null
  } catch {
    return undefined // malformed — keep the last real value
  }
}

// Detached scope: the visibility listener belongs to the shared stream, not
// to whichever component happened to mount first.
let scope: EffectScope | null = null

function startStreaming(status: Ref<PaperclipStatus | null>) {
  if (typeof EventSource === 'undefined') return

  const close = () => {
    source?.close()
    source = null
  }
  const open = () => {
    if (source) return
    source = new EventSource(STREAM_URL)
    source.onmessage = (event) => {
      const next = parseStatus(event.data)
      if (next !== undefined) status.value = next
    }
    // EventSource retries on its own (readyState CONNECTING). CLOSED means
    // the browser gave up (e.g. a 4xx), so hide rather than show a stale value.
    source.onerror = () => {
      if (source?.readyState === EventSource.CLOSED) {
        status.value = null
        close()
      }
    }
  }

  scope = effectScope(true)
  scope.run(() => {
    const visibility = useDocumentVisibility()
    watch(visibility, (v) => (v === 'hidden' ? close() : open()), {
      immediate: true,
    })
  })
}

function stopStreaming() {
  scope?.stop()
  scope = null
  source?.close()
  source = null
}
