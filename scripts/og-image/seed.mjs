/**
 * Deterministic seeded PRNG from a slug string.
 * Same slug always produces the same sequence of random numbers.
 */

/** Hash a string to a 32-bit integer (djb2) */
function hashString(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/**
 * Create a seeded PRNG (mulberry32).
 * @param {string} slug
 * @returns {() => number} Returns values in [0, 1)
 */
export function createRng(slug) {
  let state = hashString(slug)
  return function random() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random float in [min, max) */
export function randRange(rng, min, max) {
  return min + rng() * (max - min)
}

/** Random pick from array */
export function randPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}
