import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as sealKeyring from '../sealKeyring.mjs'

/**
 * These run in a throwaway cwd because sealKeyring resolves .postkeys.json
 * from process.cwd() — the real keyring must never be touched by a test run.
 */
let tmp, cwd

beforeEach(async () => {
  cwd = process.cwd()
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'seal-'))
  process.chdir(tmp)
})

afterEach(async () => {
  process.chdir(cwd)
  await fs.rm(tmp, { recursive: true, force: true })
})

const post = (title = 'Why I am leaving Acme Corp') => ({
  html: '<h2>The meeting</h2><p>The whole story, at length.</p>',
  metadata: {
    title,
    dek: 'A dek that gives away the whole thing',
    tags: ['acme', 'resignation'],
    toc: [{ level: 2, text: 'The meeting', id: 'the-meeting' }],
  },
})

const out = (slug) => path.join(tmp, `${slug}.json`)

describe('keyForSlug', () => {
  it('mints once and then returns the same key forever', async () => {
    const first = await sealKeyring.keyForSlug('private/a')
    const second = await sealKeyring.keyForSlug('private/a')
    expect(first.minted).toBe(true)
    expect(second.minted).toBe(false)
    expect(second.key).toBe(first.key)
  })

  it('gives different posts different keys', async () => {
    const a = await sealKeyring.keyForSlug('private/a')
    const b = await sealKeyring.keyForSlug('private/b')
    // Per-post, so handing one person one post does not hand them all of them.
    expect(a.key).not.toBe(b.key)
  })

  it('persists to .postkeys.json with owner-only permissions', async () => {
    await sealKeyring.keyForSlug('private/a')
    const stat = await fs.stat(path.join(tmp, '.postkeys.json'))
    expect(stat.mode & 0o777).toBe(0o600)
  })
})

describe('sealResult', () => {
  it('emits exactly slug/sealed/envelope and nothing else', async () => {
    const { json } = await sealKeyring.sealResult(
      post(),
      'private/a',
      out('private/a')
    )
    expect(Object.keys(json).sort()).toEqual(['envelope', 'sealed', 'slug'])
  })

  it('leaks no title, dek, tag or heading into the public JSON', async () => {
    const { json } = await sealKeyring.sealResult(
      post(),
      'private/a',
      out('private/a')
    )
    const serialised = JSON.stringify(json)
    for (const needle of [
      'Acme',
      'leaving',
      'The meeting',
      'resignation',
      'whole story',
    ]) {
      expect(serialised).not.toContain(needle)
    }
  })

  it('does not re-seal when the payload is unchanged', async () => {
    // import.mjs wipes and rebuilds content/blog on every run, refreshing every
    // mtime — so without this, every `blog:process` would rewrite the envelope
    // with a fresh IV and fill the repo with diffs that say nothing.
    const p = out('private/a')
    const first = await sealKeyring.sealResult(post(), 'private/a', p)
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(p, JSON.stringify(first.json))

    const second = await sealKeyring.sealResult(post(), 'private/a', p)
    expect(second.resealed).toBe(false)
    expect(second.json.envelope.iv).toBe(first.json.envelope.iv)
  })

  it('re-seals under the SAME key when the payload changes', async () => {
    // Links already in other people's hands have to keep working across edits.
    const p = out('private/a')
    const first = await sealKeyring.sealResult(post(), 'private/a', p)
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(p, JSON.stringify(first.json))

    const second = await sealKeyring.sealResult(
      post('A different title entirely'),
      'private/a',
      p
    )
    expect(second.resealed).toBe(true)
    expect(second.key).toBe(first.key)
    expect(second.json.envelope.ct).not.toBe(first.json.envelope.ct)
  })

  it('refuses a tampered envelope on the REUSE path, fatally', async () => {
    // The file on disk is not necessarily the file this code last wrote. A bad
    // merge or a hand edit that adds a public field still decrypts fine, so
    // only the field check catches it — and it has to run on the reuse path,
    // which is the path a tampered file takes.
    const p = out('private/a')
    const first = await sealKeyring.sealResult(post(), 'private/a', p)
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(
      p,
      JSON.stringify({ ...first.json, title: 'Why I am leaving Acme Corp' })
    )

    await expect(
      sealKeyring.sealResult(post(), 'private/a', p)
    ).rejects.toMatchObject({
      fatalContentError: true,
      message: expect.stringContaining('SEAL LEAK'),
    })
  })

  it('marks leak errors fatal so the build loop cannot swallow them', async () => {
    // processAllFiles catches per-file errors and keeps going. A leak check
    // that gets swallowed is worse than no check: the run exits 0 and the post
    // ships anyway.
    const err = sealKeyring.fatal('boom')
    expect(err.fatalContentError).toBe(true)
  })
})
