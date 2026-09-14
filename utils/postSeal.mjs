/**
 * @file postSeal.mjs
 * @description Seal a post's entire rendered payload under a random 256-bit
 *   key, so the result is safe to commit to a PUBLIC repository and can only be
 *   opened by someone holding the key from the capability link.
 *
 * ONE implementation, imported by both sides:
 *   - build:   scripts/build/processMarkdown.mjs   (sealPost)
 *   - browser: components/blog/SealedPost.vue      (unsealPost)
 *
 * It is written against WebCrypto — `globalThis.crypto.subtle`, present in
 * Node 18+ and every browser — precisely so there is only one of it. Two copies
 * of crypto that must agree is how you ship a feature that silently stops
 * working the day someone edits one of them.
 *
 * ## Why there is no password and no KDF
 *
 * The predecessor of this file derived a key from a human-chosen password with
 * scrypt. That makes password entropy the entire control: the sealed envelope
 * is public and permanent (it is in git history forever), so the only remaining
 * attack is offline brute force, and a 12-character human password loses that
 * fight for pocket change no matter how slow the KDF is.
 *
 * So there is no password. The key is 32 bytes from a CSPRNG, handed out as
 * part of a link. 256 bits of real entropy has no brute-force surface at all,
 * which means: no KDF, no cost parameters to migrate, no rate limiter to
 * defeat, no unlock endpoint to DoS, and nothing the server has to be trusted
 * with. The link IS the credential.
 *
 * ## The construction
 *
 * AES-256-GCM, fresh 12-byte IV per seal, ciphertext and tag concatenated (the
 * layout WebCrypto's `encrypt`/`decrypt` use natively, so neither side has to
 * split them apart by hand and get the offset wrong).
 *
 * `v|slug` is bound as additionalData, so the envelope is covered by the
 * authentication tag. Without that, anyone able to land a change to the tracked
 * JSON could swap one post's envelope into another post's file. GCM's tag is
 * also the key check — there is no stored verifier to steal and no comparison
 * whose timing could leak.
 *
 * ## What is sealed
 *
 * Everything. Body, title, dek, date, tags, and the table of contents. An
 * earlier design sealed only the body and shipped the TOC in cleartext beside
 * it, so a post whose headings read "Why I am leaving Acme Corp" published its
 * own story to GitHub while the paragraphs underneath sat safely encrypted.
 * Headings are usually where the substance is. The caller whitelists the few
 * fields that stay public (see SEALED_PUBLIC_FIELDS) rather than blacklisting
 * what it strips — a blacklist means the next frontmatter field someone adds
 * becomes a leak nobody reviews.
 *
 * ## Honest limits
 *
 * - **The link is a bearer token.** Anyone who receives it, or who finds it in
 *   a screenshot or a forwarded message, is in. There are no accounts.
 * - **Sharing cannot be undone.** Re-sealing under a new key does not revoke
 *   anything: the old envelope stays in git history and anyone who ever held
 *   the old key can still open it. The only way to revoke access to a body is
 *   to change the body.
 * - **The existence of the post is public**, along with its filename, its
 *   approximate length, and the commit timestamps that touched it. Use an
 *   opaque slug if the title itself is the sensitive part.
 * - **Images are not sealed.** Only the markdown payload is. An image the post
 *   embeds is a public URL on a CDN, reachable by anyone who has it.
 */

/** Envelope format version. Unsealing DISPATCHES on this — see unsealPost. */
export const SEAL_VERSION = 1

const ALG = 'AES-GCM'
const KEY_BITS = 256
const IV_BYTES = 12 // GCM standard
const KEY_BYTES = 32

/**
 * The ONLY fields that may remain in cleartext in a sealed post's processed
 * JSON. A whitelist, deliberately — see the header note. `slug` has to be here
 * because it is the filename and therefore already public; `sealed` is what
 * every listing filter keys on.
 */
export const SEALED_PUBLIC_FIELDS = ['slug', 'sealed', 'envelope']

const enc = new TextEncoder()
const dec = new TextDecoder()

/** base64url, no padding — safe in a URL fragment without escaping. */
export function toBase64Url(bytes) {
  let bin = ''
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(str) {
  const b64 = String(str).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** A fresh 256-bit key as base64url — 43 characters, the whole credential. */
export function generateSealKey() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(KEY_BYTES)))
}

/**
 * Binds the envelope header and the slug to the ciphertext, so an envelope
 * cannot be moved between posts or have its version rewritten.
 */
function aad(version, slug) {
  return enc.encode(`${version}|${slug ?? ''}`)
}

async function importKey(keyB64url, usage) {
  const raw = fromBase64Url(keyB64url)
  if (raw.length !== KEY_BYTES) {
    throw new Error(
      `Seal key must be ${KEY_BYTES} bytes (${KEY_BYTES * 8} bits); got ` +
        `${raw.length}. Keys are generated by generateSealKey(), never typed.`
    )
  }
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALG, length: KEY_BITS },
    false,
    [usage]
  )
}

/**
 * Seal a payload. Build-time.
 *
 * @param {unknown} payload everything that must stay private — body, title,
 *   dek, date, tags, toc. Serialised with JSON.stringify.
 * @param {string} keyB64url from generateSealKey()
 * @param {string} slug bound into the additionalData
 * @returns {Promise<{v:number, alg:string, iv:string, ct:string}>} the
 *   envelope to commit — carries no plaintext and is safe in a public repo.
 */
export async function sealPost(payload, keyB64url, slug) {
  const key = await importKey(keyB64url, 'encrypt')
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ct = await crypto.subtle.encrypt(
    { name: ALG, iv, additionalData: aad(SEAL_VERSION, slug) },
    key,
    enc.encode(JSON.stringify(payload))
  )
  return {
    v: SEAL_VERSION,
    alg: 'A256GCM',
    iv: toBase64Url(iv),
    ct: toBase64Url(ct),
  }
}

/**
 * Open a sealed envelope. Runs in the reader's browser; the key never leaves
 * it, and no server is involved.
 *
 * Dispatches on `envelope.v` rather than demanding equality with the current
 * constant: a hard equality check would make every already-committed post
 * unopenable the moment anyone bumped the version, which is unrecoverable once
 * links are in other people's hands.
 *
 * @returns {Promise<{payload: unknown|null, reason: string|null}>} `payload` is
 *   null on failure. `reason` distinguishes "this link is wrong" from "this
 *   build is broken" for the reader-facing message; it is not an oracle,
 *   because there is no secret here the reader doesn't already hold.
 */
export async function unsealPost(envelope, keyB64url, slug) {
  if (!envelope || typeof envelope !== 'object') {
    return { payload: null, reason: 'no-envelope' }
  }
  if (envelope.v !== SEAL_VERSION) {
    return { payload: null, reason: 'unknown-version' }
  }
  if (!keyB64url) return { payload: null, reason: 'no-key' }

  let key, iv, ct
  try {
    key = await importKey(keyB64url, 'decrypt')
    iv = fromBase64Url(envelope.iv)
    ct = fromBase64Url(envelope.ct)
  } catch {
    return { payload: null, reason: 'malformed-key' }
  }
  if (iv.length !== IV_BYTES) return { payload: null, reason: 'bad-iv' }

  try {
    const plain = await crypto.subtle.decrypt(
      { name: ALG, iv, additionalData: aad(envelope.v, slug) },
      key,
      ct
    )
    return { payload: JSON.parse(dec.decode(plain)), reason: null }
  } catch {
    // Tag mismatch — wrong key, or tampered ciphertext/slug.
    return { payload: null, reason: 'auth-failed' }
  }
}

/** True if a processed post is a sealed envelope rather than a rendered post. */
export function isSealedPost(data) {
  const env = data?.envelope
  return !!(data?.sealed === true && env && typeof env === 'object' && env.ct)
}

/**
 * True if a slug belongs in the sealed namespace.
 *
 * The FOLDER is the switch, not a frontmatter key, and that is the single most
 * important decision in this design. Protection keyed on a frontmatter field
 * whose *absence* means "public" is a footgun: the previous attempt published a
 * post outright because someone typed `passwordenv:` instead of `passwordEnv:`.
 * A directory cannot be misspelled invisibly — it is visible in Obsidian's file
 * tree, in the URL, and in `git status`, and `content/blog/private/` is
 * gitignored, so a file in the wrong place cannot be committed by accident
 * while a file in the right place cannot be committed at all.
 *
 * Frontmatter still participates, but only as a TRIPWIRE in the opposite
 * direction: any `/protect|passw|secret/i` key found on a post OUTSIDE this
 * namespace fails the build. Presence protects; absence never publishes.
 */
export function isSealedSlug(slug) {
  return typeof slug === 'string' && /(?:^|\/)private\//.test(slug)
}

/** The capability link for a sealed post. The key lives in the FRAGMENT. */
export function capabilityLink(origin, slug, keyB64url) {
  return `${origin.replace(/\/$/, '')}/blog/${slug}#k=${keyB64url}`
}
