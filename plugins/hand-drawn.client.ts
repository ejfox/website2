/**
 * Hand-drawn marks in rendered content — two organic paths:
 *
 *   1. Intentional: `:hd{name="arrow-right"}` in markdown becomes
 *      <span data-hd="arrow-right"> (via remarkHandDrawn) — hydrated here.
 *   2. Automatic: existing markup inside .blog-post-content is upgraded with no
 *      new syntax — <hr> becomes a hand-drawn divider, footnote markers ¹²³
 *      become circled numbers ①②③.
 *
 * Sibling to footnotes-to-sidenotes.client.ts; same onNuxtReady + router hook.
 */
import { createHandDrawnEl, ensureHandDrawnSprite } from '~/utils/handDrawn'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  // The three selectors below are exactly what run() acts on. If none match,
  // this page has no marks and the 500KB sprite would be dead weight.
  const HD_SELECTORS = [
    'span[data-hd]',
    '.blog-post-content hr',
    '.blog-post-content sup a[data-footnote-ref]',
  ].join(',')
  const pageUsesHandDrawn = () => !!document.querySelector(HD_SELECTORS)

  // Start the download before hydration ONLY where the marks exist. Fetching
  // unconditionally put a 500KB (116KB gzipped) High-priority request 200ms
  // into every page load — including the homepage, which has no marks at all.
  // The SSR'd HTML already contains these selectors, so checking now is safe.
  if (pageUsesHandDrawn()) ensureHandDrawnSprite()

  // 1. Intentional inline marks, anywhere on the page
  const hydrateInline = () => {
    document
      .querySelectorAll<HTMLElement>('span[data-hd]:not([data-hd-done])')
      .forEach((el) => {
        el.setAttribute('data-hd-done', '')
        const name = el.getAttribute('data-hd')
        if (!name) return
        const mark = createHandDrawnEl(name, {
          size: el.getAttribute('data-size') || '1.1em',
          title: el.getAttribute('data-hd-title') || undefined,
        })
        if (mark) el.replaceChildren(mark)
      })
  }

  // 2a. <hr> → hand-drawn divider (article content only)
  const enhanceDividers = () => {
    document
      .querySelectorAll<HTMLHRElement>(
        '.blog-post-content hr:not([data-hd-done])'
      )
      .forEach((hr) => {
        hr.setAttribute('data-hd-done', '')
        const mark = createHandDrawnEl('bead-chain', { size: '14px' })
        if (!mark) return
        const wrap = document.createElement('div')
        wrap.className = 'hd-divider'
        wrap.setAttribute('role', 'separator')
        wrap.appendChild(mark)
        hr.replaceWith(wrap)
      })
  }

  // 2b. footnote markers → circled numbers (1–12; leaves the rest alone)
  const enhanceFootnotes = () => {
    const refs = document.querySelectorAll<HTMLAnchorElement>(
      '.blog-post-content sup a[data-footnote-ref]:not([data-hd-done])'
    )
    refs.forEach((a, i) => {
      a.setAttribute('data-hd-done', '')
      const n = Number.parseInt(a.textContent || '', 10) || i + 1
      if (n < 1 || n > 12) return
      const mark = createHandDrawnEl(`circled-${n}`, {
        size: '1.25em',
        title: `footnote ${n}`,
      })
      if (!mark) return
      mark.style.margin = '0 0.1em'
      a.replaceChildren(mark)
      a.classList.add('hd-footnote-ref')
    })
  }

  const run = () => {
    // Still unconditional here: a client-side navigation can land on a page
    // that does have marks, and by then the early check has long passed.
    if (!pageUsesHandDrawn()) return
    ensureHandDrawnSprite()
    hydrateInline()
    enhanceDividers()
    enhanceFootnotes()
  }

  onNuxtReady(() => nextTick(run))
  const router = useRouter()
  router.afterEach(() => nextTick(run))
})
