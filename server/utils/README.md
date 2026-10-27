# Non-API server code

Everything under `server/` that isn't `server/api/`. One line per file; the
file's own header has the detail. Files in `server/utils/` are Nitro
auto-imports, so a consumer may call them without an `import` line (grep the
function name, not just the path).

## server/middleware/ (runs on every request, in filename order)

| file | purpose |
|---|---|
| `blog-projects-redirect.ts` | 301 `/blog/projects/<slug>` → `/projects/<slug>` |
| `blog-reading-redirect.ts` | 301 `/blog/reading/<slug>` → `/reading/<slug>`, plus one legacy inbound link |
| `json-twin.ts` | answers every `<page>.json` with that page's data, via the hardened API routes |
| `legacy-redirect.ts` | 301 dead/mangled `/blog` + `/projects` URLs (Cloudinary srcset fragments, wrong year/folder) |
| `markdown-twin.ts` | `/blog/<year>/<slug>.md`, a Markdown copy of a public post |
| `week-notes-gone.ts` | 410 Gone for every retired week-notes URL |

## server/plugins/

| file | purpose |
|---|---|
| `no-cache-errors.ts` | any response >= 400 leaves as `no-store`, so the edge never caches an error |

## server/routes/ (non-`/api` URLs)

| file | purpose |
|---|---|
| `.well-known/site.standard.publication.get.ts` | AT-URI of the Standard.site publication record |
| `.well-known/webfinger.get.ts` | WebFinger JRD pointing at the Mastodon account |
| `archive.epub.ts` | whole blog as an EPUB with halftoned images |
| `photos.epub.ts` | photo blog as an EPUB with halftoned images |
| `rss.xml.ts` | main blog RSS (full text) |
| `feed.json.ts` | JSON Feed twin of `rss.xml` |
| `dispatch-rss.xml.ts` | RSS of public Dispatch pieces |
| `scraps-rss.xml.ts` | RSS of the shared link log (reads `/api/scraps`) |
| `robots-rss.xml.ts` | RSS of `robots/` posts |
| `gists-rss.xml.ts` | RSS of public GitHub gists, disk-cached for outages |
| `sitemap.xml.ts` | XML sitemap |
| `tags.json.ts` | tag vocabulary in pyramid order (see its header: may be shadowed by `public/tags.json`) |
| `openapi.json.ts` | OpenAPI spec generated from `utils/apiCatalog.ts` |
| `go/[slug].get.ts` | sponsor link → Umami tracked link |
| `via/[source].get.ts` | profile-link attribution redirect (UTM, open-redirect-guarded) |
| `from-youtube/[videoId].get.ts` | YouTube attribution redirect (UTM, open-redirect-guarded) |

## server/utils/

| file | purpose | used by |
|---|---|---|
| `atlasPrivate.ts` | cookie gate for private Valley Atlas layers | `api/atlas/{unlock,lock}`, `api/atlas/private/*` |
| `decodeEntities.ts` | decode HTML entities in scraped text | `api/og`, `api/mastodon`, `feedHtml.ts`, `routes/feed.json.ts` |
| `dispatch.ts` | load + gate + render Dispatch pieces | `api/dispatch*`, `routes/dispatch-rss.xml.ts`, `routes/sitemap.xml.ts` |
| `epub.ts` | minimal EPUB 3 writer | `routes/*.epub.ts`, `epubImages.ts` (types) |
| `epubCache.ts` | stale-while-revalidate for the EPUBs | `routes/*.epub.ts` |
| `epubImages.ts` | swap chapter `<img>`s for embedded halftones | `routes/archive.epub.ts` |
| `feedHtml.ts` | post HTML → feed-reader HTML, excerpt, ETag/304 | `routes/rss.xml.ts`, `routes/feed.json.ts` |
| `fetch.ts` | fetch with timeout; `fetchJSON` returns null on failure | `smallweb.ts`, `api/atlas/{live,remediation}` |
| `flashcards.ts` | parse/load flashcard CSV decks | `api/flashcards*` |
| `gear-data.ts` | load `data/gear.csv` with slugs | `api/gear`, `api/gear/[slug]` (auto-import) |
| `halftone.ts` | 1-bit line-halftone PNGs + disk cache | `epubImages.ts`, `epubCache.ts`, `routes/photos.epub.ts` |
| `legacyRedirect.ts` | pure resolvers for legacy URLs | `middleware/legacy-redirect.ts`, `scripts/meta/check-urls.mjs` |
| `manifest.ts` | the one reader of `manifest-lite.json`, plus `isListable` | middleware, sitemap, robots-rss, several `api/` routes |
| `markdownTwin.ts` | processed post → Markdown, and its visibility gate | `middleware/markdown-twin.ts` |
| `notConfigured.ts` | quiet "credential not set" errors | vendor stats handlers, `api/stats` |
| `oryx.ts` | fetch + normalise a ZSA Oryx keymap | `api/keymap`; types in `pages/keymap.vue`, `KeymapBoard.vue` |
| `readingKindle.ts` | merge Kindle metadata into reading notes | `api/reading*`, `api/agent/timeline`, `api/temporal-context` |
| `publicFetch.ts` | GET a page from a public http(s) host only (checked at DNS lookup, every redirect hop) | `api/og` |
| `rateLimit.ts` | in-memory fixed-window limiter + `clientIp()` | `api/suggest` |
| `readmeUrls.ts` | absolutise README links for `/github/<repo>` | `api/repos/[slug]` (auto-import) |
| `serverEnv.ts` | read a secret from runtimeConfig or `process.env` | most credentialed `api/` routes, `atlasPrivate.ts`, `routes/gists-rss.xml.ts` |
| `sitemapEntries.ts` | pure, tested sitemap builders + privacy filter | `routes/sitemap.xml.ts` |
| `smallweb.ts` | fetch JSON from `<app>.tools.ejfox.com` | `api/atlas/*` |
| `statsHorizons.ts` | compose `/api/stats` into now/today/week/year/ever | `api/stats` |
| `text-processing.ts` | `stripHtml`, `tokenize` | `api/search`, `api/suggest`, `api/mastodon` |
| `xml.ts` | XML escaping, CDATA, invalid-char stripping | the hand-rolled feeds, `sitemapEntries.ts` |

Tests for these live in `server/utils/__tests__/`.
