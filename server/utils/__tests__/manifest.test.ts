import { describe, it, expect } from 'vitest'
import { isListable } from '../manifest'

// manifest-lite hoists only some flags to the top level; the rest live under
// `metadata`. isListable must catch every flag at both levels.
const entry = (top: object = {}, metadata: object = {}) => ({
  slug: '2025/example',
  date: '2025-01-01',
  ...top,
  metadata: { date: '2025-01-01', ...metadata },
})

describe('isListable', () => {
  it('lists an ordinary published post', () => {
    expect(isListable(entry())).toBe(true)
  })

  for (const flag of ['draft', 'unlisted', 'sealed']) {
    it(`hides ${flag} at the top level and in metadata`, () => {
      expect(isListable(entry({ [flag]: true }))).toBe(false)
      expect(isListable(entry({}, { [flag]: true }))).toBe(false)
    })
  }

  it('hides a post still under embargo', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isListable(entry({}, { publishAt: future }))).toBe(false)
  })
})
