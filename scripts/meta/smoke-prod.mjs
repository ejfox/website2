#!/usr/bin/env node
/**
 * @file smoke-prod.mjs
 * @description Smoke-test the live site: the pages, feeds, APIs, redirects and
 *   guardrails that matter most, plus (with --browser) a headless pass for JS errors.
 *
 *   node scripts/meta/smoke-prod.mjs              # https://ejfox.com, HTTP checks only
 *   yarn smoke                                    # same + --browser (package.json adds it)
 *   node scripts/meta/smoke-prod.mjs https://pr-123.preview.ejfox.com
 *
 * One request at a time, ~150ms apart: a concurrent crawl once pushed pm2 past
 * its 1G cap and 502'd the site. Read-only: GETs only, no forms, no webhooks.
 * Network only; writes no files, no git, no env vars. --browser imports
 * `playwright` lazily and reports a failed check if it can't be loaded.
 * Exits 1 if any check fails, 2 if the script itself crashes; slow pages warn
 * but don't fail. Some checks pin specific slugs (coach-artie, hacker-culture);
 * update them when those posts change status.
 */

const args = process.argv.slice(2)
const BASE = (
  args.find((a) => /^https?:\/\//.test(a)) ?? 'https://ejfox.com'
).replace(/\/+$/, '')
const BROWSER = args.includes('--browser')
const SLOW_MS = 2500
const PAUSE_MS = 150

const results = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Check helpers ───────────────────────────────────────────

// redirect: 'manual' so redirect and open-redirect checks see the raw 30x + Location.
async function get(path, { redirect = 'manual' } = {}) {
  await sleep(PAUSE_MS)
  const t0 = performance.now()
  const res = await fetch(BASE + path, {
    redirect,
    headers: { 'user-agent': 'ejfox-smoke/1 (+scripts/meta/smoke-prod.mjs)' },
    signal: AbortSignal.timeout(30_000),
  })
  const body = await res.text()
  return { res, body, ms: Math.round(performance.now() - t0) }
}

/** Run one named check. fn returns nothing (pass) or throws (fail). */
async function check(group, name, fn) {
  try {
    const note = await fn()
    results.push({ group, name, ok: true, note })
  } catch (err) {
    results.push({ group, name, ok: false, note: err.message })
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

/** A page: 200, real HTML, a <title>, optional must-contain strings. */
function page(path, { contains = [], group = 'pages' } = {}) {
  return check(group, path, async () => {
    const { res, body, ms } = await get(path)
    assert(res.status === 200, `status ${res.status}`)
    assert(/<title>[^<]{3,}<\/title>/.test(body), 'no <title>')
    for (const s of contains) assert(body.includes(s), `missing "${s}"`)
    // Judge the document <title> (the first one; SVG charts have their own),
    // not the body: posts and scraps quote error text.
    const title = /<title>([^<]*)<\/title>/.exec(body)?.[1] ?? ''
    assert(!/\b(?:500|404|Error)\b/i.test(title), `error page: "${title}"`)
    return ms > SLOW_MS ? `SLOW ${ms}ms` : `${ms}ms`
  })
}

function status(path, expected, { group = 'guards', location } = {}) {
  return check(group, `${path} → ${expected}`, async () => {
    const { res } = await get(path)
    assert(res.status === expected, `status ${res.status}`)
    if (location) {
      const loc = res.headers.get('location') ?? ''
      assert(location(loc), `bad Location: ${loc}`)
    }
  })
}

/** A Location stays on this site (relative, or same origin). */
const onSite = (loc) => {
  try {
    return new URL(loc, BASE).origin === new URL(BASE).origin
  } catch {
    return false
  }
}

// ── Main: HTTP checks ───────────────────────────────────────

async function main() {
  console.log(`smoke: ${BASE}${BROWSER ? ' (+browser)' : ''}\n`)

  // ── Health ────────────────────────────────────────────────────────────────
  let manifest = []
  await check('health', '/api/healthcheck', async () => {
    const { body } = await get('/api/healthcheck')
    const h = JSON.parse(body)
    assert(h.status === 'healthy', `status ${h.status}`)
    assert(h.manifest === 'ok', `manifest ${h.manifest}`)
    return `commit ${h.commit}, node ${h.node}, ${h.memory?.used}MB heap`
  })
  await check('health', '/api/manifest is public-only', async () => {
    const { res, body } = await get('/api/manifest')
    assert(res.status === 200, `status ${res.status}`)
    manifest = JSON.parse(body)
    assert(manifest.length > 50, `only ${manifest.length} entries`)
    const leaks = manifest.filter((p) => {
      const m = { ...p, ...(p.metadata ?? {}) }
      return m.draft || m.hidden || m.unlisted || m.password || m.passwordHash
    })
    assert(!leaks.length, `non-public: ${leaks.map((p) => p.slug).join(', ')}`)
    assert(
      !/sourcePath|sourceDir|\/Users\//.test(body),
      'filesystem paths leak'
    )
    return `${manifest.length} entries`
  })

  // Newest real blog post from the manifest, so this test tracks new content.
  const posts = manifest
    .filter((p) => /^\d{4}\//.test(p.slug))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const newest = posts[0]?.slug

  // ── Core pages ────────────────────────────────────────────────────────────
  await page('/')
  await page('/blog', { contains: newest ? [`/blog/${newest}`] : [] })
  if (newest) {
    await page(`/blog/${newest}`, {
      contains: ['h-entry', 'og:title', 'rel="canonical"'],
    })
  }
  await page('/blog/2023/how-i-built-coach-artie', {
    contains: ['Coach Artie'],
  })
  await page('/projects')
  await page('/projects/coach-artie')
  await page('/reading')
  await page('/tag/dataviz')
  for (const p of [
    '/now',
    '/stats',
    '/predictions',
    '/gear',
    '/photos',
    '/calendar',
    '/consulting',
    '/dispatch',
    '/threads',
    '/scraps',
  ]) {
    await page(p)
  }

  // ── Feeds & SEO ───────────────────────────────────────────────────────────
  await check('feeds', '/rss.xml', async () => {
    const { res, body } = await get('/rss.xml')
    assert(res.status === 200, `status ${res.status}`)
    const items = (body.match(/<item>/g) ?? []).length
    assert(items >= 5, `${items} items`)
    if (newest) assert(body.includes(newest), 'newest post missing')
    return `${items} items`
  })
  await check('feeds', '/feed.json', async () => {
    const { body } = await get('/feed.json')
    const f = JSON.parse(body)
    assert(f.items?.length >= 5, `${f.items?.length} items`)
    return `${f.items.length} items`
  })
  await check('feeds', '/sitemap.xml has no drafts', async () => {
    const { res, body } = await get('/sitemap.xml')
    assert(res.status === 200, `status ${res.status}`)
    const urls = (body.match(/<loc>/g) ?? []).length
    assert(urls > 50, `${urls} urls`)
    // Known once-live drafts (data/gone-urls.json PENDING) must not be advertised.
    for (const d of ['2023/hacker-culture', '2022/my-vscode-setup']) {
      assert(!body.includes(`/blog/${d}<`), `advertises draft ${d}`)
    }
    return `${urls} urls`
  })
  await check('feeds', '/robots.txt', async () => {
    const { res, body } = await get('/robots.txt')
    assert(res.status === 200 && /sitemap/i.test(body), 'no sitemap line')
  })
  await check('feeds', '/tags.json', async () => {
    const { body } = await get('/tags.json')
    assert(JSON.parse(body).length > 10, 'too few tags')
  })
  if (newest) {
    await check('feeds', 'markdown + json twins', async () => {
      const md = await get(`/blog/${newest}.md`)
      assert(
        md.res.status === 200 && md.body.length > 200,
        `.md ${md.res.status}`
      )
      const js = await get(`/blog/${newest}.json`)
      assert(js.res.status === 200, `.json ${js.res.status}`)
      JSON.parse(js.body)
    })
  }

  // ── APIs ──────────────────────────────────────────────────────────────────
  await check('api', '/api/stats', async () => {
    const { res, body, ms } = await get('/api/stats')
    assert(res.status === 200, `status ${res.status}`)
    const s = JSON.parse(body)
    assert(Object.keys(s).length > 3, 'empty stats')
    return `${Object.keys(s).length} sources, ${ms}ms`
  })
  await check('api', '/api/stats-lite stays small', async () => {
    const { body } = await get('/api/stats-lite')
    const s = JSON.parse(body)
    assert(body.length < 2000, `${body.length} bytes`)
    assert(
      Object.values(s).every((v) => typeof v !== 'object' || v === null),
      'has nested values'
    )
    return `${body.length} bytes`
  })
  for (const p of ['/api/predictions', '/api/now', '/api/github']) {
    await check('api', p, async () => {
      const { res, body, ms } = await get(p)
      assert(res.status === 200, `status ${res.status}`)
      JSON.parse(body)
      return ms > SLOW_MS ? `SLOW ${ms}ms` : `${ms}ms`
    })
  }

  // ── Redirects ─────────────────────────────────────────────────────────────
  await status('/blog/projects/coach-artie', 301, {
    group: 'redirects',
    location: (l) => l.endsWith('/projects/coach-artie'),
  })
  await status('/blog/how-i-built-coach-artie', 301, {
    group: 'redirects',
    location: (l) => l.includes('/blog/2023/how-i-built-coach-artie'),
  })
  await status('/via/bluesky?to=/blog', 302, {
    group: 'redirects',
    location: (l) => onSite(l) && l.includes('utm_source=bluesky'),
  })
  await status('/from-youtube/abc123?to=/blog', 302, {
    group: 'redirects',
    location: (l) => onSite(l) && l.includes('utm_campaign=abc123'),
  })

  // ── Guardrails: things that must NOT work ─────────────────────────────────
  for (const evil of ['//evil.com', '/..//evil.com', 'https://evil.com']) {
    const q = encodeURIComponent(evil)
    await check('guards', `no open redirect: to=${evil}`, async () => {
      for (const p of [`/via/x?to=${q}`, `/from-youtube/abc?to=${q}`]) {
        const { res } = await get(p)
        const loc = res.headers.get('location') ?? ''
        assert(!loc || onSite(loc), `${p} → ${loc}`)
      }
    })
  }
  await status('/blog/2023/hacker-culture', 404) // drafted: must not serve
  await status('/api/posts/2023/hacker-culture', 404)
  await status('/blog/2022/2022-prototyping-toolkit', 404) // deleted
  await status('/blog/week-notes/anything', 410)
  await status('/this-page-does-not-exist-smoke', 404)
  await check('guards', '/kitchen-sink is noindex', async () => {
    const { res } = await get('/kitchen-sink')
    assert(/noindex/.test(res.headers.get('x-robots-tag') ?? ''), 'indexable')
  })

  // ── Secrets: nothing key-shaped in the HTML or the JS it ships ────────────
  await check('secrets', 'no API keys in HTML or JS bundles', async () => {
    const KEY =
      /sk-or-v1-\w{20,}|sk-ant-[\w-]{20,}|sk-proj-[\w-]{20,}|sk_live_\w{10,}|AKIA[0-9A-Z]{16}|ghp_\w{30,}|xox[bp]-[\w-]{10,}/
    const { body } = await get('/')
    let m = KEY.exec(body)
    assert(!m, `key-shaped string in / HTML: ${m?.[0].slice(0, 10)}…`)
    const config = /runtimeConfig[\s\S]{0,4000}?public[\s\S]{0,2000}/.exec(body)
    if (config) {
      const bad =
        /(api[_-]?key|secret|token|password)"?\s*:\s*"[^"]{12,}/i.exec(
          config[0]
        )
      assert(!bad, `public runtimeConfig has ${bad?.[1]}`)
    }
    // Entry script + every modulepreload'd chunk.
    const scripts = [
      ...new Set(
        [...body.matchAll(/(?:src|href)="(\/_nuxt\/[^"]+\.js)"/g)].map(
          (x) => x[1]
        )
      ),
    ]
    for (const s of scripts) {
      const js = await get(s)
      m = KEY.exec(js.body)
      assert(!m, `key-shaped string in ${s}`)
    }
    return `${scripts.length} bundles scanned`
  })

  if (BROWSER) await browserPass(newest)

  report()
}

// ── Browser pass + report ───────────────────────────────────

/** Headless Chromium: console errors, failed requests, hydration mismatches. */
async function browserPass(newest) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    results.push({
      group: 'browser',
      name: 'playwright',
      ok: false,
      note: 'not installed',
    })
    return
  }
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ colorScheme: 'dark' })
  const paths = [
    '/',
    '/blog',
    newest && `/blog/${newest}`,
    '/projects',
    '/stats',
    '/predictions',
    '/gear',
    '/calendar',
    '/threads',
  ].filter(Boolean)
  // Third-party noise that isn't ours to fix.
  const IGNORE =
    /umami|cloudflareinsights|webmention|favicon|ERR_BLOCKED_BY_CLIENT|cal\.com|googletagmanager/i

  for (const p of paths) {
    await check('browser', p, async () => {
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(`js: ${e.message}`))
      page.on('console', (m) => {
        if (m.type() === 'error' && !IGNORE.test(m.text()))
          errors.push(`console: ${m.text().slice(0, 140)}`)
        if (/hydration/i.test(m.text()))
          errors.push(`hydration: ${m.text().slice(0, 140)}`)
      })
      page.on('response', (r) => {
        const u = r.url()
        if (r.status() >= 400 && u.startsWith(BASE) && !IGNORE.test(u))
          errors.push(`${r.status()} ${u.replace(BASE, '')}`)
      })
      const t0 = performance.now()
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45_000 })
      const ms = Math.round(performance.now() - t0)
      await page.waitForTimeout(500)
      await page.close()
      await sleep(PAUSE_MS)
      assert(!errors.length, [...new Set(errors)].slice(0, 4).join(' | '))
      return ms > 6000 ? `SLOW ${ms}ms to idle` : `${ms}ms to idle`
    })
  }
  await browser.close()
}

function report() {
  let group = ''
  for (const r of results) {
    if (r.group !== group) {
      group = r.group
      console.log(`\n${group}`)
    }
    const mark = r.ok ? (/SLOW/.test(r.note ?? '') ? '⚠' : '✓') : '✗'
    console.log(`  ${mark} ${r.name}${r.note ? `  ${r.note}` : ''}`)
  }
  const failed = results.filter((r) => !r.ok)
  const slow = results.filter((r) => r.ok && /SLOW/.test(r.note ?? ''))
  console.log(
    `\n${results.length - failed.length}/${results.length} passed` +
      (slow.length ? `, ${slow.length} slow` : '')
  )
  process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
  console.error('smoke crashed:', err)
  process.exit(2)
})
