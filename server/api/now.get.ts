/**
 * @file now.get.ts
 * @description The /now page as data: one line per thing, one thing per route,
 * newest first. The page renders this list as-is, so the rules live here:
 *
 *  1. One line per thing. `text` is a single line; the page truncates, never wraps.
 *  2. One thing per route. `label` is the route it links to (/blog, /rides…),
 *     or the service name for off-site sources (last.fm, mastodon…). The one
 *     exception: every open book on /reading gets its own line.
 *  3. Sorted by freshness. `at` is when the thing happened; undated live
 *     numbers (consulting slots, practice stats) sink to the bottom.
 *  4. A route with nothing to say is omitted, not padded. Stale lines stay,
 *     and the page dims them, because quiet is also news.
 *
 * /now is SSR per request; this cached handler (swr) is the only thing it
 * waits on, and each source fails alone: a dead vendor drops its line.
 * @endpoint GET /api/now
 */

export interface NowLine {
  label: string
  href: string
  text: string
  at: string | null
}

const DAY = 86_400_000
const REPO_WINDOW_DAYS = 14

// Vendor payloads are loosely shaped; every read below is optional-chained
const value = (r: PromiseSettledResult<any>): any =>
  r.status === 'fulfilled' ? r.value : null
const firstLine = (s = '') => s.split('\n')[0].trim()
const iso = (d: unknown) => {
  const t = typeof d === 'number' ? d : Date.parse(String(d ?? ''))
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}
const newest = (xs: any[], date: (x: any) => unknown): any =>
  xs
    .filter((x) => iso(date(x)))
    .sort((a, b) => Date.parse(iso(date(b))!) - Date.parse(iso(date(a))!))[0]

// Dev-only: NOW_DATA_ORIGIN=https://ejfox.com previews against production
// data, since a local .env rarely has every vendor token.
const origin = (import.meta.dev && process.env.NOW_DATA_ORIGIN) || ''
const get = (path: string, local = false) =>
  $fetch<any>(`${local ? '' : origin}${path}`, { timeout: 15000 })

export default defineCachedEventHandler(
  async () => {
    const results = await Promise.allSettled([
      get('/api/manifest'),
      get('/api/stats'),
      get('/api/github'),
      get('/api/photos'),
      get('/api/rides'),
      get('/api/scraps'),
      get('/api/gists'),
      get('/api/gear'),
      get('/api/predictions'),
      get('/api/availability'),
      get('/api/mastodon', true),
      get('/api/x', true),
      get('/api/letterboxd'),
      get('/api/wiki'),
      get('/api/dispatch'),
    ])
    const [
      manifest,
      stats,
      github,
      photos,
      rides,
      scraps,
      gists,
      gear,
      predictions,
      availability,
      mastodon,
      x,
      letterboxd,
      wiki,
      dispatch,
    ] = results.map(value)

    const lines: NowLine[] = []
    const add = (line: NowLine | null | false | undefined) => {
      if (line && line.text) lines.push(line)
    }
    const now = Date.now()

    // ── Writing ──
    const posts: any[] = Array.isArray(manifest) ? manifest : []
    const post = (re: RegExp) =>
      newest(
        posts.filter((p) => re.test(p.slug)),
        (p) => p.date || p.metadata?.date
      )
    const essay = post(/^\d{4}\//)
    add(
      essay && {
        label: '/blog',
        href: `/blog/${essay.slug}`,
        text: essay.title,
        at: iso(essay.date || essay.metadata?.date),
      }
    )
    const weekNote = post(/^week-notes\//)
    add(
      weekNote && {
        label: '/week-notes',
        href: `/blog/${weekNote.slug}`,
        text: `Week note ${weekNote.title}`,
        at: iso(weekNote.date),
      }
    )
    const project = post(/^projects\//)
    add(
      project && {
        label: '/projects',
        href: `/${project.slug}`,
        text: project.title,
        at: iso(project.date || project.metadata?.date),
      }
    )
    const piece = newest(Array.isArray(dispatch) ? dispatch : [], (d) => d.date)
    add(
      piece && {
        label: '/dispatch',
        href: `/dispatch/${piece.slug}`,
        text: piece.title,
        at: iso(piece.date),
      }
    )

    // ── Reading: every open book ──
    for (const b of stats?.goodreads?.currentlyReading || []) {
      add({
        label: '/reading',
        href: b.goodreadsUrl?.split('?')[0] || '/reading',
        text: `${b.title.split(':')[0]}, ${b.author}`,
        at: iso(b.dateAdded),
      })
    }

    // ── Code ──
    const commits: any[] = [...(github?.detail?.commits || [])].sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)
    )
    const recentRepos = [
      ...new Set(
        commits
          .filter(
            (c) => now - Date.parse(c.occurredAt) < REPO_WINDOW_DAYS * DAY
          )
          .map((c) => c.repository?.name)
          .filter(Boolean)
      ),
    ]
    if (commits[0]) {
      const repos = recentRepos.length
        ? recentRepos
        : [commits[0].repository?.name]
      add({
        label: '/github',
        href: '/github',
        text: `${repos.length} ${repos.length === 1 ? 'repo' : 'repos'} touched: ${repos.join(', ')}`,
        at: commits[0].occurredAt,
      })
    }
    const siteCommit = commits.find((c) => c.repository?.name === 'website2')
    add(
      siteCommit && {
        label: '/changelog',
        href: '/changelog',
        text: firstLine(siteCommit.message),
        at: siteCommit.occurredAt,
      }
    )
    const gist = newest(Array.isArray(gists) ? gists : [], (g) => g.updated_at)
    add(
      gist && {
        label: '/gists',
        href: '/gists',
        text: firstLine(gist.description) || Object.keys(gist.files || {})[0],
        at: iso(gist.updated_at),
      }
    )

    // ── Saving / making / moving ──
    const scrap = newest(
      Array.isArray(scraps) ? scraps : [],
      (s) => s.created_at
    )
    add(
      scrap && {
        label: '/scraps',
        href: '/scraps',
        text: firstLine(scrap.title || scrap.summary || scrap.url || ''),
        at: iso(scrap.created_at),
      }
    )
    const photo = newest(photos?.photos || [], (p) => p.date)
    add(
      photo && {
        label: '/photos',
        href: '/photos',
        text: photo.description || 'Posted a photo',
        at: iso(photo.date),
      }
    )
    const ride = newest(
      Array.isArray(rides) ? rides : [],
      (r) => r.startTime || r.date
    )
    add(
      ride && {
        label: '/rides',
        href: `/rides/${ride.slug}`,
        text: ride.stats?.distanceMeters
          ? `${ride.title}, ${Math.round(ride.stats.distanceMeters / 1609.34)} mi`
          : ride.title,
        at: iso(ride.startTime || ride.date),
      }
    )
    const item = newest(gear?.items || [], (g) => g.Purchase_Date)
    add(
      item && {
        label: '/gear',
        href: '/gear',
        text: `Bought ${item.Name}`,
        at: iso(item.Purchase_Date),
      }
    )

    // ── Thinking: the open bet closest to resolving ──
    const bet = (Array.isArray(predictions) ? predictions : [])
      .filter(
        (p) =>
          !p.resolved &&
          (p.visibility || 'public') === 'public' &&
          Date.parse(p.deadline) > now
      )
      .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))[0]
    if (bet) {
      const last = bet.updates?.at?.(-1)
      add({
        label: '/predictions',
        href: `/predictions/${bet.slug}`,
        text: `${last?.confidenceAfter ?? bet.confidence}%: ${bet.statement}`,
        at: iso(last?.timestamp || bet.created),
      })
    }

    // ── Off-site ──
    const recent = stats?.lastfm?.recentTracks
    const track = (Array.isArray(recent) ? recent : recent?.tracks)?.[0]
    if (track) {
      const artist =
        track.artist?.name || track.artist?.['#text'] || track.artist
      add({
        label: 'last.fm',
        href: track.url,
        text: `${track.name}, ${artist}`,
        at:
          track['@attr']?.nowplaying === 'true'
            ? new Date().toISOString()
            : iso(Number(track.date?.uts) * 1000),
      })
    }
    for (const [label, feed] of [
      ['mastodon', mastodon],
      ['x', x],
    ] as const) {
      const p = feed?.posts?.[0]
      add(p && { label, href: p.url, text: p.text, at: iso(p.at) })
    }
    const film = letterboxd?.films?.[0]
    add(
      film && {
        label: 'letterboxd',
        href: film.link || film.url || 'https://letterboxd.com/ejfox/',
        text: film.rating ? `${film.title}, ${film.rating}★` : film.title,
        at: iso(film.watchedDate || film.date),
      }
    )

    // ── Undated live numbers (sink to the bottom) ──
    if (availability?.known) {
      add({
        label: '/consulting',
        href: '/consulting',
        text:
          availability.openSlots > 0
            ? `${availability.openSlots} of ${availability.capacity} client slots open`
            : 'Fully booked',
        at: null,
      })
    }
    if (wiki?.edits30d) {
      const edits = wiki.capped ? `${wiki.edits30d}+` : wiki.edits30d
      add({
        label: 'wiki',
        href: 'https://archive.ejfox.com',
        text: `${edits} edits, ${wiki.newPages30d} new pages in 30 days`,
        at: null,
      })
    }
    const practice = [
      stats?.chess?.currentRating?.blitz &&
        `${stats.chess.currentRating.blitz} blitz`,
      stats?.monkeyType?.typingStats?.averageWpm &&
        `${Math.round(stats.monkeyType.typingStats.averageWpm)} wpm`,
      stats?.duolingo?.streak > 0 &&
        `${stats.duolingo.streak}-day Duolingo streak`,
    ].filter(Boolean)
    add(
      practice.length > 0 && {
        label: '/stats',
        href: '/stats',
        text: practice.join(', '),
        at: null,
      }
    )

    lines.sort((a, b) => {
      if (!a.at || !b.at) return a.at ? -1 : b.at ? 1 : 0
      return Date.parse(b.at) - Date.parse(a.at)
    })

    return { generated: new Date().toISOString(), lines }
  },
  { maxAge: 300, swr: true, name: 'now-lines' }
)
