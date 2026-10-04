/**
 * First-touch attribution → Cal.com (see utils/firstTouch.ts).
 *
 * 1. On the first page load ever, store `ej_first_touch` (never overwritten).
 * 2. At CLICK time, not at SSR, append the first-touch utm_* + metadata[*]
 *    params to any Cal.com booking link. Rendered hrefs stay clean and
 *    cacheable, and each visitor's link carries their own first touch.
 * 3. Add `data-umami-event-source` to any `consulting-book` element before
 *    Umami reads it, so that event carries the first-touch source.
 *
 * A window-capture listener runs before Umami's document-level handler and
 * before the browser follows the link.
 */
import { useEventListener } from '@vueuse/core'
import {
  isCalBookingUrl,
  readFirstTouch,
  rememberFirstTouch,
  withFirstTouch,
} from '~/utils/firstTouch'

export default defineNuxtPlugin(() => {
  rememberFirstTouch()

  const onActivate = (e: MouseEvent) => {
    const target = e.target as Element | null
    const ft = readFirstTouch()

    const tagged = target?.closest?.(
      '[data-umami-event="consulting-book"]'
    ) as HTMLElement | null
    if (tagged && ft) tagged.dataset.umamiEventSource = ft.source

    const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link) return
    let url: URL
    try {
      url = new URL(link.href)
    } catch {
      return
    }
    if (!isCalBookingUrl(url)) return
    const next = withFirstTouch(link.href, ft)
    if (next !== link.href) link.href = next
  }

  // click = left click / keyboard; auxclick = middle-click "open in new tab".
  useEventListener(window, 'click', onActivate, { capture: true })
  useEventListener(window, 'auxclick', onActivate, { capture: true })
})
