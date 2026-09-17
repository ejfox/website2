import { describe, it, expect } from 'vitest'
import {
  SEAL_VERSION,
  generateSealKey,
  sealPost,
  unsealPost,
  isSealedPost,
  isSealedSlug,
  capabilityLink,
  fromBase64Url,
  toBase64Url,
} from '../postSeal.mjs'

const payload = {
  title: 'Why I am leaving Acme Corp',
  html: '<p>The whole story.</p>',
  toc: [{ level: 2, text: 'The meeting', id: 'the-meeting' }],
  tags: ['acme'],
}

describe('seal round trip', () => {
  it('opens with the right key', async () => {
    const key = generateSealKey()
    const env = await sealPost(payload, key, 'private/foo')
    const { payload: out, reason } = await unsealPost(env, key, 'private/foo')
    expect(reason).toBe(null)
    expect(out).toEqual(payload)
  })

  it('refuses a different key', async () => {
    const env = await sealPost(payload, generateSealKey(), 'private/foo')
    const { payload: out, reason } = await unsealPost(
      env,
      generateSealKey(),
      'private/foo'
    )
    expect(out).toBe(null)
    expect(reason).toBe('auth-failed')
  })

  it('refuses an envelope moved to another post — the slug is bound as AAD', async () => {
    // Without this, anyone who could land a change to the tracked JSON could
    // swap one post's envelope into a file whose key they already hold.
    const key = generateSealKey()
    const env = await sealPost(payload, key, 'private/foo')
    const { payload: out } = await unsealPost(env, key, 'private/bar')
    expect(out).toBe(null)
  })

  it('refuses a tampered version — the header is bound too', async () => {
    const key = generateSealKey()
    const env = await sealPost(payload, key, 'private/foo')
    const { reason } = await unsealPost({ ...env, v: 99 }, key, 'private/foo')
    expect(reason).toBe('unknown-version')
  })

  it('refuses tampered ciphertext', async () => {
    const key = generateSealKey()
    const env = await sealPost(payload, key, 'private/foo')
    // Flip a bit in a decoded BYTE rather than editing the base64 text. The
    // trailing base64url character encodes fewer than 6 significant bits, so
    // changing it can decode to the identical byte string — which made an
    // earlier version of this test pass or fail depending on the random IV.
    const bytes = fromBase64Url(env.ct)
    bytes[Math.floor(bytes.length / 2)] ^= 0xff
    const { payload: out } = await unsealPost(
      { ...env, ct: toBase64Url(bytes) },
      key,
      'private/foo'
    )
    expect(out).toBe(null)
  })

  it('uses a fresh IV every time, so identical posts do not collide', async () => {
    const key = generateSealKey()
    const a = await sealPost(payload, key, 'private/foo')
    const b = await sealPost(payload, key, 'private/foo')
    expect(a.iv).not.toBe(b.iv)
    expect(a.ct).not.toBe(b.ct)
  })

  it('rejects a key that is not 32 bytes rather than silently padding it', async () => {
    await expect(sealPost(payload, 'c2hvcnQ', 'private/foo')).rejects.toThrow(
      /32 bytes/
    )
  })

  it('emits an envelope carrying no plaintext at all', async () => {
    const key = generateSealKey()
    const env = await sealPost(payload, key, 'private/foo')
    const serialised = JSON.stringify(env)
    expect(serialised).not.toContain('Acme')
    expect(serialised).not.toContain('The meeting')
    expect(serialised).not.toContain('whole story')
    expect(Object.keys(env).sort()).toEqual(['alg', 'ct', 'iv', 'v'])
    expect(env.v).toBe(SEAL_VERSION)
  })
})

describe('generateSealKey', () => {
  it('is 43 base64url chars — 256 bits, no padding, URL-safe', async () => {
    const key = generateSealKey()
    expect(key).toMatch(/^[\w-]{43}$/)
  })

  it('does not repeat', () => {
    const keys = new Set(Array.from({ length: 50 }, generateSealKey))
    expect(keys.size).toBe(50)
  })
})

describe('isSealedSlug', () => {
  it.each([
    ['private/foo', true],
    ['blog/private/foo', true],
    ['private/2026/foo', true],
    ['2026/foo', false],
    ['2026/private-thoughts', false], // a hyphen is not a path segment
    ['privateer/foo', false],
    ['', false],
    [undefined, false],
  ])('%s → %s', (slug, expected) => {
    expect(isSealedSlug(slug)).toBe(expected)
  })
})

describe('isSealedPost', () => {
  it('needs both the flag and a real envelope', async () => {
    const env = await sealPost(payload, generateSealKey(), 'private/foo')
    expect(isSealedPost({ sealed: true, envelope: env })).toBe(true)
    expect(isSealedPost({ sealed: true })).toBe(false)
    expect(isSealedPost({ envelope: env })).toBe(false)
    expect(isSealedPost({ html: '<p>public</p>' })).toBe(false)
    expect(isSealedPost(null)).toBe(false)
  })
})

describe('capabilityLink', () => {
  it('puts the key in the fragment, which browsers never send to a server', () => {
    const link = capabilityLink('https://ejfox.com', 'private/foo', 'KEY')
    expect(link).toBe('https://ejfox.com/blog/private/foo#k=KEY')
    // Everything before the '#' is what reaches the VPS, a proxy log, or a
    // Referer header. It must contain no part of the key.
    expect(link.split('#')[0]).not.toContain('KEY')
  })
})
