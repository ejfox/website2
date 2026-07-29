# data/

Runtime + build data. **Not a junk drawer** — every file is one of four kinds.
Before adding a file here, decide which kind it is; before deleting one, check
the "read by" column (a broken path here is a prod 500 or a broken build).

Files are referenced by hardcoded `data/…` paths in `server/` and `scripts/`,
so **don't move or rename** these without updating every reference.

## source — raw inputs (hand-authored or external exports I control)

These are the truth; nothing regenerates them. Edit by hand or re-export.

| file | what | read by |
|---|---|---|
| `gear.csv` | gear inventory (hand-edited) | `/api/gear-csv`, gear pages, `scripts/meta/lint-gear.mjs` |
| `gear-schema.json` | schema `lint-gear` validates `gear.csv` against | `scripts/meta/lint-gear.mjs` |
| `tweets.json` (15M) | Twitter archive — input to on-this-day | `scripts/build/processMarkdown.mjs` |
| `lastfm-scrobbles.csv` (13M) | scrobble export — input to on-this-day / stats | `processMarkdown.mjs` |
| `colophon.json` | site colophon | `pages/changelog.vue` |
| `updates.json` | updates feed | `pages/updates.vue` |
| `consulting-availability.json` | consulting slots | `/api/consulting-availability` |
| `webmention-moderation.json` | webmention allow/block list | `/api/webmentions` |

## cache — regenerated from external APIs, committed for build resilience

Committed so a build/deploy never depends on a live API or a token. Safe to
delete + regenerate; they'll come back on the next run of the noted command.

| file | regenerate with | read by |
|---|---|---|
| `github-repos/` (21M) + `github-repos-index.json` + `github-repos-list.json` | `yarn github:export` (prebuild) | github pages/API |
| `github-commits.json` | `yarn` prebuild (`export-github-commits`) | stats, contribution graph |
| `cloudinary-image-cache.json` (6.5M) | `scripts/meta/hydrate-cloudinary-cache.mjs` | `processMarkdown` (image dims/colors at build) |
| `blogroll.urls` | `scripts/build/copy-blogroll.mjs` (prebuild) | `/api/blogroll` |
| `changelog.json` *(gitignored)* | `scripts/build/generate-changelog.mjs` (prebuild) | `/api/changelog` |

## generated — build artifacts from processMarkdown + audits

Written by the content pipeline. Some are read at runtime (don't delete those
casually); the audit reports are report-only.

| file | written by | read by |
|---|---|---|
| `on-this-day/` (8.3M) | `processMarkdown` | `/api/on-this-day` (**runtime**) |
| `external_links_final.csv` | `processMarkdown` | `/api/external-links` (**runtime**) |
| `calibration-analysis.json` | `yarn calibrate` | `/api/calibration` (**runtime**) |
| `og-images.json` | `processMarkdown` (self-cache) | `processMarkdown` (optional input) |
| `internal-linkrot-report.json` | `processMarkdown` / `check-internal-links` | report only |
| `linkrot-report.json` | `processMarkdown` w/ `CHECK_LINKS=true` | report only |

## local scratch — gitignored, never committed

Not in git; safe to delete anytime. Listed so they're not a mystery.

| path | what |
|---|---|
| `_tool-cache/` (62M) | cloned `code-network-gen` tool, used by `export-github-networks` |
| `capture-review/` | screenshot staging from the capture/shoot workflow |
| `gear.csv.backup.*` | automated `gear.csv` backups (auto-created on edit) |

---

_Removed 2026-07: `on-this-day-index.json` — a 12M monolithic index superseded
by the per-day `on-this-day/` files; nothing read it. If you see it regenerate,
something is still writing it and should be fixed instead._
