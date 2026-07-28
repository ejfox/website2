/**
 * Cal.com Webhook Endpoint
 * Receives booking events from Cal.com for funnel analytics.
 *
 * Setup in Cal.com:
 * 1. Go to Settings → Developer → Webhooks
 * 2. Add webhook URL: https://ejfox.com/api/webhooks/calcom
 * 3. Select events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
 * 4. Copy the signing secret to CALCOM_WEBHOOK_SECRET env var
 *
 * Persistence (boring on purpose): each event is appended as one JSON line to
 * data/calcom-events.jsonl (relative to the pm2 cwd, so it survives deploys the
 * same way monkeytype's cache does) AND logged to stdout for `pm2 logs website2`.
 * Read the funnel with: `jq . data/calcom-events.jsonl` on the VPS.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface CalcomBookingPayload {
  triggerEvent: string
  createdAt: string
  payload: {
    title: string
    startTime: string
    endTime: string
    attendees: Array<{
      email: string
      name: string
      timeZone: string
    }>
    organizer: {
      email: string
      name: string
    }
    responses?: Record<string, { value: string }>
    metadata?: Record<string, unknown>
  }
}

const EVENTS_FILE = join(process.cwd(), 'data', 'calcom-events.jsonl')

type VerifyResult = 'valid' | 'mismatch' | 'no-signature' | 'no-secret'

// Cal.com signs the raw request body with HMAC-SHA256 and sends it in this
// header. `no-secret` means the endpoint is fail-OPEN (dev/misconfig) — the
// caller must log loudly, since it accepts unverified payloads.
function verifySignature(
  rawBody: string,
  signature: string | undefined
): VerifyResult {
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) return 'no-secret'
  if (!signature) return 'no-signature'
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b) ? 'valid' : 'mismatch'
}

export default defineEventHandler(async (event) => {
  // Read the raw body first — signature verification needs the exact bytes.
  const rawBody = (await readRawBody(event)) || ''
  const signature = getHeader(event, 'x-cal-signature-256')

  // Best-effort client identity for security logging (behind Cloudflare tunnel).
  const clientIp =
    getHeader(event, 'cf-connecting-ip') ||
    getHeader(event, 'x-forwarded-for') ||
    event.node.req.socket?.remoteAddress ||
    'unknown'

  const verdict = verifySignature(rawBody, signature)

  if (verdict === 'no-secret') {
    // Fail-open: the scary path. Log every accepted-unverified request so it's
    // visible in `pm2 logs website2` and alertable — set CALCOM_WEBHOOK_SECRET.
    console.error(
      `[Cal.com Webhook] SECURITY: CALCOM_WEBHOOK_SECRET not set — accepting UNVERIFIED webhook from ${clientIp} (bytes=${rawBody.length})`
    )
  } else if (verdict !== 'valid') {
    // Rejected: surface bad/missing signatures so spoof attempts are observable.
    console.warn(
      `[Cal.com Webhook] Rejected ${verdict} signature from ${clientIp} (bytes=${rawBody.length})`
    )
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  let body: CalcomBookingPayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Malformed JSON' })
  }

  const responses = body.payload?.responses || {}
  const metadata = body.payload?.metadata || {}

  // One flat, greppable record per event. Attribution comes from the frontend
  // (see the Cal.com embed) via booking metadata.
  const record = {
    receivedAt: new Date().toISOString(),
    event: body.triggerEvent,
    createdAt: body.createdAt,
    title: body.payload?.title,
    startTime: body.payload?.startTime,
    attendee: body.payload?.attendees?.[0]?.email,
    // Booking-question responses
    projectDescription: responses['what-is-the-project']?.value,
    timeline: responses['timeline']?.value,
    budget: responses['budget-range']?.value,
    source: responses['how-did-you-find-me']?.value,
    // Attribution metadata
    first_source: metadata.first_source as string | undefined,
    first_channel: metadata.first_channel as string | undefined,
    last_source: metadata.last_source as string | undefined,
    landing_page: metadata.landing_page as string | undefined,
    referrer: metadata.referrer as string | undefined,
    cancellationReason:
      (metadata.cancellationReason as string | undefined) || undefined,
  }

  console.info('[Funnel]', record)

  // Durable append. Never let a write failure 500 the webhook — Cal.com would
  // just retry, and the stdout log above already captured the event.
  try {
    await mkdir(dirname(EVENTS_FILE), { recursive: true })
    await appendFile(EVENTS_FILE, JSON.stringify(record) + '\n')
  } catch (err) {
    console.error('[Cal.com Webhook] failed to persist event:', err)
  }

  return { received: true, event: body.triggerEvent }
})
