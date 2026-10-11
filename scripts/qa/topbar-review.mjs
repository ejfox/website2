#!/usr/bin/env node
/**
 * Topbar review — screenshots + measured checks of the site's top chrome
 * (#layout-bar, the blog post metadata bar, and the mobile nav) across routes,
 * viewports and light/dark.
 *
 *   yarn qa:topbar                 # headed, against localhost:3006
 *   yarn qa:topbar --headless      # CI-style, no windows
 *   BASE_URL=https://ejfox.com yarn qa:topbar
 *   yarn qa:topbar --routes=/,/blog/ --viewports=iphone-se
 *
 * Headed mode opens two Chromium windows, dark on top and light below,
 * stacked on the portrait monitor if there is one (WINDOW_X / WINDOW_Y /
 * WINDOW_H override the placement). Output: .qa/topbar/ — PNGs, report.json
 * and index.html (a contact sheet with the failures listed first).
 *
 * Checks, per route × viewport × scheme, at the top of the page and scrolled:
 *   contrast  — WCAG ratio of every visible text node in the bar against its
 *               composited background (ancestors' bg alpha-blended)
 *   overflow  — page wider than the viewport (horizontal scroll)
 *   see-through — a sticky bar whose background is translucent enough that
 *               scrolled content shows through it
 *   wrap      — mobile nav wrapping onto more than two lines
 *   orphan-sep — a visible "·" separator at the start/end of a line
 *   covers-chrome — a top bar overlapping the mobile nav / sidebar at scroll 0
 */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const BASE = process.env.BASE_URL || 'http://localhost:3006'
const HEADLESS = !!args.headless
const OUT = path.resolve('.qa/topbar')
const MIN_CONTRAST = 4.5

const ROUTES = args.routes
  ? args.routes.split(',')
  : [
      '/',
      '/blog/',
      '/blog/2025/using-radios',
      '/blog/2024/the-mystery-of-peter-todd',
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
    ]

const ALL_VIEWPORTS = {
  'iphone-se': { width: 320, height: 640 },
  iphone: { width: 390, height: 844 },
  'large-phone': { width: 430, height: 932 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
}
const VIEWPORTS = args.viewports
  ? Object.fromEntries(
      args.viewports.split(',').map((k) => [k, ALL_VIEWPORTS[k]])
    )
  : ALL_VIEWPORTS

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

/** Runs in the page: measure every topbar-ish element. */
function measureTopbars() {
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

  return {
    bars,
    covered,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollY: Math.round(window.scrollY),
    htmlClass: document.documentElement.className,
    bodyBg: hex(effectiveBg(document.body).color),
  }
}

function findIssues(m, ctx) {
  const issues = []
  if (m.scrollWidth > m.innerWidth + 1) {
    issues.push({
      kind: 'overflow',
      msg: `page is ${m.scrollWidth}px wide in a ${m.innerWidth}px viewport`,
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
    const low = b.texts.filter((t) => !t.isSep && t.ratio < MIN_CONTRAST)
    if (low.length) {
      const worst = low.sort((a, b) => a.ratio - b.ratio)[0]
      issues.push({
        kind: 'contrast',
        bar: b.name,
        msg: `${low.length} text item(s) under ${MIN_CONTRAST}:1, worst "${worst.text}" ${worst.ratio}:1 (${worst.fg} on ${worst.bg})`,
      })
    }
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

const slug = (s) =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'

// Some routes re-navigate to themselves while hydrating, which aborts the
// first goto; one retry settles it
async function gotoSettled(page, url) {
  const opts = { waitUntil: 'networkidle', timeout: 60000 }
  try {
    await page.goto(url, opts)
  } catch (e) {
    if (!/ERR_ABORTED/.test(e.message)) throw e
    await page.waitForTimeout(1000)
    await page.goto(url, opts)
  }
}

async function runScheme(scheme, slot, results) {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: HEADLESS
      ? []
      : [
          `--window-position=${slot.x},${slot.y}`,
          `--window-size=1440,${slot.h}`,
        ],
  })
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport: vp,
      colorScheme: scheme,
      deviceScaleFactor: 2,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
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
    for (const route of ROUTES) {
      const id = `${slug(route)}__${vpName}__${scheme}`
      const entry = {
        route,
        viewport: vpName,
        scheme,
        id,
        shots: {},
        issues: [],
      }
      try {
        await gotoSettled(page, BASE + route)
        await page.waitForTimeout(600) // hydration + useDark class sync
        const top = await page.evaluate(measureTopbars)
        entry.top = top
        entry.issues.push(
          ...findIssues(top, { scrolled: false }).map((i) => ({
            ...i,
            at: 'top',
          }))
        )
        const clipH = Math.min(vp.height, 360)
        await page.screenshot({
          path: path.join(OUT, `${id}__top.png`),
          clip: { x: 0, y: 0, width: vp.width, height: clipH },
        })
        entry.shots.top = `${id}__top.png`

        await page.mouse.wheel(0, 700)
        await page.waitForTimeout(500)
        const scrolled = await page.evaluate(measureTopbars)
        entry.scrolled = scrolled
        if (scrolled.scrollY > 0) {
          entry.issues.push(
            ...findIssues(scrolled, { scrolled: true }).map((i) => ({
              ...i,
              at: 'scrolled',
            }))
          )
          await page.screenshot({
            path: path.join(OUT, `${id}__scrolled.png`),
            clip: { x: 0, y: 0, width: vp.width, height: clipH },
          })
          entry.shots.scrolled = `${id}__scrolled.png`
        }
      } catch (err) {
        entry.issues.push({
          kind: 'error',
          msg: String(err.message).split('\n')[0],
        })
      }
      const flag = entry.issues.length ? `✗ ${entry.issues.length}` : '✓'
      console.log(
        `${scheme.padEnd(5)} ${vpName.padEnd(11)} ${route.padEnd(26)} ${flag}`
      )
      results.push(entry)
    }
    await context.close()
  }
  await browser.close()
}

function contactSheet(results) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  const byKind = {}
  for (const r of results)
    for (const i of r.issues) (byKind[i.kind] ||= []).push(r)
  const summary = Object.entries(byKind)
    .map(([k, rs]) => `<li><b>${k}</b>: ${rs.length}</li>`)
    .join('')
  const sorted = [...results].sort(
    (a, b) => b.issues.length - a.issues.length || a.id.localeCompare(b.id)
  )
  const cards = sorted
    .map(
      (r) => `<section class="${r.issues.length ? 'bad' : 'ok'} ${r.scheme}">
  <h3>${esc(r.route)} · ${r.viewport} · ${r.scheme}</h3>
  ${r.issues.length ? `<ul>${r.issues.map((i) => `<li><b>${i.kind}</b>${i.bar ? ` [${i.bar}]` : ''}${i.at ? ` (${i.at})` : ''}: ${esc(i.msg)}</li>`).join('')}</ul>` : ''}
  <div class="shots">${Object.entries(r.shots)
    .map(
      ([k, f]) =>
        `<figure><img loading="lazy" src="${f}"><figcaption>${k}</figcaption></figure>`
    )
    .join('')}</div>
</section>`
    )
    .join('\n')
  return `<!doctype html><meta charset="utf-8"><title>Topbar review</title>
<style>
body{font:13px ui-monospace,monospace;background:#111;color:#ddd;margin:16px}
section{border:1px solid #333;margin:0 0 16px;padding:8px}
section.bad{border-color:#c33}
h3{margin:0 0 6px;font-size:13px}
ul{margin:0 0 8px;padding-left:18px;color:#f99}
.shots{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0}img{max-width:min(720px,100%);border:1px solid #444;display:block}
figcaption{color:#888}
</style>
<h1>Topbar review — ${new Date().toISOString()} — ${esc(BASE)}</h1>
<p>${results.length} combinations, ${results.filter((r) => r.issues.length).length} with issues</p>
<ul>${summary}</ul>
${cards}`
}

await fs.rm(OUT, { recursive: true, force: true })
await fs.mkdir(OUT, { recursive: true })
const slot = portraitSlot()
const half = Math.floor(slot.h / 2)
const results = []
// Dark on the top half of the portrait monitor, light on the bottom half
await Promise.all([
  runScheme('dark', { x: slot.x, y: slot.y, h: half }, results),
  runScheme('light', { x: slot.x, y: slot.y + half, h: half }, results),
])
await fs.writeFile(
  path.join(OUT, 'report.json'),
  JSON.stringify(results, null, 2)
)
await fs.writeFile(path.join(OUT, 'index.html'), contactSheet(results))

const failing = results.filter((r) => r.issues.length)
console.log(
  `\n${results.length} combinations, ${failing.length} with issues → ${path.join(OUT, 'index.html')}`
)
process.exitCode = failing.length && args.strict ? 1 : 0
