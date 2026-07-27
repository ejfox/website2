# Scripts Directory

Scripts for content processing, predictions, media capture, data exports, and
site maintenance. Most are wired to `yarn` commands (see `package.json`); a few
are run directly with `node`/`bash`.

Organized into three buckets by *when they run*:

- **`build/`** — runs on **every deploy** (CI: `yarn blog:process` + the `prebuild` hook). Touch with care.
- **`meta/`** — audits, linters, and reports you run **by hand**. Never part of a build.
- **`author/`** — interactive tools to **make and ship** content (predictions, screenshots, webmentions, page-takeovers).

Shared infrastructure lives at the root: `config.mjs`, `plugins/`, `utils/`,
plus the already-coherent `blog/` (Obsidian flow) and `og-image/` folders.

## Quick Reference

```bash
# Content (build/ + blog/)
yarn blog                  # import + safety lint + process (the full local flow)
yarn blog:import           # import content from Obsidian (DRY_RUN=true to preview)
yarn blog:process          # markdown → structured JSON
yarn blog:check-links      # process + check external link health (slow, network)
yarn blog:dead-links       # audit internal/wikilink rot (no network)  [meta/]
yarn blog:fix-links        # process + auto-fix broken links via archive.org (slowest)
yarn blog:watch            # rebuild on content change (run alongside `yarn dev`)
yarn blog:publish          # import → process → commit → push

# Predictions (author/ + meta/)
yarn predict               # create a cryptographic prediction (PGP)      [author/]
yarn calibrate             # Brier score + calibration curve              [meta/]

# Make / ship content (author/)
yarn capture               # screenshot toolkit for /projects (own headless Chrome)
yarn shoot                 # screenshot forcing-function queue
yarn crown <slug>          # scaffold a Vue page-takeover for a post
yarn webmention            # send webmentions (--dry, --all variants)
yarn blog:mirror-atproto   # mirror posts to the AT Protocol (Bluesky)

# Data exports — build/ (also run automatically in `prebuild`)
yarn github:export         # repos: READMEs, languages, file trees
yarn github:networks       # per-repo code-network graphs
yarn goodreads:fetch       # reading stats from Goodreads RSS

# Audits / linters (meta/)
yarn gear:lint             # schema-driven gear.csv linter (--fix to autofix)
yarn lint:safety           # catch PII/exposure risks in blog frontmatter

# Deploy
yarn deploy                # git push origin main → GH Actions builds + deploys (~3 min)
yarn build:prod            # local production build (NITRO_PRESET=node-server)
```

## Directory Structure

```
scripts/
├── build/            # runs on EVERY deploy — handle with care
│   ├── processMarkdown.mjs      # the content pipeline (markdown → JSON)
│   ├── generate-changelog.mjs   # git log → data/changelog.json (prebuild)
│   ├── copy-blogroll.mjs        # newsboat URLs → data/blogroll.urls (prebuild)
│   ├── export-github-repos.mjs  # READMEs, languages, file trees (prebuild)
│   ├── export-github-networks.mjs  # per-repo call graphs (prebuild)
│   └── fetch-goodreads.mjs      # reading stats from RSS (prebuild)
│
├── meta/             # run BY HAND — audits, linters, reports
│   ├── check-internal-links.mjs # standalone wikilink-rot audit
│   ├── calibration-analysis.mjs # prediction Brier score + calibration
│   ├── lint-gear.mjs            # data/gear.csv schema linter
│   ├── lint-frontmatter-safety.mjs # PII/exposure frontmatter linter
│   ├── content-report.mjs       # content health report card (HTML dashboard)
│   ├── generate-alt-text.mjs    # LLM alt-text generation for images
│   ├── sync-alt-to-cloudinary.mjs  # push alt text → Cloudinary metadata
│   ├── hydrate-cloudinary-cache.mjs # dims/colors → cloudinary-image-cache.json
│   └── gen-gear-annex.mjs       # derive gear checklists into the vault
│
├── author/           # interactive tools to make & ship content
│   ├── predict-pro.mjs          # cryptographic predictions (yarn predict)
│   ├── crown.mjs                # scaffold a Vue page-takeover
│   ├── sign-post.sh             # GPG-sign a blog post
│   ├── capture.mjs              # headless-Chrome screenshot toolkit (:9333)
│   ├── shoot-queue.mjs          # screenshot forcing-function queue
│   ├── send-webmentions.mjs     # send outbound webmentions
│   ├── mirror-to-atproto.mjs    # mirror posts to Bluesky/AT-Proto
│   ├── buildHandDrawn.mjs       # build hand-drawn sprite kit from master.svg
│   ├── export-github-commits.mjs   # commit-contribution export (synthetic SHAs)
│   ├── markdownToHtml.mjs       # standalone MD→HTML (imported)
│   └── preview-convert.mjs      # CLI wrapper over markdownToHtml (ext. preview server)
│
├── blog/             # Obsidian flow: import, publish, watch, create-prediction
├── plugins/          # remark/rehype plugins for markdown processing
├── utils/            # shared helpers: helpers, stats, backup, internal-links
├── og-image/         # OG-image generation pipeline
└── config.mjs        # centralized configuration (dirs, Cloudinary, globs)
```

## Core Scripts

### `build/processMarkdown.mjs` — content pipeline

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

### `blog/import.mjs` — Obsidian import

Copies markdown from the Obsidian vault into `content/blog/`, validating
frontmatter and skipping unchanged files. `yarn blog:import`
(`DRY_RUN=true` to preview, or `yarn blog:preview`).

### `blog/watch.sh` / `blog/publish.sh`

`watch.sh` re-runs the processor on content change (run beside `yarn dev`).
`publish.sh` runs the full import → process → commit → push flow.

### `author/predict-pro.mjs` — cryptographic predictions (`yarn predict`)

Interactive tool to create tamper-proof, timestamped forecasts. Validates
statement clarity and confidence (5–95%), SHA-256-hashes the prediction, writes
`content/predictions/YYYY-MM-DD-slug.md`, auto-commits, and optionally GPG-signs.
`blog/create-prediction.mjs` (`yarn create-prediction`) is the older
non-interactive variant.

### `meta/calibration-analysis.mjs` — accuracy tracking (`yarn calibrate`)

Reads resolved predictions, computes Brier score, and plots calibration curves
(are your 70% calls right ~70% of the time?) bucketed by confidence.

## Content Type Detection Rules

### Week Notes

A post is a week note if ANY of these are true:

1. Type is `weekNote`
2. Slug starts with `week-notes/`
3. Slug matches the `YYYY-WW` pattern (e.g. `2024-45`)

Supported formats:

- Modern: `week-notes/2024-45`
- Legacy: `2024-45` (at root level)
- Type-based: any post with `type: 'weekNote'`

### Special Sections

Filtered out of main blog listings:

- `reading/` — book notes and reading logs
- `projects/` — project documentation
- `robots/` — robot-related content
- `drafts/` — draft posts
- `study-notes/` — study and learning notes
- `prompts/` — AI prompts and templates

### System Files

Always excluded:

- Index files (`slug === 'index'`)
- System files (slug starts with `!` or `_`)

### Visibility Rules

- `hidden: true` → hidden everywhere
- In `drafts/` → hidden by default unless `share: true`
- In `robots/` → hidden by default unless `share: true`
- Week notes → never auto-hidden; respect `hidden: true` from frontmatter
- Other posts → respect `hidden: true` from frontmatter

## Plugins (`plugins/`)

Remark/rehype plugins used by the processor — wikilink/Obsidian support, link &
image enhancement, TOC extraction, gear cards, prediction refs, ai2html embeds,
mermaid, alt-text generation. See `plugins/index.mjs` for the wired set.

## Utils (`utils/`)

- `helpers.mjs` — general helpers
- `stats.mjs` — processing statistics
- `backup.mjs` — backup functionality
- `internal-links.mjs` — wikilink→route resolution + dead-link classification

## Adding a script

1. Decide the bucket: `build/` (runs every deploy), `meta/` (run by hand), or
   `author/` (make/ship content). Plugins go in `plugins/`, shared code in
   `utils/`, blog flows in `blog/`.
2. Scripts in a subfolder reach shared code via `../config.mjs`, `../utils/…`,
   `../plugins/…`, and repo-root paths via `__dirname, '..', '..'`.
3. Add an npm script to `package.json` if it should be a `yarn` command.
4. Follow conventions: `#!/usr/bin/env node` shebang, existing output/
   error-handling patterns.
5. Document it in the Directory Structure tree above.
