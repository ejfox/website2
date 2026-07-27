# public/ — static assets served as-is

Everything here is served verbatim at the site root (`public/foo.png` → `/foo.png`),
so a file can be referenced by a URL that never appears in the codebase — an old
link, a social card, an external tool, a browser convention. **Absence of an
in-repo reference does NOT prove a file is dead.** That's why the "unreferenced"
list below is *retained and documented*, not deleted.

## Data files (read at build/runtime — not dead despite few refs)

| File | What it is | Who reads it |
|---|---|---|
| `tags.json` | Base tag vocabulary (journalist-pyramid seed) | `server/routes/tags.json.ts` reads it as the base, then enriches with usage counts. Also `server/api/suggest.get.ts`. The dynamic `/tags.json` route serves the enriched result. |
| `content-tags.json` | Content-derived tag list | frontend tag tooling |
| `data/flashcards/*.csv` | Flashcard decks | `/api/flashcards*` |
| `data/prediction-commitments.json` | Cryptographic ledger: prediction file hashes + git commit + signed date | No app code reads it — it's **intentionally public** so anyone can independently verify a prediction's provenance (like `resume.json`). Generated alongside the predictions system. |

## Public identity & convention files (referenced by spec, not code)

- `robots.txt`, `site.webmanifest`, `favicon*.*`, `apple-touch-icon*.png`,
  `android-chrome-*.png` — browser/crawler conventions.
- `llms.txt` — the llms.txt convention (an AI-readable site summary).
- `pgp.txt`, `keybase.txt`, `crypto.txt` — identity/verification files, linked
  externally (Keybase, PGP keyservers).
- `resume.json` — public résumé data (phone number is intentionally public, see
  root `CLAUDE.md`). `resume.pdf` — linked from `content/index.md` as
  `ejfox.com/resume.pdf`.
- `og-image.png` — default Open Graph card (used across `usePageSeo`, `app.vue`,
  blog SEO).

## Live asset dirs

- `logos/` — client/press logos on `pages/consulting.vue`.
- `hand-drawn/` — assets for `pages/hand-drawn.vue`.
- `fonts/` — self-hosted webfonts.
- `default-avatar.png` — fallback avatar.

## No in-repo reference found (retained pending external-ref check)

These have **no reference anywhere in the source tree** (checked pages, components,
composables, server, content, scripts, nuxt.config). They may still be used by an
external link or an old design, so they're kept — but flagged here so they're
tracked, not forgotten. Revisit if you're ever hunting for weight to cut:

- `images/service-images_*.png` — old consulting service illustrations (the live
  consulting page now uses `logos/` + a Cloudinary video/image).
- `images/me_full.png` (~1M) — the Footer loads `me_full` from **Cloudinary**, not
  this local copy.
- `images/handdrawn_ceramics_text/` — handdrawn asset set.
- `me.png` — portrait; site meta uses `og-image.png` / Cloudinary instead.
- `og-image-generated-bg.png` — background for an abandoned OG-image generator.
- `fox_logo_white.svg` — white logo variant.
- `favicon-picker/index.html` — a standalone dev tool (favicon chooser); currently
  ships to prod at `/favicon-picker/`.

_Removed 2026-07: `flashcards.txt` — a plain-text API doc that documented the
deleted `flashcards/{random,search,stats}` routes. Superseded by `/openapi.json`
and `/api-docs`._
