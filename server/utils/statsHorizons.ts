/**
 * @file statsHorizons.ts
 * @description Composes the raw /api/stats vendor fan-out into a single life seen at
 * five shutter speeds: now / today / week / year / ever. The vendor handlers are the
 * automated substrate; this is the hand-made composition on top.
 *
 * Conventions (deliberate, not incidental):
 *  - `now` speaks in present-tense verbs (listening, reading, making); every other
 *    horizon speaks in domain nouns (body, music, code…). The grammar encodes time.
 *  - Units live in the field name (_bpm, _min, _wpm, _hours, _lbs).
 *  - null ≠ 0. null means "no signal / unknown"; 0 means "genuinely nothing".
 *  - Silence is named, not hidden: `quiet` lists domains with no signal this window.
 *  - No vendor exhaust. Raw detail stays at its own endpoints; `_sources` is a
 *    transitional escape-hatch for consumers still on the old shape.
 */

// A number if finite, otherwise null (preserves the null≠0 distinction).
const num = (x: unknown): number | null =>
  typeof x === 'number' && Number.isFinite(x) ? x : null
// Round to `p` decimals, or null if not a usable number.
const round = (x: unknown, p = 0): number | null => {
  const n = num(x)
  if (n === null) return null
  const f = 10 ** p
  return Math.round(n * f) / f
}
// First defined value, else null.
const first = <T>(...xs: (T | undefined | null)[]): T | null => {
  for (const x of xs) if (x !== undefined && x !== null) return x
  return null
}

export interface StatsHorizons {
  _: string
  generated: string
  tz: string
  quiet: string[]
  now: Record<string, unknown>
  today: Record<string, unknown>
  week: Record<string, unknown>
  year: Record<string, unknown>
  ever: Record<string, unknown>
}

export function buildStatsHorizons(
  d: Record<string, any>,
  generatedISO: string,
  tz = 'America/New_York'
): StatsHorizons {
  const health = d.health ?? null
  const lastfm = d.lastfm ?? null
  const github = d.github ?? null
  const monkey = d.monkeyType ?? null
  const film = d.letterboxd ?? null
  const books = d.goodreads ?? null
  const chess = d.chess ?? null
  const discogs = d.discogs ?? null
  const duo = d.duolingo ?? null
  const gear = d.gear ?? null
  const wiki = d.wiki ?? null
  const reach = d.reach ?? null
  const photos = d.photos ?? null
  const week = d.weeklySummary ?? {}

  const track = lastfm?.recentTracks?.tracks?.[0] ?? null
  const topArtists: string[] = (lastfm?.topArtists?.artists ?? [])
    .slice(0, 3)
    .map((a: any) => a?.name)
    .filter(Boolean)
  // "loved" = highest-rated among the recent films we have.
  const lovedFilm =
    (film?.films ?? [])
      .filter((f: any) => typeof f?.rating === 'number')
      .sort((a: any, b: any) => b.rating - a.rating)[0]?.title ?? null

  // The shape of the work: commit types (feat/fix/docs) and what languages get typed.
  const commitKinds: Record<string, number> = {}
  for (const c of (github?.detail?.commitTypes ?? []).slice(0, 6)) {
    if (c?.type) commitKinds[c.type] = c.count
  }
  const typingLangs: Record<string, number> = {}
  for (const l of monkey?.typingStats?.languageBreakdown ?? []) {
    if (l?.language) {
      const key = l.language.replace(/^code_/, '').replace(/_/g, ' ')
      typingLangs[key] = l.averageWpm
    }
  }
  const sensory = health?.sensory ?? null

  const now = {
    heartbeat_bpm: round(health?.heartRate?.current),
    breathing_rate: round(sensory?.respiratoryRate),
    blood_oxygen_pct: round(sensory?.bloodOxygenPct),
    listening: track
      ? {
          track: track.name ?? null,
          artist: track.artist?.name ?? null,
          at: track.date?.uts
            ? new Date(Number(track.date.uts) * 1000).toISOString()
            : null,
        }
      : null,
    reading: (books?.currentlyReading ?? [])
      .map((b: any) => b?.title)
      .filter(Boolean),
    making: github?.detail?.commits?.[0]?.repository?.name
      ? { repo: github.detail.commits[0].repository.name }
      : null,
  }

  const today = {
    body: {
      steps: round(health?.today?.steps),
      exercise_min: round(health?.today?.exerciseMinutes),
      stand_hours: round(health?.today?.standHours),
    },
    sleep: health?.sleep?.lastNight
      ? {
          asleep_hours: round(health.sleep.lastNight.asleepHours, 2),
          in_bed_hours: round(health.sleep.lastNight.inBedHours, 2),
          efficiency: round(health.sleep.lastNight.efficiency, 2),
        }
      : null,
  }

  const weekH = {
    body: {
      steps: round(health?.thisWeek?.steps),
      exercise_min: round(health?.thisWeek?.exerciseMinutes),
      avg_daily_steps: round(health?.averages?.dailySteps),
    },
    music: {
      scrobbles: num(week.scrobblesThisWeek),
      top_artist: first(week.topArtists?.[0]?.name, topArtists[0]),
    },
    code: {
      commits: num(week.commits),
      top_repos: week.topRepos ?? [],
      kinds: commitKinds,
    },
    screen: {
      productive_hours: week.productiveHours
        ? round(week.productiveHours, 1)
        : null,
      productivity_pct: week.productivityPercent || null,
    },
    senses: {
      daylight_min_per_day: round(sensory?.daylightMinPerDay),
      ambient_db: round(sensory?.ambientDb),
      mindful_min: round(sensory?.mindfulMin30d),
    },
    knowledge: {
      wiki_edits: num(wiki?.edits30d),
      wiki_new_pages: num(wiki?.newPages30d),
    },
    reach: {
      visitors: num(reach?.week?.visitors),
      pageviews: num(reach?.week?.pageviews),
      top_post: reach?.topPosts?.[0]?.path ?? null,
    },
  }

  const year = {
    film: {
      watched: num(film?.stats?.thisYear),
      loved: lovedFilm,
    },
    books: {
      finished: num(books?.stats?.booksThisYear),
      reading_now: (books?.currentlyReading ?? []).length || null,
    },
    music: { top_artists: topArtists },
    code: {
      contributions: num(github?.stats?.totalContributions),
      repos: num(github?.stats?.totalRepos),
    },
    body: { steps: round(health?.thisYear?.steps) },
    photography: {
      frames: num(photos?.total),
      latest_frame: photos?.photos?.[0]?.date ?? null,
    },
  }

  const ever = {
    typing: {
      best_wpm: round(monkey?.typingStats?.bestWPM, 2),
      avg_wpm: round(monkey?.typingStats?.averageWpm),
      tests: num(monkey?.typingStats?.testsCompleted),
      langs: typingLangs,
    },
    music: { scrobbles: num(lastfm?.stats?.totalScrobbles) },
    chess: {
      blitz: num(chess?.currentRating?.blitz),
      rapid: num(chess?.currentRating?.rapid),
    },
    carry: {
      items: num(gear?.stats?.totalItems),
      weight_lbs: round(gear?.stats?.totalWeight, 1),
      containers: num(gear?.stats?.containerCount),
      by_type: gear?.typeDistribution ?? null,
      starred: (gear?.starred?.items ?? []).slice(0, 5),
    },
    records: { collection: num(discogs?.stats?.totalItems) },
    knowledge: {
      wiki_pages: num(wiki?.pages),
      wiki_articles: num(wiki?.articles),
      wiki_edits_all_time: num(wiki?.editsAllTime),
    },
    duolingo: {
      xp: num(duo?.totalXp),
      course: duo?.currentCourse?.title ?? null,
      streak_days: num(duo?.streak),
    },
    online_since: 2009,
  }

  // Name the silence. A domain is quiet when its signal is absent or zero.
  const quiet: string[] = []
  if (!num(discogs?.stats?.totalItems)) quiet.push('records')
  if (!num(week.productiveHours)) quiet.push('screen')
  if (!num(week.wordsWritten) && !num(week.postsPublished))
    quiet.push('writing')
  if (!num(duo?.streak)) quiet.push('duolingo-streak')
  if (!num(film?.stats?.thisMonth)) quiet.push('film-this-month')
  if (!wiki) quiet.push('wiki')
  if (!reach) quiet.push('reach')
  if (!num(photos?.total)) quiet.push('photos')

  return {
    _: 'ejfox — a life in numbers · refreshed by machines, composed by hand',
    generated: generatedISO,
    tz,
    quiet,
    now,
    today,
    week: weekH,
    year,
    ever,
  }
}
