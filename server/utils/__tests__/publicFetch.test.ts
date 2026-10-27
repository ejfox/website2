import { describe, expect, it } from 'vitest'
import {
  assertFetchableUrl,
  fetchPublicText,
  isPublicAddress,
} from '../publicFetch'

describe('isPublicAddress', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '100.127.255.255',
    '127.0.0.1',
    '127.255.255.254',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '[::1]',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::7f00:1',
    '2002:7f00:1::',
  ])('refuses %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false)
  })

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '100.63.255.255',
    '100.128.0.1',
    '172.15.255.255',
    '172.32.0.1',
    '2606:4700::1111',
    '2001:4860:4860::8888',
    '::ffff:8.8.8.8',
  ])('allows %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(true)
  })

  it('refuses things that are not IPs', () => {
    expect(isPublicAddress('')).toBe(false)
    expect(isPublicAddress('example.com')).toBe(false)
    expect(isPublicAddress('999.1.1.1')).toBe(false)
  })
})

describe('assertFetchableUrl', () => {
  it.each([
    'file:///etc/passwd',
    'ftp://example.com/',
    'http://127.0.0.1/',
    'http://2130706433/', // WHATWG URL normalizes this to 127.0.0.1
    'http://0x7f.1/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://169.254.169.254/latest/',
  ])('refuses %s', (url) => {
    expect(() => assertFetchableUrl(new URL(url))).toThrow()
  })

  it.each(['https://example.com/', 'http://8.8.8.8/'])('allows %s', (url) => {
    expect(() => assertFetchableUrl(new URL(url))).not.toThrow()
  })
})

describe('fetchPublicText', () => {
  // localhost resolves without the network, so this exercises the DNS path.
  it('refuses a hostname that resolves to loopback', async () => {
    await expect(fetchPublicText('http://localhost:9/')).rejects.toMatchObject({
      code: 'ENOTPUBLIC',
    })
  })
})
