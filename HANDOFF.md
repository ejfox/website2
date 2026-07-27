# Cleanup session handoff

Branch: **`chore/scripts-cleanup`** — 9 commits, **not pushed**, working tree clean.
Base: `main` @ `ce801ff9`. Theme: kill AI-over-engineering / accreted cruft,
bring the site back to human-scale. Everything below is committed + verified
(eslint + `nuxi prepare` where relevant). Nothing is half-done.

## What got done (9 commits, newest first)
- **useStats**: extracted ~600 lines of response types → `types/stats.ts`. Composable is now 64 lines.
- **composables/**: moved 9 non-composables (no reactivity) → `utils/` (useNumberFormat, useDateFormat, useWeightCalculations, useLanguageColors, usePostFilters, useAttribution, useReadingStats, useGearUI, useNavigation). Rewrote 22 import paths. `composables/` now holds only real composables. README moved to `utils/`, ghost `useStatusFormatting` section stripped.
- **data/**: added `data/README.md` manifest (classifies every file source/cache/generated/scratch + who reads it). Killed dead 12M `on-this-day-index.json` (written, read by nothing) + stopped its generation. Gitignored + history-purged an accidental 37M `capture-review/` commit. Deleted 9 stale `gear.csv.backup.*`.
- **nuxt.config.ts**: 519→319 lines. Extracted helpers to `nuxt.helpers.ts`, deleted dead `_getScrapTags`, deduped 12 copy-paste routeRules.
- **error.vue**: replaced 30-line Levenshtein matrix with a one-line token match (same "did you mean" 404).
- **useNumberFormat**: hand-rolled formatters → d3-format; 245-line hand-copied Turbo palette → `quantize(interpolateTurbo, 256)`.
- **root**: deleted dead Docker files (Dockerfile, docker-compose.yml, .dockerignore — retired 2026-05-06), `unlighthouse.config.ts` (orphan), `package-lock.json` (yarn project). Fixed stale doc paths.
- **scripts/**: taxonomized 33 loose scripts → `build/` (runs every deploy) / `meta/` (run by hand) / `author/` (make+ship content). Deleted 7 dead scripts. Moved non-scripts out (SCREENSHOT_TODO→docs/, nginx-preview→.github/, capture.README→author/).

## ⚠️ CRITICAL — the dead-component sweep is UNFINISHED and its list is NOT trustworthy
We were hunting unused Vue components. **Do not act on any earlier "22 dead" list.**
The detection was buggy:
- **Nuxt folder-prefixes nested component auto-import names.** `components/github/CodeNetwork.client.vue` is used as `<GithubCodeNetwork>`, `components/ui/CommandPalette.client.vue` as `<UiCommandPalette>`, `components/stats/StatRow.vue` as `<StatsStatRow>`. A grep for the bare filename MISSES all folder-prefixed usages → false "dead."
- Confirmed false positives already: the entire `github/*` cluster is ALIVE (github pages render them via `Github*` names); also PredictionCard/PredictionRef/GearCardInline/DataTable are used via plugins/dynamic mounts.
- To redo correctly: compute each component's real Nuxt name = `PascalCase(subdir) + Filename` (strip `.client`/`.server`), then grep for that name AND kebab AND explicit path imports, across `pages components layouts plugins app.vue error.vue`, EXCLUDING the kitchen-sink catalog (`pages/kitchen-sink.vue`, `components/dev/StoryRenderer.vue`, `utils/kitchenSinkStories.js` — its `import.meta.glob` references every component and masks real orphans).
- **Only genuinely-suspicious survivor so far:** `components/ui/CommandPalette.client.vue` (`UiCommandPalette`) — the string "CommandPalette" appears nowhere in the repo. Looks like a built-but-never-wired ⌘K palette. **Hand-verify before deleting.**
- Do this in SMALL batches (5 at a time), show EJ what each is, get approval per cut.

## Open threads (not started / EJ's call)
- **`composables/useCrownedPost.ts`** — dormant. Zero pages use it; it's the runtime half of the `crown` feature (`scripts/author/crown.mjs` scaffolds pages that call it). No crowned pages exist. EJ hasn't decided: kill the whole crown feature, or keep (it's a creative page-takeover tool he may want).
- **`eslint.config.mjs`** — ~100-line hand-maintained globals list (lines 15–113). `@nuxt/eslint` (in devDeps, `^1.10.0`) is built to auto-generate these but **is not enabled** (not in nuxt.config modules). Proper fix: enable it, delete the list, run full-repo lint to verify. Real win, needs verification.
- **Types-into-files**: did useStats. Server `api/*.get.ts` files have 5–11 small interfaces each but they're colocated with their one endpoint — left alone on purpose (not bloat). Don't mass-extract.

## Not yet reviewed (EJ wants every root file + then folders, one at a time)
- Root files still unreviewed: `README.md`, `tsconfig.json`, `.prettierrc.json`, `.editorconfig`, `.npmrc`, `.nvmrc`, `.env.example`, `app.vue` (looked — clean), `tailwind.config.js` (looked — clean/intentional), `vitest.config.ts` (looked — clean), `package.json` (cleaned during scripts commit).
- Folders not yet swept: `components/`, `pages/`, `server/`, `utils/` (now bigger after the move), `plugins/`.

## How EJ wants this done (learned the hard way this session)
- **SMALL segments, check in OFTEN.** Do not batch 20 changes or dump giant menus. He got (rightly) alarmed when I lined up 22 deletions at once.
- **Verify before killing.** "Kill unused" YES — but prove it's unused first. Grep-based dead detection is treacherous (see the Nuxt-prefix bug above).
- Bar for keeping something: **"considered and intentional."** Accretion/robot-cruft gets cut; deliberate design (the tailwind token system, the no-DB files-as-database data/ pattern) stays.
- Don't over-deliberate or wishy-washy — make a call and state it. But don't over-reach either.
- **zsh gotchas that wasted time:** unquoted `$var` does NOT word-split (`for f in $VAR` iterates once) — list items literally or use arrays. `grep --include=*.ts` needs the glob QUOTED (`--include='*.ts'`) or zsh expands it and grep errors out silently.

## Next step suggestion
Rebuild the component dead-sweep correctly (folder-prefixed names, exclude kitchen-sink), verify `CommandPalette` by hand first, then bring EJ 5-at-a-time. Then continue folder-by-folder. Delete this file when the branch merges.
