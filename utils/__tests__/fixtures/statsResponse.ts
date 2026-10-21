/**
 * A trimmed /api/stats payload for testing buildStatsSummary. Shapes follow
 * types/stats.ts and a live response from 2026-10-19; dates are placed
 * relative to STATS_NOW so each source has items inside and outside the
 * 7-day window, plus the edge cases the summary filters on.
 */
import type { StatsResponse } from '~/types/stats'

export const STATS_NOW = new Date('2026-10-19T16:00:00Z')

const DAY = 86_400_000
const ago = (days: number) => new Date(STATS_NOW.getTime() - days * DAY)
const iso = (days: number) => ago(days).toISOString()
const ymd = (days: number) => iso(days).split('T')[0]
const unix = (days: number) => Math.floor(ago(days).getTime() / 1000)

export const statsFixture = {
  blog: {
    recentPosts: [
      { title: 'Rides', slug: '2026/rides', date: iso(1), words: 1234 },
      { title: 'Pele', slug: '2026/pele', date: iso(3), words: 2500 },
      { title: 'Untitled', slug: '2026/untitled', date: iso(5) },
      { title: 'Old', slug: '2026/old', date: iso(30), words: 9999 },
    ],
  },
  github: {
    detail: {
      commits: [
        {
          repository: { name: 'website2' },
          message: 'Merge pull request #126',
          occurredAt: iso(0.1),
          type: 'other',
        },
        {
          repository: { name: 'website2' },
          message: 'One shared manifest loader',
          occurredAt: iso(2),
          type: 'other',
        },
        {
          repository: { name: 'dispatch' },
          message: 'Fix diff view',
          occurredAt: iso(6),
          type: 'fix',
        },
        {
          repository: { name: 'dispatch' },
          message: 'Old work',
          occurredAt: iso(12),
          type: 'feat',
        },
      ],
    },
  },
  leetcode: {
    recentSubmissions: [
      // 10-digit unix seconds
      {
        title: 'Two Sum',
        titleSlug: 'two-sum',
        timestamp: String(unix(1)),
        statusDisplay: 'Accepted',
        lang: 'typescript',
      },
      // 13-digit milliseconds
      {
        title: 'LRU Cache',
        titleSlug: 'lru-cache',
        timestamp: String(ago(2).getTime()),
        statusDisplay: 'Accepted',
        lang: 'typescript',
      },
      // future (bad data) — dropped
      {
        title: 'Future',
        titleSlug: 'future',
        timestamp: String(unix(-3)),
        statusDisplay: 'Accepted',
        lang: 'typescript',
      },
      // too old — dropped
      {
        title: 'Old',
        titleSlug: 'old',
        timestamp: String(unix(20)),
        statusDisplay: 'Accepted',
        lang: 'typescript',
      },
    ],
  },
  chess: {
    recentGames: [
      {
        id: 'a',
        opponent: 'Coach-Levy',
        timeControl: 'rapid',
        result: 'win',
        timestamp: unix(1),
        rating: 400,
        ratingDiff: 8,
      },
      {
        id: 'b',
        opponent: 'Coach-Levy',
        timeControl: 'rapid',
        result: 'loss',
        timestamp: unix(2),
        rating: 392,
        ratingDiff: -8,
      },
      {
        id: 'c',
        opponent: 'Coach-Levy',
        timeControl: 'rapid',
        result: 'win',
        timestamp: unix(4),
        rating: 400,
        ratingDiff: 8,
      },
      {
        id: 'd',
        opponent: 'Coach-Levy',
        timeControl: 'daily',
        result: 'loss',
        timestamp: 1772507161,
        rating: 391,
        ratingDiff: 0,
      },
    ],
  },
  monkeyType: {
    typingStats: {
      recentTests: [
        {
          timestamp: iso(1),
          wpm: 154.42,
          accuracy: 99.23,
          language: 'english',
        },
        { timestamp: iso(2), wpm: 166.41, accuracy: 100, language: 'english' },
        // faster, but outside the window — must not win "best"
        { timestamp: iso(15), wpm: 180.5, accuracy: 98, language: 'english' },
      ],
    },
  },
  gists: {
    recentGists: [
      {
        id: 'g1',
        description: 'Ocean depth schema delta',
        created_at: iso(2),
        files: 5,
        html_url: 'https://gist.github.com/ejfox/g1',
      },
      {
        id: 'g2',
        description: 'Old gist',
        created_at: '2026-06-26T18:24:43Z',
        files: 1,
        html_url: 'https://gist.github.com/ejfox/g2',
      },
    ],
  },
  lastfm: {
    recentTracks: {
      tracks: [
        {
          name: 'Skanka',
          artist: { name: 'Hamdi', url: '' },
          url: '',
          date: { uts: String(unix(0.5)), '#text': '' },
          image: [],
        },
        {
          name: 'Counting',
          artist: { name: 'Hamdi', url: '' },
          url: '',
          date: { uts: String(unix(1)), '#text': '' },
          image: [],
        },
        {
          name: 'Nights',
          artist: { name: 'Frank Ocean', url: '' },
          url: '',
          date: { uts: String(unix(3)), '#text': '' },
          image: [],
        },
        {
          name: 'No date',
          artist: { name: 'Nobody', url: '' },
          url: '',
          image: [],
        },
        {
          name: 'Old',
          artist: { name: 'Old Band', url: '' },
          url: '',
          date: { uts: String(unix(40)), '#text': '' },
          image: [],
        },
      ],
    },
  },
  letterboxd: {
    films: [
      // watched "today" (UTC) — treated as a default date and skipped
      { title: 'Today Film', watchedDate: ymd(0), rating: 4 },
      { title: 'Recent Film', watchedDate: ymd(3), rating: 4.5 },
      { title: 'Another Recent', watchedDate: ymd(5), rating: 3 },
      { title: 'Poor Things (2023)', watchedDate: '2026-03-30', rating: 4.5 },
      { title: 'No Date', watchedDate: null, rating: 3 },
      { title: 'Garbage Date', watchedDate: 'not-a-date', rating: 3 },
      { title: 'Future Film', watchedDate: ymd(-4), rating: 3 },
    ],
  },
  rescueTime: {
    week: {
      summary: {
        productive: {
          time: {
            seconds: 112_000,
            minutes: 1866,
            hours: 31.4,
            hoursDecimal: 31.1,
            formatted: '31h 6m',
          },
          percentage: 57,
        },
      },
    },
  },
  website: {
    stats: {
      pageviews: { value: 1716, prev: 1248 },
    },
  },
} as unknown as StatsResponse
