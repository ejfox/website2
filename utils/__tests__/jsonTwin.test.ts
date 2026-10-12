import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { JSON_TWIN_SECTIONS, hasJsonTwin } from '../jsonTwin'

describe('JSON_TWIN_SECTIONS', () => {
  it('matches the cases json-twin.ts resolves', () => {
    const src = readFileSync('server/middleware/json-twin.ts', 'utf8')
    const body = src.slice(src.indexOf('async function resolveTwin'))
    const cases = [...body.matchAll(/case '([a-z-]+)'/g)].map((m) => m[1])
    expect(new Set(['', ...cases])).toEqual(JSON_TWIN_SECTIONS)
  })

  it('answers by first path segment', () => {
    expect(hasJsonTwin('/')).toBe(true)
    expect(hasJsonTwin('/blog/2024/foo')).toBe(true)
    expect(hasJsonTwin('/rides')).toBe(false)
    expect(hasJsonTwin('/apps')).toBe(false)
  })
})
