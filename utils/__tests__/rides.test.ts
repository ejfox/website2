import { describe, expect, it } from 'vitest'
import { rideDuration, rideFt, rideKm, rideMi, rideMph } from '../rides'

// Pins the exact strings/numbers the /rides pages rendered before these
// helpers were shared. null/undefined aren't valid inputs by type, but ride
// JSON can carry them, so the current (coercing) behavior is pinned too.
const nil = null as unknown as number
const undef = undefined as unknown as number

describe('rideKm', () => {
  it('formats meters as km with one decimal', () => {
    expect(rideKm(0)).toBe('0.0')
    expect(rideKm(12345)).toBe('12.3')
    expect(rideKm(1609.34)).toBe('1.6')
    expect(rideKm(1e7)).toBe('10000.0')
  })
  it('coerces null to 0 and undefined to NaN', () => {
    expect(rideKm(nil)).toBe('0.0')
    expect(rideKm(undef)).toBe('NaN')
  })
})

describe('rideMi', () => {
  it('formats meters as miles with one decimal', () => {
    expect(rideMi(0)).toBe('0.0')
    expect(rideMi(1609.34)).toBe('1.0')
    expect(rideMi(16093.4)).toBe('10.0')
    expect(rideMi(12345)).toBe('7.7')
    expect(rideMi(987654.3)).toBe('613.7')
    expect(rideMi(1e7)).toBe('6213.7')
  })
  it('coerces null to 0 and undefined to NaN', () => {
    expect(rideMi(nil)).toBe('0.0')
    expect(rideMi(undef)).toBe('NaN')
  })
})

describe('rideFt', () => {
  it('rounds meters to whole feet', () => {
    expect(rideFt(0)).toBe(0)
    expect(rideFt(10)).toBe(33)
    expect(rideFt(100)).toBe(328)
    expect(rideFt(1609.34)).toBe(5280)
    expect(rideFt(1e7)).toBe(32808400)
  })
  it('coerces null to 0 and undefined to NaN', () => {
    expect(rideFt(nil)).toBe(0)
    expect(rideFt(undef)).toBeNaN()
  })
})

describe('rideMph', () => {
  it('rounds m/s to whole mph', () => {
    expect(rideMph(0)).toBe(0)
    expect(rideMph(10)).toBe(22)
    expect(rideMph(45.6)).toBe(102)
    expect(rideMph(1e7)).toBe(22370000)
  })
  it('coerces null to 0 and undefined to NaN', () => {
    expect(rideMph(nil)).toBe(0)
    expect(rideMph(undef)).toBeNaN()
  })
})

describe('rideDuration', () => {
  it('renders hours unpadded and minutes padded', () => {
    expect(rideDuration(0)).toBe('0h00m')
    expect(rideDuration(59)).toBe('0h00m')
    expect(rideDuration(100)).toBe('0h01m')
    expect(rideDuration(3900)).toBe('1h05m')
    expect(rideDuration(12345)).toBe('3h25m')
    expect(rideDuration(360000)).toBe('100h00m')
    expect(rideDuration(1e7)).toBe('2777h46m')
  })
  it('coerces null to 0 and undefined to NaN', () => {
    expect(rideDuration(nil)).toBe('0h00m')
    expect(rideDuration(undef)).toBe('NaNhNaNm')
  })
})
