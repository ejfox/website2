/**
 * @file postCrypto.mjs
 * @description Encrypt a post's body at rest so its processed JSON is safe to
 *   commit to a PUBLIC repository.
 *
 * ONE implementation, imported by both sides:
 *   - build:  scripts/build/processMarkdown.mjs  (encryptPostSync)
 *   - server: server/api/posts/unlock.post.ts    (decryptPost)
 * Two copies of crypto that must agree is how you ship a feature that silently
 * stops working, so this is deliberately a single `.mjs` both can reach.
 *
 * ## Why encryption rather than a password hash
 *
 * The previous design stored the rendered `html` plus a SHA-256 of the
 * password. Both live in `content/processed/<slug>.json`, which is committed —
 * and this repo is public. Anyone could read the body straight out of git
 * without touching the password at all.
 *
 * Here the JSON carries only ciphertext. The key is derived from the password,
 * so the committed artifact discloses nothing on its own.
 *
 * ## What the threat model actually is now
 *
 * Because the ciphertext IS public, the remaining attack is offline: take the
 * committed blob and try passwords against it. Nothing can stop that — only
 * make it expensive. So two things carry the weight:
 *
 *   1. scrypt with deliberately heavy parameters (N=2^15, 64MB) — roughly
 *      100ms per guess per core, versus billions/sec for raw SHA-256. That is a
 *      ~10^9 slowdown, and the memory hardness blunts GPU and ASIC attacks.
 *   2. password strength, which is now load-bearing. The build refuses
 *      anything under MIN_PASSWORD_LENGTH, because a short password behind a
 *      public ciphertext is a countdown, not a control.
 *
 * AES-256-GCM's authentication tag doubles as the password check: a wrong key
 * fails the tag and decryption throws. There is no hash to steal or crack.
 */
import {
  randomBytes,
  scrypt,
  scryptSync,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto'

/** Bumped if the envelope format or KDF parameters ever change. */
export const CRYPTO_VERSION = 1

/**
 * Deliberately expensive. N=2^15 with r=8 needs ~64MB per guess, which is what
 * makes this hostile to GPUs (they have many cores but little memory each).
 * maxmem must be raised explicitly — Node's default 32MB would reject these.
 */
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }
const KEY_LENGTH = 32 // AES-256
const SALT_LENGTH = 16
const IV_LENGTH = 12 // GCM standard

/**
 * Below this the offline attack against a public ciphertext is cheap enough to
 * matter. Enforced at build time so the failure is loud and early.
 */
export const MIN_PASSWORD_LENGTH = 12

function deriveKeySync(password, salt) {
  return scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)
}

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  })
}

/**
 * Encrypt a post body. Build-time only, so the synchronous KDF is fine.
 *
 * @returns {{v:number, kdf:string, salt:string, iv:string, tag:string, data:string}}
 *   A self-describing envelope, safe to commit.
 */
export function encryptPostSync(plaintext, password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters. The ` +
        'encrypted post ships in a public repo, so a short password can be ' +
        'brute-forced offline no matter how slow the KDF is.'
    )
  }

  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKeySync(password, salt)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  return {
    v: CRYPTO_VERSION,
    kdf: `scrypt:${SCRYPT_PARAMS.N}:${SCRYPT_PARAMS.r}:${SCRYPT_PARAMS.p}`,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  }
}

/**
 * Decrypt a post body. Async so a ~100ms KDF doesn't block the event loop —
 * this runs per unlock request.
 *
 * @returns {Promise<string|null>} the plaintext, or null if the password is
 *   wrong. GCM's auth tag is the verifier: a wrong key fails it and throws,
 *   which is caught and reported as null rather than distinguished, so callers
 *   can't tell "wrong password" from "corrupt blob".
 */
export async function decryptPost(envelope, password) {
  if (!envelope || typeof envelope !== 'object') return null
  if (envelope.v !== CRYPTO_VERSION) return null
  if (typeof password !== 'string' || !password) return null

  try {
    const salt = Buffer.from(envelope.salt, 'base64')
    const iv = Buffer.from(envelope.iv, 'base64')
    const tag = Buffer.from(envelope.tag, 'base64')
    const data = Buffer.from(envelope.data, 'base64')
    if (!salt.length || !iv.length || !tag.length) return null

    const key = await deriveKey(password, salt)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8'
    )
  } catch {
    // Wrong password (tag mismatch) or a malformed envelope. Same answer either
    // way — don't hand an attacker a way to tell them apart.
    return null
  }
}

/** True if a processed post carries an encrypted body. */
export function isEncryptedPost(data) {
  const env = data?.encrypted ?? data?.metadata?.encrypted
  return !!(env && typeof env === 'object' && env.v && env.data)
}

/** The envelope from a processed post, or undefined. */
export function getEnvelope(data) {
  return data?.encrypted ?? data?.metadata?.encrypted ?? undefined
}
