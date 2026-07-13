#!/usr/bin/env node
/*
 * capture.mjs — autonomous screenshot toolkit for the /projects portfolio.
 *
 * ONE tool, no new deps (built-in fetch + WebSocket, plus the cloudinary +
 * dotenv packages the project already has). It manages its OWN headless Chrome
 * on a dedicated debug port, so it never collides with — or pkills — the
 * website2 dev server. (That footgun cost us the dev server twice.)
 *
 * Pipeline this supports, end to end:
 *   boot/find a URL -> headless capture -> (crop) -> upload to Cloudinary ->
 *   wire the URL into a project .md -> `yarn blog:process` -> verify
 *
 * Commands:
 *   page   <url> <out.png> [--click "Text"] [--wait 5000] [--size 1440,900]
 *   record <url> <out.mp4> [--secs 12] [--scroll] [--to 0.25] [--click "Text"]
 *          # CDP screencast -> ffmpeg mp4. --scroll drifts down the page,
 *          #   --to limits the drift to a fraction of the page. Static pages
 *          #   emit no frames (screencast fires on repaint) — interact or skip.
 *   scroll <url> <outPrefix> [--count 6] [--wait 1300] [--size 1440,900]
 *   clip   <url> <selector> <outPrefix> [--max 6] [--min-w 320] [--min-h 220]
 *   upload <localfile> projects/<slug>/<name> [<file2> <id2> ...]
 *   sheet  <out.png> <glob-or-files...>          # contact sheet for eyeballing
 *   shoot  <slug> <url> [--click "Text"] [--wait 5000]
 *          # convenience: page-capture -> upload projects/<slug>/landing ->
 *          #   print the ready-to-paste markdown image line
 *
 * Env:
 *   CAPTURE_PORT   chrome debug port (default 9333 — NOT 9222, to dodge clashes)
 *   CHROME_BIN     override the Chrome binary path
 *   Cloudinary creds come from .env (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)
 *
 * See scripts/capture.README.md for recipes and the embeddings-search workflow.
 */
import { spawn } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'

// WebSocket is a global on Node 22+, but not on Node ≤20. Fall back to the `ws`
// package (present in this project's deps) so capture works no matter which Node
// version an app was booted under (nvm switches, etc.).
const WebSocketCtor = globalThis.WebSocket || (await import('ws')).default

const PORT = Number.parseInt(process.env.CAPTURE_PORT || '9333', 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- arg parsing -----------------------------------------------------------
function parseArgs(argv) {
  const pos = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) flags[key] = true
      else {
        flags[key] = next
        i++
      }
    } else pos.push(a)
  }
  return { pos, flags }
}

// ---- chrome lifecycle ------------------------------------------------------
function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN))
    return process.env.CHROME_BIN
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ]
  const hit = candidates.find((p) => existsSync(p))
  if (!hit) {
    console.error('No Chrome/Chromium found. Set CHROME_BIN.')
    process.exit(1)
  }
  return hit
}

async function debugAlive() {
  try {
    const r = await fetch(`http://localhost:${PORT}/json/version`, {
      signal: AbortSignal.timeout(1000),
    })
    return r.ok
  } catch {
    return false
  }
}

// Launch a dedicated headless Chrome (detached) if one isn't already serving
// the debug port. Uses its own throwaway profile so it touches nothing else.
//
// webgl mode (--webgl on record/page/etc): SwiftShader software GL so regl/
// canvas apps render instead of blank white. It is OPT-IN because software
// rendering tanks the compositor to ~2-15fps for everything — normal pages
// capture far smoother on the default GPU path. Mode changes relaunch Chrome.
const MODE_FILE = `/tmp/capture-chrome-${PORT}.mode`
async function ensureChrome(size = '1440,900', webgl = false) {
  const { readFileSync, rmSync } = await import('node:fs')
  const wantMode = webgl ? 'webgl' : 'gpu'
  if (await debugAlive()) {
    let curMode = 'gpu'
    try {
      curMode = readFileSync(MODE_FILE, 'utf8').trim()
    } catch {
      /* no marker -> assume gpu */
    }
    if (curMode === wantMode) return
    // wrong mode: kill this profile's chrome and relaunch below
    const { spawnSync } = await import('node:child_process')
    spawnSync('pkill', ['-f', `capture-chrome-${PORT}`])
    await sleep(800)
    rmSync(`/tmp/capture-chrome-${PORT}`, { recursive: true, force: true })
  }
  const bin = findChrome()
  const child = spawn(
    bin,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=/tmp/capture-chrome-${PORT}`,
      `--window-size=${size.replace('x', ',')}`,
      ...(webgl ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      'about:blank',
    ],
    { detached: true, stdio: 'ignore' }
  )
  child.unref()
  writeFileSync(MODE_FILE, wantMode)
  for (let i = 0; i < 40; i++) {
    // up to ~12s
    await sleep(300)
    if (await debugAlive()) return
  }
  console.error('Chrome did not come up on debug port', PORT)
  process.exit(1)
}

// ---- minimal CDP client ----------------------------------------------------
async function connect() {
  const targets = await (await fetch(`http://localhost:${PORT}/json`)).json()
  let page = targets.find((t) => t.type === 'page')
  if (!page) {
    // open a fresh tab
    page = await (await fetch(`http://localhost:${PORT}/json/new`)).json()
  }
  const ws = new WebSocketCtor(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const events = new Map() // method -> [resolvers]
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  const listeners = new Map() // method -> [fns], persistent (for screencast)
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
    } else if (msg.method) {
      if (listeners.has(msg.method)) {
        listeners.get(msg.method).forEach((fn) => fn(msg.params))
      }
      if (events.has(msg.method)) {
        events.get(msg.method).forEach((fn) => fn(msg.params))
        events.set(msg.method, [])
      }
    }
  })
  const once = (method) =>
    new Promise((res) => {
      const arr = events.get(method) || []
      arr.push(res)
      events.set(method, arr)
    })
  const on = (method, fn) => {
    const arr = listeners.get(method) || []
    arr.push(fn)
    listeners.set(method, arr)
  }
  await new Promise((r) => ws.addEventListener('open', r))
  await send('Page.enable')
  await send('Runtime.enable')
  return { send, once, on, close: () => ws.close() }
}

// Force the viewport to --size even when Chrome is already running (the
// --window-size launch arg only applies to a fresh launch).
async function applySize(cdp, size) {
  if (!size || typeof size !== 'string') return
  const [w, h] = size.replace('x', ',').split(',').map(Number)
  if (!w || !h) return
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
  })
}

// Navigate and wait for load + a settle delay. Falls back to the timeout if the
// load event never fires (SPAs, long polls).
async function goto(cdp, url, settleMs = 1500) {
  const loaded = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(8000)])
  await sleep(settleMs)
}

// ---- commands --------------------------------------------------------------
async function cmdPage({ pos, flags }) {
  const [url, out] = pos
  if (!url || !out) die('page <url> <out.png> [--click "Text"] [--wait ms]')
  await ensureChrome(flags.size, Boolean(flags.webgl))
  const cdp = await connect()
  await applySize(cdp, flags.size)
  await goto(cdp, url, Number.parseInt(flags.wait || '1500', 10))
  if (flags.click && typeof flags.click === 'string') {
    const r = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: clickExpr(flags.click),
    })
    console.log('click ->', r?.result?.value)
    await sleep(Number.parseInt(flags.wait || '3000', 10))
  }
  if (flags.key && typeof flags.key === 'string') {
    await pressKey(cdp, flags.key)
    await sleep(1200)
  }
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('saved', out)
  cdp.close()
  process.exit(0)
}

async function cmdScroll({ pos, flags }) {
  const [url, prefix] = pos
  if (!url || !prefix) die('scroll <url> <outPrefix> [--count 6] [--wait 1300]')
  const count = Number.parseInt(flags.count || '6', 10)
  const settle = Number.parseInt(flags.wait || '1300', 10)
  await ensureChrome(flags.size, Boolean(flags.webgl))
  const cdp = await connect()
  await applySize(cdp, flags.size)
  await goto(cdp, url, 2500)
  const dims = (
    await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: '({h:document.body.scrollHeight, vh:innerHeight})',
    })
  ).result.value
  const span = Math.max(0, dims.h - dims.vh)
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : Math.round((span * i) / (count - 1))
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${y})`,
    })
    await sleep(settle)
    const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
    const out = `${prefix}_${i}.png`
    writeFileSync(out, Buffer.from(s.data, 'base64'))
    console.log('saved', out, '@y', y)
  }
  cdp.close()
  process.exit(0)
}

async function cmdClip({ pos, flags }) {
  const [url, selector, prefix] = pos
  if (!url || !selector || !prefix)
    die(
      'clip <url> <selector> <outPrefix> [--max 6] [--min-w 320] [--min-h 220]'
    )
  const maxN = Number.parseInt(flags.max || '6', 10)
  const minW = Number.parseInt(flags['min-w'] || '320', 10)
  const minH = Number.parseInt(flags['min-h'] || '220', 10)
  await ensureChrome(flags.size, Boolean(flags.webgl))
  const cdp = await connect()
  await applySize(cdp, flags.size)
  await goto(cdp, url, 2500)
  // trigger lazy renders: scroll to bottom then back up
  await cdp.send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, document.body.scrollHeight)',
  })
  await sleep(1500)
  await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' })
  await sleep(800)
  const js = `JSON.stringify([...document.querySelectorAll(${JSON.stringify(selector)})].map(el=>{const r=el.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}}).filter(r=>r.w>=${minW}&&r.h>=${minH}).sort((a,b)=>b.w*b.h-a.w*a.h).slice(0,${maxN}))`
  const rects = JSON.parse(
    (
      await cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: js,
      })
    ).result.value
  )
  console.log('found', rects.length, 'elements')
  let i = 0
  for (const r of rects) {
    i++
    const s = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 },
    })
    if (s?.data) {
      writeFileSync(`${prefix}_${i}.png`, Buffer.from(s.data, 'base64'))
      console.log(
        'saved',
        `${prefix}_${i}.png`,
        `${Math.round(r.w)}x${Math.round(r.h)}`
      )
    }
  }
  cdp.close()
  process.exit(0)
}

async function cmdUpload({ pos }) {
  if (pos.length < 2 || pos.length % 2 !== 0)
    die('upload <localfile> projects/<slug>/<name> [<file2> <id2> ...]')
  const cloudinary = await cloudinaryClient()
  for (let i = 0; i < pos.length; i += 2) {
    const [src, publicId] = [pos[i], pos[i + 1]]
    const isVideo = /\.(?:mp4|webm|mov|gif)$/i.test(src)
    try {
      const r = await cloudinary.uploader.upload(src, {
        public_id: publicId,
        overwrite: true,
        resource_type: isVideo ? 'video' : 'image',
        // gifs go up as video so Cloudinary can transcode/loop them cheaply
      })
      console.log(`OK  ${publicId}  ${r.width}x${r.height}  ${r.resource_type}`)
      console.log(`    ${r.secure_url}`)
    } catch (e) {
      console.log('FAIL', publicId, e.message)
    }
  }
  process.exit(0)
}

// Cloudinary config: explicit vars if present, else CLOUDINARY_URL (which the
// SDK reads on its own — don't clobber it with undefineds).
async function cloudinaryClient() {
  const { v2: cloudinary } = await import('cloudinary')
  await import('dotenv/config')
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }
  return cloudinary
}

// Stop-motion scroll take: one screenshot per output frame at an exact,
// eased scroll position. secs of output at --fps (default 30) — a 12s take
// is 360 screenshots, roughly 1-2 minutes of capture.
async function recordStopMotion(cdp, out, secs, flags) {
  const fps = Number.parseInt(flags.fps || '30', 10)
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = mkdtempSync(join(tmpdir(), 'capture-rec-'))
  const fullSpan = (
    await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: 'Math.max(0, document.body.scrollHeight - innerHeight)',
    })
  ).result.value
  const span = Math.round(
    fullSpan * Math.min(1, Number.parseFloat(flags.to || '1') || 1)
  )
  const N = Math.max(2, Math.round(secs * fps))
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
  for (let k = 0; k < N; k++) {
    const pos = Math.round(span * ease(k / (N - 1)))
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${pos})`,
    })
    const s = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 85,
    })
    writeFileSync(join(dir, `f${String(k).padStart(5, '0')}.jpg`), Buffer.from(s.data, 'base64'))
    if (k > 0 && k % 90 === 0) console.log(`  frame ${k}/${N}`)
  }
  cdp.close()
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(
    'ffmpeg',
    [
      '-y', '-framerate', String(fps), '-i', join(dir, 'f%05d.jpg'),
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23',
      '-movflags', '+faststart', '-an',
      out,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )
  rmSync(dir, { recursive: true, force: true })
  if (r.status !== 0 || !existsSync(out)) {
    console.error('ffmpeg failed')
    process.exit(1)
  }
  console.log(`saved ${out} (stop-motion, ${N} frames @ ${fps}fps, ${secs}s)`)
  process.exit(0)
}

// record: CDP screencast -> ffmpeg mp4 (10-30s demo loops for project pages).
// Optional --scroll drifts down the page during the take; --click fires first.
async function cmdRecord({ pos, flags }) {
  const [url, out] = pos
  if (!url || !out)
    die(
      'record <url> <out.mp4> [--secs 12] [--scroll] [--click "Text"] [--wait 2500] [--size 1440,900]'
    )
  const secs = Number.parseFloat(flags.secs || '12')
  await ensureChrome(flags.size, Boolean(flags.webgl))
  const cdp = await connect()
  await applySize(cdp, flags.size)
  await goto(cdp, url, Number.parseInt(flags.wait || '2500', 10))
  if (flags.click && typeof flags.click === 'string') {
    await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: clickExpr(flags.click),
    })
    await sleep(1500)
  }

  // Scroll takes use STOP-MOTION: the browser only paints ~15-20 unique
  // positions/sec during live scrolling no matter how it's driven, which reads
  // as chop. Since scroll position is fully under our control, we instead set
  // the exact position for every output frame and screenshot it — perfectly
  // even motion, independent of paint timing. (Live screencast remains the
  // path for animation/interaction takes, where real time matters.)
  if (flags.scroll) {
    await recordStopMotion(cdp, out, secs, flags)
    return
  }

  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = mkdtempSync(join(tmpdir(), 'capture-rec-'))
  const frames = [] // {buf, ts} in memory — write to disk after the take.
  cdp.on('Page.screencastFrame', (p) => {
    // Ack FIRST: Chrome won't send the next frame until it hears back, so any
    // work before the ack (like sync PNG writes) directly caps the frame rate.
    cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId })
    frames.push({ buf: Buffer.from(p.data, 'base64'), ts: p.metadata.timestamp })
  })
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    everyNthFrame: 1,
    maxWidth: 1440,
    maxHeight: 900,
  })

  // --eval "<js>" runs right after recording starts — use it to trigger
  // animations mid-take (the script can setTimeout its own later beats).
  if (flags.eval && typeof flags.eval === 'string') {
    await cdp.send('Runtime.evaluate', { expression: flags.eval })
  }

  await sleep(secs * 1000)
  await cdp.send('Page.stopScreencast')
  await sleep(300)
  cdp.close()

  if (frames.length < 2) {
    console.error('too few frames captured:', frames.length)
    process.exit(1)
  }
  // Flush buffered frames to disk, then concat demuxer with real per-frame
  // durations from CDP timestamps
  const concat = []
  for (let i = 0; i < frames.length; i++) {
    const file = join(dir, `f${String(i).padStart(5, '0')}.jpg`)
    writeFileSync(file, frames[i].buf)
    concat.push(`file '${file}'`)
    const d =
      i < frames.length - 1
        ? Math.max(0.01, frames[i + 1].ts - frames[i].ts)
        : 0.1
    concat.push(`duration ${d.toFixed(4)}`)
  }
  concat.push(`file '${join(dir, `f${String(frames.length - 1).padStart(5, '0')}.jpg`)}'`)
  const listPath = join(dir, 'list.txt')
  writeFileSync(listPath, concat.join('\n'))
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-vf',
      // --speed N: record slow, play back N× faster. The screencast caps at
      // ~15-20fps, so a half-speed pan compressed 2× doubles effective frame
      // density — the cheap route to smooth scroll footage.
      `setpts=PTS/${Number.parseFloat(flags.speed || '1') || 1},scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=${Number.parseInt(flags.fps || '60', 10)}`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '23',
      '-movflags',
      '+faststart',
      '-an',
      out,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )
  rmSync(dir, { recursive: true, force: true })
  if (r.status !== 0 || !existsSync(out)) {
    console.error('ffmpeg failed')
    process.exit(1)
  }
  console.log(`saved ${out} (${frames.length} frames, ${secs}s)`)
  process.exit(0)
}

async function cmdSheet({ pos }) {
  const [out, ...files] = pos
  if (!out || !files.length) die('sheet <out.png> <file1> <file2> ...')
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(
    'montage',
    [
      ...files,
      '-tile',
      '3x',
      '-geometry',
      '480x+6+6',
      '-label',
      '%f',
      '-background',
      '#111',
      '-fill',
      '#ccc',
      out,
    ],
    { stdio: 'inherit' }
  )
  if (r.status === 0) console.log('contact sheet ->', out)
  process.exit(r.status || 0)
}

// shoot: page-capture -> upload to projects/<slug>/landing -> print md line
async function cmdShoot({ pos, flags }) {
  const [slug, url] = pos
  if (!slug || !url) die('shoot <slug> <url> [--click "Text"] [--wait ms]')
  const tmp = `/tmp/shoot_${slug}.png`
  await cmdPageInline(url, tmp, flags)
  const { v2: cloudinary } = await import('cloudinary')
  await import('dotenv/config')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  const publicId = `projects/${slug}/landing`
  const r = await cloudinary.uploader.upload(tmp, {
    public_id: publicId,
    overwrite: true,
  })
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const md = `![${slug}](https://res.cloudinary.com/${cloud}/image/upload/${publicId}.png)`
  console.log(`\nuploaded ${publicId} (${r.width}x${r.height})`)
  console.log('\npaste into content/blog/projects/' + slug + '.md:\n')
  console.log(md + '\n')
  process.exit(0)
}

// page capture without exiting (used by shoot)
async function cmdPageInline(url, out, flags) {
  await ensureChrome(flags.size, Boolean(flags.webgl))
  const cdp = await connect()
  await applySize(cdp, flags.size)
  await goto(cdp, url, Number.parseInt(flags.wait || '1500', 10))
  if (flags.click && typeof flags.click === 'string') {
    await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: clickExpr(flags.click),
    })
    await sleep(Number.parseInt(flags.wait || '3000', 10))
  }
  if (flags.key && typeof flags.key === 'string') {
    await pressKey(cdp, flags.key)
    await sleep(1200)
  }
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  cdp.close()
}

// ---- helpers ---------------------------------------------------------------
// Dispatch a single keystroke to the page (for viz keyboard toggles, etc.)
async function pressKey(cdp, key) {
  const code =
    key.length === 1 && /[a-z]/i.test(key) ? 'Key' + key.toUpperCase() : key
  const vk = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: vk,
    text: key.length === 1 ? key : undefined,
  })
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: vk,
  })
  console.log('pressed key ->', key)
}

function clickExpr(text) {
  return `(() => {
    const t = ${JSON.stringify(text)};
    const els = [...document.querySelectorAll('button, [role=button], a, div, span, li')];
    const el = els.find(e => e.offsetParent !== null && e.textContent.trim().toLowerCase() === t.toLowerCase())
      || els.find(e => e.offsetParent !== null && e.textContent.trim().toLowerCase().includes(t.toLowerCase()));
    if (el) { el.click(); return 'clicked: ' + el.tagName + ' "' + el.textContent.trim().slice(0,40) + '"'; }
    return 'NOT FOUND';
  })()`
}

function die(usage) {
  console.error('usage: node scripts/capture.mjs ' + usage)
  process.exit(1)
}

// tui: render a terminal command / TUI to a clean PNG via VHS (headless PTY).
// Needs `vhs` on PATH (brew install vhs). Great for CLIs and full-screen TUIs.
async function cmdTui({ pos, flags }) {
  const [command, out] = pos
  if (!command || !out)
    die(
      'tui "<command>" <out.png> [--wait 3] [--width 1200] [--height 800] [--font 18] [--theme "Name"] [--cd dir]'
    )
  const { spawnSync } = await import('node:child_process')
  if (spawnSync('vhs', ['--version'], { stdio: 'ignore' }).status !== 0) {
    console.error('vhs not found — install with: brew install vhs')
    process.exit(1)
  }
  const W = flags.width || '1200',
    H = flags.height || '800',
    F = flags.font || '18',
    wait = flags.wait || '3'
  const theme =
    typeof flags.theme === 'string' ? `Set Theme "${flags.theme}"\n` : ''
  const setup =
    typeof flags.cd === 'string'
      ? `Hide\nType ${JSON.stringify('cd ' + flags.cd + ' && clear')}\nEnter\nSleep 700ms\nShow\n`
      : ''
  const tape = `Output "/tmp/_capture_tui.gif"
Set FontSize ${F}
Set Width ${W}
Set Height ${H}
Set Padding 26
${theme}${setup}Type ${JSON.stringify(command)}
Enter
Sleep ${wait}s
${typeof flags.type === 'string' ? `Type ${JSON.stringify(flags.type)}\nSleep 1500ms\n` : ''}Screenshot ${JSON.stringify(out)}
`
  const tapePath = '/tmp/_capture_tui.tape'
  writeFileSync(tapePath, tape)
  const r = spawnSync('vhs', [tapePath], { stdio: 'inherit' })
  try {
    ;(await import('node:fs')).unlinkSync('/tmp/_capture_tui.gif')
  } catch {
    // Temp gif may not exist — ignore
  }
  if (r.status === 0 && existsSync(out)) console.log('saved', out)
  else {
    console.error('vhs failed')
    process.exit(1)
  }
  process.exit(0)
}

const HELP = `capture.mjs — autonomous screenshot toolkit (see scripts/capture.README.md)

  page   <url> <out.png>            [--click "Text"] [--key p] [--wait 5000] [--size 1440,900]
  record <url> <out.mp4>            [--secs 12] [--scroll] [--click "Text"] 10-30s demo clip
  scroll <url> <outPrefix>          [--count 6] [--wait 1300]
  clip   <url> <selector> <prefix>  [--max 6] [--min-w 320] [--min-h 220]
  upload <file> projects/<slug>/<name> [<file2> <id2> ...]
  sheet  <out.png> <files...>       contact sheet to eyeball captures
  shoot  <slug> <url>               capture+upload+print markdown in one shot
  tui    "<command>" <out.png>      render a CLI/TUI to a clean PNG (needs vhs) [--wait 3] [--cd dir] [--theme "Name"]

Chrome is auto-launched on port ${PORT} (override CAPTURE_PORT). It is dedicated
to this tool and never touches the dev server — do NOT pkill node to clean up.`

// ---- dispatch --------------------------------------------------------------
const [cmd, ...rest] = process.argv.slice(2)
const parsed = parseArgs(rest)
const table = {
  page: cmdPage,
  record: cmdRecord,
  scroll: cmdScroll,
  clip: cmdClip,
  upload: cmdUpload,
  sheet: cmdSheet,
  shoot: cmdShoot,
  tui: cmdTui,
}
if (!cmd || cmd === '--help' || cmd === '-h' || !table[cmd]) {
  console.log(HELP)
  process.exit(
    cmd && table[cmd] === undefined && cmd !== '--help' && cmd !== '-h' ? 1 : 0
  )
}
await table[cmd](parsed)
