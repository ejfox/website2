#!/usr/bin/env node
/**
 * @file pr-eval.mjs
 * @description PR eval: one page for a batch of PRs: what each changed, its
 *   CI and preview, and before/after Playwright screenshots of the routes it
 *   touches (phone + desktop, dark + light). No yarn script; run with node
 *   from the repo root (output paths resolve against cwd).
 *
 *   BEFORE=https://ejfox.com AFTER=http://127.0.0.1:3036 \
 *     node scripts/qa/pr-eval.mjs --prs=73,74,75 [--routes=/,/blog/] [--watch]
 *
 * BEFORE is what main serves; AFTER is a local build of main with the PRs
 * merged in. This script does not build or serve AFTER; start it yourself.
 * --watch drives two windows in lockstep on the portrait
 * monitor: before on top, after below. Output: .qa/eval/index.html, which
 * links the layout review at .qa/layout/ if one has been run.
 *
 * Gotchas: wipes .qa/eval/ (gitignored) on every run. Reads PR metadata and
 * checks via the `gh` CLI (network; needs gh auth); a failed gh call just
 * leaves that PR's row sparse. Window placement uses osascript (macOS only,
 * falls back to a default slot). Read-only against GitHub and both sites.
 */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

// ── Config ──────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const BEFORE = process.env.BEFORE || 'https://ejfox.com'
const AFTER = process.env.AFTER || 'http://127.0.0.1:3036'
// Headless unless asked: every headed window takes focus on macOS, once per
// viewport, which yanks you out of the terminal mid-run
const HEADLESS = !args.watch
const OUT = path.resolve('.qa/eval')
const PRS = String(args.prs || '')
  .split(',')
  .filter(Boolean)
  .map(Number)

// Which routes show each PR's change (the 2026-10-11 batch, as an example).
// Unlisted PRs get the homepage; --routes=/a,/b applies one list to every PR.
const PR_ROUTES = {
  73: [
    '/blog/',
    '/blog/2013/the-magazine-experience-on-the-web',
    '/stats',
    '/gear',
    '/api-docs',
    '/threads',
    '/projects/subway-builder',
  ],
  74: ['/now'],
  75: ['/consulting', '/updates', '/sitemap', '/api-docs'],
}
const SHOTS = [
  ['phone', { width: 390, height: 844 }, true],
  ['desktop', { width: 1440, height: 900 }, false],
]
const SCHEMES = ['dark', 'light']

// ── Helpers ─────────────────────────────────────────────────────────────

// Swallows failures (missing gh, no auth, unknown PR) and returns '' so one
// bad PR doesn't sink the whole report.
const sh = (cmd) => {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return ''
  }
}

function prInfo(n) {
  const json = sh(
    `gh pr view ${n} --json number,title,url,body,additions,deletions,changedFiles,headRefName`
  )
  const pr = json ? JSON.parse(json) : { number: n, title: `#${n}` }
  const checks = sh(`gh pr checks ${n}`)
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .map(([name, state]) => ({ name, state }))
    .filter((c) => c.state !== 'skipping')
  return { ...pr, checks, preview: `https://pr-${n}.preview.ejfox.com` }
}

// Find the portrait monitor via AppKit (JXA). Converts Cocoa's bottom-left
// origin to the top-left coords Chrome's --window-position expects; the 25px
// leaves room for the macOS menu bar.
function portraitSlot() {
  try {
    const out = execSync(
      `osascript -l JavaScript -e 'ObjC.import("AppKit"); const s=$.NSScreen.screens.js; const mainH=s[0].frame.size.height; JSON.stringify(s.map(x=>({x:x.frame.origin.x, top: mainH-(x.frame.origin.y+x.frame.size.height), w:x.frame.size.width, h:x.frame.size.height})))'`,
      { encoding: 'utf8' }
    )
    const screens = JSON.parse(out)
    const p = screens.find((s) => s.h > s.w) || screens[0]
    return { x: p.x, y: p.top + 25, h: p.h - 25 }
  } catch {
    return { x: 0, y: 0, h: 1400 }
  }
}

// Both pages wait here before screenshotting, so before/after frames are
// taken at the same moment (and --watch windows move in lockstep).
function barrier(parties) {
  let arrived = 0
  let open
  const gate = new Promise((resolve) => (open = resolve))
  return () => {
    if (++arrived === parties) open()
    return gate
  }
}

const slug = (s) =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'

async function shoot(page, base, route, file, ready) {
  try {
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(800)
  } catch {
    // Screenshot whatever loaded; the image shows the failure
  }
  await ready()
  await page.screenshot({ path: path.join(OUT, file) })
  return file
}

// ── Screenshots ─────────────────────────────────────────────────────────

await fs.rm(OUT, { recursive: true, force: true })
await fs.mkdir(OUT, { recursive: true })

const prs = PRS.map(prInfo)
const slot = portraitSlot()
const half = Math.floor(slot.h / 2)
const launch = (y) =>
  chromium.launch({
    headless: HEADLESS,
    args: HEADLESS
      ? []
      : [`--window-position=${slot.x},${y}`, `--window-size=1440,${half}`],
  })
const [bBrowser, aBrowser] = await Promise.all([
  launch(slot.y),
  launch(slot.y + half),
])

const routesFor = (n) =>
  args.routes ? String(args.routes).split(',') : PR_ROUTES[n] || ['/']
const routes = [...new Set(prs.flatMap((p) => routesFor(p.number)))]
const shots = {} // route -> scheme -> device -> { before, after }
for (const scheme of SCHEMES) {
  for (const [device, viewport, touch] of SHOTS) {
    const opts = {
      viewport,
      colorScheme: scheme,
      deviceScaleFactor: 2,
      isMobile: touch,
      hasTouch: touch,
    }
    const [bCtx, aCtx] = await Promise.all([
      bBrowser.newContext(opts),
      aBrowser.newContext(opts),
    ])
    const [bPage, aPage] = await Promise.all([bCtx.newPage(), aCtx.newPage()])
    for (const route of routes) {
      const id = `${slug(route)}__${device}__${scheme}`
      const ready = barrier(2)
      const [before, after] = await Promise.all([
        shoot(bPage, BEFORE, route, `${id}__before.png`, ready),
        shoot(aPage, AFTER, route, `${id}__after.png`, ready),
      ])
      ;((shots[route] ||= {})[scheme] ||= {})[device] = { before, after }
      console.log(`${scheme.padEnd(5)} ${device.padEnd(8)} ${route}`)
    }
    await Promise.all([bCtx.close(), aCtx.close()])
  }
}
await Promise.all([bBrowser.close(), aBrowser.close()])

// ── Report ──────────────────────────────────────────────────────────────

// Layout review summary, if one has been run against AFTER
let layout = null
try {
  const report = JSON.parse(
    await fs.readFile(path.resolve('.qa/layout/report.json'), 'utf8')
  )
  const count = (lvl) =>
    report.filter((r) => r.issues.some((i) => i.level === lvl)).length
  const kinds = {}
  for (const r of report)
    for (const i of r.issues) kinds[i.kind] = (kinds[i.kind] || 0) + 1
  layout = {
    total: report.length,
    errors: count('error'),
    warns: count('warn'),
    kinds,
  }
} catch {
  // none yet
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
const pill = (state) =>
  `<span class="pill ${state === 'pass' ? 'ok' : state === 'fail' ? 'bad' : 'wait'}">${esc(state)}</span>`

const routeBlock = (route) => `
<div class="route">
  <h3><a href="${AFTER}${route}">${esc(route)}</a></h3>
  ${SCHEMES.map(
    (scheme) =>
      `<div class="row">${SHOTS.map(([device]) => {
        const s = shots[route]?.[scheme]?.[device]
        return s
          ? `<figure class="${device}"><figcaption>${scheme} · ${device}</figcaption>
            <div class="pair"><div><span>before</span><img loading="lazy" src="${s.before}"></div>
            <div><span>after</span><img loading="lazy" src="${s.after}"></div></div></figure>`
          : ''
      }).join('')}</div>`
  ).join('')}
</div>`

const html = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PR eval</title>
<style>
:root{--bg:#fff;--fg:#18181b;--muted:#71717a;--line:#e4e4e7;--ok:#15803d;--bad:#b91c1c;--wait:#a16207}
@media (prefers-color-scheme:dark){:root{--bg:#000;--fg:#e4e4e7;--muted:#a1a1aa;--line:#27272a;--ok:#4ade80;--bad:#f87171;--wait:#facc15}}
body{background:var(--bg);color:var(--fg);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;margin:0;padding:24px 16px;max-width:1600px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:40px 0 8px;padding-top:16px;border-top:1px solid var(--line)}
h3{font-size:14px;margin:24px 0 8px}a{color:inherit}
.muted{color:var(--muted)}.pill{display:inline-block;padding:0 6px;border:1px solid currentColor;border-radius:3px;font-size:12px;margin-right:4px}
.ok{color:var(--ok)}.bad{color:var(--bad)}.wait{color:var(--wait)}
table{border-collapse:collapse;margin:8px 0}td,th{border-bottom:1px solid var(--line);padding:4px 12px 4px 0;text-align:left;vertical-align:top}
.row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px}
figure{margin:0}figcaption{color:var(--muted);font-size:12px;margin-bottom:4px}
.pair{display:flex;gap:6px}.pair span{display:block;color:var(--muted);font-size:11px}
.pair img{display:block;border:1px solid var(--line)}
.phone .pair img{width:min(195px,40vw)}.desktop .pair img{width:min(560px,44vw)}
details{margin:8px 0}summary{cursor:pointer;color:var(--muted)}pre{white-space:pre-wrap;font-size:12px}
</style>
<h1>PR eval — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</h1>
<p class="muted">before = <a href="${BEFORE}">${esc(BEFORE)}</a> (main) · after = <a href="${AFTER}">${esc(AFTER)}</a> (main + ${prs.map((p) => '#' + p.number).join(' + ')}, merged locally)<br>
The local build runs without production API keys, so data panels (/stats, /now feeds) can be empty on the after side. Differences there are environment, not the PR.</p>
<table>
<tr><th>PR</th><th>size</th><th>CI</th><th>preview</th></tr>
${prs
  .map(
    (p) =>
      `<tr><td><a href="#pr-${p.number}">#${p.number}</a> ${esc(p.title)}</td><td class="muted">+${p.additions ?? '?'} −${p.deletions ?? '?'} · ${p.changedFiles ?? '?'} files</td><td>${p.checks.map((c) => `${pill(c.state)}${esc(c.name)}`).join(' ')}</td><td><a href="${p.preview}">pr-${p.number}</a></td></tr>`
  )
  .join('\n')}
</table>
${
  layout
    ? `<p>Layout review of the merged build: <a href="../layout/index.html">${layout.total} route × viewport × scheme combinations</a>, <b class="${layout.errors ? 'bad' : 'ok'}">${layout.errors} with errors</b>, ${layout.warns} with warnings. <span class="muted">${Object.entries(
        layout.kinds
      )
        .map(([k, v]) => `${k} ${v}`)
        .join(' · ')}</span></p>`
    : '<p class="muted">No layout review yet: run yarn qa:layout against AFTER.</p>'
}
${prs
  .map(
    (
      p
    ) => `<h2 id="pr-${p.number}"><a href="${p.url}">#${p.number}</a> ${esc(p.title)}</h2>
<details><summary>PR description</summary><pre>${esc(p.body)}</pre></details>
${routesFor(p.number).map(routeBlock).join('')}`
  )
  .join('\n')}
</html>`
await fs.writeFile(path.join(OUT, 'index.html'), html)
console.log(`\n→ ${path.join(OUT, 'index.html')}`)
