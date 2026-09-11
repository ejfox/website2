/**
 * @file posts/unlock.post.ts
 * @description Exchanges a password for the body of a password-protected post.
 * @endpoint POST /api/posts/unlock
 * @params body: { slug: string, password: string }
 * @returns { html, toc, metadata } on success; 401 on a wrong password.
 *
 * The content of a protected post never leaves the server until a correct
 * password arrives here. GET /api/posts/{slug} returns only a locked stub, so
 * this is the single path to the body.
 */
import { defineEventHandler, createError, readBody, getHeader } from 'h3'
import { readFile } from 'node:fs/promises'
import { createHash, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import NodeCache from 'node-cache'
import { getPasswordHash, isPrivateContent } from './[...slug]'

/**
 * True while a post is still embargoed by a `publishAt` (or a future `date`).
 *
 * Deliberately local rather than imported: this endpoint must hold the embargo
 * on its own. It reads the processed JSON directly, so it is a SECOND path to
 * the body that does not pass through GET /api/posts/{slug}'s guards — without
 * this, a post that is both scheduled and password-protected would 404 on GET
 * but hand over its full text here to anyone with the password, before the
 * publish date. (The scheduled-posts branch adds an `isScheduled` helper with
 * the same semantics; these can be unified once both have landed.)
 */
function isEmbargoed(data: Record<string, unknown>): boolean {
  const meta = (data.metadata ?? {}) as Record<string, unknown>
  const when =
    data.publishAt ?? meta.publishAt ?? data.date ?? meta.date ?? null
  if (typeof when !== 'string' && !(when instanceof Date)) return false
  const t = new Date(when).getTime()
  return Number.isFinite(t) && t > Date.now()
}

// Guessing is the only attack left once the hash stays server-side, so make it
// slow. node-cache's TTL both expires the window and evicts the key, so the
// counter needs no sweeping. In-memory is the right scope: the site is a single
// Node process under pm2, and a restart clearing counters is an acceptable trade.
const MAX_ATTEMPTS = 10
const WINDOW_SECONDS = 10 * 60
// maxKeys bounds memory: the key is derived from the caller's address, and an
// attacker with an IPv6 allocation controls a lot of those.
const attempts = new NodeCache({
  stdTTL: WINDOW_SECONDS,
  checkperiod: 120,
  maxKeys: 10_000,
})

/**
 * Rate-limit key for a caller.
 *
 * IPv6 is collapsed to its /64 prefix: a $5 VPS ships a whole /64, so keying on
 * the full address would hand an attacker 2^64 free buckets. IPv4 is used whole.
 */
function rateLimitKey(ip: string): string {
  if (!ip.includes(':')) return ip
  const hextets = ip.split('%')[0].split(':')
  return hextets.slice(0, 4).join(':') + '::/64'
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

/** Constant-time hex comparison, so timing can't leak the hash. */
function hashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return timingSafeEqual(bufA, bufB)
}

function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim() === '') return false
  if (slug.includes('|') || slug.includes('..')) return false
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(slug)) return false
  return /^[\p{L}\p{N}_\-/ .,'’&()]+$/u.test(slug)
}

export default defineEventHandler(async (event) => {
  // Deliberately NOT h3's getRequestIP: it returns event.context.clientAddress
  // first, which Nitro derives from X-Forwarded-For — a client-supplied header.
  // An attacker rotating a fake XFF per request would get a fresh bucket each
  // time and thus unlimited guesses, defeating the whole limiter.
  //
  // CF-Connecting-IP is written by Cloudflare (we sit behind a Cloudflare
  // Tunnel) and cannot be set by the client. Otherwise fall back to the raw
  // socket address. If neither identifies a caller, everyone shares one
  // bucket — strict rather than open, which is the right way to fail here.
  const ip = rateLimitKey(
    getHeader(event, 'cf-connecting-ip') ||
      event.node.req.socket.remoteAddress ||
      'unknown'
  )
  const tries = (attempts.get<number>(ip) ?? 0) + 1
  // Fixed window, not sliding: re-setting the TTL on every request meant a
  // throttled client's own retries pushed their expiry out forever, so anyone
  // sharing a NAT with a noisy neighbour could never wait out the block.
  const remaining = attempts.getTtl(ip)
  const ttl =
    remaining && remaining > Date.now()
      ? Math.ceil((remaining - Date.now()) / 1000)
      : WINDOW_SECONDS
  try {
    attempts.set(ip, tries, ttl)
  } catch {
    // maxKeys reached — fail closed rather than stop counting.
    throw createError({
      statusCode: 429,
      message: 'Too many attempts. Try again later.',
    })
  }
  if (tries > MAX_ATTEMPTS) {
    const expiresAt = attempts.getTtl(ip) || Date.now()
    const retryAfter = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000))
    event.node.res.setHeader('Retry-After', String(retryAfter))
    throw createError({
      statusCode: 429,
      message: 'Too many attempts. Try again later.',
    })
  }

  const body = await readBody<{ slug?: string; password?: string }>(event)
  const slug = typeof body?.slug === 'string' ? body.slug : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!slug || !password || !isValidSlug(slug)) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  let data: Record<string, unknown>
  try {
    const filePath = path.join(
      process.cwd(),
      'content/processed',
      `${slug}.json`
    )
    data = JSON.parse(await readFile(filePath, 'utf-8'))
  } catch {
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  // Check before the hash lookup so the 404 doesn't disclose which guard fired.
  // Dev still previews, matching GET /api/posts/{slug}.
  if (!import.meta.dev && (isPrivateContent(data) || isEmbargoed(data))) {
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  const storedHash = getPasswordHash(data)
  if (!storedHash) {
    // Not a protected post — nothing to unlock. Don't confirm it exists.
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  if (!hashesMatch(hashPassword(password), storedHash)) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  // Deliberately do NOT clear the bucket on success. Clearing it let anyone
  // holding one valid password — i.e. anyone a post was legitimately shared
  // with — loop "9 wrong guesses at post B, one correct unlock of post A" for
  // unlimited guessing. Ten wrong attempts costing you a wait is the intended
  // behaviour, not a bug.

  const meta = (data.metadata ?? {}) as Record<string, unknown>
  const { passwordHash: _omit, ...safeMetadata } = meta
  return {
    html: data.html ?? data.content ?? '',
    toc: data.toc ?? meta.toc ?? [],
    metadata: safeMetadata,
  }
})
