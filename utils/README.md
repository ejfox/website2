# utils/

Plain functions and data, no Vue lifecycle. Nuxt auto-imports every export
from the top-level files here, so many callers have no import line: grep the
export name, not the filename. `utils/atlas/` is NOT auto-imported;
`pages/atlas.vue` imports it by path.

Several files are also imported by path from `server/` and `scripts/`, so keep
them free of Nuxt-only imports (noted below). Tests live in `__tests__/`.

There is no `useDateFormat` composable any more: its helpers were folded into
`date.ts` (the `formatTimestamp` / `formatRelativeTime` aliases remain).

| file | what it is | main exports |
|---|---|---|
| `apiCatalog.ts` | data: every API route, for /api-docs and /openapi.json; a server test fails if it drifts from the route files | `apiCatalog`, `apiGroups`, `ApiRoute` |
| `atprotoRkey.mjs` | post → AT-Proto record key/URI; shared by scripts/author/mirror-to-atproto.mjs and the post page (plain .mjs, no aliases) | `rkeyFor`, `atprotoDocUri`, `atprotoDocUrl`, `isMirrorEligible`, `PUBLICATION_URI` |
| `attribution.ts` | older first/last-touch UTM store in localStorage (plugins/attribution.client.ts) | `attribution()` |
| `beliefTimeline.ts` | prediction frontmatter → BeliefTimeline rows | `buildBeliefRows`, `beliefSignedConfidence`, `beliefShortLabel` |
| `calEmbed.ts` | Cal.com inline-embed bootstrap with first-touch params (client only) | `loadCalInline` |
| `calibration.ts` | find a confidence's calibration bucket | `findCalibrationBucket`, `CalibrationBucket` |
| `chess.ts` | rating-diff text/class and the headline time control for /stats | `formatRatingDiff`, `getRatingDiffClass`, `primaryTimeControl` |
| `date.ts` | the single date-fns entry point: re-exports + named formatters | `formatDate`, `formatShortDate`, `formatRelative`, `formatTimeAgo`, `formatPeriodLabel`, … |
| `firstTouch.ts` | first-touch attribution that rides into Cal.com bookings | `rememberFirstTouch`, `readFirstTouch`, `calParams`, `withFirstTouch`, `classifyReferrer` |
| `gearUI.ts` | gear glyphs, priority pips, gear slug (also imported by server/utils/gear-data.ts) | `TYPE_SYMBOLS`, `PRIORITY_PIPS`, `slugifyGear`, `gearUI()` |
| `handDrawn.ts` | hand-drawn sprite loader + inline SVG builder | `ensureHandDrawnSprite`, `createHandDrawnEl`, `findHandDrawnAsset` |
| `jsonTwin.ts` | which sections have a `.json` twin (app.vue alternate link) | `JSON_TWIN_SECTIONS`, `hasJsonTwin` |
| `kitchenSinkStories.js` | mock props for every component on /kitchen-sink | `stories` |
| `languageColors.ts` | fixed colour per programming language | `languageColors()` |
| `navigation.ts` | primary nav items for layouts/default.vue | `navigationItems`, `getPrimaryNav` |
| `notFoundSuggestions.ts` | "Maybe you meant" scoring for error.vue | `suggestForPath`, `tokenize`, `itemPath` |
| `numberFormat.ts` | d3-format number formatters | `formatNumber`, `formatCompact`, `smartFormat`, `formatPercent`, `numberFormat()` |
| `ogDescription.ts` | clean meta/og description from dek or body | `ogDescription` |
| `ogImage.ts` | og:image URL + honest dimensions (Cloudinary 1200×630 crop) | `ogImageFor`, `cloudinaryOgUrl` |
| `visibility.mjs` | THE post-visibility rule: five states (sealed, draft, scheduled, unlisted, public) for every listing, feed, sitemap, page and script (plain JS, no deps) | `visibility`, `isListed`, `isServed`, `isListedBlogPost`, `isScheduled`, `publishTime`, `removedVisibilityKeyProblem` |
| `postSeal.mjs` | sealed-post AES-GCM envelope, shared by the build and the browser | `sealPost`, `unsealPost`, `generateSealKey`, `isSealedSlug`, `capabilityLink` |
| `readingStats.ts` | word/link/heading counts + reading time for a post | `readingStats()` |
| `replayPolicy.ts` | when Umami loads its session-replay recorder | `isFunnelPath`, `deviceAllowsReplay`, `scrollFraction` |
| `rides.ts` | SI → display units for /rides | `rideKm`, `rideMi`, `rideFt`, `rideMph`, `rideDuration` |
| `scrapTitle.ts` | display title for a Pinboard scrap | `scrapDisplayTitle`, `scrapHostname` |
| `statsSummary.ts` | the "This week I've …" HTML sentence on /stats | `buildStatsSummary` |
| `weight.ts` | gear weight conversion + totals from `Weight_oz` | `weightCalculations()` |

## utils/atlas/ (Valley Atlas map layers)

| file | what it draws | data |
|---|---|---|
| `types.ts` | the layer-module contract + `VULPES` colours | — |
| `layers/cameras.ts` | NYSDOT / 511NY traffic cameras | /api/atlas/cameras |
| `layers/coverage.ts` | repeater line-of-sight coverage rasters | public/atlas/coverage (baked) |
| `layers/live.ts` | river gauges, tides, Hudson Line trains, refreshed every minute | /api/atlas/live |
| `layers/news.ts` | two weeks of local headlines per town | /api/atlas/news |
| `layers/notes.ts` | places from EJ's writing (roads, drowned towns, history) | data/atlas/notes-places.json (scripts/build/atlas-notes.mjs) |
| `layers/private.ts` | EJ-only: air traffic, anomaly signals, travels | /api/atlas/private/* |
| `layers/records.ts` | FOIL agencies and facilities | data/atlas/records.json |
| `layers/remediation.ts` | NYS DEC remediation sites | /api/atlas/remediation |
| `layers/revolution.ts` | Revolutionary War battles, forts, routes | /api/atlas/history |
| `layers/ships.ts` | AIS vessel positions on the Hudson, refreshed every minute | /api/atlas/ships |
