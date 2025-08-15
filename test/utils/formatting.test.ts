import { describe, it, expect } from 'vitest'
import { formatNumber, formatCompact, formatNumberSimple } from '~/composables/useNumberFormat'

describe('Utility Functions', () => {
  describe('formatNumber (thousands separator)', () => {
    it('should format numbers with thousands separators', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(10000)).toBe('10,000')
      expect(formatNumber(100000)).toBe('100,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('−1,000') // Note: d3 uses minus sign, not hyphen
      expect(formatNumber(-1234)).toBe('−1,234')
    })
  })

  describe('formatCompact (SI suffixes)', () => {
    it('should format numbers with SI suffixes', () => {
      // D3's .2~s format starts using k at 1000, not 999
      expect(formatCompact(999)).toBe('1k') // D3 rounds 999 to 1k
      expect(formatCompact(1000)).toBe('1k')
      expect(formatCompact(1234)).toBe('1.2k')
      expect(formatCompact(10000)).toBe('10k')
      expect(formatCompact(1000000)).toBe('1M')
      expect(formatCompact(1234567)).toBe('1.2M')
    })
  })

  describe('formatNumberSimple (custom K/M format)', () => {
    it('should format numbers with K/M suffixes', () => {
      expect(formatNumberSimple(999)).toBe('999')
      expect(formatNumberSimple(1000)).toBe('1.0K')
      expect(formatNumberSimple(1234)).toBe('1.2K')
      expect(formatNumberSimple(10000)).toBe('10.0K')
      expect(formatNumberSimple(100000)).toBe('100.0K')
      expect(formatNumberSimple(1000000)).toBe('1.0M')
      expect(formatNumberSimple(1234567)).toBe('1.2M')
    })

    it('should handle small numbers with locale formatting', () => {
      expect(formatNumberSimple(0)).toBe('0')
      expect(formatNumberSimple(42)).toBe('42')
      expect(formatNumberSimple(999)).toBe('999')
    })
  })
})