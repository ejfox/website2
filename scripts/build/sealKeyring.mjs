/**
 * @file sealKeyring.mjs
 * @description The local, never-committed keyring for sealed posts, and the
 *   build-time seal step that uses it.
 *
 * ## Where the key lives, and why it lives there
 *
 * One 256-bit key per sealed post, in `.postkeys.json` at the repo root, which
 * is gitignored. That file is the ONLY copy other than the links already
 * shared. Nothing else holds it:
 *
 *   - **not GitHub Actions.** The runner is not trusted with anything here and
 *     does not need to be — it never sees a sealed post's plaintext, never
 *     holds a key, and cannot produce one. A fork PR, a compromised action, or
 *     a leaked repo secret therefore cannot open a sealed post.
 *   - **not the VPS.** The server stores and serves an opaque envelope. It
 *     never holds a key, so it cannot be made to decrypt one, and a listing
 *     filter that regresses leaks an envelope rather than a post.
 *   - **not the repo.** The plaintext source is gitignored; the committed JSON
 *     is envelope-only.
 *
 * Back `.postkeys.json` up (1Password) the way you would an SSH key. Losing it
 * does not lose the post — the vault still has the source — but it does mean
 * re-sealing under a fresh key and re-sending every link.
 *
 * ## Why keys are per-post and stable
 *
 * Stable, so that editing a post does not break links already in other
 * people's hands. Per-post, so that giving one person one post does not give
 * them every sealed post forever.
 *
 * Rotation is NOT revocation. Re-sealing under a new key leaves the old
 * envelope in git history, openable by anyone who ever held the old key. The
 * only way to revoke access to a body is to change the body.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  generateSealKey,
  sealPost,
  unsealPost,
  isSealedPost,
} from '../../utils/postSeal.mjs'

/**
 * Resolved per call rather than once at import, so the keyring always belongs
 * to the repo actually being processed. A path frozen at module-load time
 * silently points at the wrong repo the moment anything changes directory —
 * and "wrote the keys somewhere else" is a failure that looks exactly like
 * "minted a new key", i.e. every shared link breaks and nothing says why.
 */
const keyringPath = () => path.resolve(process.cwd(), '.postkeys.json')

/**
 * Mark an error as one that must kill the build.
 *
 * processAllFiles wraps each file in a try/catch that pushes failures onto a
 * stats array and keeps going — sensible for "this post has a malformed link",
 * fatal for "this post is about to be published in the clear". Without this
 * flag a leak check that fires is a leak check that gets swallowed, the run
 * exits 0, and the only trace is a line in a summary nobody reads. A guard
 * that fails quietly is worse than no guard, because it also makes you think
 * you are covered.
 */
export function fatal(message) {
  const err = new Error(message)
  err.fatalContentError = true
  return err
}

/** Keyed by resolved path, so a cache hit can never be another repo's keys. */
const cache = new Map()

async function loadKeyring() {
  const file = keyringPath()
  if (cache.has(file)) return cache.get(file)
  let keyring
  try {
    keyring = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    keyring = {}
  }
  cache.set(file, keyring)
  return keyring
}

async function saveKeyring(keyring) {
  // 0600: this file is the credential for every sealed post on the site.
  await fs.writeFile(keyringPath(), JSON.stringify(keyring, null, 2) + '\n', {
    mode: 0o600,
  })
}

/** The key for a slug, minting and persisting a fresh one on first sight. */
export async function keyForSlug(slug) {
  const keyring = await loadKeyring()
  if (!keyring[slug]) {
    keyring[slug] = generateSealKey()
    await saveKeyring(keyring)
    return { key: keyring[slug], minted: true }
  }
  return { key: keyring[slug], minted: false }
}

/** Every slug the keyring knows about, for the link-printing CLI. */
export async function allSealKeys() {
  return { ...(await loadKeyring()) }
}

/**
 * Turn a fully rendered post into the envelope-only object that gets committed.
 *
 * The payload is the WHOLE rendered result — body, title, dek, date, tags and
 * table of contents alike. What comes back carries three keys and nothing
 * else. `slug` is in the clear only because it is already the filename, and
 * therefore already public.
 *
 * Re-seals only when the payload actually changed. Without that check the
 * envelope would be rewritten with a fresh IV on every single `blog:process`
 * — and `import.mjs` wipes and rebuilds `content/blog/` on every run, which
 * refreshes every mtime, so "every run" means "every run". The repo would fill
 * with diffs that say nothing, and a real change to a sealed post would be
 * indistinguishable from noise in review.
 */
export async function sealResult(result, slug, outputPath) {
  const { key, minted } = await keyForSlug(slug)

  const existing = await readExistingSeal(outputPath)
  if (existing) {
    const { payload } = await unsealPost(existing.envelope, key, slug)
    if (payload && JSON.stringify(payload) === JSON.stringify(result)) {
      // The invariant runs on this path too. It is tempting to skip it —
      // nothing was re-encrypted, so what could have changed? — but the file
      // on disk is not necessarily the file this code last wrote. Anything
      // that edited it since (a bad merge, a stray script, a hand edit) would
      // otherwise be waved straight through to the commit, because the
      // ciphertext it carries still decrypts correctly. That is exactly the
      // case a leak check exists for.
      assertNoPlaintext(existing, result, slug)
      return { json: existing, minted, resealed: false, key }
    }
  }

  const envelope = await sealPost(result, key, slug)
  const json = { slug, sealed: true, envelope }

  // Emit invariant. Everything above is reasoning about what SHOULD be in the
  // output; this checks what IS, against the rendered body and the title, and
  // refuses to write rather than publish a post by accident. It is the last
  // line of defence and the only one that runs on the actual bytes.
  assertNoPlaintext(json, result, slug)

  return { json, minted, resealed: true, key }
}

async function readExistingSeal(outputPath) {
  try {
    const parsed = JSON.parse(await fs.readFile(outputPath, 'utf8'))
    return isSealedPost(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Refuse to emit a sealed JSON that contains any recognisable fragment of the
 * post. Checked against the body, the title, the dek and every tag — the four
 * places a leak has actually happened in this codebase.
 */
function assertNoPlaintext(json, result, slug) {
  const serialised = JSON.stringify(json)
  const needles = [
    ...[result?.html, result?.content].map((s) =>
      typeof s === 'string' ? stripTags(s).slice(0, 120) : null
    ),
    result?.metadata?.title,
    result?.title,
    result?.metadata?.dek,
    ...(Array.isArray(result?.metadata?.tags) ? result.metadata.tags : []),
    ...(Array.isArray(result?.metadata?.toc)
      ? result.metadata.toc.map((t) => t?.text)
      : []),
  ].filter((s) => typeof s === 'string' && s.trim().length >= 8)

  for (const needle of needles) {
    if (serialised.includes(needle)) {
      throw fatal(
        `SEAL LEAK: the sealed JSON for "${slug}" still contains the ` +
          `plaintext ${JSON.stringify(needle.slice(0, 60))}. Refusing to ` +
          `write. This is a bug in sealResult, not in your post.`
      )
    }
  }

  const extra = Object.keys(json).filter(
    (k) => !['slug', 'sealed', 'envelope'].includes(k)
  )
  if (extra.length) {
    throw fatal(
      `SEAL LEAK: sealed JSON for "${slug}" carries unexpected public ` +
        `field(s): ${extra.join(', ')}. Only slug/sealed/envelope may be ` +
        `public. Add it to the sealed payload instead.`
    )
  }
}

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
