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
| `manifest` | Published-post manifest (filters draft/hidden/unlisted/pw) | many pages | `manifest-lite.json` |
| `projects` | Projects sorted by date | `pages/projects` | manifest + JSON |
| `reading` | Books w/ random highlight | `pages/reading`, `now` | `content/processed/reading` |
| `reading/[slug]` | Single book | `pages/reading`, `now` | reading JSON |
| `scraps` | Shared scraps | `pages/threads` +5 | Supabase (`shared=true`) |
| `scraps/by-tags` | Scraps matching tags | `pages/blog`, `scraps` | Supabase |
| `scraps/tags` | All unique scrap tags | public API | Supabase |
| `search` | TF-IDF full-text search (`?q=&limit=`) | public API | `content/processed` |
| `suggest` | AI tag/summary for a scrap | `bookmarklet-popup` | blog + Supabase + OpenRouter |
| `temporal-context` | Everything around a date | `useTemporalContext` | reading + predictions + Supabase |
| `on-this-day` | Historical context by month/day | `pages/on-this-day` | `data/on-this-day/*.json` |
| `changelog` | Git changelog + stats | `pages/changelog` | `data/changelog.json` |
| `robots/[...slug]` | AI-readable robot notes | `useProcessedMarkdown` | processed + `content/blog/robots` |
| `wiki` | Personal MediaWiki stats | `stats` | archive.ejfox.com API |
| `external-links` | Dedup'd outbound links | `pages/external-links` | `data/external_links_final.csv` |
| `blogroll` | RSS feeds from newsboat config | `pages/following` | `data/blogroll.urls` |
| `webmentions` | Webmentions (moderated) | `Webmentions.vue` | webmention.io + moderation JSON |
| `og` | Open Graph metadata fetch | `ReplyContextItem` +2 | external HTTP (5-min cache) |
| `highlight` (POST) | Server-side Shiki highlighting | `GistPreview.vue` | Shiki |
| `predictions` | All predictions | `pages/now` +6 | `content/predictions/*.md` |
| `predictions/[id]` | One prediction (GET + PATCH write) | `pages/now` +6 | `content/predictions/*.md` |
| `calibration` | Brier scores + accuracy | `useCalibration` | `data/calibration-analysis.json` (EMPTY-CATCH) |
| `words-this-month` | Monthly post/word count | `blog-stats` | manifest (fragile) |
| `changelog` | see above | | |

## Photos & gear

| Route | Purpose | Consumer | Reads |
|---|---|---|---|
| `photos` | Photo-blog images | `pages/photos` | Cloudinary |
| `photo-posts` | Photo-type posts (no body) | `pages/photos` | manifest + JSON |
| `photo-exif` | Photo EXIF | `pages/photos/[id]` | Cloudinary |
| `gear` | All gear items | `pages/gear` +9 | `data/gear.csv` |
| `gear/[slug]` | One gear item | `pages/gear/[slug]` | `data/gear.csv` |
| `gear-csv` | Raw CSV export | `pages/gear` | `data/gear.csv` |
| `gear-posts/[slug]` | Posts tagged w/ a gear item | `pages/gear/[slug]` | manifest (EMPTY-CATCH) |
| `gear-stats` | Pack weight + item count | `stats-lite` (import) | `data/gear.csv` |

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
| `github` | Contributions/commits | `pages/index`, `stats-lite` | `GITHUB_TOKEN` |
| `github-commits` | Pre-cached commits | `pages/stats` | `data/github-commits.json` (fragile) |
| `github-repos-list` | Cached repo list | `pages/github/[slug]` | `data/github-repos-list.json` |
| `github/activity` | Commit heatmap | `pages/github` | `data/github-commits.json` |
| `gists` | Gist list | `pages/gists` | `GITHUB_TOKEN` |
| `gist-stats` | Gist language stats | `stats` (import) | calls `/api/gists` |
| `repos/[slug]` | One repo detail | `pages/github/[slug]` | GitHub |
| `chess` | Chess.com ratings | `stats` (import) | `CHESS_USERNAME` |
| `lastfm` | Scrobbles/top artists | `stats-lite` (import) | `LASTFM_API_KEY` (EMPTY-CATCH) |
| `letterboxd` | Films watched | `stats-lite` (import) | RSS (EMPTY-CATCH) |
| `goodreads` | Books read | `stats` (import) | RSS (EMPTY-CATCH) |
| `discogs` | Vinyl collection | `stats-lite` (import) | `DISCOGS_TOKEN` (EMPTY-CATCH) |
| `duolingo` | Language streak/XP | `stats` (import) | public API |
| `leetcode` | Problems solved | `stats` (import) | LeetCode GraphQL (stale-while-error) |
| `monkeytype` | Typing WPM | `stats` (import) | `MONKEYTYPE_TOKEN` (disk-cached) |
| `rescuetime` | Productivity time | `stats-lite` (import) | `RESCUETIME_TOKEN` |
| `apple-health` | Health metrics | `stats` (import) | `HEALTH_WEBHOOK_SECRET` |
| `blog-stats` | Monthly writing | `stats` (import) | calls `/api/words-this-month` |
| `reach` | Site visitors/pageviews | `stats` (import) | `UMAMI_DATABASE_URL` (Postgres) |
| `website-stats` | Site-wide analytics | `stats-lite` (import) | `UMAMI_DATABASE_URL` (Postgres) |
| `umami/stats` | Per-page views (`?url=`) | public API | `UMAMI_*` → umami.tools.ejfox.com |
| `umami/auth` (POST) | Umami access token | public API | `UMAMI_*` → umami.tools.ejfox.com |
| `weekly-summary` | Per-week aggregate (`?week=`) | Sunday Interview skill | calls 9 other routes |

## Availability, consulting & infra

| Route | Purpose | Consumer | Notes |
|---|---|---|---|
| `cal/available-slots` | Next 3 booking slots | `pages/calendar`, `consulting`, `NextAvailableSlot` | `CAL_COM_API_KEY` |
| `cal/availability` | Quarterly capacity | **none** — superseded, kept | `CAL_COM_API_KEY` |
| `consulting-availability` | Hand-curated availability | `pages/consulting` | `data/consulting-availability.json` |
| `webhooks/calcom` (POST) | Booking funnel events | external (Cal.com) | HMAC-verified; appends `data/calcom-events.jsonl` + `pm2 logs` |
| `agent/meta` | API discovery for AI agents | external | hardcoded schema |
| `agent/timeline` | Chronological feed for AI agents | external | manifest + predictions + reading |
| `healthcheck` | Uptime/health | external (monitor) | pings `/api/manifest` |
| `build-info` | Commit hash / build date | `Footer.vue` | baked at build time |

## External API surface (works, reachable, no on-site caller by design)

These have no page/component calling them, but they're verified working and kept
as public API — hit directly, by a skill, or reserved for a future UI. Allowlisted
in the orphan test with a reason so they don't read as accidental orphans.

- **`search`** — `GET /api/search?q=code&limit=3` returns ranked snippets over
  processed content. No on-site search box wired yet; the API is live.
- **`scraps/tags`** — sorted, deduped scrap tag vocabulary (companion to
  `scraps/by-tags`). Empty locally only because Supabase creds aren't set in dev.
- **`umami/stats` + `umami/auth`** — the HTTP-API analytics path against the live
  `umami.tools.ejfox.com` instance (heartbeat OK). Parallel to the Postgres
  `reach`/`website-stats` path; both are valid, they just read the same data two
  ways. Need `UMAMI_USERNAME/PASSWORD`.
- **`weekly-summary`** — `GET /api/weekly-summary?week=2026-W05` aggregates a
  week across GitHub/RescueTime/health/chess/… for the **Sunday Interview skill**.
