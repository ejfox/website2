/**
 * @file halftone.ts
 * @description 1-bit line-halftone images for the EPUBs (/archive.epub,
 *   /photos.epub). Every image in both books is embedded as a true 1-bit PNG
 *   screened with EJ's "halftone line 15deg p5" from his dither toolkit
 *   (~/code/blender-math/dither/core.py, `_halftone` + `_screen` + `rank01`).
 *
 * ## Why halftone
 *
 * Offline books need their images embedded, and full JPEGs made /photos.epub
 * 13 MB for 50 frames. A 1-bit line screen at 800 px is a few tens of KB per
 * image, renders identically on every e-ink panel (no greyscale ramp to get
 * wrong), and is the look EJ chose.
 *
 * ## The screen (a port of the Python, not a reinterpretation)
 *
 *     u = (x cos a + y sin a) / period          a = 15deg, period = 5 px
 *     s = cos(2 pi u)                            "line" spot function
 *     threshold = 1 - rank01(s)                  rank-equalised: coverage = tone
 *     pixel is white  iff  g > threshold         g = grey in [0,1], 1 = white
 *
 * `rank01` is the exact branch: a stable argsort (ties broken by pixel index),
 * rank r -> (r + 0.5) / n. The Python switches to a 4096-quantile LUT above
 * 2^18 pixels for speed; we keep the exact sort because the packed-key trick in
 * `rank01` makes it cheap (one native Float64Array sort, no comparator).
 *
 * ## Tone prep
 *
 * dither() defaults: gamma 1, no linearisation, so g is sRGB luma as-is. One
 * addition, deliberately mild: an auto-level that stretches the 1st..99th
 * percentile to 0..1, but never clips more than LEVEL_MAX_CLIP of the range
 * at either end, and skips images whose spread is already near-full or so
 * narrow that stretching would invent contrast. Screenshots with a grey UI
 * chrome get a slightly whiter page; photos barely change.
 *
 * Self-contained on purpose (no `~/` imports, no Nuxt auto-imports) so it runs
 * under vitest and plain `node` scripts as well as Nitro.
 */
import zlib from 'node:zlib'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const HALFTONE = {
  angle: 15,
  period: 5,
  shape: 'line',
  width: 800,
  /** Memory guard only: a 800x2400 RGBA canvas is ~7.7 MB. */
  maxHeight: 2400,
} as const

/** Never clip more than this fraction of the tonal range at either end. */
const LEVEL_MAX_CLIP = 0.1
/** Bump to invalidate the disk cache when the algorithm changes. */
const ALGO_VERSION = 'ht1'
const ALGO_KEY = `${ALGO_VERSION}:line:${HALFTONE.angle}:${HALFTONE.period}:w${HALFTONE.width}:h${HALFTONE.maxHeight}:lvl${LEVEL_MAX_CLIP}`

/**
 * Cloudinary transform: resized + greyscale + JPEG at the CDN, so the server
 * never holds a full-resolution original. `c_limit` never upscales, so small
 * sources keep their own width. f_jpg (not f_auto) also flattens GIF/PNG/SVG.
 */
const CLOUDINARY_TRANSFORM = `c_limit,w_${HALFTONE.width},h_${HALFTONE.maxHeight},e_grayscale,f_jpg,q_90`

/**
 * Swap whatever transform a Cloudinary URL carries for `transform`. Existing
 * transforms are stripped, so ours isn't applied on top of a smaller one
 * (which would upscale a downscale — softer AND heavier). Non-Cloudinary URLs
 * come back unchanged.
 */
export function cloudinaryTransform(url: string, transform: string): string {
  const marker = '/image/upload/'
  const at = url.indexOf(marker)
  if (at === -1) return url
  const head = url.slice(0, at + marker.length)
  const segs = url.slice(at + marker.length).split('/')
  const isTransform = (s: string) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return `${head}${transform}/${segs.slice(i).join('/')}`
}

// ------------------------------------------------------------------ screen

/**
 * Rank-normalise to (0,1): stable argsort, rank r -> (r + 0.5) / n.
 *
 * The argsort packs each value's order-preserving float32 bits (32 bits) with
 * its index (21 bits) into one exactly-representable float64, so a plain
 * native numeric sort IS a stable argsort — ~10x faster than sorting an index
 * array with a comparator. Falls back to the comparator above 2^21 pixels.
 */
export function rank01(a: Float32Array): Float32Array {
  const n = a.length
  const out = new Float32Array(n)
  const IDX_BITS = 2 ** 21
  if (n <= IDX_BITS) {
    const bits = new Uint32Array(a.buffer, a.byteOffset, n)
    const keys = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const b = bits[i]
      // IEEE754 -> unsigned order: negatives flip all bits, positives flip sign.
      const ord = b & 0x80000000 ? ~b >>> 0 : (b | 0x80000000) >>> 0
      keys[i] = ord * IDX_BITS + i
    }
    keys.sort()
    for (let r = 0; r < n; r++) out[keys[r] % IDX_BITS] = (r + 0.5) / n
    return out
  }
  const idx = new Uint32Array(n)
  for (let i = 0; i < n; i++) idx[i] = i
  idx.sort((p, q) => a[p] - a[q] || p - q)
  for (let r = 0; r < n; r++) out[idx[r]] = (r + 0.5) / n
  return out
}

const SCREENS = new Map<string, Float32Array>()

/** Threshold map for the line screen, cached per (w, h) like `_SCREENS`. */
export function lineScreen(
  w: number,
  h: number,
  angle: number = HALFTONE.angle,
  period: number = HALFTONE.period
): Float32Array {
  const key = `${w}x${h}:${angle}:${period}`
  const hit = SCREENS.get(key)
  if (hit) return hit
  const a = (angle * Math.PI) / 180
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const s = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x * ca + y * sa) / period
      s[y * w + x] = Math.cos(2 * Math.PI * u)
    }
  }
  const r = rank01(s)
  for (let i = 0; i < r.length; i++) r[i] = 1 - r[i]
  if (SCREENS.size >= 8) SCREENS.delete(SCREENS.keys().next().value!)
  SCREENS.set(key, r)
  return r
}

/** g (0..1, 1 = white) -> 1 bit per pixel, 1 = white. */
export function halftone(g: Float32Array, w: number, h: number): Uint8Array {
  const t = lineScreen(w, h)
  const out = new Uint8Array(w * h)
  for (let i = 0; i < out.length; i++) out[i] = g[i] > t[i] ? 1 : 0
  return out
}

/**
 * Mild 1st..99th percentile stretch (see file header). In place.
 * Returns the [lo, hi] actually used, for tests and debugging.
 */
export function autoLevel(g: Float32Array): [number, number] {
  const hist = new Uint32Array(256)
  for (let i = 0; i < g.length; i++)
    hist[Math.min(255, Math.max(0, Math.round(g[i] * 255)))]++
  const pct = (p: number) => {
    const target = p * g.length
    let acc = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[v]
      if (acc >= target) return v / 255
    }
    return 1
  }
  const lo = Math.min(pct(0.01), LEVEL_MAX_CLIP)
  const hi = Math.max(pct(0.99), 1 - LEVEL_MAX_CLIP)
  // Already near full-range (a <5% stretch is noise), or a near-flat image
  // (stretching would invent texture): leave it.
  if (hi - lo > 0.95 || hi - lo < 0.25) return [0, 1]
  const k = 1 / (hi - lo)
  for (let i = 0; i < g.length; i++) {
    const v = (g[i] - lo) * k
    g[i] = v < 0 ? 0 : v > 1 ? 1 : v
  }
  return [lo, hi]
}

// ------------------------------------------------------------------ PNG

let CRC_TABLE: Uint32Array | null = null
function crc32(buf: Buffer): number {
  const native = (zlib as unknown as { crc32?: (b: Buffer) => number }).crc32
  if (typeof native === 'function') return native(buf) >>> 0
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      CRC_TABLE[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

/**
 * True 1-bit greyscale PNG (bit depth 1, colour type 0): 0 = black, 1 = white,
 * rows MSB-first, filter byte 0 per row.
 */
export function encodePng1(bits: Uint8Array, w: number, h: number): Buffer {
  const rowBytes = (w + 7) >> 3
  const raw = Buffer.alloc((rowBytes + 1) * h)
  for (let y = 0; y < h; y++) {
    const o = y * (rowBytes + 1) + 1 // byte 0 of each row = filter type 0
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (bits[row + x]) raw[o + (x >> 3)] |= 0x80 >> (x & 7)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 1 // bit depth
  ihdr[9] = 0 // colour type: greyscale
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter method
  ihdr[12] = 0 // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ------------------------------------------------------------------ fetch + cache

const CACHE_DIR =
  process.env.EPUB_HALFTONE_CACHE ||
  join(process.cwd(), '.cache', 'epub-halftone')
/** A failed image is retried after this long, not on every rebuild. */
const FAIL_TTL_MS = 24 * 3600 * 1000

export const halftoneCacheDir = () => CACHE_DIR

export function halftoneKey(src: string): string {
  return createHash('sha1').update(`${src}\n${ALGO_KEY}`).digest('hex')
}

type CanvasMod = typeof import('@napi-rs/canvas')
let canvasMod: Promise<CanvasMod | null> | null = null
/** Lazy + guarded: a missing native binary drops images, it doesn't 500 the book. */
function loadCanvas(): Promise<CanvasMod | null> {
  canvasMod ??= import('@napi-rs/canvas').catch((err) => {
    console.error(
      '[halftone] @napi-rs/canvas unavailable:',
      err?.message || err
    )
    return null
  })
  return canvasMod
}

async function render(src: string): Promise<Buffer | null> {
  const canvas = await loadCanvas()
  if (!canvas) return null
  const url = cloudinaryTransform(src, CLOUDINARY_TRANSFORM)
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const img = await canvas.loadImage(bytes)
  // Cloudinary already sized it; this is for other hosts (and is a no-op scale
  // for Cloudinary). Never upscale.
  const scale = Math.min(
    1,
    HALFTONE.width / img.width,
    HALFTONE.maxHeight / img.height
  )
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const c = canvas.createCanvas(w, h)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff' // transparent pixels read as paper, not ink
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const px = ctx.getImageData(0, 0, w, h).data
  const g = new Float32Array(w * h)
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = (0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2]) / 255
  }
  autoLevel(g)
  return encodePng1(halftone(g, w, h), w, h)
}

/**
 * Halftone one image URL -> 1-bit PNG bytes, or null if it can't be fetched
 * or decoded. Disk-cached by sha1(src + algorithm params); failures are
 * remembered for FAIL_TTL_MS so a dead link doesn't cost a fetch per rebuild.
 */
export async function halftoneImage(src: string): Promise<Buffer | null> {
  const key = halftoneKey(src)
  const png = join(CACHE_DIR, `${key}.png`)
  const fail = join(CACHE_DIR, `${key}.fail`)
  try {
    return await fs.readFile(png)
  } catch {
    // not cached yet
  }
  try {
    const st = await fs.stat(fail)
    if (Date.now() - st.mtimeMs < FAIL_TTL_MS) return null
  } catch {
    // no recent failure recorded
  }

  let out: Buffer | null = null
  try {
    out = await render(src)
  } catch (err) {
    console.warn(`[halftone] ${src}: ${(err as Error)?.message || err}`)
  }
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    if (out) await fs.writeFile(png, out)
    else await fs.writeFile(fail, '')
  } catch {
    // read-only or full disk: the in-memory book cache still works
  }
  // Yield between images: screening is synchronous CPU work on the request
  // process, so give queued requests a turn.
  await new Promise((r) => setImmediate(r))
  return out
}

/** Map with at most `limit` in flight, results in input order. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = Array.from({ length: items.length })
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return out
}
