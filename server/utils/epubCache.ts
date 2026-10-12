/**
 * @file epubCache.ts
 * @description Stale-while-revalidate for the generated EPUBs.
 *
 * A cold /archive.epub build fetches and screens ~200 images. Node has no
 * response timeout here, but Cloudflare's origin read timeout (~100 s) does —
 * a slow cold build would surface as a 524. So:
 *
 * - The finished book is kept in memory AND written to disk
 *   (`.cache/epub-halftone/books/`), so a pm2 reload serves instantly.
 * - Past its TTL, the previous book is served (`X-Epub-Cache: stale`) while a
 *   rebuild runs in the background.
 * - Only with nothing at all to serve does a request wait, and then for at
 *   most WAIT_MS before answering 503 + Retry-After; the build keeps going.
 * - One build in flight per book, however many requests arrive.
 *
 * Per-image results are cached on disk too (halftone.ts), so after the first
 * cold build a rebuild is mostly reading small PNGs back.
 */
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { createError, setHeaders, setResponseStatus, type H3Event } from 'h3'
import { halftoneCacheDir } from './halftone'

const WAIT_MS = 60_000

export interface BuiltBook {
  data: Buffer
  /** Extra response headers describing the build (counts etc). */
  meta: Record<string, string>
}

interface Entry extends BuiltBook {
  builtAt: number
}

const books = new Map<string, Entry>()
const inflight = new Map<string, Promise<Entry>>()

const diskPath = (name: string) =>
  join(halftoneCacheDir(), 'books', `${name}.epub`)

function rebuild(
  name: string,
  build: () => Promise<BuiltBook>
): Promise<Entry> {
  let p = inflight.get(name)
  if (p) return p
  const started = Date.now()
  p = build()
    .then(async (b) => {
      const entry = { ...b, builtAt: Date.now() }
      books.set(name, entry)
      console.info(
        `[epub] built ${name}: ${b.data.length} bytes in ${Date.now() - started} ms`
      )
      try {
        await fs.mkdir(join(halftoneCacheDir(), 'books'), { recursive: true })
        await fs.writeFile(diskPath(name), b.data)
        await fs.writeFile(`${diskPath(name)}.json`, JSON.stringify(b.meta))
      } catch {
        // Disk copy is an optimisation; the in-memory book still serves.
      }
      return entry
    })
    .finally(() => inflight.delete(name))
  inflight.set(name, p)
  return p
}

async function fromDisk(name: string): Promise<Entry | null> {
  try {
    const [data, st] = await Promise.all([
      fs.readFile(diskPath(name)),
      fs.stat(diskPath(name)),
    ])
    let meta: Record<string, string> = {}
    try {
      meta = JSON.parse(await fs.readFile(`${diskPath(name)}.json`, 'utf8'))
    } catch {
      // Headers are cosmetic; serve the book without them.
    }
    return { data, meta, builtAt: st.mtimeMs }
  } catch {
    return null
  }
}

export async function serveBook(
  event: H3Event,
  opts: {
    name: string
    ttlSeconds: number
    filename: string
    build: () => Promise<BuiltBook>
  }
): Promise<Buffer | string> {
  const { name, ttlSeconds, filename, build } = opts
  let entry = books.get(name) || null
  if (!entry) {
    entry = await fromDisk(name)
    if (entry) books.set(name, entry)
  }

  let state = 'hit'
  if (!entry) {
    state = 'miss'
    const p = rebuild(name, build)
    const timer = new Promise<null>((r) =>
      setTimeout(() => r(null), WAIT_MS).unref?.()
    )
    entry = await Promise.race([p, timer]).catch((err) => {
      console.error(`[epub] ${name} build failed:`, err?.message || err)
      throw createError({
        statusCode: 503,
        message: `Could not build ${filename}`,
      })
    })
    if (!entry) {
      // Still building: don't hold the connection past Cloudflare's timeout.
      p.catch(() => {})
      setHeaders(event, {
        'Retry-After': '60',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      })
      setResponseStatus(event, 503)
      return `Building ${filename} — try again in a minute.\n`
    }
  } else if (Date.now() - entry.builtAt > ttlSeconds * 1000) {
    state = 'stale'
    rebuild(name, build).catch((err) =>
      console.error(
        `[epub] ${name} background rebuild failed:`,
        err?.message || err
      )
    )
  }

  setHeaders(event, {
    'Content-Type': 'application/epub+zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': `public, max-age=${ttlSeconds}`,
    'X-Epub-Cache': state,
    ...entry.meta,
  })
  return entry.data
}
