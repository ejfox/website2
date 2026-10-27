# pages/

Every `.vue` file here is a public URL. Nuxt file-based routing:

| file | URL |
|---|---|
| `pages/index.vue` | `/` |
| `pages/tips.vue` | `/tips` |
| `pages/blog/index.vue` | `/blog` |
| `pages/gear/[slug].vue` | `/gear/<slug>` (one segment, `route.params.slug` is a string) |
| `pages/blog/[...slug].vue` | `/blog/<any/depth>` (catch-all, `route.params.slug` is an array) |
| `pages/blog/2024/the-mystery-of-peter-todd.vue` | that exact URL. A static file beats the catch-all |

**Renaming or moving a page file changes a public URL.** Inbound links and
bookmarks 404 with no warning: `yarn check:urls` and the pre-commit hook only
guard post routes built from `content/blog` (`/blog/*`, `/projects/*`,
`/reading/*`), not page files. If you rename a page, add a 301 in
`nuxt.config.ts` `routeRules` (that's where the existing ones live).

How a page renders is set in `nuxt.config.ts` `routeRules`, not in the page:

- **SSR**, the default: rendered per request.
- **live**: SSR with the short `CACHE_DYNAMIC` edge cache. `/`, `/blog`,
  `/projects` (`LIVE_LISTINGS`, so scheduled posts list on time), plus
  `/now`, `/keymap`, `/calendar`, `/stats`.
- **prerendered**: `PRERENDERED_ROUTES`, baked at build, so they're frozen
  until the next deploy. The rules only apply in production builds. Wildcard
  rules (`/blog/**`, `/predictions/**`) only bake the routes something lists:
  blog posts come from `getBlogRoutes()` in `nuxt.helpers.ts`.
- **client-only**: `ssr: false` (`/atlas`, `/kitchen-sink`).
- **hidden**: noindex via an `X-Robots-Tag` routeRule and/or a robots meta in
  the page, and left out of `server/routes/sitemap.xml.ts`.

Each top-level page opens with a header comment (`@file`, `@description`)
saying the same things in more detail. See `docs/CODE-GUIDE.md`.

## Content

| route | file | data | render |
|---|---|---|---|
| `/` | `index.vue` | `useProcessedMarkdown()` (content/blog/index.md + manifest), `/api/github` | live |
| `/blog` | `blog/index.vue` | `useProcessedMarkdown().getAllPosts()` → `/api/manifest` | live |
| `/blog/<year>/<slug>` | `blog/[...slug].vue` | `/api/posts/<slug>` (content/processed JSON), `/api/scraps/by-tags` | prerendered |
| `/blog/2024/the-mystery-of-peter-todd` | `blog/2024/the-mystery-of-peter-todd.vue` | `/api/posts/2024/the-mystery-of-peter-todd` | prerendered; one-off special post, beats the catch-all |
| `/blog/tag/<tag>` | `blog/tag/[...slug].vue` | `useProcessedMarkdown()`, `/api/scraps/by-tags` | SSR (not listed by `getBlogRoutes()`) |
| `/blog/robots`, `/blog/robots/<slug>` | `blog/robots/` | `useProcessedMarkdown()` robot notes | SSR (robots/ is excluded from prerender) |
| `/projects` | `projects/index.vue` | `/api/projects?slim=1`, `/api/availability` | live |
| `/projects/<slug>` | `projects/[slug].vue` | `/api/posts/projects/<slug>`, `/api/apps` | SSR |
| `/reading`, `/reading/<slug>` | `reading/` | `/api/reading`, `/api/reading/<slug>` | SSR |
| `/dispatch`, `/dispatch/<slug>` | `dispatch/` | `/api/dispatch`, `/api/dispatch/<slug>` | SSR |
| `/tag/<tag>` | `tag/[...slug].vue` | `/api/manifest`, `/api/scraps/graph` | SSR |
| `/scraps`, `/scraps/tag/<slug>` | `scraps/` | `/api/scraps` | SSR, long edge cache (`/scraps/**`) |
| `/photos`, `/photos/<id>` | `photos/` | `/api/photos`, `/api/photo-posts`, `/api/photo-exif` | SSR; `<id>` is `layout: false` |
| `/threads` | `threads.vue` | `/api/manifest`, `/api/scraps/graph`, both fetched client-side (d3 canvas graph) | SSR shell |
| `/case-study/nbc-big-board` | `case-study/nbc-big-board.vue` | none (inline copy) | SSR |
| `/predictions`, `/predictions/<slug>` | `predictions/` | `/api/predictions`, `/api/predictions/<slug>`, `useCalibration()` | index prerendered; `<slug>` SSR on request (nothing lists them for the `/predictions/**` rule) |
| `/gear` | `gear/index.vue` | `/api/gear-csv` (data/gear.csv) | prerendered |
| `/gear/<slug>` | `gear/[slug].vue` | `/api/gear/<slug>`, `/api/gear-posts/<slug>` | SSR |
| `/rides`, `/rides/<slug>` | `rides/` | `/api/rides`, `/api/rides-atlas`, `/api/rides/<slug>` | SSR |
| `/hand-drawn` | `hand-drawn.vue` | sprite `public/hand-drawn/sprite.svg`, `assets/hand-drawn/manifest.json`, `/api/manifest` | SSR |
| `/external-links` | `external-links.vue` | `/api/external-links` (data/external_links_final.csv) | SSR |
| `/sitemap` | `sitemap.vue` | `/api/manifest`, `/tags.json`; section links are hand-kept in step with `server/routes/sitemap.xml.ts` | prerendered |
| `/following` | `following.vue` | `/api/blogroll` (data/blogroll.urls) | SSR |
| `/changelog` | `changelog.vue` | data/colophon.json (bundled), `/api/changelog`, `/api/manifest` | prerendered |
| `/updates` | `updates.vue` | data/updates.json (bundled) | SSR |
| `/on-this-day` | `on-this-day.vue` | `/api/on-this-day` (data/on-this-day/MM-DD.json) | prerendered (build day; the client re-picks the date) |

## Stats and now

| route | file | data | render |
|---|---|---|---|
| `/stats` | `stats.vue` | `useStats()` (`/api/stats`, `/api/stats-lite`), `useLiveStats()`, `/api/github-commits` (client, lazy) | live |
| `/now` | `now.vue` | `/api/now` | live |
| `/github`, `/github/<slug>` | `github/` | `/api/github-repos-list`, `/api/github/activity`, `/api/repos/<slug>` | SSR |
| `/gists` | `gists.vue` | `/api/gists` | prerendered (page 1) |
| `/keymap` | `keymap.vue` | `/api/keymap` (Oryx, cached) | live |
| `/apps` | `apps.vue` | `/api/apps` (data/apps.json + App Store lookup) | SSR |

## Work and contact

| route | file | data | render |
|---|---|---|---|
| `/consulting` | `consulting.vue` | `/api/consulting-availability`, `/api/cal/available-slots` (client), Cal.com embed | SSR |
| `/process` | `process.vue` | none (inline copy) | SSR |
| `/calendar` | `calendar.vue` | `/api/cal/available-slots` (client), Cal.com embed via utils/calEmbed.ts | live, `layout: false` |
| `/tips` | `tips.vue` | none (PGP fingerprint inline) | SSR |
| `/verify` | `verify.vue` | none (fingerprint + accounts inline) | SSR |

## Tools

| route | file | data | render |
|---|---|---|---|
| `/bookmarklet` | `bookmarklet.vue` | none; builds the bookmarklet in the browser | SSR, hidden, no-store, `bookmarklet` layout |
| `/bookmarklet-popup` | `bookmarklet-popup.vue` | `/tags.json`, `/api/suggest` (needs `auth`), client-side | SSR shell, hidden, no-store, `bookmarklet` layout |
| `/flashcards`, `/flashcards/study` | `flashcards/` | `/api/flashcards`, `useFlashcards()` | SSR |

## Hidden and dev pages

Not in nav or the sitemap. Anyone with the link can open them.

| route | file | data | render |
|---|---|---|---|
| `/kitchen-sink` | `kitchen-sink.vue` | `import.meta.glob` over components/, stories in utils/kitchenSinkStories.js | client-only, hidden, `layout: false` |
| `/api-docs` | `api-docs.vue` | utils/apiCatalog.ts (bundled; same source as `/openapi.json`) | SSR, hidden, `layout: false` |
| `/ff` | `ff.vue` | Cal.com embed (`ejfox/ff`) | SSR shell, hidden, `layout: false` |
| `/atlas` | `atlas.vue` | `/api/atlas`, `/api/atlas/*` layer routes, data/atlas/*.json | client-only, hidden, `layout: false` |
| `/live` | `live.vue` | data/the-hour.json (bundled) | SSR, hidden until the show is announced |

Non-page routes (`/tags.json`, `/sitemap.xml`, `/openapi.json`, `/via/*`,
`/from-youtube/*`, `/go/*`) live in `server/routes/`, not here.
