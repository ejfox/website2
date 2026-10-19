import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StatsResponse } from '~/types/stats'
import { buildStatsSummary } from '../statsSummary'
import { statsFixture, STATS_NOW } from './fixtures/statsResponse'

// Expected strings were captured from the original pages/stats.vue
// `summaryData` computed, run verbatim on these same inputs before the
// logic moved here.

const a = (href: string, text: string) =>
  `<a href="#${href}" class="underline ">${text}</a>`
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o))
const as = (o: unknown) => o as StatsResponse
const IDLE = 'Monitoring systems, collecting data, optimizing workflows.'

afterEach(() => vi.useRealTimers())

describe('buildStatsSummary', () => {
  it('builds the full sentence from a realistic payload', () => {
    expect(buildStatsSummary(statsFixture, STATS_NOW).text).toBe(
      "This week I've " +
        `${a('writing', 'written')} 3,734 words across 3 posts, ` +
        `made 3 ${a('github', 'commits')}, ` +
        `${a('leetcode', 'solved')} 2 coding problems, ` +
        `${a('chess', 'played')} 3 chess games (2 wins), ` +
        `${a('typing', 'typed')} at 166.41 WPM, ` +
        `created 1 ${a('gists', 'gists')}, ` +
        `listened to 3 ${a('music', 'tracks')} (mostly Hamdi), ` +
        `watched 2 ${a('movies', 'films')}, ` +
        `logged 31 ${a('productivity', 'productive hours')}, ` +
        `and gained 468 ${a('website', 'pageviews')}.`
    )
  })

  it('defaults `now` to the current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(STATS_NOW)
    expect(buildStatsSummary(statsFixture)).toEqual(
      buildStatsSummary(statsFixture, STATS_NOW)
    )
  })

  it('returns empty text when stats have not loaded', () => {
    expect(buildStatsSummary(null, STATS_NOW)).toEqual({ text: '' })
    expect(buildStatsSummary(undefined, STATS_NOW)).toEqual({ text: '' })
  })

  it('falls back to the idle line when nothing happened this week', () => {
    expect(buildStatsSummary(as({}), STATS_NOW).text).toBe(IDLE)
    // pageviews with no previous period, and < 0.5 productive hours
    expect(
      buildStatsSummary(
        as({ website: { stats: { pageviews: { value: 10, prev: 0 } } } }),
        STATS_NOW
      ).text
    ).toBe(IDLE)
    expect(
      buildStatsSummary(
        as({
          rescueTime: {
            week: { summary: { productive: { time: { hours: 0.3 } } } },
          },
        }),
        STATS_NOW
      ).text
    ).toBe(IDLE)
  })

  it('ignores items older than a week, in the future, or undated', () => {
    const s = clone(statsFixture) as any
    s.blog.recentPosts = s.blog.recentPosts.slice(3)
    s.github.detail.commits = s.github.detail.commits.slice(3)
    s.leetcode.recentSubmissions = s.leetcode.recentSubmissions.slice(2)
    s.chess.recentGames = s.chess.recentGames.slice(3)
    s.monkeyType.typingStats.recentTests =
      s.monkeyType.typingStats.recentTests.slice(2)
    s.gists.recentGists = s.gists.recentGists.slice(1)
    s.lastfm.recentTracks.tracks = s.lastfm.recentTracks.tracks.slice(3)
    s.letterboxd.films = [s.letterboxd.films[0], ...s.letterboxd.films.slice(3)]
    delete s.rescueTime
    delete s.website
    expect(buildStatsSummary(s, STATS_NOW).text).toBe(IDLE)
  })

  it('uses one clause, two clauses, and singular forms', () => {
    expect(
      buildStatsSummary(
        as({ website: { stats: { pageviews: { value: 10, prev: 25 } } } }),
        STATS_NOW
      ).text
    ).toBe(`This week I've lost 15 ${a('website', 'pageviews')}.`)

    expect(
      buildStatsSummary(
        as({ gists: statsFixture.gists, rescueTime: statsFixture.rescueTime }),
        STATS_NOW
      ).text
    ).toBe(
      `This week I've created 1 ${a('gists', 'gists')} and logged 31 ${a('productivity', 'productive hours')}.`
    )

    const s = clone(statsFixture) as any
    expect(
      buildStatsSummary(
        as({
          chess: {
            recentGames: s.chess.recentGames.filter(
              (g: { id: string }) => g.id === 'a'
            ),
          },
          blog: { recentPosts: s.blog.recentPosts.slice(0, 1) },
        }),
        STATS_NOW
      ).text
    ).toBe(
      `This week I've ${a('writing', 'written')} 1,234 words across 1 post and ${a('chess', 'played')} 1 chess games (1 win).`
    )
  })

  it('skips music entirely when the first last.fm track is now-playing', () => {
    const s = clone(statsFixture) as any
    s.lastfm.recentTracks.tracks.unshift({ name: 'np', artist: { name: 'X' } })
    const text = buildStatsSummary(s, STATS_NOW).text
    expect(text).not.toContain('#music')
    expect(text).toContain(`watched 2 ${a('movies', 'films')}`)
  })
})
