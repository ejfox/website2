#!/usr/bin/env node
/*
 * shoot-queue.mjs — the screenshot FORCING FUNCTION for the /projects portfolio.
 *
 * The problem it solves: ~75 project pages ship with only 1–2 images. They want
 * 4–5 visually-interesting ones each. The blocker is never the plumbing — it's
 * sitting down and actually capturing. This tool removes every excuse: it walks
 * your projects worst-first, opens each one (live URL or repo) + a drop folder,
 * waits for you to throw screenshots in, then uploads to Cloudinary and wires
 * the `![caption](url)` lines straight into the project .md. You do the only
 * irreplaceable part — the creative capture. It does the rest.
 *
 * It reuses capture.mjs for two things: SEEDING (auto-screenshotting live web
 * URLs as starter candidates) and UPLOADING (the proven cloudinary path).
 *
 *   yarn shoot                       # walk every project under target, worst-first
 *   yarn shoot --target 5            # aim for 5 images each (default 4)
 *   yarn shoot --min 3               # only queue projects with FEWER than 3 imgs
 *   yarn shoot --only moto-gpx,sstory
 *   yarn shoot --seed                # auto-capture live web URLs into the drop folder first
 *   yarn shoot --dry-run             # capture + preview markdown, but DON'T upload/write
 *   yarn shoot --no-open             # don't auto-open browser/Finder
 *
 * Drop folder: ~/Desktop/projectshots/<slug>/  (PNG/JPG/GIF you put there get wired in)
 * Needs Cloudinary creds in .env for the upload step (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs'
import { spawnSync, spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PROJ_DIR = join(ROOT, 'content/blog/projects')
const DROP_ROOT = join(homedir(), 'Desktop/projectshots')
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'ejf'

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2)
const flag = (name, def = false) => {
  const i = argv.indexOf('--' + name)
  return i === -1
    ? def
    : argv[i + 1] && !argv[i + 1].startsWith('--')
      ? argv[i + 1]
      : true
}
const TARGET = Number.parseInt(flag('target', '4'), 10)
const MIN = Number.parseInt(flag('min', String(TARGET)), 10) // queue projects with < MIN images
const ONLY =
  typeof flag('only') === 'string'
    ? flag('only')
        .split(',')
        .map((s) => s.trim())
    : null
const SEED = flag('seed') === true
const DRY = flag('dry-run') === true
const NO_OPEN = flag('no-open') === true

// ---- tiny ansi -------------------------------------------------------------
const c = (n, s) => `\x1B[${n}m${s}\x1B[0m`
const bold = (s) => c(1, s),
  dim = (s) => c(2, s),
  green = (s) => c(32, s),
  cyan = (s) => c(36, s),
  yellow = (s) => c(33, s),
  red = (s) => c(31, s)

// ---- frontmatter + image parsing ------------------------------------------
function parse(file) {
  const text = readFileSync(file, 'utf8')
  const slug = file.replace(PROJ_DIR + '/', '').replace(/\.md$/, '')
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (m)
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([a-z]+):\s*(\S.*)$/i)
      if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim()
    }
  const body = m ? text.slice(m[0].length) : text
  const images = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((x) => x[1])
  return {
    slug,
    file,
    text,
    fm,
    body,
    images,
    count: images.length,
    desc: firstProse(body),
  }
}
function firstProse(body) {
  let inComment = false
  for (const line of body.split('\n')) {
    const t = line.trim()
    if (inComment) {
      if (t.includes('-->')) inComment = false
      continue
    }
    if (t.startsWith('<!--')) {
      if (!t.includes('-->')) inComment = true
      continue
    }
    if (
      !t ||
      t.startsWith('![') ||
      t.startsWith('#') ||
      t.startsWith('---') ||
      t.startsWith('<')
    )
      continue
    return t.length > 120 ? t.slice(0, 117) + '…' : t
  }
  return ''
}

// ---- queue -----------------------------------------------------------------
function buildQueue() {
  let files = readdirSync(PROJ_DIR).filter(
    (f) => f.endsWith('.md') && !f.startsWith('!')
  )
  let list = files.map((f) => parse(join(PROJ_DIR, f)))
  if (ONLY) list = list.filter((p) => ONLY.includes(p.slug))
  else list = list.filter((p) => p.count < MIN)
  // worst-first: fewest images, then alphabetical for stable order
  return list.sort((a, b) => a.count - b.count || a.slug.localeCompare(b.slug))
}

// ---- helpers ---------------------------------------------------------------
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts })
function openThing(target) {
  if (!NO_OPEN)
    spawn('open', [target], { stdio: 'ignore', detached: true }).unref()
}
function hasCreds() {
  return !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

// Seed the drop folder with auto-captured frames from a live web URL (not github).
function seed(slug, url, drop) {
  if (!url || /github\.com|gitlab\.com/.test(url)) return
  console.log(dim(`  seeding from ${url} …`))
  sh(
    'node',
    [
      'scripts/capture.mjs',
      'scroll',
      url,
      join(drop, 'seed'),
      '--count',
      '5',
      '--wait',
      '1400',
      '--size',
      '1440,900',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )
}

const extOf = (f) =>
  (f.match(/\.(png|jpg|jpeg|gif|webp)$/i) || ['.png'])[0].toLowerCase()

// Upload one local file -> projects/<slug>/<id>, return the cloudinary URL (or null).
function upload(localFile, publicId) {
  if (DRY)
    return (
      `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}` +
      extOf(localFile)
    )
  const r = spawnSync(
    'node',
    ['scripts/capture.mjs', 'upload', localFile, publicId],
    { cwd: ROOT, encoding: 'utf8' }
  )
  const out = (r.stdout || '') + (r.stderr || '')
  const m = out.match(/https:\/\/res\.cloudinary\.com\/\S+/)
  if (!m) {
    console.log(red('  upload failed: ') + out.trim().split('\n').pop())
    return null
  }
  return m[0].replace(/\.png$/, extOf(localFile))
}
const caption = (f) =>
  f
    .replace(/\.[^.]+$/, '')
    .replace(/^seed_?/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\d+$/, '')
    .trim() || 'screenshot'

// Append new image lines into the .md after the last existing image (or at EOF).
function wire(p, lines) {
  copyFileSync(p.file, p.file + '.bak') // safety: always back up first
  const block = '\n' + lines.join('\n\n') + '\n'
  let out
  const lastImg = [...p.text.matchAll(/!\[[^\]]*\]\([^)]+\)/g)].pop()
  if (lastImg) {
    const end = lastImg.index + lastImg[0].length
    out = p.text.slice(0, end) + '\n' + block + p.text.slice(end)
  } else {
    out = p.text.replace(/\s*$/, '') + '\n' + block
  }
  writeFileSync(p.file, out)
}

// ---- interactive prompt ----------------------------------------------------
const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) =>
  new Promise((res) => rl.question(q, (a) => res(a.trim().toLowerCase())))

async function run() {
  const queue = buildQueue()
  console.log(
    bold(
      `\n📸 shoot-queue — ${queue.length} project${queue.length === 1 ? '' : 's'} under ${MIN} image${MIN === 1 ? '' : 's'} (target ${TARGET})`
    )
  )
  if (!hasCreds() && !DRY)
    console.log(
      yellow(
        '⚠  No Cloudinary creds in .env — uploads will fail. Add CLOUDINARY_* or run --dry-run.\n'
      )
    )
  if (DRY)
    console.log(
      dim(
        '   DRY RUN — capturing + previewing markdown, nothing uploaded or written.\n'
      )
    )
  if (!queue.length) {
    console.log(green('Nothing to do — every project meets the target. 🎉'))
    rl.close()
    return
  }

  let done = 0,
    added = 0
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]
    const drop = join(DROP_ROOT, p.slug)
    mkdirSync(drop, { recursive: true })
    console.log('\n' + dim('─'.repeat(64)))
    console.log(
      `${bold(`[${i + 1}/${queue.length}]`)} ${cyan(bold(p.fm.title || p.slug))}  ${dim(p.slug)}`
    )
    console.log(`  ${dim(p.desc)}`)
    console.log(
      `  images: ${p.count < TARGET ? red(p.count) : green(p.count)}/${TARGET}   ${p.fm.url ? dim(p.fm.url) : dim('(no url)')}`
    )
    console.log(`  drop into: ${bold(drop)}`)

    if (p.fm.url) openThing(p.fm.url)
    openThing(drop)
    if (SEED) seed(p.slug, p.fm.url, drop)

    let answer
    do {
      answer = await ask(
        `\n  ${bold('ENTER')}=wire dropped shots · ${bold('s')}=skip · ${bold('o')}=re-open · ${bold('q')}=quit  › `
      )
      if (answer === 'o') {
        if (p.fm.url) openThing(p.fm.url)
        openThing(drop)
      }
    } while (answer === 'o')
    if (answer === 'q') break
    if (answer === 's') {
      console.log(dim('  skipped.'))
      continue
    }

    const shots = readdirSync(drop)
      .filter((f) => /\.(?:png|jpe?g|gif|webp)$/i.test(f) && !f.startsWith('.'))
      .sort()
    if (!shots.length) {
      console.log(yellow('  no images in the drop folder — skipping.'))
      continue
    }

    const start = p.count
    const newLines = []
    let n = start
    for (const f of shots) {
      n++
      const publicId = `projects/${p.slug}/${String(n).padStart(2, '0')}`
      const url = upload(join(drop, f), publicId)
      if (!url) continue
      newLines.push(`![${caption(f)}](${url})`)
      console.log(green('  ✓ ') + dim(f + ' → ') + publicId)
    }
    if (!newLines.length) {
      console.log(yellow('  nothing wired.'))
      continue
    }
    console.log(
      dim('\n  markdown to add:\n') + newLines.map((l) => '    ' + l).join('\n')
    )
    if (DRY) {
      console.log(dim('  (dry-run — not writing .md)'))
      continue
    }
    wire(p, newLines)
    console.log(
      green(
        `  ✓ wired ${newLines.length} image${newLines.length === 1 ? '' : 's'} into ${p.slug}.md`
      ) + dim(`  (backup: ${p.slug}.md.bak)`)
    )
    done++
    added += newLines.length
  }

  console.log(
    '\n' +
      bold(
        `done — ${done} project${done === 1 ? '' : 's'} updated, ${added} image${added === 1 ? '' : 's'} added.`
      )
  )
  if (added && !DRY)
    console.log(
      dim(
        'next: yarn blog:process && review, then commit. .bak files left next to each edited .md.'
      )
    )
  rl.close()
}
run().catch((e) => {
  console.error(red(e.stack || e.message))
  rl.close()
  process.exit(1)
})
