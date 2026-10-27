/**
 * @file publicFetch.ts
 * @description GET a page by URL for server-side scraping, restricted to
 *   http(s) on public internet hosts. Used by server/api/og.get.ts.
 *   The address check runs inside the socket's DNS lookup, so the address that
 *   is checked is the address that is connected to. IP-literal hosts skip DNS
 *   and are checked up front. Redirects are followed by hand (max 3) and each
 *   hop is checked the same way. Ranges: isPublicAddress(), tested in
 *   server/utils/__tests__/publicFetch.test.ts.
 */
import { BlockList, isIP } from 'node:net'
import { lookup, type LookupAddress, type LookupOptions } from 'node:dns'
import http from 'node:http'
import https from 'node:https'

// ── Address ranges ──────────────────────────────────────────
// Everything that isn't the public internet: this-network, private, CGNAT,
// loopback, link-local, IETF/benchmark/doc ranges, multicast and reserved.
const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

// v6 forms that embed or translate to a v4 address (NAT64, 6to4, Teredo) are
// refused outright. IPv4-mapped (::ffff:a.b.c.d) is matched against the v4
// rules by BlockList itself.
const BLOCKED_V6: Array<[string, number]> = [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
]

const blocked = new BlockList()
for (const [net, prefix] of BLOCKED_V4) blocked.addSubnet(net, prefix, 'ipv4')
for (const [net, prefix] of BLOCKED_V6) blocked.addSubnet(net, prefix, 'ipv6')

/** True only for a syntactically valid IP on the public internet. */
export function isPublicAddress(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, '')
  const family = isIP(bare)
  if (family === 0) return false
  return !blocked.check(bare, family === 6 ? 'ipv6' : 'ipv4')
}

export class NonPublicHostError extends Error {
  code = 'ENOTPUBLIC'
  constructor(host: string) {
    super(`Refusing non-public host: ${host}`)
  }
}

// ── Lookup + request ────────────────────────────────────────
type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number
) => void

/** dns.lookup that fails unless EVERY address the name resolves to is public. */
function publicLookup(
  hostname: string,
  options: LookupOptions,
  callback: LookupCallback
): void {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '')
    if (
      !addresses.length ||
      addresses.some((a) => !isPublicAddress(a.address))
    ) {
      return callback(new NonPublicHostError(hostname), '')
    }
    if (options.all) return callback(null, addresses)
    callback(null, addresses[0]!.address, addresses[0]!.family)
  })
}

/** Throws unless the URL is http(s) and any IP-literal host is public. */
export function assertFetchableUrl(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new NonPublicHostError(url.protocol)
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host) && !isPublicAddress(host)) {
    throw new NonPublicHostError(host)
  }
}

interface RawResponse {
  status: number
  location?: string
  body: string
}

function requestOnce(
  url: URL,
  headers: Record<string, string>,
  signal: AbortSignal,
  maxBytes: number
): Promise<RawResponse> {
  const transport = url.protocol === 'https:' ? https : http
  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      { method: 'GET', headers, lookup: publicLookup, signal },
      (res) => {
        const status = res.statusCode || 0
        const location = res.headers.location
        if (status >= 300 && status < 400 && location) {
          res.resume()
          return resolve({ status, location, body: '' })
        }
        const chunks: Buffer[] = []
        let size = 0
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
          size += chunk.length
          // Meta tags live in <head>; the rest of a large page isn't needed.
          if (size >= maxBytes) res.destroy()
        })
        const done = () =>
          resolve({
            status,
            body: Buffer.concat(chunks).subarray(0, maxBytes).toString('utf8'),
          })
        res.on('end', done)
        res.on('close', done)
        res.on('error', reject)
      }
    )
    req.on('error', reject)
    req.end()
  })
}

/**
 * GET `input` and return its body as text, following up to `maxRedirects`
 * redirects. Every hop must be http(s) to a public host. `timeoutMs` bounds
 * the whole exchange, redirects and body included.
 */
export async function fetchPublicText(
  input: string | URL,
  {
    headers = {},
    timeoutMs = 10000,
    maxBytes = 1024 * 1024,
    maxRedirects = 3,
  }: {
    headers?: Record<string, string>
    timeoutMs?: number
    maxBytes?: number
    maxRedirects?: number
  } = {}
): Promise<{ url: URL; status: number; body: string }> {
  const signal = AbortSignal.timeout(timeoutMs)
  let url = new URL(input)
  for (let hop = 0; hop <= maxRedirects; hop++) {
    assertFetchableUrl(url)
    const res = await requestOnce(url, headers, signal, maxBytes)
    if (!res.location) return { url, status: res.status, body: res.body }
    url = new URL(res.location, url)
  }
  throw new Error(`More than ${maxRedirects} redirects`)
}
