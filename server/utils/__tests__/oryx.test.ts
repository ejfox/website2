import { describe, expect, it } from 'vitest'
import { glyph, normalizeKey } from '../oryx'

describe('normalizeKey', () => {
  it('maps transparent to null and KC_NO to blocked', () => {
    expect(normalizeKey({ tap: { code: 'KC_TRANSPARENT' } })).toBeNull()
    expect(normalizeKey(null)).toBeNull()
    expect(normalizeKey({ tap: { code: 'KC_NO' } })).toEqual({ x: true })
  })

  it('treats a key with nothing assigned as transparent, not blocked', () => {
    // Oryx compiles an empty key to KC_TRANSPARENT
    expect(
      normalizeKey({ tap: null, hold: null, customLabel: null })
    ).toBeNull()
    expect(
      normalizeKey({ tap: { code: 'KC_TRANSPARENT', macro: { keys: [] } } })
    ).toBeNull()
  })

  it('reads tap, hold, double-tap and layer switches', () => {
    expect(
      normalizeKey({
        tap: { code: 'KC_SPACE' },
        hold: { code: 'MO', layer: 1 },
        doubleTap: { code: 'KC_ENTER' },
      })
    ).toEqual({ t: '␣', d: '⏎', L: { op: 'MO', to: 1 } })
    expect(
      normalizeKey({ tap: null, hold: { code: 'KC_LEFT_SHIFT' } })
    ).toEqual({ h: '⇧' })
  })

  it('never emits what a macro types', () => {
    const macro = {
      keys: [{ code: 'KC_H' }, { code: 'KC_I' }],
    }
    expect(normalizeKey({ tap: { code: 'KC_TRANSPARENT', macro } })).toEqual({
      t: 'macro',
    })
    expect(
      normalizeKey({ tap: { code: null, macro }, customLabel: '=>' })
    ).toEqual({ t: '=>' })
    expect(JSON.stringify(normalizeKey({ tap: { macro } }))).not.toMatch(/KC_/)
  })
})

describe('glyph', () => {
  it('prefixes modifiers in macOS order', () => {
    expect(
      glyph({ code: 'KC_LBRC', modifiers: { leftGui: true, leftShift: true } })
    ).toBe('⇧⌘[')
    expect(glyph({ code: 'KC_EXLM' })).toBe('!')
    expect(glyph({ code: 'KC_F10' })).toBe('F10')
    expect(glyph({ code: 'RGB_HUI' })).toBe('rgb')
    expect(glyph({ code: 'QK_LLCK' })).toBe('lock')
    expect(glyph({ code: 'CW_TOGG' })).toBe('caps')
    expect(glyph({ code: 'KC_A', macro: { keys: [] } })).toBe('A')
  })
})
