# HANDOFF — sealed posts, shipped

**Date:** 2026-09-16 · **Status:** shipped, deployed, in production
**Supersedes:** `HANDOFF-PRIVATE-POSTS-2026-09-14.md` (the design brief — its
checklist is complete; keep it for the archaeology, don't work from it)

Link-protected blog posts on a public repo. Built, reviewed, merged, deployed,
and playtested end to end in a browser.

---

## 1. What shipped

| PR | | |
|---|---|---|
| **#42** | sealed posts + the `unlisted` fix | merged 2026-09-15 19:12 |
| **#43** | safe vault import + importer whitelist fix | merged 2026-09-15 19:32 |

`main` @ `c33d7ea5`. Both deploys green, production verified healthy after each.

Also closed out: **#41** merged (AT-Proto embargo gap), **#35** closed unmerged
(the rejected 692-line design, branch kept for reference).

**Read `docs/SEALED-POSTS.md` first.** It is the real documentation — design,
threat model, honest limits. This file is the debrief: state, landmines, and
what's left.

---

## 2. How to publish one

```
# write it in the Obsidian vault under private/
yarn seal                 # vault → seal → guard; prints the capability link
git add -A && git commit && git push
```

`yarn seal:links` reprints links later without re-sealing (re-sealing under a
new key would break links already sent).

**NOT `yarn blog`.** See §4.1 — that chain will delete ~200 posts.

---

## 3. The two decisions the design brief demanded be made explicitly

Both are written up at length in `SEALED-POSTS.md`; the short form:

1. **The GH Actions runner is not trusted with plaintext, and doesn't need to
   be.** Plaintext is never required to produce a deployable artifact —
   rendering happens where the source already is, CI copies an opaque blob. No
   key exists on the runner or the VPS.
2. **The fragment key replaces the server-side gate rather than reconciling
   with it.** A 256-bit random key has no brute-force surface, so there's no
   rate limiter, no KDF, no unlock endpoint, and nothing the server could be
   made to decrypt. **Cost: sealed posts need JS and are not server-rendered.**

---

## 4. Open items — read before touching anything

### 4.1 ⚠️ `yarn blog:import` is destructive. Unfixed. Needs a decision.

The highest-value thing in this file.

The vault stores posts under `blog/<year>/`. `import.mjs` writes to
`path.join('content/blog', relativePath)`, so `blog/2022/x.md` lands at
`content/blog/blog/2022/x.md` — one level deeper than the 366 files actually
committed at `content/blog/2022/x.md`. The vault has no top-level `reading/`,
so all ~100 book notes get deleted and never rebuilt.

**One run deletes 366 tracked posts and recreates ~169 in the wrong shape.** I
triggered this during setup; recovered with `git checkout -- content/blog/`
(and `content/backup/` holds a copy), but it also wipes **untracked** WIP under
`content/blog/` — there is currently one such file, `week-notes/2026-21.md`.

Deliberately not fixed, because the fix is a content-routing decision that is
EJ's to make:
- **(a)** strip the vault's leading `blog/` on import, so the importer
  reproduces the committed layout; or
- **(b)** move the repo to the nested layout the importer produces, and accept
  a one-time 366-file churn commit.

(a) is almost certainly right, but it is a one-line change with a 366-file blast
radius, so it wants an explicit yes. Separately, the whitelist is only checked
on **directories**, so top-level vault files (`inbox.md`, `CLAUDE.md`,
`Pamara-list.md`) get imported as posts regardless — fix that in the same pass.

Sealed posts sidestep all of it via `yarn seal:import`, which touches one
gitignored directory and nothing else.

### 4.2 `.postkeys.json` is not backed up

Gitignored, mode 0600, one 256-bit key per sealed post. **The only copy besides
links already sent.** Needs to go into 1Password. Losing it doesn't lose a post
(the vault still has the source) but does mean re-sealing under a fresh key and
re-sending every link.

### 4.3 pm2's cwd on the VPS is still unverified

SSH to `100.111.103.120` timed out on every attempt across two days. The design
is deliberately correct either way — the envelope is present in both the git
checkout and `.output/content/` — so this never blocked anything. Confirm when
SSH is back:

```
ssh vps 'pm2 info website2 | grep -i cwd'
```

### 4.4 Open PRs, untouched

- **#40** — atomic extract-verify-swap deploy fix. Ready, never had explicit
  authorization to merge. My `deploy.yml` hunk (safety step, build stage) is
  **disjoint** from #40's (extract/swap stage), so they don't conflict; whoever
  merges second should still confirm both survived.
- **#30** — projects page. Unrelated, unreviewed, open since July.

### 4.5 Pre-existing test failures (not ours)

Two, both from the untracked `server/api/editor/` WIP:
`api-catalog` ("every route file has a catalog entry") and `no-orphan-routes`
("/api/editor/context has a caller"). Confirmed failing on clean `main` before
any of this work started. Either wire up/allowlist that route or delete it.

### 4.6 Minor, pre-existing: the TOC renders H3s, not H2s

`PostTOC` shows sub-headings rather than top-level headings, so a post with
several H2s and no H3s gets a near-empty TOC. Found while playtesting; verified
identical on a normal post, so it is **not** sealing-related. Left alone.

---

## 5. Traps this hit, so the next person doesn't

Every one of these was found by testing, not by reading.

- **A leak check that fails quietly is worse than none.** The emit invariant
  fired correctly and was swallowed by `processAllFiles`'s per-file `catch`,
  which pushes to a stats array and continues. Exit 0, post ships. Fixed by
  flagging the error (`fatalContentError`) and re-raising. If you add another
  guard in that loop, flag it the same way.
- **The invariant must also run on the "nothing changed" path.** A file that
  still decrypts fine can have been hand-edited to add a public field; the
  reuse path waved it straight through.
- **`grep` on this machine is ripgrep, which respects `.gitignore`.** A canary
  sweep with it silently cannot see the very files that matter here. Use
  `/usr/bin/grep` or `find -print0 | xargs -0 grep`.
- **Browser cache will lie to you** during verification. A stale document made
  a fixed bug look unfixed for several rounds. Cache-bust the URL.
- **A same-path fragment change doesn't reload the page**, so `onMounted` never
  re-runs and the key is never read. Only matters for testing; a reader
  clicking a fresh link is fine.
- **`git add -A` in this repo sweeps in gear backups, `data/github-repos/*`,
  and a worktree.** Stage explicitly. Also: `yarn build`'s `prebuild` rewrites
  ~200 `data/github-repos/*.json`, and any `blog:process` run rewrites
  processed JSON for the untracked WIP week-note — revert that churn rather
  than committing it.

---

## 6. What was verified, and how

Don't redo this; extend it if you change the design.

- **Canaries in body, dek, tag AND headings**, against a real
  `NITRO_PRESET=node-server` build served on :3099. Zero hits in `.output`,
  `/api/manifest`, `/api/agent/timeline`, `/tags.json`, `/sitemap.xml`,
  `/rss.xml`, `/content-tags.json`, `/api/search`, `/api/suggest`,
  `/api/photo-posts`, the `.json` twin, or the SSR HTML.
- **CI simulation** — source removed, envelope survived orphan cleanup. This is
  the check that proves the design works on a fresh clone.
- **Real browser**, both dev and production build: correct key renders the post
  and strips the fragment; no key shows the lock; one wrong character fails
  closed with no title and no body.
- **Playtest post** exercising the render paths most likely to break after
  client-side injection: sidenotes (2, correctly in the right margin, not
  colliding), shiki highlighting (21 colour spans), TOC, blockquote, lists.
- **Guard failure modes**, all three: force-added plaintext, a non-envelope-only
  JSON, and a tracked keyring. All fail loudly.
- **70 tests** across `utils/__tests__/` and `scripts/build/__tests__/`.
  Tamper test was flaky on first write (flipping the last base64url char can
  decode to the same bytes) — now flips a decoded byte; 12 consecutive clean
  runs.

---

## 7. Local state as of this handoff

A playtest is still set up and **not committed** — nothing below is in git:

- `vault/private/playtest.md` — the playtest source
- `content/blog/private/playtest.md` — gitignored copy
- `content/processed/private/playtest.json` — untracked envelope
- `.postkeys.json` — gitignored, holds the playtest key
- dev server running on :3006

**Teardown:** delete the vault file, run `yarn seal:import` (prunes the copy),
then remove the envelope and its `.postkeys.json` entry. Orphan cleanup
deliberately leaves sealed envelopes alone, so that last step is manual.

Also uncommitted: five regenerated tracked artifacts (`manifest-lite.json`,
`external_links_final.csv`, `internal-linkrot-report.json`,
`data/on-this-day/05-18.json`, `content-tags.json`). Verified to contain **zero**
playtest traces — the churn is entirely from the untracked WIP week-note being
processed. Revert them; don't commit.

`vault/private/HOW-SEALED-POSTS-WORK.txt` is intentional and should stay. It is
`.txt` on purpose — a `.md` there would become a sealed post.

---

## 8. If you're extending this

- Adding a route that lists posts? Use `isHiddenFromListings()` from
  `utils/postFilters.ts`. It checks both `p.x` and `p.metadata?.x`, which is the
  whole reason it exists — `manifest-lite.json` hoists only `slug, title, date,
  type, hidden, tags, toc, metadata`, so a bare `!p.unlisted` is a permanent
  no-op. That exact bug was live in `/api/agent/timeline`.
- Reading `content/processed/` directly rather than through the manifest? You do
  **not** inherit the manifest's omission of sealed posts. Add an explicit
  guard, as `search` and `suggest` now have.
- Changing the envelope format? Bump `SEAL_VERSION` and add a new entry to the
  dispatch rather than editing v1 — links already in other people's hands must
  keep working.
- Changing the switch folder name? It appears in `isSealedSlug`, `.gitignore`,
  the `compiled` hook in `nuxt.config.ts`, `import-sealed.mjs`, and the
  `suggest` skip-list. The `compiled` hook match is prefix-based on purpose; a
  loose `/private/` substring would also drop the envelope the server serves.
