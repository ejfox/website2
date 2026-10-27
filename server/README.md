# server/ — API route inventory

Every server route, what it does, who calls it, and what it needs. Kept honest by
`server/api/__tests__/no-orphan-routes.test.ts`, which fails if a route exists with
no caller and isn't allowlisted. **When you add a route, add a row here.**

- **Consumer** — `page/component` = called by the frontend; `stats` /
  `stats-lite` = imported directly by the aggregator handler (not a URL fetch);
  `external` = hit from outside the app (uptime, iOS, webhooks, AI agents).
- **Health** — `OK` functional; `EMPTY-CATCH` swallows upstream errors and returns
  `[]`/`{}` (resilient, but hides breakage); `fragile` throws if a data file is
  missing (files exist today).

## Content & blog

| Route | Purpose | Consumer | Reads |
|---|---|---|---|
| `posts/[...slug]` | Blog post by slug (privacy + draft guard) | `pages/blog`, `projects` | `content/processed/*.json` |
| `manifest` | Listable posts (`isListable`: drops draft/hidden/unlisted/pw/scheduled + `drafts/`) | many pages | `manifest-lite.json` |
| `projects` | Projects sorted by date (`?slim` = card shape, no html) | `pages/projects` | manifest + JSON |
| `reading` | Books w/ random highlight | `pages/reading`, `now` | `content/processed/reading` + `data/reading-kindle.json` |
| `reading/[slug]` | Single book | `pages/reading`, `now` | reading JSON + `data/reading-kindle.json` |
| `scraps` | Shared scraps (500 newest, 1h cache) | `pages/scraps`, `scraps/tag`, `now` | Supabase (`shared=true`) |
| `scraps/by-tags` | Scraps matching tags | `pages/blog`, `scraps` | Supabase |
| `scraps/tags` | All unique scrap tags (no `shared` filter) | public API | Supabase |
| `scraps/graph` | Slim shared-scraps list (500, trimmed fields) | `pages/threads`, `pages/tag` | Supabase (`shared=true`, 10-min cache) |
| `search` | BM25 full-text search (`?q=&limit=`), uncached | public API | `content/processed` |
| `suggest` | AI tag/summary for a scrap | `bookmarklet-popup` | processed posts + `public/tags.json` + OpenRouter (`SCRAP_ENLIGHTENER_AUTH`) |
| `temporal-context` | Everything around a date | `useTemporalContext` | reading + predictions + Supabase (no `shared` filter) + `data/github-commits.json` |
| `on-this-day` | Historical context by month/day | `pages/on-this-day` | `data/on-this-day/*.json` |
| `changelog` | Git changelog + stats | `pages/changelog` | `data/changelog.json` |
| `robots/[...slug]` | AI-readable robot notes | `useProcessedMarkdown` | processed + `content/blog/robots` |
| `wiki` | Personal MediaWiki stats | `stats` (import), `now` | archive.ejfox.com API (EMPTY-CATCH → `null`) |
| `external-links` | Dedup'd outbound links | `pages/external-links` | `data/external_links_final.csv` |
| `blogroll` | RSS feeds from newsboat config | `pages/following` | `data/blogroll.urls` |
| `webmentions` | Webmentions (moderated) | `Webmentions.vue` | webmention.io + moderation JSON |
| `og` | Open Graph metadata fetch | `ReplyContextItem` +2 | external HTTP (5-min cache) |
| `highlight` (POST) | Server-side Shiki highlighting | `GistPreview.vue` | Shiki |
| `predictions` | All predictions (`visibility` not filtered) | `pages/predictions`, `now` | `content/predictions/*.md` |
| `predictions/[id]` | One prediction, evidence rendered to HTML (read-only; non-GET = 405) | `pages/predictions` | `content/predictions/*.md` |
| `calibration` | Brier scores (as signed + as updated) + accuracy | `useCalibration` | `data/calibration-analysis.json` (EMPTY-CATCH) |
| `words-this-month` | Monthly post/word count | `blog-stats` | manifest (returns `{ error }` on failure) |
| `dispatch` | Dispatch pieces, newest first (dev also lists drafts) | `pages/dispatch`, `now` | `content/dispatch/*.md` |
| `dispatch/[slug]` | One Dispatch piece, body rendered | `pages/dispatch/[slug]` | `content/dispatch/*.md` |
| `now` | The /now page as dated lines | `pages/now` | fans out to 15 routes (5-min swr cache) |
| `apps` | EJ's apps + live App Store details | `pages/apps`, `projects/[slug]` | `data/apps.json` + iTunes lookup (6h cache) |
| `mastodon` | Latest public top-level toots | `now` | mastodon.social public API (15-min cache) |
| `x` | Latest original X posts | `now` | `X_BEARER_TOKEN` (dormant without it; 1h cache) |
| `paperclip` | Presence emoji for SSR first paint | `PaperclipStatus.vue` | getpaperclipped.com (60s cache) |
| `keymap` | ZSA Voyager keymap | `pages/keymap` | Oryx (1h cache) |

## Photos & gear

| Route | Purpose | Consumer | Reads |
|---|---|---|---|
| `photos` | Photo-blog images | `pages/photos` | Cloudinary |
| `photo-posts` | Photo-type posts (no body) | `pages/photos` | manifest + JSON |
| `photo-exif` | Photo EXIF (`?id=`) | `pages/photos/[id]` | Cloudinary (24h cache) |
| `gear` | All gear items | `pages/gear` +9 | `data/gear.csv` (every column, incl. `Location_*`) |
| `gear/[slug]` | One gear item | `pages/gear/[slug]` | `data/gear.csv` |
| `gear-csv` | Raw CSV export | `pages/gear` | `data/gear.csv` |
| `gear-posts/[slug]` | Posts tagged w/ a gear item | `pages/gear/[slug]` | manifest (EMPTY-CATCH) |
| `gear-stats` | Pack weight + item count | `stats`, `stats-lite` (import) | `data/gear.csv` |

## Valley Atlas & rides

Atlas layers read EJ's smallweb apps (`<app>.tools.ejfox.com`, via
`server/utils/smallweb.ts`) or public feeds, and pass on whitelisted fields only.
Each source fails alone: last good copy (or empty) plus an `errors` entry.
`atlas/private/*` 404 unless the browser holds the cookie set by `atlas/unlock`
(`ATLAS_PRIVATE_TOKEN`; see `server/utils/atlasPrivate.ts`). They are plain
handlers on purpose: a cached handler could answer without running the gate.

| Route | Purpose | Consumer | Reads |
|---|---|---|---|
| `atlas` | Base overlays: places, repeaters, ride lines | `pages/atlas` | `data/atlas/*` + `content/processed/rides` |
| `atlas/live` | River gauges, tides, Metro-North trains | `pages/atlas` | USGS, NWS, NOAA CO-OPS, MTA GTFS-rt (30s swr) |
| `atlas/history` | Revolutionary War battles, positions, routes, fields | `utils/atlas/layers/revolution` | hudsonmaps (30-min swr) |
| `atlas/news` | Local headlines grouped by town | `pages/atlas` | countywatch (5-min swr) |
| `atlas/cameras` | Public DOT traffic cameras | `pages/atlas` | camwatch (10 min) |
| `atlas/ships` | Working vessels on the Hudson | `pages/atlas` | riverwatch AIS (60s) |
| `atlas/remediation` | NYS DEC remediation sites | `pages/atlas` | data.ny.gov (24h) |
| `atlas/unlock` | Set the private-mode cookie (`?key=`), 302 to /atlas | EJ, by hand (passes the orphan test only via a comment in `atlasPrivate.ts`) | `ATLAS_PRIVATE_TOKEN` |
| `atlas/lock` | Clear the cookie, 302 to /atlas | `pages/atlas` | — |
| `atlas/private/status` | `{ private: boolean }` for this browser | `pages/atlas` | cookie |
| `atlas/private/signals` | 7 days of anomalywatch signals, home area dropped | `utils/atlas/layers/private` | anomalywatch + `ATLAS_HOME_EXCLUDE`, `ATLAS_HOME_TERMS` (fails closed) |
| `atlas/private/sky` | Aircraft density + notable military/gov aircraft | `utils/atlas/layers/private` | skywatch |
| `atlas/private/travels` | Coarse heat of time spent on trips (>7 days old) | `utils/atlas/layers/private` | travels + `ATLAS_HOME_EXCLUDE` (fails closed) |
| `rides` | Processed rides index | `pages/rides`, `now` | `content/processed/rides/index.json` (EMPTY-CATCH) |
| `rides/[slug]` | One ride (track + moments + stats) | `pages/rides/[slug]` | `content/processed/rides/<slug>.json` |
| `rides-atlas` | All-rides atlas plate | `pages/rides` | `content/processed/rides/atlas.json` (`null` if missing) |

## Flashcards

| Route | Purpose | Consumer | Reads |
|---|---|---|---|
| `flashcards` | List decks | `pages/flashcards` | `public/data/flashcards/*.csv` |
| `flashcards/[id]` | One deck | `pages/flashcards` | flashcard CSVs |

> Removed 2026-07: `flashcards/random`, `flashcards/random/[id]`, `flashcards/search`,
> `flashcards/stats` — orphaned since Dec 2025, no callers.

## Stats & personal metrics

`stats` and `stats-lite` are aggregators — they **import the source handlers
directly** (`import discogsHandler from './discogs.get'`), so the sources below
have no URL caller but are very much alive.

| Route | Purpose | Consumer | Upstream |
|---|---|---|---|
| `stats` | Unified stats (17+ sources) | `pages/stats`, `consulting` +11 | imports handlers below |
| `stats-lite` | Tiny stats for iOS Shortcuts | external (iOS) | imports a subset |
| `github` | Contributions/commits (public repos only) | `pages/index`, `now`, `stats`, `stats-lite` | `GITHUB_TOKEN` (10-min swr cache) |
| `github-commits` | Pre-cached commits | `pages/stats` | `data/github-commits.json` (fragile) |
| `github-repos-list` | Cached repo list | `pages/github/[slug]` | `data/github-repos-list.json` |
| `github/activity` | Commit heatmap (built once at boot) | `pages/github` | `data/github-commits.json` |
| `gists` | Public gist list, uncached | `pages/gists`, `now` | `GITHUB_TOKEN` |
| `gist-stats` | Gist language stats | `stats` (import) | calls `/api/gists` |
| `repos/[slug]` | One repo detail | `pages/github/[slug]` | `data/github-repos/*.json` + `data/github-commits.json` (pre-generated, no live GitHub) |
| `chess` | Chess.com ratings | `stats`, `stats-lite` (import) | `CHESS_USERNAME` |
| `lastfm` | Scrobbles/top artists | `stats-lite` (import) | `LASTFM_API_KEY` (EMPTY-CATCH) |
| `letterboxd` | Films watched | `stats`, `stats-lite` (import), `now` | RSS (15-min cache, EMPTY-CATCH) |
| `goodreads` | Books read | `stats` (import) | RSS (EMPTY-CATCH) |
| `discogs` | Vinyl collection | `stats-lite` (import) | `DISCOGS_TOKEN` (EMPTY-CATCH) |
| `duolingo` | Language streak/XP | `stats` (import) | public API |
| `leetcode` | Problems solved | `stats` (import) | LeetCode GraphQL (stale-while-error) |
| `monkeytype` | Typing WPM | `stats` (import) | `MONKEYTYPE_TOKEN` (disk-cached) |
| `rescuetime` | Productivity time | `stats-lite` (import) | `RESCUETIME_TOKEN` |
| `apple-health` | Health metrics | `stats` (import) | `HEALTH_WEBHOOK_SECRET` |
| `blog-stats` | Monthly writing | `stats`, `stats-lite` (import) | calls `/api/words-this-month` |
| `reach` | Site visitors/pageviews | `stats` (import) | `UMAMI_DATABASE_URL` (Postgres) |
| `website-stats` | Site-wide analytics | `stats`, `stats-lite` (import), `UmamiStats.vue` | `UMAMI_DATABASE_URL` (Postgres) |
| `umami/stats` | Per-page views (`?url=`) | public API | `UMAMI_*` → umami.tools.ejfox.com |
| `weekly-summary` | Per-week aggregate (`?week=`) | Sunday Interview skill | calls 9 other routes |

## Availability, consulting & infra

| Route | Purpose | Consumer | Notes |
|---|---|---|---|
| `cal/available-slots` | Next 3 booking slots | `pages/calendar`, `consulting`, `NextAvailableSlot` | `CAL_COM_API_KEY` |
| `cal/availability` | Quarterly capacity (fails open: reports all slots free) | **none** — superseded, kept | `CAL_COM_API_KEY` |
| `consulting-availability` | Hand-curated quarterly availability | `pages/consulting` | `data/consulting-availability.json` |
| `availability` | Open client slots (fails closed → `{ known: false }`) | `pages/projects`, `now` | `data/availability.json` |
| `webhooks/calcom` (POST) | Booking funnel events | external (Cal.com) | HMAC-verified; appends `data/calcom-events.jsonl` + `pm2 logs` |
| `agent/meta` | API discovery for AI agents | external | hardcoded schema |
| `agent/timeline` | Chronological feed for AI agents | external | manifest + predictions + reading |
| `healthcheck` | Uptime/health | external (monitor) | pings `/api/manifest` |
| `build-info` | Commit hash / build date | `Footer.vue` | baked at build time |
| `_dev/changes` | Changed files → routes for the dev HUD (404 in production) | `ChangedRoutesHud.client.vue` | `git` |

## External API surface (works, reachable, no on-site caller by design)

These have no page/component calling them, but they're verified working and kept
as public API — hit directly, by a skill, or reserved for a future UI. Allowlisted
in the orphan test with a reason so they don't read as accidental orphans.

- **`search`** — `GET /api/search?q=code&limit=3` returns ranked snippets over
  processed content. No on-site search box wired yet; the API is live.
- **`scraps/tags`** — sorted, deduped scrap tag vocabulary (companion to
  `scraps/by-tags`). Empty locally only because Supabase creds aren't set in dev.
- **`umami/stats`** — the HTTP-API analytics path against the live
  `umami.tools.ejfox.com` instance (heartbeat OK). Parallel to the Postgres
  `reach`/`website-stats` path; both are valid, they just read the same data two
  ways. Logs in server-side; the token never leaves the server. Needs
  `UMAMI_USERNAME/PASSWORD`. (`umami/auth`, which returned that token to any
  caller, was deleted 2026-10-27.)
- **`weekly-summary`** — `GET /api/weekly-summary?week=2026-W05` aggregates a
  week across GitHub/RescueTime/health/chess/… for the **Sunday Interview skill**.
