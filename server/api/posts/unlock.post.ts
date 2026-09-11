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
import { defineEventHandler, createError, readBody, getRequestIP } from 'h3'
import { readFile } from 'node:fs/promises'
import { createHash, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import NodeCache from 'node-cache'
import { getPasswordHash } from './[...slug]'

// Guessing is the only attack left once the hash stays server-side, so make it
// slow. node-cache's TTL both expires the window and evicts the key, so the
// counter needs no sweeping. In-memory is the right scope: the site is a single
// Node process under pm2, and a restart clearing counters is an acceptable trade.
const MAX_ATTEMPTS = 10
const WINDOW_SECONDS = 10 * 60
const attempts = new NodeCache({ stdTTL: WINDOW_SECONDS, checkperiod: 120 })

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
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const tries = (attempts.get<number>(ip) ?? 0) + 1
  attempts.set(ip, tries)
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

  const storedHash = getPasswordHash(data)
  if (!storedHash) {
    // Not a protected post — nothing to unlock. Don't confirm it exists.
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  if (!hashesMatch(hashPassword(password), storedHash)) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  // Correct password — hand over the body. Clear the bucket so a legitimate
  // reader who fumbled a few times isn't left throttled.
  attempts.del(ip)

  const meta = (data.metadata ?? {}) as Record<string, unknown>
  const { passwordHash: _omit, ...safeMetadata } = meta
  return {
    html: data.html ?? data.content ?? '',
    toc: data.toc ?? meta.toc ?? [],
    metadata: safeMetadata,
  }
})
