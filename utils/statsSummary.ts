/**
 * @file statsSummary.ts
 * @description The gonzo "This week I've …" sentence at the top of /stats,
 * built from the /api/stats payload. Pure: same stats + same `now` → same
 * string. Clauses link to the page's section anchors, so the result is HTML
 * (rendered with v-html). Used by pages/stats.vue.
 * Gotcha: values are interpolated into that HTML unescaped (e.g. the
 * Last.fm artist name).
 */
import type { StatsResponse } from '~/types/stats'
import { formatNumber } from '~/utils/numberFormat'

export interface StatsSummary {
  text: string
}

// Pluralization helper
const pluralize = (count: number, singular: string, plural?: string) => {
  if (count === 1) return `${count} ${singular}`
  return `${count} ${plural || singular + 's'}`
}

// Helper to create summary links
const link = (href: string, text: string) =>
  `<a href="#${href}" class="underline ">${text}</a>`

// Data-driven gonzo summary sentence generator
export function buildStatsSummary(
  stats: StatsResponse | null | undefined,
  now: Date = new Date()
): StatsSummary {
  if (!stats) return { text: '' }

  const nowMs = now.getTime()
  const oneWeekAgo = () => {
    const weekAgo = new Date(nowMs)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return weekAgo
  }

  const blog = stats.blog
  const github = stats.github?.detail?.commits
  const leetcode = stats.leetcode?.recentSubmissions
  const chess = stats.chess?.recentGames
  const monkeyType = stats.monkeyType?.typingStats
  const gists = stats.gists?.recentGists
  const lastfm = stats.lastfm?.recentTracks?.tracks
  const letterboxd = stats.letterboxd?.films
  const rescueTime = stats.rescueTime?.week
  const website = stats.website?.stats

  // ── One clause per source, each limited to the last 7 days ──
  const clauses = []

  // Writing activity - check recent posts (last 7 days)
  if (blog?.recentPosts?.length) {
    const recentPosts = blog.recentPosts.filter((post) => {
      const postDate = new Date(post.date)
      return postDate >= oneWeekAgo()
    })
    if (recentPosts.length > 0) {
      const totalWords = recentPosts.reduce(
        (sum, post) => sum + (post.words || 0),
        0
      )
      const postsPlural = pluralize(recentPosts.length, 'post')
      const formattedWords = formatNumber(totalWords)
      const writingText = `${formattedWords} words across ${postsPlural}`
      clauses.push(`${link('writing', 'written')} ${writingText}`)
    }
  }

  // Recent GitHub commits (last 7 days)
  if (github?.length) {
    const recentCommits = github.filter((commit) => {
      const commitDate = new Date(commit.occurredAt)
      return commitDate >= oneWeekAgo()
    })
    if (recentCommits.length > 0) {
      clauses.push(`made ${recentCommits.length} ${link('github', 'commits')}`)
    }
  }

  // Recent LeetCode activity
  if (leetcode?.length) {
    const recent = leetcode.filter((sub) => {
      // Convert Unix timestamp to milliseconds if needed
      const timestamp =
        sub.timestamp.toString().length === 10
          ? Number.parseInt(sub.timestamp) * 1000
          : Number.parseInt(sub.timestamp)
      const subDate = new Date(timestamp)
      // Filter out future dates (bad data) and only get last week's activity
      return subDate >= oneWeekAgo() && subDate <= new Date(nowMs)
    })
    if (recent.length > 0) {
      clauses.push(
        `${link('leetcode', 'solved')} ${recent.length} coding problems`
      )
    }
  }

  // Recent chess games
  if (chess?.length) {
    const recentGames = chess.filter((game) => {
      const gameDate = new Date(game.timestamp * 1000)
      return gameDate >= oneWeekAgo()
    })
    if (recentGames.length > 0) {
      const wins = recentGames.filter((g) => g.result === 'win').length
      const winText = wins === 1 ? 'win' : 'wins'
      const gameText = `chess games (${wins} ${winText})`
      clauses.push(
        `${link('chess', 'played')} ${recentGames.length} ${gameText}`
      )
    }
  }

  // Typing activity - check if we have recent tests
  if (monkeyType?.recentTests?.length) {
    const recent = monkeyType.recentTests.filter((test) => {
      const testDate = new Date(test.timestamp)
      return testDate >= oneWeekAgo()
    })
    if (recent.length > 0) {
      const bestRecent = Math.max(...recent.map((t) => t.wpm))
      clauses.push(`${link('typing', 'typed')} at ${bestRecent} WPM`)
    }
  }

  // Recent gists (last 7 days)
  if (gists?.length) {
    const recentGists = gists.filter((gist) => {
      const gistDate = new Date(gist.created_at)
      return gistDate >= oneWeekAgo()
    })
    if (recentGists.length > 0) {
      clauses.push(`created ${recentGists.length} ${link('gists', 'gists')}`)
    }
  }

  // Recent music listening (last.fm recent tracks)
  if (lastfm?.length && lastfm[0]?.date) {
    const recentTracks = lastfm.filter((track) => {
      if (!track.date) return false
      const trackDate = new Date(Number.parseInt(track.date.uts) * 1000)
      return trackDate >= oneWeekAgo()
    })
    if (recentTracks.length > 0) {
      const topArtist = recentTracks[0]?.artist?.name
      const artistNote = topArtist ? ` (mostly ${topArtist})` : ''
      const musicText = `listened to ${recentTracks.length}`
      clauses.push(`${musicText} ${link('music', 'tracks')}${artistNote}`)
    }
  }

  // Recent movies (letterboxd films) - only if watched in last week
  if (letterboxd?.length) {
    const recentFilms = letterboxd.filter((film) => {
      // Skip films with invalid or default dates
      if (
        !film.watchedDate ||
        film.watchedDate === new Date(nowMs).toISOString().split('T')[0]
      ) {
        return false
      }
      const filmDate = new Date(film.watchedDate)
      // Check if date is valid
      if (Number.isNaN(filmDate.getTime())) {
        return false
      }
      const isInFuture = filmDate > new Date(nowMs)
      return filmDate >= oneWeekAgo() && !isInFuture
    })
    if (recentFilms.length > 0) {
      clauses.push(`watched ${recentFilms.length} ${link('movies', 'films')}`)
    }
  }

  // RescueTime productive hours this week
  if (rescueTime?.summary?.productive?.time?.hours) {
    const productiveHours = Math.round(rescueTime.summary.productive.time.hours)
    if (productiveHours > 0) {
      clauses.push(
        `logged ${productiveHours} ${link('productivity', 'productive hours')}`
      )
    }
  }

  // Website stats (if we have comparison data)
  if (website?.pageviews?.value && website?.pageviews?.prev) {
    const current = website.pageviews.value
    const previous = website.pageviews.prev
    const change = current - previous
    if (Math.abs(change) > 0) {
      const direction = change > 0 ? 'gained' : 'lost'
      clauses.push(
        `${direction} ${Math.abs(change)} ${link('website', 'pageviews')}`
      )
    }
  }

  // Gear optimization - only if added items in past month
  // Skip for now - no temporal data available to determine recent additions

  // ── Join into a sentence ────────────────────────────────────
  if (clauses.length === 0) {
    return {
      text: 'Monitoring systems, collecting data, optimizing workflows.',
    }
  }

  // Join clauses into a flowing sentence
  let sentence = "This week I've "
  if (clauses.length === 1) {
    sentence += clauses[0] + '.'
  } else if (clauses.length === 2) {
    sentence += clauses[0] + ' and ' + clauses[1] + '.'
  } else {
    sentence +=
      clauses.slice(0, -1).join(', ') +
      ', and ' +
      clauses[clauses.length - 1] +
      '.'
  }

  return { text: sentence }
}
