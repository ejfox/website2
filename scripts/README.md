# Scripts Directory

Scripts for content processing, predictions, media capture, data exports, and
site maintenance. Most are wired to `yarn` commands (see `package.json`); the
rest are run directly with `node`/`bash`, by CI, or imported by other code.
Every file opens with an `@file` / `@description` header saying how it's
invoked and what it touches. Read that before running anything: several
scripts commit, push, post to the network or write into the Obsidian vault.

Buckets, by *when they run*:

- **`build/`**: runs on **every deploy** (CI: `yarn blog:process` + the `prebuild` hook), plus the by-hand atlas/ride data builders. Touch with care.
- **`meta/`**: audits, linters, reports and guards. Mostly by hand; a few are also wired into git hooks and CI (see below).
- **`author/`**: tools to **make and ship** content (predictions, screenshots, webmentions, page-takeovers, sealed links).
- **`blog/`**: sealed-post import and the old prediction CLI.
- **`qa/`**: screenshot-based layout review and PR evaluation (Playwright).
- **`og-image/`**: the generative OG-image pipeline.
- **`resume/`**: builds `public/resume.pdf` from `public/resume.json`.
- **`dev/`**: dev-server helpers imported by `nuxt.config.ts`.

Shared infrastructure lives at the root: `config.mjs`, `plugins/`, `utils/`.

Vault→repo publishing is **not** a script any more. `yarn blog:import`,
`blog:watch` and `blog:publish` were removed 2026-09-26; the Dispatch app
does it now (see `CLAUDE.md` and `content/blog/projects/website-dispatch.md`).

## Quick Reference

```bash
# Content (build/)
yarn blog                  # safety lint + process + sealed check (the full local flow)
yarn blog:process          # markdown → structured JSON
yarn blog:check-links      # process + check external link health (slow, network)
yarn blog:fix-links        # process + rewrite dead external links to archive.org (slowest)
yarn blog:dead-links       # audit internal/wikilink rot, no network        [meta/]
yarn rides:process         # GPX → JSON for motorcycle ride pages
yarn atlas:fetch           # Valley Atlas point layers from OSM Overpass (network)
yarn atlas:basemap         # cut + upload the atlas basemap to R2 (needs pmtiles, wrangler)
yarn icons:vendor          # vendor link-icon SVGs to data/link-icons.json (network)

# Data exports (build/; the first three also run in `prebuild`)
yarn github:export         # repos: READMEs, languages, file trees (GITHUB_TOKEN)
yarn github:networks       # per-repo code-network graphs
yarn goodreads:fetch       # reading stats from Goodreads RSS

# Predictions
yarn predict               # create / --update / --resolve a prediction; git-commits it  [author/]
yarn create-prediction     # older non-interactive variant                [blog/]
yarn calibrate             # Brier score + calibration curve              [meta/]

# Sealed (link-protected) posts. Design: docs/SEALED-POSTS.md
yarn seal                  # seal:import + blog:process + check:sealed
yarn seal:import           # copy vault private/ → content/blog/private/  [blog/]
yarn seal:links            # reprint every sealed post's capability link  [author/]
yarn check:sealed          # assert nothing about a sealed post leaked    [meta/]

# Make / ship content (author/ + root)
yarn capture               # screenshot toolkit for /projects (scripts/capture.mjs)
yarn shoot                 # screenshot forcing-function queue (currently broken, see tree)
yarn crown <slug>          # turn a post's body into a Vue file you edit directly
yarn webmention            # send webmentions (webmention:dry, webmention:all variants)
yarn blog:mirror-atproto   # mirror posts to the AT Protocol (Bluesky)

# Audits / linters / guards (meta/)
yarn lint:safety           # catch PII/exposure risks in blog frontmatter
yarn check:components      # fail on component tags that resolve to nothing
yarn check:urls            # once-public URLs must keep resolving (vs origin/main)
yarn check:urls:seed       # re-pull published URLs from Wayback (network)
yarn check:images          # OCR published images for secrets/financials
yarn gear:lint             # schema-driven gear.csv linter (gear:fix to autofix)
yarn images:sync-ocr       # OCR text → Cloudinary context (network; --write to push)
yarn images:unify          # one alt/caption/description model across Cloudinary + repo cache
yarn meta:frontmatter-sync # read-only vault vs repo frontmatter drift report
yarn smoke                 # smoke-test the live site (+ headless browser pass)

# QA (qa/) and resume
yarn qa:layout             # screenshots + measured layout checks (Playwright)
yarn resume:build          # public/resume.json → public/resume.pdf

# Deploy
yarn deploy                # git push origin main, then watch that commit's deploy run
yarn build:prod            # local production build (NITRO_PRESET=node-server)
```

### Wired into hooks and CI

- `.githooks/pre-commit`: `meta/check-sealed.mjs --staged`, `meta/check-urls.mjs --staged`
- `lint.yml`: `yarn check:components`, `meta/check-urls.mjs`
- `guard-sealed.yml`: `meta/check-sealed.mjs`, `meta/lint-frontmatter-safety.mjs`
- `deploy.yml`: `yarn lint:safety`, `yarn check:sealed`, `yarn check:images`
  (a deploy gate), `yarn blog:process`, `build/generate-changelog.mjs`,
  `meta/smoke-prod.mjs` (no `--browser` on the runner)
- `preview.yml`: `yarn blog:process`
- `send-webmentions.yml`: `author/send-webmentions.mjs`
- `mirror-atproto.yml`: `author/mirror-to-atproto.mjs --live`; `author/prune-atproto-orphans.mjs` on manual dispatch only

## Directory Structure

```
scripts/
├── README.md
├── config.mjs                  # centralized configuration (dirs, Cloudinary, globs)
├── capture.mjs                 # screenshot/record/upload toolkit for /projects (yarn capture, Chrome on :9333;
│                               #   docs: author/capture.README.md, whose paths say author/capture.mjs: wrong)
│
├── build/            # runs on EVERY deploy, plus by-hand data builders
│   ├── processMarkdown.mjs        # the content pipeline (markdown → JSON)
│   ├── sealKeyring.mjs            # local keyring + seal step for sealed posts (imported)
│   ├── generate-changelog.mjs     # git log → data/changelog.json (prebuild)
│   ├── copy-blogroll.mjs          # newsboat URLs → data/blogroll.urls (prebuild)
│   ├── export-github-repos.mjs    # READMEs, languages, file trees (prebuild, skipped in CI)
│   ├── export-github-networks.mjs # per-repo call graphs (prebuild, skipped in CI)
│   ├── fetch-goodreads.mjs        # reading stats from RSS (prebuild)
│   ├── vendor-link-icons.mjs      # link-icon SVGs → data/link-icons.json (yarn icons:vendor)
│   ├── process-rides.mjs          # GPX → ride JSON (yarn rides:process)
│   ├── ride-basemap.mjs           # per-ride vector basemap from Overpass (imported by process-rides)
│   ├── fetch-atlas-places.mjs     # atlas point layers from Overpass (yarn atlas:fetch)
│   ├── atlas-basemap.sh           # atlas basemap → R2 (yarn atlas:basemap)
│   ├── atlas-coverage.mjs         # repeater line-of-sight coverage (node, by hand)
│   ├── atlas-live-stations.mjs    # Metro-North GTFS → live-stations.json (node, by hand)
│   ├── atlas-notes.mjs            # notes layer + story.json check (node, by hand)
│   └── atlas-records.mjs          # FOIL records layer, geocodes (node, by hand)
│
├── meta/             # audits, linters, reports, guards
│   ├── calibration-analysis.mjs   # prediction Brier score + calibration (yarn calibrate)
│   ├── check-component-tags.mjs   # unresolved component tags (yarn check:components, lint.yml)
│   ├── check-image-pii.mjs        # OCR published images for secrets/financials (yarn check:images, deploy gate)
│   ├── check-internal-links.mjs   # standalone wikilink-rot audit (yarn blog:dead-links)
│   ├── check-sealed.mjs           # sealed-post leak guard (yarn check:sealed, pre-commit, CI)
│   ├── check-urls.mjs             # public URLs keep resolving (yarn check:urls, pre-commit, CI)
│   ├── seed-published-urls.mjs    # Wayback → data/published-urls.json (yarn check:urls:seed)
│   ├── content-report.mjs         # offline post report card → data/content-report.{json,html}; opens it unless --no-open (node)
│   ├── frontmatter-sync-report.mjs # vault vs repo drift (yarn meta:frontmatter-sync)
│   ├── vault-repo-merge.mjs       # vault vs repo merge; dry run, --apply WRITES BOTH vault and repo (node)
│   ├── gen-gear-annex.mjs         # gear.csv → trip checklists, WRITES INTO THE VAULT (node; GEAR_ANNEX_OUT)
│   ├── generate-alt-text.mjs      # vision-model alt text for junk/empty alts; paid API, --write to apply (node)
│   ├── hydrate-cloudinary-cache.mjs # dims/colors via public fl_getinfo → data/cloudinary-image-cache.json (node)
│   ├── sync-ocr-to-cloudinary.mjs # OCR text → Cloudinary context; --write pushes (yarn images:sync-ocr)
│   ├── unify-cloudinary-text.mjs  # one alt/caption/description per image; --write, OpenRouter (yarn images:unify)
│   ├── lint-frontmatter-safety.mjs # PII/exposure frontmatter linter (yarn lint:safety, CI)
│   ├── lint-gear.mjs              # data/gear.csv schema linter (yarn gear:lint / gear:fix)
│   ├── smoke-prod.mjs             # live-site smoke test (yarn smoke, deploy.yml)
│   └── __tests__/
│
├── author/           # tools to make & ship content
│   ├── predict-pro.mjs            # create/update/resolve predictions; runs git commit (yarn predict)
│   ├── crown.mjs                  # post body → content/blog/<slug>.vue, trims .md to frontmatter (yarn crown)
│   ├── shoot-queue.mjs            # screenshot queue → Cloudinary + edits project .md (yarn shoot; BROKEN: spawns author/capture.mjs)
│   ├── capture.README.md          # docs for scripts/capture.mjs
│   ├── send-webmentions.mjs       # outbound webmentions to third-party sites (yarn webmention, CI after deploy)
│   ├── mirror-to-atproto.mjs      # mirror posts to Bluesky; dry run unless --live (yarn blog:mirror-atproto, CI --live)
│   ├── prune-atproto-orphans.mjs  # deletes non-TID AT-Proto records with --live (manual mirror-atproto.yml dispatch)
│   ├── seal-links.mjs             # print sealed capability links (yarn seal:links)
│   ├── buildHandDrawn.mjs         # build hand-drawn sprite kit (node)
│   ├── export-github-commits.mjs  # gh GraphQL → data/github-commits.json (node; network)
│   ├── markdownToHtml.mjs         # standalone MD→HTML on the site pipeline (imported)
│   └── preview-convert.mjs        # CLI over markdownToHtml (Dispatch preview server)
│
├── blog/
│   ├── import-sealed.mjs          # vault private/ → content/blog/private/ (yarn seal:import)
│   └── create-prediction.mjs      # older prediction CLI, writes content/predictions/<year>/ (yarn create-prediction)
│
├── qa/
│   ├── layout-review.mjs          # layout screenshots + checks (yarn qa:layout)
│   └── pr-eval.mjs                # before/after page for a batch of PRs (BEFORE=… AFTER=… node …; uses gh)
│
├── og-image/         # generative OG images: node scripts/og-image/index.mjs --slug <slug> [--pick N] [--upload]
│   ├── index.mjs                  # CLI entry; previews → data/og-previews/, --upload → Cloudinary og/<slug>; Dispatch calls it too
│   ├── extract.mjs, layout.mjs, render.mjs   # content → card layout → canvas
│   └── dither.mjs, font.mjs, godrays.mjs, palette.mjs, project.mjs, seed.mjs
│
├── resume/
│   └── build-resume.mjs           # resume.json → resume.pdf via headless Chrome (yarn resume:build)
│
├── dev/
│   └── content-watch.mjs          # yarn dev: reprocess edited .md + HMR the open tab (imported by nuxt.config.ts)
│
├── plugins/          # remark/rehype plugins (see plugins/index.mjs)
└── utils/            # shared helpers: helpers, stats, backup, brier,
                      # internal-links, url-stability, vue-body
```

## Core Scripts

### `build/processMarkdown.mjs`: content pipeline

Converts raw markdown into the structured JSON Nuxt consumes.

- Reads `content/blog/`, parses frontmatter, extracts TOC, counts
  words/images/links/code, renders HTML with syntax highlighting
- Writes individual JSON files to `content/processed/` plus the
  `manifest-lite.json` master index
- Always extracts external links to `data/external_links_final.csv`
- Always audits internal/wikilink rot → `data/internal-linkrot-report.json`
- With `CHECK_LINKS=true`: HTTP-checks external links → `data/linkrot-report.json`
- With `AUTO_FIX_LINKS=true`: rewrites dead external URLs to archive.org versions
  in the source markdown (annotates `*[archived YYYY-MM-DD]*`; review `git diff`)

Run via `yarn blog:process` / `blog:check-links` / `blog:fix-links`.

### `author/predict-pro.mjs`: predictions (`yarn predict`)

Interactive CLI. Creates `content/predictions/YYYY-MM-DD-slug.md`, stores a
SHA-256 `hash` in its frontmatter and `git commit`s it; `--update <file>` logs
a confidence change and `--resolve <file>` records the outcome, each as its own
commit. The git commit is the only checkable proof: the stored hashes don't
reproduce and nothing is PGP-signed (see `CLAUDE.md` → Predictions).
`blog/create-prediction.mjs` (`yarn create-prediction`) is the older
non-interactive variant.

### `meta/calibration-analysis.mjs`: accuracy tracking (`yarn calibrate`)

Reads resolved predictions, computes Brier score, and plots calibration curves
(are your 70% calls right ~70% of the time?) bucketed by confidence. Both are
computed twice: **as signed** (the confidence each prediction was published
with, i.e. the first update's `confidenceBefore`; "signed" is the code's label,
not a signature) and
**as updated** (the last logged change, the current `confidence`). Math lives in
`scripts/utils/brier.mjs`; writes `data/calibration-analysis.json`, which
`/api/calibration` serves as-is. Re-run and commit it after resolving a
prediction.

## Content visibility

Which posts are listed, hidden or 404'd is decided outside `scripts/`:
`utils/postFilters.ts` (`isScheduled()` and friends),
`composables/useProcessedMarkdown.ts` (listing rules, incl. `share: true` for
`drafts/` and `robots/`) and `server/api/posts/[...slug].ts`. The script side:
`processMarkdown.mjs` skips files starting with `!`, writes no JSON for drafts,
and strips title/dek/tags/toc from hidden, unlisted and password posts in
`manifest-lite.json`. `scripts/utils/helpers.mjs` `getPostType()` maps folders to
types and `generateRobotsMetaContent()` noindexes `reading/`, `projects/`,
`robots/`, `study-notes/` and `prompts/`.

## Adding a script

1. Pick the bucket: `build/` (runs every deploy), `meta/` (audit/guard),
   `author/` (make/ship content). Plugins go in `plugins/`, shared code in
   `utils/`.
2. Scripts in a subfolder reach shared code via `../config.mjs`, `../utils/…`,
   `../plugins/…`, and repo-root paths via `__dirname, '..', '..'`.
3. Add an npm script to `package.json` if it should be a `yarn` command.
4. `#!/usr/bin/env node` shebang, then an `@file` / `@description` header per
   `docs/CODE-GUIDE.md`.
5. Add it to the Directory Structure tree above.
