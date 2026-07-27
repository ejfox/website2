# Codebase cleanup — handoff

Branch: **`chore/scripts-cleanup`** — **15 commits, NOT pushed**, working tree clean.
Base: `main` @ `ce801ff9`. Mission: strip AI-over-engineering + accreted cruft,
bring the site to human-scale, organize folders so names match reality.
Every commit is verified (`npx nuxi prepare` + `eslint` where relevant). Nothing half-done.

## Done this session (15 commits, newest first)
- **utils/numberFormat split** → `colors.ts` (palettes), `chess.ts` (rating/result helpers), `numberFormat.ts` now actually just numbers. Renamed `weightCalculations.ts`→`weight.ts`, `cal.js`→`calEmbed.ts`.
- **utils/date centralized** → one `utils/date.ts` (clean date-fns re-exports + formatters). Deleted `dateUtils.ts` (cringe `*SWOOSH*` barrel) + `useDateFormat.ts`; pulled date funcs out of numberFormat; migrated 13 call sites; dropped 3 dead formatters.
- **utils use-prefix dropped** → 8 non-composable utils renamed (numberFormat, attribution, weight, languageColors, postFilters, readingStats, gearUI, navigation). Only composables are `use`-prefixed now.
- **docs/** → moved 3 personal notes to the Obsidian vault (`agent-vault/reference/` + `inbox/`), lowercased the 3 real docs (`stats-api.md`, `ios-shortcuts.md`, `predictions.md`). Verified `ios-shortcuts.md` is accurate vs the API.
- **composables/** → moved 9 non-composables (no reactivity) to `utils/`; deleted `useCommandPalette` (orphaned). `composables/` now holds only real composables.
- **components/** → deleted 15 unused (~2,600 lines): 8 github viz experiments + 7 orphans. `components/` 83→68.
- **useStats** → extracted ~600 lines of response types to `types/stats.ts` (composable now 64 lines).
- **data/** → `data/README.md` manifest (source/cache/generated/scratch + who reads each); killed dead 12M `on-this-day-index.json`; purged an accidental 37M `capture-review/` commit from history + gitignored it.
- **nuxt.config.ts** → 519→319 lines; helpers → `nuxt.helpers.ts`; deleted dead `_getScrapTags`; deduped 12 routeRules.
- **error.vue** → Levenshtein matrix → one-line token match.
- **useNumberFormat** → hand-rolled formatters → d3-format; 245-line hand-copied Turbo palette → `quantize(interpolateTurbo, 256)`.
- **root** → deleted Dockerfile/docker-compose/.dockerignore (Docker retired), `unlighthouse.config.ts`, `package-lock.json` (yarn project).
- **scripts/** → taxonomized 33 loose scripts → `build/` (every deploy) / `meta/` (by hand) / `author/` (make+ship); deleted 7 dead scripts; moved non-scripts out.

## Folders reviewed & their verdict
- `scripts/` `data/` `docs/` `composables/` `utils/` — **DONE** (organized, honestly named, dead code gone).
- Root files — mostly done (`tailwind.config`, `vitest.config`, `app.vue` reviewed = clean/intentional; `nuxt.config`/`package.json` cleaned).
- **NOT yet reviewed**: `server/` (30+ API routes — biggest remaining surface, likely naming/structure to tidy), `components/` *structure* (dead ones gone, but subfolders never organized), `pages/`, `plugins/`, `layouts/`, `middleware/`, `assets/`, `themes/`, `types/`.

## Open threads (decisions / bigger jobs)
- **`composables/useCrownedPost.ts`** — KEPT. Dead code but the runtime dep of the live `yarn crown` tool (EJ may use it this summer). If crown is ever retired, delete `useCrownedPost` + `scripts/author/crown.mjs` + the `crown` npm script + its eslint global together.
- **eslint.config.mjs globals (~100 lines, hand-maintained)** — this bit us REPEATEDLY: every auto-import change needs a manual globals edit (see the date formatters I had to add). `@nuxt/eslint` (`^1.10.0`, already in devDeps, NOT enabled in nuxt.config modules) is built to auto-generate these. Proper fix: enable the module, delete the list, run full-repo lint. Real win, needs a full lint to verify.
- **`numberFormat()` / `attribution()` etc. wrapper functions** — the surviving composable-ism in utils: a `useX()`-style fn returning a bag of functions. Mildly redundant (callers could just import the named fns). Not urgent; would be ~1 edit per call site to purge.
- **Oversized live files** (EJ said LEAVE for now): `hand-drawn.vue` 1571, `stats.vue` 1196, `blog/[...slug].vue` 1152, `threads.vue` 1084, `consulting.vue` 1082. These need *carving*, not deleting — a later pass.

## How EJ wants this done (learned the hard way)
- **SMALL segments, check in OFTEN.** He got (rightly) alarmed when I queued 22 deletions at once. Bring 5-at-a-time with what each is; get approval per risky cut.
- **Verify before killing.** "Kill unused" YES — but prove it first. Grep-based dead detection is treacherous.
- Bar for keeping: **"considered and intentional."** Robot-cruft/accretion gets cut; deliberate design (tailwind token system, no-DB files-as-database `data/`) stays. Don't manufacture cosmetic churn (we correctly LEFT docs-naming, tailwind config).
- **Names must match reality** — split junk-drawers by what things actually are; drop misleading prefixes; lowercase shouting docs.
- Move personal notes → Obsidian vault at `/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/agent-vault/` (it's its own git repo; leave files untracked for EJ to commit).

## Verification recipe (use every time)
- After any move/rename/delete: `npx nuxi prepare` (auto-import + type resolution + collision check) AND `git diff --name-only | grep -E '\.(ts|vue|mjs)$' | xargs npx eslint`.
- **Dead-component detection**: real Nuxt name = `PascalCase(subdir chain) + Filename` (strip `.client`/`.server`). e.g. `components/github/CodeNetwork.client.vue` → `<GithubCodeNetwork>`. Grep that + kebab + explicit imports across `pages components layouts plugins server middleware app.vue error.vue`, EXCLUDING the kitchen-sink catalog (`pages/kitchen-sink.vue`, `components/dev/StoryRenderer.vue`, `utils/kitchenSinkStories.js`). `components/dev/*` are kitchen-sink infra — look dead but KEEP.
- **Renames can spawn collisions**: `const { x: name } = name()` self-reference (TDZ). Vue `<script setup>` hides some from eslint via auto-import globals — scan manually after renames.

## zsh footguns (cost hours this session)
- Unquoted `$VAR` does NOT word-split (`for f in $LIST` iterates ONCE). List items literally.
- `grep --include=*.ts` — QUOTE the glob (`--include='*.ts'`) or zsh expands it and grep errors silently.
- Paths with `[...]` (e.g. `pages/blog/[...slug].vue`) — QUOTE them or zsh glob-expands.
- BSD sed (macOS) lacks `\b`; use `perl -i -pe` for word-boundary replaces.

## Next step
Refresh context if compacting, then continue folder-by-folder. Suggested next: `server/`
(biggest unreviewed surface). Delete this file when the branch merges.
