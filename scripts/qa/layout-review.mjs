#!/usr/bin/env node
/**
 * @file layout-review.mjs
 * @description Layout review: Playwright screenshots + measured checks across
 *   routes, viewports and light/dark. Started as a topbar review; now covers
 *   the whole page. Read-only against the target site (it only loads pages
 *   and /api/healthcheck); writes only to the output dir.
 *   The default output dir (.qa/layout/, gitignored) is cleared at the start
 *   of every run; a custom --out= dir only loses the files this tool writes
 *   (*__top.png, *__scrolled.png, report.json, index.html).
 *   scripts/qa/pr-eval.mjs links to its report.
 *
 *   yarn qa:layout                 # headless, against localhost:3006
 *   yarn qa:layout --watch         # show the lockstep windows (they take focus)
 *   yarn qa:layout --strict        # exit 1 on any error-level issue
 *   BASE_URL=http://localhost:3016 yarn qa:layout   # e.g. a prod build
 *   yarn qa:layout --routes=/,/blog/ --viewports=iphone-se,wide
 *   yarn qa:layout --routes=/threads --out=.qa/threads   # keep the full report
 *
 * Verify against a production build when you can: the dev server's SSR can
 * go stale after edits (the client HMRs, the server doesn't), which shows up
 * as hydration mismatches that aren't real.
 *
 * Check what owns the port before trusting a run: another session's dev
 * server once took localhost:3016 over IPv4 while a prod build held it over
 * IPv6, and the review silently tested the wrong code. Serving the build on
 * 127.0.0.1 and pointing BASE_URL at 127.0.0.1 avoids that.
 *
 * --watch opens two Chromium windows, dark on top and light below, that
 * move in lockstep (same route, same moment, scrolling together), stacked on
 * the portrait monitor if there is one (WINDOW_X / WINDOW_Y /
 * WINDOW_H override the placement). Output: .qa/layout/ — PNGs, report.json
 * and index.html (a contact sheet, failures first).
 *
 * Errors (fail --strict):
 *   overflow      — page wider than the viewport, naming the culprit elements
 *   contrast      — text in view under 2:1 against its composited background
 *                   (reads as missing, e.g. a dark-mode colour with no light
 *                   variant)
 *   covers-chrome — a top bar overlapping the mobile nav / sidebar at scroll 0
 *   see-through   — a sticky bar translucent enough that content shows through
 *   orphan-sep    — a visible "·" separator at the start/end of a line
 *   broken-image  — an <img> that finished loading with no pixels
 *   js-error      — an uncaught exception, or a Vue hydration mismatch
 *   http-5xx      — a same-origin request that failed server-side
 *   error         — the visit itself threw (navigation timeout etc.)
 * Warnings:
 *   contrast-aa   — text in view between 2:1 and WCAG AA (4.5:1; 3:1 large)
 *   tap-target    — on touch viewports, a control under 24×24px (WCAG 2.5.8);
 *                   links inline in running text are exempt
 *   tiny-text     — visible text under 10px
 *   wrap          — mobile nav wrapping onto more than two lines
 */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

// ── Config: flags, routes, viewports ────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const BASE = process.env.BASE_URL || 'http://localhost:3006'
// Headless unless asked: every headed window takes focus on macOS, once per
// viewport, which yanks you out of the terminal mid-run
const HEADLESS = !args.watch
const DEFAULT_OUT = path.resolve('.qa/layout')
const OUT = path.resolve(args.out || DEFAULT_OUT)
const ERROR_KINDS = new Set([
  'overflow',
  'contrast',
  'covers-chrome',
  'see-through',
  'orphan-sep',
  'broken-image',
  'js-error',
  'http-5xx',
  'error',
])

const STATIC_ROUTES = [
  '/',
  '/blog/',
  '/blog/week-notes',
  '/blog/2025/using-radios', // inline gear card, metadata bar
  '/blog/2024/the-mystery-of-peter-todd', // bespoke takeover layout
  '/blog/2019/climate-strike-nyc', // most images
  '/blog/2013/the-magazine-experience-on-the-web', // long TOC
  '/projects',
  '/now',
  '/photos',
  '/stats',
  '/gear',
  '/reading',
  '/consulting',
  '/predictions',
  '/dispatch',
  '/changelog',
  '/tag/ai',
  '/threads',
  '/scraps',
  '/on-this-day',
  '/process',
  '/case-study/nbc-big-board',
  '/github',
  '/gists',
  '/updates',
  '/following',
  '/sitemap',
  '/calendar',
  '/rides',
  '/atlas',
  '/live',
  '/flashcards',
  '/external-links',
  '/api-docs',
  '/hand-drawn',
]
// One real detail page per dynamic route: the first matching link on its
// index, found at run time so the list never goes stale
const DISCOVER = [
  ['/projects', '/projects/'],
  ['/gear', '/gear/'],
  ['/reading', '/reading/'],
  ['/photos', '/photos/'],
  ['/predictions', '/predictions/'],
  ['/dispatch', '/dispatch/'],
  ['/github', '/github/'],
  ['/rides', '/rides/'],
  ['/blog/week-notes', '/blog/week-notes/'],
]

const ALL_VIEWPORTS = {
  'iphone-se': { width: 320, height: 640 },
  iphone: { width: 390, height: 844 },
  'large-phone': { width: 430, height: 932 },
  'phone-landscape': { width: 844, height: 390, touch: true },
  'small-tablet': { width: 600, height: 960 },
  tablet: { width: 768, height: 1024, touch: true },
  'tablet-landscape': { width: 1024, height: 768, touch: true },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
}
const viewportNames =
  typeof args.viewports === 'string' ? args.viewports.split(',') : null
const unknownViewports = (viewportNames || []).filter((k) => !ALL_VIEWPORTS[k])
if (args.viewports && (!viewportNames || unknownViewports.length)) {
  console.error(
    `Unknown --viewports: ${unknownViewports.join(', ') || '(none given)'}\n` +
      `Known: ${Object.keys(ALL_VIEWPORTS).join(', ')}`
  )
  process.exit(2)
}
const VIEWPORTS = viewportNames
  ? Object.fromEntries(viewportNames.map((k) => [k, ALL_VIEWPORTS[k]]))
  : ALL_VIEWPORTS
const isTouch = (vp) => vp.touch ?? vp.width < 768

// ── Window placement (--watch) ──────────────────────────────────────────

/** Find a portrait display (macOS); fall back to the main screen's origin. */
function portraitSlot() {
  if (process.env.WINDOW_X) {
    return {
      x: +process.env.WINDOW_X,
      y: +(process.env.WINDOW_Y || 0),
      h: +(process.env.WINDOW_H || 1200),
    }
  }
  try {
    const out = execSync(
      `osascript -l JavaScript -e 'ObjC.import("AppKit"); const s=$.NSScreen.screens.js; const mainH=s[0].frame.size.height; JSON.stringify(s.map(x=>({x:x.frame.origin.x, top: mainH-(x.frame.origin.y+x.frame.size.height), w:x.frame.size.width, h:x.frame.size.height})))'`,
      { encoding: 'utf8' }
    )
    const screens = JSON.parse(out)
    const portrait = screens.find((s) => s.h > s.w) || screens[0]
    return { x: portrait.x, y: portrait.top + 25, h: portrait.h - 25 }
  } catch {
    return { x: 0, y: 0, h: 1400 }
  }
}

// ── In-page measurement ─────────────────────────────────────────────────

/**
 * Runs in the page: measure the top chrome and the visible page.
 * Serialized by page.evaluate, so it can't reference anything at module
 * scope; every helper it uses is defined inside it.
 */
function measure({ touch }) {
  const ctx = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  })
  // Canvas normalizes any CSS color syntax (oklch, color-mix…) to RGBA
  const rgba = (css) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }
  const over = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3])
    if (!a) return [0, 0, 0, 0]
    return [0, 1, 2]
      .map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a)
      .concat(a)
  }
  // Composite background colours from the element up to the root; the
  // canvas default (white) sits under everything
  const effectiveBg = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 1) break
    }
    let acc = [255, 255, 255, 1]
    for (const l of layers.reverse()) acc = over(l, acc)
    return { color: acc, layers: layers.length }
  }
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const contrast = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
  }
  const hex = (c) =>
    '#' +
    c
      .slice(0, 3)
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('') +
    (c[3] < 1 ? ` @${c[3].toFixed(2)}` : '')
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return (
      r.width > 0 &&
      r.height > 0 &&
      cs.visibility !== 'hidden' &&
      cs.display !== 'none' &&
      +cs.opacity > 0
    )
  }

  // Any other fixed/sticky element pinned to the top and spanning most of
  // the width is also a topbar (e.g. a page rendering its own fixed bar
  // instead of teleporting into #layout-bar)
  const pinned = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el)
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false
    if (el.closest('#layout-bar, .layout-mobile-nav, .layout-sidebar'))
      return false
    const r = el.getBoundingClientRect()
    return (
      r.top <= 1 &&
      r.height > 4 &&
      r.height < innerHeight * 0.3 &&
      r.width > innerWidth * 0.5 &&
      cs.pointerEvents !== 'none' &&
      visible(el)
    )
  })
  const candidates = [
    ['layout-bar', document.querySelector('#layout-bar')],
    ['mobile-nav', document.querySelector('.layout-mobile-nav')],
    ...pinned.map((el) => [
      'pinned:' +
        (el.id ||
          String(el.getAttribute('class') || '').split(' ')[0] ||
          el.tagName),
      el,
    ]),
  ].filter(([, el]) => el && visible(el))

  // Chrome a top bar must never cover at scroll 0
  const covered = []
  if (window.scrollY === 0) {
    const chrome = [
      ['mobile-nav', document.querySelector('.layout-mobile-nav')],
      ['sidebar', document.querySelector('.layout-sidebar')],
    ].filter(([, el]) => el && visible(el))
    for (const [, bar] of candidates.filter(([n]) => n !== 'mobile-nav')) {
      const b = bar.getBoundingClientRect()
      for (const [cname, c] of chrome) {
        const r = c.getBoundingClientRect()
        const h = Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top)
        const w = Math.min(b.right, r.right) - Math.max(b.left, r.left)
        if (h > 2 && w > 2 && !bar.contains(c) && !c.contains(bar)) {
          covered.push({
            bar:
              bar.id || String(bar.getAttribute('class') || '').split(' ')[0],
            chrome: cname,
            px: Math.round(h),
          })
        }
      }
    }
  }

  const bars = candidates.map(([name, el]) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    // The visible "plate" may be a child (the blog bar paints its bg on an
    // inner div), so take the first descendant with a background
    let plate = el
    for (const n of [el, ...el.querySelectorAll('*')]) {
      if (rgba(getComputedStyle(n).backgroundColor)[3] > 0) {
        plate = n
        break
      }
    }
    const plateBg = rgba(getComputedStyle(plate).backgroundColor)

    // Text leaves: elements whose own text node is non-empty
    const texts = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const s = t.textContent.trim()
      const p = t.parentElement
      if (!s || !visible(p)) continue
      const fg = rgba(getComputedStyle(p).color)
      const bg = effectiveBg(p).color
      const fgOver = over(fg, bg)
      const ratio = contrast(fgOver, bg)
      const pr = p.getBoundingClientRect()
      texts.push({
        text: s.slice(0, 40),
        fg: hex(fg),
        bg: hex(bg),
        ratio: +ratio.toFixed(2),
        top: Math.round(pr.top),
        left: Math.round(pr.left),
        right: Math.round(pr.right),
        isSep: s === '·',
      })
    }

    // Line structure: group text by top offset (±4px)
    const lines = []
    for (const t of texts) {
      let line = lines.find((l) => Math.abs(l.top - t.top) <= 4)
      if (!line) lines.push((line = { top: t.top, items: [] }))
      line.items.push(t)
    }
    lines.sort((a, b) => a.top - b.top)
    for (const l of lines) l.items.sort((a, b) => a.left - b.left)
    const orphanSeps = lines.flatMap((l) =>
      [l.items[0], l.items[l.items.length - 1]].filter((t) => t?.isSep)
    )

    return {
      name,
      rect: {
        top: Math.round(r.top),
        height: Math.round(r.height),
        width: Math.round(r.width),
      },
      position: cs.position,
      plateBg: hex(plateBg),
      plateAlpha: +plateBg[3].toFixed(2),
      effectiveBg: hex(effectiveBg(plate).color),
      texts,
      lineCount: lines.length,
      lines: lines.map((l) => l.items.map((t) => t.text).join(' ')),
      orphanSeps: orphanSeps.length,
    }
  })

  // ---- Whole page ----
  const describe = (el) => {
    const cls = String(el.getAttribute('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join('.')
    return (
      el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (cls ? '.' + cls : '')
    )
  }
  const clipsX = (el) =>
    /hidden|clip|auto|scroll/.test(getComputedStyle(el).overflowX)

  // Overflow culprits: outermost elements poking past the right edge that no
  // ancestor clips
  const overflowCulprits = []
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.right <= innerWidth + 1 || r.width === 0) continue
      let clipped = false
      for (
        let a = el.parentElement;
        a && a !== document.body;
        a = a.parentElement
      ) {
        if (clipsX(a)) {
          clipped = true
          break
        }
      }
      if (clipped) continue
      if (overflowCulprits.some((c) => c.el.contains(el))) continue
      overflowCulprits.push({ el, right: Math.round(r.right) })
    }
  }

  // Text in the viewport: contrast + size
  const lowContrast = []
  const tinyText = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const s = t.textContent.trim()
    const p = t.parentElement
    if (!s || s.length < 2 || !p || !visible(p)) continue
    if (
      p.closest(
        'svg, canvas, [aria-hidden="true"], .sr-only, .dev-hud, script, style'
      )
    )
      continue
    const r = p.getBoundingClientRect()
    if (
      r.bottom < 0 ||
      r.top > innerHeight ||
      r.right < 0 ||
      r.left > innerWidth
    )
      continue
    // Clipped to nothing (sr-only patterns, truncated containers)
    if (r.width < 2 || r.height < 2) continue
    const cs = getComputedStyle(p)
    const size = Number.parseFloat(cs.fontSize)
    if (size < 10)
      tinyText.push({ text: s.slice(0, 30), size, el: describe(p) })
    // Skip text over images/gradients: the composited colour is a guess
    let overImage = false
    for (let a = p; a; a = a.parentElement) {
      if (getComputedStyle(a).backgroundImage !== 'none') {
        overImage = true
        break
      }
    }
    if (overImage || p.closest('figure, picture, video')) continue
    // ...and text laid over a map, chart canvas or embed
    const under = document.elementsFromPoint(
      r.left + r.width / 2,
      r.top + r.height / 2
    )
    if (under.some((u) => /^(?:CANVAS|IMG|VIDEO|IFRAME)$/.test(u.tagName)))
      continue
    const fg = rgba(cs.color)
    if (fg[3] === 0) continue
    const bg = effectiveBg(p).color
    const ratio = contrast(over(fg, bg), bg)
    const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700)
    const need = large ? 3 : 4.5 // WCAG AA (in-page: no module scope)
    if (ratio < need) {
      lowContrast.push({
        text: s.slice(0, 30),
        ratio: +ratio.toFixed(2),
        need,
        fg: hex(fg),
        bg: hex(bg),
        el: describe(p),
      })
    }
  }

  // Tap targets on touch screens
  const smallTargets = []
  if (touch) {
    const inline = (el) =>
      getComputedStyle(el).display === 'inline' &&
      el.parentElement?.closest(
        'p, li, td, dd, blockquote, figcaption, span'
      ) &&
      (el.parentElement.textContent || '').trim().length >
        (el.textContent || '').trim().length + 10
    for (const el of document.querySelectorAll(
      'a[href], button, [role="button"], input:not([type="hidden"]), select, summary'
    )) {
      if (!visible(el) || el.closest('.dev-hud, [aria-hidden="true"]')) continue
      const r = el.getBoundingClientRect()
      // Visually-hidden (sr-only) controls aren't targets until focused
      if (r.width <= 1 && r.height <= 1) continue
      if (r.bottom < 0 || r.top > innerHeight) continue
      if ((r.width < 24 || r.height < 24) && !inline(el)) {
        smallTargets.push({
          el: describe(el),
          text: (el.textContent || el.getAttribute('aria-label') || '')
            .trim()
            .slice(0, 24),
          w: Math.round(r.width),
          h: Math.round(r.height),
        })
      }
    }
  }

  const brokenImages = [...document.images]
    .filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0)
    .map((img) => img.currentSrc.slice(0, 120))

  const page = {
    overflowCulprits: overflowCulprits
      .slice(0, 4)
      .map((c) => `${describe(c.el)} → ${c.right}px`),
    lowContrast,
    tinyText,
    smallTargets,
    brokenImages,
  }

  return {
    page,
    bars,
    covered,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollY: Math.round(window.scrollY),
    htmlClass: document.documentElement.className,
    bodyBg: hex(effectiveBg(document.body).color),
  }
}

// ── Measurements → issues ───────────────────────────────────────────────

function findIssues(m, ctx) {
  const issues = []
  if (m.scrollWidth > m.innerWidth + 1) {
    issues.push({
      kind: 'overflow',
      msg: `page is ${m.scrollWidth}px wide in a ${m.innerWidth}px viewport: ${m.page.overflowCulprits.join(', ') || 'culprit not found'}`,
    })
  }
  const pg = m.page
  // Under 2:1 reads as missing (a dark-mode colour with no light variant,
  // dark text on an always-dark page). 2–4.5:1 is the site's deliberate
  // tertiary text (zinc-400 on white, zinc-600 on black): a design call,
  // reported as a warning
  const invisible = pg.lowContrast.filter((t) => t.ratio < 2)
  const muted = pg.lowContrast.filter((t) => t.ratio >= 2)
  for (const [kind, list] of [
    ['contrast', invisible],
    ['contrast-aa', muted],
  ]) {
    if (!list.length) continue
    const worst = [...list].sort((a, b) => a.ratio - b.ratio)[0]
    issues.push({
      kind,
      msg: `${list.length} text item(s), worst "${worst.text}" ${worst.ratio}:1 (needs ${worst.need}) ${worst.fg} on ${worst.bg} in ${worst.el}`,
      items: list.slice(0, 12),
    })
  }
  if (pg.brokenImages.length) {
    issues.push({
      kind: 'broken-image',
      msg: `${pg.brokenImages.length} broken: ${pg.brokenImages.slice(0, 2).join(', ')}`,
    })
  }
  if (pg.smallTargets.length) {
    const t = pg.smallTargets[0]
    issues.push({
      kind: 'tap-target',
      msg: `${pg.smallTargets.length} control(s) under 24×24, e.g. ${t.el} "${t.text}" ${t.w}×${t.h}`,
      items: pg.smallTargets.slice(0, 12),
    })
  }
  if (pg.tinyText.length) {
    const t = pg.tinyText[0]
    issues.push({
      kind: 'tiny-text',
      msg: `${pg.tinyText.length} text item(s) under 10px, e.g. "${t.text}" ${t.size}px in ${t.el}`,
      items: pg.tinyText.slice(0, 12),
    })
  }
  for (const c of m.covered || []) {
    issues.push({
      kind: 'covers-chrome',
      bar: c.bar,
      msg: `${c.bar} covers ${c.px}px of the ${c.chrome} at scroll 0`,
    })
  }
  for (const b of m.bars) {
    if (ctx.scrolled && b.position === 'sticky' && b.rect.top <= 1) {
      if (b.plateAlpha < 0.85) {
        issues.push({
          kind: 'see-through',
          bar: b.name,
          msg: `sticky bar background alpha ${b.plateAlpha}, so content shows through`,
        })
      }
    }
    if (b.name === 'mobile-nav' && b.lineCount > 2) {
      issues.push({
        kind: 'wrap',
        bar: b.name,
        msg: `mobile nav wraps to ${b.lineCount} lines (${b.rect.height}px tall)`,
      })
    }
    if (b.orphanSeps) {
      issues.push({
        kind: 'orphan-sep',
        bar: b.name,
        msg: `${b.orphanSeps} "·" separator(s) dangling at a line edge: ${b.lines.join(' / ')}`,
      })
    }
  }
  return issues
}

// ── Browser driving ─────────────────────────────────────────────────────

const slug = (s) =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'

// A client-side redirect or a dev-server reload can abort the first goto;
// one retry settles it
async function gotoSettled(page, url) {
  const opts = { waitUntil: 'networkidle', timeout: 60000 }
  try {
    await page.goto(url, opts)
  } catch (e) {
    if (!/ERR_ABORTED|interrupted by another navigation/.test(e.message))
      throw e
    await page.waitForTimeout(1000)
    await page.goto(url, opts)
  }
}

const SCHEMES = ['dark', 'light']

/** A two-window rendezvous: resolves once every party has arrived. */
function barrier(parties) {
  let arrived = 0
  let open
  const gate = new Promise((resolve) => (open = resolve))
  return () => {
    if (++arrived === parties) open()
    return gate
  }
}

function launchWindow(slot) {
  return chromium.launch({
    headless: HEADLESS,
    args: HEADLESS
      ? []
      : [
          `--window-position=${slot.x},${slot.y}`,
          `--window-size=1440,${slot.h}`,
        ],
  })
}

/** One page per scheme per viewport, with per-route error collectors. */
async function openTab(browser, scheme, vp) {
  const touch = isTouch(vp)
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    colorScheme: scheme,
    deviceScaleFactor: 2,
    isMobile: touch && vp.width < 1024,
    hasTouch: touch,
  })
  // The dev-only "changed files" HUD sits over the top-right of every page
  await context.addInitScript(() => {
    const hide = () => {
      const st = document.createElement('style')
      st.textContent = '.dev-hud{display:none!important}'
      document.head.appendChild(st)
    }
    if (document.head) hide()
    else document.addEventListener('DOMContentLoaded', hide)
  })
  const page = await context.newPage()
  const tab = { scheme, touch, context, page, runtime: null }
  const origin = new URL(BASE).origin
  page.on('pageerror', (e) =>
    tab.runtime?.jsErrors.push(String(e.message).split('\n')[0].slice(0, 160))
  )
  page.on('console', (m) => {
    if (/Hydration .*mismatch/i.test(m.text()))
      tab.runtime?.jsErrors.push(m.text().split('\n')[0].slice(0, 160))
  })
  page.on('response', (r) => {
    if (r.status() >= 500 && r.url().startsWith(origin))
      tab.runtime?.http5xx.push(`${r.status()} ${r.url().slice(origin.length)}`)
  })
  return tab
}

/**
 * Visit one route in one tab. `loaded` and `beforeScroll` are shared with the
 * other scheme's tab, so both windows show the same page and scroll together.
 */
async function visit(tab, route, vpName, vp, { loaded, beforeScroll }) {
  const { page, scheme, touch } = tab
  const id = `${slug(route)}__${vpName}__${scheme}`
  const entry = { route, viewport: vpName, scheme, id, shots: {}, issues: [] }
  tab.runtime = { jsErrors: [], http5xx: [] }
  const gates = { loaded: false, beforeScroll: false }
  const pass = async (name, gate) => {
    gates[name] = true
    await gate()
  }
  try {
    await gotoSettled(page, BASE + route)
    await page.waitForTimeout(600) // hydration + useDark class sync
    await pass('loaded', loaded)
    const top = await page.evaluate(measure, { touch })
    entry.top = top
    entry.issues.push(
      ...findIssues(top, { scrolled: false }).map((i) => ({ ...i, at: 'top' }))
    )
    await page.screenshot({ path: path.join(OUT, `${id}__top.png`) })
    entry.shots.top = `${id}__top.png`

    await pass('beforeScroll', beforeScroll)
    await page.mouse.wheel(0, Math.round(vp.height * 0.9))
    await page.waitForTimeout(500)
    const scrolled = await page.evaluate(measure, { touch })
    entry.scrolled = scrolled
    if (scrolled.scrollY > 0) {
      entry.issues.push(
        ...findIssues(scrolled, { scrolled: true }).map((i) => ({
          ...i,
          at: 'scrolled',
        }))
      )
      await page.screenshot({ path: path.join(OUT, `${id}__scrolled.png`) })
      entry.shots.scrolled = `${id}__scrolled.png`
    }
  } catch (err) {
    entry.issues.push({
      kind: 'error',
      msg: String(err.message).split('\n')[0],
    })
    // Release the other window rather than leave it waiting on us
    if (!gates.loaded) loaded()
    if (!gates.beforeScroll) beforeScroll()
  }
  for (const e of new Set(tab.runtime.jsErrors))
    entry.issues.push({ kind: 'js-error', msg: e })
  for (const e of new Set(tab.runtime.http5xx))
    entry.issues.push({ kind: 'http-5xx', msg: e })
  for (const i of entry.issues)
    i.level = ERROR_KINDS.has(i.kind) ? 'error' : 'warn'
  return entry
}

const flagFor = (entry) => {
  const errs = entry.issues.filter((i) => i.level === 'error').length
  const warns = entry.issues.length - errs
  return errs ? `✗ ${errs}` : warns ? `· ${warns}w` : '✓'
}

/** Both schemes in lockstep: same viewport, same route, same moment. */
async function runLockstep(slots, routes, results) {
  const browsers = await Promise.all(SCHEMES.map((s) => launchWindow(slots[s])))
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const tabs = await Promise.all(
      SCHEMES.map((s, i) => openTab(browsers[i], s, vp))
    )
    for (const route of routes) {
      const sync = {
        loaded: barrier(tabs.length),
        beforeScroll: barrier(tabs.length),
      }
      const entries = await Promise.all(
        tabs.map((tab) => visit(tab, route, vpName, vp, sync))
      )
      results.push(...entries)
      console.log(
        `${vpName.padEnd(16)} ${route.slice(0, 44).padEnd(44)} ` +
          entries.map((e) => `${e.scheme} ${flagFor(e).padEnd(5)}`).join('  ')
      )
    }
    await Promise.all(tabs.map((t) => t.context.close()))
  }
  await Promise.all(browsers.map((b) => b.close()))
}

async function discoverRoutes() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const found = []
  for (const [index, prefix] of DISCOVER) {
    try {
      await gotoSettled(page, BASE + index)
      const href = await page.evaluate(
        (prefix) =>
          [...document.querySelectorAll(`a[href^="${prefix}"]`)]
            .map((a) => a.getAttribute('href').split(/[?#]/)[0])
            .find((h) => h.length > prefix.length),
        prefix
      )
      if (href) found.push(decodeURI(href))
    } catch {
      // Index didn't load; its own row will report that
    }
  }
  await browser.close()
  return found
}

// ── Report (contact sheet) ──────────────────────────────────────────────

function contactSheet(results) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  const byKind = {}
  for (const r of results)
    for (const i of r.issues) (byKind[i.kind] ||= []).push(r)
  const summary = Object.entries(byKind)
    .map(([k, rs]) => `<li><b>${k}</b>: ${rs.length}</li>`)
    .join('')
  const score = (r) =>
    r.issues.filter((i) => i.level === 'error').length * 100 + r.issues.length
  const sorted = [...results].sort(
    (a, b) => score(b) - score(a) || a.id.localeCompare(b.id)
  )
  const cards = sorted
    .map(
      (
        r
      ) => `<section class="${r.issues.some((i) => i.level === 'error') ? 'bad' : r.issues.length ? 'warn' : 'ok'} ${r.scheme}">
  <h3>${esc(r.route)} · ${r.viewport} · ${r.scheme}</h3>
  ${r.issues.length ? `<ul>${r.issues.map((i) => `<li class="${i.level}"><b>${i.kind}</b>${i.bar ? ` [${i.bar}]` : ''}${i.at ? ` (${i.at})` : ''}: ${esc(i.msg)}</li>`).join('')}</ul>` : ''}
  <div class="shots">${Object.entries(r.shots)
    .map(
      ([k, f]) =>
        `<figure><img loading="lazy" src="${f}"><figcaption>${k}</figcaption></figure>`
    )
    .join('')}</div>
</section>`
    )
    .join('\n')
  return `<!doctype html><meta charset="utf-8"><title>Layout review</title>
<style>
body{font:13px ui-monospace,monospace;background:#111;color:#ddd;margin:16px}
section{border:1px solid #333;margin:0 0 16px;padding:8px}
section.bad{border-color:#c33}section.warn{border-color:#a80}
li.warn{color:#db8}
h3{margin:0 0 6px;font-size:13px}
ul{margin:0 0 8px;padding-left:18px;color:#f99}
.shots{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0}img{max-width:min(720px,100%);border:1px solid #444;display:block}
figcaption{color:#888}
</style>
<h1>Layout review — ${new Date().toISOString()} — ${esc(BASE)}</h1>
<p>${results.length} combinations, ${results.filter((r) => r.issues.some((i) => i.level === 'error')).length} with errors, ${results.filter((r) => r.issues.length).length} with any issue</p>
<ul>${summary}</ul>
${cards}`
}

// ── Main ────────────────────────────────────────────────────────────────

// Only the default dir is wiped wholesale. A user-supplied --out may hold
// other things, so there only the files a previous run wrote are removed.
const isOwnOutput = (name) =>
  /__(?:top|scrolled)\.png$/.test(name) ||
  name === 'report.json' ||
  name === 'index.html'
if (OUT === DEFAULT_OUT) {
  await fs.rm(OUT, { recursive: true, force: true })
} else {
  const existing = await fs.readdir(OUT).catch(() => [])
  for (const name of existing.filter(isOwnOutput))
    await fs.rm(path.join(OUT, name), { force: true })
}
await fs.mkdir(OUT, { recursive: true })
const routes = args.routes
  ? args.routes.split(',')
  : [...new Set([...STATIC_ROUTES, ...(await discoverRoutes())])]
// Say which code is under test — a run against the wrong server looks fine
const health = await fetch(BASE + '/api/healthcheck')
  .then((r) => r.json())
  .catch(() => ({}))
console.log(
  `${BASE} → commit ${health.commit || '?'} (${health.env || 'unknown env'})\n` +
    `${routes.length} routes × ${Object.keys(VIEWPORTS).length} viewports × 2 schemes`
)
const slot = portraitSlot()
const half = Math.floor(slot.h / 2)
const results = []
// Dark on the top half of the portrait monitor, light on the bottom half
await runLockstep(
  {
    dark: { x: slot.x, y: slot.y, h: half },
    light: { x: slot.x, y: slot.y + half, h: half },
  },
  routes,
  results
)
await fs.writeFile(
  path.join(OUT, 'report.json'),
  JSON.stringify(results, null, 2)
)
await fs.writeFile(path.join(OUT, 'index.html'), contactSheet(results))

const withErrors = results.filter((r) =>
  r.issues.some((i) => i.level === 'error')
)
const withWarns = results.filter((r) =>
  r.issues.some((i) => i.level === 'warn')
)
console.log(
  `\n${results.length} combinations: ${withErrors.length} with errors, ${withWarns.length} with warnings → ${path.join(OUT, 'index.html')}`
)
process.exitCode = withErrors.length && args.strict ? 1 : 0
