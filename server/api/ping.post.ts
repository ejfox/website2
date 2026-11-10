/**
 * POST /api/ping: anyone can send EJ a short push notification (Pushcut).
 *
 * Body: { message, from?, website (honeypot), elapsed_ms }
 * The Pushcut webhook URL lives ONLY in the server env (PUSHCUT_PING_URL in the
 * VPS .env). Never put it in runtimeConfig.public. Unset means pings are off (503).
 * Limits: server/utils/pingLimit.ts. Visitors are keyed by a daily-salted IP
 * hash; the IP itself is never stored or sent anywhere.
 */
import { createHash } from 'node:crypto'
import { createPingLimiter } from '../utils/pingLimit'

const limiter = createPingLimiter()
const MAX_MESSAGE = 200
const MAX_FROM = 60
const MIN_FILL_MS = 2000

const clean = (v: unknown, max: number) =>
  [...String(v ?? '')]
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

function visitorKey(ip: string) {
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256')
    .update(`ping:${day}:${ip}`)
    .digest('hex')
    .slice(0, 24)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }

  // Bots: fill the hidden field or post faster than a person types. Pretend it worked.
  if (body.website || !(Number(body.elapsed_ms) >= MIN_FILL_MS))
    return { ok: true }

  const message = clean(body.message, MAX_MESSAGE)
  const from = clean(body.from, MAX_FROM)
  if (!message)
    throw createError({
      statusCode: 400,
      statusMessage: 'Write a message first',
    })

  const url = process.env.PUSHCUT_PING_URL
  if (!url || !url.startsWith('https://api.pushcut.io/')) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Pings are off right now',
    })
  }

  const ip =
    getRequestHeader(event, 'cf-connecting-ip') ||
    getRequestIP(event, { xForwardedFor: true }) ||
    'unknown'
  const visitor = visitorKey(ip)
  const verdict = limiter.check(visitor)
  if (!verdict.ok) {
    setResponseHeader(event, 'Retry-After', verdict.retryAfterSec)
    const mins = Math.max(1, Math.ceil(verdict.retryAfterSec / 60))
    throw createError({
      statusCode: 429,
      statusMessage:
        verdict.scope === 'global'
          ? `Lots of pings right now. Try again in about ${mins} min`
          : `You just sent one. Try again in about ${mins} min`,
    })
  }

  try {
    await $fetch(url, {
      method: 'POST',
      body: {
        title: from ? `Ping from ${from}` : 'Ping from ejfox.com',
        text: message,
      },
      timeout: 8000,
    })
  } catch (e) {
    console.error('[ping] pushcut failed', (e as Error).message)
    throw createError({
      statusCode: 502,
      statusMessage: "That didn't go through. Try again later",
    })
  }

  limiter.record(visitor)
  console.info(`[ping] sent (${message.length} chars${from ? ', named' : ''})`)
  return { ok: true }
})
