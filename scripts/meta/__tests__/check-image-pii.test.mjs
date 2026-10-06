import { describe, it, expect } from 'vitest'
import { scanText, ALT_RULES, extractImages, redact } from '../check-image-pii.mjs'

// Every value here is fake. The shapes mirror real OCR output from the
// screenshots that leaked in 2026-10 (OCR spacing quirks included).
const rules = (text, r) => scanText(text, r).map((h) => h.rule)

describe('OCR rules — catch', () => {
  it('API keys in a .env screenshot', () => {
    const ocr = `# OpenRouter key
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-0000aaaa1111bbbb2222cccc3333dddd
ELEVENLABS_API_KEY=sk_00000000aaaaaaaa11111111bbbbbbbb22222222`
    expect(rules(ocr)).toEqual(
      expect.arrayContaining(['openai-anthropic-key', 'elevenlabs-key', 'env-secret'])
    )
  })

  it('an env password even when OCR mangles the value', () => {
    expect(rules('VITE_CLICKHOUSE_PASSWORD=0 . Ab12Cd34')).toContain('env-secret')
  })

  it('a clipped password assignment', () => {
    expect(rules('const _password=abC1(')).toContain('password-assignment')
  })

  it('a hardcoded secret string in code', () => {
    expect(rules('.update(`${provider}:${id}:acme—billing—secret—v2`)')).toContain('hardcoded-secret')
  })

  it('credentials in a connection string', () => {
    expect(rules('postgres://admin:hunter22x@db.example.com:5432/app')).toContain('url-credentials')
  })

  it('bank statements and pay stubs', () => {
    expect(rules('Account Number: XXXX1234\nEnding Balance $1,234.56')).toEqual(
      expect.arrayContaining(['bank-account-number', 'bank-balance'])
    )
    expect(rules('Direct Deposit to checking')).toContain('pay-stub')
  })

  it('an invoice ledger', () => {
    const ocr = ['$7,000.00', '$8,000.00', '$10,000.00', '$0.00', '$0.00', '$12.50'].join('\n')
    expect(rules(ocr)).toContain('money-ledger')
  })

  it('a Luhn-valid card number', () => {
    expect(rules('Card 4242 4242 4242 4242')).toContain('card-number')
  })

  it('a payment-processor dashboard', () => {
    expect(rules('pi_3Aa0Bb1Cc2Dd3Ee4Ff5Gg6Hh')).toContain('payment-id')
  })
})

describe('OCR rules — leave alone', () => {
  it.each([
    'Use a password manager. I store mine in 1Password.',
    'password: ********',
    'API_KEY=${process.env.KEY}',
    'const apiKey = process.env.OPENAI_API_KEY',
    'The book costs $24.99 and shipping is $5.00',
    'Order #1234 5678 9012 3456', // not Luhn-valid
    'Contact me at ejfox@ejfox.com',
    'Ask for the account number at the desk', // no number follows
    'OPENROUTER_API_KEY=your_api_key_here',
    'const TOKEN = process.env.MASTODON_ACCESS_TOKEN',
    'TRAINS CURRENT BALANCE $1.1b',
    'float3(-3.6548, -1.6253, 0.25), float3(1.0130, -3.9967, 0.2425)',
    'Using cached pillow-11.@.@-cp313-cp313-macosx_11_0_arm64.whl idna-3.10-py3-none-any.whl',
    'process.env.JWT_SECRET_KEY',
    'gpg --list-secret-keys --keyid-format=long',
    "WebSocket connection to 'ws://localhost:3000/?token=MKQab12cd34'",
  ])('%s', (text) => {
    expect(rules(text)).toEqual([])
  })
})

describe('alt-text rules', () => {
  it('flag model-written descriptions of private documents', () => {
    expect(rules('Screenshot of a bank statement showing recent transactions', ALT_RULES)).toContain(
      'alt-financial'
    )
    expect(rules('Terminal with the full API key printed in a log', ALT_RULES)).toContain(
      'alt-credential'
    )
    expect(rules('Browser search history list', ALT_RULES)).toContain('alt-personal')
  })

  it('pass ordinary photos and settings screens', () => {
    expect(rules('Motorcycle parked by a lake with green hills', ALT_RULES)).toEqual([])
    expect(rules('LLM API management interface showing import dialog for API keys', ALT_RULES)).toEqual([])
  })
})

describe('extractImages', () => {
  it('finds markdown, html and frontmatter images, skipping video and local paths', () => {
    const body = `![a cat](https://res.cloudinary.com/x/image/upload/v1/cat.png)
<img src="https://example.com/b.jpg" alt="bee">
![clip](https://res.cloudinary.com/x/video/upload/v1/clip.mp4)
![local](./img.png)`
    const urls = extractImages(body, { image: 'https://example.com/hero.jpg' }).map((i) => i.url)
    expect(urls).toEqual([
      'https://res.cloudinary.com/x/image/upload/v1/cat.png',
      'https://example.com/b.jpg',
      'https://example.com/hero.jpg',
    ])
  })
})

describe('redact', () => {
  it('never prints a usable secret', () => {
    const key = 'sk-or-v1-0000aaaa1111bbbb2222cccc3333dddd'
    const out = redact(key)
    expect(out.length).toBeLessThan(20)
    expect(out).not.toContain(key.slice(0, 12))
  })
})
